import { useEffect, useRef } from "react";
import useAppStore from "../store";
import { sendEmailAlert } from "../services/emailAlert";
import { triggerAlertWorkflow } from "../services/n8n";
import { saveAlert } from "../services/api";

function useAlerts() {
  const alerts = useAppStore((state) => state.alerts);
  const preferences = useAppStore((state) => state.preferences);
  const user = useAppStore((state) => state.user);
  const handledAlertIds = useRef(new Set());

  useEffect(() => {
    const latest = alerts[0];

    if (!latest || handledAlertIds.current.has(latest.id)) {
      return;
    }

    handledAlertIds.current.add(latest.id);

    saveAlert({
      alertId: latest.id,
      sensorId: latest.sensorId,
      severity: latest.severity,
      message: latest.message,
      sentToEmail: user?.email ?? ""
    }).catch(console.error);

    if (latest.resolved || latest.severity !== "CRITICAL") {
      return;
    }

    if (preferences.emailEnabled && user?.email) {
      sendEmailAlert({ ...latest, user }, preferences.cooldownMinutes).catch(console.error);
    }

    if (import.meta.env.VITE_N8N_WEBHOOK) {
      triggerAlertWorkflow(latest).catch(console.error);
    }
  }, [alerts, preferences, user]);
}

export default useAlerts;
