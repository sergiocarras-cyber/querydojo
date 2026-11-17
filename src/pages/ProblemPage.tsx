import { useParams } from 'react-router';
import { ProblemDescription } from '../components/problem/ProblemDescription';
import { SqlWorkspace } from '../components/problem/SqlWorkspace';
import { SplitPane } from '../components/SplitPane';
import { useDraft } from '../hooks/useDraft';
import { getProblem } from '../lib/problems/registry';
import type { Problem } from '../lib/problems/types';
import { NotFoundPage } from './NotFoundPage';

export function ProblemPage() {
  const { slug = '' } = useParams();
  const problem = getProblem(slug);
  if (!problem) return <NotFoundPage />;
  return <ProblemView key={problem.id} problem={problem} />;
}

function ProblemView({ problem }: { problem: Problem }) {
  // The draft lives here so "Mis envíos" can load an old submission into the editor.
  const draft = useDraft(problem.id, problem.starter);
  return (
    <SplitPane
      storageKey="problem"
      initial={42}
      min={25}
      max={70}
      left={<ProblemDescription problem={problem} onLoadCode={draft.setCode} />}
      right={<SqlWorkspace problem={problem} draft={draft} />}
    />
  );
}
