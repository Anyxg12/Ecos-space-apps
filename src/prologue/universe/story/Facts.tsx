import type { RoverFact } from '../../../data/opportunityFacts';

/** Un hecho verificado con su fuente (siempre visible el enlace). */
export function FactBody({ f }: { f: RoverFact }) {
  return (
    <p className="sfact__body">
      {f.value}{' '}
      <a className="sfact__src" href={f.source.url} target="_blank" rel="noopener noreferrer">
        Fuente: {f.source.publisher}
        <span aria-hidden="true"> ↗</span>
        <span className="sr-only"> (se abre en otra pestaña)</span>
      </a>
    </p>
  );
}

export const mainFacts = (facts: RoverFact[]) => facts.filter((f) => !f.extra);

/**
 * Material complementario (biografías, lecturas) plegado bajo su propio rótulo, separado de los hechos
 * principales. Siempre con su fuente oficial enlazada.
 */
export function ExtraFacts({ facts }: { facts: RoverFact[] }) {
  const groups: [string, RoverFact[]][] = [
    ['Biografía adicional', facts.filter((f) => f.extra === 'bio')],
    ['Lectura adicional', facts.filter((f) => f.extra === 'reading')],
  ];
  return (
    <>
      {groups
        .filter(([, list]) => list.length)
        .map(([title, list]) => (
          <details key={title} className="sextra">
            <summary>
              <span className="sextra__icon" aria-hidden="true">{title.startsWith('Bio') ? '◎' : '❏'}</span>
              {title}
              <span className="sextra__n">{list.length}</span>
            </summary>
            <dl className="sextra__list">
              {list.map((f) => (
                <div key={f.id}>
                  <dt>{f.label}</dt>
                  <dd><FactBody f={f} /></dd>
                </div>
              ))}
            </dl>
          </details>
        ))}
    </>
  );
}

/** Hechos plegados en «fichas» que se abren al tocarlas (details/summary: accesible sin JS). */
export function FactChips({ facts, open = false }: { facts: RoverFact[]; open?: boolean }) {
  if (!facts.length) return null;
  const main = mainFacts(facts);
  return (
    <div className="sfacts">
      {main.map((f) => (
        <details key={f.id} className="sfact" open={open || undefined}>
          <summary>
            <span className="sfact__dot" aria-hidden="true" />
            {f.label}
          </summary>
          <FactBody f={f} />
        </details>
      ))}
      <ExtraFacts facts={facts} />
    </div>
  );
}
