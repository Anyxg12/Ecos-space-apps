/**
 * Mundos de los universos. El reto «Abandoned but not Forgotten» trata del equipo de la NASA
 * que quedó en la Luna y en Marte; por eso los universos sólo muestran esos dos mundos.
 * Marte: Spirit (misión principal) y Opportunity (ficha). Luna: estaciones ALSEP de Apollo.
 */
export type PlaceId = 'luna' | 'marte';

export interface PlaceInfo {
  id: PlaceId;
  name: string;
  /** índice que usa el shader (0 Luna, 1 Marte) */
  index: 0 | 1;
  /** ¿se puede viajar a él? */
  interactive: boolean;
}

export const PLACES: PlaceInfo[] = [
  { id: 'luna', name: 'La Luna', index: 0, interactive: true },
  { id: 'marte', name: 'Marte', index: 1, interactive: true },
];
