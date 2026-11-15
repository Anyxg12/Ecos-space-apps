import type { AgeGroup } from '../../state/types';

/**
 * Motor de la ruta narrativa: un camino en perspectiva por el que avanza la cámara (Canvas 2D,
 * sin WebGL). La posición `pos` (0…N) es continua; cada parada está a `D` unidades de la anterior.
 * Distancias, tamaños y posiciones son artísticos (no a escala).
 */
type Place = 'marte' | 'luna';
interface Pal {
  sky: string[]; ground: [string, string]; far: string[]; road: string; edge: string | null; line: string;
  rock: string; rockHi: string; crater: string; beacon: string; beaconOn: string; label: string; fog: string;
  outline: string | null; grid: string | null; stars: number; sun: 'sun' | 'earth' | 'earthCute' | 'ring' | null;
}
const PAL: Record<Place, Record<AgeGroup, Pal>> = {
  marte: {
    junior: { sky: ['#0f4c5c', '#2e7d86', '#ffcf9a'], ground: ['#f39a5c', '#e0703a'], far: ['#8a72c9', '#6a55a8'], road: '#ffe9cc', edge: '#123a46', line: '#ff7a3d', rock: '#c2562a', rockHi: '#f7b079', crater: '#d9653a', beacon: '#fff4e2', beaconOn: '#ffd23f', label: '#123a46', fog: '#ffcf9a', outline: '#123a46', grid: null, stars: 0, sun: 'ring' },
    explorer: { sky: ['#03040d', '#0d0a2a', '#3a1450'], ground: ['#0b0a22', '#05040f'], far: ['#2a1550', '#1a0d38'], road: 'rgba(79,227,255,0.10)', edge: '#4fe3ff', line: '#4fe3ff', rock: '#1a0f33', rockHi: '#c06bff', crater: '#c06bff', beacon: '#4fe3ff', beaconOn: '#ffd23f', label: '#bff6ff', fog: '#2a1450', outline: null, grid: 'rgba(79,227,255,0.22)', stars: 120, sun: null },
    discovery: { sky: ['#1f1612', '#7d5a45', '#d4a57f'], ground: ['#9a5a3a', '#4a2516'], far: ['#a4775c', '#8a5a40'], road: 'rgba(60,28,16,0.35)', edge: null, line: 'rgba(40,18,10,0.55)', rock: '#4e281a', rockHi: '#9a5c3c', crater: '#6e3a24', beacon: '#f3e6d0', beaconOn: '#e8c38a', label: '#f6efe6', fog: '#d4a57f', outline: null, grid: null, stars: 0, sun: 'sun' },
  },
  luna: {
    junior: { sky: ['#082e3a', '#0f4c5c', '#2a6c78'], ground: ['#f3ead9', '#d8ccb6'], far: ['#9b86d6', '#7b66b8'], road: '#ffffff', edge: '#123a46', line: '#ff7a3d', rock: '#b9a98f', rockHi: '#fff8ea', crater: '#a48fd8', beacon: '#fff4e2', beaconOn: '#ffd23f', label: '#123a46', fog: '#2a6c78', outline: '#123a46', grid: null, stars: 70, sun: 'earthCute' },
    explorer: { sky: ['#020309', '#060a1e', '#0d1a3a'], ground: ['#0a0e22', '#04050d'], far: ['#122244', '#0b1530'], road: 'rgba(79,227,255,0.10)', edge: '#4fe3ff', line: '#4fe3ff', rock: '#101833', rockHi: '#4fe3ff', crater: '#4fe3ff', beacon: '#4fe3ff', beaconOn: '#ffd23f', label: '#bff6ff', fog: '#0d1a3a', outline: null, grid: 'rgba(79,227,255,0.2)', stars: 180, sun: 'earth' },
    discovery: { sky: ['#000000', '#030304', '#0a0a0c'], ground: ['#8f8b84', '#3c3a37'], far: ['#77736d', '#5d5a55'], road: 'rgba(30,30,30,0.18)', edge: null, line: 'rgba(25,25,25,0.4)', rock: '#3a3835', rockHi: '#b5b0a7', crater: '#56534e', beacon: '#eceae4', beaconOn: '#e8c38a', label: '#f3f1ec', fog: '#4a4845', outline: null, grid: null, stars: 160, sun: 'earth' },
  },
};

const D = 100; // distancia entre paradas (unidades de mundo)
const LOOK = 21; // la cámara se detiene a esta distancia delante de cada baliza
const FAR = 720;

function hash(n: number) {
  const s = Math.sin(n * 127.1 + 311.7) * 43758.5453;
  return s - Math.floor(s);
}
const roadX = (z: number) => 16 * Math.sin(z / 150) + 7 * Math.sin(z / 47 + 1.3);

export interface RouteSceneOpts {
  place: Place;
  variant: AgeGroup;
  count: number; // nº de balizas (paradas + legado)
  labels: string[];
  /** escenografía junto a cada baliza (tipo de parada) */
  sets?: string[];
  /** movimiento reducido: sin salida de la Tierra animada */
  reduced?: boolean;
}

export class RouteScene {
  private ctx: CanvasRenderingContext2D;
  private W = 1;
  private H = 1;
  private dpr = 1;
  private pal: Pal;
  pos = 0;
  active = 0;
  done = new Set<number>();
  private t = 0;
  private hits: { i: number; x: number; y: number; r: number }[] = [];
  private starField: { x: number; y: number; r: number; a: number }[] = [];

  constructor(private canvas: HTMLCanvasElement, private o: RouteSceneOpts) {
    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error('2D canvas no disponible');
    this.ctx = ctx;
    this.pal = PAL[o.place][o.variant];
    this.starField = Array.from({ length: this.pal.stars }, (_, i) => ({ x: hash(i + 1), y: hash(i + 77) * 0.62, r: 0.4 + hash(i + 9) * 1.2, a: 0.3 + hash(i + 3) * 0.7 }));
    this.resize();
  }

  resize() {
    const r = this.canvas.getBoundingClientRect();
    this.dpr = Math.min(window.devicePixelRatio || 1, 2);
    this.W = Math.max(1, r.width);
    this.H = Math.max(1, r.height);
    this.canvas.width = Math.round(this.W * this.dpr);
    this.canvas.height = Math.round(this.H * this.dpr);
  }

  /** Índice de baliza bajo el punto (coordenadas CSS del canvas) o null. */
  hitTest(x: number, y: number) {
    for (const h of this.hits) if (Math.hypot(x - h.x, y - h.y) < Math.max(22, h.r)) return h.i;
    return null;
  }

