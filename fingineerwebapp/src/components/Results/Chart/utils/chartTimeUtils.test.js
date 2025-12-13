// src/components/Results/Chart/utils/chartTimeUtils.test.js
import {
  toNumber,
  resolveSeriesKind,
  normalizeTimeValue,
  toTimestampMs,
  toEpochSec,
  clamp,
  binSearchByTime,
  resolvePriceScaleBorder,
} from './chartTimeUtils';

describe('toNumber', () => {
  test('возвращает число для строк и чисел', () => {
    expect(toNumber(10)).toBe(10);
    expect(toNumber('42.5')).toBe(42.5);
  });

  test('возвращает null для NaN/undefined/null', () => {
    expect(toNumber(null)).toBeNull();
    expect(toNumber(undefined)).toBeNull();
    expect(toNumber('abc')).toBeNull();
  });
});

describe('resolveSeriesKind', () => {
  test('распознаёт line-типы как line', () => {
    ['line', 'LINE', 'area', 'baseline', 'histogram'].forEach((type) => {
      expect(resolveSeriesKind(type)).toBe('line');
    });
  });

  test('прочие типы считаются candles', () => {
    ['candlestick', 'bars', 'heikin_ashi', undefined].forEach((type) => {
      expect(resolveSeriesKind(type)).toBe('candles');
    });
  });
});

describe('normalizeTimeValue / toEpochSec / toTimestampMs', () => {
  test('обрабатывают timestamp в секундах', () => {
    const sec = 1700000000;
    expect(normalizeTimeValue(sec)).toBe(sec);
    expect(toEpochSec(sec)).toBe(sec);
    expect(toTimestampMs(sec)).toBe(sec * 1000);
  });

  test('обрабатывают timestamp в миллисекундах', () => {
    const ms = 1700000000123;
    expect(toEpochSec(ms)).toBe(Math.floor(ms / 1000));
    expect(toTimestampMs(ms)).toBe(Math.floor(ms));
  });

  test('обрабатывают объект {year,month,day}', () => {
    const obj = { year: 2023, month: 12, day: 31 };
    const sec = normalizeTimeValue(obj);
    expect(typeof sec).toBe('number');
    expect(sec).toBe(toEpochSec(obj));
  });

  test('возвращают null для мусора', () => {
    expect(normalizeTimeValue({})).toBeNull();
    expect(toEpochSec('abc')).toBeNull();
    expect(toTimestampMs('abc')).toBeNull();
  });
});

describe('clamp', () => {
  test('ограничивает значения границами', () => {
    expect(clamp(5, 0, 10)).toBe(5);
    expect(clamp(-1, 0, 10)).toBe(0);
    expect(clamp(99, 0, 10)).toBe(10);
  });
});

describe('binSearchByTime', () => {
  const list = [
    { time: 10 },
    { time: 20 },
    { time: 30 },
    { time: 40 },
  ];

  test('находит индекс ближайшего слева', () => {
    expect(binSearchByTime(list, 5)).toBe(0);
    expect(binSearchByTime(list, 10)).toBe(0);
    expect(binSearchByTime(list, 25)).toBe(2);
    expect(binSearchByTime(list, 100)).toBe(3);
  });

  test('режим rightMost возвращает правую границу', () => {
    expect(binSearchByTime(list, 30, true)).toBe(1);
    expect(binSearchByTime(list, 35, true)).toBe(2);
  });
});

describe('resolvePriceScaleBorder', () => {
  test('возвращает разные цвета для expanded/normal', () => {
    const expanded = resolvePriceScaleBorder(true);
    const normal = resolvePriceScaleBorder(false);
    expect(typeof expanded).toBe('string');
    expect(typeof normal).toBe('string');
    expect(expanded).not.toBe(normal);
  });
});

