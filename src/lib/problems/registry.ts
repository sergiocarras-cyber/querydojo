import index from 'virtual:problem-index';
import type { ProblemMeta, Section } from './types';

// Metadata of every problem, parsed at build time by plugins/problems.ts.
// Full statements and tests live in ./content (loaded only by the solver pages).
export const problems: ProblemMeta[] = index;

const bySlug = new Map(problems.map((p) => [p.slug, p]));
const byId = new Map(problems.map((p) => [p.id, p]));

export function getProblemMeta(slug: string): ProblemMeta | undefined {
  return bySlug.get(slug);
}

export function getProblemById(id: string): ProblemMeta | undefined {
  return byId.get(id);
}

export function problemsIn(section: Section): ProblemMeta[] {
  return problems.filter((p) => p.section === section);
}
