import emailjs from "@emailjs/browser";

emailjs.init(import.meta.env.VITE_EMAILJS_PUBLIC_KEY);

const cooldowns = new Map();

export async function sendAlert({ user, riskLevel, summary, recommendation, anomalies, timestamp }) {
  const key = `${user.email}:${riskLevel}`;
  const lastSentAt = cooldowns.get(key) ?? 0;

  if (Date.now() - lastSentAt < 5 * 60 * 1000) {
    console.log(`Email cooldown active for ${key}`);
    return { skipped: true, reason: "cooldown" };
  }

  const primaryAnomaly = anomalies?.[0];
  const payload = {
    to_email: user.email,
    user_name: user.name || user.email,
    sensor_name: primaryAnomaly?.sensorId || "Plant cluster",
    alert_value: summary || "AI detected elevated risk",
    severity: riskLevel,
    recommendation: recommendation || "Inspect the plant immediately.",
    timestamp: timestamp || new Date().toISOString()
  };

  try {
    const response = await emailjs.send(
      import.meta.env.VITE_EMAILJS_SERVICE_ID,
      import.meta.env.VITE_EMAILJS_TEMPLATE_ID,
      payload
    );
    cooldowns.set(key, Date.now());
    console.log(`Email alert sent to ${user.email}`);
    return response;
  } catch (error) {
    console.error("EmailJS send failed:", error);
    throw error;
  }
}

export const sendEmailAlert = sendAlert;
