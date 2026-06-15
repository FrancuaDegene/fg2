import React from 'react';
import './KeyMetrics.css';

const KeyMetrics = ({ data }) => {
  if (!data) return null;

  return (
    <section className="key-indicators">
      <h3>Ключевые показатели</h3>
      <ul>
        <li><strong>Капитализация</strong> <span>{data.marketCap || '—'}</span></li>
        <li><strong>P/E</strong> <span>{data.peRatio || '—'}</span></li>
        <li><strong>Див. доходность</strong> <span>{data.dividendYield || '—'}</span></li>
        <li><strong>Объём</strong> <span>{data.volume || '—'}</span></li>
        <li><strong>52 недели</strong> <span>{data.yearRange || '—'}</span></li>
      </ul>
    </section>
  );
};

export default React.memo(KeyMetrics);
