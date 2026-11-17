import { useParams } from 'react-router';
import { ProblemDescription } from '../components/problem/ProblemDescription';
import { SqlWorkspace } from '../components/problem/SqlWorkspace';
import { SplitPane } from '../components/SplitPane';
import { getProblem } from '../lib/problems/registry';
import { NotFoundPage } from './NotFoundPage';

export function ProblemPage() {
  const { slug = '' } = useParams();
  const problem = getProblem(slug);
  if (!problem) return <NotFoundPage />;

  return (
    <SplitPane
      key={problem.id}
      storageKey="problem"
      initial={42}
      min={25}
      max={70}
      left={<ProblemDescription problem={problem} />}
      right={<SqlWorkspace problem={problem} />}
    />
  );
}
