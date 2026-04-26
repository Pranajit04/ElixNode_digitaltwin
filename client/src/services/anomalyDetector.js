export function calculateZScore(values, target) {
  if (!values.length) {
    return 0;
  }

  const mean = values.reduce((sum, value) => sum + value, 0) / values.length;
  const variance = values.reduce((sum, value) => sum + (value - mean) ** 2, 0) / values.length;
  const stdDev = Math.sqrt(variance) || 1;
  return (target - mean) / stdDev;
}

export function detectAnomalies(reading) {
  return Object.entries(reading)
    .filter(([key, value]) => key !== "timestamp" && key !== "sequence" && value?.thresholds)
    .map(([key, sensor]) => {
      const severity =
        sensor.value >= sensor.thresholds.critical
          ? "CRITICAL"
          : sensor.value >= sensor.thresholds.warning
            ? "WARNING"
            : "LOW";

      return {
        sensorId: sensor.id ?? key,
        label: sensor.label ?? key,
        value: sensor.value,
        severity,
        timestamp: reading.timestamp
      };
    })
    .filter((entry) => entry.severity !== "LOW");
}
