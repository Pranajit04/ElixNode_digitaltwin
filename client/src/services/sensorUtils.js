export function getStatus(value, thresholds = {}) {
  if (value >= thresholds.critical) {
    return "critical";
  }

  if (value >= thresholds.warning) {
    return "warning";
  }

  return "ok";
}

export function formatValue(value, unit = "") {
  return `${Number(value).toFixed(2)} ${unit}`.trim();
}

export function getSensorMeta(reading) {
  return Object.entries(reading).filter(([key]) => key !== "timestamp" && key !== "sequence");
}
