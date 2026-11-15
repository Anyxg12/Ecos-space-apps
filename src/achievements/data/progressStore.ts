import type { Achievement } from '../types';

/**
 * Capa de datos del progreso (sin backend).
 * El componente <MisLogros> NO depende de esto: recibe `achievements` por props.
 * Este repositorio lo usan el host / el hook `useProgress` para calcular esos props.
 */
export interface UnlockMeta {
  /** Fecha ISO AAAA-MM-DD. Por defecto, hoy. */
  date?: string | null;
}

export interface ProgressRepository {
  /** Catálogo con el estado (bloqueado/desbloqueado) y fecha de cada logro. */
  getAchievements(): Promise<Achievement[]>;
  /** Desbloquea un logro. Las metas futuras (`future: true`) no se pueden desbloquear. */
  unlock(id: string, meta?: UnlockMeta): Promise<Achievement[]>;
  /** Borra todo el progreso guardado. */
  reset(): Promise<Achievement[]>;
  /**
   * Contrato de tiempo real: el listener recibe la lista completa cada vez que cambia el progreso
   * (en esta pestaña, en otra pestaña o —en el futuro— desde el servidor). Devuelve la función para cancelar.
   */
  subscribe(listener: ProgressListener): () => void;
}

export type ProgressListener = (achievements: Achievement[]) => void;

interface StoredProgress {
  v: 1;
  unlocked: Record<string, { date: string | null }>;
}

const today = () => {
  const d = new Date(); // fecha local del usuario (no UTC)
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
};

/**
 * Implementación con localStorage (persiste al recargar; por dispositivo y navegador).
 * `catalog` define los logros posibles; su `status`/`date` se ignoran y se calculan a partir de lo guardado.
 */
export class LocalStorageProgressRepository implements ProgressRepository {
  constructor(
    private catalog: Achievement[],
    private key = 'ecos.logros.v1',
    /** Logros desbloqueados de partida (p. ej. el prólogo) si no hay nada guardado. */
    private initial: Record<string, { date: string | null }> = {},
  ) {}

  private listeners = new Set<ProgressListener>();
  private onStorage = (e: StorageEvent) => {
    if (e.key === this.key || e.key === null) this.emit(this.merge(this.read()));
  };
  private emit(list: Achievement[]) {
    this.listeners.forEach((l) => l(list));
  }

  /** Sincroniza entre pestañas con el evento `storage` del navegador. */
  subscribe(listener: ProgressListener) {
    if (this.listeners.size === 0) window.addEventListener('storage', this.onStorage);
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
      if (this.listeners.size === 0) window.removeEventListener('storage', this.onStorage);
    };
  }

  private read(): StoredProgress {
    try {
      const raw = window.localStorage.getItem(this.key);
      if (raw) {
        const p = JSON.parse(raw) as StoredProgress;
        if (p && p.v === 1 && p.unlocked) return p;
      }
    } catch {
      /* almacenamiento bloqueado o JSON corrupto */
    }
    return { v: 1, unlocked: { ...this.initial } };
  }

  private write(p: StoredProgress) {
    try {
      window.localStorage.setItem(this.key, JSON.stringify(p));
    } catch {
      /* sin persistencia (modo privado): el estado vive sólo en memoria de esta sesión */
    }
  }

  private merge(p: StoredProgress): Achievement[] {
    return this.catalog.map((a) => {
      const u = !a.future ? p.unlocked[a.id] : undefined;
      return u ? { ...a, status: 'unlocked', date: u.date } : { ...a, status: 'locked', date: null };
    });
  }

  async getAchievements() {
    return this.merge(this.read());
  }

  async unlock(id: string, meta: UnlockMeta = {}) {
    const p = this.read();
    const def = this.catalog.find((a) => a.id === id);
    if (def && !def.future && !p.unlocked[id]) {
      p.unlocked[id] = { date: meta.date === undefined ? today() : meta.date };
      this.write(p);
      const list = this.merge(p);
      this.emit(list);
      return list;
    }
    return this.merge(p);
  }

  async reset() {
    try {
      window.localStorage.removeItem(this.key);
    } catch {
      /* noop */
    }
    const list = this.merge({ v: 1, unlocked: { ...this.initial } });
    this.emit(list);
    return list;
  }
}

/*
 * La implementación con servidor (Supabase) vive en la app: src/app/repositories/supabase.ts
 * (mismo contrato `ProgressRepository`). Este módulo no depende de Supabase.
 */
