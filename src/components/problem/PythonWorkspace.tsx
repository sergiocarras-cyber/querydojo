import { useRef, useState } from 'react';
import type { useDraft } from '../../hooks/useDraft';
import { usePyEngine } from '../../hooks/usePyEngine';
import { PY_RUN_TIMEOUT_MS, PY_SUBMIT_TIMEOUT_MS, PyTimeoutError, pyClient } from '../../lib/python/client';
import { PANDAS_PACKAGES, evaluateCode, type PyEvaluation } from '../../lib/python/evaluate';
import { KILLED, diagnose } from '../../lib/diagnosis';
import { recordSubmission, wouldBeAssisted } from '../../lib/progress/store';
import type { AlgorithmsProblem, PandasProblem } from '../../lib/problems/types';
import { CodeEditor } from '../CodeEditor';
import { SplitPane } from '../SplitPane';
import { PyResultPanel, type PyOutput } from './PyResultPanel';

interface Props {
  problem: AlgorithmsProblem | PandasProblem;
  draft: ReturnType<typeof useDraft>;
  /** Interview mode: no diagnosis of typical mistakes (it works as a hint). */
  interview?: boolean;
}

const NO_PACKAGES: string[] = [];

function summarize(ev: PyEvaluation): string {
  const { output } = ev;
  if (output.status === 'error') return (output.error ?? 'Error').split('\n').slice(-1)[0];
  if (ev.status === 'accepted') return `Todos los casos superados (${output.passed}/${output.total})`;
  const failed = output.cases.find((c) => !c.passed);
  if (!failed) return `${output.passed}/${output.total} casos`;
  const where = failed.hidden ? `caso oculto #${failed.index + 1}` : `caso #${failed.index + 1}`;
  if (failed.tle) return `Tiempo límite en ${where} (${failed.ms} ms)`;
  if (failed.skipped) return 'Tiempo total de Submit superado';
  if (failed.error) return `Excepción en ${where}: ${failed.error.split('\n').slice(-1)[0]}`;
  return `Respuesta incorrecta en ${where}`;
}

export function PythonWorkspace({ problem, draft, interview = false }: Props) {
  const [output, setOutput] = useState<PyOutput>({ kind: 'idle' });
  const busy = useRef(false);
  const packages = problem.section === 'pandas' ? PANDAS_PACKAGES : NO_PACKAGES;
  const engine = usePyEngine(packages);
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
      const ev = await evaluateCode(problem, code, mode, (fn, args, pkgs) =>
        pyClient.call(fn, args, pkgs, mode === 'run' ? PY_RUN_TIMEOUT_MS : PY_SUBMIT_TIMEOUT_MS),);
      const submit = mode === 'submit';
      const diagnoses = submit && ev.status !== 'accepted' && !interview ? diagnose(ev.fingerprint, problem.diagnoses) : [];
      const assisted = submit && ev.status === 'accepted' && wouldBeAssisted(problem.id);
      setOutput({ kind: 'evaluated', evaluation: ev, diagnoses, assisted });
      if (submit) {
        recordSubmission(problem.id, {
          verdict: ev.status,
          passed: ev.output.passed,
          total: ev.output.total,
          ms: ev.output.cases.reduce((t, c) => t + (c.ms ?? 0), 0),
          code,
          detail: summarize(ev),
          score: ev.score,
          diagnosis: diagnoses[0]?.title,
        });
      }
    } catch (e) {
      const timeout = e instanceof PyTimeoutError;
      // Killed by the global time limit: the slow typical mistakes are the likely cause.
      const diagnoses = mode === 'submit' && timeout && !interview ? diagnose(KILLED, problem.diagnoses) : [];
      setOutput({ kind: 'failure', message: (e as Error).message, timeout, diagnoses });
      if (mode === 'submit') {
        recordSubmission(problem.id, {
          verdict: timeout ? 'timeout' : 'error',
          passed: 0,
          total: ev_total(problem),
          ms: 0,
          code,
          detail: timeout ? 'Tiempo límite superado' : (e as Error).message,
          score: 0,
          diagnosis: diagnoses[0]?.title,
        });
      }
    } finally {
      busy.current = false;
    }
  };

  const restartEngine = () => {
    pyClient.reset();
    setOutput({ kind: 'idle' });
    void pyClient.init(packages).catch(() => {});
  };

  const running = output.kind === 'running';
  const notReady = engine.status !== 'ready';

  return (
    <div className="flex h-full flex-col bg-ink-950">
      <div className="flex h-10 shrink-0 items-center gap-2 border-b border-ink-700 bg-ink-900 px-3">
        <span className={`font-mono text-xs ${problem.section === 'pandas' ? 'text-jade' : 'text-vermilion'}`}>
          {problem.section === 'pandas' ? 'Python 3 · pandas' : 'Python 3'}
        </span>
        <EngineBadge state={engine} />
        <div className="flex-1" />
        <button
          onClick={restartEngine}
          className="rounded px-2 py-1 text-xs text-ink-400 hover:text-ink-100"
          title="Termina el proceso de Python y arranca uno limpio"
        >
          Reiniciar entorno
        </button>
        <button onClick={draft.reset} className="rounded px-2 py-1 text-xs text-ink-400 hover:text-ink-100" title="Restaurar el código inicial">
          Reiniciar código
        </button>
        <button
          onClick={() => execute('run')}
          disabled={running}
          title="Ejecutar con los casos visibles (⌘/Ctrl + Enter)"
          className="rounded-md bg-ink-700 px-3 py-1 text-xs font-medium text-ink-100 hover:bg-ink-600 disabled:opacity-50"
        >
          ▶ Run
        </button>
        <button
          onClick={() => execute('submit')}
          disabled={running}
          title="Corregir con todos los casos (⌘/Ctrl + Shift + Enter)"
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
              language="python"
              value={draft.code}
              onChange={onCodeChange}
              onRun={() => execute('run')}
              onSubmit={() => execute('submit')}
            />
          }
          right={<PyResultPanel output={output} engineLoading={notReady && running ? engine : null} />}
        />
      </div>
    </div>
  );
}

function EngineBadge({ state }: { state: ReturnType<typeof usePyEngine> }) {
  if (state.status === 'ready') return <span className="font-mono text-[11px] text-jade">● listo</span>;
  if (state.status === 'error')
    return (
      <span className="font-mono text-[11px] text-rose" title={state.message}>
        ● error al cargar
      </span>
    );
  return (
    <span className="flex items-center gap-1.5 font-mono text-[11px] text-ink-400">
      <span className="h-2 w-2 animate-pulse rounded-full bg-amber" />
      {state.status === 'loading' ? state.message : 'en espera'}
    </span>
  );
}

/** Number of known cases (generated ones are unknown until the harness runs). */
function ev_total(problem: AlgorithmsProblem | PandasProblem): number {
  return problem.section === 'pandas' ? 1 : problem.tests.length + problem.hiddenTests.length;
}
