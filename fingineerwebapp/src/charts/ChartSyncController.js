import { SyncBus } from './SyncBus';

/**
 * Координатор нескольких lightweight-charts панелей.
 * Синхронизирует видимый логический диапазон (scroll/zoom) и публикует hover-time.
 */
export class ChartSyncController {
  constructor() {
    this._charts = new Set();
    this._lock = false;
    this._raf = 0;
    this._teardown = new Map();
    this.hover = new SyncBus();
  }

  /**
   * Регистрирует чарт и подключает синхронизацию.
   * @param {IChartApi} chart
   * @param {{ isBottom?: boolean }} options
   */
  register(chart, { isBottom = false } = {}) {
    if (!chart || this._charts.has(chart)) return;

    this._charts.add(chart);

    const timeScale = chart.timeScale();

    const handleRangeChange = (range) => {
      if (!range || this._lock) return;
      cancelAnimationFrame(this._raf);
      this._raf = requestAnimationFrame(() => {
        this._lock = true;
        this._charts.forEach((c) => {
          if (c !== chart) {
            try {
              c.timeScale().setVisibleLogicalRange(range);
            } catch (err) {
              console.warn('[ChartSyncController] setVisibleLogicalRange failed', err);
            }
          }
        });
        this._lock = false;
      });
    };

    const handleCrosshair = (param) => {
      // Передаём только «время» — конкретная панель сама решит, как отрисовать hairline.
      this.hover.emit(param?.time ?? null);
    };

    timeScale.subscribeVisibleLogicalRangeChange(handleRangeChange);
    chart.subscribeCrosshairMove(handleCrosshair);

    chart.applyOptions({
      layout: { fontFamily: 'Inter, system-ui, sans-serif' },
      grid: {
        vertLines: { visible: false },
        horzLines: { visible: true, color: 'rgba(197,203,206,0.2)' },
      },
      timeScale: { visible: isBottom, borderVisible: false },
    });

    this._teardown.set(chart, () => {
      try {
        timeScale.unsubscribeVisibleLogicalRangeChange(handleRangeChange);
      } catch (err) {
        console.warn('[ChartSyncController] unsubscribe range failed', err);
      }
      try {
        chart.unsubscribeCrosshairMove(handleCrosshair);
      } catch (err) {
        console.warn('[ChartSyncController] unsubscribe crosshair failed', err);
      }
      this.hover.emit(null);
    });
  }

  unregister(chart) {
    if (!this._charts.has(chart)) return;
    const teardown = this._teardown.get(chart);
    if (typeof teardown === 'function') teardown();
    this._teardown.delete(chart);
    this._charts.delete(chart);
  }
}

