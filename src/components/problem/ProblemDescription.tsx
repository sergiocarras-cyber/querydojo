import { useState } from 'react';
import { statusOf, useProgress, type Submission } from '../../lib/progress/store';
import type { Problem } from '../../lib/problems/types';
import { readJson, writeJson } from '../../lib/storage/local';
import { DifficultyBadge, SectionBadge, TopicChip } from '../Badges';
import { Markdown } from '../Markdown';
import { formatNumber } from '../../lib/stats/answer';
import { PandasTables } from './PandasTables';
import { SqlTables } from './SqlTables';

type Tab = 'statement' | 'hints' | 'solution' | 'submissions';

const TABS: { id: Tab; label: string }[] = [
  { id: 'statement', label: 'Enunciado' },
  { id: 'hints', label: 'Pistas' },
  { id: 'solution', label: 'Solución' },
  { id: 'submissions', label: 'Mis envíos' },
];

interface Props {
  problem: Problem;
  /** Code problems only: loads an old submission into the editor. */
  onLoadCode?: (code: string) => void;
}

export function ProblemDescription({ problem, onLoadCode }: Props) {
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
        {tab === 'submissions' && <Submissions problem={problem} onLoadCode={onLoadCode} />}
      </div>
    </div>
  );
}

function Statement({ problem }: { problem: Problem }) {
  const progress = useProgress();
  const status = statusOf(progress, problem.id);
  return (
    <article>
      <div className="flex items-start justify-between gap-3">
        <h1 className="text-xl font-semibold text-ink-100">{problem.title}</h1>
        <StatusBadge status={status} />
      </div>
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
      {problem.section === 'pandas' && (
        <div className="mt-6">
          <h2 className="mb-3 text-sm font-semibold text-ink-100">DataFrames de ejemplo</h2>
          <PandasTables problem={problem} />
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
  if (problem.section === 'stats') {
    return (
      <div>
        <div className="mb-4 rounded-md border border-jade/30 bg-jade/10 px-3 py-2 text-sm text-ink-100">
          <span className="text-jade">Respuesta: </span>
          {problem.answerType === 'numeric' ? (
            <span className="font-mono">{formatNumber(problem.answer)}</span>
          ) : (
            <Markdown>{problem.options[problem.answer]}</Markdown>
          )}
        </div>
        <Markdown>{problem.explanation}</Markdown>
      </div>
    );
  }
  const lang = problem.section === 'sql' ? 'sql' : 'python';
  return (
    <div>
      {problem.section === 'algorithms' && (
        <div className="mb-4 flex flex-wrap gap-3 font-mono text-xs">
          <span className="rounded-md border border-ink-700 bg-ink-850 px-2.5 py-1.5">
            <span className="text-ink-500">Tiempo </span>
            <span className="text-amber">{problem.complexity.time}</span>
          </span>
          <span className="rounded-md border border-ink-700 bg-ink-850 px-2.5 py-1.5">
            <span className="text-ink-500">Espacio </span>
            <span className="text-amber">{problem.complexity.space}</span>
          </span>
        </div>
      )}
      <Markdown>{'```' + lang + '\n' + problem.solution + '\n```'}</Markdown>
      <h2 className="mt-6 mb-2 text-sm font-semibold text-ink-100">Explicación</h2>
      <Markdown>{problem.explanation}</Markdown>
    </div>
  );
}

function StatusBadge({ status }: { status: ReturnType<typeof statusOf> }) {
  if (status === 'todo') return null;
  return status === 'solved' ? (
    <span className="shrink-0 rounded-full bg-jade/15 px-2 py-0.5 font-mono text-[11px] text-jade">✓ Resuelto</span>
  ) : (
    <span className="shrink-0 rounded-full bg-amber/15 px-2 py-0.5 font-mono text-[11px] text-amber">● Intentado</span>
  );
}

const VERDICT_LABEL: Record<Submission['verdict'], { text: string; cls: string }> = {
  accepted: { text: 'Aceptado', cls: 'text-jade' },
  wrong: { text: 'Incorrecto', cls: 'text-rose' },
  error: { text: 'Error', cls: 'text-amber' },
  timeout: { text: 'Tiempo límite', cls: 'text-amber' },
};

function Submissions({ problem, onLoadCode }: Props) {
  const progress = useProgress();
  const subs = progress.submissions[problem.id] ?? [];
  const [open, setOpen] = useState<number | null>(null);

  if (subs.length === 0) {
    return (
      <p className="text-sm text-ink-500">
        {problem.section === 'stats'
          ? 'Todavía no has respondido. Escribe tu respuesta y pulsa Comprobar.'
          : 'Todavía no has enviado ninguna solución. Usa Submit para corregir.'}
      </p>
    );
  }
  return (
    <ul className="space-y-2">
      {subs.map((s, i) => {
        const v = VERDICT_LABEL[s.verdict];
        return (
          <li key={s.at} className="rounded-lg border border-ink-700 bg-ink-850">
            <button onClick={() => setOpen(open === i ? null : i)} className="flex w-full items-center gap-3 px-3 py-2 text-left">
              <span className={`w-24 text-sm font-medium ${v.cls}`}>{v.text}</span>
              <span className="font-mono text-xs text-ink-400">
                {s.passed}/{s.total}
              </span>
              <span className="ml-auto font-mono text-[11px] text-ink-500">
                {new Date(s.at).toLocaleString('es-ES', { dateStyle: 'short', timeStyle: 'short' })}
              </span>
            </button>
            {open === i && (
              <div className="border-t border-ink-700 px-3 py-3">
                <p className="mb-2 text-xs text-ink-300">{s.detail}</p>
                <pre className="max-h-64 overflow-auto rounded bg-ink-950 p-2 font-mono text-xs text-ink-200">{s.code}</pre>
                {onLoadCode && (
                  <button
                    onClick={() => onLoadCode(s.code)}
                    className="mt-2 rounded bg-ink-700 px-2.5 py-1 text-xs text-ink-100 hover:bg-ink-600"
                  >
                    Cargar en el editor
                  </button>
                )}
              </div>
            )}
          </li>
        );
      })}
    </ul>
  );
}
