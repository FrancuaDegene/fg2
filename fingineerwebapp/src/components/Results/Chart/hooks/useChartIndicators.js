import { useEffect } from 'react';
import { LineStyle } from 'lightweight-charts';
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
          const histogram = chart.addHistogramSeries({
            priceScaleId: 'volume',
            priceFormat: { type: 'volume' },
            lastValueVisible: false,
            priceLineVisible: false,
            base: 0,
          });
          indicatorsSeriesRef.current[ind.id] = histogram;

          try {
            chart.priceScale('right').applyOptions({
              scaleMargins: { top: 0, bottom: 0.22 },
            });
            chart.priceScale('volume').applyOptions({
              scaleMargins: { top: 0.78, bottom: 0 },
              borderVisible: false,
              textColor: 'rgba(154, 160, 166, 0.55)',
            });
          } catch {}

          const mapped = safeIndicatorSource.map((candle) => {
            const open = toNumber(candle.open) ?? 0;
            const close = toNumber(candle.close) ?? 0;
            return {
              time: candle.time,
              value: toNumber(candle.volume) ?? 0,
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

        const series = chart.addLineSeries({
          color,
          lineWidth: isMa || isEma ? 2.4 : 2,
          priceScaleId: isRsi ? RSI_SCALE_ID : 'right',
          lastValueVisible: !isRsi,
          priceLineVisible: !isRsi,
        });
        indicatorsSeriesRef.current[ind.id] = series;

        if (isRsi) {
          chart.priceScale(RSI_SCALE_ID).applyOptions({
            scaleMargins: { top: 0.72, bottom: 0.02 },
            borderVisible: false,
          });
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
    indCacheRef,
    indGenRef,
  ]);
}


