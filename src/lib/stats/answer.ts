/**
 * Parses what the user typed as a numeric answer. Accepts decimals with "."
 * or ",", fractions ("3/8"), percentages ("37.5%"), scientific notation and
 * simple products/powers are NOT evaluated (keep answers as plain numbers).
 */
export function parseNumericAnswer(input: string): number | null {
  const text = input.trim().replace(/\s+/g, '');
  if (!text) return null;
  const pct = text.endsWith('%');
  const body = (pct ? text.slice(0, -1) : text).replace(',', '.');
  let value: number;
  const frac = /^([+-]?\d+(?:\.\d+)?)\/(\d+(?:\.\d+)?)$/.exec(body);
  if (frac) {
    const den = Number(frac[2]);
    if (den === 0) return null;
    value = Number(frac[1]) / den;
  } else if (/^[+-]?(\d+\.?\d*|\.\d+)(e[+-]?\d+)?$/i.test(body)) {
    value = Number(body);
  } else {
    return null;
  }
  if (!Number.isFinite(value)) return null;
  return pct ? value / 100 : value;
}

export function isNumericCorrect(value: number, answer: number, tolerance: number): boolean {
  return Math.abs(value - answer) <= tolerance + 1e-12;
}

/** Short display of a number: up to 6 significant decimals, no trailing zeros. */
export function formatNumber(n: number): string {
  if (Number.isInteger(n)) return String(n);
  return String(Number(n.toFixed(6)));
}
