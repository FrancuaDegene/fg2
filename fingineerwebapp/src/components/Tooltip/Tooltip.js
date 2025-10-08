import React, { useEffect, useRef } from 'react';
import './Tooltip.css';

const Tooltip = ({ text, position, side = 'right' }) => {
  const tooltipRef = useRef(null);

  useEffect(() => {
    if (!position || !tooltipRef.current) return;

    const tooltip = tooltipRef.current;
    const { width, height } = tooltip.getBoundingClientRect();

    let left = position.left; // Начальная позиция справа от кнопки
    let top = position.top - (height / 2); // Центрируем по вертикали

    // Предотвращаем выход за правый край
    if (left + width > window.innerWidth - 10) {
      left = window.innerWidth - width - 10;
    }

    // Предотвращаем выход за верхний/нижний край
    if (top + height > window.innerHeight) {
      top = window.innerHeight - height - 10;
    }
    if (top < 10) {
      top = 10;
    }

    console.log('Tooltip position:', { left, top, width, height });

    tooltip.style.setProperty('left', `${left}px`, 'important');
    tooltip.style.setProperty('top', `${top}px`, 'important');
    tooltip.style.setProperty('opacity', '1', 'important');

    const handleResize = () => {
      tooltip.style.setProperty('opacity', '0', 'important');
      setTimeout(() => {
        tooltip.style.removeProperty('left');
        tooltip.style.removeProperty('top');
        tooltip.style.removeProperty('opacity');
      }, 300);
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [position]);

  if (!text || !position) return null;

  return (
    <div
      ref={tooltipRef}
      className={`custom-tooltip positioned-${side}`}
    >
      <div className="tooltip-content">{text}</div>
      <div className="tooltip-arrow" />
    </div>
  );
};

export default React.memo(Tooltip);