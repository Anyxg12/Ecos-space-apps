import { useEffect, useState } from 'react';

/** prefers-reduced-motion + override por URL (?motion=reduce) para pruebas. */
export function useReducedMotion(): boolean {
  const query = '(prefers-reduced-motion: reduce)';
  const forced = typeof window !== 'undefined' && new URLSearchParams(window.location.search).get('motion') === 'reduce';
  const [reduced, setReduced] = useState(() => forced || (typeof window !== 'undefined' && window.matchMedia(query).matches));
  useEffect(() => {
    if (forced) return;
    const mq = window.matchMedia(query);
    const on = () => setReduced(mq.matches);
    mq.addEventListener('change', on);
    return () => mq.removeEventListener('change', on);
  }, [forced]);
  return reduced;
}
