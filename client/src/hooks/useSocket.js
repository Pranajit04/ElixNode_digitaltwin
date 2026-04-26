import { useEffect } from "react";
import useAppStore from "../store";

function getStatus(value, thresholds = {}) {
  if (!Number.isFinite(value)) {
    return "normal";
  }
  if (Number.isFinite(thresholds.critical) && value >= thresholds.critical) {
    return "critical";
  }
  if (Number.isFinite(thresholds.warning) && value >= thresholds.warning) {
    return "warning";
  }
  return "normal";
}

function normalizeLegacyReading(parsed) {
  if (Array.isArray(parsed?.sensors)) {
    return parsed;
  }

  if (parsed?.type !== "reading" || !parsed?.data) {
    return null;
  }

  const sensors = Object.entries(parsed.data)
    .filter(([key, entry]) => key !== "timestamp" && key !== "_simulated" && entry && typeof entry === "object")
    .map(([key, entry]) => {
      const value = Number(entry.value);
      return {
        id: entry.id || key,
        name: entry.label || entry.id || key,
        value,
        unit: entry.unit || "",
        status: getStatus(value, entry.thresholds)
      };
    })
    .filter((sensor) => Number.isFinite(sensor.value))
    .slice(0, 16);

  return sensors.length
    ? {
        timestamp: parsed.timestamp || parsed.data.timestamp || new Date().toISOString(),
        sensors,
        isAnomaly: sensors.some((sensor) => sensor.status !== "normal"),
        attFlag: Number(parsed.ATT_FLAGS || parsed.ATT_FLAG || 0)
      }
    : null;
}

function useSocket() {
  const addWebSocketMessage = useAppStore((state) => state.addWebSocketMessage);
  const connectionStatus = useAppStore((state) => state.connectionStatus);
  const setConnectionStatus = useAppStore((state) => state.setConnectionStatus);

  useEffect(() => {
    let socket;
    let reconnectTimer;

    const connect = () => {
      setConnectionStatus("connecting");
      socket = new WebSocket(import.meta.env.VITE_WS_URL || "ws://localhost:8080");

      socket.onopen = () => setConnectionStatus("connected");
      socket.onclose = () => {
        setConnectionStatus("disconnected");
        reconnectTimer = window.setTimeout(connect, 3000);
      };
      socket.onerror = () => setConnectionStatus("disconnected");
      socket.onmessage = async (event) => {
        try {
          const parsed = JSON.parse(event.data);
          const message = normalizeLegacyReading(parsed);
          if (message?.sensors) {
            await addWebSocketMessage(message);
          }
        } catch (error) {
          console.error("WebSocket message parse failed:", error);
        }
      };
    };

    connect();

    return () => {
      if (reconnectTimer) {
        window.clearTimeout(reconnectTimer);
      }
      socket?.close();
    };
  }, [addWebSocketMessage, setConnectionStatus]);

  return { connectionStatus };
}

export default useSocket;
