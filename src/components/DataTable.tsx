import type { Cell } from '../lib/sql/engine';

interface Props {
  columns: string[];
  rows: Cell[][];
  /** Optional per-column type label shown under the header. */
  types?: string[];
  maxHeight?: string;
}

function renderCell(value: Cell) {
  if (value === null) return <span className="italic text-ink-500">NULL</span>;
  if (typeof value === 'boolean') return <span className="text-violet">{String(value)}</span>;
  if (typeof value === 'number') return <span className="text-amber">{value}</span>;
  return value;
}

export function DataTable({ columns, rows, types, maxHeight = '18rem' }: Props) {
  return (
    <div className="overflow-auto rounded-md border border-ink-700" style={{ maxHeight }}>
      <table className="w-full border-collapse font-mono text-xs">
        <thead className="sticky top-0 bg-ink-800">
          <tr>
            {columns.map((c, i) => (
              <th key={i} className="border-b border-ink-700 px-3 py-1.5 text-left font-medium whitespace-nowrap text-ink-100">
                {c}
                {types?.[i] && <div className="text-[10px] font-normal text-ink-500">{types[i]}</div>}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, r) => (
            <tr key={r} className="odd:bg-ink-900 even:bg-ink-850">
              {row.map((cell, c) => (
                <td key={c} className="border-b border-ink-800 px-3 py-1 whitespace-nowrap text-ink-200">
                  {renderCell(cell)}
                </td>
              ))}
            </tr>
          ))}
          {rows.length === 0 && (
            <tr>
              <td colSpan={Math.max(1, columns.length)} className="px-3 py-2 text-ink-500 italic">
                0 filas
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}
