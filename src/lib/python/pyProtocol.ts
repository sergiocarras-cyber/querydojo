export type PyRequest =
  | { type: 'init'; id: number; packages: string[] }
  | { type: 'run'; id: number; code: string; spec: string; packages: string[] };

export type PyResponse =
  | { type: 'progress'; message: string }
  | { type: 'result'; id: number; ok: true; json: string }
  | { type: 'result'; id: number; ok: false; error: string; fatal?: boolean };
