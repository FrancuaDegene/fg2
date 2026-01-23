import React, { useEffect, useMemo, useRef } from 'react';
import { createChart } from 'lightweight-charts';

/**
 * Обёртка над lightweight-charts. Один Pane = один чарт.
 * @param {object} props
 * @param {import('./ChartSyncController').ChartSyncController} props.sync
 * @param {Array} props.data
 * @param {Function[]} props.builders
 * @param {boolean} [props.bottom]
 */
export function Pane({
  sync,
  data = [],
  builders = [],
  bottom = false,
  onCrosshairMove,
}) {
  const rootRef = useRef(null);
  const overlayRef = useRef(null);
  const chartRef = useRef(null);
  const instancesRef = useRef([]);
  const hairlineRef = useRef(null);
  const dataRef = useRef(data);

  // Обновляем ссылку на данные при их изменении
  useEffect(() => {
    dataRef.current = data;
  }, [data]);

  // Стабилизируем массив билдров, чтобы эффект не пересоздавался зря
  const orderedBuilders = useMemo(() => {
    return builders
      .slice()
      .sort((a, b) => (a?.z ?? 0) - (b?.z ?? 0));
  }, [builders]);

  useEffect(() => {
    if (!rootRef.current) return undefined;

    const chart = createChart(rootRef.current, {
      autoSize: true,
      rightPriceScale: { borderVisible: false },
      layout: { fontFamily: 'Inter, system-ui, sans-serif' },
      grid: {
        vertLines: { visible: false },
        horzLines: { visible: true, color: 'rgba(197,203,206,0.2)' },
      },
    });

    chartRef.current = chart;
    sync.register(chart, { isBottom: bottom });

    const resizeObserver = new ResizeObserver(() => {
      chart.applyOptions({ autoSize: true });
    });
    resizeObserver.observe(rootRef.current);

    // Подключаем серийные плагины
    const instances = orderedBuilders.map((builder) => builder(chart, dataRef.current));
    instancesRef.current = instances;

    const unsubscribeHover = sync.hover.on((time) => {
      const overlay = overlayRef.current;
      const lc = chartRef.current;
      if (!overlay || !lc) return;

      if (time == null) {
        if (hairlineRef.current) {
          hairlineRef.current.style.display = 'none';
        }
        return;
      }

      const x = lc.timeScale().timeToCoordinate(time);
      if (x == null) {
        if (hairlineRef.current) {
          hairlineRef.current.style.display = 'none';
        }
        return;
      }

      let line = hairlineRef.current;
      if (!line) {
        line = document.createElement('div');
        line.style.position = 'absolute';
        line.style.top = '0';
        line.style.bottom = '0';
        line.style.width = '1px';
        line.style.background = 'rgba(128, 140, 160, 0.5)';
        line.style.pointerEvents = 'none';
        overlay.appendChild(line);
        hairlineRef.current = line;
      }

      line.style.display = 'block';
      line.style.transform = `translateX(${Math.round(x)}px)`;
    });

    const handleCrosshairMove = (param) => {
      if (typeof onCrosshairMove === 'function') {
        onCrosshairMove(param, chart);
      }
    };
    chart.subscribeCrosshairMove(handleCrosshairMove);

    return () => {
      unsubscribeHover();
      resizeObserver.disconnect();
      instancesRef.current.forEach((instance) => {
        try {
          instance.dispose?.();
        } catch (err) {
          console.warn('[Pane] dispose failed', err);
        }
      });
      instancesRef.current = [];
      try {
        chart.unsubscribeCrosshairMove(handleCrosshairMove);
      } catch (err) {
        console.warn('[Pane] unsubscribe crosshair failed', err);
      }
      sync.unregister(chart);
      chart.remove();
      chartRef.current = null;
      hairlineRef.current = null;
    };
  }, [bottom, onCrosshairMove, orderedBuilders, sync]);

  // При обновлении данных прокидываем их во все серии
  useEffect(() => {
    instancesRef.current.forEach((instance) => {
      try {
        instance.update?.(data);
      } catch (err) {
        console.warn('[Pane] update failed', err);
      }
    });
  }, [data]);

  return (
    <div
      ref={rootRef}
      style={{ position: 'relative', width: '100%', height: '100%' }}
    >
      <div
        ref={overlayRef}
        style={{ position: 'absolute', inset: 0, pointerEvents: 'none' }}
      />
    </div>
  );
}
