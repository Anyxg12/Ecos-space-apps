import { useEffect, useState } from 'react';

export function usePrefersReducedMotion() {
  const q = '(prefers-reduced-motion: reduce)';
  const [v, setV] = useState(() => typeof window !== 'undefined' && window.matchMedia(q).matches);
  useEffect(() => {
    const mq = window.matchMedia(q);
    const on = () => setV(mq.matches);
    mq.addEventListener('change', on);
    return () => mq.removeEventListener('change', on);
  }, []);
  return v;
}
