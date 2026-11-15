import type { PlaceId } from './destinations';

/** Navegación dentro de un universo (pura, sin UI). */
export type UniverseView = 'browse' | 'flying' | 'arrived' | 'returning';

export interface UniverseState {
  view: UniverseView;
  place: PlaceId | null;
}

export type UniverseAction =
  | { type: 'SELECT'; place: PlaceId }
  | { type: 'ARRIVED' }
  | { type: 'BACK' }
  | { type: 'RETURNED' };

export const initialUniverse: UniverseState = { view: 'browse', place: null };

export function universeReducer(s: UniverseState, a: UniverseAction): UniverseState {
  switch (a.type) {
    case 'SELECT':
      return s.view === 'browse' ? { view: 'flying', place: a.place } : s;
    case 'ARRIVED':
      return s.view === 'flying' ? { ...s, view: 'arrived' } : s;
    case 'BACK':
      return s.view === 'arrived' ? { ...s, view: 'returning' } : s;
    case 'RETURNED':
      return s.view === 'returning' ? { view: 'browse', place: null } : s;
    default:
      return s;
  }
}
