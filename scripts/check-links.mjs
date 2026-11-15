// Auditoría de enlaces: busca todas las URL externas del proyecto, comprueba su estado HTTP
// y genera docs/LINKS.md. Uso: node scripts/check-links.mjs   (requiere red; Node ≥ 18)
import { readFileSync, writeFileSync, readdirSync, statSync } from 'node:fs';
import { join, relative } from 'node:path';

const ROOT = new URL('..', import.meta.url).pathname;
const SCAN = ['src', 'docs', 'README.md', 'CHANGELOG.md', 'TESTING.md', 'index.html', 'scripts', '.github'];
const SKIP_FILES = new Set(['docs/LINKS.md', 'docs/LINKS-changes.md']);
// enlaces del propio proyecto (repositorio y prototipo en GitHub Pages): no son fuentes de datos
const PROJECT = [/^https:\/\/github\.com\/Anyxg12\/Ecos-space-apps/, /^https:\/\/anyxg12\.github\.io\/Ecos-space-apps/];
const IGNORE = [/^http:\/\/www\.w3\.org\/2000\/svg/, /^https?:\/\/localhost/, /<usuario>|<user>|<repositorio>|<repository>/, ...PROJECT];
const UA = 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124 Safari/537.36';
const isOfficial = (u) => {
  const h = new URL(u).hostname;
  return h === 'nasa.gov' || h.endsWith('.nasa.gov');
};

const files = [];
const walk = (p) => {
  const st = statSync(p);
  if (st.isDirectory()) for (const f of readdirSync(p)) walk(join(p, f));
  else if (/\.(tsx?|json|md|html|css|mjs|ya?ml)$/.test(p)) files.push(p);
};
for (const s of SCAN) {
  try { walk(join(ROOT, s)); } catch { /* no existe */ }
}

const uses = new Map();
for (const f of files) {
  const rel = relative(ROOT, f);
  if (SKIP_FILES.has(rel) || rel === 'scripts/check-links.mjs') continue;
  const txt = readFileSync(f, 'utf8');
  for (const m of txt.matchAll(/https?:\/\/[^\s"'`)<>\]|]+/g)) {
    const u = m[0].replace(/[.,;:]+$/, '');
    if (IGNORE.some((r) => r.test(u))) continue;
    if (!uses.has(u)) uses.set(u, new Set());
    uses.get(u).add(rel);
  }
}

async function check(u) {
  for (let attempt = 0; attempt < 3; attempt++) {
    try {
      const ctl = new AbortController();
      const t = setTimeout(() => ctl.abort(), 30000);
      const r = await fetch(u, { method: 'GET', redirect: 'follow', headers: { 'user-agent': UA, range: 'bytes=0-2047' }, signal: ctl.signal });
      clearTimeout(t);
      await r.body?.cancel();
      return { status: r.status, final: r.url };
    } catch (e) {
      if (attempt === 2) return { status: 0, final: '', err: String(e.cause?.code ?? e.name) };
    }
  }
}

const rows = [];
for (const [u, where] of [...uses].sort((a, b) => a[0].localeCompare(b[0]))) {
  const r = await check(u);
  const ok = r.status >= 200 && r.status < 400;
  const redirected = r.final && r.final.replace(/\/$/, '') !== u.replace(/\/$/, '');
  rows.push({ u, where: [...where].sort(), ...r, ok, redirected, official: isOfficial(u), tracking: /[?&]utm_/.test(u) });
  console.log(`${r.status || 'ERR'} ${isOfficial(u) ? 'NASA' : '----'} ${u}`);
}

const today = new Date().toLocaleDateString('es-EC', { timeZone: 'America/Guayaquil', year: 'numeric', month: 'long', day: 'numeric' });
let md = `# Auditoría de enlaces / Link audit\n\nGenerado con \`node scripts/check-links.mjs\` el ${today} (hora de Ecuador). Se listan **todas** las URL externas del código y la documentación (se excluyen el espacio de nombres SVG del W3C, \`localhost\` y los enlaces del propio proyecto: el repositorio https://github.com/Anyxg12/Ecos-space-apps y el prototipo en línea https://anyxg12.github.io/Ecos-space-apps/, que no son fuentes de datos).\n\n`;
md += `Regla del proyecto: solo fuentes **oficiales de la NASA** (dominios \`nasa.gov\`), sin parámetros de seguimiento (\`utm_*\`). HTTP 206 = respuesta parcial correcta (el script pide solo los primeros 2 KB de cada recurso).\n\n`;
const bad = rows.filter((r) => !r.ok || !r.official || r.tracking);
md += `**Resumen:** ${rows.length} enlaces · ${rows.filter((r) => r.official).length} oficiales NASA · ${rows.filter((r) => r.ok).length} responden 2xx/3xx · ${bad.length} con incidencias.\n\n`;
md += `| # | URL | Dónde se usa | HTTP | Oficial NASA | Nota |\n|---|---|---|---|---|---|\n`;
rows.forEach((r, i) => {
  const note = [!r.ok && `sin respuesta (${r.err ?? r.status})`, r.redirected && `redirige a ${r.final}`, r.tracking && 'tiene parámetro utm'].filter(Boolean).join('; ');
  md += `| ${i + 1} | ${r.u} | ${r.where.map((w) => '`' + w + '`').join('<br>')} | ${r.status || '—'} | ${r.official ? 'Sí' : '**No**'} | ${note || '—'} |\n`;
});
md += `\n## Cambios de la auditoría del 15 nov 2026\n\n`;
md += readFileSync(join(ROOT, 'docs/LINKS-changes.md'), 'utf8');
writeFileSync(join(ROOT, 'docs/LINKS.md'), md);
console.log(`\n${rows.length} enlaces, ${bad.length} con incidencias → docs/LINKS.md`);
