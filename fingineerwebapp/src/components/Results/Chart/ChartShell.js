// src/components/Results/Chart/ChartShell.js
import React, { memo } from 'react';
import DrawToolbar, { TOOL_IDS } from './DrawToolbar';

function cx(...xs) {
  return xs.filter(Boolean).join(' ');
}

/**
 * Только layout сцены: stage + rails + gutters + chart-area.
 * Никакого знания про lightweight-charts внутри.
 */
const ChartShell = memo(function ChartShell({
  isExpanded,
  activeTool = TOOL_IDS.SELECT,
  onChangeTool = () => {},
  hasRightRail = false,
  children,
}) {
  const stageClass = cx(
    'chart-stage',
    isExpanded && 'with-docks',
    isExpanded && !hasRightRail && 'no-right-rail'
  );

  return (
    <div className={stageClass} style={{ position: 'relative', flex: 1, minHeight: 0, width: '100%' }}>
      {isExpanded && (
        <>
          {/* левая рельса */}
          <div className="dock-left">
            <DrawToolbar
              placement="left"
              activeTool={activeTool}
              onChangeTool={onChangeTool}
              className={isExpanded ? 'drawtb--light' : ''}
            />
          </div>

          {/* разделитель слева */}
          <div className="dock-separator dock-sep-left" aria-hidden="true" />

          {/* правая рельса (опционально) */}
          {hasRightRail && (
            <>
              <div className="dock-separator dock-sep-right" aria-hidden="true" />
              <div className="dock-right">
                <DrawToolbar
                  placement="right"
                  activeTool={activeTool}
                  onChangeTool={onChangeTool}
                  className="drawtb--light"
                />
              </div>
            </>
          )}
        </>
      )}

      {/* область графика */}
      <div className={cx('chart-area', isExpanded && 'chart-card')}>
        <div className="gutter-left" aria-hidden="true" />
        <div className="chart-inner">{children}</div>
        <div className="gutter-right" aria-hidden="true" />
      </div>
    </div>
  );
});

export default ChartShell;
export { TOOL_IDS };