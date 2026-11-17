/// <reference lib="webworker" />
import { PGlite } from '@electric-sql/pglite';
import { PG_PARSERS, describeTables, loadDataset, runQuery } from './engine';
import type { SqlRequest, SqlResponse } from './protocol';

let dbPromise: Promise<PGlite> | null = null;

function getDb(): Promise<PGlite> {
  dbPromise ??= PGlite.create({ parsers: PG_PARSERS });
  return dbPromise;
}

async function handle(req: SqlRequest): Promise<SqlResponse> {
  const db = await getDb();
  switch (req.type) {
    case 'init':
      return { id: req.id, ok: true, type: 'init' };
    case 'describe': {
      await loadDataset(db, req.schema, req.data);
      return { id: req.id, ok: true, type: 'describe', tables: await describeTables(db) };
    }
    case 'run': {
      const results = [];
      for (const job of req.jobs) {
        await loadDataset(db, req.schema, job.data);
        const started = performance.now();
        try {
          const result = await runQuery(db, job.query);
          results.push({ ok: true as const, result, ms: performance.now() - started });
        } catch (err) {
          results.push({ ok: false as const, error: errorMessage(err), ms: performance.now() - started });
        }
      }
      return { id: req.id, ok: true, type: 'run', results };
    }
  }
}

function errorMessage(err: unknown): string {
  if (err && typeof err === 'object' && 'message' in err) {
    const e = err as { message: string; position?: string | number; hint?: string };
    let msg = e.message;
    if (e.position) msg += ` (posición ${e.position})`;
    if (e.hint) msg += `\nPista de Postgres: ${e.hint}`;
    return msg;
  }
  return String(err);
}

// Requests are processed strictly one at a time: each one resets the database.
let queue: Promise<unknown> = Promise.resolve();

self.onmessage = (event: MessageEvent<SqlRequest>) => {
  const req = event.data;
  queue = queue.then(async () => {
    let res: SqlResponse;
    try {
      res = await handle(req);
    } catch (err) {
      res = { id: req.id, ok: false, error: errorMessage(err) };
    }
    self.postMessage(res);
  });
};
