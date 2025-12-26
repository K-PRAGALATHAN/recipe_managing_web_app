export function resolveISODate(input) {
  if (!input) return new Date().toISOString().slice(0, 10);
  if (typeof input !== 'string') return null;
  if (!/^\d{4}-\d{2}-\d{2}$/.test(input)) return null;
  return input;
}

