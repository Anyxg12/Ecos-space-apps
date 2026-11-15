// QA de la app ECOS unificada: recorridos completos (Marte/Spirit, Luna/ALSEP), perfil, accesibilidad y Mis logros.
// Uso: npm run build && npx vite preview --port 4175  →  PW=<ruta a playwright-core/index.mjs> node scripts/qa.mjs
const { chromium } = await import(process.env.PW ?? 'playwright-core');
import { mkdirSync } from 'node:fs';

const BASE = process.env.BASE_URL ?? 'http://localhost:4175/';
const OUT = new URL('../screenshots/', import.meta.url).pathname;
const ONLY = process.env.ONLY ?? '';
mkdirSync(OUT, { recursive: true });
const GL = ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist', '--no-sandbox'];
const browser = await chromium.launch({ executablePath: process.env.CHROME ?? '/usr/bin/google-chrome', args: GL });
const wait = (ms) => new Promise((r) => setTimeout(r, ms));
const logs = [];
const _push = logs.push.bind(logs);
logs.push = (...a) => (a.forEach((x) => console.log('  ✗ ' + x)), _push(...a)); // se ven al momento aunque una sección falle
const VP = {
  desk: { viewport: { width: 1280, height: 720 } },
  w520: { viewport: { width: 520, height: 860 } },
  mob: { viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, isMobile: true, hasTouch: true },
};
const run = (n) => !ONLY || ONLY.split(',').includes(n);
const FULL = { v: 1, unlocked: { horizonte: { date: '2026-11-13' }, 'spirit-historia': { date: '2026-11-14' }, 'spirit-actividad': { date: '2026-11-14' }, 'spirit-legado': { date: '2026-11-14' } } };

async function open(b, tag, vp, url, init) {
  const ctx = await b.newContext({ deviceScaleFactor: 1, ...VP[vp] });
  if (init) await ctx.addInitScript(init.fn, init.arg);
  const page = await ctx.newPage();
  page.on('console', (m) => ['error', 'warning'].includes(m.type()) && logs.push(`[${tag}] ${m.type()}: ${m.text().slice(0, 300)}`));
  page.on('pageerror', (e) => logs.push(`[${tag}] pageerror: ${e.message}`));
  await page.goto(`${BASE}${url}`);
  return { ctx, page };
}
const shot = async (page, name) => {
  await page.screenshot({ path: `${OUT}${name}.png` });
  console.log('✓', name);
};
const seed = { fn: (p) => localStorage.getItem('ecos.app.progress.v1') || localStorage.setItem('ecos.app.progress.v1', JSON.stringify(p)), arg: FULL };
const seedSeen = { fn: (p) => { if (!localStorage.getItem('ecos.app.progress.v1')) { localStorage.setItem('ecos.app.progress.v1', JSON.stringify(p)); localStorage.setItem('ecos.app.logrosSeen.v1', JSON.stringify(Object.keys(p.unlocked))); } }, arg: FULL };
async function overflowCheck(page, tag) {
  const bad = await page.evaluate(() => {
    const out = [];
    for (const el of document.querySelectorAll('h1,h2,h3,p,button,dt,dd')) {
      const r = el.getBoundingClientRect();
      if (!r.width) continue;
      let o = el, hidden = false;
      while (o) { if (getComputedStyle(o).opacity === '0') { hidden = true; break; } o = o.parentElement; }
      if (hidden || el.closest('[inert]') || getComputedStyle(el).visibility === 'hidden' || el.closest('[aria-hidden="true"]') || el.closest('.sr-only') || el.closest('.ml-sr')) continue;
      if (r.right > innerWidth + 1 || r.left < -1) out.push(`${el.tagName}.${el.className} "${el.textContent.trim().slice(0, 30)}"`);
    }
    return out;
  });
  bad.forEach((b) => logs.push(`[${tag}] overflow: ${b}`));
}

