function injectSpike(value, amount = 25) {
  return Number(value) + amount;
}

function injectDrift(value, step = 1.5, iteration = 1) {
  return Number(value) + step * iteration;
}

function maybeInjectAnomaly(row, index, enabled = false) {
  if (!enabled) {
    return row;
  }

  if (index % 10 === 0 && row.flow_rate) {
    return { ...row, flow_rate: injectSpike(row.flow_rate) };
  }

  if (index % 15 === 0 && row.pump_pressure) {
    return { ...row, pump_pressure: injectDrift(row.pump_pressure, 2, index / 15) };
  }

  return row;
}

module.exports = {
  injectSpike,
  injectDrift,
  maybeInjectAnomaly
};
