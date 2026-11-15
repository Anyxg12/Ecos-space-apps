// Pruebas unitarias de la lógica de la Edge Function `adapt` (validación, post-chequeo, caché, CORS, rate limit).
// Uso: node supabase/tests/adapt.test.mjs   (Node 22.18+ / 24, que ejecuta .ts directamente)
import test from 'node:test';
import assert from 'node:assert/strict';
import { validateInput, checkAnalogy, cacheKey, isAllowedOrigin, createRateLimiter, parseModelText, buildUserPrompt } from '../functions/adapt/logic.ts';

const base = {
  factId: 'spirit.actual_distance',
  factText: 'Spirit recorrió 7,73 km (4,8 millas) en Marte, mucho más que los 600 metros previstos.',
  sourceUrl: 'https://science.nasa.gov/mission/mer-spirit/',
  interests: ['futbol', 'musica'],
  mode: 'junior',
};

test('validateInput acepta un cuerpo correcto', () => {
  const r = validateInput(base);
  assert.equal(r.ok, true);
});
test('validateInput rechaza intereses fuera de la lista, demasiados o vacíos', () => {
  assert.equal(validateInput({ ...base, interests: ['hackeo'] }).ok, false);
  assert.equal(validateInput({ ...base, interests: [] }).ok, false);
  assert.equal(validateInput({ ...base, interests: ['futbol', 'arte', 'cine', 'cocina', 'musica', 'ciencia'] }).ok, false);
});
test('validateInput rechaza modo desconocido, texto corto/largo, id raro y fuentes no NASA', () => {
  assert.equal(validateInput({ ...base, mode: 'admin' }).ok, false);
  assert.equal(validateInput({ ...base, factText: 'corto' }).ok, false);
  assert.equal(validateInput({ ...base, factText: 'x'.repeat(601) }).ok, false);
  assert.equal(validateInput({ ...base, factId: 'a b; drop' }).ok, false);
  assert.equal(validateInput({ ...base, sourceUrl: 'https://example.com/nasa.gov' }).ok, false);
  assert.equal(validateInput({ ...base, sourceUrl: 'https://evilnasa.gov/' }).ok, false);
  assert.equal(validateInput({ ...base, sourceUrl: 'http://www.nasa.gov/' }).ok, false);
  assert.equal(validateInput({ ...base, sourceUrl: 'https://www.jpl.nasa.gov/news/x/' }).ok, true);
  assert.equal(validateInput(null).ok, false);
});
test('checkAnalogy acepta números presentes en el hecho y texto sin cifras', () => {
  assert.equal(checkAnalogy('Como un delantero que juega mucho más que el partido previsto, Spirit siguió rodando.', base.factText).ok, true);
  assert.equal(checkAnalogy('Spirit hizo sus 7,73 km como quien corre la cancha una y otra vez.', base.factText).ok, true);
  assert.equal(checkAnalogy('Planeaban 600 metros y Spirit siguió como una canción que no termina.', base.factText).ok, true);
});
test('checkAnalogy rechaza cifras inventadas, cifras en letra, citas, URLs y longitudes raras', () => {
  assert.equal(checkAnalogy('Es como recorrer 400 canchas de fútbol seguidas.', base.factText).ok, false);
  assert.equal(checkAnalogy('Es como recorrer mil canchas de fútbol seguidas.', base.factText).ok, false);
  assert.equal(checkAnalogy('Como dijo el capitán: «nunca te rindas», Spirit siguió rodando por Marte.', base.factText).ok, false);
  assert.equal(checkAnalogy('Mira https://example.com para ver una cancha enorme en Marte.', base.factText).ok, false);
  assert.equal(checkAnalogy('corto', base.factText).ok, false);
  assert.equal(checkAnalogy('a'.repeat(400), base.factText).ok, false);
  assert.equal(checkAnalogy(42, base.factText).ok, false);
});
test('cacheKey es estable ante el orden de intereses y cambia con modo', async () => {
  const a = await cacheKey({ ...base, interests: ['futbol', 'musica'] });
  const b = await cacheKey({ ...base, interests: ['musica', 'futbol'] });
  const c = await cacheKey({ ...base, mode: 'discovery' });
  assert.equal(a, b);
  assert.notEqual(a, c);
  assert.match(a, /^[0-9a-f]{64}$/);
});
test('parseModelText tolera bloques ```json y JSON roto', () => {
  assert.equal(parseModelText('```json\n{"analogy":"hola mundo"}\n```'), 'hola mundo');
  assert.equal(parseModelText('no json'), undefined);
});
test('CORS sólo para GitHub Pages y localhost', () => {
  assert.equal(isAllowedOrigin('https://anyxg12.github.io'), true);
  assert.equal(isAllowedOrigin('http://localhost:5173'), true);
  assert.equal(isAllowedOrigin('https://evil.example'), false);
  assert.equal(isAllowedOrigin(null), false);
  assert.equal(isAllowedOrigin('https://mi-dominio.app', ['https://mi-dominio.app']), true);
});
test('rate limit por IP', () => {
  const allow = createRateLimiter(3, 1000);
  assert.deepEqual([allow('1', 0), allow('1', 1), allow('1', 2), allow('1', 3)], [true, true, true, false]);
  assert.equal(allow('2', 3), true);
  assert.equal(allow('1', 1500), true);
});
test('el prompt incluye el hecho literal y el tono del modo', () => {
  const p = buildUserPrompt({ ...base, mode: 'explorer' });
  assert.ok(p.includes(base.factText));
  assert.ok(p.includes('Fútbol, Música'));
  assert.ok(p.includes('12 a 17'));
});