  draw(dt = 0) {
    this.t += dt;
    const { ctx, W, H, pal } = this;
    ctx.setTransform(this.dpr, 0, 0, this.dpr, 0, 0);
    const camZ = this.pos * D - LOOK;
    const camX = roadX(camZ + 20) * 0.9;
    const camH = 5.2;
    const horizon = H * (W < 700 ? 0.36 : 0.44);
    const f = Math.min(W, H * 1.6) * 0.85;
    const proj = (x: number, y: number, z: number) => {
      const dz = Math.max(0.5, z - camZ);
      const s = f / dz;
      return { x: W / 2 + (x - camX) * s, y: horizon + (camH - y) * s, s, dz };
    };
    const fogA = (dz: number) => Math.min(1, Math.max(0, (dz - 60) / (FAR - 60))) ** 1.3;

    // cielo
    const g = ctx.createLinearGradient(0, 0, 0, horizon);
    pal.sky.forEach((c, i) => g.addColorStop(i / (pal.sky.length - 1), c));
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, W, horizon + 2);
    for (const s of this.starField) {
      ctx.globalAlpha = s.a * (0.75 + 0.25 * Math.sin(this.t * 1.5 + s.x * 40));
      ctx.fillStyle = '#fff';
      ctx.fillRect(((s.x * W * 1.3 - camX * 0.6 - this.pos * 6) % (W * 1.3) + W * 1.3) % (W * 1.3) - W * 0.15, s.y * horizon, s.r, s.r);
    }
    ctx.globalAlpha = 1;
    this.drawSky(horizon, camX);

    // montañas lejanas (parallax); en Discovery, desenfocadas (profundidad de campo)
    const dof = this.o.variant === 'discovery';
    pal.far.forEach((c, li) => {
      const k = 0.25 + li * 0.25;
      const amp = H * (0.07 - li * 0.018);
      ctx.beginPath();
      ctx.moveTo(0, horizon + 2);
      for (let x = 0; x <= W + 8; x += 8) {
        const u = (x + camX * 9 * k + this.pos * 40 * k) / (140 + li * 60);
        const n = Math.sin(u) * 0.5 + Math.sin(u * 2.3 + li) * 0.3 + Math.sin(u * 5.1 + 2) * 0.12;
        ctx.lineTo(x, horizon - amp * (0.55 + n * 0.6) - li * 2);
      }
      ctx.lineTo(W, horizon + 2);
      ctx.closePath();
      ctx.fillStyle = c;
      ctx.fill();
      if (pal.outline) {
        ctx.strokeStyle = pal.outline;
        ctx.lineWidth = 2.5;
        ctx.stroke();
      } else if (this.o.variant === 'explorer') {
        ctx.strokeStyle = this.o.place === 'marte' ? 'rgba(192,107,255,0.7)' : 'rgba(79,227,255,0.45)';
        ctx.lineWidth = 1.2;
        ctx.stroke();
      }
    });

    if (dof) {
      // profundidad de campo barata: velo atmosférico sobre lo lejano (sin filtros de desenfoque, que son caros)
      const hz2 = ctx.createLinearGradient(0, horizon - H * 0.22, 0, horizon + 4);
      hz2.addColorStop(0, 'rgba(0,0,0,0)');
      hz2.addColorStop(1, this.o.place === 'luna' ? 'rgba(150,150,155,0.35)' : 'rgba(214,170,130,0.38)');
      ctx.fillStyle = hz2;
      ctx.fillRect(0, horizon - H * 0.22, W, H * 0.22 + 4);
    }
    // suelo
    const gg = ctx.createLinearGradient(0, horizon, 0, H);
    gg.addColorStop(0, pal.ground[0]);
    gg.addColorStop(1, pal.ground[1]);
    ctx.fillStyle = gg;
    ctx.fillRect(0, horizon, W, H - horizon);
    if (dof) {
      // textura de regolito (ruido) que se desplaza con la cámara
      const pat = this.noisePattern();
      if (pat) {
        pat.setTransform(new DOMMatrix().translate(-camX * 6, (this.pos * D * 3) % 256).scale(1, 0.6));
        ctx.save();
        ctx.globalAlpha = 0.5;
        ctx.fillStyle = pat;
        ctx.fillRect(0, horizon, W, H - horizon);
        ctx.restore();
      }
      // luz rasante del sol (lado izquierdo) y sombra al otro lado
      const lg = ctx.createLinearGradient(0, 0, W, 0);
      lg.addColorStop(0, 'rgba(255,236,210,0.10)');
      lg.addColorStop(0.6, 'rgba(0,0,0,0)');
      lg.addColorStop(1, 'rgba(0,0,0,0.22)');
      ctx.fillStyle = lg;
      ctx.fillRect(0, horizon, W, H - horizon);
    }
    if (this.o.variant === 'discovery') {
      const hz = ctx.createLinearGradient(0, horizon - 30, 0, horizon + 60);
      hz.addColorStop(0, 'rgba(0,0,0,0)');
      hz.addColorStop(0.5, pal.fog + '88');
      hz.addColorStop(1, 'rgba(0,0,0,0)');
      ctx.fillStyle = hz;
      ctx.fillRect(0, horizon - 30, W, 90);
    }

    // rejilla (explorer)
    if (pal.grid) {
      ctx.strokeStyle = pal.grid;
      ctx.lineWidth = 1;
      const z0 = Math.ceil(camZ / 20) * 20;
      for (let z = z0; z < camZ + FAR; z += 20) {
        const p = proj(0, 0, z);
        ctx.globalAlpha = 1 - fogA(p.dz);
        ctx.beginPath();
        ctx.moveTo(0, p.y);
        ctx.lineTo(W, p.y);
        ctx.stroke();
      }
      ctx.globalAlpha = 1;
      for (let x = -400; x <= 400; x += 25) {
        const a = proj(x + Math.round(camX / 25) * 25, 0, camZ + 2);
        const b = proj(x + Math.round(camX / 25) * 25, 0, camZ + FAR);
        ctx.beginPath();
        ctx.moveTo(a.x, a.y);
        ctx.lineTo(b.x, b.y);
        ctx.stroke();
      }
    }

    // camino
    const L: { x: number; y: number }[] = [];
    const R: { x: number; y: number }[] = [];
    const C: { x: number; y: number; s: number; dz: number }[] = [];
    for (let dz = 1.5; dz < FAR; dz *= 1.07) {
      const z = camZ + dz;
      const cx = roadX(z);
      L.push(proj(cx - 3.6, 0, z));
      R.push(proj(cx + 3.6, 0, z));
      C.push(proj(cx, 0, z));
    }
    ctx.beginPath();
    L.forEach((p, i) => (i ? ctx.lineTo(p.x, p.y) : ctx.moveTo(p.x, p.y)));
    for (let i = R.length - 1; i >= 0; i--) ctx.lineTo(R[i].x, R[i].y);
    ctx.closePath();
    ctx.fillStyle = pal.road;
    ctx.fill();
    if (pal.edge) {
      ctx.strokeStyle = pal.edge;
      ctx.lineWidth = this.o.variant === 'junior' ? 3 : 1.6;
      if (this.o.variant === 'explorer') {
        ctx.shadowColor = pal.edge;
        ctx.shadowBlur = 10;
      }
      for (const side of [L, R]) {
        ctx.beginPath();
        side.forEach((p, i) => (i ? ctx.lineTo(p.x, p.y) : ctx.moveTo(p.x, p.y)));
        ctx.stroke();
      }
      ctx.shadowBlur = 0;
    }
    // huellas / línea central discontinua
    ctx.strokeStyle = pal.line;
    for (let i = 1; i < C.length; i++) {
      const a = C[i - 1];
      const b = C[i];
      const seg = Math.floor((camZ + a.dz) / 6);
      if (seg % 2) continue;
      ctx.globalAlpha = 1 - fogA(a.dz);
      ctx.lineWidth = Math.min(this.o.variant === 'junior' ? 9 : 4, Math.max(0.6, a.s * (this.o.variant === 'junior' ? 0.45 : 0.14)));
      if (this.o.place === 'marte' && this.o.variant !== 'junior') {
        for (const off of [-1.5, 1.5]) {
          ctx.beginPath();
          ctx.moveTo(a.x + off * a.s, a.y);
          ctx.lineTo(b.x + off * b.s, b.y);
          ctx.stroke();
        }
      } else {
        ctx.beginPath();
        ctx.moveTo(a.x, a.y);
        ctx.lineTo(b.x, b.y);
        ctx.stroke();
      }
    }
    ctx.globalAlpha = 1;

