import { readdirSync, readFileSync } from 'node:fs';
import { join, relative } from 'node:path';
import { parseProblem } from '../src/lib/problems/parse';
import type { Problem } from '../src/lib/problems/types';

const ROOT = join(import.meta.dirname, '..');

/** Reads every problem file from disk, like the Vite glob does in the browser. */
export function loadAllProblems(): Problem[] {
  const out: Problem[] = [];
  const dir = join(ROOT, 'problems');
  for (const section of readdirSync(dir)) {
    for (const file of readdirSync(join(dir, section))) {
      if (!file.endsWith('.md')) continue;
      const path = join(dir, section, file);
      out.push(parseProblem(readFileSync(path, 'utf8'), '/' + relative(ROOT, path)));
    }
  }
  return out;
}
