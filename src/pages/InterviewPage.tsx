import { useEffect, useMemo, useRef, useState } from 'react';
import { Link } from 'react-router';
import { DifficultyBadge, SECTION_TEXT, SectionBadge } from '../components/Badges';
import { ProblemSolver } from '../components/problem/ProblemSolver';
import {
  INTERVIEW_MINUTES,
  cancelInterview,
  candidates,
  clearInterviewHistory,
  deadline,
  finishInterview,
  formatDuration,
  getInterviewState,
  interviewDraftScope,
  pickProblem,
  sessionSubmissions,
  startInterview,
  summarize,
  useInterview,
  type DifficultyChoice,
  type EndReason,
  type InterviewSession,
  type InterviewSummary,
  type SectionChoice,
} from '../lib/interview/session';
import { getProgress, statusOf, useProgress, type Submission } from '../lib/progress/store';
import { getProblemById, problems } from '../lib/problems/registry';
import { readJson, writeJson } from '../lib/storage/local';
import { DIFFICULTIES, SECTIONS, SECTION_INFO, type Problem } from '../lib/problems/types';

export function InterviewPage() {
  const { current } = useInterview();
  const [shown, setShown] = useState<InterviewSummary | null>(null);
  const problem = current ? getProblemById(current.problemId) : undefined;

  if (current && problem) {
    return <ActiveInterview key={current.id} session={current} problem={problem} onFinished={setShown} />;
  }
  if (shown) return <SummaryView summary={shown} onClose={() => setShown(null)} />;
  return <Setup onShow={setShown} />;
}

/* ------------------------------------------------------------------ setup */

const chip = (active: boolean) =>
  `rounded-md border px-3 py-1.5 text-sm transition-colors ${
    active ? 'border-vermilion bg-vermilion-dim text-ink-100' : 'border-ink-700 text-ink-300 hover:border-ink-500 hover:text-ink-100'
  }`;

function Setup({ onShow }: { onShow: (s: InterviewSummary) => void }) {
  const progress = useProgress();
  const { history } = useInterview();
  const [saved] = useState(() => readJson('interview:options', { section: 'any', difficulty: 'any', onlyUnsolved: true }));
  const [section, setSection] = useState<SectionChoice>(saved.section as SectionChoice);
  const [difficulty, setDifficulty] = useState<DifficultyChoice>(saved.difficulty as DifficultyChoice);
  const [onlyUnsolved, setOnlyUnsolved] = useState(saved.onlyUnsolved);

  const opts = { section, difficulty, onlyUnsolved };
  useEffect(() => writeJson('interview:options', opts), [section, difficulty, onlyUnsolved]);
  const pool = candidates(problems, opts, (id) => statusOf(progress, id) === 'solved');

  const start = () => {
    const recent = history.slice(0, 10).map((h) => h.problemId);
    const problem = pickProblem(pool, recent);
    if (problem) startInterview(problem, opts);
  };

  return (
    <div className="mx-auto max-w-4xl px-6 py-8">
      <h1 className="text-2xl font-semibold text-ink-100">Modo entrevista</h1>
      <p className="mt-1 max-w-2xl text-sm text-ink-400">
        Un problema al azar, {INTERVIEW_MINUTES} minutos y sin pistas ni solución. Piensa en voz alta, escribe tu
        solución y envíala antes de que se acabe el tiempo. Al final verás un resumen.
      </p>

      <div className="mt-6 space-y-5 rounded-xl border border-ink-700 bg-ink-900 p-5">
        <div>
          <div className="mb-2 font-mono text-[11px] tracking-wider text-ink-500 uppercase">Sección</div>
          <div className="flex flex-wrap gap-2">
            <button className={chip(section === 'any')} onClick={() => setSection('any')}>
              Cualquiera
            </button>
            {SECTIONS.map((s) => (
              <button key={s} className={chip(section === s)} onClick={() => setSection(s)}>
                <span className={SECTION_TEXT[s]}>{SECTION_INFO[s].short}</span>
              </button>
            ))}
          </div>
        </div>
        <div>
          <div className="mb-2 font-mono text-[11px] tracking-wider text-ink-500 uppercase">Dificultad</div>
          <div className="flex flex-wrap gap-2">
            <button className={chip(difficulty === 'any')} onClick={() => setDifficulty('any')}>
              Cualquiera
            </button>
            {DIFFICULTIES.map((d) => (
              <button key={d} className={chip(difficulty === d)} onClick={() => setDifficulty(d)}>
                {d}
              </button>
            ))}
          </div>
        </div>
        <label className="flex items-center gap-2 text-sm text-ink-300">
          <input
            type="checkbox"
            checked={onlyUnsolved}
            onChange={(e) => setOnlyUnsolved(e.target.checked)}
            className="accent-orange-500"
          />
          Solo problemas que aún no he resuelto
        </label>
        <div className="flex items-center gap-4 border-t border-ink-700 pt-4">
          <button
            onClick={start}
            disabled={pool.length === 0}
            className="rounded-md bg-vermilion px-5 py-2 text-sm font-semibold text-ink-950 hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-40"
          >
            Empezar entrevista
          </button>
          <span className="text-xs text-ink-400">
            {pool.length === 0
              ? 'No hay problemas con esos filtros.'
              : `${pool.length} ${pool.length === 1 ? 'problema posible' : 'problemas posibles'}`}
          </span>
        </div>
      </div>

      <History history={history} onShow={onShow} />
    </div>
  );
}

