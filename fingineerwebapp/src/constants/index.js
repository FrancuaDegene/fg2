export const API_TIMEOUTS = {
  DEFAULT: 10000,  // 10 сек — базовый таймаут
  SEARCH: 5000,    // 5 сек — поиск
  SOCKET: 20000,   // 20 сек — сокеты
};

// Базовый набор таймфреймов/диапазонов для оси X.
// Сейчас используется и как TIMEFRAMES (расширенный режим),
// и как RANGES (компактный режим). Позже здесь можно
// развести отдельные наборы (YTD/5Y/ALL и т.п.).
const BASE_TIMEFRAME_OPTIONS = [
  { id: '1d',   label: '1 день' },
  { id: '5d',   label: '5 дней' },
  { id: '1mth', label: '1 месяц' },
  { id: '3mth', label: '3 месяца' },
  { id: '6mth', label: '6 месяцев' },
  { id: '1y',   label: '1 год' },
];

export const CHART_CONFIG = {
  COLORS: {
    UP: '#26a69a',
    DOWN: '#ef5350',
    GRID: 'rgba(42, 46, 57, 0.10)',
    BACKGROUND: '#fff',
    TEXT: '#222',
  },
  INTERVALS: [
    { id: '1m',  label: '1 мин' },
    { id: '5m',  label: '5 мин' },
    { id: '15m', label: '15 мин' },
    { id: '1h',  label: '1 час' },
    { id: '4h',  label: '4 часа' },
    { id: '1d',  label: '1 день' },
  ],

  // TIMEFRAMES - то, что сейчас использует логика таймфреймов (расширенный режим).
  TIMEFRAMES: BASE_TIMEFRAME_OPTIONS,

  // RANGES — то же самое множество, но семантически "диапазоны" для компактного режима.
  // TODO: когда будем делать Variant A (YTD / 1Y / 5Y / ALL),
  // здесь можно будет завести отдельный массив под диапазоны.
  RANGES: BASE_TIMEFRAME_OPTIONS,
};

export const UI_CONFIG = {
  DEBOUNCE_DELAY: 300,     // задержка перед запросом
  MAX_SUGGESTIONS: 5,      // максимум подсказок
  NEWS_PER_PAGE: 10,       // новостей на страницу
  LOADING_TIMEOUT: 500,    // таймаут отображения загрузки
};

export const METRIC_EXPLANATIONS = {
  closingPrice: 'Цена закрытия за указанную дату, если она отличается от текущей котировки.',
  openingPrice: 'Цена открытия за указанную дату.',
  minPrice: 'Минимальная цена за выбранный период.',
  maxPrice: 'Максимальная цена за выбранный период.',
  peRatio: 'P/E ratio - отношение цены к прибыли на акцию.',
  pbRatio: 'P/B ratio - отношение цены к балансовой стоимости.',
  psRatio: 'P/S ratio - отношение цены к выручке.',
  evEbitda: 'EV/EBITDA - отношение стоимости компании к прибыли до уплаты процентов, налогов и амортизации.',
  netDebt: 'Чистый долг = общий долг минус денежные средства.',
  marketCap: 'Рыночная капитализация компании.',
};

// TF×Interval matrix (Compact uses RANGES semantics; Expanded uses TIMEFRAMES semantics)
// TODO: когда появится больше истории в БД — развести RANGES и TIMEFRAMES:
// RANGES: [1D, 5D, 1M, 3M, 6M, 1Y, YTD, 5Y, ALL]
// TIMEFRAMES: под "рабочие" оконные режимы.
export const TF_INTERVAL_MATRIX = {
  compact: {
    '1d': ['1m', '5m', '15m', '1h'],
    '5d': ['5m', '15m', '1h', '4h'],
    '1mth': ['15m', '1h', '4h', '1d'],
    '3mth': ['15m', '1h', '4h', '1d'],
    '6mth': ['15m', '1h', '4h', '1d'],
    '1y': ['15m', '1h', '4h'], // как в ТЗ
  },
  expanded: {
    '1d': ['1m', '5m', '15m', '1h'],
    '5d': ['1m', '5m', '15m', '1h'],
    '1mth': ['5m', '15m', '1h', '4h', '1d'],
    '3mth': ['15m', '1h', '4h', '1d'],
    '6mth': ['15m', '1h', '4h', '1d'],
    '1y': ['15m', '1h', '4h', '1d'], // как в ТЗ
  },
};

