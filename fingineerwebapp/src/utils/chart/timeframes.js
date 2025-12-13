const CHART_INTERVALS = Object.freeze(['1m', '5m', '15m', '1h', '4h', '1d']);

// матрица "TF × interval → ориентировочное кол-во баров"
// используется для расчёта countBack
const TF_MATRIX = {
  '1d':   { '1m': 400,   '5m': 100,   '15m': 50,   '1h': 24,   '4h': 12,   '1d': 1 },
  '3d':   { '1m': 1200,  '5m': 300,   '15m': 120,  '1h': 72,   '4h': 36,   '1d': 3 },
  '1w':   { '1m': 2400,  '5m': 600,   '15m': 240,  '1h': 120,  '4h': 60,   '1d': 5 },
  '1mth': { '1m': 6000,  '5m': 1500,  '15m': 600,  '1h': 300,  '4h': 150,  '1d': 20 },
  '3mth': { '1m': 18000, '5m': 4500,  '15m': 1800, '1h': 900,  '4h': 450,  '1d': 60 },
  '6mth': { '1m': 36000, '5m': 9000,  '15m': 3600, '1h': 1800, '4h': 900,  '1d': 120 },
  '1y':   { '1m': 72000, '5m': 18000, '15m': 7200, '1h': 3600, '4h': 1800, '1d': 250 },
};

const DEFAULT_COUNTBACK_BY_INTERVAL = {
  '1m': 400,
  '5m': 500,
  '15m': 500,
  '1h': 500,
  '4h': 400,
  '1d': 250,
};

const PIXELS_PER_BAR = 3;
const MIN_COUNTBACK = 10;

const DEFAULT_COMPACT_TF_BY_INTERVAL = {
  '1m': '1d',
  '5m': '3d',
  '15m': '3d',
  '1h': '1mth',
  '4h': '3mth',
  '1d': '6mth',
};

// упорядоченный список интервалов — нужен, чтобы выбирать "ближайший" допустимый
const ORDERED_INTERVALS = Object.freeze(['1m', '5m', '15m', '1h', '4h', '1d']);

// матрица допустимых интервалов по TF и режиму (compact / expanded)
const TF_INTERVAL_MATRIX = {
  compact: {
    '1d':   ['1m', '5m', '15m'],
    '3d':   ['1m', '5m', '15m'],
    '1w':   ['5m', '15m', '1h'],
    '1mth': ['5m', '15m', '1h'],
    '3mth': ['15m', '1h', '4h'],
    '6mth': ['15m', '1h', '4h'],
    '1y':   ['1h', '4h', '1d'],
  },
  expanded: {
    '1d':   ['1m', '5m', '15m', '1h'],
    '3d':   ['1m', '5m', '15m', '1h'],
    '1w':   ['1m', '5m', '15m', '1h'],
    '1mth': ['1m', '5m', '15m', '1h'],
    '3mth': ['5m', '15m', '1h', '4h', '1d'],
    '6mth': ['5m', '15m', '1h', '4h', '1d'],
    '1y':   ['15m', '1h', '4h', '1d'],
  },
  default: CHART_INTERVALS,
};


/**
 * guardIntervalForTimeframe — защищает от недопустимых сочетаний TF × interval.
 */
export function guardIntervalForTimeframe({ timeframe, interval, isExpanded }) {
  const tf = typeof timeframe === 'string' ? timeframe : '';
  const requested = CHART_INTERVALS.includes(interval) ? interval : '1m';
  const mode = isExpanded ? 'expanded' : 'compact';

  const matrixForMode = TF_INTERVAL_MATRIX[mode] || {};
  const allowed = matrixForMode[tf] || TF_INTERVAL_MATRIX.default;

  // допустимо?
  if (allowed.includes(requested)) {
    return { interval: requested, changed: false, reason: null };
  }

  // ищем ближайший интервал
  const requestedIdx = ORDERED_INTERVALS.indexOf(requested);
  let fallback = allowed[0];

  if (requestedIdx !== -1) {
    let best = allowed[0];
    let bestScore = Infinity;

    for (const candidate of allowed) {
      const idx = ORDERED_INTERVALS.indexOf(candidate);
      if (idx === -1) continue;
      const score = Math.abs(idx - requestedIdx);
      if (score < bestScore) {
        bestScore = score;
        best = candidate;
      }
    }

    fallback = best;
  }

  if (process.env.NODE_ENV !== 'production') {
    console.debug('[FG][UX][TFGuard]', {
      tf,
      requested,
      forced: fallback,
      mode,
      allowed,
    });
  }

  return { interval: fallback, changed: true, reason: 'notAllowed' };
}

function getDefaultCountBackByInterval(interval) {
  return DEFAULT_COUNTBACK_BY_INTERVAL[interval] ?? 500;
}

export function resolveCountBackByTimeframe(timeframe, interval, width) {
  const tfKey = timeframe && TF_MATRIX[timeframe] ? timeframe : null;
  const normalizedInterval = CHART_INTERVALS.includes(interval) ? interval : '1m';
  let base = tfKey ? TF_MATRIX[tfKey]?.[normalizedInterval] : undefined;

  if (!Number.isFinite(base)) {
    base = getDefaultCountBackByInterval(normalizedInterval);
  }

  const numericWidth = Number(width) || 0;
  if (numericWidth > 0) {
    const maxVisible = Math.floor(numericWidth / PIXELS_PER_BAR);
    if (maxVisible > 0) {
      return Math.max(MIN_COUNTBACK, Math.min(base, maxVisible * 2));
    }
  }

  return Math.max(MIN_COUNTBACK, base);
}

export function resolveTimeframeForCompact(interval) {
  const normalized = CHART_INTERVALS.includes(interval) ? interval : '1m';
  const tf = DEFAULT_COMPACT_TF_BY_INTERVAL[normalized];
  if (tf && TF_MATRIX[tf]) return tf;
  return CHART_TIMEFRAMES[0];
}

export const CHART_TIMEFRAMES = Object.freeze(Object.keys(TF_MATRIX));
export { CHART_INTERVALS };
