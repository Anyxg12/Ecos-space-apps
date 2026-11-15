import type { AgeGroup } from '../state/types';
import type { PlaceId } from '../state/destinations';

/**
 * Capa de viaje universo → superficie, distinta en cada modo:
 * Junior: página de cuento que se abre en círculo · Explorer: HUD de salto · Discovery: cortinilla documental.
 * Decorativa (aria-hidden); el estado del viaje se anuncia con texto accesible.
 */
export function TravelFx({ variant, place, reducedMotion }: { variant: AgeGroup; place: PlaceId; reducedMotion: boolean }) {
  const name = place === 'marte' ? 'Marte' : 'la Luna';
  return (
    <div className={`travel travel--${variant} travel--${place} ${reducedMotion ? 'is-reduced' : ''}`}>
      <p className="sr-only" role="status">Viajando a {name}…</p>
      {variant === 'junior' && (
        <div className="travel__jr" aria-hidden="true">
          <svg className="travel__orbit" viewBox="0 0 200 200"><circle cx="100" cy="100" r="80" /></svg>
          <svg className="travel__rocket" viewBox="0 0 60 120"><path d="M30 4 C42 18 44 40 42 74 H18 C16 40 18 18 30 4Z" /><path className="f" d="M18 60 L8 84 L18 80Z M42 60 L52 84 L42 80Z" /><path className="fl" d="M22 76 Q30 108 38 76Z" /></svg>
          <p className="travel__big">¡Rumbo a {name}!</p>
        </div>
      )}
      {variant === 'explorer' && (
        <div className="travel__hud" aria-hidden="true">
          <span className="travel__br tl" /><span className="travel__br tr" /><span className="travel__br bl" /><span className="travel__br br" />
          <div className="travel__readout">
            <p>SALTO INICIADO</p>
            <p className="is-on">DESTINO · {place === 'marte' ? 'MARTE' : 'LUNA'}</p>
            <div className="travel__bar"><i /></div>
            <p className="dim">{place === 'marte' ? 'SEÑAL: SPIRIT · OPPORTUNITY' : 'SEÑAL: ALSEP'}</p>
          </div>
        </div>
      )}
      {variant === 'discovery' && (
        <div className="travel__doc" aria-hidden="true">
          <span className="travel__lb top" /><span className="travel__lb bottom" />
          <div className="travel__cap">
            <small>Aproximación</small>
            <strong>{place === 'marte' ? 'Marte' : 'La Luna'}</strong>
          </div>
        </div>
      )}
    </div>
  );
}
