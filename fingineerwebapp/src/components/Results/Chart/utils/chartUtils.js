import { TickMarkType } from 'lightweight-charts';

// --- Вспомогательные функции ---

export const calculateBarSpacing = (interval, timeframe) => {
  // Примерное количество свечей для разных комбинаций
  const combinations = {
    // Минутные интервалы
    '1m': { '1d': 480, '5d': 2400, '1mth': 10800, '3mth': 32400, '6mth': 64800, '1y': 129600, 'all': 200000 },
    '5m': { '1d': 96, '5d': 480, '1mth': 2160, '3mth': 6480, '6mth': 12960, '1y': 25920, 'all': 40000 },
    '15m': { '1d': 32, '5d': 160, '1mth': 720, '3mth': 2160, '6mth': 4320, '1y': 8640, 'all': 13000 },
    '30m': { '1d': 16, '5d': 80, '1mth': 360, '3mth': 1080, '6mth': 2160, '1y': 4320, 'all': 6500 },
    '1h': { '1d': 8, '5d': 40, '1mth': 180, '3mth': 540, '6mth': 1080, '1y': 2160, 'all': 3250 },
    '1d': { '1d': 1, '5d': 5, '1mth': 30, '3mth': 90, '6mth': 180, '1y': 365, 'all': 1500 }
  };

  const candleCount = combinations[interval]?.[timeframe] || 100;
  
  // Специальная логика для 1-минутного интервала - увеличиваем масштаб еще больше
  if (interval === '1m') {
    if (candleCount > 5000) return 15;     // Очень много данных - но читаемые свечи
    if (candleCount > 2000) return 18;     // Много данных - нормальные свечи  
    if (candleCount > 1000) return 22;     // Средне много данных
    if (candleCount > 500) return 25;      // Средние данные
    if (candleCount > 200) return 30;      // Мало данных
    return 35;                             // Минимум данных - широкие свечи
  }
  
  // Увеличенные значения для остальных интервалов
  if (candleCount > 5000) return 12;     // Очень много данных - но читаемые свечи
  if (candleCount > 2000) return 15;     // Много данных - нормальные свечи  
  if (candleCount > 1000) return 18;     // Средне много данных
  if (candleCount > 500) return 22;      // Средние данные
  if (candleCount > 200) return 25;      // Мало данных
  if (candleCount > 50) return 30;       // Очень мало данных
  return 35;                             // Минимум данных - широкие свечи
};

