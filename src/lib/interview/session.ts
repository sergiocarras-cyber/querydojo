import { useSyncExternalStore } from 'react';
import type { Submission, SubmissionVerdict } from '../progress/store';
import type { Difficulty, ProblemMeta, Section } from '../problems/types';
import { readJson, removeKey, writeJson } from '../storage/local';

/**
 * Interview mode: one random problem, a countdown, no hints. The running session
 * lives in localStorage so a reload doesn't lose it; finished sessions are kept
 * in a short history with their summary.
 */

export const INTERVIEW_MINUTES = 30;
const CURRENT_KEY = 'interview:current';
const HISTORY_KEY = 'interview:history';
const MAX_HISTORY = 50;

export type SectionChoice = Section | 'any';
export type DifficultyChoice = Difficulty | 'any';
export type EndReason = 'manual' | 'timeout';

export interface InterviewSession {
  id: string;
  problemId: string;
  section: SectionChoice;
  difficulty: DifficultyChoice;
  startedAt: string;
  durationMs: number;
}

export interface InterviewSummary {
  id: string;
  problemId: string;
  startedAt: string;
  endedAt: string;
  endReason: EndReason;
  durationMs: number;
  solved: boolean;
  /** ms from start to the first accepted submission. */
  timeToSolveMs: number | null;
  submissions: number;
  lastVerdict: SubmissionVerdict | null;
}

interface State {
  current: InterviewSession | null;
  history: InterviewSummary[];
}

let state: State = {
  current: readJson<InterviewSession | null>(CURRENT_KEY, null),
  history: readJson<InterviewSummary[]>(HISTORY_KEY, []),
};
if (!Array.isArray(state.history)) state = { ...state, history: [] };

const listeners = new Set<() => void>();
function subscribe(fn: () => void) {
  listeners.add(fn);
  return () => listeners.delete(fn);
}
const getState = () => state;

export function getInterviewState(): State {
  return state;
}
function commit(next: State) {
  state = next;
  if (next.current) writeJson(CURRENT_KEY, next.current);
  else removeKey(CURRENT_KEY);
  writeJson(HISTORY_KEY, next.history);
  listeners.forEach((fn) => fn());
}

export function useInterview(): State {
  return useSyncExternalStore(subscribe, getState, getState);
}

export interface PickOptions {
  section: SectionChoice;
  difficulty: DifficultyChoice;
  onlyUnsolved: boolean;
}

export function candidates(
  all: ProblemMeta[],
  opts: PickOptions,
  isSolved: (id: string) => boolean,
): ProblemMeta[] {
  return all.filter(
    (p) =>
      (opts.section === 'any' || p.section === opts.section) &&
      (opts.difficulty === 'any' || p.difficulty === opts.difficulty) &&
      (!opts.onlyUnsolved || !isSolved(p.id)),
  );
}

/** Random pick, avoiding the most recent interview problems when possible. */
export function pickProblem(pool: ProblemMeta[], recent: string[], rng = Math.random): ProblemMeta | undefined {
  if (pool.length === 0) return undefined;
  const fresh = pool.filter((p) => !recent.includes(p.id));
  const from = fresh.length > 0 ? fresh : pool;
  return from[Math.floor(rng() * from.length)];
}

export function interviewDraftScope(sessionId: string) {
  return `interview:${sessionId}:`;
}

export function startInterview(problem: ProblemMeta, opts: PickOptions): InterviewSession {
  const session: InterviewSession = {
    id: Date.now().toString(36),
    problemId: problem.id,
    section: opts.section,
    difficulty: opts.difficulty,
    startedAt: new Date().toISOString(),
    durationMs: INTERVIEW_MINUTES * 60_000,
  };
  commit({ ...state, current: session });
  return session;
}

export function deadline(session: InterviewSession): number {
  return Date.parse(session.startedAt) + session.durationMs;
}

/** Submissions made during the session window. */
export function sessionSubmissions(
  session: Pick<InterviewSession, 'startedAt'>,
  subs: Submission[],
  endMs: number,
): Submission[] {
  const start = Date.parse(session.startedAt);
  return subs
    .filter((s) => {
      const t = Date.parse(s.at);
      return t >= start && t <= endMs;
    })
    .sort((a, b) => a.at.localeCompare(b.at));
}

export function summarize(
  session: InterviewSession,
  subs: Submission[],
  endMs: number,
  endReason: EndReason,
): InterviewSummary {
  const end = Math.min(endMs, deadline(session));
  const inSession = sessionSubmissions(session, subs, end);
  const firstAccepted = inSession.find((s) => s.verdict === 'accepted');
  const start = Date.parse(session.startedAt);
  return {
    id: session.id,
    problemId: session.problemId,
    startedAt: session.startedAt,
    endedAt: new Date(end).toISOString(),
    endReason,
    durationMs: end - start,
    solved: Boolean(firstAccepted),
    timeToSolveMs: firstAccepted ? Date.parse(firstAccepted.at) - start : null,
    submissions: inSession.length,
    lastVerdict: inSession.at(-1)?.verdict ?? null,
  };
}

export function finishInterview(summary: InterviewSummary): void {
  removeKey(`draft:${interviewDraftScope(summary.id)}${summary.problemId}`);
  commit({ current: null, history: [summary, ...state.history].slice(0, MAX_HISTORY) });
}

/** Abandons the running session without keeping it in the history. */
export function cancelInterview(): void {
  if (state.current) removeKey(`draft:${interviewDraftScope(state.current.id)}${state.current.problemId}`);
  commit({ ...state, current: null });
}

export function clearInterviewHistory(): void {
  commit({ ...state, history: [] });
}

export function formatDuration(ms: number): string {
  const total = Math.max(0, Math.round(ms / 1000));
  const m = Math.floor(total / 60);
  const s = total % 60;
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}
