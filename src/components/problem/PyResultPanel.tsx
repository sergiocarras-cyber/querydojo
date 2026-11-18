import { useState } from 'react';
import type { PyEngineState } from '../../lib/python/client';
import type { PyCaseResult, PyEvaluation } from '../../lib/python/evaluate';
import type { Diagnosis } from '../../lib/problems/types';
import { Banner } from './Banner';
import { AssistedNote, DiagnosisBox, ScoreBar } from './Feedback';
import { PandasTable } from './PandasTables';

export type PyOutput =
  | { kind: 'idle' }
  | { kind: 'running'; mode: 'run' | 'submit' }
  | { kind: 'evaluated'; evaluation: PyEvaluation; diagnoses: Diagnosis[]; assisted: boolean }
  | { kind: 'failure'; message: string; timeout: boolean; diagnoses?: Diagnosis[] };

interface Props {
  output: PyOutput;
  /** Set while a run waits for Pyodide to boot. */
  engineLoading: PyEngineState | null;
}

export function PyResultPanel({ output, engineLoading }: Props) {
  return (
    <div className="flex h-full flex-col bg-ink-900">
      <div className="shrink-0 border-b border-ink-700 px-3 py-1.5 font-mono text-[11px] tracking-wider text-ink-500 uppercase">
        Resultado
      </div>
      <div className="min-h-0 flex-1 overflow-auto p-3">
        {output.kind === 'idle' && (
          <p className="font-mono text-xs leading-relaxed text-ink-500">
            Run (⌘/Ctrl + Enter) ejecuta los casos visibles y muestra tus print().
            <br />
            Submit (⌘/Ctrl + Shift + Enter) corrige con todos los casos, incluidos los ocultos y los grandes.
          </p>
        )}
        {output.kind === 'running' && (
          <p className="font-mono text-xs text-ink-400">
            {engineLoading?.status === 'loading'
              ? engineLoading.message
              : output.mode === 'run'
                ? 'Ejecutando…'
                : 'Corrigiendo…'}
          </p>
        )}
        {output.kind === 'failure' && (
          <div className="space-y-3">
            <Banner tone={output.timeout ? 'bad' : 'error'} title={output.timeout ? '⏱ Tiempo límite superado' : 'Error'}>
              <p className="text-xs whitespace-pre-wrap">{output.message}</p>
            </Banner>
            {output.timeout && <DiagnosisBox diagnoses={output.diagnoses ?? []} slow />}
          </div>
        )}
        {output.kind === 'evaluated' && (
          <Evaluation ev={output.evaluation} diagnoses={output.diagnoses} assisted={output.assisted} />
        )}
      </div>
    </div>
  );
}

function Evaluation({ ev, diagnoses, assisted }: { ev: PyEvaluation; diagnoses: Diagnosis[]; assisted: boolean }) {
  const { output } = ev;
  const firstFailed = output.cases.findIndex((c) => !c.passed && !c.skipped);
  const [selected, setSelected] = useState(Math.max(0, firstFailed));

  if (output.status === 'error') {
    return (
      <Banner tone="error" title="Tu código no se pudo cargar">
        <pre className="mt-1 font-mono text-xs whitespace-pre-wrap text-rose">{output.error}</pre>
      </Banner>
    );
  }

  const failed = firstFailed >= 0 ? output.cases[firstFailed] : null;
  const skipped = output.cases.filter((c) => c.skipped).length;
  // In Submit we list the visible cases plus the failing hidden ones (up to 8).
  const shown =
    ev.mode === 'run'
      ? output.cases
      : [
          ...output.cases.filter((c) => !c.hidden && !c.skipped),
          ...output.cases.filter((c) => c.hidden && !c.passed && !c.skipped).slice(0, 8),
        ];
  const current = shown.find((c) => c.index === selected) ?? shown[0];
  const failedSubmit = ev.mode === 'submit' && ev.status !== 'accepted';

  return (
    <div className="space-y-3">
      <VerdictBanner ev={ev} failed={failed} skipped={skipped} assisted={assisted} />
      {failedSubmit && (
        <ScoreBar
          score={ev.score}
          label={`${output.passed}/${output.total} casos${skipped ? ` · ${skipped} sin ejecutar por tiempo` : ''}`}
        />
      )}
      <DiagnosisBox diagnoses={diagnoses} />
      {output.setup_stdout && (
        <Block label="Salida al cargar el módulo">
          <pre className="font-mono text-xs whitespace-pre-wrap text-ink-200">{output.setup_stdout}</pre>
        </Block>
      )}
      {shown.length > 0 && (
        <>
          <div className="flex flex-wrap gap-1">
            {shown.map((c) => (
              <button
                key={c.index}
                onClick={() => setSelected(c.index)}
                className={`rounded px-2 py-0.5 font-mono text-[11px] ${
                  current?.index === c.index ? 'bg-ink-700 text-ink-100' : 'text-ink-400 hover:text-ink-200'
                }`}
              >
                <span className={c.passed ? 'text-jade' : 'text-rose'}>{c.passed ? '✓' : '✗'}</span>{' '}
                {c.hidden ? `Oculto ${c.index + 1}` : `Caso ${c.index + 1}`}
              </button>
            ))}
          </div>
          {current && <CaseView c={current} />}
        </>
      )}
    </div>
  );
}

