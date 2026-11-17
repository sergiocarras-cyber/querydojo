import { useEffect, useState } from 'react';
import { PY_SUBMIT_TIMEOUT_MS, pyClient } from '../../lib/python/client';
import { PANDAS_PACKAGES, buildPandasSpec, type PyTable } from '../../lib/python/evaluate';
import type { PandasProblem } from '../../lib/problems/types';
import { DataTable } from '../DataTable';

/** Builds the visible DataFrames in Pyodide and shows them with their dtypes. */
export function PandasTables({ problem }: { problem: PandasProblem }) {
  const [tables, setTables] = useState<{ name: string; table: PyTable }[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    setTables(null);
    setError(null);
    pyClient
      .call('preview_pandas', [buildPandasSpec(problem, 'run')], PANDAS_PACKAGES, PY_SUBMIT_TIMEOUT_MS)
      .then(
        (json) => !cancelled && setTables(JSON.parse(json).tables),
        (e: Error) => !cancelled && setError(e.message),
      );
    return () => {
      cancelled = true;
    };
  }, [problem]);

  if (error) return <p className="font-mono text-xs text-rose">{error}</p>;
  if (!tables) {
    return <p className="font-mono text-xs text-ink-500">Cargando Python y pandas (la primera vez tarda unos segundos)…</p>;
  }
  return <TableList tables={tables} />;
}

export function TableList({ tables }: { tables: { name: string; table: PyTable }[] }) {
  return (
    <div className="space-y-5">
      {tables.map(({ name, table }) => (
        <PandasTable key={name} name={name} table={table} />
      ))}
    </div>
  );
}

export function PandasTable({ name, table, highlight }: { name: string; table: PyTable; highlight?: string }) {
  return (
    <div>
      <div className={`mb-1.5 font-mono text-xs ${highlight ?? 'text-jade'}`}>
        {name}
        <span className="ml-2 text-ink-500">
          {table.total_rows} fila(s){table.total_rows > table.rows.length ? `, se muestran ${table.rows.length}` : ''}
        </span>
      </div>
      <DataTable columns={table.columns} types={table.dtypes} rows={table.rows} maxHeight="16rem" />
    </div>
  );
}
