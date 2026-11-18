import { useSyncExternalStore } from 'react';
import { readJson, writeJson } from './storage/local';

/**
 * Appearance: follow the system (default), or force light / dark.
 * The resolved theme is written to <html data-theme>, which the CSS tokens read.
 * index.html applies it before the first paint to avoid a flash.
 */
export type ThemePreference = 'system' | 'light' | 'dark';
export type ResolvedTheme = 'light' | 'dark';

const KEY = 'theme';
const media = typeof window !== 'undefined' ? window.matchMedia('(prefers-color-scheme: light)') : null;

let preference: ThemePreference = readJson<ThemePreference>(KEY, 'system');
const listeners = new Set<() => void>();

function resolve(pref: ThemePreference): ResolvedTheme {
  if (pref === 'system') return media?.matches ? 'light' : 'dark';
  return pref;
}

let resolved: ResolvedTheme = resolve(preference);

function apply() {
  resolved = resolve(preference);
  if (typeof document !== 'undefined') {
    document.documentElement.dataset.theme = resolved;
    document.querySelector('meta[name="theme-color"]')?.setAttribute('content', resolved === 'light' ? '#f5f5f7' : '#0a0a0c');
  }
  listeners.forEach((fn) => fn());
}

media?.addEventListener('change', () => {
  if (preference === 'system') apply();
});
apply();

export function setThemePreference(next: ThemePreference) {
  preference = next;
  writeJson(KEY, next);
  apply();
}

function subscribe(fn: () => void) {
  listeners.add(fn);
  return () => listeners.delete(fn);
}

export function useTheme(): { preference: ThemePreference; resolved: ResolvedTheme } {
  const pref = useSyncExternalStore(subscribe, () => preference, () => preference);
  const res = useSyncExternalStore(subscribe, () => resolved, () => resolved);
  return { preference: pref, resolved: res };
}
