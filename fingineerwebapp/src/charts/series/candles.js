/**
 * Фабрика свечной серии.
 * @param {string} id
 * @param {number} z
 */
import { CandlestickSeries, LineStyle } from 'lightweight-charts';

const toNumber = (value) => {
  if (value === null || value === undefined) return null;
  const num = Number(value);
  return Number.isFinite(num) ? num : null;
};

// Флаги, чтобы не спамить консоль одинаковыми ошибками
let didWarnUpdateError = false;
let didWarnSetDataError = false;

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
    const series = chart.addSeries(CandlestickSeries, {
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
          try {
            series.removePriceLine(referenceLine);
          } catch (err) {
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
        try {
          series.removePriceLine(referenceLine);
        } catch (err) {
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

    // Маленький helper для инкрементальных апдейтов
    const safeUpdateBar = (bar) => {
      try {
        series.update(bar);
      } catch (err) {
        if (!didWarnUpdateError) {
          console.warn(
            '[candles] series.update failed, incremental update skipped (see data & time ordering). Further update errors will be suppressed.',
            err,
          );
          didWarnUpdateError = true;
        }
      }
    };

    const safeSetData = (nextData) => {
      try {
        series.setData(nextData);
      } catch (err) {
        if (!didWarnSetDataError) {
          console.warn(
            '[candles] series.setData failed, data reset skipped. Further setData errors will be suppressed.',
            err,
          );
          didWarnSetDataError = true;
        }
      }
    };

    if (Array.isArray(data) && data.length) {
      safeSetData(data);
    }
    syncReferenceLine();

    return {
      id,
      z,
      /**
       * update(next)
       *
       * Контракт:
       *  - next === null/[]        → только реф-линия
       *  - next = {time,...}       → инкрементальный апдейт одного бара
       *  - next = [bars], len<=3   → несколько инкрементальных апдейтов
       *  - next = [bars], len>3    → полный reset через setData
       */
      update(next = []) {
        // Пустое обновление — только референс-линия
        if (!next || (Array.isArray(next) && next.length === 0)) {
          syncReferenceLine();
          return;
        }

        // Один бар (реалтайм / правка последнего бара)
        if (!Array.isArray(next) && next.time != null) {
          safeUpdateBar(next);
          syncReferenceLine();
          return;
        }

        if (Array.isArray(next)) {
          if (next.length <= 3) {
            // Небольшой патч (1–3 бара) — инкрементальные апдейты
            next.forEach((bar) => {
              if (bar && bar.time != null) {
                safeUpdateBar(bar);
              }
            });
          } else {
            // Крупный набор — считаем как полный срез данных
            safeSetData(next);
          }
          syncReferenceLine();
          return;
        }

        // Неподдерживаемый формат — просто держим reference line в актуальном состоянии
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
