import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { PyCrashError, PyTimeoutError } from '../src/lib/python/client';
import { buildSpec, evaluatePython, type PyRunOutput, type PyRunner } from '../src/lib/python/evaluate';
import type { AlgorithmsProblem } from '../src/lib/problems/types';
import { loadAllProblems } from './loadProblems';
import { fingerprintStore } from './fingerprints';
import { createNodePyRunner } from './nodePyRunner';
import { KILLED } from '../src/lib/diagnosis';

const problems = loadAllProblems().filter((p): p is AlgorithmsProblem => p.section === 'algorithms');

const prints = fingerprintStore('algorithms');
let run: PyRunner;
let close: () => Promise<void>;
beforeAll(() => {
  ({ run, close } = createNodePyRunner());
});
afterAll(async () => {
  await close();
  prints.save();
});

describe.each(problems.map((p) => [p.id, p] as const))('%s', (_id, p) => {
  it('official solution passes the visible cases (Run)', async () => {
    const ev = await evaluatePython(p, p.solution, 'run', run);
    expect(ev.output.error ?? '').toBe('');
    expect(ev.output.cases.filter((c) => !c.passed).map((c) => c.input)).toEqual([]);
  });

  it('official solution is accepted on Submit, including large cases', async () => {
    const ev = await evaluatePython(p, p.solution, 'submit', run);
    const failed = ev.output.cases.find((c) => !c.passed);
    expect(failed, JSON.stringify(failed)).toBeUndefined();
    expect(ev.status).toBe('accepted');
    expect(ev.output.total).toBeGreaterThan(p.tests.length);
  });

  it('starter code loads without errors', async () => {
    const out: PyRunOutput = JSON.parse(await run('run_suite', [p.starter, buildSpec(p, 'run')], []));
    expect(out.error ?? '').toBe('');
    expect(out.status).toBe('ok');
  });

  it('wrong-answer fingerprints are up to date', () => prints.checkFresh(p));

  it.each(p.wrongAnswers.map((w, i) => [i + 1, w.code] as const))('wrong answer #%i is rejected', async (i, code) => {
    try {
      const ev = await evaluatePython(p, code, 'submit', run);
      expect(ev.status).not.toBe('accepted');
      expect(ev.score).toBeLessThan(1);
      prints.record(p, i - 1, ev.fingerprint);
    } catch (e) {
      // Killed by the global time limit or a crash, exactly like in the browser.
      expect(e instanceof PyTimeoutError || e instanceof PyCrashError, String(e)).toBe(true);
      prints.record(p, i - 1, KILLED);
    }
  });
});
