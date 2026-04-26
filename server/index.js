require("dotenv").config({ path: "../.env" });
const fs = require("fs");
const path = require("path");
const express = require("express");
const cors = require("cors");
const { parse } = require("csv-parse");
const { WebSocketServer } = require("ws");
const swaggerUi = require("swagger-ui-express");
const swaggerSpec = require("./swagger");
const db = require("./db");

const WS_PORT = 8080;
const API_PORT = 3001;
const CSV_PATH = path.join(__dirname, "data", "scada_data.csv");
const REPLAY_INTERVAL_MS = 2000;
const ROLLING_WINDOW = 20;

const SENSOR_META = {
  P1_FT_321: { name: "Flow Transmitter 1", unit: "L/min" },
  P1_LT_301: { name: "Tank Level 1", unit: "%" },
  P1_PIT_01: { name: "Pressure Indicator 1", unit: "bar" },
  P1_FCV01D: { name: "Flow Control Valve 1", unit: "%" },
  P1_FCV02D: { name: "Flow Control Valve 2", unit: "%" },
  P1_FCV03D: { name: "Flow Control Valve 3", unit: "%" },
  P1_STSP: { name: "Steam Setpoint", unit: "%" },
  P2_FT_321: { name: "Flow Transmitter 2", unit: "L/min" },
  P2_LT_321: { name: "Tank Level 2", unit: "%" },
  P2_FCV01D: { name: "Flow Control Valve 4", unit: "%" },
  P2_FCV02D: { name: "Flow Control Valve 5", unit: "%" },
  P3_LIT_01: { name: "Level Indicator 3", unit: "%" },
  P3_FIT_01: { name: "Flow Indicator 3", unit: "L/min" }
};

const SENSOR_COLUMNS = Object.keys(SENSOR_META);
const rollingHistory = new Map(SENSOR_COLUMNS.map((column) => [column, []]));

const app = express();
app.use(cors());
app.use(express.json());

// Swagger UI at root path
app.get('/', swaggerUi.setup(swaggerSpec, { 
  customCss: '.swagger-ui { max-width: 1200px; margin: 0 auto; }',
  customSiteTitle: 'ElixNode API Documentation',
}));
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));
app.use('/', swaggerUi.serve);

let rows = [];
let datasetLoaded = false;
let datasetError = null;
let readingCount = 0;
let anomalyCount = 0;

function parseCsvFile(filePath) {
  return new Promise((resolve, reject) => {
    if (!fs.existsSync(filePath)) {
      reject(new Error(`CSV file not found: ${filePath}`));
      return;
    }

    const parsedRows = [];
    fs.createReadStream(filePath)
      .pipe(
        parse({
          columns: true,
          skip_empty_lines: true,
          trim: true
        })
      )
      .on("data", (row) => {
        parsedRows.push(row);
      })
      .on("end", () => resolve(parsedRows))
      .on("error", reject);
  });
}

function getRollingAverage(column, value) {
  const history = rollingHistory.get(column) ?? [];
  if (!history.length) {
    return Number(value);
  }

  const sum = history.reduce((acc, current) => acc + current, 0);
  return sum / history.length;
}

function updateRollingHistory(column, value) {
  const history = rollingHistory.get(column) ?? [];
  history.push(value);
  if (history.length > ROLLING_WINDOW) {
    history.shift();
  }
  rollingHistory.set(column, history);
}

function getDeviationStatus(value, average) {
  if (!Number.isFinite(value) || !Number.isFinite(average) || average === 0) {
    return "normal";
  }

  const deviation = Math.abs(value - average) / Math.abs(average);
  if (deviation > 0.4) {
    return "critical";
  }
  if (deviation > 0.2) {
    return "warning";
  }
  return "normal";
}

function mapRowToMessage(row) {
  const sensors = SENSOR_COLUMNS.map((column) => {
    const value = Number(row[column]);
    const average = getRollingAverage(column, value);
    const status = getDeviationStatus(value, average);
    updateRollingHistory(column, value);

    return {
      id: column,
      name: SENSOR_META[column].name,
      value,
      unit: SENSOR_META[column].unit,
      status
    };
  });

  const attFlag = Number(row.ATT_FLAGS ?? 0);
  const isAnomaly = attFlag !== 0;

  return {
    timestamp: row.timestamp || new Date().toISOString(),
    sensors,
    isAnomaly,
    attFlag
  };
}

function getAlertSeverity(triggeredSensors) {
  if (triggeredSensors >= 4) {
    return "CRITICAL";
  }
  if (triggeredSensors >= 3) {
    return "HIGH";
  }
  if (triggeredSensors >= 2) {
    return "MEDIUM";
  }
  return "WARNING";
}

