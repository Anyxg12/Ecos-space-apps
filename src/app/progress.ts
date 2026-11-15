import { LocalStorageProgressRepository } from '../achievements/data/progressStore';
import { APP_ACHIEVEMENTS } from './catalog';

/** Repositorio único de progreso de la app (localStorage; sincroniza pestañas). Sustituible por Supabase. */
export const progressRepo = new LocalStorageProgressRepository(APP_ACHIEVEMENTS, 'ecos.app.progress.v1');

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
