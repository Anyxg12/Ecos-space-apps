import { VERTEX_SHADER, fragmentShader } from './shaders';
import { QUALITY, lowerTier, type QualityTier } from './quality';
import type { ShaderLook } from '../themes/themes';

export interface HorizonParams {
  dist: number;
  lens: number;
  warp: number;
  fade: number;
  exposure: number;
  elev: number;
  roll: number;
  probeK: number;
  diskSpeed: number;
  shiftY: number;
  posterize: number;
  mono: number;
  diskHot: [number, number, number];
  diskWarm: [number, number, number];
  diskCool: [number, number, number];
  nebula: [number, number, number];
}

type NumKey = { [K in keyof HorizonParams]: HorizonParams[K] extends number ? K : never }[keyof HorizonParams];
type VecKey = Exclude<keyof HorizonParams, NumKey>;

export const DEFAULT_PARAMS: HorizonParams = {
  dist: 30,
  lens: 1,
  warp: 0,
  fade: 0,
  exposure: 1,
  elev: 0.11,
  roll: -0.09,
  probeK: 0,
  diskSpeed: 1,
  shiftY: 0,
  posterize: 0,
  mono: 0,
  diskHot: [1.0, 0.93, 0.82],
  diskWarm: [1.0, 0.55, 0.22],
  diskCool: [0.55, 0.16, 0.05],
  nebula: [0.18, 0.12, 0.32],
};

export type Ease = (t: number) => number;
export const easeInOutCubic: Ease = (t) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);
export const easeInQuart: Ease = (t) => t * t * t * t;
export const easeOutCubic: Ease = (t) => 1 - Math.pow(1 - t, 3);

interface Tween {
  from: number[];
  to: number[];
  keys: (keyof HorizonParams)[];
  start: number;
  dur: number;
  ease: Ease;
  resolve: () => void;
}

export interface RendererOptions {
  tier: QualityTier;
  reducedMotion: boolean;
  /** FPS watchdog activado (por defecto sí) */
  watchdog?: boolean;
  onTierChange?: (tier: QualityTier) => void;
  /** se llama si el GPU no aguanta ni el nivel mínimo o se pierde el contexto */
  onFallback?: (reason: string) => void;
}

const UNIFORMS = [
  'uRes', 'uTime', 'uPointer', 'uProbe', 'uProbeK', 'uDist', 'uLens', 'uWarp', 'uFade', 'uExposure',
  'uElev', 'uRoll', 'uDiskHot', 'uDiskWarm', 'uDiskCool', 'uNebula', 'uPosterize', 'uMono', 'uDiskSpeed', 'uShiftY', 'uZoom',
] as const;

/**
 * Renderer WebGL sin dependencias (un quad a pantalla completa + un fragment shader).
 * Se eligió WebGL crudo frente a Three.js: una sola pasada no necesita escena/cámara/materiales
 * y así ahorramos ~150 kB gzip en la primera pantalla.
 */
export class BlackHoleRenderer {
  readonly params: HorizonParams = structuredClone(DEFAULT_PARAMS);
  private gl: WebGLRenderingContext;
  private program: WebGLProgram | null = null;
  private loc: Partial<Record<(typeof UNIFORMS)[number], WebGLUniformLocation | null>> = {};
  private raf = 0;
  private tweens: Tween[] = [];
  private t0 = performance.now();
  private frozenTime = 14.0;
  private pointer = { x: 0, y: 0, tx: 0, ty: 0 };
  private probe = { x: 0, y: 0, tx: 0, ty: 0 };
  private probeActivity = 0;
  private lastMove = -1e9;
  private tier: QualityTier;
  private frames: number[] = [];
  private warmupUntil = 0;
  private dirty = true;
  /** <1 en pantallas verticales para que el disco quepa a lo ancho */
  private zoom = 1;
  private running = false;
  private disposed = false;

