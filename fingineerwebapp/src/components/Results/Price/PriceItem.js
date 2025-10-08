import React from 'react';
import { formatValue } from './priceConstants';
import './Price.css';

const PriceItem = ({ 
  label, 
  value, 
  metricKey, 
  onMouseEnterInfoButton, 
  onMouseLeaveInfoButton,
  onMouseMoveInfoButton,
  isActive 
}) => {
  const handleMouseEnter = (e) => {
    e.stopPropagation();
    const buttonRect = e.currentTarget.getBoundingClientRect();
    onMouseEnterInfoButton(buttonRect, metricKey);
  };

  return (
    <div className="meta-item">
      <span className="meta-label">{label}</span>
      <span className="meta-value">{formatValue(value)}</span>
      <button
        className={`info-button ${isActive ? 'active' : ''}`}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={onMouseLeaveInfoButton}
        onMouseMove={onMouseMoveInfoButton}
        aria-label={`Описание ${label}`}
        type="button"
      >
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
          <path
            d="M12 22C17.5228 22 22 17.5228 22 12C22 6.47715 17.5228 2 12 2C6.47715 2 2 6.47715 2 12C2 17.5228 6.47715 22 12 22Z"
            stroke="currentColor"
            strokeWidth="2"
          />
          <path
            d="M12 16V12M12 8H12.01"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
          />
        </svg>
      </button>
    </div>
  );
};

export default React.memo(PriceItem);