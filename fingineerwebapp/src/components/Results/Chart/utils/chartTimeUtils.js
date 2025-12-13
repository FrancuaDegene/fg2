export const toNumber = (value) => {
  if (value === null || value === undefined) return null;
  const num = Number(value);
  return Number.isFinite(num) ? num : null;
};

export const resolveSeriesKind = (type) => {
  const key = (type || '').toString().toLowerCase();
  if (
    key === 'line' ||
    key === 'line_with_markers' ||
    key === 'stepped_line' ||
    key === 'tick_chart' ||
    key === 'area' ||
    key === 'area_hlc' ||
    key === 'baseline' ||
    key === 'histogram' ||
    key === 'volume_profile' ||
    key === 'market_profile' ||
    key === 'kagi' ||
    key === 'point_figure'
  ) {
    return 'line';
  }
  return 'candles';
};

export const normalizeTimeValue = (value) => {
  if (value === null || value === undefined) return null;
  if (typeof value === 'object') {
    if ('timestamp' in value && Number.isFinite(Number(value.timestamp))) {
      return Number(value.timestamp);
    }
    if ('year' in value && 'month' in value && 'day' in value) {
      const date = Date.UTC(
        Number(value.year),
        Number(value.month) - 1,
        Number(value.day)
      );
      return Number.isFinite(date) ? Math.floor(date / 1000) : null;
    }
  }
  const num = Number(value);
  return Number.isFinite(num) ? num : null;
};

export const toTimestampMs = (time) => {
  if (time === null || time === undefined) return null;
  const num = Number(time);
  if (!Number.isFinite(num)) return null;
  return num > 1e12 ? Math.floor(num) : Math.floor(num * 1000);
};

export const registerTimeKeys = (map, timeValue, entry) => {
  if (timeValue === null || timeValue === undefined) return;
  const primary = Number(timeValue);
  if (!Number.isFinite(primary)) return;
  map.set(primary, entry);
  const ms = toTimestampMs(primary);
  if (ms !== null) map.set(ms, entry);
  const seconds = ms !== null ? Math.floor(ms / 1000) : Math.floor(primary);
  if (Number.isFinite(seconds)) map.set(seconds, entry);
};

export const toEpochSec = (value) => {
  if (value === null || value === undefined) return null;
  if (typeof value === 'number' && Number.isFinite(value)) {
    return value > 1e12 ? Math.floor(value / 1000) : value;
  }
  if (typeof value === 'object') {
    if ('timestamp' in value && Number.isFinite(Number(value.timestamp))) {
      return Number(value.timestamp);
    }
    if ('year' in value && 'month' in value && 'day' in value) {
      const date = Date.UTC(
        Number(value.year),
        Number(value.month) - 1,
        Number(value.day),
      );
      return Number.isFinite(date) ? Math.floor(date / 1000) : null;
    }
  }
  const num = Number(value);
  return Number.isFinite(num) ? num : null;
};

export const clamp = (value, min, max) => Math.max(min, Math.min(max, value));

export const binSearchByTime = (list, target, rightMost = false) => {
  const needle = toEpochSec(target) ?? 0;
  let lo = 0;
  let hi = list.length - 1;
  while (lo <= hi) {
    const mid = (lo + hi) >> 1;
    const val = toEpochSec(list[mid]?.time) ?? 0;
    if (val < needle) lo = mid + 1;
    else hi = mid - 1;
  }
  const idx = rightMost ? lo - 1 : lo;
  return clamp(idx, 0, Math.max(0, list.length - 1));
};

export const TF_SECONDS = {
  '1d': 86400,
  '5d': 432000,
  '1mth': 2592000,
  '3mth': 7776000,
  '6mth': 15552000,
  '1y': 31536000,
  all: Infinity,
};

export const resolvePriceScaleBorder = (expanded) =>
  expanded ? 'rgba(126, 134, 152, 0.65)' : 'rgba(48, 52, 64, 0.35)';
