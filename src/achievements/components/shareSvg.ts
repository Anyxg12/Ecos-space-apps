import type { Achievement, Badge } from '../types';
import { layoutStars } from '../layout';

/**
 * Genera la tarjeta «Mi constelación» como SVG autónomo (1080×1350) para verla y descargarla como PNG.
 * Todo dibujado por código.
 */
const c = { bg: ['#050814', '#03050c', '#010207'] as [string, string, string], fg: '#eef2fb', muted: '#a7b2c8', accent: '#f2d48c', line: '#c4d4f5', font: "'Segoe UI', system-ui, sans-serif", serif: "Georgia, 'Palatino Linotype', serif", title: '#ffffff' };
const esc = (s: string) => s.replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]!);
const LOGO = `<g fill="none" stroke="#f7f4ee" stroke-width="3"><path d="M52 13 H14 V67 H52 M14 40 H46"/><path d="M117.5 21.5 A27 27 0 1 0 117.5 58.5"/><path d="M262 22 C257 14 249 12.5 242 12.5 C231 12.5 224 18 224 26 C224 35 232 37.5 243 40 C255 42.5 263 46 263 55 C263 63 255 67.5 243 67.5 C234 67.5 226 64 221 57"/><circle cx="165" cy="40" r="27"/></g><path d="M119 40 A46 12 0 0 0 211 40" transform="rotate(-16 165 40)" fill="none" stroke="#e2b765" stroke-width="2.6"/><path d="M119 40 A46 12 0 0 1 211 40" transform="rotate(-16 165 40)" fill="none" stroke="#e2b765" stroke-width="2.6" opacity=".8"/>`;

