import { useEffect } from 'react';
import { HistogramSeries, LineSeries, LineStyle } from 'lightweight-charts';
import { toNumber } from '../utils/chartTimeUtils';

const RSI_SCALE_ID = 'rsi-scale';

// Очищаем данные индикаторов от дыр (null / NaN), чтобы lightweight-charts
// не падал при отрисовке кроссхейра.
const sanitizeIndicatorSeriesData = (rows) => {
  if (!Array.isArray(rows)) return [];

  return rows
    .filter((point) => {
      if (!point) return false;
      if (point.time == null) return false;
      const value = toNumber(point.value);
      return Number.isFinite(value);
    })
    .map((point) => ({
      time: point.time,
      value: toNumber(point.value),
    }));
};

const alignIndicatorSeriesToCandles = (seriesData, candles) => {
  if (!Array.isArray(seriesData) || seriesData.length === 0) return [];
  if (!Array.isArray(candles) || candles.length === 0) return seriesData;

  const valueByTime = new Map(seriesData.map((point) => [point.time, point.value]));
  const firstValue = seriesData[0]?.value ?? null;

  const aligned = [];
  let lastValue = firstValue;

  for (const candle of candles) {
    if (!candle || candle.time == null) continue;
    const t = candle.time;
    if (valueByTime.has(t)) {
      lastValue = valueByTime.get(t);
      aligned.push({ time: t, value: lastValue });
      continue;
    }
    if (lastValue !== null) {
      aligned.push({ time: t, value: lastValue });
    }
  }

  return aligned;
};

const writeVolumeDataPathDiagnostic = (sourceName, rows) => {
  if (process.env.NODE_ENV === 'production' || typeof window === 'undefined') return;
  const list = Array.isArray(rows) ? rows : [];
  try {
    window.__FG_94_DATA_PATH_DIAG__ = {
      ...(window.__FG_94_DATA_PATH_DIAG__ || {}),
      VolumeNativePane: {
        sourceName,
        length: list.length,
        firstTime: list[0]?.time ?? null,
        lastTime: list[list.length - 1]?.time ?? null,
      },
    };
  } catch {}
};

const applyNativeLowerPaneStretch = (chart) => {
  try {
    const panes =
      typeof chart?.panes === 'function'
        ? chart.panes()
        : null;
    if (!Array.isArray(panes)) return;

    const pricePane = panes[0];
    const lowerPane = panes[1];
    if (!pricePane || !lowerPane) return;

    try {
      pricePane?.setStretchFactor?.(4);
    } catch {}
    try {
      lowerPane?.setStretchFactor?.(1.2);
    } catch {}
  } catch {}
};

