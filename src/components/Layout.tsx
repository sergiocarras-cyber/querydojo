import { Suspense, useEffect, useState } from 'react';
import { NavLink, Outlet, useLocation, useMatch } from 'react-router';
import { ErrorBoundary } from './ErrorBoundary';
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
  const { pathname } = useLocation();
  return (
    <div className="flex h-full flex-col">
      <header className="flex h-12 shrink-0 items-center gap-3 border-b sm:gap-6 border-ink-700 bg-ink-900 px-4">
        <NavLink to="/" className="flex items-center gap-2" aria-label="QueryDojo, inicio">
          <Logo className="h-6 w-6" />
          <span className="hidden font-mono text-sm font-semibold tracking-tight text-ink-100 sm:inline">
            Query<span className="text-vermilion">Dojo</span>
          </span>
        </NavLink>
        <nav className="flex min-w-0 items-center gap-1 overflow-x-auto text-sm [scrollbar-width:none]">
          {NAV.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              className={({ isActive }) =>
                `shrink-0 rounded-md px-2.5 py-1 transition-colors ${
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
        {/* Keyed by path so an error on one page doesn't stick after navigating away. */}
        <ErrorBoundary key={pathname}>
          <Suspense fallback={<PageLoading />}>
            <Outlet />
          </Suspense>
        </ErrorBoundary>
      </main>
    </div>
  );
}

function PageLoading() {
  return (
    <div className="flex h-full items-center justify-center font-mono text-xs text-ink-500">
      <span className="animate-pulse">cargando…</span>
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
