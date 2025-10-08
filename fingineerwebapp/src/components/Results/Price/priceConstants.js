export const MOCK_DATA = {
    companyName: '"МКБ" ПАО ао',
    ticker: 'CBOM',
    closingPrice: 9.594,
    openingPrice: 9.45,
    minPrice: 9.3,
    maxPrice: 9.8,
    peRatio: 24.3,
    pbRatio: 5.7,
    psRatio: 7.2,
    evEbitda: 18.4,
    netDebt: 1250000000,
    marketCap: 2450000000000
  };
  
  export const EXPLANATIONS = {
    closingPrice: "Цена закрытия — последняя цена перед завершением торгов.",
    openingPrice: "Цена открытия — цена первой сделки торгового дня.",
    minPrice: "Минимальная цена за сессию.",
    maxPrice: "Максимальная цена за сессию.",
    peRatio: "P/E — цена акции к прибыли на акцию.",
    pbRatio: "P/B — цена акции к балансовой стоимости.",
    psRatio: "P/S — цена акции к выручке.",
    evEbitda: "EV/EBITDA — оценка компании к операционной прибыли.",
    netDebt: "Чистый долг = долги − денежные средства.",
    marketCap: "Рыночная капитализация — стоимость всех акций."
  };
  
  export const formatValue = (val) => {
    if (val === null || val === undefined) return '—';
    if (typeof val === 'number') {
      if (val >= 1000000000) return (val / 1000000000).toFixed(2) + ' млрд';
      if (val >= 1000000) return (val / 1000000).toFixed(2) + ' млн';
      return val.toLocaleString('ru-RU', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
      });
    }
    return val;
  };