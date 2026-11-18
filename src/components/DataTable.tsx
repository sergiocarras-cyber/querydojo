import type { Cell } from '../lib/sql/engine';

interface Props {
  columns: string[];
  rows: Cell[][];
  /** Optional per-column type label shown under the header. */
  types?: string[];
  maxHeight?: string;
  /** Row index to highlight (first mismatch in an ordered comparison). */
  highlightRow?: number;
}

function renderCell(value: Cell) {
  if (value === null) return <span className="italic text-ink-500">NULL</span>;
  if (typeof value === 'boolean') return <span className="text-violet">{String(value)}</span>;
  if (typeof value === 'number') return <span className="text-amber">{value}</span>;
  return value;
}

export function DataTable({ columns, rows, types, maxHeight = '18rem', highlightRow }: Props) {
  return (
    <div className="overflow-auto rounded-xl bg-ink-900 ring-1 ring-ink-700/70" style={{ maxHeight }}>
      <table className="w-full border-collapse font-mono text-[12px]">
        <thead className="sticky top-0 bg-ink-850">
          <tr>
            {columns.map((c, i) => (
              <th key={i} className="border-b border-ink-700/70 px-3 py-2 text-left font-semibold whitespace-nowrap text-ink-100">
                {c}
                {types?.[i] && <div className="font-sans text-[10px] font-normal text-ink-500">{types[i]}</div>}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, r) => (
            <tr key={r} className={r === highlightRow ? 'bg-rose/15' : 'even:bg-ink-850'}>
              {row.map((cell, c) => (
                <td key={c} className="border-b border-ink-700/40 px-3 py-1.5 whitespace-nowrap text-ink-200">
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
