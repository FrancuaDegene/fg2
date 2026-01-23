export function calcSparklinePoints(closes = [], width = 0, height = 0) {
  if (!Array.isArray(closes) || closes.length === 0 || width <= 0 || height <= 0) {
    return {
      pointsString: '',
      minVal: null,
      maxVal: null,
    };
  }

  const min = Math.min(...closes);
  const max = Math.max(...closes);
  // Add data padding so extremes don't sit on the edge.
  const rawRange = max - min;
  const MIN_PAD_PX = 12;
  const minPadRatio = 0.04;
  const padRatio = Math.max(minPadRatio, MIN_PAD_PX / Math.max(1, height));
  const rangePad = (rawRange === 0 ? 1 : rawRange) * padRatio;
  const minAdj = min - rangePad;
  const maxAdj = max + rangePad;
  const range = maxAdj - minAdj;
  // Keep stroke/glow fully inside the canvas.
  const PAD = 18;
  const padY = Math.max(PAD, Math.round(height * 0.11));
  const padX = Math.max(6, Math.round(width * 0.01));
  const innerW = Math.max(1, width - padX * 2);
  const innerH = Math.max(1, height - padY * 2);
  const stepX = closes.length > 1 ? innerW / (closes.length - 1) : 0;
  const clamp = (v, lo, hi) => Math.max(lo, Math.min(hi, v));

  const points = closes.map((price, index) => {
    const x = padX + stepX * index;
    const normalized = range === 0 ? 0.5 : (price - minAdj) / range;
    const y = padY + (1 - normalized) * innerH;

    const yClamped = clamp(y, padY, height - padY);
    return `${clamp(x, 0, width).toFixed(2)},${yClamped.toFixed(2)}`;
  });

  return {
    pointsString: points.join(' '),
    minVal: min,
    maxVal: max,
  };
}
