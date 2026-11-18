import { useMemo } from 'react';
import { Link, NavLink, useParams, useSearchParams } from 'react-router';
import { SegmentedTrack, segmentClass } from '../components/Segmented';
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
  'rounded-full border-0 bg-ink-800 px-3.5 py-1.5 text-[13px] text-ink-200 outline-none transition-colors hover:bg-ink-700 focus:ring-2 focus:ring-vermilion/40';

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
    <div className="mx-auto max-w-[1080px] px-6 py-12">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <h1 className="text-[34px] leading-tight font-semibold tracking-[-0.03em] text-ink-100">
          {current ? SECTION_INFO[current].name : 'Problemas'}
        </h1>
        <span className="pb-1.5 text-[13px] text-ink-500 tabular-nums">
          <span className="font-medium text-ink-100">{solved}</span> de {inSection.length} resueltos
        </span>
      </div>

      <div className="mt-6 overflow-x-auto [scrollbar-width:none]">
        <SegmentedTrack>
          {[null, ...SECTIONS].map((s) => (
            <NavLink
              key={s ?? 'all'}
              to={{ pathname: s ? `/problems/${s}` : '/problems', search: q ? `?q=${encodeURIComponent(q)}` : '' }}
              end
              className={({ isActive }) => segmentClass(isActive)}
            >
              {s ? SECTION_INFO[s].short : 'Todas'}
              <span className="ml-1.5 text-[11px] font-normal text-ink-500 tabular-nums">
                {problems.filter((p) => inTab(p, s)).length}
              </span>
            </NavLink>
          ))}
        </SegmentedTrack>
      </div>

      {current === 'judgment' && (
        <p className="mt-5 max-w-3xl text-[15px] leading-relaxed text-ink-400">
          La IA ya escribe consultas y funciones en segundos. Lo que se valora es el criterio: detectar el fallo en
          código que parece correcto, elegir bien las métricas, modelar los datos y saber por qué algo va lento.
          Los ejercicios <span className="text-amber">Revisión IA</span> parten de código escrito por una IA que
          tiene un fallo sutil.
        </p>
      )}

      <div className="mt-5 flex flex-wrap items-center gap-2">
        <input
          value={q}
          onChange={(e) => setParam('q', e.target.value)}
          placeholder="Buscar por título, tema, empresa o sector…"
          className="w-72 rounded-full border-0 bg-ink-800 px-4 py-1.5 text-[13px] text-ink-100 outline-none placeholder:text-ink-500 transition-shadow focus:ring-2 focus:ring-vermilion/40"
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
          <button onClick={() => setParams({}, { replace: true })} className="px-2 text-[13px] text-vermilion hover:underline">
            Limpiar filtros
          </button>
        )}
        <span className="ml-auto text-[12px] text-ink-500 tabular-nums">
          {list.length} {list.length === 1 ? 'problema' : 'problemas'}
        </span>
      </div>

      <div className="mt-4 overflow-hidden rounded-2xl border border-ink-700/70 shadow-card bg-ink-900">
        <table className="w-full text-sm">
          <thead className="text-left text-[12px] text-ink-500">
            <tr>
              <th className="w-12 px-4 py-3 font-medium" aria-label="Estado" />
              <th className="px-2 py-3 font-medium">Título</th>
              {showSection && <th className="px-4 py-3 font-medium">Sección</th>}
              <th className="px-4 py-3 font-medium">Dificultad</th>
              <th className="px-4 py-3 font-medium">Temas</th>
              <th className="px-4 py-3 font-medium">Sector</th>
            </tr>
          </thead>
          <tbody>
            {list.map((p) => (
              <tr key={p.id} className="border-t border-ink-700/60 transition-colors hover:bg-ink-850">
                <td className="px-4 py-3 text-center text-[11px]">
                  <StatusIcon status={statusOf(progress, p.id)} />
                </td>
                <td className="px-2 py-3">
                  <Link to={`/problem/${p.slug}`} className="font-medium text-ink-100 transition-colors hover:text-vermilion">
                    {p.title}
                  </Link>
                  {p.aiReview && (
                    <span className="ml-2">
                      <AiReviewChip />
                    </span>
                  )}
                </td>
                {showSection && (
                  <td className="px-4 py-3">
                    <SectionBadge section={p.section} />
                  </td>
                )}
                <td className="px-4 py-3">
                  <DifficultyBadge difficulty={p.difficulty} />
                </td>
                <td className="px-4 py-3">
                  <div className="flex flex-wrap items-center gap-1">
                    {p.topics.slice(0, 2).map((t) => (
                      <button key={t} onClick={() => setParam('topic', t)} title={`Filtrar por ${t}`}>
                        <TopicChip topic={t} />
                      </button>
                    ))}
                    {p.topics.length > 2 && (
                      <span className="text-[11px] text-ink-500" title={p.topics.slice(2).join(', ')}>
                        +{p.topics.length - 2}
                      </span>
                    )}
                  </div>
                </td>
                <td className="px-4 py-3">
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
