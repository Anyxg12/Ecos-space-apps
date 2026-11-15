export type QualityTier = 'high' | 'medium' | 'low' | 'minimal';

export interface QualitySettings {
  steps: number;
  stepScale: number;
  starLayers: number;
  /** tope de devicePixelRatio */
  dprCap: number;
  /** escala de resolución interna (el canvas se reescala por CSS) */
  resScale: number;
}

export const QUALITY: Record<QualityTier, QualitySettings> = {
  high: { steps: 120, stepScale: 0.05, starLayers: 3, dprCap: 1.5, resScale: 1 },
  medium: { steps: 80, stepScale: 0.075, starLayers: 3, dprCap: 1, resScale: 0.8 },
  low: { steps: 52, stepScale: 0.11, starLayers: 2, dprCap: 1, resScale: 0.6 },
  minimal: { steps: 36, stepScale: 0.15, starLayers: 2, dprCap: 1, resScale: 0.45 },
};

export const TIER_ORDER: QualityTier[] = ['high', 'medium', 'low', 'minimal'];

export function lowerTier(t: QualityTier): QualityTier | null {
  const i = TIER_ORDER.indexOf(t);
  return i < TIER_ORDER.length - 1 ? TIER_ORDER[i + 1] : null;
}

export interface Capability {
  webgl: boolean;
  tier: QualityTier;
  renderer: string;
}

/** Detección inicial (heurística). El FPS watchdog corrige en caliente. */
export function detectCapability(): Capability {
  const params = new URLSearchParams(window.location.search);
  if (params.get('fallback') === '1') return { webgl: false, tier: 'minimal', renderer: 'forced-fallback' };
  const forced = params.get('quality') as QualityTier | null;

  let gl: WebGLRenderingContext | null = null;
  try {
    const c = document.createElement('canvas');
    gl = (c.getContext('webgl2') as WebGLRenderingContext | null) ?? c.getContext('webgl');
  } catch {
    gl = null;
  }
  if (!gl) return { webgl: false, tier: 'minimal', renderer: 'none' };

  let renderer = '';
  const dbg = gl.getExtension('WEBGL_debug_renderer_info');
  if (dbg) renderer = String(gl.getParameter(dbg.UNMASKED_RENDERER_WEBGL) ?? '');
  gl.getExtension('WEBGL_lose_context')?.loseContext();

  if (forced && forced in QUALITY) return { webgl: true, tier: forced, renderer };

  const r = renderer.toLowerCase();
  const mobile = window.matchMedia('(pointer: coarse)').matches || Math.min(screen.width, screen.height) < 600;
  const cores = navigator.hardwareConcurrency ?? 4;
  let tier: QualityTier = 'high';
  if (/swiftshader|llvmpipe|software|basic render/.test(r)) tier = 'low';
  else if (mobile) tier = cores >= 8 ? 'medium' : 'low';
  else if (/intel|uhd|iris|mali|adreno|powervr/.test(r) || cores <= 4) tier = 'medium';
  return { webgl: true, tier, renderer };
}
