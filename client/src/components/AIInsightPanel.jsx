import useAppStore from "../store";

function AIInsightPanel() {
  const aiInsight = useAppStore((state) => state.aiInsight);

  return (
    <section className="panel" style={{ padding: 24 }}>
      <h2 className="section-title">AI Insight</h2>
      {aiInsight ? (
        <div className="stack">
          <div className="badge ok">{aiInsight.source.toUpperCase()}</div>
          <p>{aiInsight.summary}</p>
          <p className="muted">{aiInsight.recommendation}</p>
        </div>
      ) : (
        <p className="muted">AI analysis will appear after every 30 readings.</p>
      )}
    </section>
  );
}

export default AIInsightPanel;
