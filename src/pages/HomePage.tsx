import { Link } from 'react-router';
import { DifficultyBadge, SECTION_BG, SECTION_TEXT, SectionBadge } from '../components/Badges';
import { problemOfTheDay } from '../lib/daily';
import { statusOf, useProgress } from '../lib/progress/store';
import { problems, problemsIn } from '../lib/problems/registry';
import { SECTIONS, SECTION_INFO } from '../lib/problems/types';

export function HomePage() {
  const daily = problemOfTheDay(problems);
  const progress = useProgress();

  return (
    <div className="dojo-grid min-h-full">
      <div className="mx-auto max-w-6xl px-6 py-12">
        <section className="flex flex-wrap items-end justify-between gap-6">
          <div>
            <p className="font-mono text-xs tracking-widest text-vermilion uppercase">
              $ querydojo --train
            </p>
            <h1 className="mt-2 text-3xl font-semibold text-ink-100">Entrena para la entrevista técnica.</h1>
            <p className="mt-2 max-w-xl text-ink-400">
              SQL, algoritmos, pandas y probabilidad. Todo se ejecuta en tu navegador; tu progreso se
              queda en este equipo.
            </p>
          </div>
          {daily && (
            <Link
              to={`/problem/${daily.slug}`}
              className="group rounded-lg border border-vermilion/40 bg-vermilion-dim px-4 py-3 transition-colors hover:border-vermilion"
            >
              <div className="font-mono text-[11px] tracking-wider text-vermilion uppercase">Problema del día</div>
              <div className="mt-1 flex items-center gap-2 text-ink-100">
                {daily.title}
                <span className="transition-transform group-hover:translate-x-0.5">→</span>
              </div>
              <div className="mt-1.5 flex items-center gap-3">
                <SectionBadge section={daily.section} />
                <DifficultyBadge difficulty={daily.difficulty} />
              </div>
            </Link>
          )}
        </section>

        <section className="mt-10 grid gap-4 sm:grid-cols-2">
          {SECTIONS.map((id) => {
            const info = SECTION_INFO[id];
            const list = problemsIn(id);
            const total = list.length;
            const solved = list.filter((p) => statusOf(progress, p.id) === 'solved').length;
            const pct = total ? Math.round((solved / total) * 100) : 0;
            return (
              <Link
                key={id}
                to={`/problems/${id}`}
                className="group rounded-xl border border-ink-700 bg-ink-900/90 p-5 transition-colors hover:border-ink-500"
              >
                <div className="flex items-center justify-between">
                  <h2 className={`font-mono text-lg font-semibold ${SECTION_TEXT[id]}`}>{info.name}</h2>
                  <span className="font-mono text-xs text-ink-500">
                    {solved}/{total}
                  </span>
                </div>
                <p className="mt-1.5 text-sm text-ink-400">{info.description}</p>
                <div className="mt-4 h-1.5 overflow-hidden rounded-full bg-ink-800">
                  <div className={`h-full ${SECTION_BG[id]}`} style={{ width: `${pct}%` }} />
                </div>
                <div className="mt-2 font-mono text-[11px] text-ink-500">
                  {total === 0 ? 'Próximamente' : `${pct}% resuelto`}
                </div>
              </Link>
            );
          })}
        </section>
      </div>
    </div>
  );
}
