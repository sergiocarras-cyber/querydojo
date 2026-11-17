import { useRef, useState } from 'react';
import type { useDraft } from '../../hooks/useDraft';
import { usePyEngine } from '../../hooks/usePyEngine';
import { PyTimeoutError, pyClient } from '../../lib/python/client';
import { evaluatePython, type PyEvaluation } from '../../lib/python/evaluate';
import { recordSubmission } from '../../lib/progress/store';
import type { AlgorithmsProblem } from '../../lib/problems/types';
import { CodeEditor } from '../CodeEditor';
import { SplitPane } from '../SplitPane';
import { PyResultPanel, type PyOutput } from './PyResultPanel';

interface Props {
  problem: AlgorithmsProblem;
  draft: ReturnType<typeof useDraft>;
}

const PACKAGES: string[] = [];

function summarize(ev: PyEvaluation): string {
  const { output } = ev;
  if (output.status === 'error') return (output.error ?? 'Error').split('\n').slice(-1)[0];
  if (ev.status === 'accepted') return `Todos los casos superados (${output.passed}/${output.total})`;
  const failed = output.cases.find((c) => !c.passed);
  if (!failed) return `${output.passed}/${output.total} casos`;
  const where = failed.hidden ? `caso oculto #${failed.index + 1}` : `caso #${failed.index + 1}`;
  if (failed.tle) return `Tiempo límite en ${where} (${failed.ms} ms)`;
  if (failed.error) return `Excepción en ${where}: ${failed.error.split('\n').slice(-1)[0]}`;
  return `Respuesta incorrecta en ${where}`;
}

export function PythonWorkspace({ problem, draft }: Props) {
  const [output, setOutput] = useState<PyOutput>({ kind: 'idle' });
  const busy = useRef(false);
  const engine = usePyEngine(PACKAGES);
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
      const ev = await evaluatePython(problem, code, mode, (c, spec, pkgs) => pyClient.run(c, spec, pkgs, mode));
      setOutput({ kind: 'evaluated', evaluation: ev });
      if (mode === 'submit') {
        recordSubmission(problem.id, {
          verdict: ev.status,
          passed: ev.output.passed,
          total: ev.output.total,
          ms: ev.output.cases.reduce((t, c) => t + (c.ms ?? 0), 0),
          code,
          detail: summarize(ev),
        });
      }
    } catch (e) {
      const timeout = e instanceof PyTimeoutError;
      setOutput({ kind: 'failure', message: (e as Error).message, timeout });
      if (mode === 'submit') {
        recordSubmission(problem.id, {
          verdict: timeout ? 'timeout' : 'error',
          passed: 0,
          total: problem.tests.length + problem.hiddenTests.length,
          ms: 0,
          code,
          detail: timeout ? 'Tiempo límite superado' : (e as Error).message,
        });
      }
    } finally {
      busy.current = false;
    }
  };

  const restartEngine = () => {
    pyClient.reset();
    setOutput({ kind: 'idle' });
    void pyClient.init(PACKAGES).catch(() => {});
  };

  const running = output.kind === 'running';
  const notReady = engine.status !== 'ready';

  return (
    <div className="flex h-full flex-col bg-ink-950">
      <div className="flex h-10 shrink-0 items-center gap-2 border-b border-ink-700 bg-ink-900 px-3">
        <span className="font-mono text-xs text-vermilion">Python 3</span>
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
