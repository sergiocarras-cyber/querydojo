import type { HarnessFn, PyRequest, PyResponse } from './pyProtocol';

export const PY_RUN_TIMEOUT_MS = 5_000;
export const PY_SUBMIT_TIMEOUT_MS = 10_000;

export class PyTimeoutError extends Error {
  constructor(ms: number) {
    super(
      `Tu código superó el límite de ${ms / 1000} s y se detuvo. ¿Un bucle infinito o una solución demasiado lenta para los casos grandes? El entorno de Python se está reiniciando.`,
    );
    this.name = 'PyTimeoutError';
  }
}

export type PyEngineState =
  | { status: 'idle' }
  | { status: 'loading'; message: string }
  | { status: 'ready' }
  | { status: 'error'; message: string };

export class PyCrashError extends Error {
  constructor() {
    super(
      'Python se quedó sin pila (normalmente por una recursión muy profunda o una estructura enorme encadenada). El entorno se está reiniciando; prueba una versión iterativa.',
    );
    this.name = 'PyCrashError';
  }
}

type Pending = { resolve: (json: string) => void; reject: (e: Error) => void };
type Distribute<T> = T extends unknown ? Omit<T, 'id'> : never;

/**
 * Owns the Pyodide worker. Python can't be interrupted from JS without
 * cross-origin isolation (unavailable on GitHub Pages), so a timeout
 * terminates the worker and the next call boots a fresh one.
 */
class PyClient {
  private worker: Worker | null = null;
  private pending = new Map<number, Pending>();
  private nextId = 1;
  private ready: Promise<void> | null = null;
  private listeners = new Set<(s: PyEngineState) => void>();
  state: PyEngineState = { status: 'idle' };

  subscribe(fn: (s: PyEngineState) => void): () => void {
    this.listeners.add(fn);
    return () => this.listeners.delete(fn);
  }

  private setState(state: PyEngineState) {
    this.state = state;
    this.listeners.forEach((fn) => fn(state));
  }

  private spawn(): Worker {
    const worker = new Worker(new URL('./py.worker.ts', import.meta.url), { type: 'module' });
    worker.onmessage = (e: MessageEvent<PyResponse>) => {
      const msg = e.data;
      if (msg.type === 'progress') {
        if (this.state.status !== 'ready') this.setState({ status: 'loading', message: msg.message });
        return;
      }
      const p = this.pending.get(msg.id);
      if (!p) return;
      this.pending.delete(msg.id);
      if (msg.ok) {
        p.resolve(msg.json);
      } else if (msg.fatal) {
        p.reject(new PyCrashError());
        this.reset();
        void this.init().catch(() => {});
      } else {
        p.reject(new Error(msg.error));
      }
    };
    worker.onerror = (e) => {
      const error = new Error(e.message || 'El worker de Python falló');
      this.reset(error);
      this.setState({ status: 'error', message: error.message });
    };
    return worker;
  }

  private send(req: Distribute<PyRequest>, timeoutMs?: number): Promise<string> {
    const worker = (this.worker ??= this.spawn());
    const id = this.nextId++;
    return new Promise<string>((resolve, reject) => {
      let timer: ReturnType<typeof setTimeout> | undefined;
      this.pending.set(id, {
        resolve: (v) => {
          clearTimeout(timer);
          resolve(v);
        },
        reject: (e) => {
          clearTimeout(timer);
          reject(e);
        },
      });
      if (timeoutMs) {
        timer = setTimeout(() => {
          this.reset(new PyTimeoutError(timeoutMs));
          // Boot the replacement right away so the next run is quick.
          void this.init().catch(() => {});
        }, timeoutMs);
      }
      worker.postMessage({ ...req, id } as PyRequest);
    });
  }

  /** Kills the worker; pending calls fail with `reason`. */
  reset(reason: Error = new Error('Entorno de Python reiniciado')) {
    this.worker?.terminate();
    this.worker = null;
    this.ready = null;
    for (const p of this.pending.values()) p.reject(reason);
    this.pending.clear();
    this.setState({ status: 'idle' });
  }

  /** Boots Pyodide (and packages). No timeout: the first download can be slow. */
  init(packages: string[] = []): Promise<void> {
    if (!this.ready) {
      if (this.state.status !== 'loading') this.setState({ status: 'loading', message: 'Arrancando Python…' });
      const ready = this.send({ type: 'init', packages }).then(() => this.setState({ status: 'ready' }));
      this.ready = ready;
      ready.catch((e: Error) => {
        if (this.ready === ready) this.ready = null;
        this.setState({ status: 'error', message: e.message });
      });
    }
    return this.ready;
  }

  async call(fn: HarnessFn, args: string[], packages: string[], timeoutMs: number): Promise<string> {
    await this.init(packages);
    return this.send({ type: 'call', fn, args, packages }, timeoutMs);
  }
}

export const pyClient = new PyClient();
