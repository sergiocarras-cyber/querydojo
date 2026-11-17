import { useEffect, useState } from 'react';
import type { TableInfo } from '../../lib/sql/engine';
import { sqlClient } from '../../lib/sql/client';
import type { SqlProblem } from '../../lib/problems/types';
import { DataTable } from '../DataTable';

/** Loads the visible dataset into PGlite and shows each table with its types. */
export function SqlTables({ problem }: { problem: SqlProblem }) {
  const [tables, setTables] = useState<TableInfo[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    setTables(null);
    setError(null);
    sqlClient.describe(problem.schema, problem.data).then(
      (t) => !cancelled && setTables(t),
      (e: Error) => !cancelled && setError(e.message),
    );
    return () => {
      cancelled = true;
    };
  }, [problem]);

  if (error) return <p className="font-mono text-xs text-rose">{error}</p>;
  if (!tables) return <p className="font-mono text-xs text-ink-500">Cargando PostgreSQL (PGlite)…</p>;

  return (
    <div className="space-y-5">
      {tables.map((t) => (
        <div key={t.name}>
          <div className="mb-1.5 font-mono text-xs text-sky">{t.name}</div>
          <DataTable
            columns={t.columns.map((c) => c.name)}
            types={t.columns.map((c) => c.type)}
            rows={t.rows}
            maxHeight="14rem"
          />
        </div>
      ))}
    </div>
  );
}
