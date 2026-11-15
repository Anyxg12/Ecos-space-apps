/** Vector 3D mínimo (sin dependencia de three para no arrastrarlo al bundle principal). */
export type V3 = [number, number, number];
const add = (a: V3, b: V3, k: number): V3 => [a[0] + b[0] * k, a[1] + b[1] * k, a[2] + b[2] * k];
export const norm = (a: V3): V3 => {
  const l = Math.hypot(a[0], a[1], a[2]) || 1;
  return [a[0] / l, a[1] / l, a[2] / l];
};

/**
 * Línea de tiempo del despegue (segundos).
 * 0 → atardecer · countdown → cuenta atrás y retumbo · liftoff → despegue con la cámara mirando arriba ·
 * spaceAt → órbita (aparecen las estrellas-logro) · end → fotograma final quieto.
 */
export const SKY_TIMELINE = { countdown: 1.5, riseStart: 3.3, spaceAt: 9.7, end: 10.4 } as const;
export const R0 = 6371;
const ALT0 = 0.002;
export const ALT_END = 1300;
export const D2R = Math.PI / 180;
const LAT = -0.3 * D2R; // cielo sobre los Andes ecuatorianos (sólo encuadre)
const LON = -78.5 * D2R;

const clamp01 = (x: number) => Math.min(1, Math.max(0, x));
const ease = (x: number) => {
  x = clamp01(x);
  return x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2;
};
export const smooth = (a: number, b: number, x: number) => {
  const t = clamp01((x - a) / (b - a));
  return t * t * (3 - 2 * t);
};
export const lerp = (a: number, b: number, t: number) => a + (b - a) * t;

/** Base local (este, norte, arriba) del punto de partida. */
export const UP: V3 = [Math.cos(LAT) * Math.cos(LON), Math.sin(LAT), -Math.cos(LAT) * Math.sin(LON)];
export const NORTH: V3 = [-Math.sin(LAT) * Math.cos(LON), Math.cos(LAT), Math.sin(LAT) * Math.sin(LON)];
export const EAST: V3 = [-Math.sin(LON), 0, -Math.cos(LON)];
export const dirFrom = (yawDeg: number, pitchDeg: number) => {
  const y = yawDeg * D2R, p = pitchDeg * D2R;
  return norm(add(add(add([0, 0, 0], NORTH, Math.cos(p) * Math.cos(y)), EAST, Math.cos(p) * Math.sin(y)), UP, Math.sin(p)));
};
/** Sol de noviembre al atardecer: oeste-suroeste, 3° bajo el horizonte (atardecer). */
export const SUN = dirFrom(-108, -3);

export interface Pose {
  alt: number;
  pitch: number;
  yaw: number;
  roll: number;
  vfov: number;
  /** 0 → 1 mientras la cámara gira hacia arriba */
  tilt: number;
}

/** Efectos del despegue en el instante t (0–1 salvo indicación). Matemática pura, la usan GL, CSS y sonido. */
export interface LaunchFx {
  /** amplitud de la vibración de cámara (grados) */
  shake: number;
  /** fundido de atravesar nubes (0 despejado → 1 dentro de la nube) */
  fog: number;
  /** estelas de velocidad */
  streak: number;
  /** calor/resplandor del motor bajo la cámara */
  heat: number;
  /** destello breve en la ignición */
  flash: number;
}

export function fxAt(t: number): LaunchFx {
  const L = SKY_TIMELINE.riseStart;
  const build = smooth(SKY_TIMELINE.countdown + 0.3, L, t) * 0.22;
  const lift = smooth(L - 0.05, L + 0.5, t);
  const maxQ = Math.exp(-Math.pow((t - (L + 2.2)) / 1.4, 2));
  const thin = 1 - smooth(L + 3.2, L + 5.6, t);
  const shake = build * (1 - lift) + lift * (0.32 + 0.7 * maxQ) * thin;
  // capa de nubes: se atraviesa entre ~2 y ~7 km
  const a = altAt(t);
  const fog = smooth(0.9, 2.8, a) * (1 - smooth(3.8, 9.5, a));
  const streak = smooth(L + 0.6, L + 1.8, t) * (1 - smooth(L + 3.4, L + 5.2, t));
  const heat = smooth(L - 0.3, L + 0.15, t) * (1 - smooth(L + 1.2, L + 4.0, t));
  const flash = Math.exp(-Math.pow((t - L - 0.08) / 0.18, 2));
  return { shake, fog, streak, heat, flash };
}