function History({ history, onShow }: { history: InterviewSummary[]; onShow: (s: InterviewSummary) => void }) {
  if (history.length === 0) return null;
  const solved = history.filter((h) => h.solved).length;
  return (
    <section className="mt-8">
      <div className="mb-3 flex items-baseline justify-between">
        <h2 className="text-sm font-semibold text-ink-100">
          Historial <span className="font-mono text-xs font-normal text-ink-500">{solved}/{history.length} resueltas</span>
        </h2>
        <button
          onClick={() => window.confirm('¿Borrar el historial de entrevistas?') && clearInterviewHistory()}
          className="text-xs text-ink-500 hover:text-rose"
        >
          Borrar historial
        </button>
      </div>
      <ul className="divide-y divide-ink-800 rounded-lg border border-ink-700 bg-ink-900">
        {history.map((h) => {
          const p = getProblemById(h.problemId);
          return (
            <li key={h.id}>
              <button onClick={() => onShow(h)} className="flex w-full items-center gap-3 px-3 py-2 text-left text-sm hover:bg-ink-850">
                <span className={h.solved ? 'text-jade' : 'text-rose'}>{h.solved ? '✓' : '✗'}</span>
                <span className="truncate text-ink-100">{p?.title ?? h.problemId}</span>
                {p && <SectionBadge section={p.section} />}
                <span className="ml-auto shrink-0 font-mono text-[11px] text-ink-400">
                  {h.solved && h.timeToSolveMs !== null ? formatDuration(h.timeToSolveMs) : '—'} ·{' '}
                  {new Date(h.startedAt).toLocaleDateString('es-ES', { dateStyle: 'short' })}
                </span>
              </button>
            </li>
          );
        })}
      </ul>
    </section>
  );
}

/* ----------------------------------------------------------------- active */

function useNow(intervalMs = 1000) {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const t = window.setInterval(() => setNow(Date.now()), intervalMs);
    return () => window.clearInterval(t);
  }, [intervalMs]);
  return now;
}

function ActiveInterview({
  session,
  problem,
  onFinished,
}: {
  session: InterviewSession;
  problem: Problem;
  onFinished: (s: InterviewSummary) => void;
}) {
  const progress = useProgress();
  const now = useNow();
  const end = deadline(session);
  const left = end - now;
  const finished = useRef(false);

  const finish = (reason: EndReason) => {
    // Guard against a double finish (timer tick + click) and a stale session.
    if (finished.current || getInterviewState().current?.id !== session.id) return;
    finished.current = true;
    const subs = getProgress().submissions[problem.id] ?? [];
    const summary = summarize(session, subs, Date.now(), reason);
    finishInterview(summary);
    onFinished(summary);
  };

  useEffect(() => {
    if (left <= 0) finish('timeout');
  });

  const subs = sessionSubmissions(session, progress.submissions[problem.id] ?? [], now);
  const accepted = subs.find((s) => s.verdict === 'accepted');
  const timerCls = left < 60_000 ? 'text-rose' : left < 5 * 60_000 ? 'text-amber' : 'text-ink-100';

  return (
    <div className="flex h-full flex-col">
      <div className="flex h-11 shrink-0 items-center gap-4 border-b border-ink-700 bg-ink-900 px-4">
        <span className="font-mono text-[11px] tracking-wider text-vermilion uppercase">Entrevista</span>
        <SectionBadge section={problem.section} />
        <DifficultyBadge difficulty={problem.difficulty} />
        <span className="hidden font-mono text-[11px] text-ink-500 md:inline">
          {subs.length} {subs.length === 1 ? 'envío' : 'envíos'}
        </span>
        {accepted && (
          <span className="rounded-full bg-jade/15 px-2 py-0.5 font-mono text-[11px] text-jade">
            ✓ Aceptado en {formatDuration(Date.parse(accepted.at) - Date.parse(session.startedAt))}
          </span>
        )}
        <div className="ml-auto flex items-center gap-3">
          <span className={`font-mono text-lg tabular-nums ${timerCls}`} aria-label="Tiempo restante">
            {formatDuration(left)}
          </span>
          <button
            onClick={() => window.confirm('¿Abandonar esta entrevista? No se guardará en el historial.') && cancelInterview()}
            className="rounded-md px-2 py-1 text-xs text-ink-400 hover:text-rose"
          >
            Abandonar
          </button>
          <button
            onClick={() => (accepted || window.confirm('Aún no tienes un envío aceptado. ¿Terminar igualmente?')) && finish('manual')}
            className={
              accepted
                ? 'rounded-md bg-jade px-3 py-1 text-sm font-semibold text-ink-950 hover:brightness-110'
                : 'rounded-md border border-ink-600 px-3 py-1 text-sm text-ink-200 hover:border-ink-400'
            }
          >
            Terminar
          </button>
        </div>
      </div>
      <div className="min-h-0 flex-1">
        <ProblemSolver problem={problem} scope={interviewDraftScope(session.id)} interview />
      </div>
    </div>
  );
}

