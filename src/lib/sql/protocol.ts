import type { ResultSet, TableInfo } from './engine';

/** Several queries run, in order, against one freshly loaded dataset. */
export interface SqlJob {
  data: string;
  queries: string[];
}

export type SqlRequest =
  | { id: number; type: 'init' }
  | { id: number; type: 'describe'; schema: string; data: string }
  | { id: number; type: 'run'; schema: string; jobs: SqlJob[] };

export type QueryResult =
  | { ok: true; result: ResultSet | null; ms: number }
  | { ok: false; error: string; ms: number };

/** One entry per job, each with one result per query. */
export type JobResults = QueryResult[];

export type SqlResponse =
  | { id: number; ok: true; type: 'init' }
  | { id: number; ok: true; type: 'describe'; tables: TableInfo[] }
  | { id: number; ok: true; type: 'run'; results: JobResults[] }
  | { id: number; ok: false; error: string };
