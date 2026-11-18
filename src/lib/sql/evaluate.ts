import type { SqlProblem } from '../problems/types';
import type { ResultSet } from './engine';
import { caseScore, compareResults, resultFingerprint, type Verdict } from './grade';
import type { JobResults, SqlJob } from './protocol';

/** Anything that can run jobs: the browser worker client or PGlite in Node. */
export type JobRunner = (schema: string, jobs: SqlJob[]) => Promise<JobResults[]>;

export type CaseOutcome =
  | {
      index: number;
      hidden: boolean;
      kind: 'compared';
      verdict: Verdict;
      expected: ResultSet;
      actual: ResultSet | null;
      ms: number;
    }
  | { index: number; hidden: boolean; kind: 'error'; error: string; ms: number };

export type SqlStatus = 'accepted' | 'wrong' | 'error';

export interface SqlEvaluation {
  mode: 'run' | 'submit';
  cases: CaseOutcome[];
  passed: number;
  total: number;
  status: SqlStatus;
  ms: number;
  /** Average partial credit over datasets, 0..1. */
  score: number;
  /** One token per dataset: ok | err | none | out:<hash>. */
  fingerprint: string[];
}

/**
 * Run: only the visible dataset. Submit: visible + every hidden dataset.
 * For each dataset the official solution runs first, then the user's query.
 */
export async function evaluateSql(
  problem: SqlProblem,
  query: string,
  mode: 'run' | 'submit',
  run: JobRunner,
): Promise<SqlEvaluation> {
  const datasets = mode === 'run' ? [problem.data] : [problem.data, ...problem.hiddenData];
  const jobs = datasets.map((data) => ({ data, queries: [problem.solution, query] }));
  const results = await run(problem.schema, jobs);

  const cases: CaseOutcome[] = results.map(([reference, user], index) => {
    const hidden = index > 0;
    if (!reference.ok) {
      // Should never happen: every official solution is tested.
      return { index, hidden, kind: 'error', error: `Error en la solución oficial: ${reference.error}`, ms: 0 };
    }
    if (!user.ok) return { index, hidden, kind: 'error', error: user.error, ms: user.ms };
    return {
      index,
      hidden,
      kind: 'compared',
      verdict: compareResults(reference.result!, user.result, problem.orderMatters),
      expected: reference.result!,
      actual: user.result,
      ms: user.ms,
    };
  });

  const passed = cases.filter((c) => c.kind === 'compared' && c.verdict.pass).length;
  const status: SqlStatus = cases.some((c) => c.kind === 'error')
    ? 'error'
    : passed === cases.length
      ? 'accepted'
      : 'wrong';
  const scores = cases.map((c) => (c.kind === 'compared' ? caseScore(c.verdict, c.expected, c.actual) : 0));
  const fingerprint = cases.map((c) =>
    c.kind === 'error' ? 'err' : c.verdict.pass ? 'ok' : resultFingerprint(c.actual, problem.orderMatters),
  );
  return {
    mode,
    cases,
    passed,
    total: cases.length,
    status,
    ms: cases.reduce((t, c) => t + c.ms, 0),
    score: scores.reduce((a, b) => a + b, 0) / Math.max(1, scores.length),
    fingerprint,
  };
}
