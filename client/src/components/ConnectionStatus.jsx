import useAppStore from "../store";

function ConnectionStatus() {
  const connectionStatus = useAppStore((state) => state.connectionStatus);
  const tone = connectionStatus === "connected" ? "ok" : connectionStatus === "connecting" ? "warning" : "critical";

  return (
    <section className="panel" style={{ padding: 16 }}>
      <span className={`badge ${tone}`}>WebSocket {connectionStatus}</span>
    </section>
  );
}

export default ConnectionStatus;
