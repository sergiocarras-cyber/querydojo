import { PGlite } from '@electric-sql/pglite';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { PG_PARSERS, loadDataset, runQuery } from '../src/lib/sql/engine';
import type { SqlProblem } from '../src/lib/problems/types';
import { loadAllProblems } from './loadProblems';

const sqlProblems = loadAllProblems().filter((p): p is SqlProblem => p.section === 'sql');

let db: PGlite;
beforeAll(async () => {
  db = await PGlite.create({ parsers: PG_PARSERS });
});
afterAll(async () => {
  await db.close();
});

describe.each(sqlProblems.map((p) => [p.id, p] as const))('%s', (_id, p) => {
  it('official solution runs on the visible dataset and returns rows', async () => {
    await loadDataset(db, p.schema, p.data);
    const rs = await runQuery(db, p.solution);
    expect(rs).not.toBeNull();
    expect(rs!.rows.length).toBeGreaterThan(0);
  });

  it('official solution runs on every hidden dataset', async () => {
    expect(p.hiddenData.length).toBeGreaterThan(0);
    for (const data of p.hiddenData) {
      await loadDataset(db, p.schema, data);
      expect(await runQuery(db, p.solution)).not.toBeNull();
    }
  });

  it('starter code is valid SQL against the schema', async () => {
    await loadDataset(db, p.schema, p.data);
    await expect(runQuery(db, p.starter)).resolves.toBeDefined();
  });
});
