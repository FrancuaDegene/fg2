import React, { memo, useCallback, useMemo } from 'react';
import PropTypes from 'prop-types';
import { BarChart3, Maximize } from 'lucide-react';

import { CHART_CONFIG } from '../../constants';
import useDropdown from '../Primitives/useDropdown';

// Берём те же стили, что у тулбара, чтобы капсулы выглядели единообразно.
import '../Results/Chart/toolbar/index.css';

/**
 * CompactControls
 * Compact = ОДНА кнопка Range (RANGES), остальное — минимально.
 * Никаких таймфрейм-кнопок/доп. панелей.
 */
const CompactControls = ({ currentRange, onSelectRange, onToggleExpand }) => {
  const ranges = CHART_CONFIG.RANGES;

  const currentLabel = useMemo(() => {
    const hit = ranges.find((r) => r.id === currentRange);
    return hit?.label ?? (ranges[0]?.label || '—');
  }, [ranges, currentRange]);

  const {
    isOpen,
    anchorRef,
    contentRef,
    toggle,
    close,
  } = useDropdown();

  const handlePick = useCallback(
    (rangeId) => {
      if (typeof onSelectRange === 'function') onSelectRange(rangeId);
      close();
    },
    [onSelectRange, close]
  );

  return (
    <div className="tb__section">
      <div className="tb__slot--left" />
      <div className="tb__slot--right">
        {/* ОДНА кнопка выбора диапазона */}
        <div className="dropdown-container tb-dd" ref={anchorRef}>
          <button
            className="tb-btn tb-btn--with-text"
            onClick={toggle}
            aria-expanded={isOpen}
            type="button"
          >
            <BarChart3 size={16} /> {currentLabel}
          </button>
          {isOpen && (
            <div className="dropdown-menu" ref={contentRef}>
              {ranges.map((r) => (
                <button
                  key={r.id}
                  className="tb-dd__item"
                  data-state={currentRange === r.id ? 'active' : undefined}
                  onClick={() => handlePick(r.id)}
                  title={r.label}
                  type="button"
                >
                  <span className="tb-dd__label">{r.label}</span>
                  {currentRange === r.id && <span className="tb-dd__check">✓</span>}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Кнопка Expand (минимально, чтобы не потерять UX-переход) */}
        <button
          className="tb-btn"
          onClick={() => onToggleExpand(true)}
          title="Развернуть"
          type="button"
        >
          <Maximize size={16} />
        </button>
      </div>
    </div>
  );
};

CompactControls.propTypes = {
  currentRange: PropTypes.string.isRequired,
  onSelectRange: PropTypes.func.isRequired,
  onToggleExpand: PropTypes.func.isRequired,
};

export default memo(CompactControls);

