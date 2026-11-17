import { describe, expect, it } from 'vitest';
import { STUDY_PATHS, pathProblemIds } from '../src/lib/paths';
import {
  candidates,
  formatDuration,
  pickProblem,
  sessionSubmissions,
  summarize,
  type InterviewSession,
} from '../src/lib/interview/session';
import {
  addDays,
  bestStreak,
  currentStreak,
  sectionTallies,
  submissionsPerDay,
  topicTallies,
  weakTopics,
} from '../src/lib/progress/stats';
import type { ProgressData, Submission } from '../src/lib/progress/store';
import { loadAllProblems } from './loadProblems';

const problems = loadAllProblems();

describe('study paths', () => {
  const byId = new Map(problems.map((p) => [p.id, p]));

  for (const path of STUDY_PATHS) {
    it(`${path.id} covers every ${path.section} problem exactly once`, () => {
      const ids = pathProblemIds(path);
      expect(new Set(ids).size).toBe(ids.length);
      for (const id of ids) {
        expect(byId.get(id), id).toBeDefined();
        expect(byId.get(id)!.section).toBe(path.section);
      }
      const all = problems.filter((p) => p.section === path.section).map((p) => p.id);
      expect([...ids].sort()).toEqual(all.sort());
      for (const step of path.steps) expect(step.problems.length).toBeGreaterThan(0);
    });
  }

  it('the algorithms path follows the requested pattern order', () => {
    const algo = STUDY_PATHS.find((p) => p.section === 'algorithms')!;
    expect(algo.steps.map((s) => s.title)).toEqual([
      'Arrays y hashing',
      'Two pointers',
      'Sliding window',
      'Stack',
      'Binary search',
      'Linked list',
      'Trees',
      'Graphs',
      'Heaps',
      'Programación dinámica',
    ]);
  });
});

describe('streaks', () => {
  it('adds days across month and year boundaries', () => {
    expect(addDays('2025-12-31', 1)).toBe('2026-01-01');
    expect(addDays('2024-03-01', -1)).toBe('2024-02-29');
  });

  it('counts the current streak ending today or yesterday', () => {
    const days = ['2025-01-01', '2025-01-03', '2025-01-04', '2025-01-05'];
    expect(currentStreak(days, '2025-01-05')).toBe(3);
    expect(currentStreak(days, '2025-01-06')).toBe(3); // still alive until midnight
    expect(currentStreak(days, '2025-01-07')).toBe(0);
    expect(currentStreak([], '2025-01-07')).toBe(0);
  });

  it('finds the best streak regardless of order and duplicates', () => {
    expect(bestStreak(['2025-02-03', '2025-01-30', '2025-01-31', '2025-02-01', '2025-02-01', '2025-02-05'])).toBe(3);
    expect(bestStreak([])).toBe(0);
  });
});

const sub = (at: string, verdict: Submission['verdict']): Submission => ({
  at,
  verdict,
  passed: verdict === 'accepted' ? 1 : 0,
  total: 1,
  ms: 1,
  code: '',
  detail: '',
});

