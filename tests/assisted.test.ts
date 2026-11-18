import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import {
  getProgress,
  inAssistCooldown,
  markSolutionViewed,
  recordSubmission,
  resetProgress,
  statusOf,
  type Submission,
} from '../src/lib/progress/store';

const DAY = 24 * 60 * 60 * 1000;
const T0 = new Date('2026-03-02T10:00:00Z').getTime();

const submit = (id: string, verdict: Submission['verdict']) =>
  recordSubmission(id, { verdict, passed: 0, total: 1, ms: 0, code: '', detail: '' });

describe('solved with help', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(T0);
    resetProgress();
  });
  afterEach(() => vi.useRealTimers());

  it('solving without looking is a normal solve', () => {
    submit('p', 'wrong');
    submit('p', 'accepted');
    expect(statusOf(getProgress(), 'p')).toBe('solved');
  });

  it('accepting right after viewing the solution only counts as assisted', () => {
    submit('p', 'wrong');
    markSolutionViewed('p');
    vi.setSystemTime(T0 + 60_000);
    submit('p', 'accepted');
    const data = getProgress();
    expect(statusOf(data, 'p')).toBe('assisted');
    expect(data.submissions.p[0].assisted).toBe(true);
    expect(data.problems.p.solvedAt).toBeUndefined();
  });

  it('viewing the solution before any attempt marks the problem as touched', () => {
    markSolutionViewed('q');
    expect(statusOf(getProgress(), 'q')).toBe('attempted');
    expect(getProgress().problems.q.attempts).toBe(0);
  });

  it('a later wrong submission keeps the assisted status', () => {
    markSolutionViewed('p');
    submit('p', 'accepted');
    submit('p', 'wrong');
    expect(statusOf(getProgress(), 'p')).toBe('assisted');
  });

  it('solving again after the cooldown upgrades to solved', () => {
    markSolutionViewed('p');
    submit('p', 'accepted');
    vi.setSystemTime(T0 + 3 * DAY - 1000);
    submit('p', 'accepted');
    expect(statusOf(getProgress(), 'p')).toBe('assisted');
    vi.setSystemTime(T0 + 3 * DAY + 1000);
    expect(inAssistCooldown(getProgress().problems.p)).toBe(false);
    submit('p', 'accepted');
    expect(statusOf(getProgress(), 'p')).toBe('solved');
    expect(getProgress().submissions.p[0].assisted).toBeUndefined();
  });

  it('looking at the solution again restarts the cooldown', () => {
    markSolutionViewed('p');
    vi.setSystemTime(T0 + 2 * DAY);
    markSolutionViewed('p');
    vi.setSystemTime(T0 + 4 * DAY);
    submit('p', 'accepted');
    expect(statusOf(getProgress(), 'p')).toBe('assisted');
  });

  it('a problem already solved stays solved after viewing the solution', () => {
    submit('p', 'accepted');
    markSolutionViewed('p');
    submit('p', 'accepted');
    expect(statusOf(getProgress(), 'p')).toBe('solved');
    expect(inAssistCooldown(getProgress().problems.p)).toBe(false);
  });
});
