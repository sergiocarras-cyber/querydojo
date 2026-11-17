import { describe, expect, it } from 'vitest';
import type { ResultSet } from '../src/lib/sql/engine';
import { compareResults } from '../src/lib/sql/grade';

const INT = 23;
const TEXT = 25;
const NUMERIC = 1700;
const DATE = 1082;
const TS = 1114;

const rs = (columns: string[], types: number[], rows: ResultSet['rows']): ResultSet => ({ columns, types, rows });

describe('compareResults', () => {
  const expected = rs(['plan', 'n'], [TEXT, INT], [['a', 1], ['b', 2]]);

  it('accepts identical results', () => {
    expect(compareResults(expected, expected, true).pass).toBe(true);
  });

  it('ignores row order unless required', () => {
    const swapped = rs(['plan', 'n'], [TEXT, INT], [['b', 2], ['a', 1]]);
    expect(compareResults(expected, swapped, false).pass).toBe(true);
    const v = compareResults(expected, swapped, true);
    expect(v.pass).toBe(false);
    expect(!v.pass && v.kind).toBe('order');
  });

  it('checks column names in order, case-insensitively', () => {
    expect(compareResults(expected, rs(['PLAN', 'N'], [TEXT, INT], expected.rows), true).pass).toBe(true);
    const v = compareResults(expected, rs(['n', 'plan'], [INT, TEXT], [[1, 'a'], [2, 'b']]), false);
    expect(!v.pass && v.kind).toBe('columns');
  });

  it('treats int, numeric strings and floats as numbers with tolerance', () => {
    const e = rs(['x'], [NUMERIC], [['2.50'], ['0.3333333333']]);
    const a = rs(['x'], [INT], [[2.5], [0.33333333331]]);
    expect(compareResults(e, a, true).pass).toBe(true);
    expect(compareResults(e, rs(['x'], [NUMERIC], [['2.50'], ['0.33']]), true).pass).toBe(false);
  });

  it('treats a midnight timestamp as equal to the date', () => {
    const e = rs(['d'], [DATE], [['2025-10-01']]);
    expect(compareResults(e, rs(['d'], [TS], [['2025-10-01 00:00:00']]), true).pass).toBe(true);
    expect(compareResults(e, rs(['d'], [TS], [['2025-10-01 10:00:00']]), true).pass).toBe(false);
  });

  it('distinguishes NULL from values and counts duplicates', () => {
    const e = rs(['x'], [INT], [[null], [1], [1]]);
    expect(compareResults(e, rs(['x'], [INT], [[1], [null], [1]]), false).pass).toBe(true);
    const v = compareResults(e, rs(['x'], [INT], [[1], [null], [null]]), false);
    expect(v.pass).toBe(false);
    expect(!v.pass && v.diff?.missing).toEqual([[1]]);
    expect(!v.pass && v.diff?.extra).toEqual([[null]]);
  });

  it('reports row-count mismatches and missing results', () => {
    expect(compareResults(expected, rs(['plan', 'n'], [TEXT, INT], [['a', 1]]), false)).toMatchObject({
      pass: false,
      kind: 'row-count',
    });
    expect(compareResults(expected, null, false)).toMatchObject({ pass: false, kind: 'no-result' });
  });
});
