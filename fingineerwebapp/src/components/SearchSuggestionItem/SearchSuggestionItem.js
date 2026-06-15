import React from 'react';
import PropTypes from 'prop-types';
import './SearchSuggestionItem.css';

const normalizeText = (value) => String(value || '').trim();
const normalizeMetaValue = (value) => normalizeText(value).toLowerCase();

const normalizeCurrencyLabel = (value) => {
  const currency = normalizeText(value).toUpperCase();

  if (!currency) return '';
  if (currency === 'SUR' || currency === 'RUR') return 'RUB';

  return currency;
};

const getInstrumentTypeLabelFromMetadata = ({ instrumentType, shareClass }) => {
  const type = normalizeMetaValue(instrumentType);
  const className = normalizeMetaValue(shareClass);

  if (type === 'share') {
    if (className === 'ordinary') return 'Акция обыкновенная';
    if (className === 'preferred') return 'Акция привилегированная';

    return 'Акция';
  }

  if (type === 'fund') return 'Фонд';
  if (type === 'index') return 'Индекс';
  if (type === 'bond') return 'Облигация';
  if (type === 'future') return 'Фьючерс';
  if (type === 'option') return 'Опцион';

  return '';
};

const getInstrumentTypeLabel = ({ instrumentType, shareClass }) => {
  return getInstrumentTypeLabelFromMetadata({ instrumentType, shareClass }) || 'Инструмент';
};

const getInstrumentTypeKey = ({ instrumentType, shareClass }) => {
  const type = normalizeMetaValue(instrumentType);
  const className = normalizeMetaValue(shareClass);

  if (type === 'share') {
    if (className === 'ordinary') return 'share-ordinary';
    if (className === 'preferred') return 'share-preferred';

    return 'share';
  }

  if (type === 'fund') return 'fund';
  if (type === 'index') return 'index';
  if (type === 'bond') return 'bond';
  if (type === 'future') return 'future';
  if (type === 'option') return 'option';

  return 'instrument';
};

const getFamilyBadgeLabel = (instrumentTypeKey) => {
  if (instrumentTypeKey.startsWith('share')) return 'акция';
  if (instrumentTypeKey === 'fund') return 'фонд';
  if (instrumentTypeKey === 'index') return 'индекс';
  if (instrumentTypeKey === 'bond') return 'облигация';
  if (instrumentTypeKey === 'future') return 'фьючерс';
  if (instrumentTypeKey === 'option') return 'опцион';

  return '';
};

const SearchSuggestionItem = ({ item, as: Component = 'div', className = '', onSelect }) => {
  const ticker = normalizeText(item?.ticker).toUpperCase();
  const displayName = normalizeText(item?.displayName || item?.company_name || item?.name) || ticker;
  const instrumentTypeKey = getInstrumentTypeKey({
    instrumentType: item?.instrumentType,
    shareClass: item?.shareClass,
  });
  const instrumentTypeLabel = getInstrumentTypeLabel({
    instrumentType: item?.instrumentType,
    shareClass: item?.shareClass,
  });
  const currencyLabel = normalizeCurrencyLabel(item?.currency);
  const metaLine = [
    instrumentTypeLabel,
    normalizeText(item?.country),
    normalizeText(item?.exchange),
    currencyLabel,
  ].filter(Boolean).join(' · ');
  const familyBadgeLabel = getFamilyBadgeLabel(instrumentTypeKey);

  return (
    <Component
      className={`search-suggestion-v1 search-suggestion-v1--${instrumentTypeKey} ${className}`.trim()}
      onClick={() => onSelect(ticker)}
    >
      <span className="search-suggestion-v1__badge" aria-hidden="true" />
      <span className="search-suggestion-v1__ticker">{ticker}</span>
      <span className="search-suggestion-v1__content">
        <span className="search-suggestion-v1__name">{displayName}</span>
        <span className="search-suggestion-v1__meta">{metaLine}</span>
      </span>
      {familyBadgeLabel && (
        <span className="search-suggestion-v1__type-badge">
          {familyBadgeLabel}
        </span>
      )}
    </Component>
  );
};

SearchSuggestionItem.propTypes = {
  item: PropTypes.shape({
    ticker: PropTypes.string,
    company_name: PropTypes.string,
    name: PropTypes.string,
    displayName: PropTypes.string,
    instrumentType: PropTypes.string,
    shareClass: PropTypes.string,
    country: PropTypes.string,
    exchange: PropTypes.string,
    currency: PropTypes.string,
    board: PropTypes.string,
    status: PropTypes.string,
    sourceTable: PropTypes.string,
  }).isRequired,
  as: PropTypes.elementType,
  className: PropTypes.string,
  onSelect: PropTypes.func.isRequired,
};

export default SearchSuggestionItem;
