export async function triggerAlertWorkflow(alert) {
  const webhookUrl = import.meta.env.VITE_N8N_WEBHOOK;

  if (!webhookUrl) {
    return { skipped: true, reason: "missing_webhook" };
  }

  const response = await fetch(webhookUrl, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(alert)
  });

  return response.ok
    ? { ok: true }
    : { ok: false, status: response.status };
}
