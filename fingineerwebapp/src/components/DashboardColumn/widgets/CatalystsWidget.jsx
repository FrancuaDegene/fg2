import React from 'react';

export default function CatalystsWidget({ nextDividend, news }) {
  const divText = nextDividend
    ? `${nextDividend.amount} ₽ • ${nextDividend.exDate} (~${nextDividend.yieldPct}%)`
    : 'не ожидаются';

  return (
    <div style={{ fontSize: 12, lineHeight: 1.35 }}>
      <div>Дивиденды: {divText}</div>
      <div>Новости (72ч): {news?.count72h ?? 0}</div>
      {news?.items?.[0] && <div style={{ opacity: 0.8 }}>• {news.items[0].title}</div>}
    </div>
  );
}
