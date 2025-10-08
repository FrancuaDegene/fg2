import React from 'react';
import './DrawToolbar.css';

export const TOOL_IDS = {
  SELECT: 'select',
  TRENDLINE: 'trendline',
  HLINE: 'hline',
  VLINE: 'vline',
  RULER: 'ruler',
  ERASE: 'erase',
  UNDO: 'undo',
  REDO: 'redo',
  RESET: 'reset',
  SAVE: 'save',
};

const IconSelect = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
    <path d="M6 6h12v12H6z" stroke="currentColor" strokeWidth="1.5" opacity=".25"/>
    <path d="M5 12h14M12 5v14" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
  </svg>
);
const IconTrend = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
    <path d="M4 16l6-6 4 4 6-6" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);
const IconHLine = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
    <path d="M3 12h18" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/>
  </svg>
);
const IconVLine = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
    <path d="M12 3v18" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/>
  </svg>
);
const IconRuler = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
    <rect x="4" y="6" width="16" height="12" rx="2" stroke="currentColor" strokeWidth="1.6"/>
    <path d="M8 10h2M12 10h2M16 10h2M8 14h2M12 14h2M16 14h2" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"/>
  </svg>
);
const IconErase = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
    <path d="M15 5l4 4-9 9H6l-2-2 9-9z" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round"/>
  </svg>
);
const IconUndo = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
    <path d="M9 7l-4 5 4 5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M19 12a6 6 0 0 0-6-6h-4" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round"/>
  </svg>
);
const IconRedo = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
    <path d="M15 7l4 5-4 5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M5 12a6 6 0 0 1 6-6h4" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round"/>
  </svg>
);
const IconReset = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
    <path d="M12 5v4l3-3M12 19v-4l-3 3" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M6 12a6 6 0 0 1 6-6 6 6 0 0 1 6 6" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round"/>
  </svg>
);
const IconSave = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
    <path d="M5 5h14v14H5V5z" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round"/>
    <path d="M9 5v6h6V5" stroke="currentColor" strokeWidth="1.4" strokeLinejoin="round"/>
    <path d="M8 19v-4h8v4" stroke="currentColor" strokeWidth="1.4" strokeLinejoin="round"/>
  </svg>
);

const TOOL_META = {
  [TOOL_IDS.SELECT]: { label: 'Выделение', icon: IconSelect },
  [TOOL_IDS.TRENDLINE]: { label: 'Линия тренда', icon: IconTrend },
  [TOOL_IDS.HLINE]: { label: 'Горизонтальная линия', icon: IconHLine },
  [TOOL_IDS.VLINE]: { label: 'Вертикальная линия', icon: IconVLine },
  [TOOL_IDS.RULER]: { label: 'Линейка', icon: IconRuler },
  [TOOL_IDS.ERASE]: { label: 'Удалить выбранное', icon: IconErase },
  [TOOL_IDS.UNDO]: { label: 'Отменить', icon: IconUndo },
  [TOOL_IDS.REDO]: { label: 'Повторить', icon: IconRedo },
  [TOOL_IDS.RESET]: { label: 'Сбросить масштаб', icon: IconReset },
  [TOOL_IDS.SAVE]: { label: 'Сохранить раскладку', icon: IconSave },
};

const DEFAULT_SEQUENCE = [
  TOOL_IDS.SELECT,
  'divider',
  TOOL_IDS.TRENDLINE,
  TOOL_IDS.HLINE,
  TOOL_IDS.VLINE,
  'divider',
  TOOL_IDS.RULER,
  'divider',
  TOOL_IDS.ERASE,
];

export default function DrawToolbar({
  activeTool,
  onChangeTool,
  className = '',
  placement = 'left',
  tools,
}) {
  const sequence = tools && tools.length > 0 ? tools : DEFAULT_SEQUENCE;
  const orientation = placement === 'top' || placement === 'bottom' ? 'horizontal' : 'vertical';

  const handleClick = (id) => {
    if (typeof onChangeTool === 'function') {
      onChangeTool(id);
    }
  };

  return (
    <nav
      className={`drawtb drawtb--${orientation} drawtb--${placement} ${className}`}
      aria-label="Панель инструментов графика"
    >
      {sequence.map((item, idx) => {
        if (item === 'divider') {
          return <div key={`divider-${idx}`} className="drawtb__divider" />;
        }

        const meta = TOOL_META[item];
        if (!meta) return null;

        const Icon = meta.icon;
        const isActive = activeTool === item;

        return (
          <button
            key={item}
            type="button"
            className={`drawtb__btn ${isActive ? 'is-active' : ''}`}
            onClick={() => handleClick(item)}
            aria-pressed={isActive}
            title={meta.label}
            aria-label={meta.label}
          >
            <Icon />
          </button>
        );
      })}
    </nav>
  );
}
