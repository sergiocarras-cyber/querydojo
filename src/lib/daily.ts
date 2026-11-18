import type { ProblemMeta } from './problems/types';

/** Local calendar date as YYYY-MM-DD. */
export function todayKey(date = new Date()): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

/** Small deterministic string hash (FNV-1a). */
function hash(text: string): number {
  let h = 0x811c9dc5;
  for (let i = 0; i < text.length; i++) {
    h ^= text.charCodeAt(i);
    h = Math.imul(h, 0x01000193);
  }
  return h >>> 0;
}

/** Same problem all day long, different one tomorrow. */
export function problemOfTheDay(all: ProblemMeta[], date = new Date()): ProblemMeta | undefined {
  if (all.length === 0) return undefined;
  return all[hash(todayKey(date)) % all.length];
}
