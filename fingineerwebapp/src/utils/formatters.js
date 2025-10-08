// Утилиты для форматирования данных
export const formatPrice = (price) => {
  if (!price || price === 'N/A') return '—';
  return `${Number(price).toLocaleString('ru-RU')} ₽`;
};

export const formatPercent = (value) => {
  if (!value || value === 'N/A') return '—';
  return `${Number(value).toFixed(2)}%`;
};

export const formatDate = (dateString) => {
  if (!dateString) return '—';
  try {
    const date = new Date(dateString);
    return date.toLocaleDateString('ru-RU');
  } catch {
    return '—';
  }
};

export const formatDateTime = (dateString, timeString) => {
  if (!dateString) return '—';
  try {
    const date = new Date(dateString);
    const formattedDate = date.toLocaleDateString('ru-RU');
    return timeString ? `${formattedDate} ${timeString}` : formattedDate;
  } catch {
    return '—';
  }
};

export const formatVolume = (volume) => {
  if (!volume || volume === 'N/A') return '—';
  const num = Number(volume);
  if (num >= 1000000000) return `${(num / 1000000000).toFixed(1)}Б`;
  if (num >= 1000000) return `${(num / 1000000).toFixed(1)}М`;
  if (num >= 1000) return `${(num / 1000).toFixed(1)}К`;
  return num.toLocaleString('ru-RU');
};