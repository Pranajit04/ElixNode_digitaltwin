import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import emailjs from "@emailjs/browser";
import Sidebar from "../components/Layout/Sidebar";
import useAppStore from "../store";

const DEMO_ALERTS = [
  {
    id: "ALT-001",
    alert_id: "ALT-001",
    sensor_id: "P1_FT_321",
    sensor_name: "Flow Transmitter 1 — Pump Station P1",
    severity: "critical",
    message:
      "Flow rate 142.3 L/min exceeds critical limit of 120 L/min. Possible pump overspeed or downstream blockage. Risk of pipe rupture.",
    timestamp: new Date(Date.now() - 4 * 60000).toISOString(),
    resolved: false,
    location: "ZONE-A / BAY-1"
  },
  {
    id: "ALT-002",
    alert_id: "ALT-002",
    sensor_id: "P1_LT_301",
    sensor_name: "Level Transmitter 1 — Storage Tank T1",
    severity: "critical",
    message: "Tank level 91.7% exceeds critical threshold of 90%. Overflow imminent within estimated 8 minutes at current fill rate.",
    timestamp: new Date(Date.now() - 9 * 60000).toISOString(),
    resolved: false,
    location: "ZONE-A / TANK"
  },
  {
    id: "ALT-003",
    alert_id: "ALT-003",
    sensor_id: "P1_PIT_01",
    sensor_name: "Pressure Indicator — Main Header",
    severity: "high",
    message: "Header pressure 7.8 bar approaching critical limit 8.0 bar. Monitor closely. Check pressure relief valve operation.",
    timestamp: new Date(Date.now() - 18 * 60000).toISOString(),
    resolved: false,
    location: "ZONE-B / HEADER"
  },
  {
    id: "ALT-004",
    alert_id: "ALT-004",
    sensor_id: "P1_FT_321",
    sensor_name: "Flow Transmitter 1 — Pump Station P1",
    severity: "high",
    message: "Flow rate anomaly first detected. Value climbing from 82 L/min. Operator notified.",
    timestamp: new Date(Date.now() - 35 * 60000).toISOString(),
    resolved: true,
    location: "ZONE-A / BAY-1"
  },
  {
    id: "ALT-005",
    alert_id: "ALT-005",
    sensor_id: "P3_LIT_01",
    sensor_name: "Level Indicator T3 — Reserve Tank",
    severity: "medium",
    message: "Level trending downward for 22 minutes. Currently 38.5%. Below normal range minimum of 25% within 45 minutes if trend continues.",
    timestamp: new Date(Date.now() - 52 * 60000).toISOString(),
    resolved: false,
    location: "ZONE-C / TANK"
  }
];

const severityTone = {
  critical: { background: "rgba(255,93,115,0.14)", color: "#ffb8c2" },
  high: { background: "rgba(255,157,77,0.16)", color: "#ffc182" },
  medium: { background: "rgba(247,198,93,0.16)", color: "#ffe08a" },
  warning: { background: "rgba(247,198,93,0.16)", color: "#ffe08a" }
};

