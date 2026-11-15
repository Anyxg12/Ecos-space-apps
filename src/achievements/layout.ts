import type { Achievement } from './types';

export interface PlacedStar {
  a: Achievement;
  x: number;
  y: number;
}

/**
 * Coloca las estrellas (0–1). Usa `position` si existe; si no, una curva suave.
 * En vertical (móvil) gira la constelación 90° para que las etiquetas no se pisen.
 */
export function layoutStars(list: Achievement[], portrait: boolean): PlacedStar[] {
  const n = list.length;
  return list.map((a, i) => {
    const t = n <= 1 ? 0.5 : i / (n - 1);
    const base = a.position ?? { x: 0.12 + t * 0.76, y: 0.5 + Math.sin(t * Math.PI * 2.2) * 0.22 };
    const p = portrait ? { x: 0.14 + (1 - base.y) * 0.72, y: 0.03 + base.x * 0.9 } : base;
    return { a, x: clamp(p.x), y: clamp(p.y) };
  });
}
const clamp = (v: number) => Math.min(0.95, Math.max(0.05, v));

/** Vecino más cercano en una dirección (para las flechas del teclado). */
export function nextInDirection(stars: PlacedStar[], fromId: string, dir: 'left' | 'right' | 'up' | 'down'): string | null {
  const from = stars.find((s) => s.a.id === fromId);
  if (!from) return null;
  let best: PlacedStar | null = null;
  let bestScore = Infinity;
  for (const s of stars) {
    if (s === from) continue;
    const dx = s.x - from.x;
    const dy = s.y - from.y;
    const main = dir === 'left' ? -dx : dir === 'right' ? dx : dir === 'up' ? -dy : dy;
    if (main <= 0.001) continue;
    const cross = dir === 'left' || dir === 'right' ? Math.abs(dy) : Math.abs(dx);
    const score = main + cross * 2;
    if (score < bestScore) {
      bestScore = score;
      best = s;
    }
  }
  if (best) return best.a.id;
  // sin vecino en esa dirección: recorre en orden (izquierda/arriba = anterior)
  const i = stars.indexOf(from);
  const j = dir === 'left' || dir === 'up' ? i - 1 : i + 1;
  return stars[(j + stars.length) % stars.length].a.id;
}