    // objetos (rocas, cráteres, balizas) ordenados por profundidad
    type Obj = { z: number; draw: () => void };
    const objs: Obj[] = [];
    const g0 = Math.floor(camZ / 9);
    for (let k = g0; k < g0 + FAR / 9; k++) {
      for (const side of [-1, 1]) {
        const h = hash(k * 2 + (side > 0 ? 1 : 0));
        if (h < 0.35) continue;
        const z = k * 9 + hash(k + 5) * 9;
        if (z < camZ + 1.5) continue;
        const x = roadX(z) + side * (7 + hash(k * 3 + side) * 70);
        const size = 0.6 + hash(k * 7 + side) ** 2 * 3.4;
        const crater = hash(k * 11 + side) > 0.62;
        objs.push({ z, draw: () => this.drawProp(proj, fogA, x, z, size, crater, k * 13 + side) });
      }
    }
    this.hits = [];
    for (let i = 0; i < this.o.count; i++) {
      const z = i * D;
      if (z < camZ + 1 || z > camZ + FAR) continue;
      objs.push({ z, draw: () => this.drawBeacon(proj, fogA, i, z) });
      const kind = this.o.sets?.[i];
      if (kind) objs.push({ z: z + 9, draw: () => this.drawSet(proj, fogA, kind, roadX(z + 9) - 12, z + 9) });
    }
    objs.sort((a, b) => b.z - a.z).forEach((o) => o.draw());

    // velo de niebla en el horizonte
    const fg = ctx.createLinearGradient(0, horizon - 4, 0, horizon + H * 0.08);
    fg.addColorStop(0, pal.fog + '00');
    fg.addColorStop(0.15, pal.fog + (this.o.variant === 'explorer' ? '55' : '40'));
    fg.addColorStop(1, pal.fog + '00');
    ctx.fillStyle = fg;
    ctx.fillRect(0, horizon - 4, W, H * 0.08 + 4);

    // el «eco» que guía al visitante (luz de ECOS), siempre delante de la cámara
    const ez = camZ + 11;
    const e = proj(roadX(ez), 1.6 + Math.sin(this.t * 2.2) * 0.25, ez);
    const er = Math.max(4, e.s * 0.55);
    const eg = ctx.createRadialGradient(e.x, e.y, 0, e.x, e.y, er * 4);
    eg.addColorStop(0, 'rgba(255,240,200,0.95)');
    eg.addColorStop(0.25, this.o.variant === 'explorer' ? 'rgba(79,227,255,0.55)' : 'rgba(242,212,140,0.5)');
    eg.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = eg;
    ctx.beginPath();
    ctx.arc(e.x, e.y, er * 4, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#fffaf0';
    ctx.beginPath();
    ctx.arc(e.x, e.y, er * 0.5, 0, Math.PI * 2);
    ctx.fill();
    if (dof) this.cine(horizon);
  }

  private noise: CanvasPattern | null | undefined;
  private noisePattern() {
    if (this.noise !== undefined) return this.noise;
    try {
      const c = document.createElement('canvas');
      c.width = c.height = 256;
      const x = c.getContext('2d')!;
      const img = x.createImageData(256, 256);
      for (let i = 0; i < img.data.length; i += 4) {
        const r = Math.random();
        const light = r > 0.5;
        img.data[i] = img.data[i + 1] = img.data[i + 2] = light ? 255 : 0;
        img.data[i + 3] = Math.floor(Math.abs(r - 0.5) * 2 * 70);
      }
      x.putImageData(img, 0, 0);
      // manchas suaves (piedras pequeñas)
      for (let k = 0; k < 140; k++) {
        x.fillStyle = `rgba(40,30,25,${0.15 + Math.random() * 0.25})`;
        x.beginPath();
        x.ellipse(Math.random() * 256, Math.random() * 256, 1 + Math.random() * 3, 0.6 + Math.random() * 1.5, 0, 0, Math.PI * 2);
        x.fill();
      }
      this.noise = this.ctx.createPattern(c, 'repeat');
    } catch {
      this.noise = null;
    }
    return this.noise;
  }

  /** Discovery: polvo desenfocado (bokeh), etalonaje cálido/frío y viñeta, como un documental. */
  private cine(horizon: number) {
    const { ctx, W, H } = this;
    const moon = this.o.place === 'luna';
    for (let k = 0; k < 7; k++) {
      const ph = (this.t * 0.03 + hash(k + 40)) % 1;
      const bx = ((hash(k + 11) * W + ph * W * 0.3) % (W * 1.1)) - W * 0.05;
      const by = horizon + (0.25 + hash(k + 21) * 0.7) * (H - horizon) - Math.sin(this.t * 0.4 + k) * 8;
      const br = 14 + hash(k + 31) * 30;
      const g = ctx.createRadialGradient(bx, by, br * 0.2, bx, by, br);
      g.addColorStop(0, moon ? 'rgba(235,240,255,0.10)' : 'rgba(255,220,180,0.12)');
      g.addColorStop(0.8, moon ? 'rgba(235,240,255,0.05)' : 'rgba(255,220,180,0.05)');
      g.addColorStop(1, 'rgba(0,0,0,0)');
      ctx.fillStyle = g;
      ctx.beginPath();
      ctx.arc(bx, by, br, 0, Math.PI * 2);
      ctx.fill();
    }
    const gr = ctx.createLinearGradient(0, 0, 0, H);
    gr.addColorStop(0, moon ? 'rgba(40,70,110,0.16)' : 'rgba(30,70,90,0.14)');
    gr.addColorStop(0.5, 'rgba(0,0,0,0)');
    gr.addColorStop(1, moon ? 'rgba(20,20,30,0.14)' : 'rgba(120,60,20,0.14)');
    ctx.fillStyle = gr;
    ctx.fillRect(0, 0, W, H);
    const vg = ctx.createRadialGradient(W / 2, H * 0.55, Math.min(W, H) * 0.35, W / 2, H * 0.55, Math.max(W, H) * 0.75);
    vg.addColorStop(0, 'rgba(0,0,0,0)');
    vg.addColorStop(1, 'rgba(0,0,0,0.55)');
    ctx.fillStyle = vg;
    ctx.fillRect(0, 0, W, H);
  }

