import { PLANET_VERT, planetFrag } from './planetShader';
import { QUALITY, type QualityTier } from '../gl/quality';
import { easeInOutCubic, type Ease } from '../gl/BlackHoleRenderer';

export interface Anchor {
  x: number; // px CSS, centro
  y: number;
  r: number;
}

interface Tween { key: 'zoom' | 'dim' | 'sx' | 'sy'; from: number; to: number; start: number; dur: number; ease: Ease; resolve: () => void }

/**
 * Renderer WebGL de los universos Explorer/Discovery (un único contexto por universo).
 * Lee la posición de los destinos desde el DOM → los planetas siempre coinciden con sus botones.
 */
export class PlanetRenderer {
  private gl: WebGLRenderingContext;
  private prog: WebGLProgram;
  private loc: Record<string, WebGLUniformLocation | null> = {};
  private raf = 0;
  private t0 = performance.now();
  private anchors: Anchor[] = [
    { x: 0, y: 0, r: 1 },
    { x: 0, y: 0, r: 1 },
    { x: 0, y: 0, r: 1 },
  ];
  private hover = [0, 0, 0];
  private hoverT = [0, 0, 0];
  private v = { zoom: 1, dim: 0, sx: 0, sy: 0, tx: 0, ty: 0 };
  private tweens: Tween[] = [];
  private scale = 1;
  private running = false;

