import { Link, useParams } from 'react-router';
import { DifficultyBadge, SECTION_BG, SECTION_TEXT, SectionBadge, StatusIcon } from '../components/Badges';
import { STUDY_PATHS, getPath, pathProblemIds, type StudyPath } from '../lib/paths';
import { statusOf, useProgress, type ProgressData } from '../lib/progress/store';
import { getProblemById } from '../lib/problems/registry';
import { NotFoundPage } from './NotFoundPage';
import { useTitle } from '../hooks/useTitle';

function pathProgress(path: StudyPath, progress: ProgressData) {
  const ids = pathProblemIds(path);
  const solved = ids.filter((id) => statusOf(progress, id) === 'solved').length;
  const next = ids.find((id) => statusOf(progress, id) !== 'solved');
  return { total: ids.length, solved, next: next ? getProblemById(next) : undefined };
}

export function PathsPage() {
  useTitle('Rutas de estudio');
  const progress = useProgress();
  return (
    <div className="mx-auto max-w-6xl px-6 py-8">
      <h1 className="text-2xl font-semibold text-ink-100">Rutas de estudio</h1>
      <p className="mt-1 text-sm text-ink-400">
        Recorridos ordenados por tema: de lo básico a lo que suele caer en la última ronda.
      </p>
      <div className="mt-6 grid gap-4 md:grid-cols-2">
        {STUDY_PATHS.map((path) => {
          const { total, solved, next } = pathProgress(path, progress);
          return (
            <Link
              key={path.id}
              to={`/paths/${path.id}`}
              className="group flex flex-col rounded-xl border border-ink-700 bg-ink-900 p-5 transition-colors hover:border-ink-500"
            >
              <div className="flex items-center justify-between">
                <SectionBadge section={path.section} />
                <span className="font-mono text-xs text-ink-500">
                  {solved}/{total}
                </span>
              </div>
              <h2 className="mt-2 text-lg font-semibold text-ink-100">{path.title}</h2>
              <p className="mt-1 text-sm text-ink-400">{path.description}</p>
              <ol className="mt-3 flex flex-wrap gap-x-1.5 gap-y-1 font-mono text-[11px] text-ink-500">
                {path.steps.map((s, i) => (
                  <li key={s.title}>
                    {i > 0 && <span className="mr-1.5 text-ink-700">→</span>}
                    {s.title}
                  </li>
                ))}
              </ol>
              <div className="mt-4 h-1.5 overflow-hidden rounded-full bg-ink-800">
                <div className={`h-full ${SECTION_BG[path.section]}`} style={{ width: `${(solved / total) * 100}%` }} />
              </div>
              <div className="mt-2 text-xs text-ink-400">
                {next ? (
                  <>
                    Siguiente: <span className="text-ink-200">{next.title}</span>
                  </>
                ) : (
                  <span className="text-jade">✓ Ruta completada</span>
                )}
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}

export function PathDetailPage() {
  const { pathId = '' } = useParams();
  const path = getPath(pathId);
  const progress = useProgress();
  useTitle(path?.title ?? 'No encontrado');
  if (!path) return <NotFoundPage />;
  const { total, solved, next } = pathProgress(path, progress);

  return (
    <div className="mx-auto max-w-4xl px-6 py-8">
      <Link to="/paths" className="text-xs text-ink-400 hover:text-ink-100">
        ← Rutas
      </Link>
      <div className="mt-3 flex flex-wrap items-end justify-between gap-4">
        <div>
          <SectionBadge section={path.section} />
          <h1 className="mt-1 text-2xl font-semibold text-ink-100">{path.title}</h1>
          <p className="mt-1 max-w-2xl text-sm text-ink-400">{path.description}</p>
        </div>
        {next && (
          <Link
            to={`/problem/${next.slug}`}
            className="rounded-md bg-vermilion px-4 py-2 text-sm font-semibold text-ink-950 hover:brightness-110"
          >
            {solved === 0 ? 'Empezar' : 'Continuar'} →
          </Link>
        )}
      </div>
      <div className="mt-4 flex items-center gap-3">
        <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-ink-800">
          <div className={`h-full ${SECTION_BG[path.section]}`} style={{ width: `${(solved / total) * 100}%` }} />
        </div>
        <span className="font-mono text-xs text-ink-400">
          {solved}/{total}
        </span>
      </div>

      <ol className="mt-8 space-y-6">
        {path.steps.map((step, i) => {
          const stepSolved = step.problems.filter((id) => statusOf(progress, id) === 'solved').length;
          const done = stepSolved === step.problems.length;
          return (
            <li key={step.title} className="relative pl-10">
              <span
                className={`absolute top-0 left-0 flex h-7 w-7 items-center justify-center rounded-full border font-mono text-xs ${
                  done ? `border-transparent ${SECTION_BG[path.section]} text-ink-950` : `border-ink-600 ${SECTION_TEXT[path.section]}`
                }`}
              >
                {done ? '✓' : i + 1}
              </span>
              {i < path.steps.length - 1 && <span className="absolute top-8 bottom-[-20px] left-3.5 w-px bg-ink-700" />}
              <div className="flex items-baseline justify-between gap-3">
                <h2 className="font-semibold text-ink-100">{step.title}</h2>
                <span className="font-mono text-[11px] text-ink-500">
                  {stepSolved}/{step.problems.length}
                </span>
              </div>
              <p className="text-sm text-ink-400">{step.summary}</p>
              <ul className="mt-2 divide-y divide-ink-800 rounded-lg border border-ink-700 bg-ink-900">
                {step.problems.map((id) => {
                  const p = getProblemById(id);
                  if (!p) return null;
                  const st = statusOf(progress, id);
                  const isNext = next?.id === id;
                  return (
                    <li key={id}>
                      <Link
                        to={`/problem/${p.slug}`}
                        className={`flex items-center gap-3 px-3 py-2 text-sm hover:bg-ink-850 ${isNext ? 'bg-vermilion-dim' : ''}`}
                      >
                        <span className="w-4 text-center">
                          <StatusIcon status={st} />
                        </span>
                        <span className="text-ink-100">{p.title}</span>
                        {isNext && <span className="font-mono text-[10px] text-vermilion uppercase">siguiente</span>}
                        <span className="ml-auto">
                          <DifficultyBadge difficulty={p.difficulty} />
                        </span>
                      </Link>
                    </li>
                  );
                })}
              </ul>
            </li>
          );
        })}
      </ol>
    </div>
  );
}