/** Recorre una ruta narrativa completa resolviendo cada actividad. Devuelve el texto final. */
async function walkRoute(page, tag, prefix, { shots = true } = {}) {
  await page.locator('.sr').waitFor();
  await wait(1200);
  // espera a que la cámara se detenga y el panel de la parada esté visible y estable (dos lecturas seguidas)
  const settle = async () => {
    await wait(450);
    for (let k = 0; k < 3; k++) {
      await page.waitForFunction(() => { const r = document.querySelector('.sr'); return r && !r.classList.contains('is-moving') && (r.querySelector('.sr__panel') || r.querySelector('.sr__done')); }, null, { timeout: 20000 });
      await wait(500);
      const ok = await page.evaluate(() => { const r = document.querySelector('.sr'); return !r.classList.contains('is-moving') && !!r.querySelector('.sr__panel'); });
      if (ok) break;
    }
  };
  for (let i = 0; i < 11; i++) {
    await settle();
    const kind = (await page.evaluate(() => document.querySelector('.sr__panel .act')?.className ?? '')).replace('act act--', '').trim();
    if (kind === 'assemble') for (const n of ['Mástil con Pancam', 'Brazo con instrumentos', 'Herramienta RAT']) await page.getByRole('button', { name: n }).click();
    if (kind === 'hold') {
      const bb = await page.locator('.hold__btn').boundingBox();
      await page.mouse.move(bb.x + 20, bb.y + 20); await page.mouse.down(); await wait(1900); await page.mouse.up();
      // el cohete debe salir de la tarjeta y volar hasta fuera de la pantalla (capa fija); con movimiento reducido no hay vuelo
      const reducedNow = await page.evaluate(() => !!document.querySelector('.sr.is-reduced'));
      if (!reducedNow) {
        if (!(await page.locator('.hold-flight').count())) logs.push(`[${tag}] despegue: no aparece el vuelo del cohete`);
        await wait(250);
        if (shots) await shot(page, `${prefix}-despegue-vuelo`);
        await wait(2400);
        if (await page.locator('.hold-flight').count()) logs.push(`[${tag}] despegue: el cohete no terminó de salir de la pantalla`);
      }
    }
    if (kind === 'choice') {
      // primero la opción incorrecta: debe bloquear el avance y dar pista
      await page.locator('.act__opt').nth(1).click();
      await wait(250);
      if (!(await page.locator('.sr__cta').isDisabled())) logs.push(`[${tag}] la actividad no bloquea con respuesta incorrecta`);
      if (shots) await shot(page, `${prefix}-actividad-error`);
      await page.locator('.act__opt').nth(0).click();
      await wait(2800);
    }
    if (kind === 'route') for (let k = 0; k < 3; k++) { await page.getByRole('button', { name: /Avanzar al siguiente punto/ }).click(); await wait(250); }
    if (kind === 'place') for (const [n, slot] of [['Estación central', 0], ['Generador RTG', 1], ['Sismómetro', 2]]) { await page.getByRole('button', { name: n, exact: true }).click(); await page.locator('.place__slot').nth(slot).click(); }
    if (kind.startsWith('network')) { const n = await page.locator('.net__site').count(); for (let k = 0; k < n; k++) await page.locator('.net__site').nth(k).click(); }
    if (kind === 'switch') { const n = await page.locator('.sw').count(); for (let k = 0; k < n; k++) await page.locator('.sw').nth(k).click(); }
    if (kind.startsWith('find')) for (let k = 0; k < 4; k++) await page.locator('.find__spot').nth(k).click();
    if (kind.startsWith('song')) { await page.locator('.song__btn').click(); await wait(3600); }
    if (kind.startsWith('quake')) { await page.locator('.quake__btn').click(); await wait(6000); }
    await wait(350);
    await overflowCheck(page, `${tag} parada ${i}`);
    const srcs = await page.locator('.sr__panel .sfact__src').count();
    const facts = await page.locator('.sr__panel details.sfact').count();
    if (facts && srcs < facts) logs.push(`[${tag}] parada ${i}: hechos sin fuente (${srcs}/${facts})`);
    if (shots) await shot(page, `${prefix}-parada-${i}${kind ? '-' + kind.split(' ')[0] : ''}`);
    const cta = page.locator('.sr__panel .sr__cta').first();
    const txt = (await cta.textContent()) ?? '';
    if (/Completar/.test(txt)) {
      await cta.click();
      await page.locator('.sr__done').waitFor();
      await wait(900);
      if (shots) await shot(page, `${prefix}-final`);
      return (await page.locator('.sr__done').innerText());
    }
    if (await cta.isDisabled()) { logs.push(`[${tag}] parada ${i}: no se puede continuar`); return ''; }
    await cta.click();
  }
  logs.push(`[${tag}] la ruta no terminó`);
  return '';
}
const profileInit = (g, extra = {}) => ({ fn: ([g, extra]) => localStorage.getItem('ecos.prologue.v1') || localStorage.setItem('ecos.prologue.v1', JSON.stringify({ seen: true, profile: { ageGroup: g, interests: ['ciencia', 'arte', 'futbol'], createdAt: '2026-11-14', ...extra } })), arg: [g, extra] });

