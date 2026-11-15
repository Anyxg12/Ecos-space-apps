import { m } from 'motion/react';
import { INTERESTS, MAX_INTERESTS } from '../state/catalog';
import type { InterestId } from '../state/types';
import { InterestIcon } from './InterestIcon';

interface Props {
  selected: InterestId[];
  onToggle: (id: InterestId) => void;
  onBack: () => void;
  onConfirm: () => void;
  reducedMotion: boolean;
  groupLabel: string;
}

/** Escena 4b — Intereses: «módulos» que se acoplan a tu traje de explorador. */
export function InterestSelect({ selected, onToggle, onBack, onConfirm, reducedMotion, groupLabel }: Props) {
  const d = reducedMotion ? 0 : 1;
  const full = selected.length >= MAX_INTERESTS;
  return (
    <m.section
      className="absolute inset-0 z-10 flex flex-col items-center overflow-y-auto px-5 py-10 sm:justify-center"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0, transition: { duration: 0.5 } }}
      aria-labelledby="ecos-interest-title"
    >
      <p className="font-mono text-[10px] uppercase tracking-[0.45em] text-[color:var(--accent)]">Paso 2 de 2 · Frecuencias de interés · {groupLabel}</p>
      <h2 id="ecos-interest-title" className="mt-3 text-center text-2xl font-extralight text-white sm:text-3xl" style={{ fontFamily: 'var(--theme-font)' }}>
        Sintoniza lo que te mueve
      </h2>
      <p className="mt-2 max-w-md text-center text-sm font-light text-white/55">
        Elige hasta {MAX_INTERESTS}. ECOS usará estas frecuencias para contarte cada historia a tu manera.
      </p>
      <div className="mt-8 grid w-full max-w-3xl grid-cols-3 gap-2.5 sm:grid-cols-4 sm:gap-3" role="group" aria-label="Intereses">
        {INTERESTS.map((it, i) => {
          const on = selected.includes(it.id);
          return (
            <m.button
              key={it.id}
              type="button"
              aria-pressed={on}
              disabled={!on && full}
              onClick={() => onToggle(it.id)}
              className={`interest-chip ${on ? 'interest-chip--on' : ''}`}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.45 * d, delay: 0.035 * i * d }}
              whileTap={reducedMotion ? undefined : { scale: 0.95 }}
            >
              <span className="interest-chip__icon">
                <InterestIcon id={it.id} className="h-7 w-7" />
              </span>
              <span className="interest-chip__label">{it.label}</span>
              {on && <span className="interest-chip__pip" aria-hidden="true" />}
            </m.button>
          );
        })}
      </div>
      <div className="mt-3 font-mono text-[11px] text-white/45" aria-live="polite">
        {selected.length}/{MAX_INTERESTS} frecuencias sintonizadas
      </div>
      <div className="mt-6 flex w-full flex-col-reverse items-center gap-3 sm:w-auto sm:flex-row sm:gap-4">
        <button type="button" className="ecos-ghost-btn whitespace-nowrap" onClick={onBack}>
          ← Cambiar identidad
        </button>
        <button type="button" className="ecos-cta" onClick={onConfirm} disabled={selected.length === 0}>
          <span className="ecos-cta__label">Explorar lo desconocido</span>
        </button>
      </div>
    </m.section>
  );
}
