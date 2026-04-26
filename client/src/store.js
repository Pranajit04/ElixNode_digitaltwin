import { create } from "zustand";
import { analyzeReadings } from "./services/gemini";
import { sendAlert } from "./services/emailAlert";
import * as api from "./services/api";
import { getStoredUser, logout as clearStoredUser } from "./services/auth";

let lastEmailSentAt = 0;

const useAppStore = create((set, get) => ({
  sensors: [],
  alerts: [],
  riskLevel: "LOW",
  aiInsight: null,
  user: getStoredUser(),
  connectionStatus: "disconnected",
  anomalyHistory: [],
  setConnectionStatus: (connectionStatus) => set({ connectionStatus }),
  setUser: (user) => set({ user }),
  logout: () => {
    clearStoredUser();
    set({ user: null });
  },
  addWebSocketMessage: async (msg) => {
    if (!msg?.sensors) {
      return;
    }

    const nextSensors = msg.sensors.map((sensor) => {
      const previous = get().sensors.find((entry) => entry.id === sensor.id);
      const history = [...(previous?.history ?? []), Number(sensor.value)].slice(-20);
      return { ...sensor, history };
    });

    set({ sensors: nextSensors });

    if (msg.isAnomaly) {
      const anomalyEvent = {
        id: `${msg.timestamp}-${msg.attFlag}`,
        timestamp: msg.timestamp,
        attFlag: msg.attFlag,
        sensors: nextSensors.filter((sensor) => sensor.status !== "normal").map((sensor) => sensor.id),
        resolved: false
      };

      set((state) => ({
        anomalyHistory: [anomalyEvent, ...state.anomalyHistory].slice(0, 50)
      }));

      await get().triggerAIAnalysis(nextSensors);
      await get().fetchAlerts();
    }
  },
  triggerAIAnalysis: async (sensors) => {
    try {
      const insight = await analyzeReadings(sensors);
      const riskLevel = insight?.riskLevel || "LOW";
      set({ aiInsight: insight, riskLevel });
      await get().sendEmailAlert({ ...insight, riskLevel });
      return insight;
    } catch (error) {
      const fallback = {
        riskLevel: "UNKNOWN",
        summary: error.message || "AI analysis unavailable",
        recommendation: "Inspect live telemetry manually.",
        anomalies: []
      };
      set({ aiInsight: fallback, riskLevel: "UNKNOWN" });
      return fallback;
    }
  },
  sendEmailAlert: async (insight) => {
    const { user, riskLevel } = get();
    const now = Date.now();

    if (!user || !["HIGH", "CRITICAL"].includes(riskLevel)) {
      return;
    }

    if (now - lastEmailSentAt < 5 * 60 * 1000) {
      return;
    }

    await sendAlert({
      user,
      riskLevel,
      summary: insight.summary,
      recommendation: insight.recommendation,
      anomalies: insight.anomalies || [],
      timestamp: new Date().toISOString()
    });

    lastEmailSentAt = now;
  },
  fetchAlerts: async (resolved = null) => {
    const alerts = await api.getAlerts(resolved);
    set({ alerts });
    return alerts;
  },
  resolveAlert: async (alertId) => {
    await api.resolveAlert(alertId);
    set((state) => ({
      alerts: state.alerts.map((alert) =>
        alert.alert_id === alertId || alert.id === alertId ? { ...alert, resolved: true } : alert
      )
    }));
  }
}));

export default useAppStore;
