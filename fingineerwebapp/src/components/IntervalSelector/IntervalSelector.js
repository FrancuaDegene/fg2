import PropTypes from 'prop-types';
import React, { useEffect } from 'react';
import { CHART_CONFIG } from '../../constants';
import { fixIntervalForTimeframe } from '../../lib/timeframes';
import './IntervalSelector.css';

// Use centralized constants
const intervals = CHART_CONFIG.INTERVALS;

const IntervalSelector = ({ currentInterval, currentTimeframe, onSelectInterval }) => {
  // 🔍 временный диагностический лог — проверяем факт монтирования компонента
  useEffect(() => {
    console.log('[FG][UX][IntervalSelector] mounted', {
      currentInterval,
      currentTimeframe,
    });
  }, [currentInterval, currentTimeframe]);

  const handleClick = (intervalId) => {
    const fixed = fixIntervalForTimeframe(intervalId, currentTimeframe);
    console.log('[FG][UX][TFGuard]', {
      userInterval: intervalId,
      fixedInterval: fixed,
      tf: currentTimeframe,
    });
    onSelectInterval(fixed);
  };

  return (
    <div className="interval-selector-container">
      {intervals.map((interval) => (
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
  currentTimeframe: PropTypes.string.isRequired,
  onSelectInterval: PropTypes.func.isRequired,
};

export default IntervalSelector;
