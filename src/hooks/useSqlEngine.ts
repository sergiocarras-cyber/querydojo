import { useEffect, useState } from 'react';
import { sqlClient } from '../lib/sql/client';

/** True while PGlite is booting (WASM download / init). */
export function useSqlLoading(): boolean {
  const [loading, setLoading] = useState(sqlClient.loading);
  useEffect(() => sqlClient.onLoadingChange(setLoading), []);
  return loading;
}
