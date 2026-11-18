import { useRef, useState } from 'react';
import { useSqlLoading } from '../../hooks/useSqlEngine';
import type { useDraft } from '../../hooks/useDraft';
import { SqlTimeoutError, sqlClient } from '../../lib/sql/client';
import { evaluateSql, type SqlEvaluation } from '../../lib/sql/evaluate';
import { diagnose } from '../../lib/diagnosis';
import { recordSubmission, wouldBeAssisted, type SubmissionVerdict } from '../../lib/progress/store';
import type { SqlProblem } from '../../lib/problems/types';
import { CodeEditor } from '../CodeEditor';
import { SplitPane } from '../SplitPane';
import { SqlResultPanel, type SqlOutput } from './SqlResultPanel';

interface Props {
  problem: SqlProblem;
  draft: ReturnType<typeof useDraft>;
  /** Interview mode: no diagnosis of typical mistakes (it works as a hint). */
  interview?: boolean;
}

function summarize(ev: SqlEvaluation): string {
  if (ev.status === 'accepted') return `Todos los casos superados (${ev.passed}/${ev.total})`;
  const failed = ev.cases.find((c) => c.kind === 'error' || !c.verdict.pass)!;
  const where = failed.hidden ? `caso oculto ${failed.index}` : 'caso visible';
  if (failed.kind === 'error') return `Error en ${where}: ${failed.error.split('\n')[0]}`;
  return `Falla en ${where}: ${!failed.verdict.pass ? failed.verdict.message : ''}`;
}

export function SqlWorkspace({ problem, draft, interview = false }: Props) {
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
      const submit = mode === 'submit';
      const diagnoses = submit && ev.status !== 'accepted' && !interview ? diagnose(ev.fingerprint, problem.diagnoses) : [];
      const assisted = submit && ev.status === 'accepted' && wouldBeAssisted(problem.id);
      setOutput({ kind: 'evaluated', evaluation: ev, diagnoses, assisted });
      if (submit) {
        recordSubmission(problem.id, {
          verdict: ev.status,
          passed: ev.passed,
          total: ev.total,
          ms: ev.ms,
          code,
          detail: summarize(ev),
          score: ev.score,
          diagnosis: diagnoses[0]?.title,
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
      <div className="flex h-12 shrink-0 items-center gap-2 overflow-x-auto border-b border-ink-700/70 bg-ink-900 px-4 whitespace-nowrap [scrollbar-width:none] [&>*]:shrink-0">
        <span className="text-[13px] font-semibold text-sky">PostgreSQL</span>
        {engineLoading && <span className="text-[12px] text-ink-500">arrancando…</span>}
        <div className="flex-1" />
        <button
          onClick={draft.reset}
          className="rounded-full px-3 py-1 text-[13px] text-ink-400 transition-colors hover:bg-ink-800 hover:text-ink-100"
          title="Restaurar el código inicial"
        >
          Reiniciar código
        </button>
        <button
          onClick={() => execute('run')}
          disabled={running}
          title="Ejecutar con los datos visibles (⌘/Ctrl + Enter)"
          className="rounded-full bg-ink-800 px-3.5 py-1 text-[13px] font-medium text-ink-100 hover:bg-ink-700 disabled:opacity-50 transition-colors duration-200"
        >
          ▶ Run
        </button>
        <button
          onClick={() => execute('submit')}
          disabled={running}
          title="Corregir con todos los datasets (⌘/Ctrl + Shift + Enter)"
          className="rounded-full bg-vermilion px-4 py-1 text-[13px] font-medium text-white hover:brightness-110 disabled:opacity-50 transition duration-200 active:scale-[0.98]"
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
