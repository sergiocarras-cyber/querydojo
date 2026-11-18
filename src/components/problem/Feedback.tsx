import type { Diagnosis } from '../../lib/problems/types';
import { Markdown } from '../Markdown';

/** Score of a Submit: share of cases (or partial credit) passed. */
export function ScoreBar({ score, label }: { score: number; label: string }) {
  const pct = Math.round(score * 100);
  const color = pct === 100 ? 'bg-jade' : pct >= 60 ? 'bg-amber' : 'bg-rose';
  return (
    <div className="rounded-xl bg-ink-850 px-4 py-3 ring-1 ring-ink-700/60">
      <div className="flex items-baseline justify-between gap-3">
        <span className="text-[12px] font-medium text-ink-500">Nota</span>
        <span className="text-[12px] text-ink-500">{label}</span>
      </div>
      <div className="mt-1 flex items-center gap-3">
        <span className="text-[28px] font-semibold tracking-[-0.03em] text-ink-100 tabular-nums">{pct}%</span>
        <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-ink-800">
          <div className={`h-full ${color}`} style={{ width: `${pct}%` }} />
        </div>
      </div>
    </div>
  );
}

/** A known mistake whose behaviour matches the submission exactly. */
export function DiagnosisBox({ diagnoses, slow = false }: { diagnoses: Diagnosis[]; slow?: boolean }) {
  if (diagnoses.length === 0) return null;
  return (
    <div className="rounded-xl bg-violet/10 px-4 py-3">
      <div className="text-[12px] font-semibold text-violet">
        {slow ? 'Causa probable' : diagnoses.length === 1 ? 'Error típico detectado' : 'Errores típicos que encajan'}
      </div>
      {diagnoses.slice(0, 2).map((d) => (
        <div key={d.title} className="mt-1.5">
          <div className="text-sm font-semibold text-ink-100">{d.title}</div>
          <div className="mt-0.5 text-sm">
            <Markdown>{d.explanation}</Markdown>
          </div>
        </div>
      ))}
      <p className="mt-2 text-[11px] text-ink-500">
        {slow
          ? 'Este error conocido también agota el tiempo con los casos grandes.'
          : 'Tu envío falla en los mismos casos y con el mismo resultado que este error conocido.'}
      </p>
    </div>
  );
}

/** Shown when an accepted submission only counts as "solved with help". */
export function AssistedNote() {
  return (
    <p className="text-xs">
      ◐ Cuenta como <span className="text-sky">resuelto con ayuda</span> porque viste la solución hace poco. Vuelve a
      resolverlo dentro de unos días sin mirarla para que cuente.
    </p>
  );
}