describe('progress aggregations', () => {
  const [a, b] = problems.filter((p) => p.section === 'sql');
  const data: ProgressData = {
    version: 1,
    problems: {
      [a.id]: { status: 'solved', attempts: 3, failures: 2, firstAttemptAt: '', lastAttemptAt: '' },
      [b.id]: { status: 'attempted', attempts: 4, failures: 4, firstAttemptAt: '', lastAttemptAt: '' },
    },
    submissions: { [a.id]: [sub('2025-05-01T10:00:00', 'accepted'), sub('2025-05-01T09:00:00', 'wrong')] },
    activeDays: ['2025-05-01', '2025-04-01'],
  };

  it('tallies sections and difficulties', () => {
    const sql = sectionTallies(problems, data).find((s) => s.section === 'sql')!;
    expect(sql.total).toBe(30);
    expect(sql.solved).toBe(1);
    expect(sql.attempted).toBe(1);
    expect(sql.byDifficulty.Easy.total + sql.byDifficulty.Medium.total + sql.byDifficulty.Hard.total).toBe(30);
  });

  it('counts submissions per local day and keeps trimmed active days', () => {
    const perDay = submissionsPerDay(data);
    expect(perDay['2025-05-01']).toBe(2);
    expect(perDay['2025-04-01']).toBe(1);
  });

  it('ranks the always-failing, unsolved topic as the weakest', () => {
    const topics = topicTallies(problems, data);
    const weak = weakTopics(topics);
    expect(weak.length).toBeGreaterThan(0);
    expect(weak.every((t) => t.attempts > 0)).toBe(true);
    // Topics nobody tried never show up as weak.
    const untouched = topics.filter((t) => t.attempts === 0).map((t) => t.topic);
    expect(weak.some((t) => untouched.includes(t.topic))).toBe(false);
    expect(b.topics).toContain(weak[0].topic);
  });
});

describe('interview mode', () => {
  it('filters candidates and avoids recent problems', () => {
    const pool = candidates(problems, { section: 'pandas', difficulty: 'Hard', onlyUnsolved: false }, () => false);
    expect(pool.length).toBe(2);
    expect(pool.every((p) => p.section === 'pandas' && p.difficulty === 'Hard')).toBe(true);
    const pick = pickProblem(pool, [pool[0].id], () => 0);
    expect(pick?.id).toBe(pool[1].id);
    // Everything recent: still picks something.
    expect(pickProblem(pool, pool.map((p) => p.id), () => 0)?.id).toBe(pool[0].id);
    expect(pickProblem([], [], () => 0)).toBeUndefined();
    const unsolved = candidates(problems, { section: 'pandas', difficulty: 'Hard', onlyUnsolved: true }, (id) => id === pool[0].id);
    expect(unsolved.map((p) => p.id)).toEqual([pool[1].id]);
  });

  const session: InterviewSession = {
    id: 'x',
    problemId: 'sql-001',
    section: 'any',
    difficulty: 'any',
    startedAt: '2025-06-01T10:00:00.000Z',
    durationMs: 30 * 60_000,
  };
  const subs = [
    sub('2025-06-01T09:59:00.000Z', 'accepted'), // before the session: ignored
    sub('2025-06-01T10:05:00.000Z', 'wrong'),
    sub('2025-06-01T10:12:30.000Z', 'accepted'),
    sub('2025-06-01T10:40:00.000Z', 'accepted'), // after the deadline: ignored
  ];

  it('only counts submissions inside the session window', () => {
    expect(sessionSubmissions(session, subs, Date.parse('2025-06-01T10:30:00.000Z')).length).toBe(2);
  });

  it('summarizes a solved session, capped at the deadline', () => {
    const s = summarize(session, subs, Date.parse('2025-06-01T11:00:00.000Z'), 'timeout');
    expect(s.solved).toBe(true);
    expect(s.timeToSolveMs).toBe(12.5 * 60_000);
    expect(s.durationMs).toBe(30 * 60_000);
    expect(s.submissions).toBe(2);
    expect(s.lastVerdict).toBe('accepted');
  });

  it('summarizes an unsolved session', () => {
    const s = summarize(session, subs.slice(0, 2), Date.parse('2025-06-01T10:08:00.000Z'), 'manual');
    expect(s.solved).toBe(false);
    expect(s.timeToSolveMs).toBeNull();
    expect(s.durationMs).toBe(8 * 60_000);
    expect(s.lastVerdict).toBe('wrong');
  });

  it('formats durations', () => {
    expect(formatDuration(0)).toBe('00:00');
    expect(formatDuration(-5)).toBe('00:00');
    expect(formatDuration(30 * 60_000)).toBe('30:00');
    expect(formatDuration(65_400)).toBe('01:05');
  });
});