// --- Создание серий ---
export const createSeries = (chart, type) => {
  const colors = {
    upColor: '#26a69a',
    downColor: '#ef5350',
    lineColor: '#2962ff',
    secondaryColor: '#ff6b35',
    topFillColor1: 'rgba(41, 98, 255, 0.28)',
    topFillColor2: 'rgba(41, 98, 255, 0.05)',
    bottomFillColor1: 'rgba(239, 83, 80, 0.05)',
    bottomFillColor2: 'rgba(239, 83, 80, 0.28)',
    neutralColor: '#9ca3af',
  };

  switch (type) {
    case 'candlestick':
      // Японские свечи
      return chart.addCandlestickSeries({
        upColor: colors.upColor,
        downColor: colors.downColor,
        borderVisible: false,
        wickUpColor: colors.upColor,
        wickDownColor: colors.downColor,
      });

    case 'hollow_candlestick':
      // Пустые свечи
      return chart.addCandlestickSeries({
        upColor: 'transparent',
        downColor: colors.downColor,
        borderUpColor: colors.upColor,
        borderDownColor: colors.downColor,
        wickUpColor: colors.upColor,
        wickDownColor: colors.downColor,
        borderVisible: true,
      });

    case 'bars':
      // Обычные бары
      return chart.addBarSeries({
        upColor: colors.upColor,
        downColor: colors.downColor,
        openVisible: true,
        thinBars: false,
      });

    case 'volume_candles':
      // Свечи объёма (симуляция через обычные свечи)
      return chart.addCandlestickSeries({
        upColor: colors.upColor,
        downColor: colors.downColor,
        borderVisible: true,
        wickUpColor: colors.upColor,
        wickDownColor: colors.downColor,
      });

    case 'line':
      // Обычная линия
      return chart.addLineSeries({
        color: colors.lineColor,
        lineWidth: 2,
        crosshairMarkerVisible: true,
        crosshairMarkerRadius: 6,
        crosshairMarkerBorderColor: colors.lineColor,
        crosshairMarkerBackgroundColor: '#ffffff',
      });

    case 'line_with_markers':
      // Линия с точками
      return chart.addLineSeries({
        color: colors.lineColor,
        lineWidth: 2,
        pointMarkersVisible: true,
        crosshairMarkerVisible: true,
        crosshairMarkerRadius: 8,
        crosshairMarkerBorderColor: colors.lineColor,
        crosshairMarkerBackgroundColor: '#ffffff',
      });

    case 'stepped_line':
      // Ступенчатая линия
      return chart.addLineSeries({
        color: colors.lineColor,
        lineWidth: 2,
        lineStyle: 0, // сплошная
        crosshairMarkerVisible: true,
        // Эмуляция ступенчатости через обычную линию
      });

    case 'area':
      // Область
      return chart.addAreaSeries({
        lineColor: colors.lineColor,
        topColor: colors.topFillColor1,
        bottomColor: colors.topFillColor2,
        lineWidth: 2,
        crosshairMarkerVisible: true,
      });

    case 'area_hlc':
      // Область HLC (симуляция через обычную область)
      return chart.addAreaSeries({
        lineColor: colors.secondaryColor,
        topColor: 'rgba(255, 107, 53, 0.28)',
        bottomColor: 'rgba(255, 107, 53, 0.05)',
        lineWidth: 2,
        crosshairMarkerVisible: true,
      });

    case 'baseline':
      // Базовая линия
      return chart.addBaselineSeries({
        baseValue: { type: 'price', price: 0 },
        topLineColor: colors.upColor,
        bottomLineColor: colors.downColor,
        topFillColor1: 'rgba(38, 166, 154, 0.28)',
        topFillColor2: 'rgba(38, 166, 154, 0.05)',
        bottomFillColor1: 'rgba(239, 83, 80, 0.05)',
        bottomFillColor2: 'rgba(239, 83, 80, 0.28)',
        lineWidth: 2,
      });

    case 'histogram':
      // Столбцы
      return chart.addHistogramSeries({
        color: colors.lineColor,
        priceFormat: { type: 'volume' },
      });

    case 'hi_lo':
      // Мин-Макс (симуляция через бары)
      return chart.addBarSeries({
        upColor: colors.neutralColor,
        downColor: colors.neutralColor,
        openVisible: false,
        thinBars: true,
      });

    case 'heikin_ashi':
      // Heikin Ashi свечи (симуляция через обычные свечи с модифицированными данными)
      return chart.addCandlestickSeries({
        upColor: '#00c851',
        downColor: '#ff4444',
        borderVisible: false,
        wickUpColor: '#00c851',
        wickDownColor: '#ff4444',
      });

    case 'renko':
      // Renko (симуляция через бары с фиксированным размером)
      return chart.addBarSeries({
        upColor: colors.upColor,
        downColor: colors.downColor,
        openVisible: false,
        thinBars: false,
      });

    case 'point_figure':
      // Point & Figure (симуляция через линию с маркерами)
      return chart.addLineSeries({
        color: colors.lineColor,
        lineWidth: 0,
        pointMarkersVisible: true,
        crosshairMarkerVisible: true,
        crosshairMarkerRadius: 8,
        crosshairMarkerBorderColor: colors.lineColor,
        crosshairMarkerBackgroundColor: '#ffffff',
      });

    case 'range_bars':
      // Range Bars (симуляция через обычные бары)
      return chart.addBarSeries({
        upColor: colors.upColor,
        downColor: colors.downColor,
        openVisible: true,
        thinBars: false,
      });

    case 'kagi':
      // Kagi (симуляция через ступенчатую линию)
      return chart.addLineSeries({
        color: colors.lineColor,
        lineWidth: 3,
        crosshairMarkerVisible: true,
      });

    case 'three_line_break':
      // Three Line Break (симуляция через свечи)
      return chart.addCandlestickSeries({
        upColor: 'transparent',
        downColor: 'transparent',
        borderUpColor: colors.upColor,
        borderDownColor: colors.downColor,
        wickVisible: false,
        borderVisible: true,
      });

    case 'volume_profile':
      // Volume Profile (симуляция через гистограмму)
      return chart.addHistogramSeries({
        color: colors.lineColor,
        priceFormat: { type: 'volume' },
        base: 0,
      });

    case 'market_profile':
      // Market Profile (симуляция через гистограмму)
      return chart.addHistogramSeries({
        color: '#8e44ad',
        priceFormat: { type: 'volume' },
        base: 0,
      });

    case 'tick_chart':
      // Tick Chart (симуляция через линию с частыми точками)
      return chart.addLineSeries({
        color: colors.lineColor,
        lineWidth: 1,
        pointMarkersVisible: true,
        crosshairMarkerVisible: true,
        crosshairMarkerRadius: 3,
      });

    case 'second_chart':
      // Second Chart (симуляция через свечи с высокой частотой)
      return chart.addCandlestickSeries({
        upColor: colors.upColor,
        downColor: colors.downColor,
        borderVisible: false,
        wickUpColor: colors.upColor,
        wickDownColor: colors.downColor,
      });

    default:
      // По умолчанию - Японские свечи
      return chart.addCandlestickSeries({
        upColor: colors.upColor,
        downColor: colors.downColor,
        borderVisible: false,
        wickUpColor: colors.upColor,
        wickDownColor: colors.downColor,
      });
  }
};

