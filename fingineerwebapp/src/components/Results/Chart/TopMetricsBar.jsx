import React, { memo, useEffect, useMemo, useRef, useState } from 'react';
import PropTypes from 'prop-types';
import { formatPrice, formatPercent, formatVolume } from '../../../utils/format';
import './TopMetricsBar.css';

const LABELS = {
  open: 'ОТКР',
  high: 'МАКС',
  low: 'МИН',
  close: 'ЗАКР',
  price: 'ЦЕНА',
  delta: 'Δ',
  volume: 'ОБЪЁМ',
  prev: 'ПРЕД.',
  time: 'ВРЕМЯ',
};

const PRICE_EPS = 1e-6;
const PCT_EPS = 0.005;

const joinClasses = (...args) => args.filter(Boolean).join(' ');

const toMs = (ts) => {
  if (ts === null || ts === undefined) return null;
  const num = Number(ts);
  if (!Number.isFinite(num)) return null;
  return String(ts).length > 10 ? num : num * 1000;
};

const formatTimeVariants = (ts) => {
  const ms = toMs(ts);
  if (ms === null) {
    return { full: '', short: '' };
  }
  const date = new Date(ms);
  try {
    const full = new Intl.DateTimeFormat('ru-RU', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    }).format(date);
    const short = new Intl.DateTimeFormat('ru-RU', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    }).format(date);
    return { full, short };
  } catch {
    return { full: '', short: '' };
  }
};