  constructor(private canvas: HTMLCanvasElement, private opts: RendererOptions) {
    const ctxOpts: WebGLContextAttributes = {
      antialias: false,
      alpha: false,
      depth: false,
      stencil: false,
      premultipliedAlpha: false,
      powerPreference: 'high-performance',
      preserveDrawingBuffer: false,
    };
    const gl = (canvas.getContext('webgl2', ctxOpts) as WebGLRenderingContext | null) ?? canvas.getContext('webgl', ctxOpts);
    if (!gl) throw new Error('WebGL no disponible');
    this.gl = gl;
    this.tier = opts.tier;
    canvas.addEventListener('webglcontextlost', this.onLost, false);
    window.addEventListener('resize', this.resize);
    document.addEventListener('visibilitychange', this.onVisibility);
    const buf = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buf);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
    this.compile();
    this.resize();
  }

  private onLost = (e: Event) => {
    e.preventDefault();
    this.stop();
    this.opts.onFallback?.('context-lost');
  };

  private compile() {
    const gl = this.gl;
    const q = QUALITY[this.tier];
    const mk = (type: number, src: string) => {
      const s = gl.createShader(type)!;
      gl.shaderSource(s, src);
      gl.compileShader(s);
      if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) throw new Error(gl.getShaderInfoLog(s) ?? 'shader error');
      return s;
    };
    const vs = mk(gl.VERTEX_SHADER, VERTEX_SHADER);
    const fs = mk(gl.FRAGMENT_SHADER, fragmentShader(q.steps, q.stepScale, q.starLayers));
    const p = gl.createProgram()!;
    gl.attachShader(p, vs);
    gl.attachShader(p, fs);
    gl.bindAttribLocation(p, 0, 'aPos');
    gl.linkProgram(p);
    if (!gl.getProgramParameter(p, gl.LINK_STATUS)) throw new Error(gl.getProgramInfoLog(p) ?? 'link error');
    if (this.program) gl.deleteProgram(this.program);
    this.program = p;
    gl.useProgram(p);
    gl.enableVertexAttribArray(0);
    gl.vertexAttribPointer(0, 2, gl.FLOAT, false, 0, 0);
    for (const u of UNIFORMS) this.loc[u] = gl.getUniformLocation(p, u);
    this.dirty = true;
  }

  getTier() {
    return this.tier;
  }

  setTier(tier: QualityTier) {
    if (tier === this.tier) return;
    this.tier = tier;
    this.compile();
    this.resize();
    this.opts.onTierChange?.(tier);
  }

  resize = () => {
    const q = QUALITY[this.tier];
    const dpr = Math.min(window.devicePixelRatio || 1, q.dprCap) * q.resScale;
    const w = Math.max(1, Math.round(this.canvas.clientWidth * dpr));
    const h = Math.max(1, Math.round(this.canvas.clientHeight * dpr));
    const aspect = this.canvas.clientWidth / Math.max(1, this.canvas.clientHeight);
    this.zoom = aspect < 1.2 ? Math.max(0.42, aspect * 0.85) : 1;
    if (this.canvas.width !== w || this.canvas.height !== h) {
      this.canvas.width = w;
      this.canvas.height = h;
    }
    this.dirty = true;
  };

  /** x, y en -1..1 (posición del cursor o dedo respecto al centro) */
  setPointer(x: number, y: number) {
    if (this.opts.reducedMotion) return;
    this.pointer.tx = x;
    this.pointer.ty = y;
    const aspect = this.canvas.clientWidth / Math.max(1, this.canvas.clientHeight);
    this.probe.tx = x * 0.5 * aspect;
    this.probe.ty = y * 0.5;
    this.lastMove = performance.now();
  }

  set(p: Partial<HorizonParams>) {
    this.cancelTweens(Object.keys(p) as (keyof HorizonParams)[]);
    Object.assign(this.params, structuredClone(p));
    this.dirty = true;
  }

  /** Cancela (resolviendo) los tweens que animan alguna de estas claves. */
  private cancelTweens(keys: (keyof HorizonParams)[]) {
    this.tweens = this.tweens.filter((tw) => {
      const overlap = tw.keys.some((k) => keys.includes(k));
      if (overlap) tw.resolve();
      return !overlap;
    });
  }

  setLook(look: ShaderLook, ms: number, ease: Ease = easeInOutCubic) {
    return this.tween(
      {
        diskHot: look.diskHot,
        diskWarm: look.diskWarm,
        diskCool: look.diskCool,
        nebula: look.nebula,
        posterize: look.posterize,
        mono: look.mono,
        exposure: look.exposure,
      },
      ms,
      ease,
    );
  }

  tween(p: Partial<HorizonParams>, ms: number, ease: Ease = easeInOutCubic): Promise<void> {
    const keys = Object.keys(p) as (keyof HorizonParams)[];
    // un nuevo tween sobre las mismas claves cancela (resolviendo) el anterior
    this.cancelTweens(keys);
    if (ms <= 0 || this.opts.reducedMotion) {
      this.set(p);
      return Promise.resolve();
    }
    const flat = (src: Partial<HorizonParams>) =>
      keys.flatMap((k) => {
        const v = src[k] as number | number[];
        return Array.isArray(v) ? v : [v];
      });
    return new Promise((resolve) => {
      this.tweens.push({ from: flat(this.params), to: flat(p), keys, start: performance.now(), dur: ms, ease, resolve });
    });
  }

  private applyTweens(now: number) {
    if (!this.tweens.length) return;
    this.dirty = true;
    this.tweens = this.tweens.filter((tw) => {
      const t = Math.min(1, (now - tw.start) / tw.dur);
      const e = tw.ease(t);
      let i = 0;
      for (const k of tw.keys) {
        const cur = this.params[k];
        if (Array.isArray(cur)) {
          const arr = [0, 1, 2].map((j) => tw.from[i + j] + (tw.to[i + j] - tw.from[i + j]) * e) as [number, number, number];
          (this.params[k as VecKey] as [number, number, number]) = arr;
          i += 3;
        } else {
          (this.params[k as NumKey] as number) = tw.from[i] + (tw.to[i] - tw.from[i]) * e;
          i += 1;
        }
      }
      if (t >= 1) {
        tw.resolve();
        return false;
      }
      return true;
    });
  }

  start() {
    if (this.running || this.disposed) return;
    this.running = true;
    this.wantRunning = true;
    this.warmupUntil = performance.now() + 1500;
    this.frames = [];
    const loop = (now: number) => {
      if (!this.running) return;
      this.raf = requestAnimationFrame(loop);
      this.frame(now);
    };
    this.raf = requestAnimationFrame(loop);
  }

  private wantRunning = false;
  private onVisibility = () => {
    if (document.hidden) {
      const was = this.running;
      this.stop();
      this.wantRunning = was;
    } else if (this.wantRunning) {
      this.start();
    }
  };

  private frame(now: number) {
    this.applyTweens(now);
    const animated = !this.opts.reducedMotion;
    // suavizado del parallax (inercia)
    const k = 0.045;
    this.pointer.x += (this.pointer.tx - this.pointer.x) * k;
    this.pointer.y += (this.pointer.ty - this.pointer.y) * k;
    this.probe.x += (this.probe.tx - this.probe.x) * 0.12;
    this.probe.y += (this.probe.ty - this.probe.y) * 0.12;
    // la micro-lente aparece al mover el cursor y se desvanece en reposo
    const active = now - this.lastMove < 1800 ? 1 : 0;
    this.probeActivity += (active - this.probeActivity) * 0.04;
    if (!animated && !this.dirty) return; // modo reducido: sólo dibuja cuando algo cambia
    this.draw(animated ? (now - this.t0) / 1000 : this.frozenTime);
    this.watchdog(now);
  }

  private watchdog(now: number) {
    if (this.opts.reducedMotion || this.opts.watchdog === false || now < this.warmupUntil) return;
    this.frames.push(now);
    if (this.frames.length < 90) return;
    const span = this.frames[this.frames.length - 1] - this.frames[0];
    const fps = ((this.frames.length - 1) * 1000) / span;
    this.frames = [];
    if (fps < 40) {
      const next = lowerTier(this.tier);
      if (next) {
        this.setTier(next);
        this.warmupUntil = now + 1200;
      } else if (fps < 16) {
        this.opts.onFallback?.(`fps-${fps.toFixed(0)}`);
      }
    }
  }

  draw(time: number) {
    const gl = this.gl;
    const P = this.params;
    const L = this.loc;
    gl.viewport(0, 0, this.canvas.width, this.canvas.height);
    gl.uniform2f(L.uRes!, this.canvas.width, this.canvas.height);
    gl.uniform1f(L.uTime!, time);
    gl.uniform2f(L.uPointer!, this.pointer.x, this.pointer.y);
    gl.uniform2f(L.uProbe!, this.probe.x, this.probe.y);
    gl.uniform1f(L.uProbeK!, P.probeK * this.probeActivity);
    gl.uniform1f(L.uDist!, P.dist);
    gl.uniform1f(L.uLens!, P.lens);
    gl.uniform1f(L.uWarp!, P.warp);
    gl.uniform1f(L.uFade!, P.fade);
    gl.uniform1f(L.uExposure!, P.exposure);
    gl.uniform1f(L.uElev!, P.elev);
    gl.uniform1f(L.uRoll!, P.roll);
    gl.uniform1f(L.uPosterize!, P.posterize);
    gl.uniform1f(L.uMono!, P.mono);
    gl.uniform1f(L.uDiskSpeed!, P.diskSpeed);
    gl.uniform1f(L.uShiftY!, P.shiftY);
    gl.uniform1f(L.uZoom!, this.zoom);
    gl.uniform3fv(L.uDiskHot!, P.diskHot);
    gl.uniform3fv(L.uDiskWarm!, P.diskWarm);
    gl.uniform3fv(L.uDiskCool!, P.diskCool);
    gl.uniform3fv(L.uNebula!, P.nebula);
    gl.drawArrays(gl.TRIANGLES, 0, 3);
    this.dirty = false;
  }

  stop() {
    this.running = false;
    this.wantRunning = false;
    cancelAnimationFrame(this.raf);
  }

  dispose() {
    this.stop();
    this.disposed = true;
    this.tweens.forEach((t) => t.resolve());
    this.canvas.removeEventListener('webglcontextlost', this.onLost);
    window.removeEventListener('resize', this.resize);
    document.removeEventListener('visibilitychange', this.onVisibility);
    if (this.program) this.gl.deleteProgram(this.program);
    this.program = null;
  }
}