// 1) Recorrido completo: prólogo → universo → Marte → Spirit → Explorar Spirit → Mis logros (estrella nueva)
if (run('loop')) {
  for (const vp of ['desk', 'mob']) {
    const tag = `loop-${vp}`;
    const { ctx, page } = await open(browser, tag, vp, '?reset=1&watchdog=0&timescale=0.5');
    await wait(2000);
    await page.getByRole('button', { name: /Atravesar el horizonte/i }).click();
    await page.getByRole('button', { name: /Responder a la señal/i }).waitFor({ timeout: 40000 });
    await wait(800);
    await page.getByRole('button', { name: /Responder a la señal/i }).click();
    await page.getByRole('radio', { name: /Explorer/i }).waitFor();
    await wait(1200);
    await page.getByRole('radio', { name: /Explorer/i }).click();
    await wait(1000);
    for (const n of ['Fútbol', 'Animales', 'Ciencia']) await page.getByRole('button', { name: n }).click();
    await wait(500);
    await shot(page, `loop-${vp}-00-intereses`);
    await overflowCheck(page, `${tag} intereses`);
    await page.getByRole('button', { name: /Explorar lo desconocido/i }).click();
    await page.locator('[data-universe][data-view="browse"]').waitFor({ timeout: 20000 });
    await wait(2000);
    await shot(page, `loop-${vp}-01-universo`);
    if (vp === 'desk') {
      // sonido: activado por el usuario (gesto) → microefectos y despegue sin errores
      await page.getByRole('button', { name: 'Activar sonido' }).click();
      await page.getByRole('button', { name: 'Desactivar sonido' }).waitFor();
      const st = await page.evaluate(() => localStorage.getItem('ecos.sound.v1'));
      if (st !== '1') logs.push(`[${tag}] el interruptor de sonido no guardó la preferencia`);
    }
    await page.getByRole('button', { name: /Viajar a Marte/ }).click();
    await page.locator('.arrive').waitFor();
    await wait(2200);
    await overflowCheck(page, tag + ' marte');
    await shot(page, `loop-${vp}-02-marte-superficie`);
    const focused = await page.evaluate(() => document.activeElement?.getAttribute('aria-label'));
    if (!/Explorar Spirit/.test(focused ?? '')) logs.push(`[${tag}] al llegar a Marte el foco no está en la señal de Spirit: ${focused}`);
    await page.getByRole('button', { name: /Explorar Spirit/ }).click();
    const fin = await walkRoute(page, tag, `loop-${vp}-03-spirit`, { shots: vp === 'desk' });
    if (!/Misión Spirit completada/i.test(fin)) logs.push(`[${tag}] final inesperado: ${fin.slice(0, 80)}`);
    if (!/3 estrellas nuevas/i.test(fin)) logs.push(`[${tag}] se esperaban 3 estrellas nuevas: ${fin.slice(0, 120)}`);
    if (vp === 'mob') await shot(page, `loop-${vp}-03-spirit-final`);
    await page.getByRole('button', { name: /Ver Mis logros/ }).click();
    await page.locator('.ml-root').waitFor();
    await page.locator('.ml-root[data-ready="true"]').waitFor({ timeout: 20000 });
    await wait(600);
    await shot(page, `loop-${vp}-06-logros-suelo`);
    await page.locator('.ml-root[data-phase="space"]').waitFor({ timeout: 30000 });
    await page.locator('.ml-star.is-igniting').first().waitFor({ timeout: 8000 });
    await wait(500);
    await shot(page, `loop-${vp}-07-logros-nueva-estrella`);
    const count = await page.locator('.ml-header__count').innerText();
    if (!/4 de 11/.test(count)) logs.push(`[${tag}] contador inesperado: ${count}`);
    const ign = await page.locator('.ml-star.is-igniting').count();
    console.log('  estrellas encendiéndose:', ign, '·', count);
    if (ign !== 4) logs.push(`[${tag}] se esperaban 4 estrellas nuevas (primera visita), hay ${ign}`);
    await wait(2600);
    await page.getByRole('button', { name: /Huellas de Spirit: desbloqueado/ }).click();
    await wait(800);
    await overflowCheck(page, tag + ' card');
    await shot(page, `loop-${vp}-08-tarjeta-huellas`);
    await page.keyboard.press('Escape');
    await page.getByRole('button', { name: /Universo/ }).click();
    await page.locator('[data-universe]').waitFor({ timeout: 15000 });
    console.log('✓ vuelta al universo', vp);
    await ctx.close();
  }
}

// 1a) Regresión de navegación (PDF del equipo, nov 2026): avanzar no debe devolver a la parada anterior
if (run('nav')) {
  for (const g of ['junior', 'explorer', 'discovery']) {
    const tag = `nav-desk-${g}`;
    const { ctx, page } = await open(browser, tag, 'desk', '', profileInit(g));
    await page.locator('[data-universe][data-view="browse"]').waitFor({ timeout: 20000 });
    await page.getByRole('button', { name: /Viajar a Marte/ }).click();
    await page.locator('.arrive').waitFor();
    await wait(1800);
    await page.getByRole('button', { name: /Explorar Spirit/ }).click();
    await page.locator('.sr').waitFor();
    await wait(1500);
    const stopNow = async () => Number(await page.locator('.sr').getAttribute('data-stop'));
    const settle = () => page.waitForFunction(() => !document.querySelector('.sr')?.classList.contains('is-moving'), null, { timeout: 10000 }).then(() => wait(500));
    await page.locator('.sr__panel .sr__cta').click();
    await wait(400); await settle();
    const base = await stopNow(); // «Despegue»
    const bb = await page.locator('.hold__btn').boundingBox();
    if (bb) { await page.mouse.move(bb.x + 20, bb.y + 20); await page.mouse.down(); await wait(1900); await page.mouse.up(); }
    await page.locator('.sr__panel .sr__cta').click();
    // a) rueda hacia arriba (leer la tarjeta) mientras la cámara viaja: antes devolvía a la parada anterior
    await page.mouse.move(1100, 450);
    for (let k = 0; k < 6; k++) { await page.mouse.wheel(0, -120); await wait(90); }
    await wait(400); await settle();
    const afterWheel = await stopNow();
    if (afterWheel !== base + 1) logs.push(`[${tag}] navegación (rueda durante el viaje): se esperaba la parada ${base + 1}, quedó en ${afterWheel}`);
    // b) arrastre empezado en el paisaje y soltado sobre la barra superior, y luego mover el ratón sin pulsar
    await page.mouse.move(80, 650); await page.mouse.down(); await page.mouse.move(81, 646); await page.mouse.move(640, 30, { steps: 3 }); await page.mouse.up();
    await wait(300); await settle();
    await page.locator('.sr__pip').nth(base + 1).click();
    await wait(400); await settle();
    await page.mouse.move(120, 500); await page.mouse.move(300, 300, { steps: 6 }); await wait(1200);
    const after = await stopNow();
    if (after !== base + 1) logs.push(`[${tag}] navegación: se esperaba la parada ${base + 1}, quedó en ${after}`);
    else console.log('✓ navegación estable', tag, `${base} → ${after}`);
    await ctx.close();
  }
}

