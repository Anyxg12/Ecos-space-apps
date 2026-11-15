import { createContext, useContext } from 'react';

/**
 * Puente opcional entre el prólogo/universo y la app que lo aloja (navegación y progreso).
 * Sin proveedor, el módulo funciona igual que antes (sin botón «Mis logros» ni desbloqueos).
 */
export interface EcosHost {
  openAchievements: () => void;
  /** Abre «Top exploradores» (opcional). */
  openRanking?: () => void;
  unlock: (id: string) => void;
  isUnlocked: (id: string) => boolean;
}
export const EcosHostContext = createContext<EcosHost | null>(null);
export const useEcosHost = () => useContext(EcosHostContext);
