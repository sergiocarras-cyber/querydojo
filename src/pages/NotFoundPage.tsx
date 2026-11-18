import { Link } from 'react-router';
import { useTitle } from '../hooks/useTitle';

export function NotFoundPage() {
  useTitle('No encontrado');
  return (
    <div className="mx-auto max-w-3xl px-6 py-16 font-mono">
      <p className="text-vermilion">ERROR: relation "page" does not exist</p>
      <Link to="/" className="mt-4 inline-block text-sm text-sky hover:underline">
        ← Volver al inicio
      </Link>
    </div>
  );
}
