import { useParams } from "react-router-dom";
import Sidebar from "../components/Layout/Sidebar";
import SensorChart from "../components/Dashboard/SensorChart";
import useAppStore from "../store";

function SensorDetail() {
  const { sensorId } = useParams();
  const readings = useAppStore((state) => state.readings);

  return (
    <div className="page-shell">
      <Sidebar />
      <main className="content">
        <section className="panel" style={{ padding: 24 }}>
          <h1>Sensor Detail</h1>
          <p className="muted">Detail view for sensor ID: {sensorId}</p>
          <SensorChart readings={readings} sensorId={sensorId} />
        </section>
      </main>
    </div>
  );
}

export default SensorDetail;
