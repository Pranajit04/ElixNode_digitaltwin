import Sidebar from "../components/Layout/Sidebar";
import useAppStore from "../store";
import { formatValue, getStatus, getSensorMeta } from "../services/sensorUtils";

function DigitalTwin() {
  const latest = useAppStore((state) => state.readings.at(-1));
  const sensors = latest ? getSensorMeta(latest).map(([, sensor]) => sensor) : [];

  return (
    <div className="page-shell">
      <Sidebar />
      <main className="content">
        <section className="panel chart-card">
          <div className="page-title-row">
            <div>
              <h1>Digital Twin</h1>
              <p className="muted">Plant-floor style live sensor surface for the currently streamed process nodes.</p>
            </div>
            <div className="badge ok">{sensors.length} nodes</div>
          </div>
          <div className="plant-grid">
            {sensors.length ? (
              sensors.map((sensor) => {
                const status = getStatus(sensor.value, sensor.thresholds);
                return (
                  <div key={sensor.id} className="plant-node">
                    <div className={`badge ${status}`}>{status.toUpperCase()}</div>
                    <strong>{sensor.label}</strong>
                    <div className="metric-value" style={{ fontSize: "1.6rem" }}>
                      {formatValue(sensor.value, sensor.unit)}
                    </div>
                    <div className="muted">Node ID: {sensor.id}</div>
                  </div>
                );
              })
            ) : (
              <div className="empty-state">Digital twin nodes will appear when the simulator sends readings.</div>
            )}
          </div>
        </section>
      </main>
    </div>
  );
}

export default DigitalTwin;
