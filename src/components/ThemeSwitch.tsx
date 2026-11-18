import type { ReactNode } from 'react';
import { setThemePreference, useTheme, type ThemePreference } from '../lib/theme';

const OPTIONS: { id: ThemePreference; label: string; icon: ReactNode }[] = [
  {
    id: 'system',
    label: 'Automático (como el sistema)',
    icon: (
      <svg viewBox="0 0 16 16" className="h-3.5 w-3.5" aria-hidden>
        <circle cx="8" cy="8" r="5.5" fill="none" stroke="currentColor" strokeWidth="1.4" />
        <path d="M8 2.5a5.5 5.5 0 0 1 0 11z" fill="currentColor" />
      </svg>
    ),
  },
  {
    id: 'light',
    label: 'Claro',
    icon: (
      <svg viewBox="0 0 16 16" className="h-3.5 w-3.5" aria-hidden>
        <circle cx="8" cy="8" r="3" fill="currentColor" />
        <path
          d="M8 1v2M8 13v2M1 8h2M13 8h2M3 3l1.4 1.4M11.6 11.6 13 13M3 13l1.4-1.4M11.6 4.4 13 3"
          stroke="currentColor"
          strokeWidth="1.4"
          strokeLinecap="round"
        />
      </svg>
    ),
  },
  {
    id: 'dark',
    label: 'Oscuro',
    icon: (
      <svg viewBox="0 0 16 16" className="h-3.5 w-3.5" aria-hidden>
        <path d="M13.5 9.6A6 6 0 0 1 6.4 2.5a6 6 0 1 0 7.1 7.1z" fill="currentColor" />
      </svg>
    ),
  },
];

/** Compact appearance picker for the navigation bar. */
export function ThemeSwitch() {
  const { preference } = useTheme();
  return (
    <div className="inline-flex items-center gap-0.5 rounded-full bg-ink-800/80 p-[3px]" role="radiogroup" aria-label="Apariencia">
      {OPTIONS.map((o) => (
        <button
          key={o.id}
          type="button"
          role="radio"
          aria-checked={preference === o.id}
          aria-label={o.label}
          title={o.label}
          onClick={() => setThemePreference(o.id)}
          className={`flex h-6 w-6 items-center justify-center rounded-full transition-colors duration-200 ${
            preference === o.id ? 'segment-on' : 'text-ink-500 hover:text-ink-100'
          }`}
        >
          {o.icon}
        </button>
      ))}
    </div>
  );
}
