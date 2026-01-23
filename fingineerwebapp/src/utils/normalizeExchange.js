// Normalize exchange names to standardized codes
export function normalizeExchange(raw) {
  if (raw === null || raw === undefined) return '';
  const normalized = String(raw).trim();
  if (!normalized) return '';

  const lower = normalized.toLowerCase();
  switch (lower) {
    case 'ммвб':
    case 'московская биржа':
    case 'московская фондовая биржа':    case 'moex':
    case 'moscow exchange':
    case 'moex (moscow exchange)':
      return 'MOEX';
    default:
      return normalized.toUpperCase();
  }
}
