/** A gate drawn with brackets-like strokes, plus a green "passed" dot. */
export function Logo({ className = '' }: { className?: string }) {
  return (
    <svg viewBox="0 0 32 32" className={className} aria-hidden="true">
      <rect width="32" height="32" rx="7" className="fill-ink-800" />
      <path
        d="M7 9h18M9 9v15M23 9v15M7 14h18"
        className="stroke-vermilion"
        strokeWidth="2.6"
        strokeLinecap="round"
        fill="none"
      />
      <circle cx="16" cy="20" r="2.4" className="fill-jade" />
    </svg>
  );
}
