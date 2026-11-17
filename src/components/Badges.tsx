import { SECTION_INFO, type Difficulty, type Section } from '../lib/problems/types';

const DIFFICULTY_CLASS: Record<Difficulty, string> = {
  Easy: 'text-jade bg-jade/10 ring-jade/25',
  Medium: 'text-amber bg-amber/10 ring-amber/25',
  Hard: 'text-rose bg-rose/10 ring-rose/25',
};

export function DifficultyBadge({ difficulty }: { difficulty: Difficulty }) {
  return (
    <span className={`rounded px-1.5 py-0.5 font-mono text-[11px] font-medium ring-1 ring-inset ${DIFFICULTY_CLASS[difficulty]}`}>
      {difficulty}
    </span>
  );
}

export const SECTION_TEXT: Record<Section, string> = {
  sql: 'text-sky',
  algorithms: 'text-vermilion',
  pandas: 'text-jade',
  stats: 'text-violet',
};

export const SECTION_BG: Record<Section, string> = {
  sql: 'bg-sky',
  algorithms: 'bg-vermilion',
  pandas: 'bg-jade',
  stats: 'bg-violet',
};

export function SectionBadge({ section }: { section: Section }) {
  return (
    <span className={`inline-flex items-center gap-1.5 font-mono text-[11px] ${SECTION_TEXT[section]}`}>
      <span className={`h-1.5 w-1.5 rounded-full ${SECTION_BG[section]}`} />
      {SECTION_INFO[section].short}
    </span>
  );
}

export function TopicChip({ topic }: { topic: string }) {
  return <span className="rounded bg-ink-800 px-1.5 py-0.5 text-[11px] text-ink-300">{topic}</span>;
}
