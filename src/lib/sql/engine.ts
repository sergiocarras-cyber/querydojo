import type { PGlite } from '@electric-sql/pglite';

/**
 * SQL engine helpers shared by the browser worker and the Vitest suite.
 * They only need a PGlite instance, so the same code grades in both places.
 */

export type Cell = string | number | boolean | null;

export interface ResultSet {
  columns: string[];
  /** Postgres type OIDs, used for comparison/normalisation. */
  types: number[];
  rows: Cell[][];
}

export interface TableInfo {
  name: string;
  columns: { name: string; type: string }[];
  rows: Cell[][];
}

const raw = (value: string) => value;

/**
 * Keep date/time/numeric values as the exact text Postgres produced.
 * The default parsers would turn dates into JS Dates (shifted by the local
 * time zone) and lose precision on numerics.
 */
export const PG_PARSERS = {
  1082: raw, // date
  1083: raw, // time
  1114: raw, // timestamp
  1184: raw, // timestamptz
  1186: raw, // interval
  1700: raw, // numeric
};

export const RESET_SQL = `
DROP SCHEMA IF EXISTS public CASCADE;
CREATE SCHEMA public;
SET search_path TO public;
SET TIME ZONE 'UTC';
`;

function toCell(value: unknown): Cell {
  if (value === null || value === undefined) return null;
  if (typeof value === 'number' || typeof value === 'string' || typeof value === 'boolean') return value;
  if (typeof value === 'bigint') return Number(value);
  if (value instanceof Date) return value.toISOString();
  return JSON.stringify(value);
}

/** Drops everything and loads schema + one dataset. */
export async function loadDataset(db: PGlite, schema: string, data: string): Promise<void> {
  await db.exec(RESET_SQL);
  await db.exec(schema);
  if (data.trim()) await db.exec(data);
}

/**
 * Runs user SQL (may contain several statements) and returns the last
 * statement that produced columns, or null if none did.
 */
export async function runQuery(db: PGlite, sql: string): Promise<ResultSet | null> {
  const results = await db.exec(sql, { rowMode: 'array' });
  for (let i = results.length - 1; i >= 0; i--) {
    const r = results[i];
    if (r.fields.length > 0) {
      return {
        columns: r.fields.map((f) => f.name),
        types: r.fields.map((f) => f.dataTypeID),
        rows: (r.rows as unknown[][]).map((row) => row.map(toCell)),
      };
    }
  }
  return null;
}

/** Lists the tables of the public schema with their column types and rows. */
export async function describeTables(db: PGlite, maxRows = 50): Promise<TableInfo[]> {
  const cols = await db.query<{ table_name: string; column_name: string; data_type: string }>(
    // Ordered by creation (oid) so tables appear in the order of the DDL.
    `SELECT c.relname AS table_name, a.attname AS column_name,
            format_type(a.atttypid, a.atttypmod) AS data_type
       FROM pg_class c
       JOIN pg_namespace n ON n.oid = c.relnamespace
       JOIN pg_attribute a ON a.attrelid = c.oid
      WHERE n.nspname = 'public' AND c.relkind = 'r' AND a.attnum > 0 AND NOT a.attisdropped
      ORDER BY c.oid, a.attnum`,
  );
  const tables = new Map<string, TableInfo>();
  for (const c of cols.rows) {
    if (!tables.has(c.table_name)) tables.set(c.table_name, { name: c.table_name, columns: [], rows: [] });
    tables.get(c.table_name)!.columns.push({ name: c.column_name, type: c.data_type });
  }
  for (const t of tables.values()) {
    const rs = await runQuery(db, `SELECT * FROM "${t.name}" LIMIT ${maxRows}`);
    t.rows = rs?.rows ?? [];
  }
  return [...tables.values()];
}
