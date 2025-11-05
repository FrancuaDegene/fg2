const createValidationError = (message) => {
  const error = new Error(message);
  error.status = 400;
  return error;
};

function sanitizeTicker(raw) {
  if (raw === undefined || raw === null) {
    throw createValidationError('Тикер обязателен');
  }
  const value = String(raw).trim().toUpperCase();
  if (!value || !/^[A-Z0-9._-]{1,20}$/.test(value)) {
    throw createValidationError('Некорректный тикер');
  }
  return value;
}

function sanitizeQuery(raw) {
  if (raw === undefined || raw === null) {
    throw createValidationError('Пустой запрос');
  }
  const value = String(raw).trim().toLowerCase();
  if (!value) {
    throw createValidationError('Пустой запрос');
  }
  if (!/^[a-zа-я0-9 .,_-]{1,64}$/i.test(raw)) {
    throw createValidationError('Некорректный формат запроса');
  }
  return value;
}

function sanitizeSearchQuery(raw) {
  if (raw === undefined || raw === null) {
    throw createValidationError('Не указан параметр searchQuery');
  }
  const value = String(raw).trim();
  if (!value) {
    throw createValidationError('Не указан параметр searchQuery');
  }
  if (!/^[A-Za-z0-9._-]{1,20}$/.test(value)) {
    throw createValidationError('Некорректный параметр searchQuery');
  }
  return value.toUpperCase();
}

module.exports = {
  sanitizeTicker,
  sanitizeQuery,
  sanitizeSearchQuery,
};
