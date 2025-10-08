import React from 'react';
import './ChartWrapper.css';

const ChartWrapper = ({ children, isExpanded = false }) => {
  return (
    <div className={`chart-border-wrapper ${isExpanded ? 'expanded' : ''}`}>
      {/* Основной контент графика без всяких границ */}
      <div className={`chart-content ${isExpanded ? 'expanded' : ''}`}>
        {children}
      </div>
    </div>
  );
};

export default ChartWrapper;