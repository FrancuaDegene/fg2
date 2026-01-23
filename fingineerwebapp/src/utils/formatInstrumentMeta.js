const MSK_TIMEZONE = 'Europe/Moscow';
const DAY_MS = 24 * 60 * 60 * 1000;

const CURRENCY_SYMBOLS = {
  RUB: '₽',
  RUR: '₽',
  USD: '$',
  EUR: '€',
  GBP: '£',
  CHF: '₣',
  JPY: '¥',
  CNY: '¥',
};

const INSTRUMENT_LABELS = {
  stock: 'Акция',
  share: 'Акция',
  bond: 'Облигация',
  bonds: 'Облигация',
  future: 'Фьючерс',
  futures: 'Фьючерс',
  option: 'Опцион',
  etf: 'ETF',
  fx: 'FX',
};

const SESSION_LABELS = {
  morning: { short: 'Утр.', full: 'Утренняя' },
  main: { short: 'Осн.', full: 'Основная' },
  evening: { short: 'Веч.', full: 'Вечерняя' },
  closed: { short: 'Закр.', full: 'Закрыто' },
};

const AUCTION_WINDOWS_MINUTES = [
  // 09:50–10:00 МСК
  { from: 9 * 60 + 50, to: 10 * 60 },
  // 18:45–19:00 МСК
  { from: 18 * 60 + 45, to: 19 * 60 },
];

const toNumber = (value) => {
  if (value === null || value === undefined) return null;
  const num = Number(value);
  return Number.isFinite(num) ? num : null;
};

const clamp = (value, min, max) => Math.min(Math.max(value, min), max);

const abbreviate = (value, maxLength = 40) => {
  if (!value) return '';
  const str = String(value).trim();
  if (str.length <= maxLength) return str;
  return `${str.slice(0, maxLength - 1).trimEnd()}…`;
};

const getCurrencySymbol = (currency) => {
  if (!currency) return '';
  const code = String(currency).toUpperCase();
  return CURRENCY_SYMBOLS[code] || code;
};

const computeDecimalsFromTick = (tickSize) => {
  const tick = toNumber(tickSize);
  if (tick === null || tick <= 0) return 0;

  let decimals = 0;
  let current = tick;
  while (!Number.isInteger(current) && decimals < 8) {
    current *= 10;
    decimals += 1;
  }
  return decimals;
};

const formatTick = (tickSize, decimals) => {
  const tick = toNumber(tickSize);
  if (tick === null) return '';
  const precision = clamp(Number.isInteger(decimals) ? decimals : computeDecimalsFromTick(tick), 0, 8);
  return tick.toFixed(precision);
};

const formatInteger = (value) => {
  const number = toNumber(value);
  if (number === null) return '';
  return new Intl.NumberFormat('ru-RU').format(Math.round(number));
};

const formatAmount = (value) => {
  const number = toNumber(value);
  if (number === null) return null;
  const fraction = Math.abs(number) < 1 ? 2 : 0;
  return new Intl.NumberFormat('ru-RU', {
    minimumFractionDigits: fraction,
    maximumFractionDigits: 2,
  }).format(number);
};

const toDate = (value) => {
  if (!value && value !== 0) return null;
  if (value instanceof Date) return Number.isFinite(value.getTime()) ? value : null;
  const date = new Date(value);
  return Number.isFinite(date.getTime()) ? date : null;
};

const getMskMinutesFromMidnight = (dateLike) => {
  const date = toDate(dateLike || Date.now());
  if (!date) return null;

  const parts = new Intl.DateTimeFormat('ru-RU', {
    timeZone: MSK_TIMEZONE,
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  }).formatToParts(date);

  const hour = Number(parts.find((p) => p.type === 'hour')?.value ?? '0');
  const minute = Number(parts.find((p) => p.type === 'minute')?.value ?? '0');
  return hour * 60 + minute;
};

const isWithinAuctionWindow = (dateLike, explicitAuction) => {
  if (explicitAuction && explicitAuction !== 'none') {
    return true;
  }

  const minutes = getMskMinutesFromMidnight(dateLike);
  if (minutes === null) return false;

  return AUCTION_WINDOWS_MINUTES.some(({ from, to }) => minutes >= from && minutes < to);
};

const formatDateShort = (date) => {
  if (!date) return '';
  return new Intl.DateTimeFormat('ru-RU', {
    timeZone: MSK_TIMEZONE,
    day: '2-digit',
    month: '2-digit',
  }).format(date);
};

const diffDays = (targetDate, baseDate) => {
  const target = toDate(targetDate);
  const base = toDate(baseDate || Date.now());
  if (!target || !base) return null;

  const diff = target.getTime() - base.getTime();
  return Math.floor(diff / DAY_MS);
};

