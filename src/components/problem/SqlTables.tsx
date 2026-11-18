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
  if (!tables) return <p className="flex items-center gap-2 text-[13px] text-ink-500"><span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-ink-700 border-t-ink-400" />Cargando PostgreSQL…</p>;

  return (
    <div className="space-y-5">
      {tables.map((t) => (
        <div key={t.name}>
          <div className="mb-2 font-mono text-[12px] font-semibold text-sky">{t.name}</div>
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