export function useChartIndicators({
  chartInstanceRef,
  seriesRef,
  preparedData,
  indicatorSource,
  activeIndicators,
  currentCandleType,
  currentInterval,
  currentTimeframe,
  indicatorsSeriesRef,
  activePriceSliceRef,
  indCacheRef,
  indGenRef,
  sma,
  ema,
  rsi,
}) {
  // NOTE: refs (chartInstanceRef, seriesRef, indicatorsSeriesRef, ...) .   .
  useEffect(() => {
    const chart = chartInstanceRef.current;
    if (!chart) return;

    const myGen = ++indGenRef.current;

      Object.values(indicatorsSeriesRef.current).forEach(series => {
        try { series.setData([]); } catch {}
        try { chart.removeSeries(series); } catch {}
      });
      indicatorsSeriesRef.current = {};
      try {
        chart.priceScale(RSI_SCALE_ID).applyOptions({
          scaleMargins: { top: 0, bottom: 0 },
          borderVisible: false,
        });
      } catch {}
      try {
        chart.priceScale('right').applyOptions({
          scaleMargins: { top: 0, bottom: 0 },
        });
        chart.priceScale('volume').applyOptions({
          scaleMargins: { top: 0, bottom: 0 },
          borderVisible: false,
        });
      } catch {}

    if (!indicatorSource || indicatorSource.length === 0) {
      return;
    }

    const safeIndicatorSource = Array.isArray(indicatorSource)
      ? indicatorSource.filter(
          (candle) =>
            candle &&
            candle.time != null &&
            Number.isFinite(toNumber(candle.close))
        )
      : [];

    if (safeIndicatorSource.length === 0) {
      return;
    }

    const jobs = (activeIndicators || [])
      .filter((ind) => ind && ind.visible !== false)
      .map(async (ind) => {
        if (ind.id === 'volume') {
          const histogram = chart.addSeries(HistogramSeries, {
            priceScaleId: 'volume',
            priceFormat: { type: 'volume' },
            lastValueVisible: false,
            priceLineVisible: false,
            base: 0,
          }, 1);
          indicatorsSeriesRef.current[ind.id] = histogram;
          applyNativeLowerPaneStretch(chart);

          try {
            chart.priceScale('volume').applyOptions({
              borderVisible: false,
              textColor: 'rgba(154, 160, 166, 0.55)',
            });
          } catch {}

          const activePriceSlice = Array.isArray(activePriceSliceRef?.current)
            ? activePriceSliceRef.current.filter((candle) => candle && candle.time != null)
            : [];
          const volumeSource = activePriceSlice.length > 0
            ? activePriceSlice
            : safeIndicatorSource;
          const volumeSourceName = activePriceSlice.length > 0
            ? 'activePriceSliceRef'
            : 'indicatorSource';
          writeVolumeDataPathDiagnostic(volumeSourceName, volumeSource);

          const mapped = volumeSource.map((candle) => {
            const open = toNumber(candle.open) ?? toNumber(candle.value) ?? 0;
            const close = toNumber(candle.close) ?? toNumber(candle.value) ?? open;
            return {
              time: candle.time,
              value: toNumber(candle.volume) ?? toNumber(candle.value) ?? 0,
              color: close >= open ? '#26a69a' : '#ef5350',
            };
          });

          try { histogram.setData(mapped); } catch {}
          return;
        }

        const key = JSON.stringify({
          id: ind.id,
          params: ind.params || {},
          len: safeIndicatorSource.length,
          candleType: currentCandleType,
          interval: currentInterval,
          timeframe: currentTimeframe,
        });

        const cache = indCacheRef.current;
        let data = cache.get(key);

        if (!data) {
          try {
            const period = ind.params?.period ?? 14;
            if (ind.id === 'ma')      data = await sma(safeIndicatorSource, period);
            else if (ind.id === 'ema') data = await ema(safeIndicatorSource, period);
            else if (ind.id === 'rsi') data = await rsi(safeIndicatorSource, period);
            else return;
            cache.set(key, data);
          } catch (err) {
            console.error('[IND] worker failed:', ind.id, err);
            return;
          }
        }

        if (myGen !== indGenRef.current) return;

        const safeData = sanitizeIndicatorSeriesData(data);
        if (!safeData.length) {
          return;
        }
        const alignedData = alignIndicatorSeriesToCandles(safeData, safeIndicatorSource);
        if (!alignedData.length) {
          return;
        }

        const isRsi = ind.id === 'rsi';
        const isMa = ind.id === 'ma';
        const isEma = ind.id === 'ema';
        const showRsiLevels = isRsi ? ind.settings?.showLevels !== false : false;
        const defaultColor = isRsi
          ? 'rgba(244, 67, 54, 0.9)'
          : isMa
          ? 'rgba(52, 152, 219, 0.9)'
          : isEma
          ? 'rgba(243, 156, 18, 0.9)'
          : 'rgba(76, 175, 80, 0.9)';
        const color = ind.color || defaultColor;

        const seriesOptions = {
          color,
          lineWidth: isMa || isEma ? 2.4 : 2,
          priceScaleId: isRsi ? RSI_SCALE_ID : 'right',
          lastValueVisible: !isRsi,
          priceLineVisible: !isRsi,
        };
        const series = isRsi
          ? chart.addSeries(LineSeries, seriesOptions, 1)
          : chart.addSeries(LineSeries, seriesOptions);
        indicatorsSeriesRef.current[ind.id] = series;

        if (isRsi) {
          applyNativeLowerPaneStretch(chart);
          const rsiScale = series.priceScale?.();
          try {
            rsiScale?.applyOptions({
              scaleMargins: { top: 0.1, bottom: 0.1 },
              borderVisible: false,
            });
          } catch {}
          series.applyOptions({
            priceFormat: {
              type: 'custom',
              formatter: (val) => (val != null ? Math.round(val).toString() : ''),
            },
          });
          if (showRsiLevels) {
            try {
              series.createPriceLine({
                price: 70,
                color: '#9ca3af',
                lineStyle: LineStyle.Dashed,
                lineWidth: 1,
                axisLabelVisible: true,
                title: '70',
              });
              series.createPriceLine({
                price: 30,
                color: '#9ca3af',
                lineStyle: LineStyle.Dashed,
                lineWidth: 1,
                axisLabelVisible: true,
                title: '30',
              });
            } catch {}
          }
        }

        try { series.setData(alignedData); } catch (e) {
          console.error('[IND] setData failed:', ind.id, e);
        }
      });

    let cancelled = false;
    (async () => {
      await Promise.allSettled(jobs);
      if (cancelled) return;
    })();

    return () => {
      cancelled = true;
    };
  }, [
    activeIndicators,
    indicatorSource,
    preparedData,
    currentCandleType,
    currentInterval,
    currentTimeframe,
    sma, ema, rsi,
    chartInstanceRef,
    indicatorsSeriesRef,
    activePriceSliceRef,
    indCacheRef,
    indGenRef,
  ]);
}
