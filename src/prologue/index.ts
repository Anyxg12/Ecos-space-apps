/**
 * ECOS · Prólogo «El Horizonte de los Ecos» — API pública del módulo.
 * Copiar la carpeta src/prologue/ al repo principal e importar desde aquí.
 */
import './styles/prologue.css';
export { EcosPrologue, type EcosPrologueProps } from './Prologue';
export { Destination } from './components/endscreens/Destination';
export { SignalCore, type SignalCoreState } from './components/SignalCore';
export { prologueStorage } from './state/storage';
export { prologueReducer, initialPrologueState, type PrologueAction } from './state/prologueMachine';
export { buildWelcome, type WelcomeContent } from './state/personalization';
export { AGE_GROUPS, INTERESTS, MAX_INTERESTS } from './state/catalog';
export { PLACES, type PlaceId, type PlaceInfo } from './state/destinations';
export { ROVERS, ROVER_FIELD_LABELS, type RoverData, type RoverId } from './state/roverData';
export { universeReducer, initialUniverse, type UniverseState, type UniverseAction } from './state/universeMachine';
export { THEMES, NEUTRAL, themeFor, type ThemeDefinition, type ShaderLook, type UiTheme } from './themes/themes';
export type { AgeGroup, InterestId, ExplorerProfile, ProloguePhase, PrologueState } from './state/types';
export { BlackHoleRenderer } from './gl/BlackHoleRenderer';
export { detectCapability, QUALITY, type QualityTier } from './gl/quality';
export { EcosHostContext, useEcosHost, type EcosHost } from './host';