/** Altitud de la cámara (km): quieta hasta el despegue, luego aceleración exponencial y frenada suave. */
export function altAt(t: number) {
  const u = clamp01((t - SKY_TIMELINE.riseStart) / (SKY_TIMELINE.spaceAt + 0.35 - SKY_TIMELINE.riseStart));
  // en escala logarítmica: arranque lento (empuje) → nubes → cielo que se oscurece → llegada suave a la órbita
  const s = 1 - Math.pow(1 - u, 2);
  return Math.exp(Math.log(ALT0) + (Math.log(ALT_END) - Math.log(ALT0)) * s);
}

/** Pantalla (0–1 desde arriba a la izquierda) donde quedan la Luna y Marte en el encuadre final. */
export const WORLDS_ON_SCREEN = {
  landscape: { moon: [0.85, 0.24] as const, mars: [0.15, 0.27] as const },
  portrait: { moon: [0.83, 0.31] as const, mars: [0.2, 0.775] as const },
};

const shakeNoise = (t: number, k: number) =>
  Math.sin(t * 41.3 + k) * 0.5 + Math.sin(t * 67.9 + k * 2.1) * 0.3 + Math.sin(t * 23.1 + k * 3.7) * 0.2;

/** Cámara: atardecer → mira hacia arriba → despega como un cohete → frena y baja la mirada hacia la curvatura de la Tierra. */
export function poseAt(t: number, aspect: number): Pose {
  const portrait = aspect < 0.8;
  const vfov = portrait ? 66 : 50;
  const horizonY = portrait ? 0.84 : 0.77;
  const below = Math.atan((horizonY - 0.5) * 2 * Math.tan((vfov / 2) * D2R)) / D2R;
  const dip = Math.acos(R0 / (R0 + ALT_END)) / D2R;
  const pitchEnd = below - dip;
  const L = SKY_TIMELINE.riseStart;
  const tilt = ease((t - 1.0) / (L - 1.0));
  const alt = altAt(t);
  // mirada: horizonte → arriba (cuenta atrás) → aún más arriba durante el ascenso → baja hacia la Tierra al llegar
  let pitch = lerp(portrait ? 12 : 8, portrait ? 40 : 30, tilt);
  // en el ascenso la mirada baja un poco: el resplandor del horizonte entra por abajo mientras el cielo se oscurece
  pitch = lerp(pitch, portrait ? 30 : 21, ease((t - L) / 2.8));
  pitch = lerp(pitch, pitchEnd, ease((t - (L + 2.6)) / (SKY_TIMELINE.spaceAt - L - 2.6)));
  // giro de azimut lento (del sol poniente hacia el cielo nocturno) y programa de alabeo del ascenso
  const yaw = -100 + 92 * ease((t - L + 0.5) / (SKY_TIMELINE.end - L + 0.5));
  const rollProg = Math.sin(Math.PI * clamp01((t - L - 0.6) / (SKY_TIMELINE.end - L - 0.6))) * 0.16;
  const fx = fxAt(t);
  const shk = fx.shake;
  return {
    alt,
    pitch: pitch + shk * shakeNoise(t, 0.0),
    yaw: yaw + shk * 0.8 * shakeNoise(t, 5.0),
    roll: rollProg + shk * 0.004 * shakeNoise(t, 9.0),
    vfov: vfov + 3 * fx.streak, // leve ensanchamiento con la velocidad
    tilt,
  };
}
