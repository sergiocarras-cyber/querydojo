import { join } from 'node:path';
import { loadProblemFiles } from '../plugins/problems';
import type { Problem } from '../src/lib/problems/types';

const ROOT = join(import.meta.dirname, '..');

/** Reads every problem file from disk with the same loader the Vite plugin uses. */
export function loadAllProblems(): Problem[] {
  return loadProblemFiles(ROOT).problems;
}