// 1b) Universos: Marte y la Luna en los tres modos
if (run('uni')) {
  for (const vp of ['desk', 'mob']) for (const g of ['junior', 'explorer', 'discovery']) {
    const { ctx, page } = await open(browser, `uni-${vp}-${g}`, vp, '', profileInit(g));
    await page.locator('[data-universe][data-view="browse"]').waitFor({ timeout: 20000 });
    await wait(2500);
    const names = await page.locator('.uni-place__name').allInnerTexts();
    if (names.length !== 2 || !names.some((n) => /luna/i.test(n)) || !names.some((n) => /marte/i.test(n))) logs.push(`[uni-${vp}-${g}] mundos inesperados: ${names.join(', ')}`);
    if (await page.getByText(/próximamente|coming soon/i).count()) logs.push(`[uni-${vp}-${g}] aparece «próximamente»`);
    await overflowCheck(page, `uni-${vp}-${g}`);
    await shot(page, `universo-${vp}-${g}`);
    // superficie de Marte en cada modo: Spirit (misión disponible) + Opportunity (ficha)
    await page.getByRole('button', { name: /Viajar a Marte/ }).click();
    await page.locator('.arrive').waitFor();
    await wait(2200);
    await overflowCheck(page, `uni-${vp}-${g} marte`);
    const fut = await page.locator('.sig--future[role="img"][aria-label^="Señal futura"]').count();
    if (fut < 3) logs.push(`[uni-${vp}-${g}] señales futuras en Marte: ${fut}`);
    if (await page.getByText(/próximamente/i).count()) logs.push(`[uni-${vp}-${g}] aparece «próximamente» en Marte`);
    await shot(page, `marte-${vp}-${g}-superficie`);
    if (vp === 'desk' && g === 'discovery') {
      await page.getByRole('button', { name: 'Ficha de Opportunity' }).click();
      await wait(500);
      const opp = await page.locator('.arrive__drawer').innerText();
      if (!/Meridiani Planum/.test(opp)) logs.push('[uni] la ficha de Opportunity no muestra sus datos verificados');
      await shot(page, 'marte-discovery-ficha-opportunity');
    }
    await ctx.close();
  }
}

// 1c) Luna → ALSEP (tres modos en escritorio, uno en móvil) + volver y foco restaurado
if (run('moon')) {
  for (const [vp, g] of [['desk', 'junior'], ['desk', 'explorer'], ['desk', 'discovery'], ['mob', 'explorer']]) {
    const tag = `moon-${vp}-${g}`;
    const { ctx, page } = await open(browser, tag, vp, '', profileInit(g));
    await page.locator('[data-universe][data-view="browse"]').waitFor({ timeout: 20000 });
    await wait(1500);
    await page.getByRole('button', { name: /Viajar a La Luna/ }).click();
    await wait(450);
    await shot(page, `luna-${vp}-${g}-0-viaje`);
    await page.locator('.arrive--luna').waitFor();
    await wait(2200);
    if (await page.getByText(/próximamente|nueva señal está por descubrirse/i).count()) logs.push(`[${tag}] aparece «próximamente»`);
    await overflowCheck(page, tag + ' superficie');
    if ((await page.locator('.sig--future[role="img"]').count()) < 3) logs.push(`[${tag}] faltan señales futuras en la Luna`);
    await shot(page, `luna-${vp}-${g}-1-superficie`);
    await page.getByRole('button', { name: /Explorar ALSEP/ }).click();
    const fin = await walkRoute(page, tag, `luna-${vp}-${g}-2-alsep`, { shots: g !== 'junior' || vp === 'desk' });
    if (!/Ruta ALSEP completada/i.test(fin)) logs.push(`[${tag}] final inesperado: ${fin.slice(0, 80)}`);
    // volver: ruta → superficie (foco en la señal) → universo (foco en la Luna)
    await page.getByRole('button', { name: /Volver a (la Luna|superficie)/ }).first().click();
    await wait(1000); // el foco vuelve en el siguiente fotograma
    let f = await page.evaluate(() => document.activeElement?.getAttribute('aria-label'));
    if (!/ALSEP/.test(f ?? '')) logs.push(`[${tag}] foco tras cerrar la ruta: ${f}`);
    await page.locator('.arrive__back').click();
    await page.locator('[data-universe][data-view="browse"]').waitFor({ timeout: 15000 });
    await wait(500);
    f = await page.evaluate(() => document.activeElement?.getAttribute('aria-label'));
    if (!/Viajar a La Luna/.test(f ?? '')) logs.push(`[${tag}] foco al volver al universo: ${f}`);
    else console.log('✓ foco restaurado en la Luna', tag);
    await ctx.close();
  }
}

