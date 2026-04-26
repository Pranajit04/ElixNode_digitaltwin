import { useMemo, useState } from "react";
import Sidebar from "../components/Layout/Sidebar";
import { analyzeReadings } from "../services/gemini";
import useAppStore from "../store";

const fallbackInsight = {
  riskLevel: "MEDIUM",
  summary:
    "Flow Transmitter P1_FT_321 shows irregular oscillation patterns. Tank levels are within acceptable range. Motor current draw slightly elevated on P2 circuit.",
  recommendation:
    "1. Inspect P1_FT_321 flow valve for partial blockage. 2. Monitor P2 motor temperature over next 30 minutes. 3. Log findings in maintenance sheet.",
  anomalies: [
    { sensorId: "P1_FT_321", issue: "Irregular oscillation, 23% above baseline" },
    { sensorId: "P2_FCV01D", issue: "Valve response time degraded" }
  ]
};

const riskTone = {
  LOW: { background: "rgba(51,209,122,0.16)", color: "#8ff0ba", borderColor: "rgba(51,209,122,0.35)" },
  MEDIUM: { background: "rgba(247,198,93,0.16)", color: "#ffe08a", borderColor: "rgba(247,198,93,0.35)" },
  HIGH: { background: "rgba(255,157,77,0.18)", color: "#ffc182", borderColor: "rgba(255,157,77,0.38)" },
  CRITICAL: { background: "rgba(255,93,115,0.18)", color: "#ffb8c2", borderColor: "rgba(255,93,115,0.4)" }
};

function splitActions(value) {
  return String(value || "")
    .split(/\n|(?<=\.)\s+/)
    .map((item) => item.replace(/^\d+\.\s*/, "").trim())
    .filter(Boolean);
}

function AIInsight() {
  const sensors = useAppStore((state) => state.sensors);
  const storeInsight = useAppStore((state) => state.aiInsight);
  const [insight, setInsight] = useState(storeInsight);
  const [lastAnalyzedAt, setLastAnalyzedAt] = useState("");
  const [loading, setLoading] = useState(false);
  const [notice, setNotice] = useState("");

  const actions = useMemo(() => splitActions(insight?.recommendation), [insight]);
  const tone = riskTone[insight?.riskLevel] || riskTone.MEDIUM;

  async function runAnalysis() {
    setLoading(true);
    setNotice("");

    try {
      if (!import.meta.env.VITE_GEMINI_KEY) {
        throw new Error("Gemini API key is missing");
      }

      if (!sensors.length) {
        throw new Error("No live sensor readings available yet");
      }

      const nextInsight = await analyzeReadings(sensors);
      setInsight(nextInsight);
    } catch (error) {
      setInsight(fallbackInsight);
      setNotice(`${error.message || "AI analysis failed"}. Showing local demo analysis.`);
    } finally {
      setLastAnalyzedAt(new Date().toLocaleString());
      setLoading(false);
    }
  }

  return (
    <div className="page-shell">
      <Sidebar />
      <main className="content">
        <section className="panel chart-card">
          <div className="page-title-row">
            <div>
              <h1>AI Insight</h1>
              <p className="muted">Manual Gemini analysis of the latest SCADA sensor state.</p>
            </div>
            {insight ? (
              <button className="button" onClick={runAnalysis} disabled={loading}>
                {loading ? "Refreshing..." : "Refresh Analysis"}
              </button>
            ) : null}
          </div>

          {!insight ? (
            <div className="empty-state">
              <button className="button" onClick={runAnalysis} disabled={loading}>
                {loading ? "Running Analysis..." : "Run AI Analysis"}
              </button>
              {loading ? <div className="spinner" aria-label="Loading" /> : null}
            </div>
          ) : (
            <div className="insight-grid">
              <article className="panel insight-card" style={{ borderColor: tone.borderColor }}>
                <div className="muted">RISK LEVEL</div>
                <div className="risk-badge" style={tone}>
                  {insight.riskLevel || "MEDIUM"}
                </div>
              </article>

              <article className="panel insight-card">
                <div className="muted">SUMMARY</div>
                <p className="readable-text">{insight.summary}</p>
              </article>

              <article className="panel insight-card">
                <div className="muted">RECOMMENDATION</div>
                <ol className="action-list">
                  {actions.map((action, index) => (
                    <li key={`${action}-${index}`}>{action}</li>
                  ))}
                </ol>
              </article>

              <article className="panel insight-card">
                <div className="muted">ANOMALIES DETECTED</div>
                {insight.anomalies?.length ? (
                  <div className="table-wrap">
                    <table className="data-table">
                      <thead>
                        <tr>
                          <th>Sensor ID</th>
                          <th>Issue description</th>
                        </tr>
                      </thead>
                      <tbody>
                        {insight.anomalies.map((entry, index) => (
                          <tr key={`${entry.sensorId}-${index}`}>
                            <td>{entry.sensorId}</td>
                            <td>{entry.issue}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <div className="empty-state">All systems nominal ✅</div>
                )}
              </article>
            </div>
          )}

          <div className="page-title-row" style={{ marginTop: 18 }}>
            <span className={notice ? "status-error" : "muted"}>{notice}</span>
            <span className="muted">{lastAnalyzedAt ? `Last analysis: ${lastAnalyzedAt}` : "No analysis run yet"}</span>
          </div>
        </section>
      </main>
    </div>
  );
}

export default AIInsight;
