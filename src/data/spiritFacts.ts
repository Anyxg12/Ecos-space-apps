import base from './spirit-facts.json';

/**
 * Base de hechos verificados de Spirit (copiada de ecos-research/spirit-facts.json).
 * REGLA: la app sólo muestra hechos que estén en este JSON, con su enlace de fuente. No añadir datos.
 */
export interface FactSource {
  url: string;
  title: string;
  publisher: string;
}
export interface SpiritFact {
  id: string;
  category: string;
  verified: boolean;
  label_es: string;
  label_en: string;
  value_es: string;
  value_en: string;
  sources: FactSource[];
}

const FACTS = (base as { facts: SpiritFact[] }).facts.filter((f) => f.verified);
export const SPIRIT_META = base.meta;

export function fact(id: string): SpiritFact {
  const f = FACTS.find((x) => x.id === id);
  if (!f) throw new Error(`[ECOS] hecho no encontrado en spirit-facts.json: ${id}`);
  return f;
}

/** Selección mostrada en la tarjeta de Spirit (pantalla de Marte). */
export const CARD_FACT_IDS = ['official_name', 'landing_site', 'landing_date', 'planned_duration', 'actual_duration', 'actual_distance', 'last_communication'] as const;
/** Pasos de «Explorar Spirit». */
export const STEP_FACT_IDS = {
  historia: ['name_origin', 'launch_datetime', 'landing_site'],
  legado: ['actual_duration', 'actual_distance', 'remains_on_mars'],
} as const;
