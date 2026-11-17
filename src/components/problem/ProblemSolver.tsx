import { useDraft } from '../../hooks/useDraft';
import type { CodeProblem, Problem, StatsProblem } from '../../lib/problems/types';
import { SplitPane } from '../SplitPane';
import { ProblemDescription, type DescriptionTab } from './ProblemDescription';
import { PythonWorkspace } from './PythonWorkspace';
import { SqlWorkspace } from './SqlWorkspace';
import { StatsWorkspace } from './StatsWorkspace';

interface Props {
  problem: Problem;
  /** Draft namespace (interview sessions get their own, see useDraft). */
  scope?: string;
  /** Interview mode: statement only, no hints, solution or past submissions. */
  interview?: boolean;
}

const INTERVIEW_TABS: DescriptionTab[] = ['statement'];

/** Statement on the left, editor or answer box on the right. */
export function ProblemSolver(props: Props) {
  return props.problem.section === 'stats' ? (
    <StatsSolver {...props} problem={props.problem} />
  ) : (
    <CodeSolver {...props} problem={props.problem} />
  );
}

function CodeSolver({ problem, scope = '', interview = false }: Props & { problem: CodeProblem }) {
  // The draft lives here so "Mis envíos" can load an old submission into the editor.
  const draft = useDraft(problem.id, problem.starter, scope);
  const workspace =
    problem.section === 'sql' ? (
      <SqlWorkspace problem={problem} draft={draft} />
    ) : (
      <PythonWorkspace problem={problem} draft={draft} />
    );
  return (
    <SplitPane
      storageKey="problem"
      initial={42}
      min={25}
      max={70}
      left={
        <ProblemDescription
          problem={problem}
          onLoadCode={interview ? undefined : draft.setCode}
          tabs={interview ? INTERVIEW_TABS : undefined}
        />
      }
      right={workspace}
    />
  );
}

function StatsSolver({ problem, scope = '', interview = false }: Props & { problem: StatsProblem }) {
  return (
    <SplitPane
      storageKey="problem"
      initial={42}
      min={25}
      max={70}
      left={<ProblemDescription problem={problem} tabs={interview ? INTERVIEW_TABS : undefined} />}
      right={<StatsWorkspace problem={problem} scope={scope} interview={interview} />}
    />
  );
}
