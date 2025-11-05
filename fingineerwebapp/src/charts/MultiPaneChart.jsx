import React, { useMemo, useCallback } from 'react';
import { ChartSyncController } from './ChartSyncController';
import { Pane } from './Pane';
import { candles } from './series/candles';
import { volume } from './series/volume';
import { rsi } from './series/rsi';

const VOLUME_PANE = { id: 'volume', height: 1, builders: [volume('volume', 0)], bottom: true };
const RSI_PANE = { id: 'rsi', height: 1.2, builders: [rsi('rsi', 0)], bottom: true };

/**
 * Контейнер с несколькими панелями (по умолчанию цена + объём).
 * @param {object} props
 * @param {Array} props.data
 * @param {Array} [props.layout] - при передаче переопределяет автогенерацию панелей
 * @param {Array} [props.indicators] - список активных индикаторов из контекста
 * @param {Function} [props.onHover] - колбэк для тултипов/оверлеев
 * @param {string} [props.symbolId]
 * @param {React.CSSProperties} [props.style]
 * @param {number|null|undefined} [props.referencePrice] - уровень предыдущего закрытия
 */
export function MultiPaneChart({
  data = [],
  layout,
  indicators = [],
  onHover,
  symbolId,
  style,
  referencePrice,
}) {
  const syncController = useMemo(() => new ChartSyncController(), []);

  const pricePane = useMemo(
    () => ({
      id: 'price',
      height: 4,
      builders: [
        candles('candles', 0, {
          getReferencePrice: () => referencePrice,
        }),
      ],
      bottom: false,
    }),
    [referencePrice]
  );

  const candleLookup = useMemo(() => {
    const map = new Map();
    data.forEach((candle, index) => {
      map.set(Number(candle.time), { candle, index });
    });
    return map;
  }, [data]);

  const handleCrosshairMove = useCallback(
    (param) => {
      if (typeof onHover !== 'function') return;
      if (!param || param.time == null) {
        onHover(null);
        return;
      }

      const lookup = candleLookup.get(Number(param.time));
      if (!lookup || !lookup.candle) {
        onHover(null);
        return;
      }

      const { candle, index } = lookup;
      const prev = index > 0 ? data[index - 1] : null;

      onHover({
        candle,
        prevCandle: prev,
        point: param.point ? { x: param.point.x, y: param.point.y } : null,
        symbolId,
      });
    },
    [candleLookup, data, onHover, symbolId]
  );

  const panes = useMemo(() => {
    if (Array.isArray(layout) && layout.length) return layout;

    const bottomIndicator = indicators.find(
      (indicator) => indicator.id === 'volume' && indicator.visible !== false
    )
      ? 'volume'
      : indicators.find(
          (indicator) => indicator.id === 'rsi' && indicator.visible !== false
        )
      ? 'rsi'
      : null;

    if (bottomIndicator === 'volume') {
      return [pricePane, VOLUME_PANE];
    }
    if (bottomIndicator === 'rsi') {
      return [pricePane, RSI_PANE];
    }
    return [pricePane];
  }, [indicators, layout, pricePane]);
  const gridTemplateRows = useMemo(
    () => panes.map((pane) => `${pane.height ?? 1}fr`).join(' '),
    [panes]
  );

  return (
    <div
      style={{
        display: 'grid',
        gridTemplateRows,
        gap: 8,
        height: '100%',
        minHeight: 320,
        ...style,
      }}
    >
      {panes.map((pane) => (
        <div
          key={pane.id}
          style={{
            position: 'relative',
            borderRadius: 16,
            overflow: 'hidden',
            backdropFilter: 'blur(12px)',
            background: 'rgba(19, 23, 34, 0.06)',
          }}
        >
          <Pane
            sync={syncController}
            data={data}
            builders={pane.builders}
            bottom={pane.bottom}
            onCrosshairMove={pane.id === 'price' ? handleCrosshairMove : undefined}
          />
        </div>
      ))}
    </div>
  );
}
