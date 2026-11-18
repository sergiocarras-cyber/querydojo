// Node worker thread hosting Pyodide + harness.py, so the test runner can
// terminate runaway code exactly like the browser does.
import { readFileSync } from 'node:fs';
import { parentPort, workerData } from 'node:worker_threads';
import { loadPyodide } from 'pyodide';

// The harness captures the user's print() itself. Anything else Pyodide writes
// (e.g. while this worker is being terminated after a timeout) would hit a
// closed file descriptor and spam the test output with "fd" errors.
const quiet = { batched: () => {} };
const py = await loadPyodide();
py.setStdout(quiet);
py.setStderr(quiet);
py.runPython(readFileSync(workerData.harnessPath, 'utf8'));

parentPort.on('message', async ({ id, fn: name, args, packages }) => {
  try {
    if (packages.length) await py.loadPackage(packages, { messageCallback: () => {} });
    const fn = py.globals.get(name);
    try {
      parentPort.postMessage({ id, ok: true, json: fn(...args) });
    } finally {
      fn.destroy();
    }
  } catch (err) {
    const error = String(err?.message ?? err);
    parentPort.postMessage({ id, ok: false, error, fatal: /fatal|Maximum call stack/i.test(error) });
  }
});
parentPort.postMessage({ ready: true });
