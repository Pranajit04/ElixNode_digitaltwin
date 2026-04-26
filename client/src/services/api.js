const BASE = import.meta.env.VITE_API_URL || "";

async function request(path, options = {}) {
  const response = await fetch(`${BASE}${path}`, options);
  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(data.error || `Request failed with status ${response.status}`);
  }

  return data;
}

export function getReadings(sensorId, limit = 100) {
  return request(`/api/readings/${sensorId}?limit=${limit}`);
}

export function getAlerts(resolved = null) {
  const query = resolved === null ? "" : `?resolved=${resolved}`;
  return request(`/api/alerts${query}`);
}

export function resolveAlert(alertId) {
  return request(`/api/alerts/${alertId}/resolve`, { method: "POST" });
}

export function getStats() {
  return request("/api/stats");
}

export function saveAlert(alert) {
  return request("/api/alerts", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(alert)
  });
}
