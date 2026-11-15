/**
 * Implementaciones con servidor (Supabase) — OPCIONALES.
 * Sólo se usan si el backend está configurado (ver src/app/backend/config.ts). Si no hay backend o falla,
 * la app sigue con las versiones locales (localStorage), que son siempre la fuente de verdad de la interfaz.
 *
 *  - Tabla `profiles` (id = auth.uid(), nickname, mode, interests[]): sin correo, nombre real, nacimiento ni ubicación.
 *  - Tabla `progress` (user_id, achievement_id, completed_at) con RLS por usuario; mismos ids de logros que hoy.
 *  - La clave secreta local NO se sube: sigue sólo en este dispositivo (sal + hash).
 */
import type { Achievement } from '../../achievements/types';
import type { ProgressListener, ProgressRepository, UnlockMeta } from '../../achievements/data/progressStore';
import type { AgeGroup, ExplorerProfile, InterestId } from '../../prologue/state/types';
import { secretStore } from '../../prologue/state/secretKey';
import { ensureSession, getSupabase } from '../backend/client';
import type { ProfileRepository } from './index';

async function ready() {
  const uid = await ensureSession();
  const sb = uid ? await getSupabase() : null;
  return sb && uid ? { sb, uid } : null;
}
const NOT_READY = new Error('Supabase no disponible');

/** Progreso remoto puro (tabla `progress`). */
export class SupabaseProgressRepository implements ProgressRepository {
  constructor(private catalog: Achievement[]) {}
  private listeners = new Set<ProgressListener>();

  /** ids desbloqueados en el servidor con su fecha (AAAA-MM-DD). */
  async remoteUnlocked(): Promise<Record<string, string>> {
    const c = await ready();
    if (!c) throw NOT_READY;
    const { data, error } = await c.sb.from('progress').select('achievement_id, completed_at');
    if (error) throw error;
    return Object.fromEntries((data ?? []).map((r: { achievement_id: string; completed_at: string }) => [r.achievement_id, String(r.completed_at).slice(0, 10)]));
  }
  private merge(u: Record<string, string>): Achievement[] {
    return this.catalog.map((a) => (!a.future && u[a.id] ? { ...a, status: 'unlocked', date: u[a.id] } : { ...a, status: 'locked', date: null }));
  }
  async getAchievements() {
    return this.merge(await this.remoteUnlocked());
  }
  /** Sube varios logros de una vez (idempotente: la PK evita duplicar puntos). */
  async push(ids: { id: string; date?: string | null }[]) {
    const valid = ids.filter(({ id }) => this.catalog.some((a) => a.id === id && !a.future));
    if (!valid.length) return;
    const c = await ready();
    if (!c) throw NOT_READY;
    const rows = valid.map(({ id, date }) => ({ user_id: c.uid, achievement_id: id, ...(date ? { completed_at: `${date}T12:00:00Z` } : {}) }));
    const { error } = await c.sb.from('progress').upsert(rows, { onConflict: 'user_id,achievement_id', ignoreDuplicates: true });
    if (error) throw error;
  }
  async unlock(id: string, meta: UnlockMeta = {}) {
    await this.push([{ id, date: meta.date }]);
    const list = await this.getAchievements();
    this.listeners.forEach((l) => l(list));
    return list;
  }
  async reset() {
    const c = await ready();
    if (!c) throw NOT_READY;
    const { error } = await c.sb.from('progress').delete().eq('user_id', c.uid);
    if (error) throw error;
    const list = this.merge({});
    this.listeners.forEach((l) => l(list));
    return list;
  }
  subscribe(listener: ProgressListener) {
    this.listeners.add(listener);
    return () => void this.listeners.delete(listener);
  }
}

/**
 * Local primero + sincronización en segundo plano: la interfaz responde al instante con localStorage
 * y, si hay backend, cada logro se copia al servidor. Al arrancar se fusionan ambos lados (sin duplicar).
 * Cualquier error de red se ignora en silencio: el progreso local nunca se pierde.
 */
export class SyncedProgressRepository implements ProgressRepository {
  constructor(private local: ProgressRepository, private remote: SupabaseProgressRepository) {
    void this.initialSync();
  }
  private async initialSync() {
    try {
      const remote = await this.remote.remoteUnlocked();
      const localList = await this.local.getAchievements();
      const localIds = new Set(localList.filter((a) => a.status === 'unlocked').map((a) => a.id));
      for (const [id, date] of Object.entries(remote)) if (!localIds.has(id)) await this.local.unlock(id, { date });
      await this.remote.push(localList.filter((a) => a.status === 'unlocked' && !(a.id in remote)).map((a) => ({ id: a.id, date: a.date })));
    } catch {
      /* sin backend: modo local */
    }
  }
  getAchievements() {
    return this.local.getAchievements();
  }
  async unlock(id: string, meta?: UnlockMeta) {
    const list = await this.local.unlock(id, meta);
    const a = list.find((x) => x.id === id);
    if (a?.status === 'unlocked') this.remote.push([{ id, date: a.date }]).catch(() => {});
    return list;
  }
  async reset() {
    this.remote.reset().catch(() => {});
    return this.local.reset();
  }
  subscribe(l: ProgressListener) {
    return this.local.subscribe(l);
  }
}

const MODES: AgeGroup[] = ['junior', 'explorer', 'discovery'];
/** Último resultado al guardar el seudónimo en el servidor (para avisar si ya está en uso). */
export const nicknameStatus = { conflict: false };

/** Perfil remoto (tabla `profiles`). La clave secreta sigue siendo local. */
export class SupabaseProfileRepository implements ProfileRepository {
  async getProfile(): Promise<ExplorerProfile | null> {
    const c = await ready();
    if (!c) throw NOT_READY;
    const { data, error } = await c.sb.from('profiles').select('nickname, mode, interests, created_at').eq('id', c.uid).maybeSingle();
    if (error) throw error;
    if (!data) return null;
    return {
      ageGroup: MODES.includes(data.mode) ? data.mode : 'explorer',
      interests: (data.interests ?? []) as InterestId[],
      createdAt: data.created_at,
      ...(data.nickname ? { alias: data.nickname } : {}),
    };
  }
  async saveProfile(p: ExplorerProfile) {
    const c = await ready();
    if (!c) throw NOT_READY;
    const nick = p.alias?.trim().slice(0, 20);
    const row = { id: c.uid, mode: p.ageGroup, interests: p.interests.slice(0, 5), nickname: nick && nick.length >= 2 ? nick : null };
    let { error } = await c.sb.from('profiles').upsert(row, { onConflict: 'id' });
    nicknameStatus.conflict = false;
    if (error?.code === '23505') {
      // seudónimo ya usado por otra persona: se guarda el perfil sin seudónimo y se avisa en el ranking
      nicknameStatus.conflict = true;
      ({ error } = await c.sb.from('profiles').upsert({ ...row, nickname: null }, { onConflict: 'id' }));
    }
    if (error) throw error;
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
    const c = await ready();
    if (!c) throw NOT_READY;
    await c.sb.from('progress').delete().eq('user_id', c.uid);
    await c.sb.from('profiles').delete().eq('id', c.uid);
  }
}
