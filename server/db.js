require("dotenv").config({ path: "../.env" });
process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0";

const { Pool } = require("pg");

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
});

async function testConnection() {
  const res = await pool.query("SELECT NOW()");
  console.log("✅ DB connected:", res.rows[0].now);
}

async function createUser(data) {
  const name = String(data.name || "");
  const email = String(data.email || "");
  const passwordHash = String(data.passwordHash || data.password_hash || "");
  const role = String(data.role || "operator");

  const res = await pool.query(
    `INSERT INTO users (name, email, password_hash, role, created_at)
     VALUES ($1, $2, $3, $4, NOW())
     RETURNING id, name, email, role, created_at`,
    [name, email, passwordHash, role]
  );
  return res.rows[0];
}

async function findUserByEmail(email) {
  const res = await pool.query(
    `SELECT * FROM users WHERE email = $1 LIMIT 1`,
    [String(email)]
  );
  return res.rows[0] || null;
}

async function updateLastLogin(email) {
  await pool.query(
    `UPDATE users SET last_login = NOW() WHERE email = $1`,
    [String(email)]
  );
}

async function insertReading(data) {
  await pool.query(
    `INSERT INTO sensor_readings
      (sensor_id, value, unit, status, anomaly, anomaly_score, timestamp)
     VALUES ($1, $2, $3, $4, $5, $6, $7)`,
    [
      String(data.sensorId),
      parseFloat(data.value) || 0,
      String(data.unit || ""),
      String(data.status || "normal"),
      Boolean(data.anomaly),
      parseFloat(data.anomalyScore) || 0,
      data.timestamp ? new Date(data.timestamp) : new Date(),
    ]
  );
}

async function getReadings(sensorId, limit = 100) {
  const res = await pool.query(
    `SELECT * FROM sensor_readings
     WHERE sensor_id = $1
     ORDER BY timestamp DESC LIMIT $2`,
    [String(sensorId), parseInt(limit)]
  );
  return res.rows;
}

async function insertAlert(data) {
  await pool.query(
    `INSERT INTO alerts
      (alert_id, sensor_id, severity, message, resolved, sent_to_email, timestamp)
     VALUES ($1, $2, $3, $4, $5, $6, NOW())
     ON CONFLICT (alert_id) DO NOTHING`,
    [
      String(data.alertId),
      String(data.sensorId),
      String(data.severity),
      String(data.message),
      false,
      String(data.sentToEmail || ""),
    ]
  );
}

async function getAlerts(resolved = null, limit = 50) {
  if (resolved !== null) {
    const res = await pool.query(
      `SELECT * FROM alerts WHERE resolved = $1 ORDER BY timestamp DESC LIMIT $2`,
      [Boolean(resolved), parseInt(limit)]
    );
    return res.rows;
  }
  const res = await pool.query(
    `SELECT * FROM alerts ORDER BY timestamp DESC LIMIT $1`,
    [parseInt(limit)]
  );
  return res.rows;
}

async function resolveAlert(alertId) {
  await pool.query(
    `UPDATE alerts SET resolved = true WHERE alert_id = $1`,
    [String(alertId)]
  );
}

module.exports = {
  testConnection,
  createUser,
  findUserByEmail,
  updateLastLogin,
  insertReading,
  getReadings,
  insertAlert,
  getAlerts,
  resolveAlert,
};