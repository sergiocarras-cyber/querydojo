import type { ReactNode } from 'react';

const TONES = {
  ok: 'border-jade/40 bg-jade/10 text-jade',
  bad: 'border-rose/40 bg-rose/10 text-rose',
  error: 'border-amber/40 bg-amber/10 text-amber',
};

export function Banner({ tone, title, children }: { tone: keyof typeof TONES; title: string; children?: ReactNode }) {
  return (
    <div className={`rounded-md border px-3 py-2 ${TONES[tone]}`}>
      <div className="text-sm font-semibold">{title}</div>
      {children && <div className="mt-1 text-ink-200">{children}</div>}
    </div>
  );
}
