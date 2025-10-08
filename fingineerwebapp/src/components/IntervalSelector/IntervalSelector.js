import PropTypes from 'prop-types';
import { CHART_CONFIG } from '../../constants';
import './IntervalSelector.css';

// Используем централизованные константы
const intervals = CHART_CONFIG.INTERVALS;

const IntervalSelector = ({ currentInterval, onSelectInterval }) => {
  const handleClick = (intervalId) => {
    console.log('[IntervalSelector] Нажат интервал:', intervalId);
    onSelectInterval(intervalId);
  };

  return (
    <div className="interval-selector-container">
      {intervals.map(interval => (
        <button
          key={interval.id}
          className={`interval-button ${currentInterval === interval.id ? 'active' : ''}`}
          onClick={() => handleClick(interval.id)}
        >
          {interval.label}
        </button>
      ))}
    </div>
  );
};


IntervalSelector.propTypes = {
  currentInterval: PropTypes.string.isRequired,
  onSelectInterval: PropTypes.func.isRequired,
};

export default IntervalSelector;
