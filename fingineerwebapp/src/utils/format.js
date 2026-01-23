// Utility formatters for prices, percents, and volumes
// Keep output simple and fast; UI decides where to place currency labels

const clamp = (v, min, max) => Math.max(min, Math.min(max, v));

export function formatPrice(value, { decimals, locale } = {}) {
  if (value === null || value === undefined || !Number.isFinite(Number(value))) return '—';
  const n = Number(value);
  const d = typeof decimals === 'number'
    ? clamp(decimals, 0, 6)
    : n === 0
      ? 2
      : n < 1
        ? 4
        : n < 100
          ? 2
          : n < 1000
            ? 1
            : 0;
  try {
    return new Intl.NumberFormat(locale || 'ru-RU', {
      minimumFractionDigits: d,
      maximumFractionDigits: d,
    }).format(n);
  } catch {
    return n.toFixed(d);
  }
}

export function formatPercent(value, { withSign = true, locale } = {}) {
  if (value === null || value === undefined || !Number.isFinite(Number(value))) return '—';
  const n = Number(value);
  const abs = Math.abs(n);
  const d = 2;
  const sign = withSign ? (n > 0 ? '+' : n < 0 ? '−' : '') : '';
  const body = (() => {
    try {
      return new Intl.NumberFormat(locale || 'ru-RU', {
        minimumFractionDigits: d,
        maximumFractionDigits: d,
      }).format(abs);
    } catch {
      return abs.toFixed(d);
    }
  })();
  return `${sign}${body}%`;
}

export function formatVolume(value, { locale, compact = true } = {}) {
  if (value === null || value === undefined || !Number.isFinite(Number(value))) return '—';
  const n = Number(value);
  if (!compact) {
    try {
      return new Intl.NumberFormat(locale || 'ru-RU').format(n);
    } catch {
      return String(n);
    }
  }
  const abs = Math.abs(n);
  const units = [
    { v: 1e9, s: 'B' },
    { v: 1e6, s: 'M' },
    { v: 1e3, s: 'K' },
  ];
  for (const u of units) {
    if (abs >= u.v) {
      const num = n / u.v;
      const d = abs < u.v * 10 ? 2 : abs < u.v * 100 ? 1 : 0;
      try {
        const formatted = new Intl.NumberFormat(locale || 'ru-RU', {
          minimumFractionDigits: d,
          maximumFractionDigits: d,
        }).format(num);
        return `${formatted}\u202F${u.s}`;
      } catch {
        return `${num.toFixed(d)}\u202F${u.s}`;
      }
    }
  }
  try {
    return new Intl.NumberFormat(locale || 'ru-RU').format(n);
  } catch {
    return `${n}`;
  }
}

export function formatDateTs(ts, { locale } = {}) {
  if (!Number.isFinite(Number(ts))) return '';
  try {
    const numeric = Number(ts);
    const ms = String(ts).length > 10 ? numeric : numeric * 1000;
    const d = new Date(ms);
    return d.toLocaleString(locale || 'ru-RU');
  } catch {
    return '';
  }
}
