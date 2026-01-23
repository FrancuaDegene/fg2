import React, { useMemo, useCallback } from 'react';
import PropTypes from 'prop-types';
import useDropdown from '../../Primitives/useDropdown';
import './toolbar/index.css';

// Must match backend candlesSocket.js timeframe ids:
// 1d, 5d, 1mth, 3mth, 6mth, 1y
const RANGES = [
  { id: '1d', label: '1д' },
  { id: '5d', label: '5д' },
  { id: '1mth', label: '1м' },
  { id: '3mth', label: '3м' },
  { id: '6mth', label: '6м' },
  { id: '1y', label: '1г' },
];

export default function CompactToolbar({
  currentRange,
  onSelectRange,
  onToggleExpand,
  ticker,
  lastPrice,
  deltaPct,
}) {
  const hasPrice = Number.isFinite(lastPrice);
  const hasPct = Number.isFinite(deltaPct);
  const trend = !hasPct ? 'flat' : deltaPct > 0 ? 'up' : deltaPct < 0 ? 'down' : 'flat';
  const currentLabel = useMemo(() => {
    const hit = RANGES.find((r) => r.id === currentRange);
    return hit?.label || RANGES[0].label;
  }, [currentRange]);

  const safeTicker = typeof ticker === 'string' && ticker.trim() ? ticker.trim().toUpperCase() : '—';
  const priceText = hasPrice ? String(lastPrice.toFixed(2)) : null;
  const pctText = hasPct ? `${deltaPct >= 0 ? '+' : ''}${deltaPct.toFixed(2)}%` : null;

  const {
    isOpen,
    anchorRef,
    contentRef,
    toggle,
    close,
  } = useDropdown();

  const handlePick = useCallback((rangeId) => {
    const requestId = Date.now();
    window.__FG_REQUEST_ID__ = requestId;
    if (typeof onSelectRange === 'function') {
      onSelectRange(rangeId);
    } else {
      console.error('[FG][CompactToolbar] onSelectRange is not a function', { type: typeof onSelectRange });
    }
    close();
  }, [onSelectRange, close]);

  const handleExpand = useCallback(() => {
    if (typeof onToggleExpand === 'function') {
      onToggleExpand(true);
    }
  }, [onToggleExpand]);

  return (
    <div className="tb__section" data-role="compact-toolbar">
      <div
        className="tb__slot--left"
        style={{
          padding: '10px 12px',
          flexDirection: 'column',
          alignItems: 'flex-start',
          gap: 2,
        }}
      >
        <span className="tb__ticker">{safeTicker}</span>
        <div
          style={{
            display: 'flex',
            alignItems: 'baseline',
            gap: 10,
            lineHeight: 1.05,
            fontVariantNumeric: 'tabular-nums',
          }}
        >
          {hasPrice ? (
            <span className="tb__price">{priceText}</span>
          ) : (
            <span className="tb__skeleton tb__skeleton--price" />
          )}
          {hasPrice ? (
            pctText && (
              <span className="tb__pct" data-trend={trend}>
                {pctText}
              </span>
            )
          ) : (
            <span className="tb__skeleton tb__skeleton--pct" />
          )}
        </div>
      </div>
      <div className="tb__slot--right" style={{ padding: '8px 10px' }}>
        <div className="dropdown-container tb-dd" ref={anchorRef}>
          <button
            className={`tb-btn tb-btn--with-text tb-btn--range${isOpen ? ' tb-btn--open' : ''}`}
            onClick={() => {
              toggle();
            }}
            aria-expanded={isOpen}
            data-testid="range-trigger"
            type="button"
          >
            {currentLabel}
          </button>
          {isOpen && (
            <div className="dropdown-menu tb-dropdown" ref={contentRef}>
              {RANGES.map((r) => (
                <button
                  key={r.id}
                  className="tb-dd__item tb-dropdown__item"
                  data-state={currentRange === r.id ? 'active' : undefined}
                  data-active={currentRange === r.id ? 'true' : undefined}
                  data-testid={`range-${r.id}`}
                  data-range-id={r.id}
                  onClick={() => {
                    handlePick(r.id);
                  }}
                  title={r.label}
                  type="button"
                >
                  <span className="tb-dd__label">{r.label}</span>
                  {currentRange === r.id && <span className="tb-dd__check">•</span>}
                </button>
              ))}
            </div>
          )}
        </div>

        <button
          className="tb-btn tb-btn--expand"
          onClick={handleExpand}
          title="Развернуть"
          type="button"
          aria-label="Открыть расширенный график"
          style={{ marginLeft: 8 }}
        >
          ↗
        </button>
      </div>
    </div>
  );
}

CompactToolbar.propTypes = {
  currentRange: PropTypes.string.isRequired,
  onSelectRange: PropTypes.func.isRequired,
  onToggleExpand: PropTypes.func.isRequired,
};
