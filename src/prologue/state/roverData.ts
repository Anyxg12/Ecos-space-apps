/**
 * Datos de los rovers — ESTRUCTURA VACÍA a propósito.
 * No se inventan hechos: cada campo queda `null` hasta rellenarlo con datos reales de la NASA
 * (p. ej. desde un JSON/servicio). La UI muestra la etiqueta y un hueco limpio mientras sea null.
 */
export type RoverId = 'spirit' | 'opportunity';

export interface RoverData {
  id: RoverId;
  /** Nombre visible (único dato fijo). */
  name: string;
  /** Campos a completar con fuentes oficiales de la NASA. */
  fields: {
    mission: string | null;
    launchDate: string | null;
    landingDate: string | null;
    landingSite: string | null;
    distanceKm: number | null;
    lastContact: string | null;
  };
  /** URL de imagen oficial (dominio público NASA) — pendiente. */
  imageUrl: string | null;
  /** Fuente citada del dato (URL NASA) — pendiente. */
  sourceUrl: string | null;
}

/** Etiquetas de interfaz para cada campo (no son datos). */
export const ROVER_FIELD_LABELS: Record<keyof RoverData['fields'], string> = {
  mission: 'Misión',
  launchDate: 'Lanzamiento',
  landingDate: 'Aterrizaje',
  landingSite: 'Lugar de aterrizaje',
  distanceKm: 'Distancia recorrida',
  lastContact: 'Último contacto',
};

const empty = (): RoverData['fields'] => ({
  mission: null,
  launchDate: null,
  landingDate: null,
  landingSite: null,
  distanceKm: null,
  lastContact: null,
});

export const ROVERS: RoverData[] = [
  { id: 'spirit', name: 'Spirit', fields: empty(), imageUrl: null, sourceUrl: null },
  { id: 'opportunity', name: 'Opportunity', fields: empty(), imageUrl: null, sourceUrl: null },
];
