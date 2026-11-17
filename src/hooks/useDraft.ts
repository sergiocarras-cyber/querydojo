import { useCallback, useState } from 'react';
import { readJson, removeKey, writeJson } from '../lib/storage/local';

/** Editor contents for one problem, persisted in localStorage. */
export function useDraft(problemId: string, starter: string) {
  const key = `draft:${problemId}`;
  const [code, setCodeState] = useState(() => readJson<string>(key, starter));

  const setCode = useCallback(
    (value: string) => {
      setCodeState(value);
      writeJson(key, value);
    },
    [key],
  );

  const reset = useCallback(() => {
    setCodeState(starter);
    removeKey(key);
  }, [key, starter]);

  return { code, setCode, reset };
}
