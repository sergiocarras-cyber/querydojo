import { useSyncExternalStore } from 'react';
import { todayKey } from '../daily';
import { readJson, writeJson } from '../storage/local';

/**
 * All user progress lives in one localStorage document so it can be
 * exported/imported as a single JSON file.
 */

/**
 * `assisted`: accepted while the official solution had been viewed in the last
 * ASSIST_COOLDOWN_DAYS days. It does not count as solved until you solve it
 * again later without looking.
 */
export type ProblemStatus = 'todo' | 'attempted' | 'assisted' | 'solved';

export const ASSIST_COOLDOWN_DAYS = 3;
const ASSIST_COOLDOWN_MS = ASSIST_COOLDOWN_DAYS * 24 * 60 * 60 * 1000;
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
  /** Share of test cases / datasets passed, 0..1 (absent in old submissions). */
  score?: number;
  /** Accepted, but within the cooldown after viewing the solution. */
  assisted?: boolean;
  /** Title of the typical mistake this submission matched, if any. */
  diagnosis?: string;
}

export interface ProblemProgress {
  status: Exclude<ProblemStatus, 'todo'>;
  attempts: number;
  failures: number;
  firstAttemptAt: string;
  lastAttemptAt: string;
  solvedAt?: string;
  /** Last time the official solution (or stats explanation) was revealed. */
  solutionViewedAt?: string;
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

/** When an `assisted` problem can be solved again for real (null if not applicable). */
export function assistReadyAt(pp: ProblemProgress | undefined): Date | null {
  if (!pp?.solutionViewedAt || pp.status === 'solved') return null;
  return new Date(Date.parse(pp.solutionViewedAt) + ASSIST_COOLDOWN_MS);
}

/** True while an accepted submission would only count as `assisted`. */
export function inAssistCooldown(pp: ProblemProgress | undefined, now = Date.now()): boolean {
  const ready = assistReadyAt(pp);
  return ready !== null && now < ready.getTime();
}

/** True if an accepted submission right now would only count as `assisted`. */
export function wouldBeAssisted(problemId: string): boolean {
  const pp = state.problems[problemId];
  return pp?.status !== 'solved' && inAssistCooldown(pp);
}

/** Records that the official solution was revealed. Solved problems stay solved. */
export function markSolutionViewed(problemId: string): void {
  const at = new Date().toISOString();
  const prev = state.problems[problemId];
  const entry: ProblemProgress = prev
    ? { ...prev, solutionViewedAt: at }
    : { status: 'attempted', attempts: 0, failures: 0, firstAttemptAt: at, lastAttemptAt: at, solutionViewedAt: at };
  commit({ ...state, problems: { ...state.problems, [problemId]: entry } });
}

/** Records a Submit (Run does not count as an attempt). */
export function recordSubmission(problemId: string, submission: Omit<Submission, 'at'>): void {
  const now = Date.now();
  const at = new Date(now).toISOString();
  const prev = state.problems[problemId];
  const accepted = submission.verdict === 'accepted';
  let status: ProblemProgress['status'];
  if (prev?.status === 'solved') status = 'solved';
  else if (accepted) status = inAssistCooldown(prev, now) ? 'assisted' : 'solved';
  else status = prev?.status === 'assisted' ? 'assisted' : 'attempted';
  const entry: ProblemProgress = {
    ...prev,
    status,
    attempts: (prev?.attempts ?? 0) + 1,
    failures: (prev?.failures ?? 0) + (accepted ? 0 : 1),
    firstAttemptAt: prev?.firstAttemptAt ?? at,
    lastAttemptAt: at,
    solvedAt: prev?.solvedAt ?? (status === 'solved' ? at : undefined),
  };
  const record: Submission = { ...submission, at };
  if (accepted && status === 'assisted') record.assisted = true;
  const subs = [record, ...(state.submissions[problemId] ?? [])].slice(0, MAX_SUBMISSIONS_PER_PROBLEM);
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
