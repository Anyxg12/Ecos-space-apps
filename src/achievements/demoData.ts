import type { Achievement, ArchiveCard, Badge, ConstellationLink } from './types';

/**
 * DATOS DE DEMOSTRACIÓN — no son datos reales de ningún usuario.
 * Los textos describen ACCIONES EN ECOS (no hechos históricos sobre la misión Spirit).
 * Las fechas son ficticias. Sustituir por los datos del perfil del usuario.
 */
export const DEMO_ACHIEVEMENTS: Achievement[] = [
  {
    id: 'horizonte',
    title: 'Cruzaste el horizonte',
    activity: 'Completar el prólogo de ECOS',
    date: '2026-11-10',
    description: 'Atravesaste el horizonte de ECOS y abriste el archivo por primera vez.',
    status: 'unlocked',
    position: { x: 0.12, y: 0.66 },
    magnitude: 0.85,
  },
  {
    id: 'spirit-historia',
    title: 'Historia de Spirit',
    activity: 'Leer la historia de Spirit en ECOS',
    date: '2026-11-12',
    description: 'Recorriste de principio a fin la historia de Spirit en el archivo de ECOS.',
    status: 'unlocked',
    position: { x: 0.32, y: 0.38 },
    magnitude: 1,
  },
  {
    id: 'spirit-actividad',
    title: 'Actividad de Spirit',
    activity: 'Completar la actividad interactiva de Spirit',
    date: null,
    description: 'Resolviste la actividad de la misión Spirit en ECOS.',
    status: 'unlocked',
    position: { x: 0.5, y: 0.64 },
    magnitude: 1,
  },
  {
    id: 'spirit-legado',
    title: 'Huellas de Spirit',
    activity: 'Completar la misión Spirit (etapa «Legado»)',
    date: '2026-11-14',
    description: 'Cerraste la etapa final de la misión Spirit en ECOS y ganaste su insignia y su ficha de archivo.',
    status: 'unlocked',
    position: { x: 0.66, y: 0.32 },
    magnitude: 1.4,
    badgeId: 'huellas-spirit',
  },
  {
    id: 'marte-todos',
    title: 'Todos los artefactos de Marte',
    activity: 'Completar todas las misiones de Marte en ECOS',
    date: null,
    description: 'Meta futura. Todavía no se puede conseguir: las demás misiones de Marte aún no están en ECOS.',
    status: 'locked',
    future: true,
    position: { x: 0.88, y: 0.56 },
    magnitude: 1.15,
  },
];

export const DEMO_BADGES: Badge[] = [
  { id: 'huellas-spirit', name: 'Huellas de Spirit', provisional: true, achievementId: 'spirit-legado', icon: 'tracks' },
];

export const DEMO_ARCHIVE: ArchiveCard[] = [
  {
    id: 'ficha-spirit',
    title: 'Ficha de Spirit',
    achievementId: 'spirit-legado',
    summary: 'Ficha de archivo del rover Spirit. Su contenido se completará con información verificada de fuentes oficiales.',
  },
];

export const DEMO_LINKS: ConstellationLink[] = [
  { from: 'horizonte', to: 'spirit-historia' },
  { from: 'spirit-historia', to: 'spirit-actividad' },
  { from: 'spirit-actividad', to: 'spirit-legado' },
  { from: 'spirit-legado', to: 'marte-todos' },
];
