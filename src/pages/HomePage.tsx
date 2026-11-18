import { Link } from 'react-router';
import { DifficultyBadge, SECTION_BG, SECTION_TEXT, SectionBadge } from '../components/Badges';
import { EditorPreview } from '../components/home/EditorPreview';
import { useTitle } from '../hooks/useTitle';
import { problemOfTheDay } from '../lib/daily';
import { STUDY_PATHS, pathProblemIds } from '../lib/paths';
import { currentStreak } from '../lib/progress/stats';
import { statusOf, useProgress, type ProgressData } from '../lib/progress/store';
import { getProblemById, problems, problemsIn } from '../lib/problems/registry';
import { DIFFICULTIES, SECTIONS, SECTION_INFO, inJudgmentTrack, type ProblemMeta } from '../lib/problems/types';

const HIGHLIGHTS = ['PostgreSQL real', 'Python 3 + pandas', 'Tests ocultos', 'Sin registro'];

const DIFF_BG = { Easy: 'bg-jade/60', Medium: 'bg-amber/60', Hard: 'bg-rose/60' } as const;

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
      <div aria-hidden className="dojo-glow pointer-events-none absolute inset-x-0 top-0 h-[720px]" />

      <div className="relative mx-auto max-w-[1080px] px-6">
        {/* Hero */}
        <section className="flex flex-col items-center pt-16 text-center sm:pt-24">
          <Link
            to="/problems/judgment"
            className="group inline-flex items-center gap-2 rounded-full bg-ink-900 px-3.5 py-1.5 text-[13px] text-ink-300 shadow-card ring-1 ring-ink-700/70 transition-colors hover:text-ink-100"
          >
            <span className="font-medium text-vermilion">Nuevo</span>
            <span className="h-3 w-px bg-ink-700" />
            Criterio para la era de la IA
            <span className="text-ink-500 transition-transform group-hover:translate-x-0.5">›</span>
          </Link>
          <h1 className="mt-7 max-w-3xl text-balance text-[44px] leading-[1.05] font-semibold tracking-[-0.035em] text-ink-100 sm:text-[64px]">
            Entrena para la entrevista técnica.
          </h1>
          <p className="mt-6 max-w-2xl text-lg leading-relaxed text-pretty text-ink-400 sm:text-[21px] sm:leading-[1.45]">
            {problems.length} problemas de SQL, algoritmos, pandas, probabilidad y criterio. Escribes código de verdad
            y se corrige al instante. Todo en tu navegador.
          </p>

          <div className="mt-9 flex flex-wrap items-center justify-center gap-3">
            {next ? (
              <Link
                to={`/problem/${next.slug}`}
                title={next.title}
                className="max-w-full truncate rounded-full bg-vermilion px-6 py-3 text-[15px] font-medium text-white transition duration-200 hover:brightness-110 active:scale-[0.98] sm:max-w-md"
              >
                Continuar: {next.title}
              </Link>
            ) : (
              <Link
                to="/paths"
                className="rounded-full bg-vermilion px-6 py-3 text-[15px] font-medium text-white transition duration-200 hover:brightness-110 active:scale-[0.98]"
              >
                Empezar una ruta
              </Link>
            )}
            <Link
              to="/interview"
              className="rounded-full px-5 py-3 text-[15px] font-medium text-vermilion transition-colors duration-200 hover:bg-vermilion-dim"
            >
              Simular una entrevista ›
            </Link>
          </div>

          <ul className="mt-8 flex flex-wrap justify-center gap-x-6 gap-y-2 text-[13px] text-ink-500">
            {HIGHLIGHTS.map((h) => (
              <li key={h} className="flex items-center gap-1.5">
                <svg viewBox="0 0 16 16" className="h-3.5 w-3.5 text-jade" aria-hidden>
                  <path d="M3.5 8.5l3 3 6-7" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
                {h}
              </li>
            ))}
          </ul>

          <div className="mt-14 w-full max-w-3xl text-left sm:mt-16">
            <EditorPreview />
          </div>
        </section>

        {/* Today / you */}
        <section className="mt-20 grid gap-4 sm:grid-cols-[1.4fr_1fr]">
          {daily && (
            <Link
              to={`/problem/${daily.slug}`}
              className="group flex flex-col justify-between gap-4 rounded-3xl bg-ink-900 p-6 shadow-card ring-1 ring-ink-700/60 transition-shadow hover:shadow-float"
            >
              <span className="text-[13px] font-medium text-vermilion">Problema del día</span>
              <div>
                <div className="text-2xl font-semibold tracking-[-0.02em] text-ink-100">{daily.title}</div>
                <div className="mt-3 flex items-center gap-3">
                  <SectionBadge section={daily.section} />
                  <DifficultyBadge difficulty={daily.difficulty} />
                  <span className="ml-auto text-[15px] text-vermilion transition-transform group-hover:translate-x-0.5">
                    Resolver ›
                  </span>
                </div>
              </div>
            </Link>
          )}
          <Link
            to="/progress"
            className="flex flex-col justify-between gap-4 rounded-3xl bg-ink-900 p-6 shadow-card ring-1 ring-ink-700/60 transition-shadow hover:shadow-float"
          >
            <span className="text-[13px] font-medium text-ink-400">Tu progreso</span>
            {started ? (
              <div className="flex items-end gap-8">
                <div>
                  <div className="text-4xl font-semibold tracking-[-0.03em] text-ink-100 tabular-nums">{solved}</div>
                  <div className="mt-1 text-[13px] text-ink-500">de {problems.length} resueltos</div>
                </div>
                <div>
                  <div className="text-4xl font-semibold tracking-[-0.03em] text-vermilion tabular-nums">{streak}</div>
                  <div className="mt-1 text-[13px] text-ink-500">{streak === 1 ? 'día de racha' : 'días de racha'}</div>
                </div>
              </div>
            ) : (
              <p className="text-[15px] leading-relaxed text-ink-400">
                Resuelve tu primer problema y aquí verás tu racha, tus temas fuertes y lo que te toca repasar.
              </p>
            )}
          </Link>
        </section>

        {/* Sections */}
        <section className="mt-20">
          <h2 className="text-[28px] font-semibold tracking-[-0.025em] text-ink-100">Elige por dónde empezar.</h2>
          <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
            {SECTIONS.map((id) => {
              const info = SECTION_INFO[id];
              // Criterio also counts the "fix the AI's code" exercises from the code sections.
              const list = id === 'judgment' ? problems.filter(inJudgmentTrack) : problemsIn(id);
              const total = list.length;
              const done = list.filter((p) => statusOf(progress, p.id) === 'solved').length;
              return (
                <Link
                  key={id}
                  to={`/problems/${id}`}
                  className="group flex flex-col rounded-3xl bg-ink-900 p-6 shadow-card ring-1 ring-ink-700/60 transition-[box-shadow,transform] duration-300 hover:-translate-y-0.5 hover:shadow-float"
                >
                  <span className={`h-2.5 w-2.5 rounded-full ${SECTION_BG[id]}`} />
                  <h3 className="mt-4 text-[19px] font-semibold tracking-[-0.015em] text-ink-100">{info.short}</h3>
                  <p className="mt-2 flex-1 text-[14px] leading-relaxed text-ink-400">{info.description}</p>
                  <div className="mt-6">
                    {done > 0 ? (
                      <>
                        <div className="h-1 overflow-hidden rounded-full bg-ink-800">
                          <div className={`h-full rounded-full ${SECTION_BG[id]}`} style={{ width: `${(done / total) * 100}%` }} />
                        </div>
                        <div className="mt-2 text-[12px] text-ink-500 tabular-nums">
                          {done} de {total} resueltos
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
                        <div className={`mt-2 flex items-center justify-between text-[12px] text-ink-500`}>
                          <span className="tabular-nums">
                            {total} {id === 'judgment' ? 'ejercicios' : 'problemas'}
                          </span>
                          <span className={`${SECTION_TEXT[id]} opacity-0 transition-opacity group-hover:opacity-100`}>›</span>
                        </div>
                      </>
                    )}
                  </div>
                </Link>
              );
            })}
          </div>
        </section>

        <footer className="mt-24 flex flex-wrap items-center justify-between gap-3 border-t border-ink-700/60 py-8 text-[12px] text-ink-500">
          <span>Hecho con PGlite, Pyodide y React · {problems.length} problemas originales</span>
          <span>Tu progreso se guarda solo en este navegador.</span>
        </footer>
      </div>
    </div>
  );
}