// --- Подготовка данных ---
export const prepareData = (rawCandles, type) => {
  // Убедимся, что rawCandles является массивом
  const candlesArray = Array.isArray(rawCandles) ? rawCandles : [];
  
  const baseCandles = candlesArray
    .filter(c => c && c.time) // Фильтруем недействительные свечи
    .map(c => ({
      time: Number(c.time),
      open: Number(c.open),
      high: Number(c.high),
      low: Number(c.low),
      close: Number(c.close),
      volume: Number(c.volume || 0),
    }))
    .sort((a, b) => a.time - b.time);

  switch (type) {
    case 'line':
    case 'line_with_markers':
    case 'stepped_line':
    case 'tick_chart':
      // Для линейных графиков используем только close цену
      return baseCandles.map(c => ({
        time: c.time,
        value: c.close,
      }));
      
    case 'area':
    case 'area_hlc':
      // Для областей также используем close цену
      return baseCandles.map(c => ({
        time: c.time,
        value: c.close,
      }));
      
    case 'baseline':
    case 'kagi':
    case 'point_figure':
      // Для базовой линии и специальных типов используем close цену
      return baseCandles.map(c => ({
        time: c.time,
        value: c.close,
      }));
      
    case 'histogram':
    case 'volume_profile':
    case 'market_profile':
      // Для гистограммы используем объём или close
      return baseCandles.map(c => ({
        time: c.time,
        value: c.volume || c.close,
        color: c.close >= c.open ? '#26a69a' : '#ef5350',
      }));

    case 'heikin_ashi':
      // Heikin Ashi - модифицированные свечи
      const heikinAshi = [];
      for (let i = 0; i < baseCandles.length; i++) {
        const current = baseCandles[i];
        const prev = i > 0 ? heikinAshi[i - 1] : null;
        
        const haClose = (current.open + current.high + current.low + current.close) / 4;
        const haOpen = prev ? (prev.open + prev.close) / 2 : (current.open + current.close) / 2;
        const haHigh = Math.max(current.high, haOpen, haClose);
        const haLow = Math.min(current.low, haOpen, haClose);
        
        heikinAshi.push({
          time: current.time,
          open: haOpen,
          high: haHigh,
          low: haLow,
          close: haClose,
        });
      }
      return heikinAshi;

    case 'renko':
      // Renko - фиксированные диапазоны (симуляция)
      const renkoSize = baseCandles.length > 0 ? (Math.max(...baseCandles.map(c => c.high)) - Math.min(...baseCandles.map(c => c.low))) / 50 : 1;
      const renko = [];
      let currentPrice = baseCandles[0]?.close || 0;
      
      baseCandles.forEach(candle => {
        const priceDiff = candle.close - currentPrice;
        if (Math.abs(priceDiff) >= renkoSize) {
          const direction = priceDiff > 0 ? 1 : -1;
          const blocks = Math.floor(Math.abs(priceDiff) / renkoSize);
          
          for (let i = 0; i < blocks; i++) {
            currentPrice += direction * renkoSize;
            renko.push({
              time: candle.time,
              open: currentPrice - direction * renkoSize,
              high: Math.max(currentPrice, currentPrice - direction * renkoSize),
              low: Math.min(currentPrice, currentPrice - direction * renkoSize),
              close: currentPrice,
            });
          }
        }
      });
      return renko;
      
    case 'candlestick':
    case 'hollow_candlestick':
    case 'volume_candles':
    case 'bars':
    case 'hi_lo':
    case 'range_bars':
    case 'three_line_break':
    case 'second_chart':
    default:
      // Для свечей, баров и подобных типов используем OHLC
      return baseCandles;
  }
};