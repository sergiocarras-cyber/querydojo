import { useParams } from 'react-router';
import { ProblemSolver } from '../components/problem/ProblemSolver';
import { getProblem } from '../lib/problems/registry';
import { NotFoundPage } from './NotFoundPage';

export function ProblemPage() {
  const { slug = '' } = useParams();
  const problem = getProblem(slug);
  if (!problem) return <NotFoundPage />;
  return <ProblemSolver key={problem.id} problem={problem} />;
}
