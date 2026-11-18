import { useState } from 'react';
import type { Cell } from '../../lib/sql/engine';
import type { CaseOutcome, SqlEvaluation } from '../../lib/sql/evaluate';
import type { Diagnosis } from '../../lib/problems/types';
import { DataTable } from '../DataTable';
import { Banner } from './Banner';
import { AssistedNote, DiagnosisBox, ScoreBar } from './Feedback';

export type SqlOutput =
  | { kind: 'idle' }
  | { kind: 'running'; mode: 'run' | 'submit' }
  | { kind: 'evaluated'; evaluation: SqlEvaluation; diagnoses: Diagnosis[]; assisted: boolean }
  | { kind: 'failure'; message: string; timeout: boolean };

export function SqlResultPanel({ output }: { output: SqlOutput }) {
  return (
    <div className="flex h-full flex-col bg-ink-900">
      <div className="shrink-0 border-b border-ink-700 px-3 py-1.5 font-mono text-[11px] tracking-wider text-ink-500 uppercase">
        Resultado
      </div>
      <div className="min-h-0 flex-1 overflow-auto p-3">
        {output.kind === 'idle' && (
          <p className="font-mono text-xs leading-relaxed text-ink-500">
            Run (⌘/Ctrl + Enter) ejecuta con los datos de ejemplo.
            <br />
            Submit (⌘/Ctrl + Shift + Enter) corrige con los datos de ejemplo y los ocultos.
          </p>
        )}
        {output.kind === 'running' && (
          <p className="font-mono text-xs text-ink-400">{output.mode === 'run' ? 'Ejecutando…' : 'Corrigiendo…'}</p>
        )}
        {output.kind === 'failure' && (
          <Banner tone="error" title={output.timeout ? 'Tiempo límite superado' : 'Error'}>
            <pre className="font-mono text-xs whitespace-pre-wrap">{output.message}</pre>
          </Banner>
        )}
        {output.kind === 'evaluated' && (
          <Evaluation ev={output.evaluation} diagnoses={output.diagnoses} assisted={output.assisted} />
        )}
      </div>
    </div>
  );
}

function Evaluation({ ev, diagnoses, assisted }: { ev: SqlEvaluation; diagnoses: Diagnosis[]; assisted: boolean }) {
  const failed = ev.cases.find((c) => c.kind === 'error' || !c.verdict.pass);
  const visible = ev.cases[0];

  return (
    <div className="space-y-4">
      {ev.mode === 'submit' ? (
        <>
          <SubmitBanner ev={ev} failed={failed} assisted={assisted} />
          {failed && (
            <ScoreBar
              score={ev.score}
              label={`${ev.passed}/${ev.total} datasets correctos · se puntúan las filas que coinciden`}
            />
          )}
          <DiagnosisBox diagnoses={diagnoses} />
        </>
      ) : failed ? (
        <Banner
          tone={failed.kind === 'error' ? 'error' : 'bad'}
          title={failed.kind === 'error' ? 'Error' : 'No coincide con el resultado esperado'}
        >
          <p className="text-xs">{failed.kind === 'error' ? null : !failed.verdict.pass && failed.verdict.message}</p>
        </Banner>
      ) : (
        <Banner tone="ok" title="Coincide con el resultado esperado">
          <p className="text-xs">Haz Submit para corregir también con los datos ocultos.</p>
        </Banner>
      )}

      {/* Details are only shown for the visible dataset; hidden data stays hidden. */}
      {failed && !failed.hidden ? (
        <CaseDetails outcome={failed} />
      ) : ev.mode === 'run' ? (
        <CaseDetails outcome={visible} />
      ) : null}
    </div>
  );
}

