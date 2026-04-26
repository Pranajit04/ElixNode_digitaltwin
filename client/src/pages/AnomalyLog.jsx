import { useEffect, useMemo, useState } from "react";
import Sidebar from "../components/Layout/Sidebar";
import { sendAlert } from "../services/emailAlert";
import { getAlerts } from "../services/api";
import useAppStore from "../store";

const dummyAnomalies = [
  { id: 1, timestamp: "2026-04-26 09:14:32", sensorId: "P1_FT_321", sensorName: "Flow Transmitter 1", value: "142.3 L/min", severity: "HIGH", attFlag: 2, message: "Flow rate 42% above normal operating range" },
  { id: 2, timestamp: "2026-04-26 08:55:11", sensorId: "P1_LT_301", sensorName: "Level Transmitter 1", value: "89.2 %", severity: "CRITICAL", attFlag: 1, message: "Tank level approaching overflow threshold" },
  { id: 3, timestamp: "2026-04-26 08:32:45", sensorId: "P2_FCV01D", sensorName: "Flow Control Valve 2", value: "0.12", severity: "MEDIUM", attFlag: 3, message: "Valve position deviating from setpoint" },
  { id: 4, timestamp: "2026-04-26 07:41:20", sensorId: "P1_PIT_01", sensorName: "Pressure Indicator 1", value: "8.7 bar", severity: "HIGH", attFlag: 2, message: "Pressure spike detected, possible water hammer" },
  { id: 5, timestamp: "2026-04-26 07:15:03", sensorId: "P3_LIT_01", sensorName: "Level Indicator T3", value: "12.1 %", severity: "CRITICAL", attFlag: 1, message: "Tank 3 critically low, pump cavitation risk" },
  { id: 6, timestamp: "2026-04-26 06:58:44", sensorId: "P2_LT_321", sensorName: "Level Transmitter 2", value: "76.8 %", severity: "MEDIUM", attFlag: 3, message: "Gradual level drift detected over 20 minutes" },
  { id: 7, timestamp: "2026-04-26 06:30:17", sensorId: "P3_FIT_01", sensorName: "Flow Indicator T3", value: "0.04 L/min", severity: "HIGH", attFlag: 2, message: "Near-zero flow on active circuit, blockage suspected" },
  { id: 8, timestamp: "2026-04-26 05:44:59", sensorId: "P1_FCV03D", sensorName: "Flow Control Valve 3", value: "0.98", severity: "MEDIUM", attFlag: 3, message: "Valve fully open, manual override suspected" }
];

const sensorNames = {
  P1_FT_321: "Flow Transmitter 1",
  P1_LT_301: "Level Transmitter 1",
  P1_PIT_01: "Pressure Indicator 1",
  P1_FCV03D: "Flow Control Valve 3",
  P2_FCV01D: "Flow Control Valve 2",
  P2_LT_321: "Level Transmitter 2",
  P3_LIT_01: "Level Indicator T3",
  P3_FIT_01: "Flow Indicator T3"
};

const attFlagTitle = {
  1: "Physical Attack",
  2: "Cyber Attack",
  3: "Operational Anomaly"
};

function severityClass(severity) {
  return `badge severity-${String(severity || "LOW").toLowerCase()}`;
}

function normalizeAlert(alert, index) {
  const sensorId = alert.sensor_id || alert.sensorId || "ATT_FLAGS";
  const timestamp = alert.timestamp || new Date().toISOString();
  return {
    id: alert.alert_id || alert.id || `alert-${index}`,
    timestamp,
    sensorId,
    sensorName: sensorNames[sensorId] || sensorId,
    value: alert.value || "Recorded alert",
    severity: alert.severity || "MEDIUM",
    attFlag: Number(String(alert.message || "").match(/ATT_FLAGS=(\d+)/)?.[1] || alert.attFlag || 3),
    message: alert.message || "Backend alert recorded"
  };
}

function normalizeLive(event, index) {
  const sensorId = event.sensors?.[0] || "ATT_FLAGS";
  return {
    id: event.id || `live-${index}`,
    timestamp: event.timestamp,
    sensorId,
    sensorName: sensorNames[sensorId] || sensorId,
    value: "Live anomaly",
    severity: event.attFlag === 1 ? "CRITICAL" : event.attFlag === 2 ? "HIGH" : "MEDIUM",
    attFlag: event.attFlag || 3,
    message: event.sensors?.length ? `Triggered sensors: ${event.sensors.join(", ")}` : "ATT flag anomaly detected"
  };
}

function csvEscape(value) {
  return `"${String(value ?? "").replace(/"/g, '""')}"`;
}

