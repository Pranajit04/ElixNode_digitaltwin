import { useMemo, useRef } from "react";
import { Line, LineChart, ResponsiveContainer } from "recharts";

const statusStyle = {
  normal: {
    border: "#1e3a5f",
    badge: "#22c55e",
    value: "#f8fafc",
    shadow: "none"
  },
  warning: {
    border: "#92400e",
    badge: "#f59e0b",
    value: "#f59e0b",
    shadow: "none"
  },
  critical: {
    border: "#7f1d1d",
    badge: "#ef4444",
    value: "#ef4444",
    shadow: "0 0 20px rgba(239,68,68,0.4)"
  }
};

function getTrend(history) {
  if (history.length < 2) {
    return { icon: "→", color: "#64748b", label: "stable" };
  }

  const previous = history.at(-2);
  const current = history.at(-1);
  if (current > previous) {
    return { icon: "▲", color: "#22c55e", label: "rising" };
  }
  if (current < previous) {
    return { icon: "▼", color: "#ef4444", label: "falling" };
  }
  return { icon: "→", color: "#64748b", label: "stable" };
}

function SensorCard({ sensor }) {
  const historyRef = useRef([]);
  const numericValue = Number(sensor.value);
  const status = sensor.status || "normal";
  const tone = statusStyle[status] || statusStyle.normal;
  const normalRange = sensor.normalRange || [0, sensor.safeLimit || sensor.criticalLimit || 100];
  const safeLimit = sensor.safeLimit || sensor.criticalLimit || normalRange[1];
  const rangeSpan = Math.max(normalRange[1] - normalRange[0], 1);
  const percent = Math.max(0, Math.min(100, ((numericValue - normalRange[0]) / rangeSpan) * 100));

  if (Number.isFinite(numericValue) && historyRef.current.at(-1) !== numericValue) {
    historyRef.current = [...historyRef.current, numericValue].slice(-20);
  }

  const chartData = useMemo(
    () => historyRef.current.map((value, index) => ({ index, value })),
    [numericValue]
  );
  const trend = getTrend(historyRef.current);

  return (
    <article
      style={{
        padding: 16,
        background: "#0d1117",
        border: `2px solid ${tone.border}`,
        borderRadius: 16,
        boxShadow: tone.shadow,
        minHeight: 250
      }}
    >
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 10 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <span
            style={{
              width: 9,
              height: 9,
              borderRadius: "50%",
              background: status === "critical" ? "#ef4444" : "#22c55e",
              boxShadow: `0 0 0 6px ${status === "critical" ? "rgba(239,68,68,0.15)" : "rgba(34,197,94,0.14)"}`,
              animation: "criticalPulse 1.8s infinite"
            }}
          />
          <span style={{ fontSize: 10, color: "#64748b", textTransform: "uppercase", letterSpacing: 1.2 }}>LIVE</span>
        </div>
        <span style={{ fontSize: 10, color: "#64748b", textTransform: "uppercase", letterSpacing: 1 }}>
          {sensor.location || "PLANT / FIELD"}
        </span>
        <span
          style={{
            padding: "5px 8px",
            borderRadius: 999,
            background: `${tone.badge}22`,
            color: tone.badge,
            fontSize: 10,
            fontWeight: 800,
            animation: status === "critical" ? "criticalPulse 1.8s infinite" : undefined
          }}
        >
          {status.toUpperCase()}
        </span>
      </div>

      <div style={{ height: 1, background: "#1e3a5f", margin: "12px 0" }} />

      <div style={{ color: "#e2e8f0", fontSize: 15, fontWeight: 800 }}>{sensor.name}</div>
      <div style={{ marginTop: 3, fontSize: 11, color: "#475569" }}>Equipment: {sensor.equipment || sensor.id}</div>

      <div style={{ margin: "18px 0", display: "flex", alignItems: "baseline", justifyContent: "center", gap: 8 }}>
        <span style={{ color: tone.value, fontSize: 32, fontWeight: 700 }}>{Number(numericValue || 0).toFixed(1)}</span>
        <span style={{ color: "#94a3b8", fontSize: 13 }}>{sensor.unit}</span>
      </div>

      <div style={{ display: "flex", justifyContent: "space-between", color: "#64748b", fontSize: 11 }}>
        <span>
          Normal: {normalRange[0]}–{normalRange[1]}
        </span>
        <span>Limit: {safeLimit}</span>
      </div>
      <div style={{ marginTop: 6, height: 6, borderRadius: 999, background: "#111827", overflow: "hidden" }}>
        <div style={{ width: `${percent}%`, height: "100%", background: tone.badge }} />
      </div>

      <div style={{ height: 48, marginTop: 10 }}>
        <ResponsiveContainer>
          <LineChart data={chartData}>
            <Line type="monotone" dataKey="value" stroke={tone.badge} strokeWidth={2} dot={false} />
          </LineChart>
        </ResponsiveContainer>
      </div>

      <div style={{ height: 1, background: "#1e3a5f", margin: "10px 0" }} />

      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: 11 }}>
        <span style={{ color: trend.color, fontWeight: 800 }}>
          {trend.icon} {trend.label}
        </span>
        <span style={{ color: "#64748b" }}>2s ago</span>
      </div>

      {status === "critical" ? (
        <div style={{ marginTop: 10, background: "#7f1d1d", color: "#fecaca", fontSize: 11, padding: "4px 8px", borderRadius: 8 }}>
          ⚠ EXCEEDS SAFETY LIMIT — Immediate action required
        </div>
      ) : null}
    </article>
  );
}

export default SensorCard;