export function buildShareSvg(opts: { achievements: Achievement[]; edges: { from: string; to: string }[]; badges: Badge[]; demo: boolean }) {
  const { achievements, edges, badges, demo } = opts;
  const W = 1080, H = 1350;
  const box = { x: 110, y: 330, w: 860, h: 640 };
  const placed = layoutStars(achievements, false);
  const pos = new Map(placed.map((p) => [p.a.id, { x: box.x + p.x * box.w, y: box.y + p.y * box.h, a: p.a }]));
  let rng = 11;
  const r = () => ((rng = (rng * 16807) % 2147483647) - 1) / 2147483646;
  const stars = Array.from({ length: 160 }, () => `<circle cx="${(r() * W).toFixed(1)}" cy="${(r() * H).toFixed(1)}" r="${(0.6 + r() * r() * 2.2).toFixed(2)}" fill="#fff" opacity="${(0.2 + r() * 0.6).toFixed(2)}"/>`).join('');
  const lines = edges
    .map((e) => {
      const p = pos.get(e.from), q = pos.get(e.to);
      if (!p || !q) return '';
      const locked = p.a.status === 'locked' || q.a.status === 'locked';
      const len = Math.hypot(q.x - p.x, q.y - p.y) || 1;
      const ux = (q.x - p.x) / len, uy = (q.y - p.y) / len, g = 24;
      return `<line x1="${p.x + ux * g}" y1="${p.y + uy * g}" x2="${q.x - ux * g}" y2="${q.y - uy * g}" stroke="${c.line}" stroke-width="1.6" ${locked ? 'stroke-dasharray="3 9" opacity=".35"' : 'opacity=".45"'} stroke-linecap="round"/>`;
    })
    .join('');
  const starGlyphs = [...pos.values()]
    .map(({ x, y, a }) => {
      const locked = a.status === 'locked';
      const s = (a.magnitude ?? 1) * 22;
      const glyph = locked
        ? `<circle cx="${x}" cy="${y}" r="16" fill="none" stroke="${c.muted}" stroke-width="1.4" stroke-dasharray="3 4" opacity=".5"/><circle cx="${x}" cy="${y}" r="2.6" fill="#cdd6eb" opacity=".6"/>`
        : `<circle cx="${x}" cy="${y}" r="${s * 1.8}" fill="url(#halo)"/><rect x="${x - s * 2.4}" y="${y - 0.9}" width="${s * 4.8}" height="1.8" fill="url(#spk)"/><rect x="${x - 0.9}" y="${y - s * 2.4}" width="1.8" height="${s * 4.8}" fill="url(#spkv)"/><circle cx="${x}" cy="${y}" r="${s * 0.2}" fill="#fff"/>`;
      const ly = y + s + 30;
      return `${glyph}<text x="${x}" y="${ly}" text-anchor="middle" font-size="24" fill="${locked ? c.muted : c.fg}" font-family="${c.font}">${esc(a.title)}</text>${locked ? `<text x="${x}" y="${ly + 26}" text-anchor="middle" font-size="16" letter-spacing="3" fill="${c.muted}" font-family="${c.font}">BLOQUEADO</text>` : ''}`;
    })
    .join('');
  const unlocked = achievements.filter((a) => a.status === 'unlocked');
  const badgeTxt = badges.length ? `Insignias: ${badges.map((b) => b.name + (b.provisional ? ' (provisional)' : '')).join(' · ')}` : '';
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${H}" width="${W}" height="${H}">
  <defs><linearGradient id="bg" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${c.bg[0]}"/><stop offset=".55" stop-color="${c.bg[1]}"/><stop offset="1" stop-color="${c.bg[2]}"/></linearGradient>
  <radialGradient id="halo"><stop offset="0" stop-color="#fff4dc" stop-opacity=".55"/><stop offset=".25" stop-color="#e6ecff" stop-opacity=".16"/><stop offset="1" stop-color="#e6ecff" stop-opacity="0"/></radialGradient><linearGradient id="spk"><stop offset="0" stop-color="#fff" stop-opacity="0"/><stop offset=".5" stop-color="#fff" stop-opacity=".9"/><stop offset="1" stop-color="#fff" stop-opacity="0"/></linearGradient><linearGradient id="spkv" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#fff" stop-opacity="0"/><stop offset=".5" stop-color="#fff" stop-opacity=".9"/><stop offset="1" stop-color="#fff" stop-opacity="0"/></linearGradient><radialGradient id="earth" cx=".5" cy=".5" r=".5"><stop offset=".9" stop-color="${c.accent}" stop-opacity=".0"/><stop offset=".96" stop-color="${c.accent}" stop-opacity=".45"/><stop offset="1" stop-color="${c.accent}" stop-opacity="0"/></radialGradient></defs>
  <rect width="${W}" height="${H}" fill="url(#bg)"/>${stars}
  <circle cx="${W / 2}" cy="${H + 1590}" r="1780" fill="url(#earth)"/><circle cx="${W / 2}" cy="${H + 1590}" r="1700" fill="#03060c"/>
  <g transform="translate(${W / 2 - 150} 70)">${LOGO}</g>
  <text x="${W / 2}" y="210" text-anchor="middle" font-size="20" letter-spacing="7" fill="${c.accent}" font-family="${c.font}">MI CONSTELACIÓN</text>
  <text x="${W / 2}" y="266" text-anchor="middle" font-size="44" fill="${c.title}" font-family="${c.serif}">${unlocked.length} de ${achievements.length} logros</text>
  ${lines}${starGlyphs}
  <text x="${W / 2}" y="1100" text-anchor="middle" font-size="24" fill="${c.fg}" font-family="${c.font}">${esc(badgeTxt)}</text>
  ${demo ? `<rect x="${W / 2 - 160}" y="1140" width="320" height="40" rx="20" fill="none" stroke="${c.muted}" stroke-dasharray="6 5"/><text x="${W / 2}" y="1167" text-anchor="middle" font-size="17" letter-spacing="3" fill="${c.muted}" font-family="${c.font}">DATOS DE DEMOSTRACIÓN</text>` : ''}
  <text x="${W / 2}" y="1300" text-anchor="middle" font-size="16" fill="${c.muted}" font-family="${c.font}" opacity=".8">ECOS · Gráficos generados por código</text>
</svg>`;
}

export async function svgToPngBlob(svg: string, w = 1080, h = 1350): Promise<Blob> {
  const url = URL.createObjectURL(new Blob([svg], { type: 'image/svg+xml' }));
  try {
    const img = new Image();
    img.decoding = 'async';
    await new Promise<void>((res, rej) => {
      img.onload = () => res();
      img.onerror = () => rej(new Error('svg'));
      img.src = url;
    });
    const canvas = document.createElement('canvas');
    canvas.width = w;
    canvas.height = h;
    canvas.getContext('2d')!.drawImage(img, 0, 0, w, h);
    return await new Promise<Blob>((res, rej) => canvas.toBlob((b) => (b ? res(b) : rej(new Error('png'))), 'image/png'));
  } finally {
    URL.revokeObjectURL(url);
  }
}
