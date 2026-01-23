// src/indicators/engine.test.js
import { sma, ema, rsi } from './engine';

describe('sma', () => {
  test('считает среднее по 3 точкам', () => {
    const data = [
      { time: 1, close: 10 },
      { time: 2, close: 20 },
      { time: 3, close: 40 },
    ];

    const result = sma(data, 3);

    expect(result).toHaveLength(1);
    expect(result[0].time).toBe(3);
    expect(result[0].value).toBeCloseTo((10 + 20 + 40) / 3);
  });

  test('возвращает пустой массив для пустых данных', () => {
    expect(sma([], 3)).toEqual([]);
  });

  test('period = 1 копирует close', () => {
    const data = [
      { time: 1, close: 5 },
      { time: 2, close: 7 },
    ];

    const result = sma(data, 1);

    expect(result).toEqual([
      { time: 1, value: 5 },
      { time: 2, value: 7 },
    ]);
  });
});

describe('ema', () => {
  test('возвращает столько же точек, сколько входных', () => {
    const data = [
      { time: 1, close: 10 },
      { time: 2, close: 20 },
      { time: 3, close: 30 },
    ];

    const result = ema(data, 2);

    expect(result).toHaveLength(3);
    result.forEach((point, index) => {
      expect(point.time).toBe(data[index].time);
      expect(typeof point.value).toBe('number');
    });
  });
});

describe('rsi', () => {
  test('возвращает пусто, если данных меньше period+1', () => {
    const data = [
      { time: 1, close: 10 },
      { time: 2, close: 11 },
    ];

    expect(rsi(data, 14)).toEqual([]);
  });

  test('значения RSI в диапазоне 0..100', () => {
    const data = [];
    let price = 100;

    for (let i = 0; i < 50; i += 1) {
      price += (Math.random() - 0.5) * 2;
      data.push({ time: i + 1, close: price });
    }

    const result = rsi(data, 14);

    result.forEach((point) => {
      expect(point.value).toBeGreaterThanOrEqual(0);
      expect(point.value).toBeLessThanOrEqual(100);
    });
  });
});

