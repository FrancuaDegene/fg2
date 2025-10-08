// src/indicators/indicators.worker.js
/* eslint-env worker */
/* eslint-disable no-restricted-globals */
 

import { sma, ema, rsi } from './engine.js';

addEventListener('message', (e) => {
  const { id, type, payload } = e.data || {};
  try {
    let data;
    switch (type) {
      case 'SMA':
        data = sma(payload.data, payload.period);
        break;
      case 'EMA':
        data = ema(payload.data, payload.period);
        break;
      case 'RSI':
        data = rsi(payload.data, payload.period || 14);
        break;
      default:
        postMessage({ id, ok: false, error: 'Unknown type' });
        return;
    }
    postMessage({ id, ok: true, data });
  } catch (err) {
    const msg = (err && err.message) ? err.message : String(err);
    postMessage({ id, ok: false, error: msg });
  }
});
