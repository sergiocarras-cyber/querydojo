export type PyRequest =
  | { type: 'init'; id: number; packages: string[] }
  /** Calls a harness function `fn(*args)` that returns a JSON string. */
  | { type: 'call'; id: number; fn: HarnessFn; args: string[]; packages: string[] };

export type HarnessFn = 'run_suite' | 'run_pandas_suite' | 'preview_pandas' | 'eval_answer';

export type PyResponse =
  | { type: 'progress'; message: string }
  | { type: 'result'; id: number; ok: true; json: string }
  | { type: 'result'; id: number; ok: false; error: string; fatal?: boolean };