const timeAgo = (ts) => {
  const mins = Math.floor((Date.now() - new Date(ts)) / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins} min ago`;
  return `${Math.floor(mins / 60)}h ago`;
};

function Alerts() {
  const alerts = useAppStore((state) => state.alerts);
  const fetchAlerts = useAppStore((state) => state.fetchAlerts);
  const resolveAlert = useAppStore((state) => state.resolveAlert);
  const user = useAppStore((state) => state.user);
  const [filter, setFilter] = useState("all");
  const [message, setMessage] = useState("");
  const [messageTone, setMessageTone] = useState("muted");
  const [sendingTest, setSendingTest] = useState(false);
  const [useDemoFallback, setUseDemoFallback] = useState(false);

  useEffect(() => {
    fetchAlerts()
      .then((items) => setUseDemoFallback(!items?.length))
      .catch((error) => {
        setUseDemoFallback(true);
        setMessage(error.message);
        setMessageTone("status-error");
      });
  }, [fetchAlerts]);

  const displayAlerts = alerts.length && !useDemoFallback ? alerts : DEMO_ALERTS;

  const filteredAlerts = useMemo(() => {
    if (filter === "resolved") {
      return displayAlerts.filter((alert) => alert.resolved);
    }
    if (filter === "unresolved") {
      return displayAlerts.filter((alert) => !alert.resolved);
    }
    return displayAlerts;
  }, [displayAlerts, filter]);

  async function handleTestEmail() {
    setMessage("");
    setMessageTone("muted");
    setSendingTest(true);

    try {
      const targetUser = user || { name: "Operator", email: "pranajitbanerjee2004@gmail.com" };
      const unresolved = DEMO_ALERTS.filter((alert) => !alert.resolved)
        .map((alert) => `${alert.alert_id} ${alert.sensor_id} ${alert.severity.toUpperCase()}: ${alert.message}`)
        .join("\n");

      await emailjs.send(
        import.meta.env.VITE_EMAILJS_SERVICE_ID,
        import.meta.env.VITE_EMAILJS_TEMPLATE_ID,
        {
          to_email: targetUser.email,
          user_name: targetUser.name,
          subject: "CRITICAL: P1_FT_321 + P1_LT_301 Active",
          sensor_name: "CRITICAL: P1_FT_321 + P1_LT_301 Active",
          alert_value: "Flow: 142.3 L/min | Tank: 91.7%",
          severity: "CRITICAL",
          recommendation:
            "Immediate inspection of Pump Station P1 and Storage Tank T1 required. Shut down pump if flow exceeds 150 L/min.\n\nActive unresolved alerts:\n" +
            unresolved,
          timestamp: new Date().toLocaleString()
        },
        import.meta.env.VITE_EMAILJS_PUBLIC_KEY
      );
      setMessage(`✅ Employee alert sent to ${targetUser.email}`);
      setMessageTone("status-ok");
    } catch (error) {
      setMessage(error?.text || error?.message || JSON.stringify(error));
      setMessageTone("status-error");
    } finally {
      setSendingTest(false);
    }
  }

  return (
    <div className="page-shell">
      <Sidebar />
      <main className="content">
        <section className="panel chart-card">
          <div className="page-title-row">
            <div>
              <h1>Alert History</h1>
              <p className="muted">Resolve plant alerts, inspect messages, and notify employees.</p>
            </div>
            <Link className="button-secondary" to="/dashboard">
              Back to Dashboard
            </Link>
          </div>

          <div className="page-title-row" style={{ marginTop: 18, flexWrap: "wrap" }}>
            <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
              <button className={filter === "all" ? "button" : "button-secondary"} onClick={() => setFilter("all")}>
                All
              </button>
              <button className={filter === "unresolved" ? "button" : "button-secondary"} onClick={() => setFilter("unresolved")}>
                Unresolved
              </button>
              <button className={filter === "resolved" ? "button" : "button-secondary"} onClick={() => setFilter("resolved")}>
                Resolved
              </button>
            </div>
            <button className="button-secondary" onClick={handleTestEmail} disabled={sendingTest}>
              {sendingTest ? "Sending..." : "Alert Employees"}
            </button>
          </div>

          {message ? (
            <p className={messageTone} style={{ marginTop: 16 }}>
              {message}
            </p>
          ) : null}

          <div style={{ overflowX: "auto", marginTop: 18 }}>
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead>
                <tr style={{ textAlign: "left", color: "#8d9ab1" }}>
                  <th style={{ padding: "12px 0" }}>Time</th>
                  <th style={{ padding: "12px 0" }}>Sensor</th>
                  <th style={{ padding: "12px 0" }}>Location</th>
                  <th style={{ padding: "12px 0" }}>Severity</th>
                  <th style={{ padding: "12px 0" }}>Message</th>
                  <th style={{ padding: "12px 0" }}>Status</th>
                  <th style={{ padding: "12px 0" }}>Action</th>
                </tr>
              </thead>
              <tbody>
                {filteredAlerts.map((alert) => {
                  const severity = String(alert.severity || "warning").toLowerCase();
                  return (
                    <tr key={alert.alert_id || alert.id}>
                      <td style={{ padding: "14px 0", borderTop: "1px solid rgba(141,154,177,0.12)" }}>
                        {timeAgo(alert.timestamp)}
                      </td>
                      <td style={{ padding: "14px 0", borderTop: "1px solid rgba(141,154,177,0.12)" }}>
                        <strong>{alert.sensor_id}</strong>
                        <div className="muted">{alert.sensor_name}</div>
                      </td>
                      <td style={{ padding: "14px 0", borderTop: "1px solid rgba(141,154,177,0.12)" }}>
                        {alert.location || "Plant floor"}
                      </td>
                      <td style={{ padding: "14px 0", borderTop: "1px solid rgba(141,154,177,0.12)" }}>
                        <span className="badge" style={severityTone[severity] || severityTone.warning}>
                          {severity.toUpperCase()}
                        </span>
                      </td>
                      <td style={{ padding: "14px 0", borderTop: "1px solid rgba(141,154,177,0.12)" }}>
                        {alert.message}
                      </td>
                      <td style={{ padding: "14px 0", borderTop: "1px solid rgba(141,154,177,0.12)" }}>
                        {alert.resolved ? "Resolved" : "Open"}
                      </td>
                      <td style={{ padding: "14px 0", borderTop: "1px solid rgba(141,154,177,0.12)" }}>
                        <button
                          className="mini-button secondary"
                          disabled={alert.resolved}
                          onClick={() => resolveAlert(alert.alert_id || alert.id)}
                        >
                          Resolve
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </section>
      </main>
    </div>
  );
}

export default Alerts;
