// Capturas móviles (390×844 y 360×780) en los tres modos: Mis logros, superficie de Marte y de la Luna, rutas.
// Uso: npm run build && npx vite preview --port 4175  →  OUT=screenshots/mobile-after PW=<playwright-core> node scripts/mobile-shots.mjs
const { chromium } = await import(process.env.PW ?? 'playwright-core');
import { mkdirSync } from 'node:fs';
const BASE = process.env.BASE_URL ?? 'http://localhost:4175/';
const OUT = (process.env.OUT ?? 'screenshots/mobile') + '/';
mkdirSync(OUT, { recursive: true });
const browser = await chromium.launch({ executablePath: process.env.CHROME ?? '/usr/bin/google-chrome', args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist', '--no-sandbox'] });
const wait = (ms) => new Promise((r) => setTimeout(r, ms));
const VPS = { 390: { width: 390, height: 844 }, 360: { width: 360, height: 780 } };
const MODES = (process.env.MODES ?? 'junior,explorer,discovery').split(',');
const ONLY = process.env.ONLY ?? '';
const run = (n) => !ONLY || ONLY.split(',').includes(n);
const FULL = { v: 1, unlocked: { horizonte: { date: '2026-11-13' }, 'spirit-historia': { date: '2026-11-14' }, 'spirit-actividad': { date: '2026-11-14' }, 'spirit-legado': { date: '2026-11-14' } } };
const problems = [];
const init = ([g, p]) => {
  if (!localStorage.getItem('ecos.prologue.v1')) {
    localStorage.setItem('ecos.prologue.v1', JSON.stringify({ seen: true, profile: { ageGroup: g, interests: ['ciencia', 'arte', 'futbol'], createdAt: '2026-11-14', alias: 'Eco QA' } }));
    localStorage.setItem('ecos.app.progress.v1', JSON.stringify(p));
    localStorage.setItem('ecos.app.logrosSeen.v1', JSON.stringify(Object.keys(p.unlocked)));
  }
};
async function ctxFor(w, g) {
  const ctx = await browser.newContext({ viewport: VPS[w], deviceScaleFactor: 2, isMobile: true, hasTouch: true });
  await ctx.addInitScript(init, [g, FULL]);
  const page = await ctx.newPage();
  page.on('pageerror', (e) => problems.push(`[${w}-${g}] pageerror ${e.message}`));
  return { ctx, page };
}
/** Pares de textos visibles que se solapan (etiquetas sobre etiquetas). */
async function overlaps(page, sel, tag) {
  const bad = await page.evaluate((sel) => {
    const els = [...document.querySelectorAll(sel)].filter((e) => {
      const r = e.getBoundingClientRect();
      const cs = getComputedStyle(e);
      return r.width > 0 && r.height > 0 && cs.visibility !== 'hidden' && cs.display !== 'none' && Number(cs.opacity) > 0.05 && r.bottom > 0 && r.top < innerHeight;
    });
    const out = [];
    for (let i = 0; i < els.length; i++)
      for (let j = i + 1; j < els.length; j++) {
        if (els[i].contains(els[j]) || els[j].contains(els[i])) continue;
        const a = els[i].getBoundingClientRect(), b = els[j].getBoundingClientRect();
        const ox = Math.min(a.right, b.right) - Math.max(a.left, b.left), oy = Math.min(a.bottom, b.bottom) - Math.max(a.top, b.top);
        if (ox > 4 && oy > 4) out.push(`"${els[i].textContent.trim().slice(0, 24)}" × "${els[j].textContent.trim().slice(0, 24)}"`);
      }
    return out;
  }, sel);
  bad.forEach((b) => problems.push(`[${tag}] solape: ${b}`));
}
const shot = async (page, name) => (await page.screenshot({ path: `${OUT}${name}.png` }), console.log('✓', name));

for (const w of [390, 360]) for (const g of MODES) {
  if (run('logros')) {
    const { ctx, page } = await ctxFor(w, g);
    await page.goto(`${BASE}?view=logros&t=10.4`);
    await page.locator('.ml-root[data-ready="true"]').waitFor({ timeout: 30000 });
    await wait(3800);
    await overlaps(page, '.ml-root button, .ml-root p, .ml-root h1, .ml-root h2, .ml-root small, .ml-root [class*="label"], .ml-root [class*="credit"]', `logros-${w}-${g}`);
    await shot(page, `logros-${w}-${g}`);
    await ctx.close();
  }
  if (run('marte')) {
    const { ctx, page } = await ctxFor(w, g);
    await page.goto(BASE);
    await page.locator('[data-universe][data-view="browse"]').waitFor({ timeout: 20000 });
    await wait(1200);
    await page.getByRole('button', { name: /Viajar a Marte/ }).click();
    await page.locator('.arrive').waitFor();
    await wait(2400);
    await overlaps(page, '.arrive button, .arrive .sig, .arrive h1, .arrive h2', `marte-${w}-${g}`);
    await shot(page, `marte-${w}-${g}`);
    await page.getByRole('button', { name: /Explorar Spirit/ }).click();
    await page.locator('.sr').waitFor();
    await wait(2500);
    await overlaps(page, '.sr__top button, .sr__top h2, .sr__top span, .sr__pips', `ruta-spirit-${w}-${g}`);
    await shot(page, `ruta-spirit-${w}-${g}-0`);
    await page.locator('.sr__cta').click().catch(() => {});
    await wait(2600);
    await shot(page, `ruta-spirit-${w}-${g}-1`);
    await ctx.close();
  }
  if (run('luna')) {
    const { ctx, page } = await ctxFor(w, g);
    await page.goto(BASE);
    await page.locator('[data-universe][data-view="browse"]').waitFor({ timeout: 20000 });
    await wait(1200);
    await page.getByRole('button', { name: /Viajar a La Luna/ }).click();
    await page.locator('.arrive--luna').waitFor();
    await wait(2400);
    await shot(page, `luna-${w}-${g}`);
    await page.getByRole('button', { name: /Explorar ALSEP/ }).click();
    await page.locator('.sr').waitFor();
    await wait(2500);
    await shot(page, `ruta-alsep-${w}-${g}-0`);
    await ctx.close();
  }
}
await browser.close();
console.log(problems.length ? `\n${problems.length} avisos:\n` + problems.join('\n') : '\nSin avisos');
