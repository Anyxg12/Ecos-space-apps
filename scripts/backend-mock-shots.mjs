// Capturas del backend con respuestas SIMULADAS (Playwright intercepta Supabase; no toca servidores reales).
// Requiere un build con VITE_SUPABASE_URL=https://mock-ecos.supabase.co y VITE_SUPABASE_ANON_KEY de prueba.
// Uso: OUT=screenshots/backend PW=<playwright-core> node scripts/backend-mock-shots.mjs
const { chromium } = await import(process.env.PW ?? 'playwright-core');
import { mkdirSync } from 'node:fs';
const BASE = process.env.BASE_URL ?? 'http://localhost:4175/';
const OUT = (process.env.OUT ?? 'screenshots/backend') + '/';
mkdirSync(OUT, { recursive: true });
const browser = await chromium.launch({ executablePath: process.env.CHROME ?? '/usr/bin/google-chrome', args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--no-sandbox'] });
const wait = (ms) => new Promise((r) => setTimeout(r, ms));
const problems = [];
const calls = { adapt: [], progress: 0, profiles: 0, rpc: 0, signup: 0 };
const ANALOGY = {
  junior: 'Armar a Spirit es como preparar a tu equipo de fútbol antes del gran partido: cada pieza tiene su puesto.',
  explorer: 'Como desbloquear el equipo completo de tu personaje antes de la misión final: cada pieza suma una habilidad.',
  discovery: 'Como un taller de luthier donde cada pieza se ajusta antes del primer acorde, Spirit se armó para su gira marciana.',
};
const FAKE_UID = '00000000-0000-4000-8000-000000000001';
async function mockSupabase(ctx, { failAdapt = false } = {}) {
  await ctx.route('https://mock-ecos.supabase.co/**', async (route) => {
    const req = route.request();
    const url = new URL(req.url());
    const cors = { 'access-control-allow-origin': '*', 'access-control-allow-headers': '*', 'access-control-allow-methods': '*' };
    if (req.method() === 'OPTIONS') return route.fulfill({ status: 204, headers: cors });
    const json = (status, body) => route.fulfill({ status, headers: { ...cors, 'content-type': 'application/json' }, body: JSON.stringify(body) });
    if (url.pathname === '/functions/v1/adapt') {
      const body = JSON.parse(req.postData() ?? '{}');
      calls.adapt.push(body);
      if (failAdapt) return json(502, { error: 'upstream' });
      await wait(700);
      return json(200, { analogy: ANALOGY[body.mode] ?? ANALOGY.explorer, cached: false, aiGenerated: true });
    }
    if (url.pathname === '/auth/v1/signup') {
      calls.signup++;
      const now = Math.floor(Date.now() / 1000);
      const user = { id: FAKE_UID, aud: 'authenticated', role: 'authenticated', is_anonymous: true, app_metadata: {}, user_metadata: {}, created_at: new Date().toISOString() };
      return json(200, { access_token: 'mock.jwt.token', token_type: 'bearer', expires_in: 3600, expires_at: now + 3600, refresh_token: 'mock-refresh', user });
    }
    if (url.pathname === '/auth/v1/user') return json(200, { id: FAKE_UID, aud: 'authenticated', role: 'authenticated', is_anonymous: true });
    if (url.pathname === '/rest/v1/rpc/leaderboard') {
      calls.rpc++;
      return json(200, [
        { nickname: 'Nebulosa', stars: 10, missions: 3 },
        { nickname: 'Rover Rojo', stars: 8, missions: 2 },
        { nickname: 'Eco QA', stars: 4, missions: 1 },
        { nickname: 'Cráter 12', stars: 3, missions: 1 },
        { nickname: 'Polaris', stars: 1, missions: 0 },
      ]);
    }
    if (url.pathname === '/rest/v1/progress') {
      calls.progress++;
      return req.method() === 'GET' ? json(200, [{ achievement_id: 'horizonte', completed_at: '2026-11-13T12:00:00Z' }]) : json(201, []);
    }
    if (url.pathname === '/rest/v1/profiles') {
      calls.profiles++;
      return json(201, []);
    }
    return json(404, { error: 'mock: ruta no simulada ' + url.pathname });
  });
}
const FULL = { v: 1, unlocked: { horizonte: { date: '2026-11-13' }, 'spirit-historia': { date: '2026-11-14' }, 'spirit-actividad': { date: '2026-11-14' }, 'spirit-legado': { date: '2026-11-14' } } };
const init = ([g, p]) => {
  if (!localStorage.getItem('ecos.prologue.v1')) {
    localStorage.setItem('ecos.prologue.v1', JSON.stringify({ seen: true, profile: { ageGroup: g, interests: ['futbol', 'musica', 'videojuegos'], createdAt: '2026-11-14', alias: 'Eco QA' } }));
    localStorage.setItem('ecos.app.progress.v1', JSON.stringify(p));
  }
};
async function ctxFor(vp, g, opts) {
  const ctx = await browser.newContext(vp === 'mob' ? { viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, isMobile: true, hasTouch: true } : { viewport: { width: 1280, height: 720 } });
  await mockSupabase(ctx, opts);
  await ctx.addInitScript(init, [g, FULL]);
  const page = await ctx.newPage();
  page.on('pageerror', (e) => problems.push(`[${vp}-${g}] pageerror ${e.message}`));
  page.on('console', (m) => m.type() === 'error' && !/Failed to load resource/.test(m.text()) && problems.push(`[${vp}-${g}] console ${m.text().slice(0, 200)}`));
  return { ctx, page };
}
const shot = async (page, name) => (await page.screenshot({ path: `${OUT}${name}.png` }), console.log('✓', name));

// 1) chip de analogía en las tres modalidades (ruta de Spirit, primera parada)
for (const [vp, g] of [['desk', 'junior'], ['desk', 'explorer'], ['desk', 'discovery'], ['mob', 'junior']]) {
  const { ctx, page } = await ctxFor(vp, g);
  await page.goto(BASE);
  await page.locator('[data-universe][data-view="browse"]').waitFor({ timeout: 20000 });
  await wait(1000);
  await page.getByRole('button', { name: /Viajar a Marte/ }).click();
  await page.locator('.arrive').waitFor();
  await wait(1800);
  await page.getByRole('button', { name: /Explorar Spirit/ }).click();
  await page.locator('.sr').waitFor();
  await page.locator('.sana.is-loading').waitFor({ timeout: 8000 }).then(() => shot(page, `analogia-${vp}-${g}-cargando`)).catch(() => problems.push(`[${vp}-${g}] no se vio el esqueleto de carga`));
  await page.locator('.sana__text').waitFor({ timeout: 8000 }).catch(() => problems.push(`[${vp}-${g}] no apareció la analogía`));
  await wait(600);
  const txt = await page.locator('.sana').innerText().catch(() => '');
  if (!/generada con IA/i.test(txt)) problems.push(`[${vp}-${g}] falta la etiqueta «generada con IA»`);
  await page.locator('.sana').scrollIntoViewIfNeeded().catch(() => {});
  await shot(page, `analogia-${vp}-${g}`);
  await ctx.close();
}
// 2) si la función falla, el chip desaparece y la ruta sigue normal
{
  const { ctx, page } = await ctxFor('desk', 'explorer', { failAdapt: true });
  await page.goto(BASE);
  await page.locator('[data-universe][data-view="browse"]').waitFor({ timeout: 20000 });
  await page.getByRole('button', { name: /Viajar a Marte/ }).click();
  await page.locator('.arrive').waitFor();
  await wait(1800);
  await page.getByRole('button', { name: /Explorar Spirit/ }).click();
  await page.locator('.sr').waitFor();
  await wait(3500);
  if (await page.locator('.sana').count()) problems.push('[fallo] el chip sigue visible tras un error del backend');
  else console.log('✓ backend con error: el chip se oculta');
  await shot(page, 'analogia-desk-explorer-backend-caido');
  await ctx.close();
}
// 3) ranking real (en vivo)
for (const [vp, g] of [['desk', 'discovery'], ['mob', 'explorer']]) {
  const { ctx, page } = await ctxFor(vp, g);
  await page.goto(`${BASE}?view=ranking`);
  await page.locator('.rk__live').waitFor({ timeout: 10000 }).catch(() => problems.push(`[rk-${vp}] no aparece «En vivo»`));
  await wait(1200);
  const t = await page.locator('.rk__table').innerText();
  if (/demo/i.test(t)) problems.push(`[rk-${vp}] la tabla en vivo contiene filas demo`);
  if (!/Nebulosa/.test(t)) problems.push(`[rk-${vp}] faltan filas reales`);
  await shot(page, `ranking-en-vivo-${vp}-${g}`);
  await ctx.close();
}
await browser.close();
console.log('llamadas simuladas:', JSON.stringify({ adapt: calls.adapt.length, signup: calls.signup, progress: calls.progress, profiles: calls.profiles, rpc: calls.rpc }));
const a0 = calls.adapt[0];
if (a0) {
  console.log('ejemplo de petición a adapt:', JSON.stringify(a0));
  if (!a0.sourceUrl?.includes('nasa.gov')) problems.push('la petición no lleva una fuente nasa.gov');
}
console.log(problems.length ? `\n${problems.length} avisos:\n` + problems.join('\n') : '\nSin avisos');
