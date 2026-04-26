function RiskMeter({ riskLevel }) {
  const color =
    riskLevel === "CRITICAL" ? "#ef4444" : riskLevel === "WARNING" ? "#f59e0b" : "#22c55e";

  return (
    <section className="panel" style={{ padding: 24 }}>
      <h2 className="section-title">Risk Meter</h2>
      <svg viewBox="0 0 220 120" style={{ width: "100%", maxWidth: 280 }}>
        <path d="M20 100 A90 90 0 0 1 200 100" stroke="#1e293b" strokeWidth="18" fill="none" />
        <path d="M20 100 A90 90 0 0 1 200 100" stroke={color} strokeWidth="18" fill="none" />
        <text x="110" y="90" fill="#e2e8f0" textAnchor="middle" fontSize="24" fontWeight="700">
          {riskLevel}
        </text>
      </svg>
    </section>
  );
}

export default RiskMeter;
