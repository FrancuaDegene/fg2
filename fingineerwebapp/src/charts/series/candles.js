/**
 * Фабрика свечной серии.
 * @param {string} id
 * @param {number} z
 */
import { LineStyle } from 'lightweight-charts';

const toNumber = (value) => {
  if (value === null || value === undefined) return null;
  const num = Number(value);
  return Number.isFinite(num) ? num : null;
};

export function candles(id = 'candles', z = 0, options = {}) {
  const {
    seriesOptions,
    referenceTitle = 'Пред.',
    referenceColor = 'rgba(120, 132, 153, 0.85)',
    referenceLineStyle = LineStyle.Dashed,
    referenceLineWidth = 1,
    referencePrice,
    getReferencePrice,
  } = options || {};

  const builder = (chart, data = []) => {
    const series = chart.addCandlestickSeries({
      priceScaleId: 'right',
      ...(seriesOptions || {}),
    });

    let referenceLine = null;
    let currentReference = null;

    const resolveReferencePrice = () => {
      if (typeof getReferencePrice === 'function') {
        try {
          return getReferencePrice();
        } catch (err) {
          console.warn('[candles] reference getter failed', err);
        }
      }
      return referencePrice;
    };

    const syncReferenceLine = () => {
      const price = toNumber(resolveReferencePrice());
      if (price === null) {
        if (referenceLine) {
          try { series.removePriceLine(referenceLine); } catch (err) {
            console.warn('[candles] remove reference line failed', err);
          }
          referenceLine = null;
        }
        currentReference = null;
        return;
      }

      if (referenceLine && currentReference === price) {
        return;
      }

      if (referenceLine) {
        try { series.removePriceLine(referenceLine); } catch (err) {
          console.warn('[candles] remove reference line failed', err);
        }
        referenceLine = null;
      }

      try {
        referenceLine = series.createPriceLine({
          price,
          color: referenceColor,
          lineStyle: referenceLineStyle,
          lineWidth: referenceLineWidth,
          axisLabelVisible: true,
          title: referenceTitle,
        });
        currentReference = price;
      } catch (err) {
        console.warn('[candles] create reference line failed', err);
        referenceLine = null;
        currentReference = null;
      }
    };

    if (Array.isArray(data) && data.length) {
      series.setData(data);
    }
    syncReferenceLine();

    return {
      id,
      z,
      update(next = []) {
        if (Array.isArray(next)) {
          series.setData(next);
        }
        syncReferenceLine();
      },
      dispose() {
        try {
          if (referenceLine) {
            series.removePriceLine(referenceLine);
          }
        } catch (err) {
          console.warn('[candles] remove reference line failed', err);
        }
        try {
          chart.removeSeries(series);
        } catch (err) {
          console.warn('[candles] removeSeries failed', err);
        }
      },
    };
  };

  builder.id = id;
  builder.z = z;
  return builder;
}
