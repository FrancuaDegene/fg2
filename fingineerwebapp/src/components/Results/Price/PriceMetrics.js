import React, { memo } from 'react';
import PriceItem from './PriceItem';
import './Price.css';

const PriceMetrics = ({
  metrics,
  selectedMetricKey,
  showMore,
  toggleShowMore,
  onMouseEnterInfoButton,
  onMouseLeaveInfoButton,
  onMouseMoveInfoButton
}) => {
  return (
    <div className="company-content">
      <div className="company-meta">
        {metrics.map(metric => (
          <PriceItem
            key={metric.key}
            label={metric.label}
            value={metric.value}
            metricKey={metric.key}
            onMouseEnterInfoButton={onMouseEnterInfoButton}
            onMouseLeaveInfoButton={onMouseLeaveInfoButton}
            onMouseMoveInfoButton={onMouseMoveInfoButton}
            isActive={selectedMetricKey === metric.key}
          />
        ))}
      </div>
      <button
        className="toggle-metrics-button"
        onClick={toggleShowMore}
        type="button"
      >
        {showMore ? "Скрыть" : "Показать ещё"}
      </button>
    </div>
  );
};

export default memo(PriceMetrics);