function RiskBanner({ riskLevel = "LOW", summary = "Plant risk telemetry is active." }) {
  return (
    <section className="panel" style={{ padding: 20 }}>
      <div className="page-title-row">
        <strong>Risk Level: {riskLevel}</strong>
        <span className="badge info">Safety Banner</span>
      </div>
      <div style={{ marginTop: 8 }}>{summary}</div>
    </section>
  );
}

export default RiskBanner;
