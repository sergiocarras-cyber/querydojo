import { Suspense, useEffect, useRef, useState } from 'react';
import { NavLink, Outlet, useLocation, useMatch } from 'react-router';
import { ErrorBoundary } from './ErrorBoundary';
import { deadline, formatDuration, useInterview, type InterviewSession } from '../lib/interview/session';
import { Logo } from './Logo';
import { ThemeSwitch } from './ThemeSwitch';

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
  const mainRef = useRef<HTMLElement>(null);
  // A new page starts at the top, like any native app.
  useEffect(() => {
    mainRef.current?.scrollTo({ top: 0 });
  }, [pathname]);
  return (
    <div className="flex h-full flex-col">
      <header className="material-bar relative z-30 flex h-[52px] shrink-0 items-center gap-3 border-b border-ink-700/70 px-4 sm:gap-8 sm:px-6">
        <NavLink to="/" className="flex shrink-0 items-center gap-2" aria-label="QueryDojo, inicio">
          <Logo className="h-[22px] w-[22px]" />
          <span className="hidden text-[15px] font-semibold tracking-[-0.01em] text-ink-100 sm:inline">
            Query<span className="text-vermilion">Dojo</span>
          </span>
        </NavLink>
        <nav className="flex min-w-0 items-center gap-0.5 overflow-x-auto [scrollbar-width:none]">
          {NAV.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              className={({ isActive }) =>
                `shrink-0 rounded-full px-3 py-1 text-[13px] transition-colors duration-200 ${
                  isActive ? 'bg-ink-800 font-medium text-ink-100' : 'text-ink-400 hover:text-ink-100'
                }`
              }
            >
              {item.label}
            </NavLink>
          ))}
        </nav>
        <div className="ml-auto flex shrink-0 items-center gap-3">
          {current && !inInterview && <InterviewClock session={current} />}
          <ThemeSwitch />
        </div>
      </header>
      <main ref={mainRef} className={`min-h-0 flex-1 ${fullHeight ? 'overflow-hidden' : 'overflow-y-auto'}`}>
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
    <div className="flex h-full items-center justify-center">
      <span className="h-5 w-5 animate-spin rounded-full border-2 border-ink-700 border-t-ink-400" aria-label="Cargando" />
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
      className="flex items-center gap-2 rounded-full bg-vermilion-dim px-3 py-1 text-[12px] font-medium tabular-nums text-vermilion transition-colors hover:bg-vermilion/20"
    >
      <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-vermilion" />
      {left > 0 ? `Entrevista · ${formatDuration(left)}` : 'Entrevista · tiempo agotado'}
    </NavLink>
  );
}
