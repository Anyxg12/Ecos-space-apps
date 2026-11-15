import type { AgeGroup, InterestId } from './types';

/** Datos de contenido (textos) separados de la presentación. */
export interface AgeGroupInfo {
  id: AgeGroup;
  label: string;
  range: string;
  tagline: string;
  destination: string;
}

export const AGE_GROUPS: AgeGroupInfo[] = [
  {
    id: 'junior',
    label: 'Junior',
    range: '7–11 años',
    tagline: 'Cuentos ilustrados de Marte y la Luna, con mundos que tienen personalidad.',
    destination: 'Universo ilustrado',
  },
  {
    id: 'explorer',
    label: 'Explorer',
    range: '12–17 años',
    tagline: 'Misiones cinematográficas, retos y exploración.',
    destination: 'Centro de misiones',
  },
  {
    id: 'discovery',
    label: 'Discovery',
    range: '18+ años',
    tagline: 'Archivo científico, ingeniería y fotografía real.',
    destination: 'Observatorio',
  },
];

export interface InterestInfo {
  id: InterestId;
  label: string;
}

export const INTERESTS: InterestInfo[] = [
  { id: 'futbol', label: 'Fútbol' },
  { id: 'videojuegos', label: 'Videojuegos' },
  { id: 'arte', label: 'Arte' },
  { id: 'animales', label: 'Animales' },
  { id: 'musica', label: 'Música' },
  { id: 'tecnologia', label: 'Tecnología' },
  { id: 'ciencia', label: 'Ciencia' },
  { id: 'robotica', label: 'Robótica' },
  { id: 'naturaleza', label: 'Naturaleza' },
  { id: 'historia', label: 'Historia' },
  { id: 'cine', label: 'Cine' },
  { id: 'cocina', label: 'Cocina' },
];

export const MAX_INTERESTS = 5;
