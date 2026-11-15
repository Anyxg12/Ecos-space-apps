/**
 * Ranking «Top exploradores».
 * IMPORTANTE: las filas de ejemplo son DATOS DE DEMOSTRACIÓN (seudónimos inventados, no personas reales).
 * Sólo la fila «tú» usa datos reales: las estrellas desbloqueadas en este dispositivo.
 * Un ranking global necesita un servidor (Supabase) — Pendiente.
 */
/** Estrellas que se pueden ganar hoy (sin «marte-todos», que es una meta futura bloqueada). */
export const STAR_IDS = [
  'horizonte',
  'spirit-historia',
  'spirit-actividad',
  'spirit-legado',
  'opportunity-historia',
  'opportunity-actividad',
  'opportunity-legado',
  'alsep-historia',
  'alsep-actividad',
  'alsep-legado',
] as const;

export interface RankRow {
  alias: string;
  stars: number;
  /** misiones completas (legado registrado) */
  missions: number;
  me?: boolean;
  demo?: boolean;
}

/** Seudónimos ficticios de demostración. */
export const DEMO_EXPLORERS: RankRow[] = [
  { alias: 'Polvo Rojo (demo)', stars: 10, missions: 3, demo: true },
  { alias: 'Eco-7 (demo)', stars: 9, missions: 3, demo: true },
  { alias: 'Regolito (demo)', stars: 8, missions: 2, demo: true },
  { alias: 'Gusev Kid (demo)', stars: 7, missions: 2, demo: true },
  { alias: 'Antena Sur (demo)', stars: 5, missions: 1, demo: true },
  { alias: 'Meridiani (demo)', stars: 4, missions: 1, demo: true },
  { alias: 'Sismo Lunar (demo)', stars: 3, missions: 1, demo: true },
  { alias: 'Órbita 9 (demo)', stars: 2, missions: 0, demo: true },
  { alias: 'Cometa (demo)', stars: 1, missions: 0, demo: true },
];

/** Inserta al usuario (con sus estrellas reales) en la tabla de demostración. En empate, el usuario va primero. */
export function buildRanking(alias: string | undefined, isUnlocked: (id: string) => boolean) {
  const stars = STAR_IDS.filter((id) => isUnlocked(id)).length;
  const missions = ['spirit-legado', 'opportunity-legado', 'alsep-legado'].filter((id) => isUnlocked(id)).length;
  const me: RankRow = { alias: alias?.trim() || 'Tú', stars, missions, me: true };
  const rows = [...DEMO_EXPLORERS, me].sort((a, b) => b.stars - a.stars || (a.me ? -1 : b.me ? 1 : 0));
  return { rows, me, position: rows.indexOf(me) + 1, total: STAR_IDS.length };
}