function AnomalyLog() {
  const anomalyHistory = useAppStore((state) => state.anomalyHistory);
  const user = useAppStore((state) => state.user);
  const [rows, setRows] = useState([]);
  const [filter, setFilter] = useState("ALL");
  const [search, setSearch] = useState("");
  const [sentIds, setSentIds] = useState(new Set());
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;

    async function loadAnomalies() {
      setError("");
      try {
        const backendAlerts = await getAlerts();
        const combined = [
          ...anomalyHistory.map(normalizeLive),
          ...backendAlerts.map(normalizeAlert)
        ];
        const deduped = Array.from(
          new Map(combined.map((entry) => [new Date(entry.timestamp).getTime() || entry.id, entry])).values()
        ).sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));

        if (active) {
          setRows(deduped.length ? deduped : dummyAnomalies);
        }
      } catch (loadError) {
        if (active) {
          setError(loadError.message || "Failed to load backend alerts. Showing demo anomalies.");
          setRows(anomalyHistory.length ? anomalyHistory.map(normalizeLive) : dummyAnomalies);
        }
      }
    }

    loadAnomalies();
    return () => {
      active = false;
    };
  }, [anomalyHistory]);

  const filteredRows = useMemo(() => {
    const needle = search.trim().toLowerCase();
    return rows.filter((row) => {
      const matchesSeverity = filter === "ALL" || row.severity === filter;
      const matchesSearch =
        !needle ||
        row.sensorName.toLowerCase().includes(needle) ||
        row.sensorId.toLowerCase().includes(needle);
      return matchesSeverity && matchesSearch;
    });
  }, [rows, filter, search]);

  const criticalCount = rows.filter((row) => row.severity === "CRITICAL").length;
  const highCount = rows.filter((row) => row.severity === "HIGH").length;
  const lastAnomalyTime = rows[0]?.timestamp ? new Date(rows[0].timestamp).toLocaleString() : "None";

  async function handleSend(row) {
    await sendAlert({
      user: user || { name: "Operator", email: "pranajitbanerjee2004@gmail.com" },
      riskLevel: row.severity,
      summary: `${row.sensorName}: ${row.value}`,
      recommendation: row.message,
      anomalies: [{ sensorId: row.sensorId, issue: row.message }],
      timestamp: row.timestamp
    });
    setSentIds((current) => new Set(current).add(row.id));
  }

  function exportCsv() {
    const headers = ["Time", "Sensor", "Value", "Severity", "ATT Flag", "Message"];
    const lines = [
      headers.map(csvEscape).join(","),
      ...filteredRows.map((row) =>
        [
          new Date(row.timestamp).toLocaleString(),
          `${row.sensorId} - ${row.sensorName}`,
          row.value,
          row.severity,
          row.attFlag,
          row.message
        ]
          .map(csvEscape)
          .join(",")
      )
    ];
    const blob = new Blob([lines.join("\n")], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `elixnode-anomalies-${Date.now()}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div className="page-shell">
      <Sidebar />
      <main className="content">
        <section className="panel chart-card">
          <div className="page-title-row">
            <div>
              <h1>Anomaly Log</h1>
              <p className="muted">Merged live WebSocket anomalies and backend alert history.</p>
            </div>
            <button className="button-secondary" onClick={exportCsv}>
              Export CSV
            </button>
          </div>

          <div className="grid" style={{ marginTop: 18 }}>
            <div className="metric-card panel"><span className="muted">Total anomalies</span><strong className="metric-value">{rows.length}</strong></div>
            <div className="metric-card panel"><span className="muted">Critical</span><span className="badge severity-critical">{criticalCount}</span></div>
            <div className="metric-card panel"><span className="muted">High</span><span className="badge severity-high">{highCount}</span></div>
            <div className="metric-card panel"><span className="muted">Last anomaly</span><strong>{lastAnomalyTime}</strong></div>
          </div>

          <div className="filter-bar">
            {["ALL", "CRITICAL", "HIGH", "MEDIUM"].map((item) => (
              <button key={item} className={filter === item ? "button" : "button-secondary"} onClick={() => setFilter(item)}>
                {item === "ALL" ? "All" : item}
              </button>
            ))}
            <input className="input" value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search sensor name" />
          </div>

          {error ? <p className="status-error">{error}</p> : null}

          <div className="table-wrap">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Time</th>
                  <th>Sensor</th>
                  <th>Value</th>
                  <th>Severity</th>
                  <th>ATT Flag</th>
                  <th>Message</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {filteredRows.map((row) => (
                  <tr key={row.id}>
                    <td>{new Date(row.timestamp).toLocaleString()}</td>
                    <td><strong>{row.sensorId}</strong><div className="muted">{row.sensorName}</div></td>
                    <td>{row.value}</td>
                    <td><span className={severityClass(row.severity)}>{row.severity}</span></td>
                    <td><span title={`Flag ${row.attFlag} = ${attFlagTitle[row.attFlag] || "Unknown"}`}>{row.attFlag}</span></td>
                    <td>{row.message}</td>
                    <td>
                      <button className="mini-button secondary" onClick={() => handleSend(row)} disabled={sentIds.has(row.id)}>
                        {sentIds.has(row.id) ? "✅ Sent" : "Send Alert"}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      </main>
    </div>
  );
}

export default AnomalyLog;
