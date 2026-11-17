import { useEffect, useState } from 'react';
import { NavLink, Outlet, useMatch } from 'react-router';
import { deadline, formatDuration, useInterview, type InterviewSession } from '../lib/interview/session';
import { Logo } from './Logo';

const NAV = [
  { to: '/', label: 'Inicio', end: true },
  { to: '/problems', label: 'Problemas', end: false },
  { to: '/paths', label: 'Rutas', end: false },
  { to: '/interview', label: 'Entrevista', end: false },
  { to: '/progress', label: 'Progreso', end: false },
];

export function Layout() {
  const inProblem = useMatch('/problem/:slug');
  const inInterview = useMatch('/interview');
  const { current } = useInterview();
  const fullHeight = inProblem || (inInterview && current);
  return (
    <div className="flex h-full flex-col">
      <header className="flex h-12 shrink-0 items-center gap-6 border-b border-ink-700 bg-ink-900 px-4">
        <NavLink to="/" className="flex items-center gap-2" aria-label="QueryDojo, inicio">
          <Logo className="h-6 w-6" />
          <span className="font-mono text-sm font-semibold tracking-tight text-ink-100">
            Query<span className="text-vermilion">Dojo</span>
          </span>
        </NavLink>
        <nav className="flex items-center gap-1 text-sm">
          {NAV.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              className={({ isActive }) =>
                `rounded-md px-2.5 py-1 transition-colors ${
                  isActive ? 'bg-ink-800 text-ink-100' : 'text-ink-400 hover:text-ink-100'
                }`
              }
            >
              {item.label}
            </NavLink>
          ))}
        </nav>
        {current && !inInterview && <InterviewClock session={current} />}
      </header>
      <main className={`min-h-0 flex-1 ${fullHeight ? 'overflow-hidden' : 'overflow-y-auto'}`}>
        <Outlet />
      </main>
    </div>
  );
}

/** Reminder of a running interview while you browse elsewhere. */
function InterviewClock({ session }: { session: InterviewSession }) {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const t = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(t);
  }, []);
  const left = deadline(session) - now;
  return (
    <NavLink
      to="/interview"
      className="ml-auto flex items-center gap-2 rounded-md border border-vermilion/40 px-2.5 py-1 font-mono text-xs text-vermilion hover:border-vermilion"
    >
      <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-vermilion" />
      {left > 0 ? `Entrevista · ${formatDuration(left)}` : 'Entrevista · tiempo agotado'}
    </NavLink>
  );
}
