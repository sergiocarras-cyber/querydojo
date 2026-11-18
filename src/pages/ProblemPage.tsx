import { use } from 'react';
import { useParams } from 'react-router';
import { ProblemSolver } from '../components/problem/ProblemSolver';
import { loadProblem } from '../lib/problems/content';
import { getProblemMeta } from '../lib/problems/registry';
import { NotFoundPage } from './NotFoundPage';
import { useTitle } from '../hooks/useTitle';

export function ProblemPage() {
  const { slug = '' } = useParams();
  const meta = getProblemMeta(slug);
  useTitle(meta?.title ?? 'No encontrado');
  if (!meta) return <NotFoundPage />;
  return <LoadedProblem key={meta.id} id={meta.id} />;
}

function LoadedProblem({ id }: { id: string }) {
  // Suspends (Layout shows "cargando…") until this section's content chunk arrives.
  const problem = use(loadProblem(id));
  if (!problem) return <NotFoundPage />;
  return <ProblemSolver problem={problem} />;
}
