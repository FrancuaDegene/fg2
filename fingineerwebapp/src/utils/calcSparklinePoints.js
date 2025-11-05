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
  const range = max - min;
  const stepX = closes.length > 1 ? width / (closes.length - 1) : 0;

  const points = closes.map((price, index) => {
    const x = stepX * index;
    const normalized = range === 0 ? 0.5 : (price - min) / range;
    const y = height - normalized * height;

    return `${x.toFixed(2)},${y.toFixed(2)}`;
  });

  return {
    pointsString: points.join(' '),
    minVal: min,
    maxVal: max,
  };
}
