// numberFormat.js - shared UI-only number formatting helpers

export function formatNumber(value, decimals = 2, fallback = '—') {
  if (value === null || value === undefined) return fallback;
  if (typeof value === 'string' && value.trim() === '') return fallback;

  const num = Number(value);
  if (!Number.isFinite(num)) return fallback;

  return new Intl.NumberFormat('en-US', {
    minimumFractionDigits: 0,
    maximumFractionDigits: decimals,
  }).format(num);
}

export function formatNumberWithUnit(value, unit, decimals = 2, fallback = '—') {
  const formatted = formatNumber(value, decimals, fallback);
  return formatted === fallback ? fallback : `${formatted} ${unit}`;
}
