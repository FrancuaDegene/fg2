import React from 'react';

function pct(n) {
  return `${(n ?? 0).toFixed(2)}%`;
}

export default function TrendMomentumWidget(props) {
  const trendD = (props.ema20D ?? 0) > (props.ema50D ?? 0) ? 'восходящий' : 'нисходящий';
  const deltaPct = props.prevClose
    ? ((props.price - props.prevClose) / props.prevClose) * 100
    : 0;
  const range = Math.max(1e-9, (props.dayHigh ?? 0) - (props.dayLow ?? 0));
  const nearHighPct = ((props.price - (props.dayLow ?? 0)) / range) * 100;

  return (
    <div style={{ fontSize: 12, lineHeight: 1.35 }}>
      <div>
        Тренд (D1): {trendD}, RSI(14): {props.rsi14D ?? '—'}
      </div>
      <div>Дневная Δ: {pct(deltaPct)}</div>
      <div>Позиция в диапазоне дня: {nearHighPct.toFixed(0)}%</div>
    </div>
  );
}
