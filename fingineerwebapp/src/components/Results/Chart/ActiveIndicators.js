import React from 'react';
import { useChart } from './ChartContext';
import './ActiveIndicators.css';

const ActiveIndicators = () => {
  const { activeIndicators, toggleIndicatorVisibility, removeIndicator } = useChart();

  if (!activeIndicators || activeIndicators.length === 0) {
    return null;
  }

  return (
    <div className="indicators-simple-list">
      {activeIndicators.map((indicator) => (
        <div key={indicator.id} className="indicator-simple-item">
          <span 
            className="indicator-simple-name"
            style={{ color: indicator.color || '#2962ff' }}
          >
            {indicator.label || indicator.name || indicator.value}
          </span>
          <button 
            className="indicator-simple-hide" 
            onClick={() => toggleIndicatorVisibility(indicator.id)}
            title="Скрыть/Показать"
          >
            {indicator.visible !== false ? '👁️' : '🙈'}
          </button>
          <button 
            className="indicator-simple-remove" 
            onClick={() => removeIndicator(indicator.id)}
            title="Удалить"
          >
            ×
          </button>
        </div>
      ))}
    </div>
  );
};

export default ActiveIndicators;