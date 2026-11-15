/**
 * STUB — Supabase (Pendiente). NO está conectado: no hay URL, claves ni cliente instalado.
 * Este archivo sólo fija la forma que tendrán las implementaciones con servidor.
 *
 * TODO (cuando se integre Supabase):
 *  - Instalar @supabase/supabase-js y leer URL + anon key de variables de entorno (nunca en el repo).
 *  - Tabla `profiles` (id uuid = auth.uid(), alias, age_group, interests[]); sin correo, nombre real, nacimiento ni ubicación.
 *  - Tabla `progress` (user_id, achievement_id, date) con RLS por usuario; mismos ids de logros que hoy.
 *  - Vincular el progreso local existente al iniciar sesión (subir `ecos.app.progress.v1` sin duplicar puntos).
 *  - La clave secreta local NO se sube: el acceso entre dispositivos usará la autenticación de Supabase.
 *  - Ranking global: vista agregada (alias + estrellas) con moderación de seudónimos.
 */
import type { ExplorerProfile } from '../../prologue/state/types';
import type { ProfileRepository } from './index';
/** El stub de progreso ya existe junto a la versión local (mismo contrato `ProgressRepository`). */
export { SupabaseProgressRepository } from '../../achievements/data/progressStore';

const pending = () => Promise.reject(new Error('Supabase: Pendiente (no conectado)'));

export class SupabaseProfileRepository implements ProfileRepository {
  getProfile(): Promise<ExplorerProfile | null> {
    return pending();
  }
  saveProfile(_p: ExplorerProfile): Promise<void> {
    return pending();
  }
  hasSecret(): Promise<boolean> {
    return pending();
  }
  setSecret(_s: string): Promise<void> {
    return pending();
  }
  verifySecret(_s: string): Promise<boolean> {
    return pending();
  }
  clear(): Promise<void> {
    return pending();
  }
}
