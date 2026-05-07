import { LineSeries } from 'lightweight-charts';

const SCALE_ID = 'rsi';
const RSI_TOP = 70;
const RSI_BOTTOM = 30;
const DEFAULT_COLOR = '#ff5252';

const clamp = (value, min, max) => Math.max(min, Math.min(max, value));

function calcRsi(candles = [], period = 14) {
  if (!Array.isArray(candles) || candles.length < period + 1) return [];

  let gains = 0;
  let losses = 0;
  for (let i = 1; i <= period; i += 1) {
    const diff = Number(candles[i].close) - Number(candles[i - 1].close);
    if (diff >= 0) gains += diff;
    else losses -= diff;
  }
  gains /= period;
  losses /= period;

  const result = [];
  for (let i = period + 1; i < candles.length; i += 1) {
    const diff = Number(candles[i].close) - Number(candles[i - 1].close);
    const gain = diff > 0 ? diff : 0;
    const loss = diff < 0 ? -diff : 0;
    gains = ((gains * (period - 1)) + gain) / period;
    losses = ((losses * (period - 1)) + loss) / period;
    const rs = losses === 0 ? 100 : gains / losses;
    const rsi = 100 - (100 / (1 + rs));
    result.push({
      time: candles[i].time,
      value: clamp(Number.isFinite(rsi) ? rsi : 0, 0, 100),
    });
  }
  return result;
}

export function rsi(id = 'rsi', z = 0, period = 14) {
  const builder = (chart, data = []) => {
    const series = chart.addSeries(LineSeries, {
      priceScaleId: SCALE_ID,
      color: DEFAULT_COLOR,
      lineWidth: 2,
    });

    chart.priceScale('right').applyOptions({
      scaleMargins: { top: 0, bottom: 0.32 },
    });
    chart.priceScale(SCALE_ID).applyOptions({
      scaleMargins: { top: 0.68, bottom: 0 },
      borderVisible: false,
    });

    series.applyOptions({
      priceFormat: {
        type: 'custom',
        formatter: (val) => (val != null ? Math.round(val).toString() : ''),
      },
    });

    const upper = series.createPriceLine({
      price: RSI_TOP,
      color: 'rgba(156, 163, 175, 0.6)',
      lineStyle: 2,
      lineWidth: 1,
      axisLabelVisible: true,
      title: RSI_TOP.toString(),
    });
    const lower = series.createPriceLine({
      price: RSI_BOTTOM,
      color: 'rgba(156, 163, 175, 0.6)',
      lineStyle: 2,
      lineWidth: 1,
      axisLabelVisible: true,
      title: RSI_BOTTOM.toString(),
    });

    const applyData = (candles) => {
      series.setData(calcRsi(candles, period));
    };

    applyData(data);

    return {
      id,
      z,
      update(next = []) {
        applyData(next);
      },
      dispose() {
        try {
          chart.removeSeries(series);
        } catch (err) {
          console.warn('[rsi] removeSeries failed', err);
        }
        try {
          chart.priceScale('right').applyOptions({
            scaleMargins: { top: 0, bottom: 0 },
          });
          chart.priceScale(SCALE_ID).applyOptions({
            scaleMargins: { top: 0, bottom: 0 },
          });
        } catch (err) {
          console.warn('[rsi] reset margins failed', err);
        }
        try {
          if (upper) upper.remove?.();
        } catch (_) {}
        try {
          if (lower) lower.remove?.();
        } catch (_) {}
      },
    };
  };

  builder.id = id;
  builder.z = z;
  return builder;
}

