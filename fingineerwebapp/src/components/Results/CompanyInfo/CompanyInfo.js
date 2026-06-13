import React from 'react';
import { motion } from 'framer-motion';
import './CompanyInfo.css';

const EMPTY_VALUES = new Set(['', 'N/A', 'n/a', 'NA', 'na', '—', 'вЂ”', '-', 'null', 'undefined']);

const normalizeText = (value) => String(value ?? '').trim();

const isUsefulValue = (value) => {
  const normalized = normalizeText(value);
  return normalized && !EMPTY_VALUES.has(normalized);
};

const getFirstUsefulValue = (...values) => {
  for (const value of values) {
    if (isUsefulValue(value)) {
      return normalizeText(value);
    }
  }

  return '';
};

const isTechnicalCompanyName = (value, ticker) => {
  const normalized = normalizeText(value);
  const normalizedTicker = normalizeText(ticker);

  if (!isUsefulValue(normalized)) {
    return true;
  }

  const lowered = normalized.toLowerCase();
  return (
    lowered.includes('название компании для') ||
    lowered.includes('company name for') ||
    lowered.includes('инструмент для') ||
    lowered === normalizedTicker.toLowerCase()
  );
};

const getDisplayCompanyName = (companyName, ticker) => {
  if (isTechnicalCompanyName(companyName, ticker)) {
    return ticker || '—';
  }

  return normalizeText(companyName);
};

const getSectorValue = (sectorLabel, sectorCode) => (
  getFirstUsefulValue(sectorLabel, sectorCode) || '—'
);

const getMarketValue = (boardLabel, board) => (
  getFirstUsefulValue(boardLabel, board) || '—'
);

const formatDataTimestamp = (date, time) => {
  const dateValue = isUsefulValue(date) ? normalizeText(date).split(' ')[0] : '';
  const timeValue = isUsefulValue(time) ? normalizeText(time) : '';
  const freshness = [dateValue, timeValue].filter(Boolean).join(' ');

  return freshness ? `Данные на: ${freshness}` : '—';
};

const CompanyInfo = ({ data }) => {
  const ticker = getFirstUsefulValue(data?.ticker);
  const companyName = getDisplayCompanyName(data?.companyName, ticker);
  const exchangeLabel = getFirstUsefulValue(data?.exchangeLabel);
  const tickerLine = [ticker, exchangeLabel].filter(Boolean).join(' • ') || ticker || '—';
  const sector = getSectorValue(data?.sectorLabel, data?.sectorCode);
  const market = getMarketValue(data?.boardLabel, data?.board);
  const dataTimestamp = formatDataTimestamp(
    data?.marketDataDate || data?.date,
    data?.marketDataTime || data?.time,
  );
  const logoUrl = getFirstUsefulValue(data?.logoUrl, data?.logo);

  const metaRows = [
    { icon: '◇', label: 'Сектор', value: sector },
    { icon: '◎', label: 'Рынок', value: market },
    { icon: '◷', label: 'Данные на', value: dataTimestamp },
  ];

  return (
    <motion.div
      className="company-card company-identity-card"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      key={ticker || data?.companyName}
    >
      <div className="company-identity-main">
        <div className="company-section-label">
          <span className="company-section-icon" aria-hidden="true">▥</span>
          <span>Инфо о компании</span>
        </div>

        <div className="company-name-block">
          <h1 className="company-title">{companyName}</h1>
          <div className="company-ticker-line">{tickerLine}</div>
        </div>

        <div className="company-meta company-identity-meta">
          {metaRows.map((item) => (
            <div className="meta-item company-identity-meta__item" key={item.label}>
              <span className="company-identity-meta__icon" aria-hidden="true">{item.icon}</span>
              <span className="company-identity-meta__value">{item.value}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="company-identity-logo-slot" aria-label="Место для логотипа эмитента">
        {logoUrl ? (
          <img src={logoUrl} alt="" className="company-identity-logo" />
        ) : (
          <span className="company-identity-logo-placeholder" aria-hidden="true" />
        )}
      </div>
    </motion.div>
  );
};

export default React.memo(CompanyInfo);
