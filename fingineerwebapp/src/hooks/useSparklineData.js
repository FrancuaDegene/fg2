import { useMemo } from 'react';

const DEFAULT_TICKER = 'DSKY';

const MOCK_SPARKLINES = {
  DSKY: {
    closes: [
      158.3, 158.4, 158.2, 158.5, 158.6, 158.9, 159.1, 159.4, 159.0, 158.8, 158.6, 158.9,
      159.2, 159.5, 159.7, 159.8, 160.1, 160.3, 160.0, 160.4, 160.7, 160.9, 161.2, 161.0,
      161.4, 161.7, 161.9, 162.1, 162.3, 162.1, 162.4, 162.7, 162.9, 163.1, 163.4, 163.0,
    ],
    deltaPct: 1.26,
  },
  SBER: {
    closes: [
      270.1, 269.8, 269.5, 269.3, 269.0, 268.7, 268.9, 269.1, 269.4, 269.2, 269.0, 269.3,
      269.7, 270.0, 270.2, 270.5, 270.8, 271.0, 270.6, 270.3, 270.1, 269.8, 269.6, 269.4,
      269.2, 269.0, 268.9, 268.7, 268.5, 268.4, 268.2, 268.0, 267.9, 267.7, 267.5, 267.3,
    ],
    deltaPct: -0.82,
  },
  GAZP: {
    closes: [
      168.0, 168.2, 168.5, 168.7, 168.9, 169.3, 169.6, 169.2, 168.8, 168.5, 168.1, 167.9,
      167.6, 167.4, 167.2, 167.0, 166.9, 166.7, 166.5, 166.3, 166.1, 165.9, 165.7, 165.5,
      165.6, 165.8, 166.0, 166.3, 166.6, 166.8, 167.1, 167.4, 167.6, 167.9, 168.1, 168.4,
    ],
    deltaPct: 0.45,
  },
  LKOH: {
    closes: [
      5520, 5517, 5515, 5512, 5508, 5505, 5502, 5500, 5504, 5508, 5511, 5515,
      5518, 5522, 5526, 5529, 5531, 5535, 5538, 5541, 5545, 5548, 5550, 5553,
      5557, 5560, 5564, 5567, 5571, 5575, 5578, 5581, 5585, 5588, 5592, 5595,
    ],
    deltaPct: 0.62,
  },
};

export function useSparklineBulk(tickers = []) {
  const list = useMemo(() => {
    if (!tickers) return [];
    return Array.isArray(tickers) ? tickers : [tickers];
  }, [tickers]);

  const sparkMap = useMemo(() => {
    return list.reduce((acc, item) => {
      if (typeof item !== 'string' || item.trim().length === 0) {
        return acc;
      }
      const ticker = item.trim();
      const base = MOCK_SPARKLINES[ticker];
      if (!base) {
        return acc;
      }

      acc[ticker] = {
        closes: [...base.closes],
        deltaPct: base.deltaPct,
      };
      return acc;
    }, {});
  }, [list]);

  return { sparkMap };
}

export function useSparklineData(ticker) {
  const resolvedTicker = typeof ticker === 'string' && ticker.trim().length > 0 ? ticker.trim() : DEFAULT_TICKER;
  const { sparkMap } = useSparklineBulk([resolvedTicker]);
  const pulseData = sparkMap[resolvedTicker] ?? MOCK_SPARKLINES[DEFAULT_TICKER];

  return { pulseData };
}
