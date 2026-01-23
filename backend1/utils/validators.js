const allowedIntervals = new Set(['1m', '5m', '15m', '30m', '1h', '2h', '4h', '1d', '1w', '1M']);

function sanitizeTicker(raw) {
  if (!raw) return '';
  return String(raw).toUpperCase().replace(/[^A-Z0-9._-]/g, '').slice(0, 32);
}

function isValidInterval(interval) {
  return allowedIntervals.has(interval);
}

function isValidIsoDate(value) {
  if (!value) return false;
  const parsed = Date.parse(value);
  return Number.isFinite(parsed);
}

module.exports = {
  sanitizeTicker,
  isValidInterval,
  isValidIsoDate,
  allowedIntervals,
};
