import type { SupabaseClient } from '@supabase/supabase-js';
import { backendEnabled, SUPABASE_ANON_KEY, SUPABASE_URL } from './config';

let clientP: Promise<SupabaseClient | null> | null = null;
let sessionP: Promise<string | null> | null = null;

/** Cliente Supabase (carga diferida: si el backend está apagado, la librería ni se descarga). */
export function getSupabase(): Promise<SupabaseClient | null> {
  if (!backendEnabled) return Promise.resolve(null);
  clientP ??= import('@supabase/supabase-js')
    .then(({ createClient }) => createClient(SUPABASE_URL, SUPABASE_ANON_KEY, { auth: { persistSession: true, autoRefreshToken: true, storageKey: 'ecos.sb.auth' } }))
    .catch(() => null);
  return clientP;
}

/**
 * Sesión ANÓNIMA (sin correo ni datos personales). Devuelve el user id o null si el backend no está disponible.
 * Nota: la cuenta anónima vive en este navegador; recuperarla en otro dispositivo sigue «Pendiente».
 */
export function ensureSession(): Promise<string | null> {
  sessionP ??= (async () => {
    const sb = await getSupabase();
    if (!sb) return null;
    try {
      const { data } = await sb.auth.getSession();
      if (data.session?.user) return data.session.user.id;
      const { data: d, error } = await sb.auth.signInAnonymously();
      if (error) throw error;
      return d.user?.id ?? null;
    } catch (e) {
      console.info('[ECOS] backend no disponible, modo local:', (e as Error).message);
      sessionP = null; // reintenta en la próxima llamada
      return null;
    }
  })();
  return sessionP;
}
