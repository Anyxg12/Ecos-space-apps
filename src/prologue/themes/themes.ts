import type { AgeGroup } from '../state/types';

/** Paleta que consume el shader (RGB lineal 0..1). */
export interface ShaderLook {
  diskHot: [number, number, number];
  diskWarm: [number, number, number];
  diskCool: [number, number, number];
  nebula: [number, number, number];
  /** 0 = cinematográfico, 1 = posterizado tipo ilustración 2D */
  posterize: number;
  /** 0 = color, 1 = monocromo editorial cálido */
  mono: number;
  exposure: number;
}

/** Tokens de interfaz (CSS). */
export interface UiTheme {
  id: AgeGroup | 'neutral';
  accent: string;
  accentSoft: string;
  ink: string;
  font: string;
}

export interface ThemeDefinition {
  look: ShaderLook;
  ui: UiTheme;
}

/** Look del horizonte común (antes de elegir identidad). */
export const NEUTRAL: ThemeDefinition = {
  look: {
    diskHot: [1.0, 0.93, 0.82],
    diskWarm: [1.0, 0.55, 0.22],
    diskCool: [0.55, 0.16, 0.05],
    nebula: [0.18, 0.12, 0.32],
    posterize: 0,
    mono: 0,
    exposure: 1.0,
  },
  ui: { id: 'neutral', accent: '#ffb36b', accentSoft: 'rgba(255,179,107,0.18)', ink: '#f5efe6', font: 'var(--font-sans)' },
};

/** Mapeo perfil → identidad visual. Único punto que conoce los colores de cada universo. */
export const THEMES: Record<AgeGroup, ThemeDefinition> = {
  junior: {
    look: {
      diskHot: [1.0, 0.86, 0.55],
      diskWarm: [1.0, 0.52, 0.2],
      diskCool: [0.45, 0.2, 0.62],
      nebula: [0.05, 0.3, 0.36],
      posterize: 1,
      mono: 0,
      exposure: 1.1,
    },
    ui: { id: 'junior', accent: '#ff9a3d', accentSoft: 'rgba(255,154,61,0.2)', ink: '#fff6ea', font: 'var(--font-round)' },
  },
  explorer: {
    look: {
      diskHot: [0.85, 1.0, 1.0],
      diskWarm: [0.25, 0.85, 1.0],
      diskCool: [0.42, 0.18, 0.85],
      nebula: [0.06, 0.08, 0.3],
      posterize: 0,
      mono: 0,
      exposure: 1.05,
    },
    ui: { id: 'explorer', accent: '#4fe3ff', accentSoft: 'rgba(79,227,255,0.16)', ink: '#e8fbff', font: 'var(--font-sans)' },
  },
  discovery: {
    look: {
      diskHot: [1.0, 0.97, 0.9],
      diskWarm: [0.92, 0.8, 0.62],
      diskCool: [0.4, 0.34, 0.28],
      nebula: [0.08, 0.08, 0.09],
      posterize: 0,
      mono: 1,
      exposure: 0.95,
    },
    ui: { id: 'discovery', accent: '#e9dcc3', accentSoft: 'rgba(233,220,195,0.14)', ink: '#f3efe7', font: 'var(--font-serif)' },
  },
};

export function themeFor(group: AgeGroup | null | undefined): ThemeDefinition {
  return group ? THEMES[group] : NEUTRAL;
}
