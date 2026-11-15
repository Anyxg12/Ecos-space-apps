/**
 * Backend OPCIONAL (Supabase). Sólo se activa si existen VITE_SUPABASE_URL y VITE_SUPABASE_ANON_KEY al compilar.
 * La anon key es pública por diseño (la protege RLS en la base de datos); NUNCA poner aquí la service role
 * ni la clave de Gemini, que viven sólo en el servidor (secretos de Supabase).
 * `?backend=0` en la URL fuerza el modo local aunque el backend esté configurado.
 */
const env = import.meta.env as Record<string, string | undefined>;
export const SUPABASE_URL = (env.VITE_SUPABASE_URL ?? '').trim().replace(/\/+$/, '');
export const SUPABASE_ANON_KEY = (env.VITE_SUPABASE_ANON_KEY ?? '').trim();

const forcedOff = typeof window !== 'undefined' && new URLSearchParams(window.location.search).get('backend') === '0';
export const backendEnabled = !forcedOff && /^https:\/\//.test(SUPABASE_URL) && SUPABASE_ANON_KEY.length > 20;