  private drawSky(horizon: number, camX: number) {
    const { ctx, W, pal } = this;
    const x = W * (W < 700 ? 0.76 : 0.5) - camX * 0.8;
    let y = horizon * (W < 700 ? 0.55 : 0.42);
    if (this.o.place === 'luna' && !this.o.reduced) {
      // salida de la Tierra (Earthrise) al empezar la ruta: sube desde detrás del horizonte lunar
      const k = Math.min(1, this.t / 5 + this.pos * 0.6);
      const e = 1 - Math.pow(1 - k, 3);
      y = horizon + 30 + (y - horizon - 30) * e;
    }
    if (pal.sun === 'sun') {
      const g = ctx.createRadialGradient(x, y, 0, x, y, horizon * 0.5);
      g.addColorStop(0, 'rgba(250,238,220,0.9)');
      g.addColorStop(0.08, 'rgba(240,220,190,0.5)');
      g.addColorStop(1, 'rgba(240,220,190,0)');
      ctx.fillStyle = g;
      ctx.fillRect(0, 0, W, horizon);
    } else if (pal.sun === 'ring') {
      ctx.fillStyle = '#fff4e0';
      ctx.beginPath();
      ctx.arc(x, y, 26, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = '#123a46';
      ctx.lineWidth = 3;
      ctx.stroke();
      ctx.strokeStyle = 'rgba(255,244,224,0.5)';
      ctx.lineWidth = 2;
      ctx.setLineDash([6, 8]);
      ctx.beginPath();
      ctx.arc(x, y, 44, 0, Math.PI * 2);
      ctx.stroke();
      ctx.setLineDash([]);
    } else if (pal.sun === 'earth' || pal.sun === 'earthCute') {
      const r = pal.sun === 'earthCute' ? 30 : this.o.variant === 'explorer' ? 22 : Math.max(24, Math.min(40, W * 0.022));
      if (this.o.variant === 'discovery') {
        const at = ctx.createRadialGradient(x, y, r * 0.9, x, y, r * 1.6);
        at.addColorStop(0, 'rgba(120,180,255,0.35)');
        at.addColorStop(1, 'rgba(120,180,255,0)');
        ctx.fillStyle = at;
        ctx.beginPath();
        ctx.arc(x, y, r * 1.6, 0, Math.PI * 2);
        ctx.fill();
      }
      if (this.o.variant === 'explorer') {
        ctx.strokeStyle = '#4fe3ff';
        ctx.lineWidth = 1.5;
        ctx.shadowColor = '#4fe3ff';
        ctx.shadowBlur = 12;
        ctx.beginPath();
        ctx.arc(x, y, r, 0, Math.PI * 2);
        ctx.stroke();
        ctx.shadowBlur = 0;
        ctx.beginPath();
        ctx.ellipse(x, y, r, r * 0.35, 0, 0, Math.PI * 2);
        ctx.stroke();
        return;
      }
      const g = ctx.createRadialGradient(x - r * 0.3, y - r * 0.3, r * 0.1, x, y, r);
      g.addColorStop(0, '#9fd3ff');
      g.addColorStop(0.6, '#2f6fb8');
      g.addColorStop(1, '#0b2a55');
      ctx.fillStyle = g;
      ctx.beginPath();
      ctx.arc(x, y, r, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = pal.sun === 'earthCute' ? '#7bd389' : 'rgba(120,170,110,0.75)';
      ctx.beginPath();
      ctx.ellipse(x - r * 0.25, y - r * 0.1, r * 0.35, r * 0.22, 0.6, 0, Math.PI * 2);
      ctx.ellipse(x + r * 0.35, y + r * 0.3, r * 0.22, r * 0.14, -0.4, 0, Math.PI * 2);
      ctx.fill();
      // terminador (fase)
      ctx.fillStyle = 'rgba(0,0,0,0.45)';
      ctx.beginPath();
      ctx.arc(x, y, r, -Math.PI / 2, Math.PI / 2);
      ctx.ellipse(x, y, r * 0.4, r, 0, Math.PI / 2, -Math.PI / 2, true);
      ctx.fill();
      if (pal.sun === 'earthCute') {
        ctx.strokeStyle = '#123a46';
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.arc(x, y, r, 0, Math.PI * 2);
        ctx.stroke();
      }
    }
  }

  private drawProp(proj: (x: number, y: number, z: number) => { x: number; y: number; s: number; dz: number }, fogA: (dz: number) => number, x: number, z: number, size: number, crater: boolean, seed: number) {
    const { ctx, pal } = this;
    const p = proj(x, 0, z);
    if (p.x < -200 || p.x > this.W + 200) return;
    const r = size * p.s;
    if (r < 0.6) return;
    ctx.globalAlpha = 1 - fogA(p.dz);
    if (crater) {
      const ex = this.o.variant === 'explorer';
      const dc = this.o.variant === 'discovery';
      if (dc) {
        // cráter realista: borde iluminado arriba-izquierda, fondo en sombra
        const g = ctx.createLinearGradient(p.x, p.y - r * 0.42, p.x, p.y + r * 0.42);
        g.addColorStop(0, 'rgba(0,0,0,0.45)');
        g.addColorStop(1, pal.crater);
        ctx.fillStyle = g;
      } else ctx.fillStyle = ex ? 'rgba(4,4,16,0.85)' : pal.crater;
      ctx.beginPath();
      ctx.ellipse(p.x, p.y, r * 1.6, r * 0.42, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = pal.rockHi;
      ctx.globalAlpha *= ex ? 0.12 : 0.35;
      ctx.beginPath();
      ctx.ellipse(p.x, p.y + r * 0.12, r * 1.25, r * 0.26, 0, 0, Math.PI);
      ctx.fill();
      ctx.globalAlpha = 1 - fogA(p.dz);
      if (pal.outline || ex) {
        ctx.strokeStyle = pal.outline ?? pal.crater;
        ctx.lineWidth = pal.outline ? Math.min(3, Math.max(1, r * 0.08)) : 1.2;
        ctx.beginPath();
        ctx.ellipse(p.x, p.y, r * 1.6, r * 0.42, 0, 0, Math.PI * 2);
        ctx.stroke();
        if (ex && r > 6) {
          ctx.globalAlpha *= 0.5;
          ctx.beginPath();
          ctx.ellipse(p.x, p.y + r * 0.05, r * 1.0, r * 0.24, 0, 0, Math.PI * 2);
          ctx.stroke();
        }
      }
    } else {
      // roca irregular con cara iluminada
      const pts = 7;
      ctx.beginPath();
      for (let i = 0; i <= pts; i++) {
        const a = Math.PI - (i / pts) * Math.PI;
        const rr = r * (0.75 + hash(seed + i) * 0.45);
        const px = p.x + Math.cos(a) * rr * 1.2;
        const py = p.y - Math.sin(a) * rr * 0.9;
        i ? ctx.lineTo(px, py) : ctx.moveTo(px, py);
      }
      ctx.closePath();
      if (this.o.variant !== 'explorer') {
        ctx.fillStyle = 'rgba(0,0,0,0.25)';
        ctx.save();
        ctx.translate(r * 0.5, r * 0.08);
        ctx.fill();
        ctx.restore();
      }
      ctx.fillStyle = pal.rock;
      ctx.fill();
      if (this.o.variant === 'explorer') {
        ctx.strokeStyle = pal.rockHi;
        ctx.lineWidth = 1;
        ctx.stroke();
      } else {
        ctx.save();
        ctx.clip();
        ctx.fillStyle = pal.rockHi;
        ctx.globalAlpha *= this.o.variant === 'junior' ? 0.8 : 0.5;
        ctx.beginPath();
        ctx.ellipse(p.x - r * 0.45, p.y - r * 0.6, r * 0.6, r * 0.35, -0.5, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
        if (pal.outline) {
          ctx.strokeStyle = pal.outline;
          ctx.lineWidth = Math.min(3, Math.max(1, r * 0.1));
          ctx.stroke();
        }
      }
    }
    ctx.globalAlpha = 1;
  }

  /** Escenografía dibujada por código junto a cada parada (ilustrativa, no a escala). */
  private drawSet(proj: (x: number, y: number, z: number) => { x: number; y: number; s: number; dz: number }, fogA: (dz: number) => number, kind: string, x: number, z: number) {
    const { ctx } = this;
    const p = proj(x, 0, z);
    // sólo los decorados cercanos (evita amontonar iconos en el horizonte)
    if (p.dz < 4 || p.dz > 210) return;
    const u = p.s; // píxeles por unidad de mundo
    if (p.x + 6 * u < 0 || p.x - 6 * u > this.W) return;
    const v = this.o.variant;
    const ex = v === 'explorer';
    const jr = v === 'junior';
    const moon = this.o.place === 'luna';
    const C = ex
      ? { metal: 'rgba(8,14,34,0.92)', dark: 'rgba(3,6,16,0.95)', gold: 'rgba(48,36,6,0.92)', panel: 'rgba(10,34,70,0.92)', white: 'rgba(8,14,34,0.92)', line: '#4fe3ff', acc: '#ffd23f', shade: 'rgba(79,227,255,0.10)' }
      : jr
        ? { metal: '#fff4e2', dark: '#123a46', gold: '#ffd27a', panel: '#6a8ff0', white: '#ffffff', line: '#123a46', acc: '#ff7a3d', shade: 'rgba(18,58,70,0.18)' }
        : { metal: moon ? '#c9c7c2' : '#d2c6b6', dark: '#2a2826', gold: '#c39a45', panel: '#1f2c4a', white: '#ebe8e1', line: 'rgba(0,0,0,0.55)', acc: '#e8c38a', shade: 'rgba(0,0,0,0.28)' };
    const fade = 1 - fogA(p.dz);
    // aparece suavemente al acercarse (sin «medio dibujado» al entrar en escena)
    const near = Math.min(1, Math.max(0, (210 - p.dz) / 60));
    ctx.save();
    ctx.globalAlpha = fade * near;
    // que el decorado nunca quede cortado por el borde izquierdo de la pantalla
    ctx.translate(p.dz > 14 ? Math.max(p.x, u * 1.25 * 4.6 + 6) : p.x, p.y);
    const SC = 1.25; // los decorados se dibujan un poco más grandes que el mundo (lectura clara)
    ctx.scale(u * SC, u * SC);
    const uu = u * SC;
    ctx.lineWidth = (jr ? 2.4 : ex ? 1.3 : 0.9) / uu;
    ctx.lineJoin = 'round';
    ctx.lineCap = 'round';
    if (ex) {
      ctx.shadowColor = C.line;
      ctx.shadowBlur = 6;
    }
    ctx.strokeStyle = C.line;
    // sombra proyectada
    ctx.save();
    ctx.shadowBlur = 0;
    ctx.fillStyle = ex ? 'rgba(79,227,255,0.10)' : 'rgba(0,0,0,0.25)';
    ctx.beginPath();
    ctx.ellipse(0.8, 0.05, kind === 'rocket' ? 2.6 : 3.8, 0.55, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
    const P = (pts: number[], fill: string, stroke = true) => {
      ctx.beginPath();
      for (let i = 0; i < pts.length; i += 2) (i ? ctx.lineTo(pts[i], pts[i + 1]) : ctx.moveTo(pts[i], pts[i + 1]));
      ctx.closePath();
      ctx.fillStyle = fill;
      ctx.fill();
      if (stroke) ctx.stroke();
    };
    const R = (x0: number, y0: number, w: number, h: number, fill: string, stroke = true) => P([x0, y0, x0 + w, y0, x0 + w, y0 + h, x0, y0 + h], fill, stroke);
    const O = (cx: number, cy: number, rx: number, ry: number, fill: string, stroke = true) => {
      ctx.beginPath();
      ctx.ellipse(cx, cy, rx, ry, 0, 0, Math.PI * 2);
      ctx.fillStyle = fill;
      ctx.fill();
      if (stroke) ctx.stroke();
    };
    const L = (pts: number[], color = C.line, w?: number) => {
      ctx.save();
      if (w) ctx.lineWidth = w / uu;
      ctx.strokeStyle = color;
      ctx.beginPath();
      for (let i = 0; i < pts.length; i += 2) (i ? ctx.lineTo(pts[i], pts[i + 1]) : ctx.moveTo(pts[i], pts[i + 1]));
      ctx.stroke();
      ctx.restore();
    };
    const wheel = (cx: number, cy: number, r: number) => {
      O(cx, cy, r, r, C.dark);
      O(cx, cy, r * 0.42, r * 0.42, C.metal);
    };
    const rover = (ox: number, sc = 1) => {
      ctx.save();
      ctx.translate(ox, 0);
      ctx.scale(sc, sc);
      // suspensión rocker-bogie
      L([-2.1, -0.45, -1.1, -1.25, 0, -0.45], C.line, jr ? 2.4 : 1.4);
      L([-1.1, -1.25, 0.9, -1.25, 2.1, -0.45], C.line, jr ? 2.4 : 1.4);
      wheel(-2.1, -0.45, 0.45);
      wheel(0, -0.45, 0.45);
      wheel(2.1, -0.45, 0.45);
      // cuerpo (caja electrónica caliente)
      R(-1.5, -2.05, 3.0, 0.85, C.metal);
      R(-1.5, -1.62, 3.0, 0.42, C.shade, false);
      // cubierta de paneles solares
      P([-3.3, -2.35, 3.2, -2.35, 2.9, -2.05, -3.0, -2.05], C.panel);
      for (let k = -2.4; k < 2.8; k += 0.8) L([k, -2.35, k - 0.1, -2.05], ex ? 'rgba(79,227,255,0.5)' : 'rgba(255,255,255,0.45)', 0.8);
      // antena de alta ganancia (plato)
      L([-1.0, -2.35, -1.0, -2.75]);
      O(-1.0, -2.95, 0.55, 0.2, C.white);
      // mástil con cámaras panorámicas
      L([1.2, -2.35, 1.2, -4.3], C.line, jr ? 2.6 : 1.6);
      R(0.55, -4.75, 1.3, 0.48, C.metal);
      O(0.85, -4.51, 0.13, 0.13, C.acc, false);
      O(1.5, -4.51, 0.13, 0.13, C.acc, false);
      // antena de baja ganancia
      L([2.3, -2.35, 2.3, -3.4]);
      // brazo con instrumentos (plegado delante)
      L([1.5, -1.6, 2.7, -1.3, 2.9, -0.8], C.line, jr ? 2.2 : 1.2);
      R(2.7, -0.95, 0.4, 0.35, C.gold);
      ctx.restore();
    };
    const dish = (cx: number, cy: number, r: number, tilt = -0.5, arcs = false) => {
      ctx.save();
      ctx.translate(cx, cy);
      ctx.rotate(tilt);
      ctx.beginPath();
      ctx.moveTo(-r, 0);
      ctx.quadraticCurveTo(0, r * 0.9, r, 0);
      ctx.closePath();
      ctx.fillStyle = C.white;
      ctx.fill();
      ctx.stroke();
      L([0, r * 0.45, 0, -r * 0.55]);
      O(0, -r * 0.6, r * 0.08, r * 0.08, C.acc, false);
      if (arcs && Math.sin(this.t * 3) > -0.2) {
        for (const rr of [r * 0.9, r * 1.4]) {
          ctx.beginPath();
          ctx.arc(0, -r * 0.6, rr, -Math.PI * 0.75, -Math.PI * 0.25);
          ctx.strokeStyle = C.acc;
          ctx.stroke();
        }
      }
      ctx.restore();
    };
    switch (kind) {
      case 'build': // rover en su plataforma de montaje (sala limpia)
        R(-3.8, -0.18, 7.6, 0.18, C.dark);
        L([-3.4, 0, -3.4, -5.6, 3.6, -5.6, 3.6, 0], ex ? 'rgba(79,227,255,0.45)' : C.line, jr ? 2 : 1);
        L([-3.4, -5.6, -2.2, -4.6], ex ? 'rgba(79,227,255,0.45)' : C.line, jr ? 2 : 1);
        L([2.0, -5.6, 2.0, -5.0], C.line, 1);
        O(2.0, -4.9, 0.18, 0.18, C.acc, false);
        ctx.save();
        ctx.translate(0, -0.18);
        rover(0, 0.92);
        ctx.restore();
        break;
      case 'rocket': { // cohete Delta con aceleradores y torre de servicio
        R(-2.6, -0.4, 5.2, 0.4, C.dark);
        // torre de lanzamiento (celosía)
        L([2.0, -0.4, 2.0, -10.5]);
        L([2.9, -0.4, 2.9, -10.5]);
        for (let y = -0.4; y > -10.4; y -= 1.0) L([2.0, y, 2.9, y - 1.0], ex ? 'rgba(79,227,255,0.55)' : C.line, 0.8);
        L([0.55, -8.2, 2.0, -8.2]);
        // aceleradores laterales
        for (const sx of [-0.95, 0.55]) {
          R(sx, -3.9, 0.4, 3.5, C.white);
          P([sx, -3.9, sx + 0.2, -4.4, sx + 0.4, -3.9], C.white);
        }
        // etapa principal + cofia
        R(-0.48, -8.6, 0.96, 8.2, C.white);
        R(-0.48, -5.4, 0.96, 0.25, C.acc, false);
        P([-0.6, -8.6, 0.6, -8.6, 0.6, -9.6, 0, -10.6, -0.6, -9.6], C.white);
        R(0.1, -8.6, 0.38, 8.2, C.shade, false);
        // escape de la tobera
        if (!ex || Math.sin(this.t * 6) > 0) O(0, -0.1, 0.5, 0.18, C.acc, false);
        break;
      }
      case 'name': { // micrófono de época y la hoja del ensayo
        L([0, 0, 0, -3.6], C.line, jr ? 2.6 : 1.6);
        P([-1.2, 0, 1.2, 0, 0.5, -0.35, -0.5, -0.35], C.dark);
        O(0, -4.4, 0.65, 0.85, C.metal);
        for (const yy of [-4.8, -4.5, -4.2, -3.9]) L([-0.5, yy, 0.5, yy], ex ? 'rgba(79,227,255,0.6)' : 'rgba(0,0,0,0.35)', 0.8);
        // hoja con texto (líneas) y una estrella
        ctx.save();
        ctx.translate(2.2, -2.2);
        ctx.rotate(0.12);
        R(-0.9, -1.25, 1.8, 2.4, C.white);
        for (let k = 0; k < 5; k++) L([-0.6, -0.8 + k * 0.38, 0.55 - (k % 2) * 0.3, -0.8 + k * 0.38], ex ? 'rgba(79,227,255,0.6)' : 'rgba(0,0,0,0.35)', 0.8);
        ctx.restore();
        ctx.fillStyle = C.acc;
        ctx.font = `1.1px serif`;
        ctx.textAlign = 'center';
        ctx.fillText('✦', -1.6, -4.6);
        break;
      }
      case 'landing': { // racimo de bolsas de aire con costuras
        const balls: [number, number, number][] = [[-1.6, -1.2, 1.2], [1.5, -1.15, 1.15], [0, -2.9, 1.25], [-0.1, -1.0, 1.05]];
        for (const [bx, by, r] of balls) {
          O(bx, by, r, r, C.white);
          ctx.save();
          ctx.strokeStyle = ex ? 'rgba(79,227,255,0.6)' : 'rgba(0,0,0,0.3)';
          ctx.lineWidth = 0.8 / uu;
          ctx.beginPath();
          ctx.ellipse(bx, by, r * 0.45, r, 0, 0, Math.PI * 2);
          ctx.moveTo(bx - r, by);
          ctx.lineTo(bx + r, by);
          ctx.stroke();
          ctx.restore();
          ctx.save();
          ctx.beginPath();
          ctx.ellipse(bx, by, r, r, 0, 0, Math.PI * 2);
          ctx.clip();
          ctx.fillStyle = C.shade;
          ctx.fillRect(bx + r * 0.2, by - r, r, r * 2);
          ctx.restore();
        }
        break;
      }
      case 'route': // colina con banderín y huellas
        P([-6, 0, -3.2, -3.6, -1.2, -5.6, 0.8, -6.0, 3.0, -4.4, 6.4, 0], ex ? C.metal : jr ? (moon ? '#c4b2ee' : '#e9a273') : moon ? '#6f6c67' : '#8a5236');
        P([0.8, -6.0, 3.0, -4.4, 6.4, 0, 2.4, 0], C.shade, false);
        L([0.8, -6.0, 0.8, -7.8], C.line, jr ? 2.4 : 1.2);
        P([0.8, -7.8, 2.2, -7.4, 0.8, -7.0], C.acc);
        for (let k = 0; k < 6; k++) O(-4.6 + k * 0.9, -1.6 - k * 0.65, 0.12, 0.06, ex ? C.line : 'rgba(0,0,0,0.35)', false);
        break;
      case 'signal':
      case 'off': // antena del rover apuntando al cielo + polvo (tormenta) si «off»
        R(-1.6, -0.3, 3.2, 0.3, C.dark);
        L([-1.1, -0.3, 0, -2.6, 1.1, -0.3], C.line, jr ? 2.4 : 1.4);
        dish(0, -3.2, 1.9, -0.45, kind === 'signal');
        if (kind === 'off' || this.o.place === 'marte') {
          // motas de polvo a la deriva (ilustrativas)
          ctx.save();
          ctx.shadowBlur = 0;
          ctx.fillStyle = ex ? 'rgba(79,227,255,0.35)' : jr ? 'rgba(255,255,255,0.6)' : 'rgba(210,170,130,0.45)';
          for (let k = 0; k < 9; k++) {
            const ph = (this.t * 0.4 + k / 9) % 1;
            ctx.beginPath();
            ctx.arc(-4 + ph * 8, -1 - hash(k) * 4 - Math.sin(ph * 6 + k) * 0.3, 0.12 + hash(k + 4) * 0.12, 0, Math.PI * 2);
            ctx.fill();
          }
          ctx.restore();
        }
        break;
      case 'station': { // estación central ALSEP: caja, parasol y antena hacia la Tierra; RTG al lado
        // cable plano hasta el RTG
        L([1.4, -0.05, 3.2, -0.05], C.acc, jr ? 2 : 1);
        R(-1.5, -1.25, 3.0, 1.25, C.metal);
        R(0.4, -1.25, 1.1, 1.25, C.shade, false);
        // parasol sobre cuatro postes
        for (const px of [-1.4, 1.4]) L([px, -1.25, px, -2.0]);
        P([-1.9, -2.0, 1.9, -2.0, 1.75, -2.2, -1.75, -2.2], C.gold);
        // mástil + antena helicoidal inclinada hacia la Tierra
        L([0.9, -2.2, 0.9, -3.9], C.line, jr ? 2.4 : 1.4);
        ctx.save();
        ctx.translate(0.9, -3.9);
        ctx.rotate(-0.6);
        R(-0.18, -1.8, 0.36, 1.8, C.white);
        for (let k = 0; k < 6; k++) L([-0.18, -0.2 - k * 0.28, 0.18, -0.34 - k * 0.28], C.acc, 0.8);
        ctx.restore();
        // RTG con aletas
        R(3.05, -1.7, 0.5, 1.6, C.dark);
        for (let k = 0; k < 4; k++) R(2.7, -1.6 + k * 0.38, 1.2, 0.12, C.metal);
        break;
      }
      case 'module': { // etapa de descenso del módulo lunar (la parte que se quedó)
        // patas con almohadillas
        L([-1.6, -1.4, -3.1, -0.15], C.line, jr ? 2.4 : 1.4);
        L([1.6, -1.4, 3.1, -0.15], C.line, jr ? 2.4 : 1.4);
        L([-1.0, -1.3, -1.4, -0.1], C.line, jr ? 2 : 1.1);
        L([1.0, -1.3, 1.4, -0.1], C.line, jr ? 2 : 1.1);
        O(-3.1, -0.1, 0.55, 0.14, C.metal);
        O(3.1, -0.1, 0.55, 0.14, C.metal);
        O(-1.4, -0.08, 0.4, 0.1, C.metal);
        O(1.4, -0.08, 0.4, 0.1, C.metal);
        // escalera en la pata delantera
        for (let k = 0; k < 4; k++) L([-1.25 - k * 0.04, -1.1 + k * 0.25, -1.0 - k * 0.04, -1.1 + k * 0.25], C.line, 0.8);
        // cuerpo octogonal con lámina dorada
        P([-2.0, -1.4, 2.0, -1.4, 2.2, -2.0, 2.0, -2.9, -2.0, -2.9, -2.2, -2.0], C.gold);
        P([0.7, -1.4, 2.0, -1.4, 2.2, -2.0, 2.0, -2.9, 0.7, -2.9], C.shade, false);
        for (const xx of [-0.7, 0.7]) L([xx, -1.4, xx, -2.9], ex ? 'rgba(255,210,63,0.5)' : 'rgba(0,0,0,0.25)', 0.8);
        // tobera del motor de descenso
        P([-0.5, -1.4, 0.5, -1.4, 0.75, -0.75, -0.75, -0.75], C.dark);
        // plataforma superior (la etapa de ascenso despegó)
        R(-1.6, -3.05, 3.2, 0.15, C.metal);
        break;
      }
      case 'seismo':
      case 'quake': { // sismómetro pasivo: tambor plateado sobre su manta térmica
        O(0, -0.05, 2.8, 0.42, ex ? 'rgba(79,227,255,0.12)' : jr ? '#ffffff' : '#d9d7d1');
        for (let k = -2; k <= 2; k++) L([k * 0.9, -0.05, k * 1.25, 0.25], ex ? 'rgba(79,227,255,0.4)' : 'rgba(0,0,0,0.18)', 0.7);
        R(-0.7, -1.7, 1.4, 1.6, C.metal);
        R(0.15, -1.7, 0.55, 1.6, C.shade, false);
        O(0, -1.7, 0.7, 0.22, C.white);
        L([0, -1.9, 0, -2.6]);
        O(0, -2.65, 0.1, 0.1, C.acc, false);
        if (kind === 'quake') {
          ctx.save();
          ctx.shadowBlur = 0;
          ctx.strokeStyle = C.acc;
          for (let k = 0; k < 3; k++) {
            const ph = (this.t * 0.8 + k / 3) % 1;
            ctx.globalAlpha = fade * near * (1 - ph);
            ctx.beginPath();
            ctx.ellipse(0, -0.05, 1.5 + ph * 4.5, (1.5 + ph * 4.5) * 0.18, 0, 0, Math.PI * 2);
            ctx.stroke();
          }
          ctx.restore();
        }
        break;
      }
      case 'power': // generador de radioisótopos (RTG) con aletas radiadoras
        R(-0.9, -0.35, 1.8, 0.35, C.dark);
        R(-0.45, -2.9, 0.9, 2.55, C.dark);
        for (let k = 0; k < 6; k++) {
          R(-1.25, -2.75 + k * 0.42, 0.8, 0.14, C.metal);
          R(0.45, -2.75 + k * 0.42, 0.8, 0.14, C.metal);
        }
        O(0, -2.9, 0.45, 0.14, C.metal);
        // calor (ondas)
        ctx.save();
        ctx.shadowBlur = 0;
        ctx.globalAlpha = fade * near * 0.6;
        for (let k = 0; k < 3; k++) {
          const yy = -3.3 - ((this.t * 0.6 + k / 3) % 1) * 1.6;
          L([-0.5 + k * 0.4, yy, -0.3 + k * 0.4, yy - 0.3, -0.5 + k * 0.4, yy - 0.6], C.acc, 1);
        }
        ctx.restore();
        L([0.9, -0.1, 3.0, -0.1], C.acc, jr ? 2 : 1);
        break;
      case 'debris': { // paracaídas y cubierta trasera, escudo térmico y meteorito
        // paracaídas tendido en el suelo
        P([-5.2, -0.05, -4.6, -0.7, -3.4, -1.0, -2.2, -0.8, -1.4, -0.3, -1.2, -0.02], jr ? '#ffffff' : ex ? C.metal : '#efe9de');
        for (const xx of [-4.3, -3.4, -2.5]) L([xx, -0.05, xx + 0.2, -0.85], ex ? 'rgba(79,227,255,0.5)' : jr ? C.acc : 'rgba(170,60,40,0.55)', 0.9);
        L([-1.3, -0.15, -0.2, -0.6], C.line, 0.8);
        // cubierta trasera (cono truncado, tumbado)
        P([-0.4, -0.05, 1.4, -0.05, 1.0, -1.7, 0.0, -1.7], C.metal);
        P([0.6, -0.05, 1.4, -0.05, 1.0, -1.7, 0.6, -1.7], C.shade, false);
        O(0.5, -1.7, 0.5, 0.14, C.white);
        // escudo térmico (disco quemado, inclinado)
        ctx.save();
        ctx.translate(3.1, -0.55);
        ctx.rotate(-0.25);
        O(0, 0, 1.25, 0.5, jr ? '#c2562a' : ex ? C.gold : '#5a3b2a');
        O(0.1, 0.05, 0.75, 0.28, C.shade, false);
        ctx.restore();
        // «Heat Shield Rock» (meteorito de hierro y níquel)
        P([4.6, -0.02, 4.75, -0.5, 5.2, -0.62, 5.6, -0.35, 5.55, -0.02], C.dark);
        O(5.0, -0.4, 0.12, 0.07, ex ? C.acc : 'rgba(255,255,255,0.35)', false);
        break;
      }
      case 'song': { // antena de la Red de Espacio Profundo (Goldstone) enviando la última transmisión
        R(-1.8, -0.4, 3.6, 0.4, C.dark);
        P([-1.2, -0.4, 1.2, -0.4, 0.7, -2.6, -0.7, -2.6], C.metal);
        dish(0, -3.6, 3.0, -0.35, true);
        // notas musicales suaves (ilustrativas)
        ctx.save();
        ctx.shadowBlur = 0;
        ctx.fillStyle = C.acc;
        ctx.font = '1px serif';
        ctx.textAlign = 'center';
        for (let k = 0; k < 3; k++) {
          const ph = (this.t * 0.25 + k / 3) % 1;
          ctx.globalAlpha = fade * near * Math.sin(ph * Math.PI);
          ctx.fillText(k % 2 ? '♪' : '♫', 1.8 + ph * 3, -6 - ph * 3);
        }
        ctx.restore();
        break;
      }
      case 'rover': // monumento final del rover
        rover(0, 1);
        break;
    }
    ctx.restore();
  }

  private drawBeacon(proj: (x: number, y: number, z: number) => { x: number; y: number; s: number; dz: number }, fogA: (dz: number) => number, i: number, z: number) {
    const { ctx, pal } = this;
    const bx = roadX(z) - 6;
    const base = proj(bx, 0, z);
    const top = proj(bx, 4.4, z);
    const on = i === this.active;
    const done = this.done.has(i);
    const legacy = i === this.o.count - 1;
    const s = base.s;
    ctx.globalAlpha = 1 - fogA(base.dz) * 0.9;
    // sombra en el suelo
    ctx.fillStyle = 'rgba(0,0,0,0.25)';
    ctx.beginPath();
    ctx.ellipse(base.x, base.y, s * 1.4, s * 0.35, 0, 0, Math.PI * 2);
    ctx.fill();
    // mástil
    ctx.strokeStyle = pal.outline ?? pal.beacon;
    ctx.lineWidth = Math.max(1, s * 0.16);
    ctx.beginPath();
    ctx.moveTo(base.x, base.y);
    ctx.lineTo(top.x, top.y);
    ctx.stroke();
    // orbe
    const r = Math.max(5, s * (legacy ? 1.05 : 0.72));
    const pulse = on ? 1 + Math.sin(this.t * 3.2) * 0.12 : 1;
    const col = on ? pal.beaconOn : done ? pal.beaconOn : pal.beacon;
    if ((on || this.o.variant !== 'junior') && base.dz < 240) {
      const gl = ctx.createRadialGradient(top.x, top.y, 0, top.x, top.y, r * 3.2 * pulse);
      gl.addColorStop(0, col + 'cc');
      gl.addColorStop(1, col + '00');
      ctx.fillStyle = gl;
      ctx.beginPath();
      ctx.arc(top.x, top.y, r * 3.2 * pulse, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.fillStyle = this.o.variant === 'explorer' ? '#060918' : col;
    ctx.strokeStyle = this.o.variant === 'explorer' ? col : pal.outline ?? col;
    ctx.lineWidth = Math.max(1.5, s * 0.14);
    ctx.beginPath();
    if (this.o.variant === 'explorer') {
      ctx.moveTo(top.x, top.y - r * pulse);
      ctx.lineTo(top.x + r * pulse, top.y);
      ctx.lineTo(top.x, top.y + r * pulse);
      ctx.lineTo(top.x - r * pulse, top.y);
      ctx.closePath();
    } else ctx.arc(top.x, top.y, r * pulse, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
    // número / estrella
    ctx.fillStyle = this.o.variant === 'explorer' ? col : pal.label;
    ctx.font = `${this.o.variant === 'discovery' ? 'italic ' : ''}700 ${Math.max(9, r * 0.95)}px ${this.o.variant === 'discovery' ? 'Georgia, serif' : this.o.variant === 'explorer' ? 'ui-monospace, monospace' : 'system-ui, sans-serif'}`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(legacy ? '★' : done ? '✓' : String(i + 1), top.x, top.y + 1);
    // rótulo
    const showLabel = i === this.active || (i === this.active + 1 && base.dz < 200);
    if (showLabel && this.o.labels[i]) {
      ctx.font = `${this.o.variant === 'discovery' ? 'italic 400' : '700'} ${Math.max(10, Math.min(15, s * 0.9))}px ${this.o.variant === 'discovery' ? 'Georgia, serif' : this.o.variant === 'explorer' ? 'ui-monospace, monospace' : 'system-ui, sans-serif'}`;
      ctx.fillStyle = this.o.variant === 'junior' ? '#fff4e2' : pal.label;
      ctx.globalAlpha *= on ? 1 : 0.6;
      const lt = this.o.variant === 'explorer' ? this.o.labels[i].toUpperCase() : this.o.labels[i];
      // el rótulo nunca se sale de la pantalla
      const half = ctx.measureText(lt).width / 2 + 10;
      const lx = Math.min(this.W - half, Math.max(half, top.x));
      if (this.o.variant === 'junior') {
        const w = ctx.measureText(lt).width + 14;
        ctx.fillStyle = on ? '#ff7a3d' : '#123a46';
        ctx.beginPath();
        ctx.roundRect(lx - w / 2, top.y - r * pulse - 26, w, 20, 10);
        ctx.fill();
        ctx.fillStyle = '#fff4e2';
      }
      ctx.fillText(lt, lx, top.y - r * pulse - 16);
    }
    ctx.globalAlpha = 1;
    this.hits.push({ i, x: top.x, y: top.y, r: r * 1.6 });
  }
}
