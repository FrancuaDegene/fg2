import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Eye, EyeOff } from 'lucide-react';
import { useChart } from './ChartContext';
import './ActiveIndicators.css';

const FALLBACK_COLORS = {
  ma: '#2962ff',
  ema: '#ff9800',
  rsi: '#f44336',
  volume: '#26a69a',
};

const ActiveIndicators = () => {
  const {
    activeIndicators,
    toggleIndicatorVisibility,
    removeIndicator,
    updateIndicator,
  } = useChart();

  const [editingId, setEditingId] = useState(null);
  const [draftPeriod, setDraftPeriod] = useState('');
  const popoverRef = useRef(null);

  const PERIOD_PRESETS = useMemo(() => [5, 9, 12, 14, 20, 21, 34, 50, 100, 200], []);

  const items = useMemo(
    () => (activeIndicators || []).map((indicator) => {
      const color = indicator.color || FALLBACK_COLORS[indicator.id] || '#5c6bc0';
      const period = indicator.params?.period;
      const isVisible = indicator.visible !== false;
      const showRsiLevels =
        indicator.id === 'rsi' ? indicator.settings?.showLevels !== false : null;

      return {
        id: indicator.id,
        name: indicator.label || indicator.name || indicator.value || indicator.id.toUpperCase(),
        color,
        period,
        isVisible,
        showRsiLevels,
      };
    }),
    [activeIndicators]
  );

  useEffect(() => {
    if (!editingId) return undefined;
    const handleClickOutside = (event) => {
      if (!popoverRef.current) return;
      if (!popoverRef.current.contains(event.target)) {
        setEditingId(null);
      }
    };
    const handleEsc = (event) => {
      if (event.key === 'Escape') {
        setEditingId(null);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleEsc);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleEsc);
    };
  }, [editingId]);

  useEffect(() => {
    if (!editingId) return;
    const indicator = items.find((item) => item.id === editingId);
    if (!indicator || indicator.period == null) {
      setEditingId(null);
      return;
    }
    setDraftPeriod(String(indicator.period));
  }, [editingId, items]);

  if (!items.length) {
    return null;
  }

  const openEditor = (itemId, period) => {
    if (editingId === itemId) {
      setEditingId(null);
      return;
    }
    setEditingId(itemId);
    setDraftPeriod(period != null ? String(period) : '');
  };

  const commitPeriod = (itemId) => {
    if (String(draftPeriod).trim() === '') {
      setEditingId(null);
      return;
    }
    const numeric = Number(draftPeriod);
    if (!Number.isFinite(numeric)) {
      setEditingId(null);
      return;
    }
    const normalized = Math.max(1, Math.min(500, Math.round(numeric)));
    updateIndicator(itemId, {
      params: { period: normalized },
    });
    setEditingId(null);
  };

  return (
    <div className="indicator-legend" data-size="compact">
      {items.map((item) => (
        <div
          key={item.id}
          className="indicator-chip"
          data-visible={item.isVisible ? '1' : '0'}
        >
          <span
            className="indicator-chip__marker"
            style={{ backgroundColor: item.color }}
            aria-hidden="true"
          />
          <span className="indicator-chip__meta">
            <span className="indicator-chip__name">{item.name}</span>
            {item.period ? (
              <button
                type="button"
                className="indicator-chip__period-btn"
                onClick={() => openEditor(item.id, item.period)}
                title="Изменить период"
              >
                • {item.period}
              </button>
            ) : null}
          </span>

          {item.id === 'rsi' ? (
            <button
              type="button"
              className="indicator-chip__btn indicator-chip__btn--toggle"
              data-active={item.showRsiLevels ? '1' : '0'}
              title={`Уровни 30/70 ${item.showRsiLevels ? 'включены' : 'выключены'}`}
              onClick={() =>
                updateIndicator(item.id, {
                  settings: { showLevels: !item.showRsiLevels },
                })
              }
            >
              30/70
            </button>
          ) : null}

          <button
            type="button"
            className="indicator-chip__btn indicator-chip__btn--visibility"
            title={item.isVisible ? 'Скрыть индикатор' : 'Показать индикатор'}
            onClick={() => toggleIndicatorVisibility(item.id)}
            data-active={item.isVisible ? '1' : '0'}
          >
            {item.isVisible ? <Eye size={14} /> : <EyeOff size={14} />}
          </button>
          <button
            type="button"
            className="indicator-chip__btn indicator-chip__btn--remove"
            title="Удалить индикатор"
            onClick={() => removeIndicator(item.id)}
          >
            ✕
          </button>

          {editingId === item.id ? (
            <div
              className="indicator-chip__popover"
              ref={popoverRef}
              role="dialog"
              aria-label={`Настройка периода ${item.name}`}
            >
              <div className="indicator-chip__popover-row">
                <label className="indicator-chip__popover-label">
                  Period
                  <input
                    type="number"
                    min={1}
                    max={500}
                    step={1}
                    value={draftPeriod}
                    onChange={(e) => setDraftPeriod(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        commitPeriod(item.id);
                      }
                    }}
                    className="indicator-chip__popover-input"
                    autoFocus
                  />
                </label>
                <button
                  type="button"
                  className="indicator-chip__popover-apply"
                  onClick={() => commitPeriod(item.id)}
                >
                  OK
                </button>
              </div>
              <div className="indicator-chip__popover-presets">
                {PERIOD_PRESETS.map((preset) => (
                  <button
                    key={preset}
                    type="button"
                    className="indicator-chip__preset"
                    onClick={() => {
                      setDraftPeriod(String(preset));
                      updateIndicator(item.id, { params: { period: preset } });
                      setEditingId(null);
                    }}
                  >
                    {preset}
                  </button>
                ))}
              </div>
            </div>
          ) : null}
        </div>
      ))}
    </div>
  );
};

export default ActiveIndicators;