const normalizeSession = (sessionCode, { halted, auction }, now) => {
  const code = (sessionCode || '').toLowerCase();
  const normalized = SESSION_LABELS[code] || SESSION_LABELS.closed;

  const insideAuction = isWithinAuctionWindow(now, auction);
  const isClosed = code === 'closed';

  let tone = 'default';
  if (halted) tone = 'danger';
  else if (isClosed) tone = 'muted';

  return {
    code: code || 'unknown',
    labelShort: normalized.short,
    labelFull: normalized.full,
    isClosed,
    hasAuction: Boolean(insideAuction),
    halted: Boolean(halted),
    tone,
  };
};

const determineInstrumentLabel = (rawType) => {
  if (!rawType) return INSTRUMENT_LABELS.stock;
  const key = String(rawType).toLowerCase();
  return INSTRUMENT_LABELS[key] || INSTRUMENT_LABELS.stock;
};

export function formatInstrumentMeta(rawMeta = {}, options = {}) {
  const now = options.now || Date.now();
  const instrumentType = (rawMeta.instrumentType || 'stock').toLowerCase();
  const instrumentLabel = determineInstrumentLabel(instrumentType);

  const symbol = (rawMeta.symbol || '').toUpperCase();
  const exchange = (rawMeta.exchange || '').toUpperCase();
  const exchangeShort = rawMeta.exchangeShort ? String(rawMeta.exchangeShort).toUpperCase() : exchange;
  const secName = abbreviate(rawMeta.secName || rawMeta.instrumentName || '', 40);
  const logoUrl = rawMeta.logoUrl || null;

  const board = rawMeta.board ? String(rawMeta.board).toUpperCase() : '';
  const currencyCode = rawMeta.currency ? String(rawMeta.currency).toUpperCase() : 'RUB';
  const currencySymbol = getCurrencySymbol(currencyCode);
  const lotSize = toNumber(rawMeta.lotSize) || 1;
  const tickSize = toNumber(rawMeta.tickSize);
  const displayDecimalsRaw = Number.isFinite(rawMeta.displayDecimals) ? Number(rawMeta.displayDecimals) : null;

  const decimalsFromTick = tickSize ? computeDecimalsFromTick(tickSize) : 0;
  const displayDecimals = displayDecimalsRaw !== null ? displayDecimalsRaw : decimalsFromTick;
  const showPrecision = displayDecimalsRaw !== null && displayDecimalsRaw !== decimalsFromTick;

  const chipsPrimary = [];
  if (board) {
    chipsPrimary.push({ key: 'board', text: board });
  }
  if (currencySymbol) {
    chipsPrimary.push({ key: 'currency', text: currencySymbol });
  }
  if (lotSize > 1) {
    chipsPrimary.push({ key: 'lot', text: `Лот ${formatInteger(lotSize)}` });
  }
  if (tickSize !== null && tickSize !== undefined) {
    chipsPrimary.push({ key: 'tick', text: `Шаг ${formatTick(tickSize, decimalsFromTick)}` });
  }
  if (showPrecision) {
    chipsPrimary.push({ key: 'precision', text: `Точн. ${displayDecimals}` });
  }

  const exDivDate = rawMeta.exDivDate || rawMeta.divNextDate;
  const exDivAmount = rawMeta.divNextAmount;
  const exDateObject = toDate(exDivDate);
  const divDiffDays = diffDays(exDivDate, now);
  const divSoon = exDateObject && divDiffDays !== null && divDiffDays >= 0 && divDiffDays <= 14;
  const divAmountFormatted = divSoon ? formatAmount(exDivAmount) : null;
  const divInfo = divSoon
    ? {
        amount: toNumber(exDivAmount),
        amountFormatted: divAmountFormatted,
        currencySymbol,
        date: exDateObject,
        dateShort: formatDateShort(exDateObject),
      }
    : null;

  const rawSector = rawMeta.sector ? String(rawMeta.sector) : '';
  const sectorName = rawMeta.sectorName ? String(rawMeta.sectorName) : '';
  const industry = rawMeta.industry ? String(rawMeta.industry) : '';
  const sector = (sectorName || industry || rawSector || '').trim();
  const country = rawMeta.country ? String(rawMeta.country) : '';

  const chipsSecondary = [];
  if (!divInfo) {
    if (sector) chipsSecondary.push({ key: 'sector', text: sector });
    if (country) chipsSecondary.push({ key: 'country', text: country });
  }

  const sessionInfo = normalizeSession(rawMeta.session, {
    halted: rawMeta.halted,
    auction: rawMeta.auction,
  }, now);

  return {
    identity: {
      symbol,
      exchange: exchangeShort,
      exchangeFull: exchange,
      name: secName,
      instrumentType,
      instrumentLabel,
      logoUrl,
    },
    chipsPrimary,
    chipsSecondary,
    divInfo,
    currencySymbol,
    lotSize,
    tickSize,
    displayDecimals,
    decimalsFromTick,
    session: sessionInfo,
    instrumentType,
    raw: {
      board,
      currency: currencyCode,
      sector,
      sectorOriginal: rawSector,
      sectorName,
      industry,
      country,
      exDivDate: exDateObject,
      exDivAmount,
    },
  };
}

export default formatInstrumentMeta;
