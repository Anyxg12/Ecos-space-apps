import { BlackHoleRenderer, DEFAULT_PARAMS, easeInOutCubic, type Ease, type HorizonParams } from './BlackHoleRenderer';
import type { ShaderLook } from '../themes/themes';

/**
 * Contrato común entre el renderer WebGL y el fallback CSS.
 * La coreografía (Prologue.tsx) sólo habla con esta interfaz.
 */
export interface HorizonController {
  readonly kind: 'webgl' | 'css';
  tween(p: Partial<HorizonParams>, ms: number, ease?: Ease): Promise<void>;
  set(p: Partial<HorizonParams>): void;
  setLook(look: ShaderLook, ms: number): Promise<void>;
  setPointer(x: number, y: number): void;
  /** Detiene el dibujo (cuando el destino ya cubre la pantalla). */
  pause(): void;
}

export class WebGLHorizonController implements HorizonController {
  readonly kind = 'webgl' as const;
  constructor(private r: BlackHoleRenderer) {}
  tween(p: Partial<HorizonParams>, ms: number, ease?: Ease) {
    return this.r.tween(p, ms, ease);
  }
  set(p: Partial<HorizonParams>) {
    this.r.set(p);
  }
  setLook(look: ShaderLook, ms: number) {
    return this.r.setLook(look, ms);
  }
  setPointer(x: number, y: number) {
    this.r.setPointer(x, y);
  }
  pause() {
    this.r.stop();
  }
}

const rgb = (c: [number, number, number]) =>
  `rgb(${Math.round(c[0] * 255)} ${Math.round(c[1] * 255)} ${Math.round(c[2] * 255)})`;

/** Fallback: traduce los mismos parámetros a transformaciones y variables CSS con transición. */
export class CssHorizonController implements HorizonController {
  readonly kind = 'css' as const;
  private params: HorizonParams = structuredClone(DEFAULT_PARAMS);
  constructor(private root: HTMLElement, private reducedMotion: boolean) {
    this.apply(0);
  }
  private apply(ms: number) {
    const P = this.params;
    const s = this.root.style;
    s.setProperty('--bh-ms', `${this.reducedMotion ? 0 : ms}ms`);
    s.setProperty('--bh-scale', String(Math.min(9, 34 / Math.max(1.2, P.dist))));
    s.setProperty('--bh-fade', String(P.fade));
    s.setProperty('--bh-warp', String(P.warp));
    s.setProperty('--bh-hot', rgb(P.diskHot));
    s.setProperty('--bh-warm', rgb(P.diskWarm));
    s.setProperty('--bh-cool', rgb(P.diskCool));
    s.setProperty('--bh-nebula', rgb(P.nebula));
    s.setProperty('--bh-mono', String(P.mono));
    s.setProperty('--bh-post', String(P.posterize));
    s.setProperty('--bh-exposure', String(P.exposure));
    s.setProperty('--bh-tilt', `${(P.elev * 180) / Math.PI}deg`);
  }
  tween(p: Partial<HorizonParams>, ms: number, _ease: Ease = easeInOutCubic) {
    Object.assign(this.params, structuredClone(p));
    this.apply(ms);
    return new Promise<void>((res) => window.setTimeout(res, this.reducedMotion ? 0 : ms));
  }
  set(p: Partial<HorizonParams>) {
    void this.tween(p, 0);
  }
  setLook(look: ShaderLook, ms: number) {
    return this.tween(
      { diskHot: look.diskHot, diskWarm: look.diskWarm, diskCool: look.diskCool, nebula: look.nebula, mono: look.mono, posterize: look.posterize, exposure: look.exposure },
      ms,
    );
  }
  setPointer(x: number, y: number) {
    if (this.reducedMotion) return;
    this.root.style.setProperty('--bh-px', String(x));
    this.root.style.setProperty('--bh-py', String(y));
  }
  pause() {
    this.root.style.visibility = 'hidden';
  }
}
