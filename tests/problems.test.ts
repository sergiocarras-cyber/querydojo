import { describe, expect, it } from 'vitest';
import type { Section } from '../src/lib/problems/types';
import { loadAllProblems } from './loadProblems';

const ID_PREFIX: Record<Section, string> = { sql: 'sql-', algorithms: 'algo-', pandas: 'pandas-', stats: 'stats-' };

const problems = loadAllProblems();

describe('problem files', () => {
  it('there is at least one problem', () => {
    expect(problems.length).toBeGreaterThan(0);
  });

  it('ids and slugs are unique', () => {
    const ids = problems.map((p) => p.id);
    const slugs = problems.map((p) => p.slug);
    expect(new Set(ids).size).toBe(ids.length);
    expect(new Set(slugs).size).toBe(slugs.length);
  });

  it.each(problems.map((p) => [p.file, p] as const))('%s lives in the folder of its section', (file, p) => {
    expect(file.startsWith(`/problems/${p.section}/`)).toBe(true);
    expect(file.endsWith(`/${p.slug}.md`)).toBe(true);
    expect(p.id.startsWith(ID_PREFIX[p.section])).toBe(true);
  });
});
