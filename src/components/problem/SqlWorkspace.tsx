import { useRef, useState } from 'react';
import { useSqlLoading } from '../../hooks/useSqlEngine';
import type { useDraft } from '../../hooks/useDraft';
import { SqlTimeoutError, sqlClient } from '../../lib/sql/client';
import { evaluateSql, type SqlEvaluation } from '../../lib/sql/evaluate';
import { recordSubmission, type SubmissionVerdict } from '../../lib/progress/store';
import type { SqlProblem } from '../../lib/problems/types';
import { CodeEditor } from '../CodeEditor';
import { SplitPane } from '../SplitPane';
import { SqlResultPanel, type SqlOutput } from './SqlResultPanel';

interface Props {
  problem: SqlProblem;
  draft: ReturnType<typeof useDraft>;
}

function summarize(ev: SqlEvaluation): string {
  if (ev.status === 'accepted') return `Todos los casos superados (${ev.passed}/${ev.total})`;
  const failed = ev.cases.find((c) => c.kind === 'error' || !c.verdict.pass)!;
  const where = failed.hidden ? `caso oculto ${failed.index}` : 'caso visible';
  if (failed.kind === 'error') return `Error en ${where}: ${failed.error.split('\n')[0]}`;
  return `Falla en ${where}: ${!failed.verdict.pass ? failed.verdict.message : ''}`;
}

export function SqlWorkspace({ problem, draft }: Props) {
  const [output, setOutput] = useState<SqlOutput>({ kind: 'idle' });
  const busy = useRef(false);
  const engineLoading = useSqlLoading();
  // Latest editor contents, updated synchronously on every change, so a Run/Submit
  // fired right after an edit never grades a stale render's code.
  const codeRef = useRef(draft.code);
  codeRef.current = draft.code;
  const onCodeChange = (value: string) => {
    codeRef.current = value;
    draft.setCode(value);
  };

  const execute = async (mode: 'run' | 'submit') => {
    if (busy.current) return;
    busy.current = true;
    const code = codeRef.current;
    setOutput({ kind: 'running', mode });
    try {
      const ev = await evaluateSql(problem, code, mode, (schema, jobs) => sqlClient.run(schema, jobs));
      setOutput({ kind: 'evaluated', evaluation: ev });
      if (mode === 'submit') {
        recordSubmission(problem.id, {
          verdict: ev.status,
          passed: ev.passed,
          total: ev.total,
          ms: ev.ms,
          code,
          detail: summarize(ev),
        });
      }
    } catch (e) {
      const timeout = e instanceof SqlTimeoutError;
      setOutput({ kind: 'failure', message: (e as Error).message, timeout });
      if (mode === 'submit') {
        const verdict: SubmissionVerdict = timeout ? 'timeout' : 'error';
        recordSubmission(problem.id, {
          verdict,
          passed: 0,
          total: 1 + problem.hiddenData.length,
          ms: 0,
          code,
          detail: (e as Error).message,
        });
      }
    } finally {
      busy.current = false;
    }
  };

  const running = output.kind === 'running';

  return (
    <div className="flex h-full flex-col bg-ink-950">
      <div className="flex h-10 shrink-0 items-center gap-2 border-b border-ink-700 bg-ink-900 px-3">
        <span className="font-mono text-xs text-sky">PostgreSQL</span>
        {engineLoading && <span className="font-mono text-[11px] text-ink-500">· arrancando motor…</span>}
        <div className="flex-1" />
        <button
          onClick={draft.reset}
          className="rounded px-2 py-1 text-xs text-ink-400 hover:text-ink-100"
          title="Restaurar el código inicial"
        >
          Reiniciar código
        </button>
        <button
          onClick={() => execute('run')}
          disabled={running}
          title="Ejecutar con los datos visibles (⌘/Ctrl + Enter)"
          className="rounded-md bg-ink-700 px-3 py-1 text-xs font-medium text-ink-100 hover:bg-ink-600 disabled:opacity-50"
        >
          ▶ Run
        </button>
        <button
          onClick={() => execute('submit')}
          disabled={running}
          title="Corregir con todos los datasets (⌘/Ctrl + Shift + Enter)"
          className="rounded-md bg-vermilion px-3 py-1 text-xs font-semibold text-ink-950 hover:brightness-110 disabled:opacity-50"
        >
          Submit
        </button>
      </div>
      <div className="min-h-0 flex-1">
        <SplitPane
          storageKey="editor-console"
          direction="vertical"
          initial={55}
          min={20}
          max={85}
          left={
            <CodeEditor
              language="sql"
              value={draft.code}
              onChange={onCodeChange}
              onRun={() => execute('run')}
              onSubmit={() => execute('submit')}
            />
          }
          right={<SqlResultPanel output={output} />}
        />
      </div>
    </div>
  );
}
