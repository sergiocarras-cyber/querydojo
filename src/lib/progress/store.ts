import { useSyncExternalStore } from 'react';
import { todayKey } from '../daily';
import { readJson, writeJson } from '../storage/local';

/**
 * All user progress lives in one localStorage document so it can be
 * exported/imported as a single JSON file.
 */

export type ProblemStatus = 'todo' | 'attempted' | 'solved';
export type SubmissionVerdict = 'accepted' | 'wrong' | 'error' | 'timeout';

export interface Submission {
  at: string; // ISO timestamp
  verdict: SubmissionVerdict;
  passed: number;
  total: number;
  ms: number;
  code: string;
  /** Short human summary of the result. */
  detail: string;
}

export interface ProblemProgress {
  status: Exclude<ProblemStatus, 'todo'>;
  attempts: number;
  failures: number;
  firstAttemptAt: string;
  lastAttemptAt: string;
  solvedAt?: string;
}

export interface ProgressData {
  version: 1;
  problems: Record<string, ProblemProgress>;
  submissions: Record<string, Submission[]>;
  /** Local dates (YYYY-MM-DD) with at least one submission, for streaks. */
  activeDays: string[];
}

const KEY = 'progress';
const MAX_SUBMISSIONS_PER_PROBLEM = 30;

const empty = (): ProgressData => ({ version: 1, problems: {}, submissions: {}, activeDays: [] });

let state: ProgressData = load();
const listeners = new Set<() => void>();

function load(): ProgressData {
  const data = readJson<ProgressData | null>(KEY, null);
  return isProgressData(data) ? data : empty();
}

export function isProgressData(value: unknown): value is ProgressData {
  if (!value || typeof value !== 'object') return false;
  const v = value as Partial<ProgressData>;
  return (
    v.version === 1 &&
    typeof v.problems === 'object' &&
    v.problems !== null &&
    typeof v.submissions === 'object' &&
    v.submissions !== null &&
    Array.isArray(v.activeDays)
  );
}

function commit(next: ProgressData) {
  state = next;
  writeJson(KEY, state);
  listeners.forEach((fn) => fn());
}

function subscribe(fn: () => void) {
  listeners.add(fn);
  return () => listeners.delete(fn);
}

export function getProgress(): ProgressData {
  return state;
}

export function useProgress(): ProgressData {
  return useSyncExternalStore(subscribe, getProgress, getProgress);
}

export function statusOf(data: ProgressData, problemId: string): ProblemStatus {
  return data.problems[problemId]?.status ?? 'todo';
}

/** Records a Submit (Run does not count as an attempt). */
export function recordSubmission(problemId: string, submission: Omit<Submission, 'at'>): void {
  const at = new Date().toISOString();
  const prev = state.problems[problemId];
  const accepted = submission.verdict === 'accepted';
  const entry: ProblemProgress = {
    status: accepted || prev?.status === 'solved' ? 'solved' : 'attempted',
    attempts: (prev?.attempts ?? 0) + 1,
    failures: (prev?.failures ?? 0) + (accepted ? 0 : 1),
    firstAttemptAt: prev?.firstAttemptAt ?? at,
    lastAttemptAt: at,
    solvedAt: prev?.solvedAt ?? (accepted ? at : undefined),
  };
  const subs = [{ ...submission, at }, ...(state.submissions[problemId] ?? [])].slice(0, MAX_SUBMISSIONS_PER_PROBLEM);
  const today = todayKey();
  commit({
    ...state,
    problems: { ...state.problems, [problemId]: entry },
    submissions: { ...state.submissions, [problemId]: subs },
    activeDays: state.activeDays.includes(today) ? state.activeDays : [...state.activeDays, today].sort(),
  });
}

export function exportProgress(): string {
  return JSON.stringify(state, null, 2);
}

/** Replaces all progress with an exported file. Throws on invalid input. */
export function importProgress(json: string): void {
  const data: unknown = JSON.parse(json);
  if (!isProgressData(data)) throw new Error('El archivo no es un progreso válido de QueryDojo.');
  commit(data);
}

export function resetProgress(): void {
  commit(empty());
}
