import type { ResultSet, TableInfo } from './engine';

/** One query to run against one freshly loaded dataset. */
export interface SqlJob {
  data: string;
  query: string;
}

export type SqlRequest =
  | { id: number; type: 'init' }
  | { id: number; type: 'describe'; schema: string; data: string }
  | { id: number; type: 'run'; schema: string; jobs: SqlJob[] };

export type JobResult =
  | { ok: true; result: ResultSet | null; ms: number }
  | { ok: false; error: string; ms: number };

export type SqlResponse =
  | { id: number; ok: true; type: 'init' }
  | { id: number; ok: true; type: 'describe'; tables: TableInfo[] }
  | { id: number; ok: true; type: 'run'; results: JobResult[] }
  | { id: number; ok: false; error: string };
