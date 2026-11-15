import { m } from 'motion/react';
import { AGE_GROUPS } from '../state/catalog';
import type { AgeGroup } from '../state/types';
import { IdentityPreview } from './IdentityPreview';

interface Props {
  onPreview: (g: AgeGroup | null) => void;
  onChoose: (g: AgeGroup) => void;
  selected: AgeGroup | null;
  reducedMotion: boolean;
}

/** Escena 4a — Selección de identidad. Al pasar el cursor, el horizonte de fondo adopta la paleta. */
export function IdentitySelect({ onPreview, onChoose, selected, reducedMotion }: Props) {
  const d = reducedMotion ? 0 : 1;
  return (
    <m.section
      className="absolute inset-0 z-10 flex flex-col items-center overflow-y-auto px-5 py-10 sm:justify-center"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0, transition: { duration: 0.4 } }}
      aria-labelledby="ecos-identity-title"
    >
      <p className="font-mono text-[10px] uppercase tracking-[0.45em] text-[color:var(--accent)]">Paso 1 de 2 · Identidad del explorador</p>
      <h2 id="ecos-identity-title" className="mt-3 text-center text-2xl font-extralight text-white sm:text-3xl">
        ¿Cómo quieres vivir el archivo?
      </h2>
      <p className="mt-2 max-w-md text-center text-sm font-light text-white/55">Elige tu rango de edad. Cada uno abre un universo distinto.</p>
      <div className="mt-8 grid w-full max-w-5xl grid-cols-1 gap-4 sm:grid-cols-3" role="radiogroup" aria-label="Rango de edad">
        {AGE_GROUPS.map((g, i) => (
          <m.button
            key={g.id}
            type="button"
            role="radio"
            aria-checked={selected === g.id}
            className={`identity-card identity-card--${g.id}`}
            onPointerEnter={() => onPreview(g.id)}
            onPointerLeave={() => onPreview(null)}
            onFocus={() => onPreview(g.id)}
            onBlur={() => onPreview(null)}
            onClick={() => onChoose(g.id)}
            initial={{ opacity: 0, y: 18 * d }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7 * d, delay: 0.15 * i * d, ease: 'easeOut' }}
            whileHover={reducedMotion ? undefined : { y: -4 }}
          >
            <div className="identity-card__preview">
              <IdentityPreview group={g.id} />
            </div>
            <div className="flex items-baseline justify-between px-4 pt-4">
              <span className="identity-card__name">{g.label}</span>
              <span className="font-mono text-[11px] text-white/50">{g.range}</span>
            </div>
            <p className="px-4 pb-4 pt-1 text-left text-[13px] font-light leading-snug text-white/60">{g.tagline}</p>
            <span className="identity-card__dest">Destino · {g.destination}</span>
          </m.button>
        ))}
      </div>
      <p className="mt-6 text-center text-[11px] text-white/35">Sin nombres, correos ni ubicación: sólo lo necesario para adaptar tu aventura.</p>
    </m.section>
  );
}
