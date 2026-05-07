import { HistogramSeries } from 'lightweight-charts';

const DEFAULT_UP_COLOR = 'rgba(46, 204, 113, 0.85)';
const DEFAULT_DOWN_COLOR = 'rgba(231, 76, 60, 0.85)';
const PRICE_SCALE_ID = 'volume';

/**
 * Фабрика серии объёма. Требует, чтобы свечи содержали поле volume.
 * @param {string} id
 * @param {number} z
 */
export function volume(id = 'volume', z = 0) {
  const builder = (chart, data = []) => {
    const histogram = chart.addSeries(HistogramSeries, {
      priceScaleId: PRICE_SCALE_ID,
      priceFormat: { type: 'volume' },
      lastValueVisible: false,
      priceLineVisible: false,
    });

    const applySeriesData = (candles = []) => {
      if (!Array.isArray(candles)) return;
      histogram.setData(
        candles.map((candle) => ({
          time: candle.time,
          value: candle.volume ?? 0,
          color:
            candle.close >= candle.open ? DEFAULT_UP_COLOR : DEFAULT_DOWN_COLOR,
        }))
      );
    };

    // Настраиваем отступы: верхняя панель (цена) занимает ~78%, объём — нижнюю часть.
    chart.priceScale('right').applyOptions({
      scaleMargins: { top: 0, bottom: 0.22 },
    });
    chart.priceScale(PRICE_SCALE_ID).applyOptions({
      scaleMargins: { top: 0.78, bottom: 0 },
    });

    applySeriesData(data);

    return {
      id,
      z,
      update(next = []) {
        applySeriesData(next);
      },
      dispose() {
        try {
          chart.removeSeries(histogram);
        } catch (err) {
          console.warn('[volume] removeSeries failed', err);
        }
        try {
          chart.priceScale('right').applyOptions({
            scaleMargins: { top: 0, bottom: 0 },
          });
          chart.priceScale(PRICE_SCALE_ID).applyOptions({
            scaleMargins: { top: 0, bottom: 0 },
          });
        } catch (err) {
          console.warn('[volume] reset margins failed', err);
        }
      },
    };
  };

  builder.id = id;
  builder.z = z;
  return builder;
}