/* ---------------------------------------------------------------- summary */

const VERDICT: Record<Submission['verdict'], string> = {
  accepted: 'Aceptado',
  wrong: 'Incorrecto',
  error: 'Error',
  timeout: 'Tiempo límite',
};

function SummaryView({ summary, onClose }: { summary: InterviewSummary; onClose: () => void }) {
  const progress = useProgress();
  const problem = getProblemById(summary.problemId);
  const subs = useMemo(
    () => sessionSubmissions(summary, progress.submissions[summary.problemId] ?? [], Date.parse(summary.endedAt)),
    [summary, progress],
  );
  const start = Date.parse(summary.startedAt);

  return (
    <div className="mx-auto max-w-3xl px-6 py-8">
      <p className="font-mono text-[11px] tracking-wider text-vermilion uppercase">Resumen de la entrevista</p>
      <div
        className={`mt-3 rounded-xl border p-6 ${summary.solved ? 'border-jade/40 bg-jade/10' : 'border-rose/40 bg-rose/10'}`}
      >
        <div className={`text-2xl font-semibold ${summary.solved ? 'text-jade' : 'text-rose'}`}>
          {summary.solved
            ? `✓ Resuelto en ${formatDuration(summary.timeToSolveMs ?? 0)}`
            : summary.endReason === 'timeout'
              ? '✗ Se acabó el tiempo'
              : '✗ Sin resolver'}
        </div>
        {problem && (
          <div className="mt-2 flex flex-wrap items-center gap-3">
            <span className="text-ink-100">{problem.title}</span>
            <SectionBadge section={problem.section} />
            <DifficultyBadge difficulty={problem.difficulty} />
          </div>
        )}
        <dl className="mt-5 grid grid-cols-3 gap-4">
          <Stat label="Tiempo usado" value={formatDuration(summary.durationMs)} />
          <Stat label="Envíos" value={String(summary.submissions)} />
          <Stat label="Último veredicto" value={summary.lastVerdict ? VERDICT[summary.lastVerdict] : '—'} />
        </dl>
      </div>

      {subs.length > 0 && (
        <section className="mt-6">
          <h2 className="mb-2 text-sm font-semibold text-ink-100">Envíos durante la entrevista</h2>
          <ol className="divide-y divide-ink-800 rounded-lg border border-ink-700 bg-ink-900">
            {subs.map((s) => (
              <li key={s.at} className="flex items-center gap-3 px-3 py-2 text-sm">
                <span className="w-12 font-mono text-xs text-ink-500">{formatDuration(Date.parse(s.at) - start)}</span>
                <span className={s.verdict === 'accepted' ? 'text-jade' : 'text-rose'}>{VERDICT[s.verdict]}</span>
                <span className="truncate text-xs text-ink-400">{s.detail}</span>
              </li>
            ))}
          </ol>
        </section>
      )}

      <p className="mt-6 text-sm text-ink-400">
        {!summary.solved
          ? 'Ahora sí: mira las pistas y la solución, y vuelve a intentarlo dentro de unos días.'
          : problem?.section === 'stats'
            ? 'Repasa la explicación oficial: en una entrevista real te pedirían justificar el razonamiento, no solo el número.'
            : 'Repasa la solución oficial y compara la complejidad con la tuya: en una entrevista real te la preguntarían.'}
      </p>
      <div className="mt-4 flex flex-wrap gap-2">
        {problem && (
          <Link
            to={`/problem/${problem.slug}`}
            className="rounded-md border border-ink-600 px-4 py-2 text-sm text-ink-100 hover:border-ink-400"
          >
            Ver pistas y solución
          </Link>
        )}
        <button
          onClick={onClose}
          className="rounded-md bg-vermilion px-4 py-2 text-sm font-semibold text-ink-950 hover:brightness-110"
        >
          Nueva entrevista
        </button>
      </div>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="font-mono text-[11px] tracking-wider text-ink-500 uppercase">{label}</dt>
      <dd className="mt-1 font-mono text-lg text-ink-100">{value}</dd>
    </div>
  );
}
