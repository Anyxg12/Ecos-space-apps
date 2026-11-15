/**
 * Contratos de datos de ECOS. Hoy todo vive en este navegador (localStorage);
 * mañana se podrán cambiar por implementaciones con servidor sin tocar las pantallas.
 */
import type { ExplorerProfile } from '../../prologue/state/types';
import { prologueStorage } from '../../prologue';
import { secretStore } from '../../prologue/state/secretKey';
import { backendEnabled } from '../backend/config';
import { SupabaseProfileRepository } from './supabase';
export type { ProgressRepository } from '../../achievements/data/progressStore';

export interface ProfileRepository {
  getProfile(): Promise<ExplorerProfile | null>;
  saveProfile(p: ExplorerProfile): Promise<void>;
  /** ¿Hay clave secreta? */
  hasSecret(): Promise<boolean>;
  /** Crea/reemplaza la clave (sólo se guarda sal + hash). */
  setSecret(secret: string): Promise<void>;
  /** Desbloquea con la clave. */
  verifySecret(secret: string): Promise<boolean>;
  clear(): Promise<void>;
}

/** Implementación actual: sólo este dispositivo. */
export class LocalProfileRepository implements ProfileRepository {
  async getProfile() {
    return prologueStorage.getProfile();
  }
  async saveProfile(p: ExplorerProfile) {
    prologueStorage.markSeen(p);
  }
  async hasSecret() {
    return secretStore.has();
  }
  async setSecret(secret: string) {
    await secretStore.set(secret);
  }
  async verifySecret(secret: string) {
    return secretStore.verify(secret);
  }
  async clear() {
    secretStore.clear();
    prologueStorage.clear();
  }
}

export const profileRepo: ProfileRepository = new LocalProfileRepository();

/** Copia remota del perfil (sólo con backend). */
export const remoteProfileRepo: ProfileRepository | null = backendEnabled ? new SupabaseProfileRepository() : null;

/** Guarda el perfil en el servidor en segundo plano (nunca bloquea ni rompe la app). */
export function syncProfile(p: ExplorerProfile): Promise<boolean> {
  if (!remoteProfileRepo) return Promise.resolve(false);
  return remoteProfileRepo.saveProfile(p).then(
    () => true,
    () => false,
  );
}
