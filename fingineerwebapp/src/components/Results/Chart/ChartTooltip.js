import React, { useState, useEffect, useRef } from 'react';
import './ChartTooltip.css';

const ChartTooltip = ({ data, isVisible, position, containerRef }) => {
  const [tooltipPosition, setTooltipPosition] = useState({ x: 0, y: 0 });
  const tooltipRef = useRef(null);

  useEffect(() => {
    if (isVisible && position && tooltipRef.current && containerRef?.current) {
      const tooltip = tooltipRef.current;
      const containerRect = containerRef.current.getBoundingClientRect();
      const rect = tooltip.getBoundingClientRect();

      // Теперь координаты считаем относительно контейнера
      let x = position.x + 10;
      let y = position.y - rect.height / 2;

      // Ограничения внутри контейнера
      if (x + rect.width > containerRect.width - 5) {
        x = position.x - rect.width - 10;
      }
      if (y < 5) y = 5;
      if (y + rect.height > containerRect.height - 5) {
        y = containerRect.height - rect.height - 5;
      }

      setTooltipPosition({ x, y });
    }
  }, [isVisible, position, containerRef]);

  if (!isVisible || !data) return null;

  const formatDate = (timestamp) => {
    const date = new Date(timestamp * 1000);
    return date.toLocaleString('ru-RU', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const formatPrice = (price) => parseFloat(price).toFixed(2);

  return (
    <div
      ref={tooltipRef}
      className="chart-tooltip"
      style={{
        left: `${tooltipPosition.x}px`,
        top: `${tooltipPosition.y}px`,
        opacity: isVisible ? 1 : 0,
      }}
    >
      <div className="tooltip-header">
        <div className="tooltip-date">{formatDate(data.time)}</div>
      </div>
      <div className="tooltip-content">
        <div className="tooltip-row">
          <span className="tooltip-label">Закр.:</span>
          <span className="tooltip-value">{formatPrice(data.close)}</span>
        </div>
        <div className="tooltip-row">
          <span className="tooltip-label">Откр.:</span>
          <span className="tooltip-value">{formatPrice(data.open)}</span>
        </div>
        <div className="tooltip-row">
          <span className="tooltip-label">Выс.:</span>
          <span className="tooltip-value">{formatPrice(data.high)}</span>
        </div>
        <div className="tooltip-row">
          <span className="tooltip-label">Низ.:</span>
          <span className="tooltip-value">{formatPrice(data.low)}</span>
        </div>
        <div className="tooltip-row">
          <span className="tooltip-label">Объём:</span>
          <span className="tooltip-value">{(data.volume || 0).toLocaleString()}</span>
        </div>
      </div>
    </div>
  );
};

export default ChartTooltip;
