import { guardIntervalForTimeframe } from '../utils/chart/timeframes';

export function fixIntervalForTimeframe(interval, timeframe, options = {}) {
  const { isExpanded = false } = options;
  const result = guardIntervalForTimeframe({ timeframe, interval, isExpanded });

  if (process.env.NODE_ENV !== 'production') {
    console.log('[FG][UX][TFGuard]', {
      requestedInterval: interval,
      fixedInterval: result.interval,
      timeframe,
      isExpanded,
      changed: Boolean(result.changed),
      reason: result.reason ?? null,
    });
  }

  return result.interval;
}
