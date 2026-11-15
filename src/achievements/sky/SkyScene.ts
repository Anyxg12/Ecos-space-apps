import {
  Mesh,
  OrthographicCamera,
  PlaneGeometry,
  Scene,
  ShaderMaterial,
  SRGBColorSpace,
  NoColorSpace,
  RepeatWrapping,
  ClampToEdgeWrapping,
  LinearMipmapLinearFilter,
  TextureLoader,
  Vector2,
  Vector3,
  Vector4,
  WebGLRenderer,
  type Texture,
} from 'three';
import { FRAG, VERT } from './skyShader';
import { SKY_TIMELINE, poseAt, fxAt, WORLDS_ON_SCREEN, dirFrom as dirArr, UP as UPa, NORTH as NORTHa, EAST as EASTa, SUN as SUNa, R0, ALT_END, D2R, smooth, lerp, type Pose } from './timeline';
const UP = new Vector3(...UPa), NORTH = new Vector3(...NORTHa), EAST = new Vector3(...EASTa), SUN = new Vector3(...SUNa);
const dirFrom = (y: number, p: number) => new Vector3(...dirArr(y, p));
export { SKY_TIMELINE, poseAt };

export type SkyTier = 'high' | 'medium' | 'low';
const TIERS: Record<SkyTier, { P: number; L: number; OCT: number; STARL: number; dpr: number }> = {
  high: { P: 14, L: 4, OCT: 5, STARL: 3, dpr: 1.5 },
  medium: { P: 10, L: 3, OCT: 4, STARL: 3, dpr: 1.15 },
  low: { P: 7, L: 2, OCT: 3, STARL: 2, dpr: 1 },
};
const NB = 32;
function rng(seed: number) {
  let s = seed >>> 0;
  return () => {
    s = (s + 0x6d2b79f5) >>> 0;
    let t = s;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
function blackbody(k: number): [number, number, number] {
  const t = Math.min(14000, Math.max(2500, k)) / 100;
  const r = t <= 66 ? 1 : Math.min(1, 1.2929 * Math.pow(t - 60, -0.1332));
  const g = t <= 66 ? Math.min(1, Math.max(0, 0.3901 * Math.log(t) - 0.6318)) : Math.min(1, 1.1298 * Math.pow(t - 60, -0.0755));
  const b = t >= 66 ? 1 : t <= 19 ? 0 : Math.min(1, Math.max(0, 0.5432 * Math.log(t - 10) - 1.1963));
  return [r ** 2.2, g ** 2.2, b ** 2.2];
}

function basis(p: Pose, aspect: number) {
  const pos = UP.clone().multiplyScalar(R0 + p.alt);
  const F = dirFrom(p.yaw, p.pitch).normalize();
  let Rt = new Vector3().crossVectors(F, UP).normalize();
  let Ut = new Vector3().crossVectors(Rt, F).normalize();
  const c = Math.cos(p.roll), s = Math.sin(p.roll);
  const R2 = Rt.clone().multiplyScalar(c).addScaledVector(Ut, s);
  const U2 = Ut.clone().multiplyScalar(c).addScaledVector(Rt, -s);
  Rt = R2;
  Ut = U2;
  const ty = Math.tan((p.vfov / 2) * D2R);
  return { pos, F, R: Rt, U: Ut, tan: new Vector2(ty * aspect, ty) };
}

export interface SkySceneOptions {
  textureUrl: string;
  getTime: () => number;
  tier: SkyTier;
  adaptive: boolean;
  onReady?: () => void;
  onError?: (e: unknown) => void;
}

export class SkyScene {
  private renderer: WebGLRenderer;
  private scene = new Scene();
  private cam = new OrthographicCamera(-1, 1, 1, -1, 0, 1);
  private mat!: ShaderMaterial;
  private tex: Texture | null = null;
  private raf = 0;
  private running = false;
  private w = 1;
  private h = 1;
  private scale = 1;
  private tier: SkyTier;
  private frames: number[] = [];
  private lastFrame = 0;
  private lastAdapt = 0;
  private lastT = -1;
  private disposed = false;

  constructor(private canvas: HTMLCanvasElement, private opts: SkySceneOptions) {
    this.tier = opts.tier;
    this.renderer = new WebGLRenderer({ canvas, antialias: false, alpha: false, powerPreference: 'high-performance', preserveDrawingBuffer: false });
    this.renderer.outputColorSpace = SRGBColorSpace;
    canvas.addEventListener('webglcontextlost', this.onLost, false);
    this.build();
    const mesh = new Mesh(new PlaneGeometry(2, 2), this.mat);
    this.scene.add(mesh);
    new TextureLoader().load(
      opts.textureUrl,
      (t) => {
        if (this.disposed) return t.dispose();
        t.colorSpace = NoColorSpace;
        t.wrapS = RepeatWrapping;
        t.wrapT = ClampToEdgeWrapping;
        t.minFilter = LinearMipmapLinearFilter;
        t.anisotropy = Math.min(8, this.renderer.capabilities.getMaxAnisotropy());
        this.tex = t;
        this.mat.uniforms.uEarth.value = t;
        this.lastT = -1;
        this.renderNow();
        opts.onReady?.();
        this.kick();
      },
      undefined,
      (e) => opts.onError?.(e),
    );
  }

  private onLost = (e: Event) => {
    e.preventDefault();
    this.stop();
    this.opts.onError?.(new Error('webglcontextlost'));
  };

  private build() {
    this.worldsAspect = 0;
    const q = TIERS[this.tier];
    const old = this.mat;
    const rnd = rng(20261114);
    // estrellas brillantes: la mitad dentro del encuadre final
    const fin = basis(poseAt(SKY_TIMELINE.end, 16 / 9), 16 / 9);
    const B: Vector4[] = [];
    const BC: Vector3[] = [];
    for (let i = 0; i < NB; i++) {
      let d: Vector3;
      if (i < 10) {
        const x = (rnd() * 2 - 1) * 0.95, y = -0.15 + rnd() * 1.1;
        d = fin.F.clone().addScaledVector(fin.R, x * fin.tan.x).addScaledVector(fin.U, y * fin.tan.y).normalize();
      } else {
        const z = rnd() * 2 - 1, a = rnd() * Math.PI * 2, r = Math.sqrt(1 - z * z);
        d = new Vector3(r * Math.cos(a), z, r * Math.sin(a));
      }
      const mag = 0.6 + Math.pow(rnd(), 3) * 3.4;
      B.push(new Vector4(d.x, d.y, d.z, mag));
      const k = rnd();
      BC.push(new Vector3(...blackbody(k < 0.25 ? 3400 + rnd() * 1200 : k < 0.55 ? 5200 + rnd() * 1300 : 7500 + rnd() * 5000)));
    }
    // Vía Láctea cruzando el encuadre final en diagonal
    const v = fin.R.clone().multiplyScalar(Math.cos(0.5)).addScaledVector(fin.U, Math.sin(0.5));
    const through = fin.F.clone().addScaledVector(fin.U, 0.45).normalize();
    const galN = new Vector3().crossVectors(through, v).normalize();
    const gc0 = fin.F.clone().addScaledVector(fin.R, -0.55).addScaledVector(fin.U, 0.2);
    const galC = gc0.addScaledVector(galN, -gc0.dot(galN)).normalize();

    this.mat = new ShaderMaterial({
      vertexShader: VERT,
      fragmentShader: FRAG,
      depthTest: false,
      depthWrite: false,
      defines: { PSTEPS: q.P, LSTEPS: q.L, OCT: q.OCT, STARL: q.STARL, NB },
      uniforms: {
        uRes: { value: new Vector2(1, 1) },
        uCamPos: { value: new Vector3() },
        uF: { value: new Vector3() },
        uR: { value: new Vector3() },
        uU: { value: new Vector3() },
        uTan: { value: new Vector2(1, 1) },
        uSun: { value: SUN },
        uSunI: { value: 20 },
        uTime: { value: 0 },
        uExposure: { value: 1 },
        uTerrain: { value: 1 },
        uCloud: { value: 1 },
        uTwinkle: { value: 1 },
        uMW: { value: 0.1 },
        uStarGain: { value: 1 },
        uAmb: { value: 1 },
        uAlt: { value: 0.002 },
        uDbg: { value: Number(new URLSearchParams(window.location.search).get('dbg') ?? 0) },
        uNorth0: { value: NORTH },
        uEast0: { value: EAST },
        uGalN: { value: galN },
        uGalC: { value: galC },
        uEarth: { value: this.tex },
        uB: { value: B },
        uFog: { value: 0 },
        uStreak: { value: 0 },
        uHeat: { value: 0 },
        uFlash: { value: 0 },
        uWorlds: { value: 0 },
        uVP: { value: new Vector2(0, 0) },
        uMoonD: { value: new Vector4(0, 1, 0, 0.0175) },
        uMarsD: { value: new Vector3(0, 1, 0) },
        uBC: { value: BC },
      },
    });
    if (old) {
      (this.scene.children[0] as Mesh).material = this.mat;
      old.dispose();
    }
  }

  get quality() {
    return { tier: this.tier, scale: this.scale };
  }

  resize(w: number, h: number) {
    this.w = Math.max(1, w);
    this.h = Math.max(1, h);
    this.applySize();
    this.lastT = -1;
    this.renderNow();
  }
  private applySize() {
    const dpr = Math.min(window.devicePixelRatio || 1, TIERS[this.tier].dpr) * this.scale;
    this.renderer.setPixelRatio(dpr);
    this.renderer.setSize(this.w, this.h, false);
    const v = new Vector2();
    this.renderer.getDrawingBufferSize(v);
    this.mat.uniforms.uRes.value.copy(v);
  }

  /** Dibuja el instante t (segundos). */
  renderAt(t: number) {
    if (this.disposed) return;
    const aspect = this.w / this.h;
    const p = poseAt(t, aspect);
    const b = basis(p, aspect);
    const u = this.mat.uniforms;
    u.uCamPos.value.copy(b.pos);
    u.uF.value.copy(b.F);
    u.uR.value.copy(b.R);
    u.uU.value.copy(b.U);
    u.uTan.value.copy(b.tan);
    u.uTime.value = t;
    u.uAlt.value = p.alt;
    const f = smooth(0, 1, Math.log(1 + p.alt / 0.3) / Math.log(1 + ALT_END / 0.3));
    const exposure = Math.exp(lerp(Math.log(26 * lerp(1, 0.45, p.tilt)), Math.log(1.5), smooth(20, 420, p.alt)));
    u.uExposure.value = exposure;
    u.uStarGain.value = lerp(0.2, 1.0, f) / exposure;
    u.uTerrain.value = 1 - smooth(0.6, 5, p.alt);
    u.uCloud.value = 1 - smooth(1.5, 4.5, p.alt);
    u.uTwinkle.value = 1 - smooth(8, 60, p.alt);
    u.uMW.value = lerp(0.12, 1, smooth(15, 250, p.alt));
    // efectos del despegue
    const fx = fxAt(t);
    u.uFog.value = fx.fog;
    u.uStreak.value = fx.streak;
    u.uHeat.value = fx.heat;
    u.uFlash.value = fx.flash;
    // punto de fuga: hacia donde sube la cámara (la vertical local)
    const up = b.pos.clone().normalize();
    const fz = Math.max(0.12, up.dot(b.F));
    const vp = new Vector2(up.dot(b.R) / fz / b.tan.y, up.dot(b.U) / fz / b.tan.y);
    if (vp.length() > 2.5) vp.setLength(2.5);
    u.uVP.value.copy(vp);
    // la Luna y Marte, fijos en el cielo, quedan en su sitio en el encuadre final
    if (aspect !== this.worldsAspect) {
      this.worldsAspect = aspect;
      const fin = basis(poseAt(SKY_TIMELINE.end, aspect), aspect);
      const W = aspect < 0.8 ? WORLDS_ON_SCREEN.portrait : WORLDS_ON_SCREEN.landscape;
      const at = ([x, y]: readonly [number, number]) =>
        fin.F.clone().addScaledVector(fin.R, (2 * x - 1) * fin.tan.x).addScaledVector(fin.U, (1 - 2 * y) * fin.tan.y).normalize();
      const m = at(W.moon);
      u.uMoonD.value.set(m.x, m.y, m.z, (aspect < 0.8 ? 1.25 : 1.05) * D2R);
      u.uMarsD.value.copy(at(W.mars));
    }
    u.uWorlds.value = smooth(60, 600, p.alt);
    this.renderer.render(this.scene, this.cam);
  }
  private worldsAspect = 0;
  private renderNow() {
    if (!this.tex) return;
    const t = Math.min(this.opts.getTime(), SKY_TIMELINE.end);
    this.renderAt(Math.max(0, t));
    this.lastT = t;
  }

  /** Imagen del último fotograma (llamar justo después de renderAt). */
  snapshot() {
    return this.canvas.toDataURL('image/jpeg', 0.9);
  }

  /** Reanuda el bucle (p. ej. tras repetir o saltar). Se detiene solo al final del viaje. */
  kick() {
    if (this.running || this.disposed) return;
    this.running = true;
    this.lastFrame = 0;
    const loop = (now: number) => {
      if (!this.running) return;
      const t = Math.min(this.opts.getTime(), SKY_TIMELINE.end);
      if (t !== this.lastT && this.tex) {
        this.renderAt(Math.max(0, t));
        this.lastT = t;
        this.adapt(now);
      }
      // al final el cielo de órbita no centellea: se para el bucle (0 % GPU)
      if (t >= SKY_TIMELINE.end && this.tex) {
        this.running = false;
        return;
      }
      this.raf = requestAnimationFrame(loop);
    };
    this.raf = requestAnimationFrame(loop);
  }
  stop() {
    this.running = false;
    cancelAnimationFrame(this.raf);
  }

  /** Resolución adaptativa y niveles de calidad según el tiempo de fotograma. */
  private adapt(now: number) {
    if (!this.opts.adaptive) return;
    if (this.lastFrame) this.frames.push(now - this.lastFrame);
    this.lastFrame = now;
    if (this.frames.length < 20 || now - this.lastAdapt < 700) return;
    const avg = this.frames.reduce((a, b) => a + b, 0) / this.frames.length;
    this.frames = [];
    this.lastAdapt = now;
    if (avg > 26) {
      if (this.scale > 0.7) {
        this.scale = Math.max(0.65, this.scale * 0.82);
        this.applySize();
      } else if (this.tier !== 'low') {
        this.tier = this.tier === 'high' ? 'medium' : 'low';
        this.scale = 0.85;
        this.build();
        this.applySize();
      }
    } else if (avg < 13 && this.scale < 1) {
      this.scale = Math.min(1, this.scale * 1.12);
      this.applySize();
    }
  }

  dispose() {
    this.disposed = true;
    this.stop();
    this.canvas.removeEventListener('webglcontextlost', this.onLost);
    this.tex?.dispose();
    this.mat.dispose();
    (this.scene.children[0] as Mesh | undefined)?.geometry.dispose();
    this.renderer.dispose();
  }
}

/** Nivel inicial heurístico (el bucle adaptativo corrige en caliente). */
export function detectSkyTier(): SkyTier {
  const forced = new URLSearchParams(window.location.search).get('quality');
  if (forced === 'high' || forced === 'medium' || forced === 'low') return forced;
  let r = '';
  try {
    const c = document.createElement('canvas');
    const gl = c.getContext('webgl2') ?? c.getContext('webgl');
    const dbg = gl?.getExtension('WEBGL_debug_renderer_info');
    if (gl && dbg) r = String(gl.getParameter(dbg.UNMASKED_RENDERER_WEBGL) ?? '').toLowerCase();
    gl?.getExtension('WEBGL_lose_context')?.loseContext();
  } catch {
    /* sin WebGL */
  }
  const mobile = window.matchMedia('(pointer: coarse)').matches || Math.min(screen.width, screen.height) < 600;
  if (/swiftshader|llvmpipe|software/.test(r) || mobile) return 'low';
  if (/intel|uhd|iris|mali|adreno|powervr|apple gpu/.test(r) || (navigator.hardwareConcurrency ?? 4) <= 4) return 'medium';
  return 'high';
}
