import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { gradingHash, readFingerprints } from '../plugins/problems';
import { KILLED, diagnose, sameMistake } from '../src/lib/diagnosis';
import type { Diagnosis, Section } from '../src/lib/problems/types';
import { loadAllProblems } from './loadProblems';

const ROOT = join(import.meta.dirname, '..');

describe('sameMistake', () => {
  it('matches identical failures', () => {
    expect(sameMistake(['ok', 'out:abc', 'ok'], ['ok', 'out:abc', 'ok'])).toBe(true);
  });

  it('rejects a different wrong output or different failing cases', () => {
    expect(sameMistake(['ok', 'out:abc'], ['ok', 'out:xyz'])).toBe(false);
    expect(sameMistake(['out:abc', 'ok'], ['ok', 'out:abc'])).toBe(false);
    expect(sameMistake(['ok', 'err:IndexError'], ['ok', 'err:KeyError'])).toBe(false);
  });

  it('never matches a fully passing run', () => {
    expect(sameMistake(['ok', 'ok'], ['ok', 'ok'])).toBe(false);
  });

  it('tolerates a time limit hit one case earlier or later', () => {
    expect(sameMistake(['ok', 'tle', 'skip'], ['ok', 'ok', 'tle'])).toBe(true);
    expect(sameMistake(['ok', 'ok', 'tle'], ['ok', 'tle', 'skip'])).toBe(true);
    // ...but not a wrong answer where the known mistake was only slow.
    expect(sameMistake(['ok', 'out:abc', 'skip'], ['ok', 'tle', 'skip'])).toBe(false);
  });

  it('a run killed by the global timeout matches slow mistakes only', () => {
    expect(sameMistake(KILLED, KILLED)).toBe(true);
    expect(sameMistake(KILLED, ['ok', 'tle', 'skip'])).toBe(true);
    expect(sameMistake(KILLED, ['ok', 'out:abc'])).toBe(false);
  });

  it('diagnose ignores untitled answers and missing fingerprints', () => {
    const d: Diagnosis[] = [
      { title: 'A', explanation: 'x', fingerprint: ['out:1'] },
      { title: '', explanation: '', fingerprint: ['out:1'] },
      { title: 'C', explanation: 'x', fingerprint: null },
    ];
    expect(diagnose(['out:1'], d).map((x) => x.title)).toEqual(['A']);
    expect(diagnose(null, d)).toEqual([]);
  });
});

describe('stored fingerprints', () => {
  const problems = loadAllProblems();

  for (const section of ['sql', 'algorithms', 'pandas'] as Section[]) {
    const prints = readFingerprints(ROOT, section);

    it(`${section}: every wrong answer is recognised as itself, and never the official solution`, () => {
      for (const p of problems) {
        if (p.section !== section || !('wrongAnswers' in p)) continue;
        const entry = prints[p.id];
        expect(entry?.hash, p.id).toBe(gradingHash(p));
        const diagnoses: Diagnosis[] = p.wrongAnswers.map((w, i) => ({
          title: w.title,
          explanation: w.explanation,
          fingerprint: entry.wrong[i],
        }));
        diagnoses.forEach((d, i) => {
          expect(d.fingerprint, `${p.id} #${i + 1}`).not.toBeNull();
          expect(diagnose(d.fingerprint, diagnoses).map((x) => x.title), `${p.id} #${i + 1}`).toContain(d.title);
        });
        const allOk = entry.wrong.find((f) => f && f.length > 1)?.map(() => 'ok') ?? ['ok'];
        expect(diagnose(allOk, diagnoses), p.id).toEqual([]);
      }
    });
  }
});
