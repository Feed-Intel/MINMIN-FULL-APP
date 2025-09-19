export const safeCount = (value: unknown, fallback = 0): number => {
  const parsed = Number(value);
  if (!Number.isFinite(parsed) || parsed < 0) {
    return fallback;
  }

  const rounded = Math.floor(parsed);
  return rounded < 0 ? fallback : rounded;
};
