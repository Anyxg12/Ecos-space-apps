/**
 * Clave secreta LOCAL del explorador.
 * - Nunca se guarda la clave: sólo una sal aleatoria y un hash PBKDF2-SHA-256 (Web Crypto).
 * - Sirve para desbloquear el perfil EN ESTE DISPOSITIVO. No hay recuperación ni sincronización entre dispositivos.
 * - Cuando exista backend (Supabase — Pendiente) se podrá usar para vincular el progreso; hoy no sale del navegador.
 */
const KEY = 'ecos.secret.v1';
const SESSION = 'ecos.secret.unlocked';
const ITER = 150_000;

export interface StoredSecret {
  v: 1;
  algo: 'PBKDF2-SHA-256';
  iter: number;
  salt: string; // base64
  hash: string; // base64
  createdAt: string;
}

export const SECRET_MIN = 6;
export const SECRET_MAX = 64;

const b64 = (u: Uint8Array) => btoa(String.fromCharCode(...u));
const unb64 = (s: string) => Uint8Array.from(atob(s), (c) => c.charCodeAt(0));

export function cryptoAvailable() {
  return typeof crypto !== 'undefined' && !!crypto.subtle && typeof crypto.getRandomValues === 'function';
}

async function derive(secret: string, salt: Uint8Array, iter: number) {
  const base = await crypto.subtle.importKey('raw', new TextEncoder().encode(secret.normalize('NFC')), 'PBKDF2', false, ['deriveBits']);
  const bits = await crypto.subtle.deriveBits({ name: 'PBKDF2', hash: 'SHA-256', salt: salt as BufferSource, iterations: iter }, base, 256);
  return new Uint8Array(bits);
}

function read(): StoredSecret | null {
  try {
    const s = JSON.parse(localStorage.getItem(KEY) ?? 'null') as StoredSecret | null;
    return s && s.v === 1 && s.salt && s.hash ? s : null;
  } catch {
    return null;
  }
}

export const secretStore = {
  has: () => read() !== null,
  info: () => {
    const s = read();
    return s ? { createdAt: s.createdAt, algo: s.algo, iter: s.iter } : null;
  },
  /** Crea o reemplaza la clave. */
  async set(secret: string) {
    if (secret.length < SECRET_MIN || secret.length > SECRET_MAX) throw new Error('longitud');
    const salt = crypto.getRandomValues(new Uint8Array(16));
    const hash = await derive(secret, salt, ITER);
    const rec: StoredSecret = { v: 1, algo: 'PBKDF2-SHA-256', iter: ITER, salt: b64(salt), hash: b64(hash), createdAt: new Date().toISOString().slice(0, 10) };
    localStorage.setItem(KEY, JSON.stringify(rec));
    secretStore.markUnlocked();
  },
  /** Comprueba la clave (comparación de tiempo constante). */
  async verify(secret: string) {
    const s = read();
    if (!s) return false;
    const want = unb64(s.hash);
    const got = await derive(secret, unb64(s.salt), s.iter);
    let diff = want.length ^ got.length;
    for (let i = 0; i < want.length; i++) diff |= want[i] ^ (got[i] ?? 0);
    const ok = diff === 0;
    if (ok) secretStore.markUnlocked();
    return ok;
  },
  isUnlocked: () => {
    if (!read()) return true;
    try {
      return sessionStorage.getItem(SESSION) === '1';
    } catch {
      return false;
    }
  },
  markUnlocked() {
    try {
      sessionStorage.setItem(SESSION, '1');
    } catch {
      /* */
    }
  },
  lock() {
    try {
      sessionStorage.removeItem(SESSION);
    } catch {
      /* */
    }
  },
  /** Quita la clave (el progreso NO se borra). */
  clear() {
    try {
      localStorage.removeItem(KEY);
      sessionStorage.removeItem(SESSION);
    } catch {
      /* */
    }
  },
};
