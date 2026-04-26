import useAppStore from "../store";

function AlertBanner() {
  const latest = useAppStore((state) => state.alerts[0]);

  if (!latest || latest.resolved || latest.severity !== "CRITICAL") {
    return null;
  }

  return (
    <section className="panel" style={{ padding: 16, borderColor: "rgba(239, 68, 68, 0.6)" }}>
      <strong>Critical Alert:</strong> {latest.message}
    </section>
  );
}

export default AlertBanner;
