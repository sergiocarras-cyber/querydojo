import type { Diagnosis } from './problems/types';

/**
 * Matches a failing submission against the problem's known wrong answers.
 *
 * Each wrong answer was run on Submit by the test suite, which stored one token
 * per test case / dataset (its fingerprint):
 *   ok | tle | skip | err:<Type> | out:<hash> | none   (or ['killed'] when the
 *   whole run hit the global timeout).
 * A submission "makes the same mistake" when it fails on the same cases with
 * the same output. Timing tokens are compared loosely, because a slow solution
 * may hit the time limit one case earlier or later on another machine.
 */

export const KILLED = ['killed'];
const SLOW = new Set(['tle', 'skip']);

export function sameMistake(user: string[], known: string[]): boolean {
  if (user.length === 1 && user[0] === 'killed') {
    return (known.length === 1 && known[0] === 'killed') || known.includes('tle');
  }
  if (known.length === 1 && known[0] === 'killed') return user.includes('tle');
  if (user.length !== known.length) return false;
  let shared = false;
  for (let i = 0; i < user.length; i++) {
    const u = user[i];
    const k = known[i];
    if (u === k) {
      if (u !== 'ok') shared = true;
      continue;
    }
    const uSlowOrOk = SLOW.has(u) || u === 'ok';
    const kSlowOrOk = SLOW.has(k) || k === 'ok';
    if (uSlowOrOk && kSlowOrOk) {
      if (SLOW.has(u) && SLOW.has(k)) shared = true;
      continue;
    }
    return false;
  }
  return shared;
}

/** Known mistakes that behave exactly like this submission (usually zero or one). */
export function diagnose(fingerprint: string[] | null, diagnoses: Diagnosis[] | undefined): Diagnosis[] {
  if (!fingerprint || !diagnoses) return [];
  return diagnoses.filter((d) => d.title && d.fingerprint && sameMistake(fingerprint, d.fingerprint));
}
