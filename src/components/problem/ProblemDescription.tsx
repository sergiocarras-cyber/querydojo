import { useState } from 'react';
import type { Problem } from '../../lib/problems/types';
import { readJson, writeJson } from '../../lib/storage/local';
import { DifficultyBadge, SectionBadge, TopicChip } from '../Badges';
import { Markdown } from '../Markdown';
import { SqlTables } from './SqlTables';

type Tab = 'statement' | 'hints' | 'solution' | 'submissions';

const TABS: { id: Tab; label: string }[] = [
  { id: 'statement', label: 'Enunciado' },
  { id: 'hints', label: 'Pistas' },
  { id: 'solution', label: 'Solución' },
  { id: 'submissions', label: 'Mis envíos' },
];

export function ProblemDescription({ problem }: { problem: Problem }) {
  const [tab, setTab] = useState<Tab>('statement');

  return (
    <div className="flex h-full flex-col bg-ink-900">
      <div className="flex shrink-0 border-b border-ink-700 px-2">
        {TABS.map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={`-mb-px border-b-2 px-3 py-2 text-xs transition-colors ${
              tab === t.id ? 'border-vermilion text-ink-100' : 'border-transparent text-ink-400 hover:text-ink-200'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>
      <div className="min-h-0 flex-1 overflow-y-auto px-5 py-5">
        {tab === 'statement' && <Statement problem={problem} />}
        {tab === 'hints' && <Hints problem={problem} />}
        {tab === 'solution' && <Solution problem={problem} />}
        {tab === 'submissions' && <p className="text-sm text-ink-500">El historial de envíos llega en la fase 2.</p>}
      </div>
    </div>
  );
}

function Statement({ problem }: { problem: Problem }) {
  return (
    <article>
      <h1 className="text-xl font-semibold text-ink-100">{problem.title}</h1>
      <div className="mt-2 flex flex-wrap items-center gap-3">
        <DifficultyBadge difficulty={problem.difficulty} />
        <SectionBadge section={problem.section} />
        <span className="text-xs text-ink-400">{problem.company}</span>
      </div>
      <div className="mt-2 flex flex-wrap gap-1">
        {problem.topics.map((t) => (
          <TopicChip key={t} topic={t} />
        ))}
      </div>
      <div className="mt-5">
        <Markdown>{problem.statement}</Markdown>
      </div>
      {problem.section === 'sql' && (
        <div className="mt-6">
          <h2 className="mb-3 text-sm font-semibold text-ink-100">Tablas y datos de ejemplo</h2>
          <SqlTables problem={problem} />
        </div>
      )}
    </article>
  );
}

function Hints({ problem }: { problem: Problem }) {
  const key = `hints:${problem.id}`;
  const [shown, setShown] = useState(() => readJson<number>(key, 0));
  const reveal = () => {
    const next = Math.min(problem.hints.length, shown + 1);
    setShown(next);
    writeJson(key, next);
  };

  return (
    <div className="space-y-3">
      {problem.hints.slice(0, shown).map((h, i) => (
        <div key={i} className="rounded-lg border border-ink-700 bg-ink-850 p-4">
          <div className="mb-1 font-mono text-[11px] text-amber">Pista {i + 1}</div>
          <Markdown>{h}</Markdown>
        </div>
      ))}
      {shown < problem.hints.length ? (
        <button
          onClick={reveal}
          className="rounded-md border border-dashed border-ink-600 px-4 py-2 text-sm text-ink-300 hover:border-amber hover:text-amber"
        >
          Desbloquear pista {shown + 1} de {problem.hints.length}
        </button>
      ) : (
        <p className="text-xs text-ink-500">No hay más pistas.</p>
      )}
    </div>
  );
}

function Solution({ problem }: { problem: Problem }) {
  const [revealed, setRevealed] = useState(false);
  if (!revealed) {
    return (
      <div className="rounded-lg border border-ink-700 bg-ink-850 p-6 text-center">
        <p className="text-sm text-ink-300">¿Seguro? Intentarlo un poco más es lo que más enseña.</p>
        <button
          onClick={() => setRevealed(true)}
          className="mt-4 rounded-md bg-ink-700 px-4 py-2 text-sm text-ink-100 hover:bg-ink-600"
        >
          Ver solución
        </button>
      </div>
    );
  }
  const lang = problem.section === 'sql' ? 'sql' : 'python';
  return (
    <div>
      <Markdown>{'```' + lang + '\n' + problem.solution + '\n```'}</Markdown>
      <h2 className="mt-6 mb-2 text-sm font-semibold text-ink-100">Explicación</h2>
      <Markdown>{problem.explanation}</Markdown>
    </div>
  );
}