// 1d) Ruta de Spirit en los tres modos (capturas), vista de lista, teclado, recarga y sin puntos duplicados
if (run('route')) {
  for (const [vp, g] of [['desk', 'explorer'], ['desk', 'discovery'], ['mob', 'junior'], ['mob', 'discovery']]) {
    const tag = `route-${vp}-${g}`;
    const { ctx, page } = await open(browser, tag, vp, '', profileInit(g));
    await page.locator('[data-universe][data-view="browse"]').waitFor({ timeout: 20000 });
    await page.getByRole('button', { name: /Viajar a Marte/ }).click();
    await page.locator('.arrive').waitFor();
    await wait(1800);
    await page.getByRole('button', { name: /Explorar Spirit/ }).click();
    const fin = await walkRoute(page, tag, `spirit-${vp}-${g}`, { shots: true });
    if (!/Misión Spirit completada/i.test(fin)) logs.push(`[${tag}] final inesperado`);
    const before = await page.evaluate(() => localStorage.getItem('ecos.app.progress.v1'));
    // repetir: no duplica
    await page.getByRole('button', { name: 'Repetir ruta' }).click();
    await wait(800);
    await page.reload();
    await page.locator('[data-universe]').waitFor({ timeout: 20000 });
    const after = await page.evaluate(() => localStorage.getItem('ecos.app.progress.v1'));
    if (before !== after) logs.push(`[${tag}] el progreso cambió al repetir/recargar`);
    const n = Object.keys(JSON.parse(after ?? '{"unlocked":{}}').unlocked).length;
    console.log('  progreso tras recargar:', n, 'logros guardados', tag);
    if (vp === 'desk' && g === 'explorer') {
      // vista de lista + teclado
      await page.getByRole('button', { name: /Viajar a Marte/ }).click();
      await page.locator('.arrive').waitFor();
      await wait(1800);
      await page.getByRole('button', { name: /Explorar Spirit otra vez/ }).click();
      await page.locator('.sr').waitFor();
      await wait(1200);
      await page.keyboard.press('ArrowRight');
      await wait(2200);
      const stop = await page.locator('.sr').getAttribute('data-stop');
      if (stop !== '1') logs.push(`[${tag}] la flecha → no avanzó (data-stop=${stop})`);
      await page.getByRole('button', { name: 'Vista de lista' }).click();
      await wait(400);
      await shot(page, `spirit-${vp}-${g}-vista-lista`);
      const items = await page.locator('.sr__item').count();
      if (items !== 7) logs.push(`[${tag}] vista de lista con ${items} elementos`);
      await page.keyboard.press('Escape');
      await wait(300);
    }
    await ctx.close();
  }
}

// 1g) Marte → Opportunity (segunda historia completa) + foco de vuelta a su señal
if (run('opp')) {
  for (const [vp, g] of [['desk', 'junior'], ['desk', 'explorer'], ['desk', 'discovery'], ['mob', 'junior']]) {
    const tag = `opp-${vp}-${g}`;
    const { ctx, page } = await open(browser, tag, vp, '', profileInit(g));
    await page.locator('[data-universe][data-view="browse"]').waitFor({ timeout: 20000 });
    await page.getByRole('button', { name: /Viajar a Marte/ }).click();
    await page.locator('.arrive').waitFor();
    await wait(2000);
    await page.getByRole('button', { name: /Explorar Opportunity/ }).click();
    const fin = await walkRoute(page, tag, `opp-${vp}-${g}`, { shots: true });
    if (!/Misión Opportunity completada/i.test(fin)) logs.push(`[${tag}] final inesperado: ${fin.slice(0, 80)}`);
    if (!/3 estrellas nuevas/i.test(fin)) logs.push(`[${tag}] se esperaban 3 estrellas nuevas: ${fin.slice(0, 120)}`);
    await page.getByRole('button', { name: /Volver a (Marte|superficie)/ }).first().click();
    await wait(1000); // el foco vuelve en el siguiente fotograma
    const f = await page.evaluate(() => document.activeElement?.getAttribute('aria-label'));
    if (!/Opportunity otra vez/.test(f ?? '')) logs.push(`[${tag}] foco tras cerrar la ruta: ${f}`);
    const ids = Object.keys(JSON.parse(await page.evaluate(() => localStorage.getItem('ecos.app.progress.v1')) ?? '{"unlocked":{}}').unlocked);
    for (const id of ['opportunity-historia', 'opportunity-actividad', 'opportunity-legado']) if (!ids.includes(id)) logs.push(`[${tag}] falta el logro ${id}`);
    if (ids.some((x) => x.startsWith('spirit'))) logs.push(`[${tag}] Opportunity encendió estrellas de Spirit`);
    await ctx.close();
  }
}

