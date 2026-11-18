import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import type { PyRunner } from '../src/lib/python/evaluate';
import type { StatsProblem } from '../src/lib/problems/types';
import { loadAllProblems } from './loadProblems';
import { createNodePyRunner } from './nodePyRunner';

const problems = loadAllProblems().filter((p): p is StatsProblem => p.section === 'stats' || p.section === 'judgment');

let run: PyRunner;
let close: () => Promise<void>;
beforeAll(() => {
  ({ run, close } = createNodePyRunner(60_000));
});
afterAll(() => close());

describe.each(problems.map((p) => [p.id, p] as const))('%s', (_id, p) => {
  if (p.answerType === 'numeric') {
    it('stored answer matches the verification code', async () => {
      const value = JSON.parse(await run('eval_answer', [p.verification!], []));
      expect(Math.abs(value - p.answer), `computed ${value}, stored ${p.answer}`).toBeLessThanOrEqual(p.tolerance / 2);
    });
  } else {
    it('has a valid correct option and distinct options', () => {
      expect(p.options[p.answer]).toBeTruthy();
      expect(new Set(p.options).size).toBe(p.options.length);
    });
    if (p.verification) {
      it('verification code returns the index of the correct option', async () => {
        expect(JSON.parse(await run('eval_answer', [p.verification!], []))).toBe(p.answer);
      });
    }
  }
});
