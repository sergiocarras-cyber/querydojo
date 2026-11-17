import { join } from 'node:path';
import { Worker } from 'node:worker_threads';
import { PyCrashError, PyTimeoutError, PY_SUBMIT_TIMEOUT_MS } from '../src/lib/python/client';
import type { PyRunner } from '../src/lib/python/evaluate';

const HARNESS_PATH = join(import.meta.dirname, '../src/lib/python/harness.py');
const WORKER_PATH = join(import.meta.dirname, 'pyWorker.mjs');

/**
 * Pyodide in a Node worker thread running the same harness as the browser.
 * A run that exceeds the timeout kills the worker (like the browser does) and
 * rejects with PyTimeoutError; the next run boots a fresh worker.
 */
export function createNodePyRunner(timeoutMs = PY_SUBMIT_TIMEOUT_MS): { run: PyRunner; close: () => Promise<void> } {
  let worker: Worker | null = null;
  let ready: Promise<void> | null = null;
  let nextId = 1;

  const boot = () => {
    worker = new Worker(WORKER_PATH, { workerData: { harnessPath: HARNESS_PATH } });
    const w = worker;
    ready = new Promise<void>((resolve, reject) => {
      const onMsg = (m: { ready?: boolean }) => {
        if (m.ready) {
          w.off('message', onMsg);
          resolve();
        }
      };
      w.on('message', onMsg);
      w.once('error', reject);
    });
  };

  const run: PyRunner = async (code, spec, packages) => {
    if (!worker) boot();
    await ready;
    const w = worker!;
    const id = nextId++;
    return new Promise<string>((resolve, reject) => {
      const timer = setTimeout(() => {
        w.off('message', onMsg);
        void w.terminate();
        worker = null;
        reject(new PyTimeoutError(timeoutMs));
      }, timeoutMs);
      const onMsg = (m: { id?: number; ok: boolean; json?: string; error?: string; fatal?: boolean }) => {
        if (m.id !== id) return;
        clearTimeout(timer);
        w.off('message', onMsg);
        if (m.ok) {
          resolve(m.json!);
        } else if (m.fatal) {
          void w.terminate();
          worker = null;
          reject(new PyCrashError());
        } else {
          reject(new Error(m.error));
        }
      };
      w.on('message', onMsg);
      w.postMessage({ id, code, spec, packages });
    });
  };

  return {
    run,
    close: async () => {
      await worker?.terminate();
    },
  };
}