// 1e) Movimiento reducido en universo y rutas + botón «Saltar transición»
if (run('motion')) {
  {
    const { ctx, page } = await open(browser, 'motion-reduce', 'desk', '?motion=reduce', profileInit('discovery'));
    await page.locator('[data-universe][data-view="browse"]').waitFor({ timeout: 20000 });
    const t0 = Date.now();
    await page.getByRole('button', { name: /Viajar a Marte/ }).click();
    await page.locator('.arrive').waitFor({ timeout: 3000 });
    console.log('  movimiento reducido: superficie en', Date.now() - t0, 'ms');
    if (await page.locator('.uni-skip').count()) logs.push('[motion-reduce] botón saltar visible con movimiento reducido');
    await page.getByRole('button', { name: /Explorar Spirit/ }).click();
    await page.locator('.sr').waitFor();
    await page.locator('.sr__cta').click();
    await wait(700); // sin tránsito animado: cambia en el siguiente fotograma (SwiftShader va lento)
    const stop = await page.locator('.sr').getAttribute('data-stop');
    if (stop !== '1') logs.push(`[motion-reduce] la ruta no cambió de parada al instante (data-stop=${stop})`);
    await shot(page, 'reducido-ruta-spirit');
    await ctx.close();
  }
  {
    const { ctx, page } = await open(browser, 'skip', 'desk', '', profileInit('discovery'));
    await page.locator('[data-universe][data-view="browse"]').waitFor({ timeout: 20000 });
    await wait(1200);
    await page.getByRole('button', { name: /Viajar a La Luna/ }).click();
    await page.getByRole('button', { name: /Saltar transición/ }).click({ timeout: 2000 });
    const t0 = Date.now();
    await page.locator('.arrive--luna').waitFor({ timeout: 3000 });
    console.log('  saltar transición: superficie en', Date.now() - t0, 'ms');
    await page.locator('.arrive__back').click();
    await page.getByRole('button', { name: /Saltar transición/ }).click({ timeout: 2000 }).catch(() => {});
    await page.locator('[data-universe][data-view="browse"]').waitFor({ timeout: 4000 });
    console.log('✓ ida y vuelta con «Saltar» sin quedarse a medio zoom');
    await ctx.close();
  }
}

// 1f) Perfil local: seudónimo + intereses, persistencia al recargar
if (run('profile')) {
  for (const vp of ['desk', 'mob']) {
    const tag = `profile-${vp}`;
    const { ctx, page } = await open(browser, tag, vp, '', profileInit('explorer'));
    await page.locator('[data-universe][data-view="browse"]').waitFor({ timeout: 20000 });
    await page.getByRole('button', { name: /Perfil/ }).click();
    await page.getByLabel('Seudónimo de explorador').fill('Eco-7');
    await page.getByRole('button', { name: 'Robótica' }).click();
    await page.getByRole('button', { name: 'Guardar perfil' }).click();
    await page.getByText('✓ Guardado en este navegador').waitFor();
    if (!(await page.getByText('Clave de recuperación — Pendiente').count())) logs.push(`[${tag}] falta «Clave de recuperación — Pendiente»`);
    if (!(await page.getByText('Datos de demostración').count())) logs.push(`[${tag}] falta el rótulo «Datos de demostración»`);
    await overflowCheck(page, tag);
    await shot(page, `perfil-${vp}`);
    await page.getByRole('button', { name: 'Cerrar perfil' }).click();
    await wait(300);
    const pf = await page.evaluate(() => document.activeElement?.className);
    if (!/uni-btn--profile/.test(pf ?? '')) logs.push(`[${tag}] foco al cerrar el perfil: ${pf}`);
    await page.reload();
    await page.locator('[data-universe]').waitFor({ timeout: 20000 });
    const stored = JSON.parse(await page.evaluate(() => localStorage.getItem('ecos.prologue.v1')));
    if (stored.profile.alias !== 'Eco-7' || !stored.profile.interests.includes('robotica')) logs.push(`[${tag}] el perfil no persistió: ${JSON.stringify(stored.profile)}`);
    const greet = await page.locator('.universe__greeting').innerText();
    if (!/Eco-7/i.test(greet)) logs.push(`[${tag}] el saludo no usa el seudónimo: ${greet}`);
    else console.log('✓ perfil persistido y saludo personalizado', vp);
    if (/@/.test(JSON.stringify(stored))) logs.push(`[${tag}] el perfil contiene un correo`);
    await ctx.close();
  }
}

// 2) Secuencia de Mis logros congelada en instantes (calidad alta)
if (run('seq')) {
  for (const vp of ['desk', 'mob']) {
    const FRAMES = [[0, 'a-atardecer'], [2.2, 'b-cuenta-atras'], [4.3, 'c-despegue'], [5.6, 'd-nubes'], [6.4, 'e-cielo-indigo'], [7.4, 'f-curvatura'], [8.8, 'g-luna-marte'], [10.4, 'h-constelacion']];
    for (const [t, name] of FRAMES) {
      if (vp === 'mob' && [2.2, 4.3, 8.8].includes(t)) continue;
      const { ctx, page } = await open(browser, `seq-${vp}`, vp, `?view=logros&quality=high&t=${t}`, seedSeen);
      await page.locator('.ml-root[data-ready="true"]').waitFor({ timeout: 30000 });
      await wait(t >= 10 ? 3600 : 1800);
      await shot(page, `logros-${vp}-${name}`);
      if (t >= 10) {
        await overflowCheck(page, `seq-${vp}`);
        await page.getByRole('button', { name: /Huellas de Spirit: desbloqueado/ }).click();
        await wait(900);
        await shot(page, `logros-${vp}-i-tarjeta-huellas`);
        await page.keyboard.press('Escape');
        await wait(300);
        // tarjeta bloqueada por teclado
        const f = page.getByRole('button', { name: /Huellas de Spirit: desbloqueado/ });
        await f.focus();
        await page.keyboard.press('ArrowRight');
        await page.keyboard.press('Enter');
        await wait(900);
        const lab = await page.evaluate(() => document.querySelector('.ml-card__title')?.textContent);
        if (lab !== 'Todos los artefactos de Marte') logs.push(`[seq-${vp}] tarjeta bloqueada = ${lab}`);
        await shot(page, `logros-${vp}-j-tarjeta-bloqueada`);
        await page.keyboard.press('Escape');
        if (vp === 'desk') {
          await page.getByRole('button', { name: 'Mi constelación' }).click();
          await wait(900);
          await shot(page, `logros-${vp}-k-mi-constelacion`);
        }
      }
      await ctx.close();
    }
  }
}

