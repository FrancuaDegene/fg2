import React from 'react';

function fmtInt(n) {
  return (n ?? 0).toLocaleString('ru-RU');
}

function mln(n) {
  return Math.round((n ?? 0) / 1e6);
}

export default function LiquidityWidget({ avgVol20d, avgTurnover20dRub, todayVol, todayTurnoverRub }) {
  const ratio = avgVol20d ? (todayVol ?? 0) / avgVol20d : 0;
  return (
    <div style={{ fontSize: 12, lineHeight: 1.35 }}>
      <div>Сред. объём (20д): {fmtInt(avgVol20d)} шт</div>
      <div>Оборот (ср.): ~{mln(avgTurnover20dRub)} млн ₽/день</div>
      <div>Сегодня: {fmtInt(todayVol)} шт ({(ratio * 100).toFixed(0)}% от ср.)</div>
    </div>
  );
}
