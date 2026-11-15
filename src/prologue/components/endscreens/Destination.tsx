import { lazy, Suspense } from 'react';
import type { UniverseProps } from '../../universe/Universe';
import { MotionProvider } from '../MotionProvider';

// Carga progresiva: el universo (shader de planetas, SVGs) se descarga sólo cuando se necesita.
const Universe = lazy(() => import('../../universe/Universe').then((mod) => ({ default: mod.Universe })));

/** Destino final: el universo del grupo de edad (Junior / Explorer / Discovery). */
export function Destination(props: UniverseProps) {
  return (
    <MotionProvider>
      <Suspense fallback={<div className="h-dvh bg-black" />}>
        <Universe {...props} />
      </Suspense>
    </MotionProvider>
  );
}

/** Precarga el universo mientras se reproduce la transformación (evita parpadeos). */
export function preloadDestination(_group?: UniverseProps['profile']['ageGroup']) {
  void import('../../universe/Universe');
}
