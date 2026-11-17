import type { AlgorithmsProblem } from '../problems/types';

/** One test case as reported by harness.py. */
export interface PyCaseResult {
  index: number;
  hidden: boolean;
  input: string;
  expected: string;
  got?: string;
  stdout?: string;
  error?: string;
  ms?: number;
  passed: boolean;
  tle?: boolean;
}

export interface PyRunOutput {
  status: 'ok' | 'error';
  error?: string;
  setup_stdout?: string;
  cases: PyCaseResult[];
  passed: number;
  total: number;
}

/** Runs harness.run_suite(code, spec) somewhere (browser worker or Node). */
export type PyRunner = (code: string, specJson: string, packages: string[]) => Promise<string>;

export type PyStatus = 'accepted' | 'wrong' | 'error' | 'timeout';

export interface PyEvaluation {
  mode: 'run' | 'submit';
  status: PyStatus;
  output: PyRunOutput;
}

export function buildSpec(problem: AlgorithmsProblem, mode: 'run' | 'submit'): string {
  const visible = problem.tests.map((t) => ({ ...t, hidden: false }));
  const hidden = mode === 'submit' ? problem.hiddenTests.map((t) => ({ ...t, hidden: true })) : [];
  return JSON.stringify({
    mode,
    function: problem.function,
    comparator: problem.comparator,
    tolerance: problem.tolerance,
    arg_types: problem.argTypes,
    return_type: problem.returnType,
    time_limit_ms: problem.timeLimitMs,
    cases: [...visible, ...hidden],
    reference_code: problem.solution,
    generator_code: mode === 'submit' ? problem.generator : null,
    checker_code: problem.checker,
  });
}

export function statusOf(output: PyRunOutput): PyStatus {
  if (output.status === 'error') return 'error';
  const failed = output.cases.find((c) => !c.passed);
  if (!failed) return output.passed === output.total ? 'accepted' : 'wrong';
  if (failed.tle) return 'timeout';
  if (failed.error) return 'error';
  return 'wrong';
}

export async function evaluatePython(
  problem: AlgorithmsProblem,
  code: string,
  mode: 'run' | 'submit',
  run: PyRunner,
): Promise<PyEvaluation> {
  const raw = await run(code, buildSpec(problem, mode), []);
  const output = JSON.parse(raw) as PyRunOutput;
  return { mode, status: statusOf(output), output };
}
