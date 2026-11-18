import { mkdirSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { expect } from 'vitest';
import {
  fingerprintPath,
  gradingHash,
  readFingerprints,
  type FingerprintFile,
} from '../plugins/problems';
import type { Problem, Section } from '../src/lib/problems/types';

/**
 * Fingerprints of how each wrong answer fails on Submit (used in the browser
 * to diagnose a user's mistake). `npm run fingerprints` regenerates them;
 * a normal test run checks they are present, fresh and reproducible.
 */
const ROOT = join(import.meta.dirname, '..');
export const UPDATE = process.env.UPDATE_FINGERPRINTS === '1';
const TIMING = new Set(['tle', 'skip', 'killed']);

export function fingerprintStore(section: Section) {
  const stored = readFingerprints(ROOT, section);
  const next: FingerprintFile = {};

  return {
    /** The stored entry for this problem matches its current grading inputs. */
    checkFresh(p: Problem & { wrongAnswers: unknown[] }) {
      if (UPDATE) return;
      const entry = stored[p.id];
      expect(entry, `${p.id}: no fingerprints, run npm run fingerprints`).toBeDefined();
      expect(entry.hash, `${p.id}: fingerprints are stale, run npm run fingerprints`).toBe(gradingHash(p));
      expect(entry.wrong.length).toBe(p.wrongAnswers.length);
    },

    /** Records (update mode) or re-checks (normal mode) one wrong answer's fingerprint. */
    record(p: Problem & { wrongAnswers: unknown[] }, index: number, fp: string[] | null) {
      if (UPDATE) {
        next[p.id] ??= { hash: gradingHash(p), wrong: p.wrongAnswers.map(() => null) };
        next[p.id].wrong[index] = fp;
        return;
      }
      const known = stored[p.id]?.wrong[index];
      if (!known || !fp) return;
      // Timing depends on the machine: compare only up to the first timing token.
      const cut = Math.min(
        ...[known, fp].map((v) => {
          const i = v.findIndex((t) => TIMING.has(t));
          return i === -1 ? v.length : i;
        }),
      );
      expect(fp.slice(0, cut), `${p.id} wrong answer #${index + 1}: fingerprint changed`).toEqual(known.slice(0, cut));
    },

    save() {
      if (!UPDATE) return;
      const path = fingerprintPath(ROOT, section);
      mkdirSync(dirname(path), { recursive: true });
      // Merge, so regenerating a subset (vitest -t) keeps the other problems' entries.
      const merged = { ...stored, ...next };
      const sorted = Object.fromEntries(Object.entries(merged).sort(([a], [b]) => a.localeCompare(b)));
      writeFileSync(path, JSON.stringify(sorted, null, 1) + '\n');
    },
  };
}
