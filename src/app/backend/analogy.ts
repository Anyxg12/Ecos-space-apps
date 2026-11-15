import { backendEnabled, SUPABASE_ANON_KEY, SUPABASE_URL } from './config';
import type { AgeGroup, InterestId } from '../../prologue/state/types';

export interface AnalogyRequest {
  factId: string;
  factText: string;
  sourceUrl: string;
  interests: InterestId[];
  mode: AgeGroup;
}

const mem = new Map<string, Promise<string | null>>();
const SS_KEY = 'ecos.analogies.v1';
const readSS = (): Record<string, string> => {
  try {
    return JSON.parse(sessionStorage.getItem(SS_KEY) ?? '{}') as Record<string, string>;
  } catch {
    return {};
  }
};

/**
 * Pide a la Edge Function `adapt` una analogía (IA) para un hecho verificado. Nunca lanza:
 * si el backend está apagado, falla, tarda más de 9 s o la IA no pasa el post-chequeo, devuelve null
 * y la interfaz simplemente no muestra la analogía.
 */
export function fetchAnalogy(req: AnalogyRequest): Promise<string | null> {
  if (!backendEnabled || !req.interests.length) return Promise.resolve(null);
  const k = `${req.factId}|${[...req.interests].sort().join(',')}|${req.mode}`;
  const ss = readSS();
  if (ss[k]) return Promise.resolve(ss[k]);
  if (mem.has(k)) return mem.get(k)!;
  const p = (async () => {
    const ctrl = new AbortController();
    const t = setTimeout(() => ctrl.abort(), 9000);
    try {
      const r = await fetch(`${SUPABASE_URL}/functions/v1/adapt`, {
        method: 'POST',
        signal: ctrl.signal,
        headers: { 'Content-Type': 'application/json', apikey: SUPABASE_ANON_KEY, Authorization: `Bearer ${SUPABASE_ANON_KEY}` },
        body: JSON.stringify({ ...req, interests: req.interests.slice(0, 5) }),
      });
      if (!r.ok) return null;
      const data = (await r.json()) as { analogy?: unknown };
      if (typeof data.analogy !== 'string' || !data.analogy.trim()) return null;
      const a = data.analogy.trim().slice(0, 320);
      try {
        sessionStorage.setItem(SS_KEY, JSON.stringify({ ...readSS(), [k]: a }));
      } catch {
        /* sin sessionStorage */
      }
      return a;
    } catch {
      return null;
    } finally {
      clearTimeout(t);
    }
  })();
  mem.set(k, p);
  p.then((v) => v === null && mem.delete(k)); // los fallos no se quedan en caché
  return p;
}
