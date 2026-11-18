import { useMemo, useRef, useState } from 'react';
import { Link } from 'react-router';
import { DifficultyBadge, SECTION_BG, SECTION_TEXT, SectionBadge } from '../components/Badges';
import { todayKey } from '../lib/daily';
import {
  addDays,
  bestStreak,
  currentStreak,
  difficultyTallies,
  sectionTallies,
  submissionsPerDay,
  topicTallies,
  weakTopics,
  type Tally,
} from '../lib/progress/stats';
import {
  assistReadyAt,
  exportProgress,
  importProgress,
  resetProgress,
  useProgress,
  type Submission,
} from '../lib/progress/store';
import { getProblemById, problems, problemsIn } from '../lib/problems/registry';
import { DIFFICULTIES, SECTIONS, SECTION_INFO, type Section } from '../lib/problems/types';
import { useTitle } from '../hooks/useTitle';

const pct = (t: Tally) => (t.total ? Math.round((t.solved / t.total) * 100) : 0);

export function ProgressPage() {
  useTitle('Progreso');
  const progress = useProgress();
  const today = todayKey();

  const bySection = useMemo(() => sectionTallies(problems, progress), [progress]);
  const byDifficulty = useMemo(() => difficultyTallies(problems, progress), [progress]);
  const topicsBySection = useMemo(
    () =>
      SECTIONS.map((section) => ({
        section,
        topics: topicTallies(problemsIn(section), progress),
      })),
    [progress],
  );
  const weak = useMemo(
    () =>
      weakTopics(
        topicsBySection.flatMap((g) => g.topics),
        6,
      ),
    [topicsBySection],
  );
  const perDay = useMemo(() => submissionsPerDay(progress), [progress]);
  const recent = useMemo(() => {
    const all: (Submission & { problemId: string })[] = [];
    for (const [problemId, subs] of Object.entries(progress.submissions)) {
      for (const s of subs) all.push({ ...s, problemId });
    }
    return all.sort((a, b) => b.at.localeCompare(a.at)).slice(0, 8);
  }, [progress]);

  const review = useMemo(
    () =>
      Object.entries(progress.problems)
        .filter(([, pp]) => pp.status === 'assisted')
        .map(([id, pp]) => ({ meta: getProblemById(id), ready: assistReadyAt(pp) }))
        .filter((r) => r.meta)
        .sort((a, b) => (a.ready?.getTime() ?? 0) - (b.ready?.getTime() ?? 0)),
    [progress],
  );
  const solved = bySection.reduce((n, s) => n + s.solved, 0);
  const assisted = bySection.reduce((n, s) => n + s.assisted, 0);
  const attempted = bySection.reduce((n, s) => n + s.attempted, 0);
  const totalSubs = Object.values(progress.submissions).reduce((n, s) => n + s.length, 0);
  const streak = currentStreak(progress.activeDays, today);
  const best = bestStreak(progress.activeDays);
  const activeToday = progress.activeDays.includes(today);

  return (
    <div className="mx-auto max-w-6xl px-6 py-8">
      <h1 className="text-2xl font-semibold text-ink-100">Progreso</h1>
      <p className="mt-1 text-sm text-ink-400">Solo cuentan los Submit. Todo se guarda en este navegador.</p>

      <section className="mt-6 grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-6">
        <Tile label="Resueltos" value={`${solved}`} sub={`de ${problems.length}`} accent="text-jade" />
        <Tile label="Con ayuda" value={`${assisted}`} sub="tras ver la solución" accent="text-sky" />
        <Tile label="Intentados" value={`${attempted}`} sub="sin resolver aún" accent="text-amber" />
        <Tile
          label="Racha actual"
          value={`${streak} ${streak === 1 ? 'día' : 'días'}`}
          sub={streak > 0 && !activeToday ? 'envía algo hoy para mantenerla' : activeToday ? 'hoy ya cuenta' : 'empieza hoy'}
          accent="text-vermilion"
        />
        <Tile label="Mejor racha" value={`${best} ${best === 1 ? 'día' : 'días'}`} sub={progress.activeDays.length === 1 ? '1 día activo' : `${progress.activeDays.length} días activos`} />
        <Tile label="Envíos" value={`${totalSubs}`} sub="últimos 30 por problema" />
      </section>

      <Heatmap perDay={perDay} today={today} />

      <div className="mt-8 grid gap-6 lg:grid-cols-[1.4fr_1fr]">
        <section>
          <h2 className="mb-3 text-sm font-semibold text-ink-100">Por sección</h2>
          <div className="space-y-3">
            {bySection.map((s) => (
              <Link
                key={s.section}
                to={`/problems/${s.section}`}
                className="block rounded-lg border border-ink-700 bg-ink-900 p-4 transition-colors hover:border-ink-500"
              >
                <div className="flex items-center justify-between">
                  <span className={`font-mono text-sm font-semibold ${SECTION_TEXT[s.section]}`}>
                    {SECTION_INFO[s.section].name}
                  </span>
                  <span className="font-mono text-xs text-ink-400">
                    {s.solved}/{s.total} · {pct(s)}%
                  </span>
                </div>
                <Bar tally={s} color={SECTION_BG[s.section]} />
                <div className="mt-2 flex gap-4 font-mono text-[11px] text-ink-400">
                  {DIFFICULTIES.map((d) => (
                    <span key={d}>
                      <DifficultyBadge difficulty={d} /> {s.byDifficulty[d].solved}/{s.byDifficulty[d].total}
                    </span>
                  ))}
                </div>
              </Link>
            ))}
          </div>

          <h2 className="mt-6 mb-3 text-sm font-semibold text-ink-100">Por dificultad</h2>
          <div className="grid grid-cols-3 gap-3">
            {DIFFICULTIES.map((d) => (
              <div key={d} className="rounded-lg border border-ink-700 bg-ink-900 p-3">
                <DifficultyBadge difficulty={d} />
                <div className="mt-2 font-mono text-lg text-ink-100">
                  {byDifficulty[d].solved}
                  <span className="text-sm text-ink-500">/{byDifficulty[d].total}</span>
                </div>
                <Bar
                  tally={byDifficulty[d]}
                  color={d === 'Easy' ? 'bg-jade' : d === 'Medium' ? 'bg-amber' : 'bg-rose'}
                />
              </div>
            ))}
          </div>
        </section>

        <section>
          <h2 className="mb-3 text-sm font-semibold text-ink-100">Temas débiles</h2>
          {weak.length === 0 ? (
            <p className="rounded-lg border border-ink-700 bg-ink-900 p-4 text-sm text-ink-400">
              Aún no hay datos. Aparecerán los temas en los que fallas más envíos o dejas problemas sin resolver.
            </p>
          ) : (
            <ul className="space-y-2">
              {weak.map((t) => (
                <li key={`${t.sections[0]}:${t.topic}`}>
                  <Link
                    to={`/problems/${t.sections[0]}?topic=${encodeURIComponent(t.topic)}`}
                    className="flex items-center gap-3 rounded-lg border border-ink-700 bg-ink-900 px-3 py-2.5 transition-colors hover:border-rose/60"
                  >
                    <SectionBadge section={t.sections[0]} />
                    <span className="text-sm text-ink-100">{t.topic}</span>
                    <span className="ml-auto text-right font-mono text-[11px] text-ink-400">
                      <span className="text-rose">{Math.round((t.failures / t.attempts) * 100)}% fallos</span>
                      <br />
                      {t.solved}/{t.total} resueltos
                      {t.unsolvedTried > 0 && ` · ${t.unsolvedTried} a medias`}
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          )}

          {review.length > 0 && (
            <>
              <h2 className="mt-6 mb-1 text-sm font-semibold text-ink-100">Para repasar</h2>
              <p className="mb-3 text-xs text-ink-500">
                Los resolviste después de ver la solución. Resuélvelos sin mirar cuando toque para que cuenten.
              </p>
              <ul className="divide-y divide-ink-800 rounded-lg border border-ink-700 bg-ink-900">
                {review.map(({ meta, ready }) => {
                  const due = !ready || ready.getTime() <= Date.now();
                  return (
                    <li key={meta!.id}>
                      <Link to={`/problem/${meta!.slug}`} className="flex items-center gap-3 px-3 py-2 text-sm hover:bg-ink-850">
                        <span className="text-sky">◐</span>
                        <span className="truncate text-ink-200">{meta!.title}</span>
                        <span className={`ml-auto shrink-0 font-mono text-[11px] ${due ? 'text-jade' : 'text-ink-500'}`}>
                          {due
                            ? 'ya puedes'
                            : `desde el ${ready!.toLocaleDateString('es-ES', { day: 'numeric', month: 'short' })}`}
                        </span>
                      </Link>
                    </li>
                  );
                })}
              </ul>
            </>
          )}

          <h2 className="mt-6 mb-3 text-sm font-semibold text-ink-100">Últimos envíos</h2>
          {recent.length === 0 ? (
            <p className="text-sm text-ink-500">Todavía no hay envíos.</p>
          ) : (
            <ul className="divide-y divide-ink-800 rounded-lg border border-ink-700 bg-ink-900">
              {recent.map((s) => {
                const p = getProblemById(s.problemId);
                return (
                  <li key={`${s.problemId}:${s.at}`} className="flex items-center gap-3 px-3 py-2 text-sm">
                    <span className={s.assisted ? 'text-sky' : s.verdict === 'accepted' ? 'text-jade' : 'text-rose'}>
                      {s.assisted ? '◐' : s.verdict === 'accepted' ? '✓' : '✗'}
                    </span>
                    {p ? (
                      <Link to={`/problem/${p.slug}`} className="truncate text-ink-200 hover:text-ink-100 hover:underline">
                        {p.title}
                      </Link>
                    ) : (
                      <span className="text-ink-500">{s.problemId}</span>
                    )}
                    <span className="ml-auto shrink-0 font-mono text-[11px] text-ink-500">
                      {new Date(s.at).toLocaleString('es-ES', { dateStyle: 'short', timeStyle: 'short' })}
                    </span>
                  </li>
                );
              })}
            </ul>
          )}
        </section>
      </div>

      <section className="mt-8">
        <h2 className="mb-3 text-sm font-semibold text-ink-100">Por tema</h2>
        <div className="grid gap-4 md:grid-cols-2">
          {topicsBySection.map(({ section, topics }) => (
            <TopicTable key={section} section={section} topics={topics} />
          ))}
        </div>
      </section>

      <DataControls />
    </div>
  );
}

function Tile({ label, value, sub, accent = 'text-ink-100' }: { label: string; value: string; sub: string; accent?: string }) {
  return (
    <div className="rounded-lg border border-ink-700 bg-ink-900 p-4">
      <div className="font-mono text-[11px] tracking-wider text-ink-500 uppercase">{label}</div>
      <div className={`mt-1 text-2xl font-semibold ${accent}`}>{value}</div>
      <div className="mt-0.5 text-xs text-ink-500">{sub}</div>
    </div>
  );
}

function Bar({ tally, color }: { tally: Tally; color: string }) {
  const solved = tally.total ? (tally.solved / tally.total) * 100 : 0;
  const tried = tally.total ? (tally.attempted / tally.total) * 100 : 0;
  return (
    <div
      className="mt-2 flex h-1.5 overflow-hidden rounded-full bg-ink-800"
      title={`${tally.solved} resueltos, ${tally.assisted} con ayuda, ${tally.attempted} intentados`}
    >
      <div className={color} style={{ width: `${solved}%` }} />
      <div className="bg-sky/50" style={{ width: `${tally.total ? (tally.assisted / tally.total) * 100 : 0}%` }} />
      <div className="bg-ink-600" style={{ width: `${tried}%` }} />
    </div>
  );
}

const WEEKS = 26;
const LEVELS = ['bg-ink-800', 'bg-vermilion/30', 'bg-vermilion/55', 'bg-vermilion/80', 'bg-vermilion'];
const level = (n: number) => (n === 0 ? 0 : n <= 2 ? 1 : n <= 5 ? 2 : n <= 9 ? 3 : 4);
const MONTHS = ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic'];
const DAY_LABELS = ['L', '', 'X', '', 'V', '', ''];

/** Last 26 weeks of activity, one column per week starting on Monday. */
function Heatmap({ perDay, today }: { perDay: Record<string, number>; today: string }) {
  const weekday = (new Date().getDay() + 6) % 7; // Monday = 0
  const start = addDays(today, -(WEEKS - 1) * 7 - weekday);
  const columns: { key: string; n: number; future: boolean }[][] = [];
  for (let w = 0; w < WEEKS; w++) {
    const col = [];
    for (let d = 0; d < 7; d++) {
      const key = addDays(start, w * 7 + d);
      col.push({ key, n: perDay[key] ?? 0, future: key > today });
    }
    columns.push(col);
  }
  const last = columns.slice(-WEEKS);
  const total = Object.entries(perDay)
    .filter(([k]) => k >= start && k <= today)
    .reduce((n, [, v]) => n + v, 0);
  return (
    <section className="mt-6 rounded-lg border border-ink-700 bg-ink-900 p-4">
      <div className="mb-3 flex items-center justify-between">
        <h2 className="text-sm font-semibold text-ink-100">
          Actividad <span className="font-mono text-xs font-normal text-ink-500">{total} {total === 1 ? 'envío' : 'envíos'} en 6 meses</span>
        </h2>
        <div className="flex items-center gap-1 text-[11px] text-ink-500">
          menos
          {LEVELS.map((c) => (
            <span key={c} className={`h-2.5 w-2.5 rounded-sm ${c}`} />
          ))}
          más
        </div>
      </div>
      <div className="flex gap-2 overflow-x-auto">
        <div className="flex flex-col gap-[3px] pt-4 font-mono text-[10px] leading-[14px] text-ink-500">
          {DAY_LABELS.map((d, i) => (
            <span key={i} className="h-3.5">
              {d}
            </span>
          ))}
        </div>
        <div className="flex gap-[3px]">
          {last.map((col, i) => {
            const month = Number(col[0].key.slice(5, 7)) - 1;
            const m = (j: number) => last[j]?.[0].key.slice(5, 7);
            // Label each month at its first week; the partial first month only if it has room.
            const showMonth = i === 0 ? m(1) === m(0) && m(2) === m(0) : m(i) !== m(i - 1);
            return (
              <div key={i} className="flex flex-col gap-[3px]">
                <span className="h-3.5 w-3.5 overflow-visible font-mono text-[10px] leading-[14px] whitespace-nowrap text-ink-500">
                  {showMonth ? MONTHS[month] : ''}
                </span>
                {col.map((c) => (
                  <span
                    key={c.key}
                    title={c.future ? '' : `${c.key}: ${c.n} ${c.n === 1 ? 'envío' : 'envíos'}`}
                    className={`h-3.5 w-3.5 rounded-sm ${c.future ? 'bg-transparent' : LEVELS[level(c.n)]} ${
                      c.key === today ? 'ring-1 ring-ink-300' : ''
                    }`}
                  />
                ))}
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}

function TopicTable({ section, topics }: { section: Section; topics: ReturnType<typeof topicTallies> }) {
  return (
    <div className="rounded-lg border border-ink-700 bg-ink-900">
      <div className={`border-b border-ink-700 px-4 py-2 font-mono text-xs font-semibold ${SECTION_TEXT[section]}`}>
        {SECTION_INFO[section].name}
      </div>
      <ul className="max-h-72 overflow-y-auto px-4 py-2">
        {topics.map((t) => (
          <li key={t.topic}>
            <Link
              to={`/problems/${section}?topic=${encodeURIComponent(t.topic)}`}
              className="group flex items-center gap-3 py-1 text-xs"
            >
              <span className="w-40 shrink-0 truncate text-ink-300 group-hover:text-ink-100">{t.topic}</span>
              <span className="flex h-1 flex-1 overflow-hidden rounded-full bg-ink-800">
                <span className={SECTION_BG[section]} style={{ width: `${pct(t)}%` }} />
              </span>
              <span className="w-10 shrink-0 text-right font-mono text-ink-500">
                {t.solved}/{t.total}
              </span>
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}

function DataControls() {
  const fileRef = useRef<HTMLInputElement>(null);
  const [message, setMessage] = useState<{ ok: boolean; text: string } | null>(null);

  const download = () => {
    const blob = new Blob([exportProgress()], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `querydojo-progreso-${todayKey()}.json`;
    a.click();
    URL.revokeObjectURL(url);
    setMessage({ ok: true, text: 'Progreso exportado.' });
  };

  const onFile = async (file: File | undefined) => {
    if (!file) return;
    try {
      const text = await file.text();
      if (!window.confirm('Esto reemplaza todo tu progreso actual por el del archivo. ¿Continuar?')) return;
      importProgress(text);
      setMessage({ ok: true, text: `Progreso importado desde ${file.name}.` });
    } catch (e) {
      setMessage({
        ok: false,
        text: e instanceof SyntaxError ? 'El archivo no es JSON válido.' : (e as Error).message,
      });
    } finally {
      if (fileRef.current) fileRef.current.value = '';
    }
  };

  const reset = () => {
    if (!window.confirm('¿Borrar todo el progreso y el historial de envíos? No se puede deshacer (exporta antes si quieres conservarlo).')) return;
    resetProgress();
    setMessage({ ok: true, text: 'Progreso borrado.' });
  };

  const btn = 'rounded-md border border-ink-600 px-3 py-1.5 text-sm text-ink-200 hover:border-ink-400 hover:text-ink-100';
  return (
    <section className="mt-8 rounded-lg border border-ink-700 bg-ink-900 p-4">
      <h2 className="text-sm font-semibold text-ink-100">Tus datos</h2>
      <p className="mt-1 text-xs text-ink-400">
        El progreso vive en el localStorage de este navegador. Expórtalo para hacer copia o pasarlo a otro equipo.
      </p>
      <div className="mt-3 flex flex-wrap items-center gap-2">
        <button onClick={download} className={btn}>
          Exportar JSON
        </button>
        <button onClick={() => fileRef.current?.click()} className={btn}>
          Importar JSON
        </button>
        <input
          ref={fileRef}
          type="file"
          accept="application/json,.json"
          className="hidden"
          aria-label="Archivo de progreso"
          onChange={(e) => onFile(e.target.files?.[0])}
        />
        <button onClick={reset} className="rounded-md px-3 py-1.5 text-sm text-rose hover:bg-rose/10">
          Borrar progreso
        </button>
        {message && <span className={`text-xs ${message.ok ? 'text-jade' : 'text-rose'}`}>{message.text}</span>}
      </div>
    </section>
  );
}
