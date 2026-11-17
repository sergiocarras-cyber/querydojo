import type { PGlite } from '@electric-sql/pglite';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { evaluateSql, type JobRunner } from '../src/lib/sql/evaluate';
import type { SqlProblem } from '../src/lib/problems/types';
import { loadAllProblems } from './loadProblems';
import { createNodeRunner } from './nodeSqlRunner';

const sqlProblems = loadAllProblems().filter((p): p is SqlProblem => p.section === 'sql');

let run: JobRunner;
let db: PGlite;
beforeAll(async () => {
  ({ run, db } = await createNodeRunner());
});
afterAll(async () => {
  await db.close();
});

describe.each(sqlProblems.map((p) => [p.id, p] as const))('%s', (_id, p) => {
  it('has at least one hidden dataset', () => {
    expect(p.hiddenData.length).toBeGreaterThan(0);
  });

  it('official solution returns rows on the visible dataset', async () => {
    const [[res]] = await run(p.schema, [{ data: p.data, queries: [p.solution] }]);
    expect(res.ok, res.ok ? '' : res.error).toBe(true);
    expect(res.ok && res.result && res.result.rows.length).toBeGreaterThan(0);
  });

  it('official solution is accepted on Submit (every dataset)', async () => {
    const ev = await evaluateSql(p, p.solution, 'submit', run);
    expect(ev.status).toBe('accepted');
    expect(ev.total).toBe(1 + p.hiddenData.length);
  });

  it('starter code runs against the schema', async () => {
    const [[res]] = await run(p.schema, [{ data: p.data, queries: [p.starter] }]);
    expect(res.ok, res.ok ? '' : res.error).toBe(true);
  });

  it.each(p.wrongAnswers.map((q, i) => [i + 1, q] as const))('wrong answer #%i is rejected', async (_i, query) => {
    const ev = await evaluateSql(p, query, 'submit', run);
    expect(ev.status).not.toBe('accepted');
  });
});
