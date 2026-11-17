import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { PyCrashError, PyTimeoutError } from '../src/lib/python/client';
import { PANDAS_PACKAGES, buildPandasSpec, evaluatePandas, type PyRunOutput, type PyRunner } from '../src/lib/python/evaluate';
import type { PandasProblem } from '../src/lib/problems/types';
import { loadAllProblems } from './loadProblems';
import { createNodePyRunner } from './nodePyRunner';

const problems = loadAllProblems().filter((p): p is PandasProblem => p.section === 'pandas');

let run: PyRunner;
let close: () => Promise<void>;
beforeAll(() => {
  // pandas is slower to import: give the first run more room.
  ({ run, close } = createNodePyRunner(60_000));
});
afterAll(() => close());

describe.each(problems.map((p) => [p.id, p] as const))('%s', (_id, p) => {
  it('has hidden data', () => {
    expect(p.hiddenDataCode).toBeTruthy();
  });

  it('visible DataFrames can be previewed', async () => {
    const json = await run('preview_pandas', [buildPandasSpec(p, 'run')], PANDAS_PACKAGES);
    const { tables } = JSON.parse(json);
    expect(tables.length).toBeGreaterThan(0);
  });

  it('official solution is accepted on Submit and returns rows', async () => {
    const ev = await evaluatePandas(p, p.solution, 'submit', run);
    const failed = ev.output.cases.find((c) => !c.passed);
    expect(ev.output.error ?? '', ev.output.error).toBe('');
    expect(failed, JSON.stringify(failed)).toBeUndefined();
    expect(ev.status).toBe('accepted');
    expect(ev.output.total).toBeGreaterThan(1);
    expect(ev.output.cases[0].expected_table!.total_rows).toBeGreaterThan(0);
  });

  it('starter code loads', async () => {
    const out: PyRunOutput = JSON.parse(await run('run_pandas_suite', [p.starter, buildPandasSpec(p, 'run')], PANDAS_PACKAGES));
    expect(out.error ?? '').toBe('');
  });

  it.each(p.wrongAnswers.map((code, i) => [i + 1, code] as const))('wrong answer #%i is rejected', async (_i, code) => {
    try {
      const ev = await evaluatePandas(p, code, 'submit', run);
      expect(ev.status).not.toBe('accepted');
    } catch (e) {
      expect(e instanceof PyTimeoutError || e instanceof PyCrashError, String(e)).toBe(true);
    }
  });
});
