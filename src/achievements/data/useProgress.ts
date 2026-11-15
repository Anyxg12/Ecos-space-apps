import { useCallback, useEffect, useState } from 'react';
import type { Achievement } from '../types';
import type { ProgressRepository, UnlockMeta } from './progressStore';

/** Hook opcional: conecta un `ProgressRepository` con <MisLogros achievements={…} />. */
export function useProgress(repo: ProgressRepository) {
  const [achievements, setAchievements] = useState<Achievement[] | null>(null);
  const [error, setError] = useState<Error | null>(null);
  useEffect(() => {
    let alive = true;
    repo.getAchievements().then((a) => alive && setAchievements(a), (e: Error) => alive && setError(e));
    // tiempo real: otra pestaña (o el servidor, en el futuro) actualiza la constelación al instante
    let unsub = () => {};
    try {
      unsub = repo.subscribe((a) => alive && setAchievements(a));
    } catch (e) {
      setError(e as Error);
    }
    return () => {
      alive = false;
      unsub();
    };
  }, [repo]);
  const unlock = useCallback((id: string, meta?: UnlockMeta) => repo.unlock(id, meta).then(setAchievements, setError), [repo]);
  const reset = useCallback(() => repo.reset().then(setAchievements, setError), [repo]);
  return { achievements, loading: achievements === null && !error, error, unlock, reset };
}