const ORDERED_INTERVALS = ['1m', '5m', '15m', '1h', '4h', '1d'];
const COUNTBACK_BASE_BY_TIMEFRAME = {
  '1d':   { '1m': 400,   '5m': 100,   '15m': 50,   '1h': 24,   '4h': 12,   '1d': 1 },
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
const COUNTBACK_PIXELS_PER_BAR = 3;
const MIN_COUNTBACK = 10;
const MAX_COUNTBACK = 5000;
const INTERVAL_SEC = {
  '1m': 60,
  '5m': 300,
  '15m': 900,
  '1h': 3600,
  '4h': 14400,
  '1d': 86400,
};

export function getAllowedIntervalsForTimeframe({ timeframe, mode }) {
  const resolvedMode = mode === 'expanded' ? 'expanded' : 'compact';
  const resolvedTimeframe = String(timeframe || '');
  return TF_INTERVAL_MATRIX?.[resolvedMode]?.[resolvedTimeframe] || ORDERED_INTERVALS;
}

export function fixIntervalForTimeframe({ timeframe, requested, mode }) {
  const m = mode === 'expanded' ? 'expanded' : 'compact';
  const tf = String(timeframe || '');
  const req = String(requested || '');
  const allowed = getAllowedIntervalsForTimeframe({ timeframe: tf, mode: m });
  if (allowed.includes(req)) return { forced: req, allowed };

  // nearest by ORDERED_INTERVALS index (fallback to first allowed)
  const reqIdx = Math.max(0, ORDERED_INTERVALS.indexOf(req));
  let best = allowed[0] || ORDERED_INTERVALS[0];
  let bestDist = Number.POSITIVE_INFINITY;
  for (const a of allowed) {
    const aIdx = ORDERED_INTERVALS.indexOf(a);
    if (aIdx < 0) continue;
    const dist = Math.abs(aIdx - reqIdx);
    if (dist < bestDist) {
      bestDist = dist;
      best = a;
    }
  }
  return { forced: best, allowed };
}

export function resolveCountBackByTimeframe(timeframe, interval, width) {
  const tfKey = String(timeframe || '');
  const normalizedInterval = ORDERED_INTERVALS.includes(interval) ? interval : '1m';
  const base = COUNTBACK_BASE_BY_TIMEFRAME?.[tfKey]?.[normalizedInterval];
  const safeBase = Number.isFinite(base)
    ? base
    : (DEFAULT_COUNTBACK_BY_INTERVAL[normalizedInterval] ?? 500);

  const numericWidth = Number(width) || 0;
  const maxVisible =
    numericWidth > 0 ? Math.floor(numericWidth / COUNTBACK_PIXELS_PER_BAR) : null;
  const widthDriven =
    Number.isFinite(maxVisible) && maxVisible > 0 ? maxVisible * 2 : null;

  let result = safeBase;
  if (Number.isFinite(widthDriven)) {
    result = Math.max(result, widthDriven);
  }

  let barsExpected = null;
  if (tfKey === '1d') {
    const sec = INTERVAL_SEC[normalizedInterval];
    if (Number.isFinite(sec) && sec > 0) {
      barsExpected = Math.ceil(86400 / sec);
      result = Math.min(result, barsExpected);
    }
  }

  result = Math.max(MIN_COUNTBACK, Math.min(MAX_COUNTBACK, result));

  if (process.env.NODE_ENV !== 'production') {
    console.debug('[FG][CB]', {
      tf: tfKey,
      interval: normalizedInterval,
      width: numericWidth,
      base,
      maxVisible,
      barsExpected,
      result,
    });
  }

  return result;
}
