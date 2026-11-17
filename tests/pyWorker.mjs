// Node worker thread hosting Pyodide + harness.py, so the test runner can
// terminate runaway code exactly like the browser does.
import { readFileSync } from 'node:fs';
import { parentPort, workerData } from 'node:worker_threads';
import { loadPyodide } from 'pyodide';

const py = await loadPyodide();
py.runPython(readFileSync(workerData.harnessPath, 'utf8'));

parentPort.on('message', async ({ id, code, spec, packages }) => {
  try {
    if (packages.length) await py.loadPackage(packages, { messageCallback: () => {} });
    const fn = py.globals.get('run_suite');
    try {
      parentPort.postMessage({ id, ok: true, json: fn(code, spec) });
    } finally {
      fn.destroy();
    }
  } catch (err) {
    const error = String(err?.message ?? err);
    parentPort.postMessage({ id, ok: false, error, fatal: /fatal|Maximum call stack/i.test(error) });
  }
});
parentPort.postMessage({ ready: true });
