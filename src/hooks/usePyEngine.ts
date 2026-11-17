import { useEffect, useState } from 'react';
import { pyClient, type PyEngineState } from '../lib/python/client';

/** Pyodide engine state; booting starts when a Python problem is opened. */
export function usePyEngine(packages: string[]): PyEngineState {
  const [state, setState] = useState(pyClient.state);
  const key = packages.join(',');
  useEffect(() => {
    const unsubscribe = pyClient.subscribe(setState);
    pyClient.init(key ? key.split(',') : []).catch(() => {});
    return unsubscribe;
  }, [key]);
  return state;
}
