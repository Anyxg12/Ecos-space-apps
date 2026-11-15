import { easeInOutCubic, easeInQuart, easeOutCubic, type HorizonParams } from './gl/BlackHoleRenderer';
import type { HorizonController } from './gl/controller';
import { NEUTRAL, themeFor } from './themes/themes';
import type { AgeGroup } from './state/types';

/**
 * Coreografía de cámara/uniforms por escena. Separada de los componentes para poder
 * ajustar tiempos sin tocar UI. Todas las duraciones en ms.
 */
const TS = typeof window !== 'undefined' ? Number(new URLSearchParams(window.location.search).get('timescale') ?? '1') || 1 : 1;
/** ?timescale=3 ralentiza la coreografía para revisarla fotograma a fotograma. */
const scaleAll = <T extends Record<string, number>>(o: T): T =>
  Object.fromEntries(Object.entries(o).map(([k, v]) => [k, v * TS])) as T;

export const TIMINGS = scaleAll({
  horizonFadeIn: 2600,
  /** pista «Toca el horizonte» */
  hintDelay: 4000,
  /** duración del revelado del logo antes de continuar solo */
  logoHold: 5200,
  approachTotal: 4300,
  approachFadeStart: 2700,
  approachFade: 1600,
  identityReveal: 2000,
  previewLook: 900,
  transformLook: 1400,
  transformCamera: 2300,
  destinationReveal: 1500,
});

const look = (g: AgeGroup | null) => {
  const l = themeFor(g).look;
  return { diskHot: l.diskHot, diskWarm: l.diskWarm, diskCool: l.diskCool, nebula: l.nebula, posterize: l.posterize, mono: l.mono, exposure: l.exposure };
};

export const SCENE: Record<'horizon' | 'archive', Partial<HorizonParams>> = {
  horizon: { dist: 30, lens: 1, warp: 0, fade: 0, elev: 0.11, roll: -0.09, probeK: 1, diskSpeed: 1, shiftY: 0, ...look(null) },
  /** «el otro lado»: el archivo, visto casi cenital, tenue */
  archive: { dist: 36, lens: 1, warp: 0, fade: 0.5, elev: 0.62, roll: 0.0, probeK: 0.6, diskSpeed: 0.6, shiftY: 0, ...look(null), exposure: 0.85 },
};

export async function playHorizonIntro(c: HorizonController) {
  c.set({ ...SCENE.horizon, dist: 38, fade: 1 });
  await c.tween({ dist: 30, fade: 0 }, TIMINGS.horizonFadeIn, easeOutCubic);
}

let pendingTimer = 0;
const clearPending = () => window.clearTimeout(pendingTimer);
export const cancelPendingChoreography = clearPending;

/** Respuesta al pasar el cursor / enfocar el agujero: la curvatura se intensifica levemente. */
export function hoverHorizon(c: HorizonController, on: boolean) {
  return c.tween({ lens: on ? 1.07 : 1, exposure: on ? 1.08 : 1, diskSpeed: on ? 1.35 : 1 }, 900, easeInOutCubic);
}

export async function playApproach(c: HorizonController, isCancelled: () => boolean = () => false) {
  const T = TIMINGS;
  void c.tween({ dist: 3.6, elev: 0.2, roll: 0.2, lens: 1.3, diskSpeed: 2.4, probeK: 0, shiftY: 0 }, T.approachTotal, (t) => easeInOutCubic(Math.pow(t, 0.85)));
  void c.tween({ warp: 1 }, T.approachTotal - 900, easeInQuart);
  // la iluminación vira a un tono más frío/violeta (sin destellos: exposición máx. ×1,25)
  void c.tween({ diskWarm: [0.95, 0.5, 0.5], nebula: [0.28, 0.1, 0.42], exposure: 0.5 }, 2600, easeInOutCubic);
  await new Promise((r) => window.setTimeout(r, T.approachFadeStart));
  if (isCancelled()) return; // p. ej. el usuario pulsó «Saltar» a mitad del acercamiento
  await c.tween({ fade: 1 }, T.approachFade, easeInOutCubic);
}

export function enterDarkness(c: HorizonController) {
  c.set({ ...SCENE.archive, fade: 1 });
  // tras unos segundos de oscuridad, el archivo empieza a insinuarse (muy tenue)
  clearPending();
  pendingTimer = window.setTimeout(() => void c.tween({ fade: 0.86 }, 3000, easeInOutCubic), 2200);
}

export function revealArchive(c: HorizonController) {
  clearPending();
  return c.tween({ fade: SCENE.archive.fade! }, TIMINGS.identityReveal, easeInOutCubic);
}

export function previewIdentity(c: HorizonController, g: AgeGroup | null) {
  return c.setLook(themeFor(g ?? null).look ?? NEUTRAL.look, TIMINGS.previewLook);
}

export async function playTransformation(c: HorizonController, g: AgeGroup) {
  clearPending();
  void c.setLook(themeFor(g).look, TIMINGS.transformLook);
  await c.tween({ fade: 0, dist: 22, elev: 0.2, warp: 0.2, diskSpeed: 1.6, probeK: 0, shiftY: 0 }, TIMINGS.transformCamera, easeInOutCubic);
}
