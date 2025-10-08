// src/indicators/engine.js
export function sma(data, period) {
  if (!Array.isArray(data) || data.length === 0) return [];
  period = Math.max(1, period|0);
  if (period === 1) return data.map(d => ({ time: d.time, value: d.close }));
  let sum = 0, out = [];
  for (let i=0;i<data.length;i++){
    sum += data[i].close;
    if (i >= period) sum -= data[i - period].close;
    if (i >= period - 1) out.push({ time: data[i].time, value: sum / period });
  }
  return out;
}

export function ema(data, period) {
  if (!Array.isArray(data) || data.length === 0) return [];
  period = Math.max(1, period|0);
  const k = 2 / (period + 1);
  const out = [];
  let prev = data[0].close;
  for (let i=0;i<data.length;i++){
    const v = i ? data[i].close * k + prev * (1 - k) : prev;
    out.push({ time: data[i].time, value: v }); prev = v;
  }
  return out;
}

export function rsi(data, period = 14) {
  if (!Array.isArray(data) || data.length < period + 1) return [];
  let gain=0, loss=0;
  for (let i=1;i<=period;i++){
    const ch = data[i].close - data[i-1].close;
    if (ch >= 0) gain += ch; else loss -= ch;
  }
  gain/=period; loss/=period;
  const out = [];
  for (let i=period+1;i<data.length;i++){
    const ch = data[i].close - data[i-1].close;
    const g = ch>0?ch:0, l = ch<0?-ch:0;
    gain = (gain*(period-1)+g)/period;
    loss = (loss*(period-1)+l)/period;
    const rs = loss === 0 ? 100 : gain / loss;
    const val = 100 - 100/(1+rs);
    out.push({ time: data[i].time, value: Math.max(0, Math.min(100, val)) });
  }
  return out;
}
