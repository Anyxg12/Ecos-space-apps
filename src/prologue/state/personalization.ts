import type { AgeGroup, ExplorerProfile } from './types';

/**
 * Lógica de personalización pura (sin UI). En el producto real la alimentarán la IA y los
 * datos reales de la NASA; aquí NO se inventan datos, fechas ni descripciones.
 */
export interface WelcomeContent {
  greeting: string;
  title: string;
  hint: string;
}

const COPY: Record<AgeGroup, WelcomeContent> = {
  junior: { greeting: '¡Hola, explorador!', title: '¿A dónde viajamos hoy?', hint: 'Toca Marte o la Luna para volar' },
  explorer: { greeting: 'Identidad confirmada', title: 'Elige destino', hint: 'Marte · Spirit + Opportunity  |  Luna · ALSEP' },
  discovery: { greeting: 'Acceso concedido', title: 'Dos mundos, tres historias', hint: 'Selecciona Marte o la Luna para acercarte' },
};

export function buildWelcome(profile: Pick<ExplorerProfile, 'ageGroup' | 'interests'> & { alias?: string }): WelcomeContent {
  const c = COPY[profile.ageGroup];
  // el seudónimo (si existe) personaliza el saludo; nunca se pide el nombre real
  if (profile.alias) return { ...c, greeting: profile.ageGroup === 'explorer' ? `Explorador ${profile.alias} · identidad confirmada` : `¡Hola, ${profile.alias}!` };
  return c;
}
