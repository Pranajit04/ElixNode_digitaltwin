require("dotenv").config({ path: "../.env" });
const { Pool } = require("pg");

console.log("DB URL loaded:", process.env.DATABASE_URL ? "YES ✅" : "NO ❌");

// Bypass certificate verification for the current Node process when using Aiven SSL.
process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0";

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false
  }
});

// Users
async function createUser(data) {
  const q = `
    INSERT INTO users (name, email, password_hash, role, created_at)
    VALUES ($1, $2, $3, $4, NOW())
    RETURNING id, name, email, role, created_at
  `;
  const res = await pool.query(q, [
    data.name,
    data.email,
    data.passwordHash,
    data.role || "operator"
  ]);
  return res.rows[0];
}

async function findUserByEmail(email) {
  const res = await pool.query(`SELECT * FROM users WHERE email = $1 LIMIT 1`, [email]);
  return res.rows[0] || null;
}

async function updateLastLogin(userId) {
  await pool.query(`UPDATE users SET last_login = NOW() WHERE id = $1`, [userId]);
}

// Sensor Readings
async function insertReading(data) {
  const q = `
    INSERT INTO sensor_readings
      (sensor_id, value, unit, status, anomaly, anomaly_score, timestamp)
    VALUES ($1, $2, $3, $4, $5, $6, $7)
  `;
  await pool.query(q, [
    data.sensorId,
    data.value,
    data.unit || "",
    data.status || "normal",
    data.anomaly || false,
    data.anomalyScore || 0,
    data.timestamp ? new Date(data.timestamp) : new Date()
  ]);
}

async function getReadings(sensorId, limit = 100) {
  const res = await pool.query(
    `SELECT * FROM sensor_readings
     WHERE sensor_id = $1
     ORDER BY timestamp DESC
     LIMIT $2`,
    [sensorId, limit]
  );
  return res.rows;
}

async function getAllLatestReadings() {
  const res = await pool.query(`
    SELECT DISTINCT ON (sensor_id) *
    FROM sensor_readings
    ORDER BY sensor_id, timestamp DESC
  `);
  return res.rows;
}

// Alerts
async function insertAlert(data) {
  const q = `
    INSERT INTO alerts
      (alert_id, sensor_id, severity, message, resolved, sent_to_email, timestamp)
    VALUES ($1, $2, $3, $4, $5, $6, NOW())
    ON CONFLICT (alert_id) DO NOTHING
  `;
  await pool.query(q, [
    data.alertId,
    data.sensorId,
    data.severity,
    data.message,
    false,
    data.sentToEmail || ""
  ]);
}

async function getAlerts(resolved = null, limit = 50) {
  if (resolved !== null) {
    const res = await pool.query(
      `SELECT * FROM alerts WHERE resolved = $1 ORDER BY timestamp DESC LIMIT $2`,
      [resolved, limit]
    );
    return res.rows;
  }

  const res = await pool.query(`SELECT * FROM alerts ORDER BY timestamp DESC LIMIT $1`, [limit]);
  return res.rows;
}

async function resolveAlert(alertId) {
  await pool.query(`UPDATE alerts SET resolved = true WHERE alert_id = $1`, [alertId]);
}

// Test Connection
async function testConnection() {
  const res = await pool.query("SELECT NOW()");
  console.log("✅ DB connected:", res.rows[0].now);
}

module.exports = {
  testConnection,
  createUser,
  findUserByEmail,
  updateLastLogin,
  insertReading,
  getReadings,
  getAllLatestReadings,
  insertAlert,
  getAlerts,
  resolveAlert,
  async getStats() {
    const readings = await pool.query(`SELECT COUNT(*)::int AS count FROM sensor_readings`);
    const alerts = await pool.query(`SELECT COUNT(*)::int AS count FROM alerts`);
    return {
      totalReadings: readings.rows[0]?.count ?? 0,
      totalAlerts: alerts.rows[0]?.count ?? 0
    };
  }
};
