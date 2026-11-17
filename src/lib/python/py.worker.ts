/// <reference lib="webworker" />
import { loadPyodide, version, type PyodideInterface } from 'pyodide';
import harnessSource from './harness.py?raw';
import type { PyRequest, PyResponse } from './pyProtocol';

// Pyodide's runtime and packages come from the free jsDelivr CDN; the browser
// caches them after the first download.
const INDEX_URL = `https://cdn.jsdelivr.net/pyodide/v${version}/full/`;

let pyodide: Promise<PyodideInterface> | null = null;
const loadedPackages = new Set<string>();

function post(msg: PyResponse) {
  self.postMessage(msg);
}

function boot(): Promise<PyodideInterface> {
  pyodide ??= (async () => {
    post({ type: 'progress', message: 'Descargando Python (Pyodide)…' });
    const py = await loadPyodide({ indexURL: INDEX_URL });
    post({ type: 'progress', message: 'Preparando el corrector…' });
    py.runPython(harnessSource);
    return py;
  })();
  return pyodide;
}

async function ensurePackages(py: PyodideInterface, packages: string[]) {
  const missing = packages.filter((p) => !loadedPackages.has(p));
  if (missing.length === 0) return;
  post({ type: 'progress', message: `Cargando ${missing.join(', ')}…` });
  await py.loadPackage(missing);
  missing.forEach((p) => loadedPackages.add(p));
}

self.onmessage = async (event: MessageEvent<PyRequest>) => {
  const req = event.data;
  try {
    const py = await boot();
    if (req.type === 'init') {
      await ensurePackages(py, req.packages);
      post({ type: 'result', id: req.id, ok: true, json: '' });
      return;
    }
    await ensurePackages(py, req.packages);
    const fn = py.globals.get(req.fn);
    try {
      const json = fn(...req.args) as string;
      post({ type: 'result', id: req.id, ok: true, json });
    } finally {
      fn.destroy();
    }
  } catch (err) {
    const message = (err as Error).message ?? String(err);
    // A fatal error (e.g. WebAssembly stack overflow) leaves Pyodide unusable:
    // tell the client so it replaces this worker.
    const fatal = /fatal|Maximum call stack/i.test(message);
    post({ type: 'result', id: req.id, ok: false, error: message, fatal });
  }
};
