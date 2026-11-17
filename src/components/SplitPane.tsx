import { useCallback, useRef, useState, type ReactNode } from 'react';
import { readJson, writeJson } from '../lib/storage/local';

interface Props {
  left: ReactNode;
  right: ReactNode;
  storageKey: string;
  initial?: number; // percentage for the left pane
  direction?: 'horizontal' | 'vertical';
  min?: number;
  max?: number;
}

/** Two panes with a draggable divider; the position is remembered. */
export function SplitPane({ left, right, storageKey, initial = 45, direction = 'horizontal', min = 20, max = 80 }: Props) {
  const [pct, setPct] = useState(() => readJson<number>(`split:${storageKey}`, initial));
  const container = useRef<HTMLDivElement>(null);
  const horizontal = direction === 'horizontal';

  const onPointerDown = useCallback(
    (e: React.PointerEvent) => {
      e.preventDefault();
      const el = container.current;
      if (!el) return;
      const rect = el.getBoundingClientRect();
      let last = pct;
      const move = (ev: PointerEvent) => {
        const raw = horizontal
          ? ((ev.clientX - rect.left) / rect.width) * 100
          : ((ev.clientY - rect.top) / rect.height) * 100;
        last = Math.min(max, Math.max(min, raw));
        setPct(last);
      };
      const up = () => {
        window.removeEventListener('pointermove', move);
        window.removeEventListener('pointerup', up);
        document.body.style.cursor = '';
        document.body.style.userSelect = '';
        writeJson(`split:${storageKey}`, last);
      };
      document.body.style.cursor = horizontal ? 'col-resize' : 'row-resize';
      document.body.style.userSelect = 'none';
      window.addEventListener('pointermove', move);
      window.addEventListener('pointerup', up);
    },
    [pct, horizontal, min, max, storageKey],
  );

  return (
    <div ref={container} className={`flex h-full min-h-0 w-full min-w-0 ${horizontal ? 'flex-row' : 'flex-col'}`}>
      <div className="min-h-0 min-w-0 overflow-hidden" style={{ flexBasis: `${pct}%`, flexShrink: 0 }}>
        {left}
      </div>
      <div
        role="separator"
        aria-orientation={horizontal ? 'vertical' : 'horizontal'}
        onPointerDown={onPointerDown}
        className={`group relative shrink-0 bg-ink-700 hover:bg-vermilion/60 ${
          horizontal ? 'w-px cursor-col-resize' : 'h-px cursor-row-resize'
        }`}
      >
        {/* Wider invisible hit area */}
        <div className={`absolute ${horizontal ? 'inset-y-0 -left-1.5 w-3' : 'inset-x-0 -top-1.5 h-3'}`} />
      </div>
      <div className="min-h-0 min-w-0 flex-1 overflow-hidden">{right}</div>
    </div>
  );
}
