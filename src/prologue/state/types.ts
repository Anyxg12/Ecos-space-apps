/**
 * Tipos de dominio del prólogo. Sin dependencias de React ni de la capa visual.
 * Nota de privacidad: el perfil NO contiene nombre real, correo, ubicación ni fecha de nacimiento.
 * Sólo un seudónimo opcional, la franja de edad y los intereses (localStorage).
 */
export type AgeGroup = 'junior' | 'explorer' | 'discovery';

export type InterestId =
  | 'futbol'
  | 'videojuegos'
  | 'arte'
  | 'animales'
  | 'musica'
  | 'tecnologia'
  | 'ciencia'
  | 'robotica'
  | 'naturaleza'
  | 'historia'
  | 'cine'
  | 'cocina';

export interface ExplorerProfile {
  ageGroup: AgeGroup;
  interests: InterestId[];
  /** ISO date de cuando se completó el prólogo */
  createdAt: string;
  /** Seudónimo de explorador (opcional, editable). Nunca el nombre real. */
  alias?: string;
}

export type ProloguePhase =
  | 'horizon' // Escena 1
  | 'approach' // Escena 2
  | 'logo' // Escena 2b · revelado del logo tras la oscuridad
  | 'contact' // Escena 3
  | 'identity' // Escena 4a
  | 'interests' // Escena 4b
  | 'transform' // Escena 5
  | 'done';

export interface PrologueState {
  phase: ProloguePhase;
  /** Identidad que el usuario está previsualizando (hover/foco) */
  previewGroup: AgeGroup | null;
  ageGroup: AgeGroup | null;
  interests: InterestId[];
  skipped: boolean;
}
