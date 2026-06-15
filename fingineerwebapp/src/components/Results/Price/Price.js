import React, { useState, useEffect, useRef } from 'react';
import Tooltip from '../../Tooltip/Tooltip';
import PriceMetrics from './PriceMetrics';
import { METRIC_EXPLANATIONS } from '../../../constants';
import './Price.css';

const Price = ({ data }) => {
  // Используем реальные данные вместо моков
  const currentData = data || {};
  
  const [selectedMetricKey, setSelectedMetricKey] = useState(null);
  const [tooltipPosition, setTooltipPosition] = useState({ top: 0, left: 0 });
  const [showTimeout, setShowTimeout] = useState(null);
  const hideTimeoutRef = useRef(null);
  const hoverAreaRef = useRef({
    left: 0,
    top: 0,
    right: 0,
    bottom: 0
  });

  useEffect(() => {
    return () => {
      if (showTimeout) clearTimeout(showTimeout);
      if (hideTimeoutRef.current) clearTimeout(hideTimeoutRef.current);
    };
  }, [showTimeout]);

  const getValue = (key) => {
    if (currentData && currentData[key] !== undefined) return currentData[key];
    const aliases = {
      close: ['closingPrice', 'closePrice', 'close'],
      open: ['openingPrice', 'openPrice', 'open'],
      low: ['minPrice', 'lowPrice', 'low'],
      high: ['maxPrice', 'highPrice', 'high']
    };
    if (aliases[key]) {
      for (const alias of aliases[key]) {
        if (currentData && currentData[alias] !== undefined) return currentData[alias];
      }
    }
    return undefined;
  };

  const getFirstValue = (...keys) => {
    for (const key of keys) {
      const value = currentData?.[key];
      if (value !== undefined && value !== null && value !== '') {
        return value;
      }
    }
    return undefined;
  };

  const handleMouseEnterTooltip = (rect, key) => {
    if (hideTimeoutRef.current) {
      clearTimeout(hideTimeoutRef.current);
      hideTimeoutRef.current = null;
    }

    hoverAreaRef.current = {
      left: rect.left - 15,
      top: rect.top - 15,
      right: rect.right + 15,
      bottom: rect.bottom + 15
    };

    console.log('Button rect:', rect);

    const timeoutId = setTimeout(() => {
      setTooltipPosition({
        top: rect.top + (rect.height / 2), // Центрируем по вертикали
        left: rect.right + 10 // Справа от кнопки (небольшой отступ)
      });
      setSelectedMetricKey(key);
    }, 300);

    setShowTimeout(timeoutId);
  };

  const handleMouseLeaveTooltip = () => {
    hideTimeoutRef.current = setTimeout(() => {
      setSelectedMetricKey(null);
    }, 300);
  };

  const handleMouseMove = (e) => {
    if (
      e.clientX >= hoverAreaRef.current.left &&
      e.clientX <= hoverAreaRef.current.right &&
      e.clientY >= hoverAreaRef.current.top &&
      e.clientY <= hoverAreaRef.current.bottom
    ) {
      if (hideTimeoutRef.current) {
        clearTimeout(hideTimeoutRef.current);
        hideTimeoutRef.current = null;
      }
    }
  };

  const mainMetric = { label: "Цена", value: getValue('close'), key: "closingPrice" };
  const changeValue = getFirstValue('changePercent', 'dayChangePct', 'priceChangePercent', 'changePct', 'change');
  const metrics = [
    { label: "Откр.", value: getValue('open'), key: "openingPrice" },
    { label: "Макс.", value: getValue('high'), key: "maxPrice" },
    { label: "Мин.", value: getValue('low'), key: "minPrice" },
    { label: "Закр.", value: getValue('close'), key: "closingPrice" },
  ];

  const volumeValue = getFirstValue('volume', 'dayVolume');
  if (volumeValue !== undefined) {
    metrics.push({ label: "Объём", value: volumeValue, key: "volume" });
  }

  return (
    <div className="price-block">
      <PriceMetrics
        mainMetric={mainMetric}
        changeMetric={changeValue !== undefined ? { label: "Изменение", value: changeValue, key: "change" } : null}
        metrics={metrics}
        selectedMetricKey={selectedMetricKey}
        onMouseEnterInfoButton={handleMouseEnterTooltip}
        onMouseLeaveInfoButton={handleMouseLeaveTooltip}
        onMouseMoveInfoButton={handleMouseMove}
      />

      {selectedMetricKey && (
        <Tooltip
          text={METRIC_EXPLANATIONS[selectedMetricKey]}
          position={tooltipPosition}
          side="right"
        />
      )}
    </div>
  );
};

export default React.memo(Price);
