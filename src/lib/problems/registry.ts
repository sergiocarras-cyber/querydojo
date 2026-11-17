import { parseProblem } from './parse';
import type { Problem, Section } from './types';

// Every problem file is bundled at build time — no backend needed.
const files = import.meta.glob('/problems/**/*.md', {
  query: '?raw',
  import: 'default',
  eager: true,
}) as Record<string, string>;

const SECTION_ORDER: Record<Section, number> = { sql: 0, algorithms: 1, pandas: 2, stats: 3 };

export const problems: Problem[] = Object.entries(files)
  .map(([path, raw]) => parseProblem(raw, path))
  .sort((a, b) => SECTION_ORDER[a.section] - SECTION_ORDER[b.section] || a.id.localeCompare(b.id));

const bySlug = new Map(problems.map((p) => [p.slug, p]));

export function getProblem(slug: string): Problem | undefined {
  return bySlug.get(slug);
}

export function problemsIn(section: Section): Problem[] {
  return problems.filter((p) => p.section === section);
}
