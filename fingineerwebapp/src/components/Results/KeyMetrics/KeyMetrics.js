import React from 'react';
import './KeyMetrics.css';

const KeyMetrics = ({ data }) => {
  if (!data) return null;

  return (
    <section className="key-indicators">
      <h3>Основные показатели</h3>
      <ul>
        <li><strong>Рыночная капитализация:</strong> {data.marketCap || '—'}</li>
        <li><strong>P/E Ratio (Цена/Прибыль):</strong> {data.peRatio || '—'}</li>
        <li><strong>Дивидендная доходность:</strong> {data.dividendYield || '—'}</li>
        <li><strong>Объем торгов:</strong> {data.volume || '—'}</li>
        <li><strong>52-недельный диапазон:</strong> {data.yearRange || '—'}</li>
      </ul>
    </section>
  );
};

export default React.memo(KeyMetrics);