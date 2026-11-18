import type { ReactNode } from 'react';

/** Segmented control: a track with the selected segment lifted from it. */
export function SegmentedTrack({ children, className = '' }: { children: ReactNode; className?: string }) {
  return (
    <div className={`inline-flex items-center gap-0.5 rounded-[10px] bg-ink-800 p-[3px] ${className}`} role="tablist">
      {children}
    </div>
  );
}

export const segmentClass = (active: boolean) =>
  `relative rounded-[7px] px-3 py-1 text-[13px] font-medium whitespace-nowrap transition-[color,background-color,box-shadow] duration-200 ${
    active ? 'segment-on' : 'text-ink-400 hover:text-ink-100'
  }`;

export function Segment({
  active,
  onClick,
  children,
  title,
}: {
  active: boolean;
  onClick: () => void;
  children: ReactNode;
  title?: string;
}) {
  return (
    <button type="button" role="tab" aria-selected={active} title={title} onClick={onClick} className={segmentClass(active)}>
      {children}
    </button>
  );
}
