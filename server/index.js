require('dotenv').config({ path: '../.env' });
process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';

const express = require('express');
const cors = require('cors');
const { WebSocketServer } = require('ws');
const db = require('./db');

const app = express();
app.use(cors({
  origin: [
    'https://elix-node-digitaltwin.vercel.app',
    'http://localhost:5173'
  ],
  methods: ['GET', 'POST', 'PATCH', 'PUT', 'DELETE'],
  credentials: true
}));
app.use(express.json());

// ── Generate demo SCADA data ──────────────────────
function generateRows() {
  const rows = [];
  for (let i = 0; i < 200; i++) {
    rows.push({
      P1_FT_321: (60 + Math.random() * 20 + (i % 50 === 0 ? 80 : 0)).toFixed(2),
      P1_LT_301: (50 + Math.random() * 15 + (i % 70 === 0 ? 40 : 0)).toFixed(2),
      P1_PIT_01: (5  + Math.random() * 2).toFixed(2),
      P2_FT_321: (55 + Math.random() * 10).toFixed(2),
      P2_LT_321: (45 + Math.random() * 20).toFixed(2),
      P2_FCV01D: (0.5 + Math.random() * 0.3).toFixed(3),
      P2_FCV02D: (0.4 + Math.random() * 0.3).toFixed(3),
      P3_LIT_01: (35 + Math.random() * 25).toFixed(2),
      P3_FIT_01: (20 + Math.random() * 10).toFixed(2),
      ATT_FLAGS:  i % 50 === 0 ? '1' : i % 30 === 0 ? '2' : '0'
    });
  }
  console.log(`✅ Generated ${rows.length} demo rows`);
  return rows;
}

const ROWS = generateRows();

// ── REST API ──────────────────────────────────────
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date() });
});

app.get('/api/readings/:sensorId', async (req, res) => {
  try {
    const data = await db.getReadings(req.params.sensorId,
      parseInt(req.query.limit) || 100);
    res.json(data);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

app.get('/api/alerts', async (req, res) => {
  try {
    const resolved = req.query.resolved === 'true' ? true
                   : req.query.resolved === 'false' ? false : null;
    res.json(await db.getAlerts(resolved));
  } catch (e) { res.status(500).json({ error: e.message }); }
});

app.post('/api/alerts/:alertId/resolve', async (req, res) => {
  try {
    await db.resolveAlert(req.params.alertId);
    res.json({ status: 'resolved' });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

app.post('/api/users/register', async (req, res) => {
  try {
    const user = await db.createUser(req.body);
    res.json(user);
  } catch (e) { res.status(400).json({ error: e.message }); }
});

app.post('/api/users/login', async (req, res) => {
  try {
    const user = await db.findUserByEmail(req.body.email);
    if (!user || user.password_hash !== req.body.passwordHash)
      return res.status(401).json({ error: 'Invalid credentials' });
    await db.updateLastLogin(req.body.email);
    const { password_hash, ...safe } = user;
    res.json(safe);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

app.get('/api/stats', async (req, res) => {
  try {
    res.json({ totalSensors: 9, status: 'operational' });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// ── Start server + WebSocket ──────────────────────
const PORT = process.env.PORT || 3001;
const server = app.listen(PORT, async () => {
  console.log(`🚀 Server running on port ${PORT}`);
  try { await db.testConnection(); }
  catch (e) { console.warn('DB warning:', e.message); }
});

// WebSocket attached to same server
const wss = new WebSocketServer({ server });

wss.on('connection', (ws) => {
  console.log('WS client connected');
  let i = 0;

  const interval = setInterval(() => {
    if (ws.readyState !== ws.OPEN) return;
    if (i >= ROWS.length) i = 0;

    const row = ROWS[i++];
    const isAnomaly = row.ATT_FLAGS !== '0';

    const sensors = [
      { id: 'P1_FT_321', name: 'Flow Transmitter 1',   value: row.P1_FT_321, unit: 'L/min', status: parseFloat(row.P1_FT_321) > 100 ? 'critical' : 'normal' },
      { id: 'P1_LT_301', name: 'Level Transmitter 1',  value: row.P1_LT_301, unit: '%',     status: parseFloat(row.P1_LT_301) > 85  ? 'critical' : 'normal' },
      { id: 'P1_PIT_01', name: 'Pressure Indicator',   value: row.P1_PIT_01, unit: 'bar',   status: parseFloat(row.P1_PIT_01) > 7   ? 'warning'  : 'normal' },
      { id: 'P2_FT_321', name: 'Flow Transmitter 2',   value: row.P2_FT_321, unit: 'L/min', status: 'normal' },
      { id: 'P3_LIT_01', name: 'Level Indicator T3',   value: row.P3_LIT_01, unit: '%',     status: 'normal' },
      { id: 'P3_FIT_01', name: 'Flow Indicator T3',    value: row.P3_FIT_01, unit: 'L/min', status: 'normal' },
    ];

    ws.send(JSON.stringify({
      timestamp: new Date().toISOString(),
      sensors,
      isAnomaly,
      attFlag: row.ATT_FLAGS
    }));

    // Save every 10th reading
    if (i % 10 === 0) {
      sensors.forEach(s => {
        db.insertReading({
          sensorId: s.id, value: s.value,
          unit: s.unit, status: s.status
        }).catch(() => {});
      });
    }

  }, 2000);

  ws.on('close', () => {
    clearInterval(interval);
    console.log('WS client disconnected');
  });

  ws.on('error', () => clearInterval(interval));
});
