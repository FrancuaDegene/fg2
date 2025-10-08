import React, {  useEffect  } from 'react';
import PropTypes from 'prop-types';
import './Dividends.css';

const Dividends = ({ dividends = [], query = '', fetchDividends = () => {} }) => {
  useEffect(() => {
    if (query) {
      fetchDividends(query);
    }
  }, [query, fetchDividends]);

  if (!dividends || dividends.length === 0) {
    return null;
  }

  return (
    <section className="dividends-info">
      <h3>Дивиденды</h3>
      {dividends.map((company, index) => {
        const years = [2018, 2019, 2020];
        return (
          <div key={index}>
            <h4>{company.company_name || "Компания"}</h4>
            <dl>
              {years.map(year => (
                <React.Fragment key={year}>
                  <dt>Средняя цена ({year}):</dt>
                  <dd>{company[`median_price_${year}`] || '—'}</dd>
                  <dt>Доходность ({year}):</dt>
                  <dd>{company[`yield_${year}`] || '—'}</dd>
                </React.Fragment>
              ))}
            </dl>
            <div className="dividend-links">
              <a href={company.dividend_history} target="_blank" rel="noopener noreferrer">
                История дивидендов
              </a>
              <a href={company.dividend_policy} target="_blank" rel="noopener noreferrer">
                Дивидендная политика
              </a>
            </div>
          </div>
        );
      })}
    </section>
  );
};

// PropTypes остаются для документации, но не для значений по умолчанию
Dividends.propTypes = {
  dividends: PropTypes.array,
  query: PropTypes.string,
  fetchDividends: PropTypes.func
};

export default React.memo(Dividends); 