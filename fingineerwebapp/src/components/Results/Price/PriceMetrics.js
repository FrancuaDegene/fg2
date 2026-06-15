import React, { memo } from 'react';
import PriceItem from './PriceItem';
import './Price.css';

const PriceMetrics = ({
  mainMetric,
  changeMetric,
  metrics,
  selectedMetricKey,
  onMouseEnterInfoButton,
  onMouseLeaveInfoButton,
  onMouseMoveInfoButton
}) => {
  return (
    <div className="company-content">
      <div className="price-snapshot">
        <div className="price-snapshot__label">{mainMetric?.label || 'Цена'}</div>
        <div className="price-snapshot__value">{mainMetric?.value ?? '—'}</div>
        {changeMetric && (
          <div className="price-snapshot__change">
            {changeMetric.value}
          </div>
        )}
      </div>

      <div className="company-meta price-details-grid">
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
    </div>
  );
};

export default memo(PriceMetrics);
