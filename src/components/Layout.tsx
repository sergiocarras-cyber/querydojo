import { NavLink, Outlet, useMatch } from 'react-router';
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
      </header>
      <main className={`min-h-0 flex-1 ${inProblem ? 'overflow-hidden' : 'overflow-y-auto'}`}>
        <Outlet />
      </main>
    </div>
  );
}
