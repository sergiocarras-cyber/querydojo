import { Link } from 'react-router';
import { DifficultyBadge, SECTION_BG, SECTION_TEXT, SectionBadge } from '../components/Badges';
import { EditorPreview } from '../components/home/EditorPreview';
import { useTitle } from '../hooks/useTitle';
import { problemOfTheDay } from '../lib/daily';
import { STUDY_PATHS, pathProblemIds } from '../lib/paths';
import { currentStreak } from '../lib/progress/stats';
import { statusOf, useProgress, type ProgressData } from '../lib/progress/store';
import { getProblemById, problems, problemsIn } from '../lib/problems/registry';
import { DIFFICULTIES, SECTIONS, SECTION_INFO, type ProblemMeta } from '../lib/problems/types';

const HIGHLIGHTS = ['PostgreSQL real', 'Python 3 + pandas', 'Tests ocultos', 'Sin registro'];

const DIFF_BG = { Easy: 'bg-jade/70', Medium: 'bg-amber/70', Hard: 'bg-rose/70' } as const;

/** Next unsolved problem in the study path of the section you touched last. */
function continueWith(progress: ProgressData): ProblemMeta | undefined {
  const last = Object.entries(progress.problems).sort((a, b) => b[1].lastAttemptAt.localeCompare(a[1].lastAttemptAt))[0];
  if (!last) return undefined;
  const lastMeta = getProblemById(last[0]);
  if (!lastMeta) return undefined;
  if (progress.problems[lastMeta.id].status !== 'solved') return lastMeta;
  const path = STUDY_PATHS.find((p) => p.section === lastMeta.section);
  const next = path && pathProblemIds(path).find((id) => statusOf(progress, id) !== 'solved');
  return next ? getProblemById(next) : undefined;
}

