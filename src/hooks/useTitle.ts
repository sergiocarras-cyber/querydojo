import { useEffect } from 'react';

/** Browser tab title for the current page. */
export function useTitle(title?: string) {
  useEffect(() => {
    document.title = title ? `${title} · QueryDojo` : 'QueryDojo · entrena para la entrevista técnica';
  }, [title]);
}
