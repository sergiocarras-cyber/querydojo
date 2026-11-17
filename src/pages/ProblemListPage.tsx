import { Link, useParams } from 'react-router';
import { DifficultyBadge, SectionBadge, TopicChip } from '../components/Badges';
import { problems } from '../lib/problems/registry';
import { SECTIONS, SECTION_INFO, type Section } from '../lib/problems/types';

// Filters, search and status arrive in phase 2; this is the bare list.
export function ProblemListPage() {
  const { section } = useParams();
  const current = SECTIONS.includes(section as Section) ? (section as Section) : null;
  const list = current ? problems.filter((p) => p.section === current) : problems;

  return (
    <div className="mx-auto max-w-6xl px-6 py-10">
      <h1 className="text-2xl font-semibold text-ink-100">{current ? SECTION_INFO[current].name : 'Todos los problemas'}</h1>
      <div className="mt-6 overflow-hidden rounded-lg border border-ink-700">
        <table className="w-full text-sm">
          <thead className="bg-ink-900 text-left text-xs text-ink-400">
            <tr>
              <th className="px-4 py-2 font-medium">Título</th>
              <th className="px-4 py-2 font-medium">Sección</th>
              <th className="px-4 py-2 font-medium">Dificultad</th>
              <th className="px-4 py-2 font-medium">Temas</th>
              <th className="px-4 py-2 font-medium">Empresa</th>
            </tr>
          </thead>
          <tbody>
            {list.map((p) => (
              <tr key={p.id} className="border-t border-ink-800 hover:bg-ink-900">
                <td className="px-4 py-2.5">
                  <Link to={`/problem/${p.slug}`} className="text-ink-100 hover:text-vermilion">
                    {p.title}
                  </Link>
                </td>
                <td className="px-4 py-2.5">
                  <SectionBadge section={p.section} />
                </td>
                <td className="px-4 py-2.5">
                  <DifficultyBadge difficulty={p.difficulty} />
                </td>
                <td className="px-4 py-2.5">
                  <div className="flex flex-wrap gap-1">
                    {p.topics.map((t) => (
                      <TopicChip key={t} topic={t} />
                    ))}
                  </div>
                </td>
                <td className="px-4 py-2.5 text-ink-400">{p.company}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
