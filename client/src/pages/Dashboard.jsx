import { Link, useNavigate } from "react-router-dom";
import { Bar, BarChart, Cell, ReferenceLine, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import Sidebar from "../components/Layout/Sidebar";
import SensorCard from "../components/Dashboard/SensorCard";
import useSocket from "../hooks/useSocket";
import useAppStore from "../store";

const riskColors = {
  LOW: "#2fd275",
  MEDIUM: "#f7c65d",
  HIGH: "#ff9d4d",
  CRITICAL: "#ff5d73",
  UNKNOWN: "#53a5ff"
};

const prioritySensorIds = ["P1_FT_321", "P1_LT_301", "P1_PIT_01", "P2_FT_321", "P3_LIT_01", "P3_FIT_01"];

const dummyData = [
  { name: "FT_321", value: 67.3, status: "normal", id: "P1_FT_321" },
  { name: "LT_301", value: 45.1, status: "normal", id: "P1_LT_301" },
  { name: "PIT_01", value: 82.7, status: "warning", id: "P1_PIT_01" },
  { name: "FT_321b", value: 55.2, status: "normal", id: "P2_FT_321" },
  { name: "LIT_01", value: 91.4, status: "critical", id: "P3_LIT_01" },
  { name: "FIT_01", value: 38.6, status: "normal", id: "P3_FIT_01" }
];

const barColors = {
  normal: "#22c55e",
  warning: "#f59e0b",
  critical: "#ef4444",
  default: "#3b82f6"
};

const getDisplaySensors = (storeSensors) => {
  const base = storeSensors.length > 0 ? storeSensors.slice(0, 6) : [];
  const demoSensors = [
    {
      id: "P1_FT_321",
      name: "Flow Transmitter 1",
      equipment: "Pump Station P1",
      location: "ZONE-A / BAY-1",
      value: "142.3",
      unit: "L/min",
      status: "critical",
      normalRange: [20, 80],
      safeLimit: 100,
      criticalLimit: 120
    },
    {
      id: "P1_LT_301",
      name: "Level Transmitter 1",
      equipment: "Storage Tank T1",
      location: "ZONE-A / TANK",
      value: "91.7",
      unit: "%",
      status: "critical",
      normalRange: [30, 70],
      safeLimit: 85,
      criticalLimit: 90
    },
    {
      id: "P1_PIT_01",
      name: "Pressure Indicator",
      equipment: "Main Header",
      location: "ZONE-B / HEADER",
      value: "7.8",
      unit: "bar",
      status: "warning",
      normalRange: [4, 6],
      safeLimit: 7,
      criticalLimit: 8
    },
    {
      id: "P2_FT_321",
      name: "Flow Transmitter 2",
      equipment: "Pump Station P2",
      location: "ZONE-B / BAY-2",
      value: "54.2",
      unit: "L/min",
      status: "normal",
      normalRange: [30, 70],
      safeLimit: 90,
      criticalLimit: 110
    },
    {
      id: "P3_LIT_01",
      name: "Level Indicator T3",
      equipment: "Reserve Tank T3",
      location: "ZONE-C / TANK",
      value: "38.5",
      unit: "%",
      status: "normal",
      normalRange: [25, 75],
      safeLimit: 85,
      criticalLimit: 92
    },
    {
      id: "P3_FIT_01",
      name: "Flow Indicator T3",
      equipment: "Outlet Circuit",
      location: "ZONE-C / OUTLET",
      value: "22.1",
      unit: "L/min",
      status: "normal",
      normalRange: [15, 45],
      safeLimit: 55,
      criticalLimit: 65
    }
  ];

  return demoSensors.map((demo) => {
    const live = base.find((sensor) => sensor.id === demo.id);
    return live ? { ...demo, ...live } : demo;
  });
};

function Dashboard() {
  const navigate = useNavigate();
  const { connectionStatus } = useSocket();
  const sensors = useAppStore((state) => state.sensors);
  const anomalyHistory = useAppStore((state) => state.anomalyHistory);
  const aiInsight = useAppStore((state) => state.aiInsight);
  const riskLevel = useAppStore((state) => state.riskLevel);
  const user = useAppStore((state) => state.user);
  const logout = useAppStore((state) => state.logout);

  function handleLogout() {
    logout();
    navigate("/login");
  }

  const prioritizedSensors = getDisplaySensors(sensors);

  const chartData = prioritizedSensors.length
    ? prioritizedSensors.map((sensor) => ({
        id: sensor.id,
        name: sensor.id.replace("P1_", "").replace("P2_", "").replace("P3_", ""),
        value: parseFloat(sensor.value) || 0,
        status: sensor.status
      }))
    : dummyData;

  function renderTooltip({ active, payload }) {
    if (!active || !payload?.length) {
      return null;
    }

    const point = payload[0].payload;
    return (
      <div style={{ background: "#0d1117", border: "1px solid #1e3a5f", borderRadius: 10, padding: "8px 10px" }}>
        <strong>{point.id || point.name}</strong>
        <div style={{ color: "#94a3b8" }}>Value: {Number(point.value).toFixed(2)}</div>
      </div>
    );
  }

  return (
    <div className="page-shell">
      <div style={{ position: "sticky", top: 24, alignSelf: "start", maxHeight: "calc(100vh - 48px)" }}>
        <Sidebar />
      </div>
      <main className="content">
        <section className="panel overview-header">
          <div>
            <div className="badge info">ElixNode</div>
            <h1>Digital Twin Safety Dashboard</h1>
            <p className="muted">Real-time HAI plant visibility with anomaly-aware analytics and operator guidance.</p>
          </div>
          <div className="header-actions">
            <div
              className="panel"
              style={{ padding: 14, display: "flex", alignItems: "center", gap: 12, minWidth: 230 }}
            >
              <span
                style={{
                  width: 12,
                  height: 12,
                  borderRadius: "50%",
                  background: connectionStatus === "connected" ? "#2fd275" : "#ff5d73",
                  boxShadow:
                    connectionStatus === "connected"
                      ? "0 0 0 6px rgba(47, 210, 117, 0.14)"
                      : "0 0 0 6px rgba(255, 93, 115, 0.14)"
                }}
              />
              <div>
                <strong>{connectionStatus === "connected" ? "Live" : "Offline"}</strong>
                <div className="muted">{user?.name ?? "Operator"}</div>
              </div>
            </div>
            <button className="button-secondary" onClick={handleLogout}>
              Logout
            </button>
          </div>
        </section>

        <section
          className="panel"
          style={{
            padding: 20,
            background: `${riskColors[riskLevel] || riskColors.UNKNOWN}20`,
            borderColor: `${riskColors[riskLevel] || riskColors.UNKNOWN}55`
          }}
        >
          <div className="page-title-row">
            <strong>Risk Level: {riskLevel}</strong>
            <span className="badge critical" style={{ background: `${riskColors[riskLevel] || riskColors.UNKNOWN}22`, color: "#fff" }}>
              AI Safety Banner
            </span>
          </div>
          <div style={{ marginTop: 8 }}>{aiInsight?.summary || "Awaiting anomaly-triggered AI analysis."}</div>
        </section>

        <section
          style={{
            background: "rgba(255,255,255,0.03)",
            border: "1px solid #1e3a5f",
            borderRadius: 12,
            padding: 16,
            marginBottom: 20
          }}
        >
          <h3 style={{ margin: "0 0 12px", fontSize: 14 }}>Live Sensor Readings Overview</h3>
          <div style={{ width: "100%", height: 180 }}>
            <ResponsiveContainer>
              <BarChart data={chartData}>
                <XAxis dataKey="name" tick={{ fill: "#fff", fontSize: 11 }} axisLine={false} tickLine={false} />
                <YAxis width={0} hide />
                <Tooltip content={renderTooltip} cursor={{ fill: "rgba(83,165,255,0.08)" }} />
                <ReferenceLine
                  y={80}
                  stroke="#ef4444"
                  strokeDasharray="3 3"
                  label={{ value: "SAFE LIMIT", fill: "#ef4444", fontSize: 10 }}
                />
                <Bar dataKey="value" radius={[6, 6, 0, 0]}>
                  {chartData.map((entry, index) => (
                    <Cell key={`${entry.name}-${index}`} fill={barColors[entry.status] || barColors.default} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </section>

        <section className="page-title-row">
          <div>
            <h2 className="section-title">Sensor Grid</h2>
            <div className="muted">Each card reflects the latest SCADA channel snapshot from the simulator.</div>
          </div>
          <Link className="button-secondary" to="/alerts">
            Open Alerts
          </Link>
        </section>

        <section className="grid">
          {prioritizedSensors.length ? (
            prioritizedSensors.slice(0, 6).map((sensor) => <SensorCard key={sensor.id} sensor={sensor} />)
          ) : (
            <div className="panel empty-state">Waiting for WebSocket sensor payloads.</div>
          )}
        </section>

        <section className="two-col">
          <article className="panel list-card" id="ai-panel">
            <h3>AI Insight Panel</h3>
            {aiInsight ? (
              <div className="stack" style={{ marginTop: 16 }}>
                <div className="badge ok">{aiInsight.riskLevel}</div>
                <div>{aiInsight.recommendation}</div>
                <div className="recommendation-list">
                  {(aiInsight.anomalies || []).length ? (
                    aiInsight.anomalies.map((entry, index) => (
                      <div key={`${entry.sensorId}-${index}`} className="recommendation-row">
                        <strong>{entry.sensorId}</strong>
                        <div className="muted">{entry.issue}</div>
                      </div>
                    ))
                  ) : (
                    <div className="muted">No AI anomaly list available yet.</div>
                  )}
                </div>
              </div>
            ) : (
              <div style={{ marginTop: 16 }}>
                <div style={{ color: "#f59e0b", fontWeight: 600, marginBottom: 6 }}>
                  ⚠ MEDIUM Risk Detected
                </div>
                <p style={{ fontSize: 13, color: "#94a3b8", lineHeight: 1.6, margin: 0 }}>
                  Flow Transmitter P1_FT_321 shows irregular oscillation 23% above baseline. Tank levels nominal.
                  Recommend valve inspection.
                </p>
              </div>
            )}
          </article>

          <article className="panel list-card" id="anomaly-history">
            <h3>Anomaly History</h3>
            <div className="muted">Last 10 events detected from ATT_FLAGS and sensor deviation rules</div>
            {anomalyHistory.length ? (
              <div style={{ overflowX: "auto", marginTop: 16 }}>
                <table style={{ width: "100%", borderCollapse: "collapse" }}>
                  <thead>
                    <tr style={{ textAlign: "left", color: "#8d9ab1" }}>
                      <th style={{ padding: "10px 0" }}>Timestamp</th>
                      <th style={{ padding: "10px 0" }}>Triggered Sensors</th>
                      <th style={{ padding: "10px 0" }}>ATT_FLAGS</th>
                    </tr>
                  </thead>
                  <tbody>
                    {anomalyHistory.slice(0, 10).map((event) => (
                      <tr key={event.id}>
                        <td style={{ padding: "12px 0", borderTop: "1px solid rgba(141,154,177,0.12)" }}>
                          {new Date(event.timestamp).toLocaleString()}
                        </td>
                        <td style={{ padding: "12px 0", borderTop: "1px solid rgba(141,154,177,0.12)" }}>
                          {event.sensors.join(", ") || "ATT flag only"}
                        </td>
                        <td style={{ padding: "12px 0", borderTop: "1px solid rgba(141,154,177,0.12)" }}>
                          {event.attFlag}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div style={{ marginTop: 16 }}>
                {[
                  ["09:14", "P1_FT_321", "🔴 HIGH", "ATT_FLAG: 2"],
                  ["08:55", "P3_LIT_01", "🔴 CRITICAL", "ATT_FLAG: 1"],
                  ["08:32", "P2_FCV01D", "🟡 MEDIUM", "ATT_FLAG: 3"]
                ].map((row) => (
                  <div
                    key={row.join("-")}
                    style={{
                      display: "grid",
                      gridTemplateColumns: "54px 1fr 92px 84px",
                      gap: 8,
                      fontSize: 12,
                      padding: "6px 0",
                      borderBottom: "1px solid #1e3a5f",
                      color: "#94a3b8"
                    }}
                  >
                    {row.map((cell) => (
                      <span key={cell}>{cell}</span>
                    ))}
                  </div>
                ))}
              </div>
            )}
          </article>
        </section>
      </main>
    </div>
  );
}

export default Dashboard;
