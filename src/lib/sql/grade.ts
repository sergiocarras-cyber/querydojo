import type { Cell, ResultSet } from './engine';

/**
 * Pure comparison of a user's result set against the official one.
 * Shared by the browser and the Vitest suite.
 */

const NUMERIC_TYPES = new Set([20, 21, 23, 700, 701, 1700]); // int8, int2, int4, float4, float8, numeric
const FLOAT_TOLERANCE = 1e-6;

/** Canonical cell value: numerics become numbers, midnight timestamps become dates. */
export function normalizeCell(value: Cell, typeId: number | undefined): Cell {
  if (value === null) return null;
  if (typeof value === 'string' && typeId !== undefined && NUMERIC_TYPES.has(typeId)) {
    const n = Number(value);
    return Number.isNaN(n) ? value : n;
  }
  if (typeof value === 'string' && (typeId === 1114 || typeId === 1184)) {
    // '2025-10-01 00:00:00' and the date '2025-10-01' are treated as equal.
    return value.replace(/ 00:00:00(\+00)?$/, '');
  }
  return value;
}

function cellsEqual(a: Cell, b: Cell): boolean {
  if (typeof a === 'number' && typeof b === 'number') {
    return Math.abs(a - b) <= FLOAT_TOLERANCE * Math.max(1, Math.abs(a), Math.abs(b));
  }
  return a === b;
}

function rowsEqual(a: Cell[], b: Cell[]): boolean {
  return a.length === b.length && a.every((cell, i) => cellsEqual(cell, b[i]));
}

/** Key used to match rows regardless of order (numbers rounded to absorb float noise). */
function rowKey(row: Cell[]): string {
  return JSON.stringify(row.map((c) => (typeof c === 'number' ? Math.round(c * 1e6) / 1e6 : c)));
}

function normalizeRows(rs: ResultSet): Cell[][] {
  return rs.rows.map((row) => row.map((cell, i) => normalizeCell(cell, rs.types[i])));
}

export type MismatchKind = 'no-result' | 'columns' | 'row-count' | 'rows' | 'order';

export interface RowDiff {
  /** Expected rows that are missing from the user's result (with multiplicity). */
  missing: Cell[][];
  /** User rows that should not be there. */
  extra: Cell[][];
  /** For ordered comparisons: index of the first differing row. */
  firstMismatch?: number;
}

export type Verdict =
  | { pass: true }
  | { pass: false; kind: MismatchKind; message: string; diff?: RowDiff };

export function compareResults(expected: ResultSet, actual: ResultSet | null, orderMatters: boolean): Verdict {
  if (!actual) {
    return { pass: false, kind: 'no-result', message: 'Tu consulta no devolvió ningún resultado (¿falta un SELECT final?).' };
  }

  const expCols = expected.columns.map((c) => c.toLowerCase());
  const actCols = actual.columns.map((c) => c.toLowerCase());
  if (expCols.length !== actCols.length || expCols.some((c, i) => c !== actCols[i])) {
    return {
      pass: false,
      kind: 'columns',
      message: `Columnas distintas. Esperadas: (${expected.columns.join(', ')}). Obtenidas: (${actual.columns.join(', ')}).`,
    };
  }

  const exp = normalizeRows(expected);
  const act = normalizeRows(actual);

  // Multiset difference, used for both ordered and unordered checks.
  const pool = new Map<string, number>();
  for (const row of act) pool.set(rowKey(row), (pool.get(rowKey(row)) ?? 0) + 1);
  const missing: Cell[][] = [];
  for (const row of exp) {
    const k = rowKey(row);
    const n = pool.get(k) ?? 0;
    if (n > 0) pool.set(k, n - 1);
    else missing.push(row);
  }
  const extraPool = new Map<string, number>();
  for (const row of exp) extraPool.set(rowKey(row), (extraPool.get(rowKey(row)) ?? 0) + 1);
  const extra: Cell[][] = [];
  for (const row of act) {
    const k = rowKey(row);
    const n = extraPool.get(k) ?? 0;
    if (n > 0) extraPool.set(k, n - 1);
    else extra.push(row);
  }

  if (exp.length !== act.length) {
    return {
      pass: false,
      kind: 'row-count',
      message: `Número de filas distinto: se esperaban ${exp.length} y se obtuvieron ${act.length}.`,
      diff: { missing, extra },
    };
  }
  if (missing.length > 0 || extra.length > 0) {
    return {
      pass: false,
      kind: 'rows',
      message: `${missing.length} fila(s) esperada(s) no aparecen en tu resultado.`,
      diff: { missing, extra },
    };
  }
  if (orderMatters) {
    const idx = exp.findIndex((row, i) => !rowsEqual(row, act[i]));
    if (idx !== -1) {
      return {
        pass: false,
        kind: 'order',
        message: `Las filas son correctas pero el orden no: la primera diferencia está en la fila ${idx + 1}. Revisa el ORDER BY que pide el enunciado.`,
        diff: { missing: [], extra: [], firstMismatch: idx },
      };
    }
  }
  return { pass: true };
}

/**
 * Partial credit for one dataset, 0..1: matching rows over the larger of the
 * two row counts; right rows in the wrong order are worth 0.75.
 */
export function caseScore(verdict: Verdict, expected: ResultSet, actual: ResultSet | null): number {
  if (verdict.pass) return 1;
  if (!actual || verdict.kind === 'no-result' || verdict.kind === 'columns') return 0;
  if (verdict.kind === 'order') return 0.75;
  const missing = verdict.diff?.missing.length ?? expected.rows.length;
  const denom = Math.max(expected.rows.length, actual.rows.length);
  return denom ? Math.max(0, expected.rows.length - missing) / denom : 0;
}

/** Small stable hash (FNV-1a, 2×32 bits) for fingerprints. */
export function shortHash(text: string): string {
  let h1 = 0x811c9dc5;
  let h2 = 0x01000193;
  for (let i = 0; i < text.length; i++) {
    const c = text.charCodeAt(i);
    h1 = Math.imul(h1 ^ c, 0x01000193);
    h2 = Math.imul(h2 ^ c, 0x5bd1e995);
  }
  return (h1 >>> 0).toString(16).padStart(8, '0') + (h2 >>> 0).toString(16).padStart(4, '0').slice(0, 4);
}

/** Fingerprint of a wrong result: same columns and rows (order-insensitive unless required) give the same token. */
export function resultFingerprint(actual: ResultSet | null, orderMatters: boolean): string {
  if (!actual) return 'none';
  const keys = normalizeRows(actual).map(rowKey);
  if (!orderMatters) keys.sort();
  return 'out:' + shortHash(JSON.stringify([actual.columns.map((c) => c.toLowerCase()), keys]));
}