export function HomePage() {
  useTitle();
  const progress = useProgress();
  const daily = problemOfTheDay(problems);
  const started = Object.keys(progress.problems).length > 0;
  const streak = currentStreak(progress.activeDays);
  const solved = problems.filter((p) => statusOf(progress, p.id) === 'solved').length;
  const next = continueWith(progress);

  return (
    <div className="relative min-h-full overflow-hidden">
      <div aria-hidden className="dojo-grid pointer-events-none absolute inset-x-0 top-0 h-[640px]" />
      <div aria-hidden className="dojo-glow pointer-events-none absolute inset-x-0 top-0 h-[640px]" />

      <div className="relative mx-auto max-w-6xl px-6">
        {/* Hero */}
        <section className="grid items-center gap-12 pt-16 pb-14 lg:grid-cols-[1.05fr_1fr] lg:pt-24">
          <div>
            <p className="font-mono text-xs tracking-widest text-vermilion uppercase">$ querydojo --train</p>
            <h1 className="mt-4 text-4xl leading-[1.1] font-semibold tracking-tight text-ink-100 sm:text-5xl">
              Entrena para la
              <br />
              entrevista técnica.
            </h1>
            <p className="mt-5 max-w-md text-lg leading-relaxed text-ink-400">
              {problems.length} problemas de SQL, algoritmos, pandas y probabilidad. Escribes código de verdad y se
              corrige al instante, todo en tu navegador.
            </p>

            <div className="mt-8 flex flex-wrap items-center gap-3">
              {next ? (
                <Link
                  to={`/problem/${next.slug}`}
                  className="rounded-lg bg-vermilion px-5 py-2.5 text-sm font-semibold text-ink-950 transition hover:brightness-110"
                >
                  Continuar: {next.title} →
                </Link>
              ) : (
                <Link
                  to="/paths"
                  className="rounded-lg bg-vermilion px-5 py-2.5 text-sm font-semibold text-ink-950 transition hover:brightness-110"
                >
                  Empezar una ruta →
                </Link>
              )}
              <Link
                to="/interview"
                className="rounded-lg border border-ink-600 px-5 py-2.5 text-sm text-ink-100 transition hover:border-ink-400"
              >
                Simular entrevista · 30 min
              </Link>
            </div>

            <ul className="mt-8 flex flex-wrap gap-x-5 gap-y-2 font-mono text-xs text-ink-500">
              {HIGHLIGHTS.map((h) => (
                <li key={h} className="flex items-center gap-1.5">
                  <span className="text-jade">✓</span>
                  {h}
                </li>
              ))}
            </ul>
          </div>

          <EditorPreview />
        </section>

        {/* Today / you */}
        <section className="flex flex-wrap items-center gap-x-8 gap-y-3 border-y border-ink-800 py-4 text-sm">
          {daily && (
            <Link to={`/problem/${daily.slug}`} className="group flex flex-wrap items-center gap-3">
              <span className="font-mono text-[11px] tracking-wider text-vermilion uppercase">Problema del día</span>
              <span className="text-ink-100 group-hover:underline">{daily.title}</span>
              <SectionBadge section={daily.section} />
              <DifficultyBadge difficulty={daily.difficulty} />
              <span className="text-ink-500 transition-transform group-hover:translate-x-0.5">→</span>
            </Link>
          )}
          {started && (
            <Link to="/progress" className="flex items-center gap-5 font-mono text-xs text-ink-400 hover:text-ink-200 sm:ml-auto">
              <span>
                <span className="text-ink-100">{solved}</span>/{problems.length} resueltos
              </span>
              <span>
                racha <span className="text-vermilion">{streak}</span> {streak === 1 ? 'día' : 'días'}
              </span>
            </Link>
          )}
        </section>

        {/* Sections */}
        <section className="grid gap-4 py-12 sm:grid-cols-2 lg:grid-cols-4">
          {SECTIONS.map((id) => {
            const info = SECTION_INFO[id];
            const list = problemsIn(id);
            const total = list.length;
            const done = list.filter((p) => statusOf(progress, p.id) === 'solved').length;
            return (
              <Link
                key={id}
                to={`/problems/${id}`}
                className="group flex flex-col rounded-xl border border-ink-800 bg-ink-900/60 p-5 transition-colors hover:border-ink-600 hover:bg-ink-900"
              >
                <div className="flex items-center gap-2">
                  <span className={`h-2 w-2 rounded-full ${SECTION_BG[id]}`} />
                  <h2 className={`font-mono text-sm font-semibold ${SECTION_TEXT[id]}`}>{info.short}</h2>
                  <span className="ml-auto text-ink-600 transition-transform group-hover:translate-x-0.5 group-hover:text-ink-300">
                    →
                  </span>
                </div>
                <p className="mt-3 flex-1 text-sm leading-relaxed text-ink-400">{info.description}</p>
                <div className="mt-5">
                  {done > 0 ? (
                    <>
                      <div className="h-1 overflow-hidden rounded-full bg-ink-800">
                        <div className={`h-full ${SECTION_BG[id]}`} style={{ width: `${(done / total) * 100}%` }} />
                      </div>
                      <div className="mt-2 font-mono text-[11px] text-ink-500">
                        {done}/{total} resueltos
                      </div>
                    </>
                  ) : (
                    <>
                      <div className="flex h-1 gap-0.5 overflow-hidden rounded-full" title="Fácil · Media · Difícil">
                        {DIFFICULTIES.map((d) => {
                          const n = list.filter((p) => p.difficulty === d).length;
                          return <div key={d} className={DIFF_BG[d]} style={{ flexGrow: n }} />;
                        })}
                      </div>
                      <div className="mt-2 font-mono text-[11px] text-ink-500">{total} problemas</div>
                    </>
                  )}
                </div>
              </Link>
            );
          })}
        </section>

        <footer className="flex flex-wrap items-center justify-between gap-3 border-t border-ink-800 py-6 font-mono text-[11px] text-ink-600">
          <span>
            Hecho con PGlite, Pyodide y React · {problems.length} problemas originales
          </span>
          <span>Tu progreso se guarda solo en este navegador.</span>
        </footer>
      </div>
    </div>
  );
}
