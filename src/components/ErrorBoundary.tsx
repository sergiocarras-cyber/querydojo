import { Component, type ReactNode } from 'react';

interface State {
  error: Error | null;
}

/**
 * Last line of defence: a render error shows a recoverable message instead of
 * a blank page. A failed lazy chunk (e.g. after a redeploy) is fixed by reloading.
 */
export class ErrorBoundary extends Component<{ children: ReactNode }, State> {
  state: State = { error: null };

  static getDerivedStateFromError(error: Error): State {
    return { error };
  }

  render() {
    const { error } = this.state;
    if (!error) return this.props.children;
    const chunk = /dynamically imported module|Failed to fetch|Importing a module script failed/i.test(error.message);
    return (
      <div className="flex h-full items-center justify-center bg-ink-950 p-6">
        <div className="max-w-lg rounded-lg border border-rose/40 bg-ink-900 p-6">
          <p className="text-sm text-rose">
            {chunk ? 'No se pudo cargar esta parte de la app.' : 'Algo ha fallado al mostrar esta página.'}
          </p>
          <p className="mt-2 text-xs break-words text-ink-400">{error.message}</p>
          <p className="mt-3 text-xs text-ink-500">
            Tu progreso está a salvo en este navegador.{' '}
            {chunk && 'Probablemente hay una versión nueva publicada: recarga la página.'}
          </p>
          <div className="mt-4 flex gap-2">
            <button
              onClick={() => window.location.reload()}
              className="rounded-full bg-vermilion px-3 py-1.5 text-xs font-medium text-white transition duration-200 active:scale-[0.98]"
            >
              Recargar
            </button>
            <button
              onClick={() => {
                window.location.hash = '#/';
                this.setState({ error: null });
              }}
              className="rounded-full border border-ink-700 px-3 py-1.5 text-xs text-ink-200 transition-colors duration-200"
            >
              Ir al inicio
            </button>
          </div>
        </div>
      </div>
    );
  }
}
