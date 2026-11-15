import { useEffect, useRef, useState } from 'react';
import { fact, STEP_FACT_IDS, type SpiritFact } from '../../data/spiritFacts';
import { useEcosHost } from '../host';

/** Lista de hechos verificados con su fuente (sólo datos de spirit-facts.json). */
export function FactList({ ids, compact = false }: { ids: readonly string[]; compact?: boolean }) {
  return (
    <dl className={`facts ${compact ? 'facts--compact' : ''}`}>
      {ids.map((id) => {
        const f: SpiritFact = fact(id);
        const src = f.sources[0];
        return (
          <div key={id} className="facts__row">
            <dt>{f.label_es}</dt>
            <dd>
              {f.value_es}{' '}
              <a className="facts__src" href={src.url} target="_blank" rel="noopener noreferrer">
                Fuente: {src.publisher}
                <span className="sr-only"> (se abre en otra pestaña)</span>
              </a>
            </dd>
          </div>
        );
      })}
    </dl>
  );
}

type Step = 'historia' | 'actividad' | 'legado' | 'fin';
const STEPS: { id: Exclude<Step, 'fin'>; label: string; star: string }[] = [
  { id: 'historia', label: 'Historia', star: 'spirit-historia' },
  { id: 'actividad', label: 'Actividad', star: 'spirit-actividad' },
  { id: 'legado', label: 'Legado', star: 'spirit-legado' },
];

/**
 * «Explorar Spirit»: recorrido corto de demostración en 3 pasos.
 * Cada paso completado desbloquea su estrella en Mis logros (vía el repositorio de progreso del host).
 */
export function SpiritExplore({ onClose }: { onClose: () => void }) {
  const host = useEcosHost();
  const first = STEPS.find((s) => !host?.isUnlocked(s.star))?.id ?? 'fin';
  const [step, setStep] = useState<Step>(first === 'fin' ? 'historia' : first);
  const [answer, setAnswer] = useState<'gusev' | 'meridiani' | null>(null);
  const [newStars, setNewStars] = useState<string[]>([]);
  const ref = useRef<HTMLDivElement>(null);
  const headRef = useRef<HTMLHeadingElement>(null);

  useEffect(() => {
    headRef.current?.focus({ preventScroll: true });
  }, [step]);
  useEffect(() => {
    const k = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.stopPropagation();
        onClose();
      }
    };
    window.addEventListener('keydown', k, true);
    return () => window.removeEventListener('keydown', k, true);
  }, [onClose]);

  const complete = (star: string, next: Step) => {
    if (host && !host.isUnlocked(star)) {
      host.unlock(star);
      setNewStars((s) => [...s, star]);
    }
    setStep(next);
  };
  const idx = step === 'fin' ? 3 : STEPS.findIndex((s) => s.id === step);

  return (
    <div className="explore" role="dialog" aria-modal="true" aria-labelledby="explore-title" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div ref={ref} className="explore__panel">
        <div className="explore__top">
          <p className="explore__kicker">Explorar Spirit · demo</p>
          <button type="button" className="explore__close" onClick={onClose} aria-label="Cerrar Explorar Spirit">
            ✕
          </button>
        </div>
        <ol className="explore__steps" aria-label="Pasos">
          {STEPS.map((s, i) => (
            <li key={s.id} className={i < idx || host?.isUnlocked(s.star) ? 'is-done' : i === idx ? 'is-current' : ''} aria-current={i === idx ? 'step' : undefined}>
              <span aria-hidden="true">{i < idx || host?.isUnlocked(s.star) ? '✓' : i + 1}</span> {s.label}
            </li>
          ))}
        </ol>

        {step === 'historia' && (
          <>
            <h3 id="explore-title" ref={headRef} tabIndex={-1} className="explore__title">
              1 · Historia: la ficha de Spirit
            </h3>
            <p className="explore__lead">Lee estos datos verificados. Cada uno enlaza a su fuente oficial.</p>
            <FactList ids={STEP_FACT_IDS.historia} />
            <button type="button" className="explore__cta" onClick={() => complete('spirit-historia', 'actividad')}>
              Ya lo leí · siguiente
            </button>
          </>
        )}

        {step === 'actividad' && (
          <>
            <h3 id="explore-title" ref={headRef} tabIndex={-1} className="explore__title">
              2 · Actividad: ¿dónde aterrizó Spirit?
            </h3>
            <div className="explore__options" role="group" aria-label="Opciones">
              <button type="button" className={`explore__opt ${answer === 'gusev' ? 'is-right' : ''}`} onClick={() => setAnswer('gusev')}>
                Cráter Gusev
              </button>
              <button type="button" className={`explore__opt ${answer === 'meridiani' ? 'is-wrong' : ''}`} onClick={() => setAnswer('meridiani')}>
                Meridiani Planum
              </button>
            </div>
            <p className="explore__feedback" aria-live="polite">
              {answer === 'gusev' && '¡Correcto! Spirit aterrizó en el cráter Gusev.'}
              {answer === 'meridiani' && 'Casi: Meridiani Planum fue el lugar de aterrizaje de Opportunity, su rover gemelo. Prueba otra vez.'}
            </p>
            {answer === 'gusev' && <FactList ids={['landing_site']} compact />}
            <button type="button" className="explore__cta" disabled={answer !== 'gusev'} onClick={() => complete('spirit-actividad', 'legado')}>
              Siguiente
            </button>
          </>
        )}

        {step === 'legado' && (
          <>
            <h3 id="explore-title" ref={headRef} tabIndex={-1} className="explore__title">
              3 · Legado: las huellas que dejó
            </h3>
            <FactList ids={STEP_FACT_IDS.legado} />
            <button type="button" className="explore__cta" onClick={() => complete('spirit-legado', 'fin')}>
              Completar misión Spirit
            </button>
          </>
        )}

        {step === 'fin' && (
          <>
            <h3 id="explore-title" ref={headRef} tabIndex={-1} className="explore__title">
              Misión Spirit completada
            </h3>
            <p className="explore__lead" aria-live="polite">
              {newStars.length > 0
                ? `Se ${newStars.length === 1 ? 'encendió una estrella nueva' : `encendieron ${newStars.length} estrellas nuevas`} en Mis logros, y ganaste la insignia provisional «Huellas de Spirit».`
                : 'Ya tenías estas estrellas en Mis logros.'}
            </p>
            <div className="explore__row">
              {host && (
                <button type="button" className="explore__cta" onClick={host.openAchievements}>
                  ★ Ver Mis logros
                </button>
              )}
              <button type="button" className="explore__ghost" onClick={onClose}>
                Seguir en Marte
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
