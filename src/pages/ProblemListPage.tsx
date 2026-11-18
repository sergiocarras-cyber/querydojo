import { useMemo } from 'react';
import { Link, NavLink, useParams, useSearchParams } from 'react-router';
import { AiReviewChip, DifficultyBadge, IndustryChip, STATUS_LABEL, SectionBadge, StatusIcon, TopicChip } from '../components/Badges';
import { statusOf, useProgress, type ProblemStatus } from '../lib/progress/store';
import { problems } from '../lib/problems/registry';
import {
  DIFFICULTIES,
  INDUSTRIES,
  INDUSTRY_INFO,
  SECTIONS,
  SECTION_INFO,
  inJudgmentTrack,
  type ProblemMeta,
  type Section,
} from '../lib/problems/types';

/** Criterio also lists the "fix the AI's code" exercises from the code sections. */
function inTab(p: ProblemMeta, section: Section | null): boolean {
  if (!section) return true;
  return section === 'judgment' ? inJudgmentTrack(p) : p.section === section;
}
import { useTitle } from '../hooks/useTitle';

const selectCls =
  'rounded-md border border-ink-700 bg-ink-900 px-2.5 py-1.5 text-xs text-ink-200 outline-none focus:border-ink-500';

export function ProblemListPage() {
  const { section } = useParams();
  const current = SECTIONS.includes(section as Section) ? (section as Section) : null;
  const [params, setParams] = useSearchParams();
  const progress = useProgress();

  useTitle(current ? SECTION_INFO[current].name : 'Problemas');
  const q = params.get('q') ?? '';
  const difficulty = params.get('difficulty') ?? '';
  const topic = params.get('topic') ?? '';
  const status = params.get('status') ?? '';
  const industry = params.get('industry') ?? '';

  const setParam = (key: string, value: string) => {
    const next = new URLSearchParams(params);
    if (value) next.set(key, value);
    else next.delete(key);
    setParams(next, { replace: true });
  };

  const inSection = useMemo(() => problems.filter((p) => inTab(p, current)), [current]);
  const industries = INDUSTRIES.filter((i) => inSection.some((p) => p.industry === i));
  const topics = useMemo(() => [...new Set(inSection.flatMap((p) => p.topics))].sort(), [inSection]);

  const list = inSection.filter((p) => {
    if (difficulty && p.difficulty !== difficulty) return false;
    if (topic && !p.topics.includes(topic)) return false;
    if (status && statusOf(progress, p.id) !== status) return false;
    if (industry && p.industry !== industry) return false;
    if (q) {
      const hay = `${p.title} ${p.company} ${INDUSTRY_INFO[p.industry].name} ${p.topics.join(' ')} ${p.id}`.toLowerCase();
      if (!q.toLowerCase().split(/\s+/).every((w) => hay.includes(w))) return false;
    }
    return true;
  });

  const solved = inSection.filter((p) => statusOf(progress, p.id) === 'solved').length;
  const filtersOn = q || difficulty || topic || status || industry;
  const showSection = !current || current === 'judgment';

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
              {problems.filter((p) => inTab(p, s)).length}
            </span>
          </NavLink>
        ))}
      </nav>

      {current === 'judgment' && (
        <p className="mt-4 max-w-3xl text-sm text-ink-400">
          La IA ya escribe consultas y funciones en segundos. Lo que se valora es el criterio: detectar el fallo en
          código que parece correcto, elegir bien las métricas, modelar los datos y saber por qué algo va lento.
          Los ejercicios <span className="text-amber">Revisión IA</span> parten de código escrito por una IA que
          tiene un fallo sutil.
        </p>
      )}

      <div className="mt-4 flex flex-wrap items-center gap-2">
        <input
          value={q}
          onChange={(e) => setParam('q', e.target.value)}
          placeholder="Buscar por título, tema, empresa o sector…"
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
        <select value={industry} onChange={(e) => setParam('industry', e.target.value)} className={selectCls}>
          <option value="">Sector</option>
          {industries.map((i) => (
            <option key={i} value={i}>
              {INDUSTRY_INFO[i].name}
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
              {showSection && <th className="px-4 py-2 font-medium">Sección</th>}
              <th className="px-4 py-2 font-medium">Dificultad</th>
              <th className="px-4 py-2 font-medium">Temas</th>
              <th className="px-4 py-2 font-medium">Sector</th>
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
                  {p.aiReview && (
                    <span className="ml-2">
                      <AiReviewChip />
                    </span>
                  )}
                </td>
                {showSection && (
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
                <td className="px-4 py-2.5">
                  <button onClick={() => setParam('industry', p.industry)} title={`Filtrar por sector · ${p.company}`}>
                    <IndustryChip industry={p.industry} />
                  </button>
                </td>
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
