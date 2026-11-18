import { getProblemById } from './registry';
import type { Problem, Section } from './types';

// Full problem content (statements, data, tests, solutions), one chunk per
// section, downloaded the first time a problem of that section is opened.
const LOADERS: Record<Section, () => Promise<{ default: Problem[] }>> = {
  sql: () => import('virtual:problems/sql'),
  algorithms: () => import('virtual:problems/algorithms'),
  pandas: () => import('virtual:problems/pandas'),
  stats: () => import('virtual:problems/stats'),
};

const sections = new Map<Section, Promise<Map<string, Problem>>>();
const problems = new Map<string, Promise<Problem | undefined>>();

function sectionContent(section: Section) {
  let pending = sections.get(section);
  if (!pending) {
    pending = LOADERS[section]().then((m) => new Map(m.default.map((p) => [p.id, p])));
    // A failed download (offline) must be retryable, not cached forever.
    pending.catch(() => sections.delete(section));
    sections.set(section, pending);
  }
  return pending;
}

/**
 * Stable promise per problem id, suitable for React's `use()`: the same id
 * always returns the same promise, so a suspended render resumes correctly.
 */
export function loadProblem(id: string): Promise<Problem | undefined> {
  let pending = problems.get(id);
  if (!pending) {
    const meta = getProblemById(id);
    pending = meta ? sectionContent(meta.section).then((m) => m.get(id)) : Promise.resolve(undefined);
    pending.catch(() => problems.delete(id));
    problems.set(id, pending);
  }
  return pending;
}
