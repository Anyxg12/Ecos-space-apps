/**
 * Lógica pura de la función `adapt` (sin red ni Deno.*): validación, prompt, clave de caché y
 * post-chequeo de la salida de la IA. Se prueba con `node supabase/tests/adapt.test.mjs`.
 */
export const INTERESTS: Record<string, string> = {
  futbol: 'Fútbol',
  videojuegos: 'Videojuegos',
  arte: 'Arte',
  animales: 'Animales',
  musica: 'Música',
  tecnologia: 'Tecnología',
  ciencia: 'Ciencia',
  robotica: 'Robótica',
  naturaleza: 'Naturaleza',
  historia: 'Historia',
  cine: 'Cine',
  cocina: 'Cocina',
};
export const MODES = ['junior', 'explorer', 'discovery'] as const;
export type Mode = (typeof MODES)[number];

export interface AdaptInput {
  factId: string;
  factText: string;
  sourceUrl: string;
  interests: string[];
  mode: Mode;
}

/** Valida y normaliza el cuerpo. Devuelve el input limpio o un mensaje de error. */
export function validateInput(body: unknown): { ok: true; value: AdaptInput } | { ok: false; error: string } {
  if (!body || typeof body !== 'object') return { ok: false, error: 'body' };
  const b = body as Record<string, unknown>;
  const factId = typeof b.factId === 'string' ? b.factId.trim() : '';
  const factText = typeof b.factText === 'string' ? b.factText.trim() : '';
  const sourceUrl = typeof b.sourceUrl === 'string' ? b.sourceUrl.trim() : '';
  if (!/^[a-z0-9_.:-]{1,80}$/i.test(factId)) return { ok: false, error: 'factId' };
  if (factText.length < 10 || factText.length > 600) return { ok: false, error: 'factText' };
  let host = '';
  try {
    const u = new URL(sourceUrl);
    if (u.protocol !== 'https:') return { ok: false, error: 'sourceUrl' };
    host = u.hostname;
  } catch {
    return { ok: false, error: 'sourceUrl' };
  }
  // sólo fuentes oficiales de la NASA (mismo criterio que docs/LINKS.md)
  if (!(host === 'nasa.gov' || host.endsWith('.nasa.gov'))) return { ok: false, error: 'sourceUrl' };
  if (!Array.isArray(b.interests) || b.interests.length < 1 || b.interests.length > 5) return { ok: false, error: 'interests' };
  const interests = [...new Set(b.interests.map(String))];
  if (!interests.every((i) => i in INTERESTS)) return { ok: false, error: 'interests' };
  if (typeof b.mode !== 'string' || !(MODES as readonly string[]).includes(b.mode)) return { ok: false, error: 'mode' };
  return { ok: true, value: { factId, factText, sourceUrl, interests, mode: b.mode as Mode } };
}

const TONE: Record<Mode, string> = {
  junior: 'Público: niñas y niños de 7 a 11 años. Frases muy cortas, palabras sencillas, tono cálido y alegre.',
  explorer: 'Público: adolescentes de 12 a 17 años. Tono dinámico, cercano, como un videojuego o un reto.',
  discovery: 'Público: adultos. Tono sobrio y evocador, como la cartela de un museo.',
};

export const SYSTEM_PROMPT = [
  'Eres el guía educativo de ECOS, una experiencia sobre misiones de la NASA.',
  'Tu única tarea: escribir UNA analogía de 1 o 2 frases, en español, que relacione el HECHO VERIFICADO con los intereses del usuario.',
  'Reglas estrictas:',
  '- No cambies, añadas ni inventes datos, cifras, fechas, nombres, citas ni fuentes.',
  '- No escribas ningún número ni cifra que no aparezca literalmente en el HECHO VERIFICADO (mejor no uses números).',
  '- No hagas conversiones ni cálculos (nada de "equivale a N canchas").',
  '- La analogía es una comparación imaginativa, no un dato nuevo. No pongas comillas ni diálogos.',
  '- Máximo 45 palabras. Sin emojis.',
  'Responde SOLO con JSON: {"analogy": "..."}',
].join('\n');