function VerdictBanner({
  ev,
  failed,
  skipped,
  assisted,
}: {
  ev: PyEvaluation;
  failed: PyCaseResult | null;
  skipped: number;
  assisted: boolean;
}) {
  const { output } = ev;
  const totalMs = output.cases.reduce((t, c) => t + (c.ms ?? 0), 0);
  if (!failed && skipped > 0) {
    return (
      <Banner tone="bad" title="⏱ Demasiado lento en total">
        <p className="text-xs">
          Todos los casos ejecutados son correctos, pero tu función agotó el tiempo de Submit y {skipped}{' '}
          {skipped === 1 ? 'caso quedó' : 'casos quedaron'} sin ejecutar. Probablemente necesitas un algoritmo más
          eficiente.
        </p>
      </Banner>
    );
  }
  if (!failed) {
    return ev.mode === 'submit' ? (
      <Banner tone="ok" title={`✓ Aceptado · ${output.passed}/${output.total} casos`}>
        <p className="text-xs">Tiempo total de tu función: {totalMs.toFixed(1)} ms.</p>
        {assisted && <AssistedNote />}
      </Banner>
    ) : (
      <Banner tone="ok" title={`Casos visibles superados · ${output.passed}/${output.total}`}>
        <p className="text-xs">Haz Submit para probar también los casos ocultos y los grandes.</p>
      </Banner>
    );
  }
  const where = failed.hidden ? `caso oculto ${failed.index + 1}` : `caso ${failed.index + 1}`;
  const title = failed.tle
    ? `⏱ Tiempo límite en el ${where}`
    : failed.error
      ? `Excepción en el ${where}`
      : `✗ Respuesta incorrecta en el ${where}`;
  return (
    <Banner tone={failed.error ? 'error' : 'bad'} title={title}>
      <p className="text-xs">
        {output.passed}/{output.total} casos superados.
        {failed.tle && ` Tu función tardó ${failed.ms} ms: probablemente necesitas un algoritmo más eficiente.`}
      </p>
    </Banner>
  );
}

function CaseView({ c }: { c: PyCaseResult }) {
  if (c.expected_table) return <PandasCaseView c={c} />;
  return (
    <div className="space-y-2">
      <Block label="Entrada (args)">
        <Code>{c.input}</Code>
      </Block>
      <div className="grid gap-2 md:grid-cols-2">
        <Block label="Esperado">
          <Code>{c.expected}</Code>
        </Block>
        <Block label={`Obtenido${c.ms !== undefined ? ` · ${c.ms} ms` : ''}`}>
          {c.error ? (
            <pre className="font-mono text-xs whitespace-pre-wrap text-rose">{c.error}</pre>
          ) : (
            <Code tone={c.passed ? 'text-jade' : 'text-rose'}>{c.got ?? '—'}</Code>
          )}
        </Block>
      </div>
      {c.stdout && (
        <Block label="stdout (tus print)">
          <pre className="max-h-48 overflow-auto font-mono text-xs whitespace-pre-wrap text-ink-200">{c.stdout}</pre>
        </Block>
      )}
    </div>
  );
}

function Block({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="rounded-md border border-ink-700 bg-ink-950">
      <div className="border-b border-ink-800 px-2.5 py-1 font-mono text-[10px] tracking-wider text-ink-500 uppercase">{label}</div>
      <div className="px-2.5 py-2">{children}</div>
    </div>
  );
}

function Code({ children, tone = 'text-ink-100' }: { children: string; tone?: string }) {
  return <pre className={`font-mono text-xs break-all whitespace-pre-wrap ${tone}`}>{children}</pre>;
}

function PandasCaseView({ c }: { c: PyCaseResult }) {
  return (
    <div className="space-y-3">
      {c.message && (
        <Block label="Diferencia">
          <pre className="max-h-48 overflow-auto font-mono text-xs whitespace-pre-wrap text-rose">{c.message}</pre>
        </Block>
      )}
      {c.error && (
        <Block label="Excepción">
          <pre className="font-mono text-xs whitespace-pre-wrap text-rose">{c.error}</pre>
        </Block>
      )}
      {c.got_table ? (
        <PandasTable
          name={`Tu resultado${c.ms !== undefined ? ` · ${c.ms} ms` : ''}`}
          table={c.got_table}
          highlight={c.passed ? 'text-jade' : 'text-rose'}
        />
      ) : (
        !c.error && (
          <Block label="Tu resultado">
            <Code tone="text-rose">{c.got ?? '—'}</Code>
          </Block>
        )
      )}
      {!c.hidden && c.expected_table && <PandasTable name="Resultado esperado" table={c.expected_table} highlight="text-ink-300" />}
      {c.stdout && (
        <Block label="stdout (tus print)">
          <pre className="max-h-48 overflow-auto font-mono text-xs whitespace-pre-wrap text-ink-200">{c.stdout}</pre>
        </Block>
      )}
    </div>
  );
}
