import { PGlite } from '@electric-sql/pglite';
import { PG_PARSERS, loadDataset, runQuery } from '../src/lib/sql/engine';
import type { JobRunner } from '../src/lib/sql/evaluate';
import type { JobResults } from '../src/lib/sql/protocol';

/** Same contract as the browser worker, backed by an in-process PGlite. */
export async function createNodeRunner(): Promise<{ run: JobRunner; db: PGlite }> {
  const db = await PGlite.create({ parsers: PG_PARSERS });
  const run: JobRunner = async (schema, jobs) => {
    const all: JobResults[] = [];
    for (const job of jobs) {
      await loadDataset(db, schema, job.data);
      const results: JobResults = [];
      for (const query of job.queries) {
        const t = performance.now();
        try {
          results.push({ ok: true, result: await runQuery(db, query), ms: performance.now() - t });
        } catch (e) {
          results.push({ ok: false, error: (e as Error).message, ms: performance.now() - t });
        }
      }
      all.push(results);
    }
    return all;
  };
  return { run, db };
}
