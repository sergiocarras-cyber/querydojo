import type { HarnessFn } from './pyProtocol';
import type { AlgorithmsProblem, PandasProblem } from '../problems/types';

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
  /** pandas only */
  expected_table?: PyTable;
  got_table?: PyTable;
  message?: string;
}

/** A DataFrame rendered by harness._df_table. */
export interface PyTable {
  columns: string[];
  dtypes: string[];
  rows: (string | number | boolean | null)[][];
  total_rows: number;
  index_named: boolean;
}

export interface PyRunOutput {
  status: 'ok' | 'error';
  error?: string;
  setup_stdout?: string;
  cases: PyCaseResult[];
  passed: number;
  total: number;
}

/** Calls a harness.py function somewhere (browser worker or Node) and returns its JSON. */
export type PyRunner = (fn: HarnessFn, args: string[], packages: string[]) => Promise<string>;

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
  const raw = await run('run_suite', [code, buildSpec(problem, mode)], []);
  const output = JSON.parse(raw) as PyRunOutput;
  return { mode, status: statusOf(output), output };
}

export const PANDAS_PACKAGES = ['pandas'];

export function buildPandasSpec(problem: PandasProblem, mode: 'run' | 'submit'): string {
  return JSON.stringify({
    mode,
    function: problem.function,
    order_matters: problem.orderMatters,
    check_dtype: problem.checkDtype,
    tolerance: problem.tolerance,
    reference_code: problem.solution,
    data_code: problem.dataCode,
    hidden_data_code: mode === 'submit' ? problem.hiddenDataCode : null,
  });
}

export async function evaluatePandas(
  problem: PandasProblem,
  code: string,
  mode: 'run' | 'submit',
  run: PyRunner,
): Promise<PyEvaluation> {
  const raw = await run('run_pandas_suite', [code, buildPandasSpec(problem, mode)], PANDAS_PACKAGES);
  const output = JSON.parse(raw) as PyRunOutput;
  return { mode, status: statusOf(output), output };
}

/** Grades a Python-based problem (algorithms or pandas). */
export function evaluateCode(
  problem: AlgorithmsProblem | PandasProblem,
  code: string,
  mode: 'run' | 'submit',
  run: PyRunner,
): Promise<PyEvaluation> {
  return problem.section === 'pandas'
    ? evaluatePandas(problem, code, mode, run)
    : evaluatePython(problem, code, mode, run);
}