  constructor(
    private canvas: HTMLCanvasElement,
    private opts: { style: 0 | 1; tier: QualityTier; reducedMotion: boolean; onLost?: () => void },
  ) {
    const gl = (canvas.getContext('webgl2', { antialias: false, alpha: false, depth: false }) as WebGLRenderingContext | null) ??
      canvas.getContext('webgl', { antialias: false, alpha: false, depth: false });
    if (!gl) throw new Error('WebGL no disponible');
    this.gl = gl;
    const mk = (t: number, src: string) => {
      const s = gl.createShader(t)!;
      gl.shaderSource(s, src);
      gl.compileShader(s);
      if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) throw new Error(gl.getShaderInfoLog(s) ?? 'shader');
      return s;
    };
    const p = gl.createProgram()!;
    gl.attachShader(p, mk(gl.VERTEX_SHADER, PLANET_VERT));
    gl.attachShader(p, mk(gl.FRAGMENT_SHADER, planetFrag(opts.tier === 'high')));
    gl.bindAttribLocation(p, 0, 'aPos');
    gl.linkProgram(p);
    if (!gl.getProgramParameter(p, gl.LINK_STATUS)) throw new Error(gl.getProgramInfoLog(p) ?? 'link');
    this.prog = p;
    gl.useProgram(p);
    const buf = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buf);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
    gl.enableVertexAttribArray(0);
    gl.vertexAttribPointer(0, 2, gl.FLOAT, false, 0, 0);
    for (const u of ['uRes', 'uTime', 'uStyle', 'uP0', 'uP1', 'uP2', 'uHover', 'uZoom', 'uZoomT', 'uZoomS', 'uDim', 'uFocus'])
      this.loc[u] = gl.getUniformLocation(p, u);
    canvas.addEventListener('webglcontextlost', this.lost);
    this.resize();
  }

  private lost = (e: Event) => {
    e.preventDefault();
    this.stop();
    this.opts.onLost?.();
  };

  resize() {
    const q = QUALITY[this.opts.tier];
    this.scale = Math.min(window.devicePixelRatio || 1, Math.min(q.dprCap, 1.25)) * Math.max(q.resScale, 0.5);
    const w = Math.max(1, Math.round(this.canvas.clientWidth * this.scale));
    const h = Math.max(1, Math.round(this.canvas.clientHeight * this.scale));
    if (this.canvas.width !== w || this.canvas.height !== h) {
      this.canvas.width = w;
      this.canvas.height = h;
    }
  }

  setAnchors(a: Anchor[]) {
    // el shader admite hasta 3 mundos; los huecos quedan fuera de pantalla
    const off: Anchor = { x: -1e5, y: -1e5, r: 1 };
    this.anchors = [a[0] ?? off, a[1] ?? off, a[2] ?? off];
  }

  setHover(i: number | null) {
    this.hoverT = [0, 1, 2].map((k) => (k === i ? 1 : 0));
  }

  private tween(key: Tween['key'], to: number, ms: number, ease: Ease = easeInOutCubic) {
    this.tweens = this.tweens.filter((t) => {
      if (t.key === key) t.resolve();
      return t.key !== key;
    });
    if (ms <= 0) {
      this.v[key] = to;
      return Promise.resolve();
    }
    return new Promise<void>((resolve) =>
      this.tweens.push({ key, from: this.v[key], to, start: performance.now(), dur: ms, ease, resolve }),
    );
  }

  /** Vuela hacia el destino i: lo lleva al centro de la pantalla y amplía hasta llenar el encuadre. */
  /** Termina al instante todas las transiciones en curso (botón «Saltar»). */
  finish() {
    const ts = this.tweens;
    this.tweens = [];
    ts.forEach((t) => {
      this.v[t.key] = t.to;
      t.resolve();
    });
  }

  async flyTo(i: number, ms: number) {
    const a = this.anchors[i];
    const W = this.canvas.clientWidth;
    const H = this.canvas.clientHeight;
    this.v.tx = a.x;
    this.v.ty = a.y;
    this.v.sx = a.x;
    this.v.sy = a.y;
    const target = (Math.max(W, H) / a.r) * 1.15;
    const accel: Ease = (t) => t * t * t;
    if (this.opts.reducedMotion) {
      this.v.zoom = target;
      this.v.sx = W / 2;
      this.v.sy = H / 2;
      return;
    }
    void this.tween('sx', W / 2, ms * 0.55);
    void this.tween('sy', H / 2, ms * 0.55);
    await this.tween('zoom', target, ms, accel);
  }

  /** Vuelta al universo (retroceso). */
  async flyBack(ms: number) {
    if (this.opts.reducedMotion) {
      this.v.zoom = 1;
      this.v.sx = this.v.tx;
      this.v.sy = this.v.ty;
      return;
    }
    void this.tween('sx', this.v.tx, ms * 0.8);
    void this.tween('sy', this.v.ty, ms * 0.8);
    await this.tween('zoom', 1, ms, (t) => 1 - Math.pow(1 - t, 3));
  }

  dim(to: number, ms: number) {
    return this.tween('dim', to, this.opts.reducedMotion ? 0 : ms);
  }

  start() {
    if (this.running) return;
    this.running = true;
    this.frame(performance.now()); // primer fotograma inmediato: sin destello negro al montar
    const loop = (now: number) => {
      if (!this.running) return;
      this.raf = requestAnimationFrame(loop);
      this.frame(now);
    };
    this.raf = requestAnimationFrame(loop);
  }

  stop() {
    this.running = false;
    cancelAnimationFrame(this.raf);
  }

  private frame(now: number) {
    this.tweens = this.tweens.filter((t) => {
      const k = Math.min(1, (now - t.start) / t.dur);
      this.v[t.key] = t.from + (t.to - t.from) * t.ease(k);
      if (k >= 1) t.resolve();
      return k < 1;
    });
    for (let k = 0; k < 3; k++) this.hover[k] += (this.hoverT[k] - this.hover[k]) * 0.08;
    const gl = this.gl;
    const L = this.loc;
    const s = this.scale;
    const H = this.canvas.height;
    gl.viewport(0, 0, this.canvas.width, H);
    gl.uniform2f(L.uRes, this.canvas.width, H);
    gl.uniform1f(L.uTime, this.opts.reducedMotion ? 20 : (now - this.t0) / 1000);
    gl.uniform1f(L.uStyle, this.opts.style);
    const P = this.anchors.map((a) => [a.x * s, H - a.y * s, Math.max(1, a.r * s)]);
    gl.uniform3f(L.uP0, P[0][0], P[0][1], P[0][2]);
    gl.uniform3f(L.uP1, P[1][0], P[1][1], P[1][2]);
    gl.uniform3f(L.uP2, P[2][0], P[2][1], P[2][2]);
    gl.uniform3f(L.uHover, this.hover[0], this.hover[1], this.hover[2]);
    gl.uniform1f(L.uZoom, this.v.zoom);
    gl.uniform2f(L.uZoomT, this.v.tx * s, H - this.v.ty * s);
    gl.uniform2f(L.uZoomS, this.v.sx * s, H - this.v.sy * s);
    gl.uniform1f(L.uDim, this.v.dim);
    gl.uniform1f(L.uFocus, -1);
    gl.drawArrays(gl.TRIANGLES, 0, 3);
  }

  dispose() {
    this.stop();
    this.tweens.forEach((t) => t.resolve());
    this.canvas.removeEventListener('webglcontextlost', this.lost);
    this.gl.deleteProgram(this.prog);
  }
}
