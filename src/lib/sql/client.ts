import type { TableInfo } from './engine';
import type { JobResult, SqlJob, SqlRequest, SqlResponse } from './protocol';

export const SQL_TIMEOUT_MS = 5_000;

export class SqlTimeoutError extends Error {
  constructor() {
    super(`La consulta superó el límite de ${SQL_TIMEOUT_MS / 1000} s y se canceló.`);
    this.name = 'SqlTimeoutError';
  }
}

type Pending = { resolve: (r: SqlResponse) => void; reject: (e: Error) => void };
type Distribute<T> = T extends unknown ? Omit<T, 'id'> : never;

/**
 * Owns the PGlite Web Worker. If a query hangs, the worker is terminated
 * and a fresh one is created on the next call.
 */
class SqlClient {
  private worker: Worker | null = null;
  private ready: Promise<void> | null = null;
  private pending = new Map<number, Pending>();
  private nextId = 1;
  private listeners = new Set<(loading: boolean) => void>();
  loading = false;

  onLoadingChange(fn: (loading: boolean) => void): () => void {
    this.listeners.add(fn);
    return () => this.listeners.delete(fn);
  }

  private setLoading(loading: boolean) {
    this.loading = loading;
    this.listeners.forEach((fn) => fn(loading));
  }

  private spawn(): Worker {
    const worker = new Worker(new URL('./sql.worker.ts', import.meta.url), { type: 'module' });
    worker.onmessage = (e: MessageEvent<SqlResponse>) => {
      const p = this.pending.get(e.data.id);
      if (!p) return;
      this.pending.delete(e.data.id);
      p.resolve(e.data);
    };
    worker.onerror = (e) => this.reset(new Error(e.message || 'Error en el worker SQL'));
    return worker;
  }

  private send(req: Distribute<SqlRequest>, timeoutMs?: number): Promise<SqlResponse> {
    const worker = (this.worker ??= this.spawn());
    const id = this.nextId++;
    return new Promise<SqlResponse>((resolve, reject) => {
      let timer: ReturnType<typeof setTimeout> | undefined;
      this.pending.set(id, {
        resolve: (r) => {
          clearTimeout(timer);
          resolve(r);
        },
        reject: (e) => {
          clearTimeout(timer);
          reject(e);
        },
      });
      if (timeoutMs) timer = setTimeout(() => this.reset(new SqlTimeoutError()), timeoutMs);
      worker.postMessage({ ...req, id } as SqlRequest);
    });
  }

  /** Kills the worker, failing every pending request. */
  reset(reason: Error = new Error('Entorno SQL reiniciado')) {
    this.worker?.terminate();
    this.worker = null;
    this.ready = null;
    for (const p of this.pending.values()) p.reject(reason);
    this.pending.clear();
    this.setLoading(false);
  }

  /** Boots PGlite (downloads the WASM the first time). No timeout here. */
  init(): Promise<void> {
    if (!this.ready) {
      this.setLoading(true);
      const ready = this.send({ type: 'init' }).then((r) => {
        if (!r.ok) throw new Error(r.error);
      });
      this.ready = ready;
      ready.then(
        () => this.setLoading(false),
        () => {
          this.setLoading(false);
          if (this.ready === ready) this.ready = null;
        },
      );
    }
    return this.ready;
  }

  async describe(schema: string, data: string): Promise<TableInfo[]> {
    await this.init();
    const r = await this.send({ type: 'describe', schema, data }, SQL_TIMEOUT_MS * 2);
    if (!r.ok) throw new Error(r.error);
    if (r.type !== 'describe') throw new Error('Respuesta inesperada');
    return r.tables;
  }

  /** Runs every job on its own fresh database. One timeout covers each job. */
  async run(schema: string, jobs: SqlJob[]): Promise<JobResult[]> {
    await this.init();
    const r = await this.send({ type: 'run', schema, jobs }, SQL_TIMEOUT_MS * Math.max(1, jobs.length));
    if (!r.ok) throw new Error(r.error);
    if (r.type !== 'run') throw new Error('Respuesta inesperada');
    return r.results;
  }
}

export const sqlClient = new SqlClient();
