import { useCallback, useState } from 'react';
import { useSqlLoading } from '../../hooks/useSqlEngine';
import { sqlClient } from '../../lib/sql/client';
import type { JobResult } from '../../lib/sql/protocol';
import type { SqlProblem } from '../../lib/problems/types';
import { readJson, removeKey, writeJson } from '../../lib/storage/local';
import { CodeEditor } from '../CodeEditor';
import { DataTable } from '../DataTable';
import { SplitPane } from '../SplitPane';

type Output =
  | { kind: 'idle' }
  | { kind: 'running' }
  | { kind: 'result'; job: JobResult }
  | { kind: 'error'; message: string };

export function SqlWorkspace({ problem }: { problem: SqlProblem }) {
  const draftKey = `draft:${problem.id}`;
  const [code, setCode] = useState(() => readJson<string>(draftKey, problem.starter));
  const [output, setOutput] = useState<Output>({ kind: 'idle' });
  const engineLoading = useSqlLoading();

  const onChange = (value: string) => {
    setCode(value);
    writeJson(draftKey, value);
  };

  const resetCode = () => {
    setCode(problem.starter);
    removeKey(draftKey);
  };

  const run = useCallback(async () => {
    if (output.kind === 'running') return;
    setOutput({ kind: 'running' });
    try {
      const [job] = await sqlClient.run(problem.schema, [{ data: problem.data, query: code }]);
      setOutput({ kind: 'result', job });
    } catch (e) {
      setOutput({ kind: 'error', message: (e as Error).message });
    }
  }, [code, problem, output.kind]);

  const busy = output.kind === 'running';

  return (
    <div className="flex h-full flex-col bg-ink-950">
      <div className="flex h-10 shrink-0 items-center gap-2 border-b border-ink-700 bg-ink-900 px-3">
        <span className="font-mono text-xs text-sky">PostgreSQL</span>
        {engineLoading && <span className="font-mono text-[11px] text-ink-500">· arrancando motor…</span>}
        <div className="flex-1" />
        <button onClick={resetCode} className="rounded px-2 py-1 text-xs text-ink-400 hover:text-ink-100" title="Restaurar el código inicial">
          Reiniciar código
        </button>
        <button
          onClick={run}
          disabled={busy}
          title="Ejecutar con los datos visibles (⌘/Ctrl + Enter)"
          className="rounded-md bg-ink-700 px-3 py-1 text-xs font-medium text-ink-100 hover:bg-ink-600 disabled:opacity-50"
        >
          {busy ? 'Ejecutando…' : '▶ Run'}
        </button>
        <button
          disabled
          title="La corrección llega en la fase 2"
          className="rounded-md bg-vermilion px-3 py-1 text-xs font-semibold text-ink-950 opacity-40"
        >
          Submit
        </button>
      </div>
      <div className="min-h-0 flex-1">
        <SplitPane
          storageKey="editor-console"
          direction="vertical"
          initial={60}
          min={20}
          max={85}
          left={<CodeEditor language="sql" value={code} onChange={onChange} onRun={run} />}
          right={<SqlOutput output={output} />}
        />
      </div>
    </div>
  );
}

function SqlOutput({ output }: { output: Output }) {
  return (
    <div className="flex h-full flex-col bg-ink-900">
      <div className="shrink-0 border-b border-ink-700 px-3 py-1.5 font-mono text-[11px] tracking-wider text-ink-500 uppercase">
        Salida
      </div>
      <div className="min-h-0 flex-1 overflow-auto p-3">
        {output.kind === 'idle' && (
          <p className="font-mono text-xs text-ink-500">Pulsa Run (⌘/Ctrl + Enter) para ejecutar tu consulta con los datos de ejemplo.</p>
        )}
        {output.kind === 'running' && <p className="font-mono text-xs text-ink-400">Ejecutando…</p>}
        {output.kind === 'error' && <pre className="font-mono text-xs whitespace-pre-wrap text-rose">{output.message}</pre>}
        {output.kind === 'result' &&
          (output.job.ok ? (
            output.job.result ? (
              <div>
                <div className="mb-2 font-mono text-[11px] text-ink-500">
                  {output.job.result.rows.length} fila(s) · {output.job.ms.toFixed(1)} ms
                </div>
                <DataTable columns={output.job.result.columns} rows={output.job.result.rows} maxHeight="none" />
              </div>
            ) : (
              <p className="font-mono text-xs text-ink-400">La consulta no devolvió filas (¿falta un SELECT?).</p>
            )
          ) : (
            <pre className="font-mono text-xs whitespace-pre-wrap text-rose">{output.job.error}</pre>
          ))}
      </div>
    </div>
  );
}