async function persistReadingSnapshot(message) {
  const writes = message.sensors.map((sensor) =>
    db.insertReading({
      sensorId: sensor.id,
      value: sensor.value,
      unit: sensor.unit,
      status: sensor.status,
      anomaly: message.isAnomaly || sensor.status !== "normal",
      anomalyScore: sensor.status === "critical" ? 1 : sensor.status === "warning" ? 0.6 : 0,
      timestamp: message.timestamp
    })
  );

  await Promise.all(writes);
}

async function persistAlertIfNeeded(message) {
  if (!message.isAnomaly) {
    return;
  }

  const deviatingSensors = message.sensors.filter((sensor) => sensor.status !== "normal");
  const severity = getAlertSeverity(deviatingSensors.length);
  const affected = deviatingSensors.length
    ? deviatingSensors.map((sensor) => sensor.name).join(", ")
    : "SCADA attack flag raised";

  await db.insertAlert({
    alertId: `${message.timestamp}-${message.attFlag}`,
    sensorId: deviatingSensors[0]?.id || "ATT_FLAGS",
    severity,
    message: `ATT_FLAGS=${message.attFlag}. Affected sensors: ${affected}`,
    sentToEmail: ""
  });
}

app.get("/api/health", (req, res) => {
  res.json({
    status: "ok",
    datasetLoaded,
    datasetRows: rows.length,
    datasetError,
    timestamp: new Date().toISOString()
  });
});

app.get("/api/readings/:sensorId", async (req, res) => {
  try {
    const limit = Number.parseInt(req.query.limit, 10) || 100;
    const data = await db.getReadings(req.params.sensorId, limit);
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get("/api/alerts", async (req, res) => {
  try {
    const resolved =
      req.query.resolved === "true" ? true : req.query.resolved === "false" ? false : null;
    const alerts = await db.getAlerts(resolved, 200);
    res.json(alerts);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post("/api/alerts/:alertId/resolve", async (req, res) => {
  try {
    await db.resolveAlert(req.params.alertId);
    res.json({ ok: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post("/api/users/register", async (req, res) => {
  try {
    const user = await db.createUser(req.body);
    res.status(201).json(user);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

app.post("/api/users/login", async (req, res) => {
  try {
    const user = await db.findUserByEmail(req.body.email);
    if (!user || user.password_hash !== req.body.passwordHash) {
      return res.status(401).json({ error: "Invalid credentials" });
    }

    await db.updateLastLogin(user.id);
    const { password_hash, ...safeUser } = user;
    return res.json(safeUser);
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
});

app.get("/api/stats", async (req, res) => {
  try {
    const stats = await db.getStats();
    res.json({
      totalReadings: stats.totalReadings,
      totalAlerts: stats.totalAlerts,
      anomalyRate: stats.totalReadings ? Number((stats.totalAlerts / stats.totalReadings).toFixed(4)) : 0
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

const wss = new WebSocketServer({ port: WS_PORT });

wss.on("connection", (socket) => {
  if (!datasetLoaded) {
    socket.send(
      JSON.stringify({
        type: "info",
        message: datasetError ? `Dataset error: ${datasetError}` : "Dataset is still loading"
      })
    );
  }

  let index = 0;
  const interval = setInterval(async () => {
    if (!rows.length) {
      return;
    }

    const row = rows[index % rows.length];
    index += 1;
    readingCount += 1;

    const message = mapRowToMessage(row);
    if (message.isAnomaly) {
      anomalyCount += 1;
    }

    socket.send(JSON.stringify(message));

    if (readingCount % 10 === 0) {
      try {
        await persistReadingSnapshot(message);
      } catch (error) {
        console.error("Failed to persist reading snapshot:", error.message);
      }
    }

    if (message.isAnomaly) {
      try {
        await persistAlertIfNeeded(message);
      } catch (error) {
        console.error("Failed to persist alert:", error.message);
      }
    }
  }, REPLAY_INTERVAL_MS);

  socket.on("close", () => clearInterval(interval));
});

async function start() {
  try {
    rows = await parseCsvFile(CSV_PATH);
    datasetLoaded = true;
    datasetError = null;
    console.log(`Loaded ${rows.length} rows from ${path.basename(CSV_PATH)}`);
  } catch (error) {
    datasetLoaded = false;
    datasetError = error.message;
    console.error("Failed to load CSV:", error.message);
  }

  app.listen(API_PORT, async () => {
    console.log(`API server listening on http://localhost:${API_PORT}`);
    try {
      await db.testConnection();
    } catch (error) {
      console.error("Database connection failed:", error.message);
    }
  });

  console.log(`WebSocket server listening on ws://localhost:${WS_PORT}`);
}

start();
