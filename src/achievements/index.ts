/**
 * ECOS · «Mis logros: Constelación personal» — API pública.
 * Copiar la carpeta src/achievements/ al proyecto principal e importar desde aquí.
 */
export { MisLogros, INTRO_TIMINGS } from './MisLogros';
export type { Achievement, Badge, ArchiveCard, ImageAsset, ConstellationLink, MisLogrosProps, AchievementsTheme, AchievementStatus } from './types';
export { DEMO_ACHIEVEMENTS, DEMO_BADGES, DEMO_ARCHIVE, DEMO_LINKS } from './demoData';
export { AssetImage } from './components/AssetImage';
export { EcosLogo } from './components/EcosLogo';
export { LocalStorageProgressRepository, SupabaseProgressRepository, type ProgressRepository, type ProgressListener, type UnlockMeta } from './data/progressStore';
export { useProgress } from './data/useProgress';
