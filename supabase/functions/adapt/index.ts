// ECOS · Edge Function `adapt` (Supabase / Deno).
// Recibe un hecho verificado de la NASA + intereses + modo y devuelve una analogía corta generada con Gemini.
// La clave GEMINI_API_KEY vive SOLO en los secretos de Supabase (nunca en el frontend ni en el repo).
import { buildUserPrompt, cacheKey, checkAnalogy, createRateLimiter, isAllowedOrigin, parseModelText, SYSTEM_PROMPT, validateInput } from './logic.ts';

const GEMINI_API_KEY = Deno.env.get('GEMINI_API_KEY') ?? '';
const GEMINI_MODEL = Deno.env.get('GEMINI_MODEL') ?? 'gemini-3.5-flash-lite';
const SUPABASE_URL = Deno.env.get('SUPABASE_URL') ?? '';
const SERVICE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '';
const EXTRA_ORIGINS = (Deno.env.get('ALLOWED_ORIGINS') ?? '').split(',').map((s) => s.trim()).filter(Boolean);
const TIMEOUT_MS = 8000;
const allow = createRateLimiter(20, 60_000);

function cors(origin: string | null): Record<string, string> {
  return {
    'Access-Control-Allow-Origin': isAllowedOrigin(origin, EXTRA_ORIGINS) ? origin! : 'https://anyxg12.github.io',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
    Vary: 'Origin',
  };
}
const json = (status: number, body: unknown, h: Record<string, string>) =>
  new Response(JSON.stringify(body), { status, headers: { ...h, 'Content-Type': 'application/json' } });

/** Caché en la tabla `analogy_cache` vía PostgREST con la service role (sólo en el servidor). */
async function cacheGet(key: string): Promise<string | null> {
  if (!SUPABASE_URL || !SERVICE_KEY) return null;
  try {
    const r = await fetch(`${SUPABASE_URL}/rest/v1/analogy_cache?key=eq.${key}&select=analogy`, {
      headers: { apikey: SERVICE_KEY, Authorization: `Bearer ${SERVICE_KEY}` },
    });
    if (!r.ok) return null;
    const rows = (await r.json()) as { analogy: string }[];
    return rows[0]?.analogy ?? null;
  } catch {
    return null;
  }
}
async function cachePut(key: string, factId: string, mode: string, interests: string[], analogy: string) {
  if (!SUPABASE_URL || !SERVICE_KEY) return;
  try {
    await fetch(`${SUPABASE_URL}/rest/v1/analogy_cache`, {
      method: 'POST',
      headers: { apikey: SERVICE_KEY, Authorization: `Bearer ${SERVICE_KEY}`, 'Content-Type': 'application/json', Prefer: 'resolution=ignore-duplicates' },
      body: JSON.stringify({ key, fact_id: factId, mode, interests, analogy, model: GEMINI_MODEL }),
    });
  } catch {
    /* la caché es opcional */
  }
}

async function askGemini(prompt: string): Promise<string> {
  const ctrl = new AbortController();
  const t = setTimeout(() => ctrl.abort(), TIMEOUT_MS);
  try {
    const r = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent`, {
      method: 'POST',
      signal: ctrl.signal,
      headers: { 'Content-Type': 'application/json', 'x-goog-api-key': GEMINI_API_KEY },
      body: JSON.stringify({
        systemInstruction: { parts: [{ text: SYSTEM_PROMPT }] },
        contents: [{ role: 'user', parts: [{ text: prompt }] }],
        generationConfig: { temperature: 0.7, maxOutputTokens: 400, responseMimeType: 'application/json' },
      }),
    });
    if (!r.ok) throw new Error(`gemini ${r.status}`);
    const data = await r.json();
    const parts = data?.candidates?.[0]?.content?.parts ?? [];
    return parts.map((p: { text?: string }) => p.text ?? '').join('');
  } finally {
    clearTimeout(t);
  }
}

Deno.serve(async (req) => {
  const origin = req.headers.get('origin');
  const h = cors(origin);
  if (req.method === 'OPTIONS') return new Response('ok', { headers: h });
  if (req.method !== 'POST') return json(405, { error: 'method' }, h);
  if (origin && !isAllowedOrigin(origin, EXTRA_ORIGINS)) return json(403, { error: 'origin' }, h);

  const ip = (req.headers.get('x-forwarded-for') ?? '').split(',')[0].trim() || 'unknown';
  if (!allow(ip)) return json(429, { error: 'rate_limited' }, h);

  let body: unknown;
  try {
    const raw = await req.text();
    if (raw.length > 4000) return json(413, { error: 'too_large' }, h);
    body = JSON.parse(raw);
  } catch {
    return json(400, { error: 'json' }, h);
  }
  const v = validateInput(body);
  if (!v.ok) return json(400, { error: `invalid:${v.error}` }, h);
  const input = v.value;

  const key = await cacheKey(input);
  const cached = await cacheGet(key);
  if (cached) return json(200, { analogy: cached, cached: true, aiGenerated: true }, h);

  if (!GEMINI_API_KEY) return json(503, { error: 'not_configured' }, h);
  try {
    // hasta 2 intentos: si la primera salida no pasa el post-chequeo, se pide otra
    for (let attempt = 0; attempt < 2; attempt++) {
      const text = await askGemini(buildUserPrompt(input));
      const check = checkAnalogy(parseModelText(text), input.factText);
      if (check.ok) {
        await cachePut(key, input.factId, input.mode, [...input.interests].sort(), check.value);
        return json(200, { analogy: check.value, cached: false, aiGenerated: true }, h);
      }
      console.warn('analogy rejected', check.reason);
    }
    return json(422, { error: 'rejected' }, h);
  } catch (e) {
    console.error('adapt error', String(e));
    return json(502, { error: 'upstream' }, h);
  }
});
