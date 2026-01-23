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

export function fixIntervalForTimeframe({ timeframe, requested, mode }) {
  const m = mode === 'expanded' ? 'expanded' : 'compact';
  const tf = String(timeframe || '');
  const req = String(requested || '');
  const allowed = TF_INTERVAL_MATRIX?.[m]?.[tf] || ORDERED_INTERVALS;
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