// 3) Movimiento reducido (fundido estático) y sincronización entre pestañas
if (run('reduced')) {
  const { ctx, page } = await open(browser, 'reduced', 'desk', '?view=logros', seedSeen);
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.reload();
  await page.locator('.ml-root[data-ready="true"]').waitFor({ timeout: 30000 });
  await wait(300);
  await shot(page, 'reduced-1-fundido');
  await wait(3000);
  const ph = await page.locator('.ml-root').getAttribute('data-phase');
  if (ph !== 'space') logs.push(`[reduced] fase = ${ph}`);
  await shot(page, 'reduced-2-final');
  await ctx.close();
}
if (run('sync')) {
  const ctx = await browser.newContext({ viewport: { width: 1100, height: 680 } });
  const a = await ctx.newPage();
  const b = await ctx.newPage();
  for (const p of [a, b]) {
    p.on('pageerror', (e) => logs.push(`[sync] pageerror: ${e.message}`));
    await p.goto(`${BASE}?reset=1&view=logros&skip=1`);
  }
  await b.goto(`${BASE}?view=logros&skip=1`);
  await a.locator('.ml-root[data-phase="space"]').waitFor({ timeout: 20000 });
  await b.locator('.ml-root[data-phase="space"]').waitFor({ timeout: 20000 });
  await wait(1500);
  await a.getByRole('button', { name: 'Panel demo' }).click();
  await a.getByRole('button', { name: 'Completar Spirit · Historia' }).click();
  await wait(800);
  const txt = await b.locator('.ml-header__count').innerText();
  if (!/1 de 11/.test(txt)) logs.push(`[sync] la otra pestaña no se actualizó: ${txt}`);
  else console.log('✓ sincronización entre pestañas', txt);
  await wait(300);
  await shot(b, 'sync-otra-pestana');
  await a.reload();
  await a.locator('.ml-root[data-phase="space"]').waitFor({ timeout: 20000 });
  const t2 = await a.locator('.ml-header__count').innerText();
  if (!/1 de 11/.test(t2)) logs.push(`[sync] no persistió al recargar: ${t2}`);
  await ctx.close();
}
// 5) Top exploradores (ranking demo con la posición local real) y clave secreta local
if (run('rank')) {
  for (const [vp, g] of [['desk', 'junior'], ['desk', 'discovery'], ['mob', 'explorer']]) {
    const tag = `rank-${vp}-${g}`;
    const { ctx, page } = await open(browser, tag, vp, '', { fn: ([g, p]) => { if (!localStorage.getItem('ecos.prologue.v1')) { localStorage.setItem('ecos.prologue.v1', JSON.stringify({ seen: true, profile: { ageGroup: g, interests: ['ciencia'], createdAt: '2026-11-14', alias: 'Eco QA' } })); localStorage.setItem('ecos.app.progress.v1', JSON.stringify(p)); } }, arg: [g, FULL] });
    await page.locator('[data-universe][data-view="browse"]').waitFor({ timeout: 20000 });
    await wait(1200);
    await page.getByRole('button', { name: /Top exploradores/ }).click();
    await page.locator('.rk').waitFor();
    await wait(1600);
    const me = await page.locator('#rk-me').innerText();
    // FULL = 4 estrellas → empata con «Meridiani (demo)» y el usuario va primero: #6
    if (!/#6 de 10/i.test(me)) logs.push(`[${tag}] posición inesperada: ${me}`);
    if (!(await page.getByText('Datos de demostración').first().isVisible())) logs.push(`[${tag}] falta «Datos de demostración»`);
    if (!(await page.getByText('Ranking global — Pendiente').isVisible())) logs.push(`[${tag}] falta la nota de backend pendiente`);
    if ((await page.locator('tr.is-me').count()) !== 1) logs.push(`[${tag}] fila del usuario no encontrada`);
    if (/Próximamente/i.test(await page.locator('body').innerText())) logs.push(`[${tag}] aparece «Próximamente»`);
    const foc = await page.evaluate(() => document.activeElement?.className);
    if (foc !== 'rk__h1') logs.push(`[${tag}] foco inicial en ${foc}`);
    await overflowCheck(page, tag);
    console.log('✓', tag, me.replace(/\n/g, ' '));
    await shot(page, `${tag}-ranking`);
    await page.keyboard.press('Escape');
    await page.locator('[data-universe][data-view="browse"]').waitFor({ timeout: 20000 });
    if (g === 'junior') {
      // también desde Mis logros
      await page.getByRole('button', { name: /Mis logros/ }).click();
      await page.locator('.ml-root[data-phase="space"]').waitFor({ timeout: 25000 });
      await wait(1500);
      await page.locator('.rank-link').click();
      await page.locator('.rk').waitFor();
      if (!(await page.getByRole('button', { name: /Mis logros/ }).first().isVisible())) logs.push(`[${tag}] volver a Mis logros no visible`);
      console.log('✓ ranking accesible desde Mis logros');
      await page.goto(BASE);
      await page.locator('[data-universe][data-view="browse"]').waitFor({ timeout: 20000 });
    }
    if (vp === 'desk' && g === 'discovery') {
      await wait(800);
      await page.locator('.uni-btn--profile').click();
      await page.locator('.prof').waitFor();
      await page.getByRole('button', { name: 'Crear clave secreta' }).click();
      await page.getByLabel('Clave secreta', { exact: true }).fill('polvo-rojo-9');
      await page.getByLabel('Repite la clave').fill('polvo-rojo-9');
      await page.getByRole('button', { name: 'Crear clave secreta' }).click();
      await page.getByText('Clave creada').waitFor();
      const st = await page.evaluate(() => localStorage.getItem('ecos.secret.v1') ?? '');
      if (st.includes('polvo') || !/PBKDF2-SHA-256/.test(st)) logs.push(`[key] almacenamiento inesperado: ${st.slice(0, 60)}`);
      await page.getByRole('button', { name: 'Bloquear ahora' }).click();
      await page.locator('.prof__key--lock input').fill('otra-clave');
      await page.getByRole('button', { name: 'Desbloquear' }).click();
      await page.getByText('Clave incorrecta').waitFor();
      if (!(await page.locator('.prof__save', { hasText: 'Guardar perfil' }).isDisabled())) logs.push('[key] perfil editable estando bloqueado');
      await page.locator('.prof__key--lock input').fill('polvo-rojo-9');
      await page.getByRole('button', { name: 'Desbloquear' }).click();
      await page.locator('.prof__key--lock').waitFor({ state: 'detached' });
      const prog = await page.evaluate(() => localStorage.getItem('ecos.app.progress.v1'));
      if (!prog?.includes('spirit-legado')) logs.push('[key] el progreso cambió al usar la clave');
      console.log('✓ clave secreta local: hash con sal, bloqueo y desbloqueo');
      await shot(page, 'key-desk-perfil');
    }
    await ctx.close();
  }
}
await browser.close();

// 4) Sin WebGL (fallback CSS/SVG)
if (run('nogl')) {
  const b2 = await chromium.launch({ executablePath: process.env.CHROME ?? '/usr/bin/google-chrome', args: ['--disable-3d-apis', '--disable-gpu', '--no-sandbox'] });
  for (const vp of ['desk', 'mob']) {
    const { ctx, page } = await open(b2, `nogl-${vp}`, vp, '?view=logros', seedSeen);
    const gl = await page.locator('.ml-root').getAttribute('data-gl');
    if (gl !== 'css') logs.push(`[nogl] data-gl=${gl}`);
    await wait(700);
    await shot(page, `nogl-${vp}-1-suelo`);
    await page.locator('.ml-root[data-phase="space"]').waitFor({ timeout: 20000 });
    await wait(2600);
    await shot(page, `nogl-${vp}-2-espacio`);
    await ctx.close();
    // universo y ruta sin WebGL: planetas CSS + ruta en Canvas 2D
    const u = await open(b2, `nogl-uni-${vp}`, vp, '', profileInit('discovery'));
    await u.page.locator('[data-universe][data-view="browse"]').waitFor({ timeout: 20000 });
    const r = await u.page.locator('[data-universe]').getAttribute('data-render');
    if (r !== 'css') logs.push(`[nogl-uni-${vp}] data-render=${r}`);
    await wait(800);
    await shot(u.page, `nogl-${vp}-3-universo`);
    await u.page.getByRole('button', { name: /Viajar a Marte/ }).click();
    await u.page.locator('.arrive').waitFor();
    await wait(1800);
    await u.page.getByRole('button', { name: /Explorar Spirit/ }).click();
    await u.page.locator('.sr').waitFor();
    await wait(1500);
    await shot(u.page, `nogl-${vp}-4-ruta-spirit`);
    await u.ctx.close();
  }
  // ?gl=0 en un navegador CON WebGL: debe forzar el modo CSS
  {
    const b3 = await chromium.launch({ executablePath: process.env.CHROME ?? '/usr/bin/google-chrome', args: GL });
    const { ctx, page } = await open(b3, 'gl0', 'desk', '?gl=0', profileInit('explorer'));
    await page.locator('[data-universe][data-view="browse"]').waitFor({ timeout: 20000 });
    const r = await page.locator('[data-universe]').getAttribute('data-render');
    if (r !== 'css') logs.push(`[gl0] data-render=${r}`);
    else console.log('✓ ?gl=0 → universo CSS');
    await ctx.close();
    await b3.close();
  }
  await b2.close();
}
console.log('\n=== LOGS (' + logs.length + ') ===\n' + logs.join('\n'));
