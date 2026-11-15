import { LocalStorageProgressRepository } from '../achievements/data/progressStore';
import type { ProgressRepository } from '../achievements/data/progressStore';
import { APP_ACHIEVEMENTS } from './catalog';
import { backendEnabled } from './backend/config';
import { SupabaseProgressRepository, SyncedProgressRepository } from './repositories/supabase';

/** Progreso local (localStorage; sincroniza pestañas). Siempre es la fuente de verdad de la interfaz. */
export const localProgressRepo = new LocalStorageProgressRepository(APP_ACHIEVEMENTS, 'ecos.app.progress.v1');

/**
 * Repositorio único de progreso de la app. Sin backend = sólo local (igual que la versión 1.0).
 * Con backend (VITE_SUPABASE_URL + VITE_SUPABASE_ANON_KEY) = local + copia en Supabase en segundo plano.
 */
export const progressRepo: ProgressRepository = backendEnabled
  ? new SyncedProgressRepository(localProgressRepo, new SupabaseProgressRepository(APP_ACHIEVEMENTS))
  : localProgressRepo;

/** Qué logros ya «vio» el usuario en Mis logros (para encender los nuevos al entrar). */
const SEEN_KEY = 'ecos.app.logrosSeen.v1';
export const seenStore = {
  get(): string[] {
    try {
      return JSON.parse(localStorage.getItem(SEEN_KEY) ?? '[]') as string[];
    } catch {
      return [];
    }
  },
  set(ids: string[]) {
    try {
      localStorage.setItem(SEEN_KEY, JSON.stringify(ids));
    } catch {
      /* almacenamiento no disponible */
    }
  },
  clear() {
    try {
      localStorage.removeItem(SEEN_KEY);
    } catch {
      /* */
    }
  },
};
