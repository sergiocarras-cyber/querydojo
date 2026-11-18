import type { ReactNode } from 'react';

const TONES = {
  ok: 'bg-jade/10 text-jade',
  bad: 'bg-rose/10 text-rose',
  error: 'bg-amber/10 text-amber',
};

export function Banner({ tone, title, children }: { tone: keyof typeof TONES; title: string; children?: ReactNode }) {
  return (
    <div className={`rounded-xl px-4 py-3 ${TONES[tone]}`}>
      <div className="text-[15px] font-semibold tracking-[-0.01em]">{title}</div>
      {children && <div className="mt-1 text-ink-200">{children}</div>}
    </div>
  );
}
