import { useEffect, useState } from 'react';
import type { RoverFact } from '../../../data/opportunityFacts';
import type { AgeGroup } from '../../state/types';
import { useEcosHost } from '../../host';
import { fetchAnalogy } from '../../../app/backend/analogy';
import { backendEnabled } from '../../../app/backend/config';

/**
 * «Analogía para ti · generada con IA»: relaciona el hecho verificado de la parada con los intereses del perfil.
 * Sólo aparece si hay backend; mientras carga muestra un esqueleto y, si falla, desaparece sin dejar rastro.
 * El hecho original (con su fuente oficial) nunca se modifica: la analogía va DEBAJO y siempre rotulada como IA.
 */
export function AnalogyChip({ storyId, fact, variant }: { storyId: string; fact: RoverFact | undefined; variant: AgeGroup }) {
  const host = useEcosHost();
  const interests = host?.interests ?? [];
  const [state, setState] = useState<{ status: 'idle' | 'loading' | 'done' | 'off'; text?: string }>({ status: 'idle' });
  const key = fact ? `${storyId}.${fact.id}` : '';
  const ints = interests.join(',');

  useEffect(() => {
    if (!backendEnabled || !fact || !ints) return setState({ status: 'off' });
    let alive = true;
    setState({ status: 'loading' });
    // pequeña espera: si el usuario pasa rápido por las paradas no se gastan peticiones
    const t = window.setTimeout(() => {
      fetchAnalogy({ factId: key, factText: `${fact.label}: ${fact.value}`, sourceUrl: fact.source.url, interests: ints.split(',') as never, mode: variant }).then((text) => {
        if (alive) setState(text ? { status: 'done', text } : { status: 'off' });
      });
    }, 450);
    return () => {
      alive = false;
      window.clearTimeout(t);
    };
  }, [key, ints, variant, fact]);

  if (state.status === 'off' || state.status === 'idle') return null;
  return (
    <aside className={`sana sana--${variant} ${state.status === 'loading' ? 'is-loading' : ''}`} aria-busy={state.status === 'loading'} aria-label="Analogía para ti, generada con IA">
      <p className="sana__tag">
        <span className="sana__spark" aria-hidden="true">✦</span> Analogía para ti · <b>generada con IA</b>
      </p>
      {state.status === 'loading' ? (
        <div className="sana__skel" aria-hidden="true"><i /><i /></div>
      ) : (
        <p className="sana__text">{state.text}</p>
      )}
      <p className="sana__note">Comparación creativa: el dato verificado es el de arriba, con su fuente de la NASA.</p>
    </aside>
  );
}
