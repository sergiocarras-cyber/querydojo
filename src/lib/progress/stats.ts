import { todayKey } from '../daily';
import { DIFFICULTIES, SECTIONS, type Difficulty, type ProblemMeta, type Section } from '../problems/types';
import { statusOf, type ProgressData } from './store';

/** Pure aggregations over the progress document, shared by the pages and the tests. */

function parseKey(key: string): Date {
  const [y, m, d] = key.split('-').map(Number);
  return new Date(y, m - 1, d);
}

export function addDays(key: string, delta: number): string {
  const date = parseKey(key);
  date.setDate(date.getDate() + delta);
  return todayKey(date);
}

/**
 * Consecutive active days ending today. If today has no activity yet the streak
 * is still alive when yesterday was active (you have until midnight).
 */
export function currentStreak(days: string[], today = todayKey()): number {
  const set = new Set(days);
  let cursor = set.has(today) ? today : addDays(today, -1);
  let n = 0;
  while (set.has(cursor)) {
    n++;
    cursor = addDays(cursor, -1);
  }
  return n;
}

export function bestStreak(days: string[]): number {
  const sorted = [...new Set(days)].sort();
  let best = 0;
  let run = 0;
  let prev: string | null = null;
  for (const day of sorted) {
    run = prev !== null && addDays(prev, 1) === day ? run + 1 : 1;
    best = Math.max(best, run);
    prev = day;
  }
  return best;
}

/** Submissions per local calendar day. */
export function submissionsPerDay(data: ProgressData): Record<string, number> {
  const out: Record<string, number> = {};
  for (const subs of Object.values(data.submissions)) {
    for (const s of subs) {
      const key = todayKey(new Date(s.at));
      out[key] = (out[key] ?? 0) + 1;
    }
  }
  // Days recorded in activeDays but whose submissions were trimmed still count as active.
  for (const day of data.activeDays) out[day] = Math.max(out[day] ?? 0, 1);
  return out;
}

export interface Tally {
  total: number;
  solved: number;
  /** Accepted only after viewing the solution: not counted as solved yet. */
  assisted: number;
  attempted: number;
}

const tally = (): Tally => ({ total: 0, solved: 0, assisted: 0, attempted: 0 });

function count(t: Tally, data: ProgressData, p: ProblemMeta) {
  t.total++;
  const st = statusOf(data, p.id);
  if (st === 'solved') t.solved++;
  else if (st === 'assisted') t.assisted++;
  else if (st === 'attempted') t.attempted++;
}

export interface SectionTally extends Tally {
  section: Section;
  byDifficulty: Record<Difficulty, Tally>;
}

export function sectionTallies(problems: ProblemMeta[], data: ProgressData): SectionTally[] {
  return SECTIONS.map((section) => {
    const row: SectionTally = {
      section,
      ...tally(),
      byDifficulty: { Easy: tally(), Medium: tally(), Hard: tally() },
    };
    for (const p of problems) {
      if (p.section !== section) continue;
      count(row, data, p);
      count(row.byDifficulty[p.difficulty], data, p);
    }
    return row;
  });
}

export function difficultyTallies(problems: ProblemMeta[], data: ProgressData): Record<Difficulty, Tally> {
  const out = Object.fromEntries(DIFFICULTIES.map((d) => [d, tally()])) as Record<Difficulty, Tally>;
  for (const p of problems) count(out[p.difficulty], data, p);
  return out;
}

export interface TopicTally extends Tally {
  topic: string;
  sections: Section[];
  attempts: number;
  failures: number;
  /** Problems tried at least once but not solved yet. */
  unsolvedTried: number;
}

export function topicTallies(problems: ProblemMeta[], data: ProgressData): TopicTally[] {
  const map = new Map<string, TopicTally>();
  for (const p of problems) {
    for (const topic of p.topics) {
      let row = map.get(topic);
      if (!row) {
        row = { topic, sections: [], ...tally(), attempts: 0, failures: 0, unsolvedTried: 0 };
        map.set(topic, row);
      }
      if (!row.sections.includes(p.section)) row.sections.push(p.section);
      count(row, data, p);
      const pp = data.problems[p.id];
      if (pp) {
        row.attempts += pp.attempts;
        row.failures += pp.failures;
        if (pp.status !== 'solved') row.unsolvedTried++;
      }
    }
  }
  return [...map.values()].sort((a, b) => b.total - a.total || a.topic.localeCompare(b.topic));
}

/**
 * Topics where you struggle: you tried them and failed often or left problems
 * unsolved. Score = failure rate, plus a bump per problem tried and abandoned.
 */
export function weakTopics(topics: TopicTally[], limit = 5): (TopicTally & { score: number })[] {
  return topics
    .filter((t) => t.attempts > 0 && (t.failures > 0 || t.unsolvedTried > 0))
    .map((t) => ({ ...t, score: t.failures / t.attempts + 0.5 * t.unsolvedTried }))
    .sort((a, b) => b.score - a.score || b.failures - a.failures || a.topic.localeCompare(b.topic))
    .slice(0, limit);
}