function SubmitBanner({ ev, failed, assisted }: { ev: SqlEvaluation; failed: CaseOutcome | undefined; assisted: boolean }) {
  if (!failed) {
    return (
      <Banner tone="ok" title={`✓ Aceptado · ${ev.passed}/${ev.total} casos`}>
        <p className="text-xs">Tiempo total de tus consultas: {ev.ms.toFixed(1)} ms.</p>
        {assisted && <AssistedNote />}
      </Banner>
    );
  }
  const where = failed.hidden ? `Caso oculto ${failed.index} de ${ev.total - 1}` : 'Caso visible';
  return (
    <Banner
      tone={failed.kind === 'error' ? 'error' : 'bad'}
      title={`✗ ${failed.kind === 'error' ? 'Error' : 'Incorrecto'} · ${ev.passed}/${ev.total} casos superados`}
    >
      <p className="text-xs">
        <span className="font-semibold">{where}:</span>{' '}
        {failed.kind === 'error' ? 'tu consulta lanzó un error.' : !failed.verdict.pass && failed.verdict.message}
      </p>
      {failed.hidden && (
        <p className="mt-1 text-xs text-ink-400">
          Los datos ocultos prueban casos límite: NULLs, empates, bordes de fechas, grupos vacíos, duplicados…
        </p>
      )}
    </Banner>
  );
}

function CaseDetails({ outcome }: { outcome: CaseOutcome }) {
  if (outcome.kind === 'error') {
    return <pre className="font-mono text-xs whitespace-pre-wrap text-rose">{outcome.error}</pre>;
  }
  const { verdict, expected, actual } = outcome;
  const diff = !verdict.pass ? verdict.diff : undefined;
  return (
    <div className="space-y-4">
      {diff && (diff.missing.length > 0 || diff.extra.length > 0) && (
        <DiffView columns={expected.columns} missing={diff.missing} extra={diff.extra} />
      )}
      <ResultTabs
        actual={actual}
        expected={expected}
        highlightRow={diff?.firstMismatch}
        ms={outcome.ms}
      />
    </div>
  );
}

function DiffView({ columns, missing, extra }: { columns: string[]; missing: Cell[][]; extra: Cell[][] }) {
  const fmt = (row: Cell[]) => row.map((c) => (c === null ? 'NULL' : String(c))).join(' | ');
  return (
    <div className="rounded-md border border-ink-700 bg-ink-950 font-mono text-xs">
      <div className="border-b border-ink-700 px-3 py-1.5 text-ink-400">
        diff · <span className="text-ink-500">({columns.join(' | ')})</span>
      </div>
      <div className="max-h-48 overflow-auto py-1">
        {missing.map((r, i) => (
          <div key={`m${i}`} className="bg-jade/10 px-3 whitespace-pre text-jade">
            + {fmt(r)} <span className="text-ink-500">  ← falta en tu resultado</span>
          </div>
        ))}
        {extra.map((r, i) => (
          <div key={`e${i}`} className="bg-rose/10 px-3 whitespace-pre text-rose">
            - {fmt(r)} <span className="text-ink-500">  ← sobra en tu resultado</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function ResultTabs({
  actual,
  expected,
  highlightRow,
  ms,
}: {
  actual: { columns: string[]; rows: Cell[][] } | null;
  expected: { columns: string[]; rows: Cell[][] };
  highlightRow?: number;
  ms: number;
}) {
  const [tab, setTab] = useState<'yours' | 'expected'>('yours');
  const shown = tab === 'yours' ? actual : expected;
  return (
    <div>
      <div className="mb-2 flex items-center gap-1 text-xs">
        {(['yours', 'expected'] as const).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`rounded px-2 py-0.5 ${tab === t ? 'bg-ink-700 text-ink-100' : 'text-ink-400 hover:text-ink-200'}`}
          >
            {t === 'yours' ? 'Tu resultado' : 'Resultado esperado'}
          </button>
        ))}
        <span className="ml-auto font-mono text-[11px] text-ink-500">
          {shown ? `${shown.rows.length} fila(s)` : ''} {tab === 'yours' ? `· ${ms.toFixed(1)} ms` : ''}
        </span>
      </div>
      {shown ? (
        <DataTable columns={shown.columns} rows={shown.rows} maxHeight="none" highlightRow={highlightRow} />
      ) : (
        <p className="font-mono text-xs text-ink-400">Tu consulta no devolvió filas (¿falta un SELECT final?).</p>
      )}
    </div>
  );
}
