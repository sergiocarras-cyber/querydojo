import type { ProblemStatus } from '../lib/progress/store';
import { INDUSTRY_INFO, SECTION_INFO, type Difficulty, type Industry, type Section } from '../lib/problems/types';

const DIFFICULTY_CLASS: Record<Difficulty, string> = {
  Easy: 'text-jade bg-jade/12',
  Medium: 'text-amber bg-amber/12',
  Hard: 'text-rose bg-rose/12',
};

export function DifficultyBadge({ difficulty }: { difficulty: Difficulty }) {
  return (
    <span className={`rounded-full px-2 py-0.5 text-[11px] font-semibold tracking-[0.01em] ${DIFFICULTY_CLASS[difficulty]}`}>
      {difficulty}
    </span>
  );
}

export const SECTION_TEXT: Record<Section, string> = {
  sql: 'text-sky',
  algorithms: 'text-vermilion',
  pandas: 'text-jade',
  stats: 'text-violet',
  judgment: 'text-amber',
};

export const SECTION_BG: Record<Section, string> = {
  sql: 'bg-sky',
  algorithms: 'bg-vermilion',
  pandas: 'bg-jade',
  stats: 'bg-violet',
  judgment: 'bg-amber',
};

export function SectionBadge({ section }: { section: Section }) {
  return (
    <span className={`inline-flex items-center gap-1.5 text-[12px] font-medium ${SECTION_TEXT[section]}`}>
      <span className={`h-2 w-2 rounded-full ${SECTION_BG[section]}`} />
      {SECTION_INFO[section].short}
    </span>
  );
}

export function TopicChip({ topic }: { topic: string }) {
  return (
    <span className="rounded-full bg-ink-800 px-2 py-0.5 text-[11px] whitespace-nowrap text-ink-300 transition-colors hover:bg-ink-700">
      {topic}
    </span>
  );
}

export const STATUS_LABEL: Record<ProblemStatus, string> = {
  todo: 'Sin empezar',
  attempted: 'Intentado',
  assisted: 'Con ayuda',
  solved: 'Resuelto',
};

/** Green ● solved · ◐ solved after viewing the solution · amber ● attempted · ○ to do. */
export function StatusIcon({ status }: { status: ProblemStatus }) {
  if (status === 'solved') return <span title="Resuelto" className="text-jade">●</span>;
  if (status === 'assisted')
    return (
      <span title="Resuelto con ayuda: vuelve a resolverlo sin mirar la solución para que cuente" className="text-sky">
        ◐
      </span>
    );
  if (status === 'attempted') return <span title="Intentado" className="text-amber">●</span>;
  return <span title="Sin empezar" className="text-ink-600">○</span>;
}

export function IndustryChip({ industry }: { industry: Industry }) {
  return (
    <span
      title={`Escenario típico de ${INDUSTRY_INFO[industry].name}: ${INDUSTRY_INFO[industry].about}`}
      className="rounded-full px-2 py-0.5 text-[11px] whitespace-nowrap text-ink-400 ring-1 ring-ink-700 ring-inset"
    >
      {INDUSTRY_INFO[industry].name}
    </span>
  );
}

/** Marks "fix the AI's code" exercises. */
export function AiReviewChip() {
  return (
    <span
      title="El código de partida lo escribió una IA: funciona, pero tiene un fallo. Encuéntralo y arréglalo."
      className="rounded-full bg-amber/12 px-2 py-0.5 text-[11px] font-semibold whitespace-nowrap text-amber"
    >
      Revisión IA
    </span>
  );
}
