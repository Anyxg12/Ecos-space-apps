import type { ExplorerProfile } from './types';

const KEY = 'ecos.prologue.v1';

interface StoredPrologue {
  seen: boolean;
  profile: ExplorerProfile | null;
}

function safeGet(): StoredPrologue | null {
  try {
    const raw = window.localStorage.getItem(KEY);
    return raw ? (JSON.parse(raw) as StoredPrologue) : null;
  } catch {
    return null; // modo privado / almacenamiento bloqueado
  }
}

function safeSet(value: StoredPrologue) {
  try {
    window.localStorage.setItem(KEY, JSON.stringify(value));
  } catch {
    /* sin persistencia: el prólogo simplemente se mostrará de nuevo */
  }
}

export const prologueStorage = {
  hasSeenIntro: () => safeGet()?.seen === true,
  getProfile: () => safeGet()?.profile ?? null,
  markSeen: (profile: ExplorerProfile | null) => safeSet({ seen: true, profile: profile ?? safeGet()?.profile ?? null }),
  /** «Volver a ver la introducción»: conserva el perfil, olvida que se vio. */
  allowReplay: () => safeSet({ seen: false, profile: safeGet()?.profile ?? null }),
  clear: () => {
    try {
      window.localStorage.removeItem(KEY);
    } catch {
      /* noop */
    }
  },
};
