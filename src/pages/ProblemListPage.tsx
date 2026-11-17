import { useMemo } from 'react';
import { Link, NavLink, useParams, useSearchParams } from 'react-router';
import { DifficultyBadge, SectionBadge, TopicChip } from '../components/Badges';
import { statusOf, useProgress, type ProblemStatus } from '../lib/progress/store';
import { problems } from '../lib/problems/registry';
import { DIFFICULTIES, SECTIONS, SECTION_INFO, type Section } from '../lib/problems/types';

const STATUS_LABEL: Record<ProblemStatus, string> = {
  todo: 'Sin empezar',
  attempted: 'Intentado',
  solved: 'Resuelto',
};

function StatusIcon({ status }: { status: ProblemStatus }) {
  if (status === 'solved') return <span title="Resuelto" className="text-jade">✓</span>;
  if (status === 'attempted') return <span title="Intentado" className="text-amber">●</span>;
  return <span title="Sin empezar" className="text-ink-600">○</span>;
}

const selectCls =
  'rounded-md border border-ink-700 bg-ink-900 px-2.5 py-1.5 text-xs text-ink-200 outline-none focus:border-ink-500';

export function ProblemListPage() {
  const { section } = useParams();
  const current = SECTIONS.includes(section as Section) ? (section as Section) : null;
  const [params, setParams] = useSearchParams();
  const progress = useProgress();

  const q = params.get('q') ?? '';
  const difficulty = params.get('difficulty') ?? '';
  const topic = params.get('topic') ?? '';
  const status = params.get('status') ?? '';

  const setParam = (key: string, value: string) => {
    const next = new URLSearchParams(params);
    if (value) next.set(key, value);
    else next.delete(key);
    setParams(next, { replace: true });
  };

  const inSection = useMemo(() => (current ? problems.filter((p) => p.section === current) : problems), [current]);
  const topics = useMemo(() => [...new Set(inSection.flatMap((p) => p.topics))].sort(), [inSection]);

  const list = inSection.filter((p) => {
    if (difficulty && p.difficulty !== difficulty) return false;
    if (topic && !p.topics.includes(topic)) return false;
    if (status && statusOf(progress, p.id) !== status) return false;
    if (q) {
      const hay = `${p.title} ${p.company} ${p.topics.join(' ')} ${p.id}`.toLowerCase();
      if (!q.toLowerCase().split(/\s+/).every((w) => hay.includes(w))) return false;
    }
    return true;
  });

  const solved = inSection.filter((p) => statusOf(progress, p.id) === 'solved').length;
  const filtersOn = q || difficulty || topic || status;

  return (
    <div className="mx-auto max-w-6xl px-6 py-8">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <h1 className="text-2xl font-semibold text-ink-100">{current ? SECTION_INFO[current].name : 'Todos los problemas'}</h1>
        <span className="font-mono text-xs text-ink-400">
          <span className="text-jade">{solved}</span>/{inSection.length} resueltos
        </span>
      </div>

      <nav className="mt-5 flex flex-wrap gap-1 border-b border-ink-700 text-sm">
        {[null, ...SECTIONS].map((s) => (
          <NavLink
            key={s ?? 'all'}
            to={{ pathname: s ? `/problems/${s}` : '/problems', search: q ? `?q=${encodeURIComponent(q)}` : '' }}
            end
            className={({ isActive }) =>
              `-mb-px border-b-2 px-3 py-2 ${isActive ? 'border-vermilion text-ink-100' : 'border-transparent text-ink-400 hover:text-ink-200'}`
            }
          >
            {s ? SECTION_INFO[s].short : 'Todas'}
            <span className="ml-1.5 font-mono text-[11px] text-ink-500">
              {s ? problems.filter((p) => p.section === s).length : problems.length}
            </span>
          </NavLink>
        ))}
      </nav>

      <div className="mt-4 flex flex-wrap items-center gap-2">
        <input
          value={q}
          onChange={(e) => setParam('q', e.target.value)}
          placeholder="Buscar por título, tema o empresa…"
          className="w-72 rounded-md border border-ink-700 bg-ink-900 px-3 py-1.5 text-sm text-ink-100 outline-none placeholder:text-ink-500 focus:border-ink-500"
        />
        <select value={difficulty} onChange={(e) => setParam('difficulty', e.target.value)} className={selectCls}>
          <option value="">Dificultad</option>
          {DIFFICULTIES.map((d) => (
            <option key={d} value={d}>
              {d}
            </option>
          ))}
        </select>
        <select value={topic} onChange={(e) => setParam('topic', e.target.value)} className={selectCls}>
          <option value="">Tema</option>
          {topics.map((t) => (
            <option key={t} value={t}>
              {t}
            </option>
          ))}
        </select>
        <select value={status} onChange={(e) => setParam('status', e.target.value)} className={selectCls}>
          <option value="">Estado</option>
          {(Object.keys(STATUS_LABEL) as ProblemStatus[]).map((s) => (
            <option key={s} value={s}>
              {STATUS_LABEL[s]}
            </option>
          ))}
        </select>
        {filtersOn && (
          <button onClick={() => setParams({}, { replace: true })} className="px-2 text-xs text-ink-400 hover:text-vermilion">
            Limpiar filtros
          </button>
        )}
        <span className="ml-auto font-mono text-[11px] text-ink-500">{list.length} problema(s)</span>
      </div>

      <div className="mt-4 overflow-hidden rounded-lg border border-ink-700">
        <table className="w-full text-sm">
          <thead className="bg-ink-900 text-left text-xs text-ink-400">
            <tr>
              <th className="w-10 px-4 py-2 font-medium" aria-label="Estado" />
              <th className="px-2 py-2 font-medium">Título</th>
              {!current && <th className="px-4 py-2 font-medium">Sección</th>}
              <th className="px-4 py-2 font-medium">Dificultad</th>
              <th className="px-4 py-2 font-medium">Temas</th>
              <th className="px-4 py-2 font-medium">Empresa</th>
            </tr>
          </thead>
          <tbody>
            {list.map((p) => (
              <tr key={p.id} className="border-t border-ink-800 hover:bg-ink-900">
                <td className="px-4 py-2.5 text-center font-mono">
                  <StatusIcon status={statusOf(progress, p.id)} />
                </td>
                <td className="px-2 py-2.5">
                  <Link to={`/problem/${p.slug}`} className="text-ink-100 hover:text-vermilion">
                    {p.title}
                  </Link>
                </td>
                {!current && (
                  <td className="px-4 py-2.5">
                    <SectionBadge section={p.section} />
                  </td>
                )}
                <td className="px-4 py-2.5">
                  <DifficultyBadge difficulty={p.difficulty} />
                </td>
                <td className="px-4 py-2.5">
                  <div className="flex flex-wrap gap-1">
                    {p.topics.map((t) => (
                      <button key={t} onClick={() => setParam('topic', t)} title={`Filtrar por ${t}`}>
                        <TopicChip topic={t} />
                      </button>
                    ))}
                  </div>
                </td>
                <td className="px-4 py-2.5 text-ink-400">{p.company}</td>
              </tr>
            ))}
            {list.length === 0 && (
              <tr>
                <td colSpan={6} className="px-4 py-8 text-center text-sm text-ink-500">
                  Ningún problema coincide con los filtros.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