export function buildUserPrompt(i: AdaptInput): string {
  const labels = i.interests.map((x) => INTERESTS[x]).join(', ');
  return `${TONE[i.mode]}\nIntereses del usuario: ${labels}.\nHECHO VERIFICADO (no lo modifiques): ${i.factText}`;
}

/** Clave de caché estable: factId + intereses ordenados + modo (+ hash del texto, por si cambia el hecho). */
export async function cacheKey(i: AdaptInput): Promise<string> {
  const raw = `${i.factId}|${[...i.interests].sort().join(',')}|${i.mode}|${i.factText}`;
  const buf = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(raw));
  return [...new Uint8Array(buf)].map((b) => b.toString(16).padStart(2, '0')).join('');
}

const NUM_WORDS = /\b(cero|dos|tres|cuatro|cinco|seis|siete|ocho|nueve|diez|once|doce|veinte|treinta|cien|cientos?|mil|millón|millones|docena)\b/i;

/**
 * Post-chequeo: rechaza salidas con números que no estén en el hecho, demasiado largas, con comillas
 * (citas inventadas) o con cifras escritas en letra que el hecho no contiene.
 */
export function checkAnalogy(analogy: unknown, factText: string): { ok: true; value: string } | { ok: false; reason: string } {
  if (typeof analogy !== 'string') return { ok: false, reason: 'type' };
  const a = analogy.replace(/\s+/g, ' ').trim();
  if (a.length < 15 || a.length > 320) return { ok: false, reason: 'length' };
  const factNums = new Set((factText.match(/\d+(?:[.,]\d+)*/g) ?? []).flatMap((n) => [n, n.replace(/[.,]/g, '')]));
  const outNums = a.match(/\d+(?:[.,]\d+)*/g) ?? [];
  for (const n of outNums) if (!factNums.has(n) && !factNums.has(n.replace(/[.,]/g, ''))) return { ok: false, reason: `number:${n}` };
  const w = a.match(NUM_WORDS);
  if (w && !new RegExp(`\\b${w[0]}\\b`, 'i').test(factText)) return { ok: false, reason: `numword:${w[0]}` };
  if (/["“”«»]/.test(a)) return { ok: false, reason: 'quote' };
  if (/https?:\/\//i.test(a)) return { ok: false, reason: 'url' };
  return { ok: true, value: a };
}

/** Extrae {analogy} del texto que devuelve Gemini (tolera ```json ... ```). */
export function parseModelText(text: string): unknown {
  const t = text.trim().replace(/^```(?:json)?\s*/i, '').replace(/```$/, '').trim();
  try {
    return (JSON.parse(t) as { analogy?: unknown }).analogy;
  } catch {
    return undefined;
  }
}

/** Orígenes permitidos (CORS). Se pueden añadir más con la variable ALLOWED_ORIGINS (separados por coma). */
export function isAllowedOrigin(origin: string | null, extra: string[] = []): boolean {
  if (!origin) return false;
  return ['https://anyxg12.github.io', 'http://localhost:5173', 'http://127.0.0.1:5173', 'http://localhost:4175', ...extra].includes(origin);
}

/** Limitador simple en memoria (por instancia): `max` peticiones por `windowMs` y por IP. */
export function createRateLimiter(max = 20, windowMs = 60_000) {
  const hits = new Map<string, number[]>();
  return (ip: string, now = Date.now()): boolean => {
    const list = (hits.get(ip) ?? []).filter((t) => now - t < windowMs);
    if (list.length >= max) {
      hits.set(ip, list);
      return false;
    }
    list.push(now);
    hits.set(ip, list);
    if (hits.size > 5000) hits.clear();
    return true;
  };
}