const TopMetricsBar = memo(function TopMetricsBar({
  isCandle,
  open,
  high,
  low,
  close,
  volume,
  prevClose,
  deltaAbs,
  deltaPct,
  direction,
  ts,
  state = {},
  flags = {},
}) {
  const { adjUsed, staleAdj, displayDecimals, priceEps = PRICE_EPS, pctEps = PCT_EPS } = flags || {};
  const decimals = typeof displayDecimals === 'number' ? displayDecimals : undefined;
  const hasHover = Boolean(state?.hasHover);

  const formatted = useMemo(() => {
    const priceValue = formatPrice(close, { decimals });
    const openValue = formatPrice(open, { decimals });
    const highValue = formatPrice(high, { decimals });
    const lowValue = formatPrice(low, { decimals });
    const volumeValue = formatVolume(volume);
    const prevValue = formatPrice(prevClose, { decimals });

    return {
      price: priceValue,
      open: openValue,
      high: highValue,
      low: lowValue,
      volume: volumeValue,
      prev: prevValue,
    };
  }, [close, open, high, low, volume, prevClose, decimals]);

  const hasDeltaValues =
    deltaAbs !== null && deltaAbs !== undefined && deltaPct !== null && deltaPct !== undefined && prevClose !== null;

  const deltaMagnitudeSignificant =
    hasDeltaValues && (Math.abs(deltaAbs || 0) > priceEps || Math.abs(deltaPct || 0) > pctEps);

  const deltaTone = deltaMagnitudeSignificant
    ? direction === 'up'
      ? 'up'
      : direction === 'down'
        ? 'down'
        : 'muted'
    : 'muted';

  const deltaSign = deltaTone === 'up' ? '+' : deltaTone === 'down' ? '−' : '';
  const deltaAbsLabel = hasDeltaValues
    ? `${deltaSign}${formatPrice(Math.abs(deltaAbs), { decimals })}`
    : '—';
  const deltaPctLabel = hasDeltaValues
    ? `${deltaSign}${formatPercent(Math.abs(deltaPct), { withSign: false })}`
    : '—';

  const { full: timeFullLabel, short: timeShortLabel } = useMemo(() => formatTimeVariants(ts), [ts]);
  const showTime = hasHover && Boolean(timeFullLabel);
  const showPrev = !hasHover && prevClose !== null && prevClose !== undefined;
  const showAdjBadge = Boolean(showPrev && adjUsed && !staleAdj);

  const motionSafeRef = useRef(true);
  useEffect(() => {
    if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') return undefined;
    const media = window.matchMedia('(prefers-reduced-motion: reduce)');
    const update = (event) => {
      motionSafeRef.current = !event.matches;
    };
    motionSafeRef.current = !media.matches;
    if (media.addEventListener) media.addEventListener('change', update);
    else media.addListener(update);
    return () => {
      if (media.removeEventListener) media.removeEventListener('change', update);
      else media.removeListener(update);
    };
  }, []);

  const prevValuesRef = useRef({ close: close ?? null, delta: deltaAbs ?? null });
  const [pulseState, setPulseState] = useState({ close: null, delta: null });

  useEffect(() => {
    if (!motionSafeRef.current) {
      prevValuesRef.current = { close, delta: deltaAbs };
      setPulseState((prev) => (prev.close === null && prev.delta === null ? prev : { close: null, delta: null }));
      return undefined;
    }

    const previous = prevValuesRef.current;
    let closeChanged = false;
    let deltaChanged = false;

    if (
      typeof close === 'number' &&
      typeof previous.close === 'number' &&
      Math.abs(close - previous.close) > priceEps
    ) {
      closeChanged = true;
    }
    if (
      typeof deltaAbs === 'number' &&
      typeof previous.delta === 'number' &&
      Math.abs(deltaAbs - previous.delta) > priceEps
    ) {
      deltaChanged = true;
    }

    prevValuesRef.current = { close, delta: deltaAbs };

    if (!closeChanged && !deltaChanged) {
      return undefined;
    }

    const nextState = {
      close: closeChanged ? (hasHover ? 'hover' : 'stream') : null,
      delta: deltaChanged ? (hasHover ? 'hover' : 'stream') : null,
    };

    setPulseState(nextState);
    const duration = hasHover ? 90 : 160;
    const timeout = window.setTimeout(() => {
      setPulseState({ close: null, delta: null });
    }, duration);
    return () => window.clearTimeout(timeout);
  }, [close, deltaAbs, hasHover, priceEps]);

  const renderItem = (
    key,
    label,
    value,
    { tone = 'neutral', extra, itemClassName, valueClassName, pulseType } = {}
  ) => {
    const toneClass =
      tone === 'up'
        ? 'tm-value--up'
        : tone === 'down'
          ? 'tm-value--down'
          : tone === 'muted'
            ? 'tm-value--muted'
            : null;

    const pulseClass = pulseType ? `tm-value--pulse-${pulseType}` : null;

    return (
      <span key={key} className={joinClasses('tm-item', itemClassName)}>
        {label && <span className="tm-label">{label}</span>}
        <span className={joinClasses('tm-value', valueClassName, toneClass, pulseClass)}>{value}</span>
        {extra && <span className="tm-extra">{extra}</span>}
      </span>
    );
  };

  const renderPrev = () => (
    <span key="prev" className="tm-item tm-item--prev">
      <span className="tm-label">{LABELS.prev}</span>
      <span className="tm-value tm-value--muted">{formatted.prev}</span>
      {showAdjBadge && <span className="tm-badge" aria-label="Adjusted">Adj</span>}
    </span>
  );

  const renderTime = () => (
    <span key="time" className="tm-item tm-item--time">
      <span className="tm-label">{LABELS.time}</span>
      <span className="tm-value tm-time tm-time--full">{timeFullLabel}</span>
      <span className="tm-value tm-time tm-time--short">{timeShortLabel}</span>
    </span>
  );

  const primaryGroup = [
    renderItem('close', LABELS.close, formatted.price, {
      valueClassName: 'tm-value--close',
      pulseType: pulseState.close,
    }),
    renderItem('delta', LABELS.delta, deltaAbsLabel, {
      tone: deltaTone,
      valueClassName: 'tm-value--delta',
      extra: deltaPctLabel !== '—' ? `(${deltaPctLabel})` : null,
      pulseType: pulseState.delta,
    }),
    renderItem('volume', LABELS.volume, formatted.volume, {
      itemClassName: 'tm-item--volume',
    }),
  ];

  const secondaryGroup = isCandle
    ? [
        renderItem('open', LABELS.open, formatted.open),
        renderItem('high', LABELS.high, formatted.high),
        renderItem('low', LABELS.low, formatted.low),
      ]
    : [];

  const tertiaryNode = showTime ? renderTime() : showPrev ? renderPrev() : null;

  return (
    <div className="top-metrics" aria-hidden="true" data-state={hasHover ? 'hover' : 'idle'}>
      {primaryGroup.length > 0 && (
        <div className="tm-group tm-group--primary">
          {primaryGroup}
        </div>
      )}

      {secondaryGroup.length > 0 && (
        <div className="tm-group tm-group--secondary">
          {secondaryGroup}
        </div>
      )}

      {tertiaryNode && (
        <div className="tm-group tm-group--tertiary" data-has-hover={showTime ? '1' : '0'}>
          {tertiaryNode}
        </div>
      )}
    </div>
  );
});

TopMetricsBar.propTypes = {
  isCandle: PropTypes.bool,
  open: PropTypes.number,
  high: PropTypes.number,
  low: PropTypes.number,
  close: PropTypes.number,
  volume: PropTypes.number,
  prevClose: PropTypes.number,
  deltaAbs: PropTypes.number,
  deltaPct: PropTypes.number,
  direction: PropTypes.oneOf(['up', 'down', 'flat']),
  ts: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),
  state: PropTypes.shape({
    hasHover: PropTypes.bool,
    source: PropTypes.string,
  }),
  flags: PropTypes.shape({
    adjUsed: PropTypes.bool,
    staleAdj: PropTypes.bool,
    displayDecimals: PropTypes.number,
    priceEps: PropTypes.number,
    pctEps: PropTypes.number,
  }),
};

TopMetricsBar.defaultProps = {
  isCandle: true,
  state: undefined,
  flags: undefined,
};

export default TopMetricsBar;
