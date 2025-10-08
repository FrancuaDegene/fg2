import React, { useState, useEffect, useRef } from 'react';
import Tooltip from '../../Tooltip/Tooltip';
import PriceMetrics from './PriceMetrics';
import { formatPrice, formatPercent } from '../../../utils/formatters';
import { METRIC_EXPLANATIONS } from '../../../constants';
import './Price.css';

const Price = ({ data }) => {
  // Используем реальные данные вместо моков
  const currentData = data || {};
  
  const [showMore, setShowMore] = useState(false);
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

  const metrics = [
    { label: "Цена закрытия", value: getValue('close'), key: "closingPrice" },
    { label: "Цена открытия", value: getValue('open'), key: "openingPrice" },
    { label: "Минимальная цена", value: getValue('low'), key: "minPrice" },
    { label: "Максимальная цена", value: getValue('high'), key: "maxPrice" },
    ...(showMore ? [
      { label: "P/E", value: getValue('peRatio'), key: "peRatio" },
      { label: "P/B", value: getValue('pbRatio'), key: "pbRatio" },
      { label: "P/S", value: getValue('psRatio'), key: "psRatio" },
      { label: "EV/EBITDA", value: getValue('evEbitda'), key: "evEbitda" },
      { label: "Чистый долг", value: getValue('netDebt'), key: "netDebt" },
      { label: "Рыночная капитализация", value: getValue('marketCap'), key: "marketCap" },
    ] : []),
  ];

  return (
    <div className="price-block">
      <PriceMetrics
        metrics={metrics}
        selectedMetricKey={selectedMetricKey}
        showMore={showMore}
        toggleShowMore={() => setShowMore(prev => !prev)}
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