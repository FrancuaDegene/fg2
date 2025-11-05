import React from 'react';

export default function VolatilityRiskWidget({ atr14Abs, atr14Pct, todayRangePct }) {
  const level = (atr14Pct ?? 0) < 2 ? 'Low' : (atr14Pct ?? 0) > 5 ? 'High' : 'Normal';
  return (
    <div style={{ fontSize: 12, lineHeight: 1.35 }}>
      <div>
        ATR(14): {(atr14Abs ?? 0).toFixed(2)} ₽ ({(atr14Pct ?? 0).toFixed(2)}%) — {level}
      </div>
      <div>Диапазон сегодня: {(todayRangePct ?? 0).toFixed(2)}%</div>
      <div>Реком. стоп ≈ {(atr14Abs ?? 0).toFixed(0)} ₽ (~1 ATR)</div>
    </div>
  );
}
