import { m } from 'motion/react';
import { useEffect, useState } from 'react';
import { TIMINGS } from '../choreography';

interface Props {
  onCross: () => void;
  onSkip: () => void;
  onHover: (on: boolean) => void;
  reducedMotion: boolean;
}

/**
 * Escena 1 — El horizonte. Sin texto, sin logo, sin botones visibles:
 * el propio agujero negro es el objetivo (clic, toque, Enter o Espacio).
 * Sólo una pista casi invisible aparece si el usuario no actúa.
 */
export function HorizonScene({ onCross, onSkip, onHover, reducedMotion }: Props) {
  const [hint, setHint] = useState(false);
  useEffect(() => {
    const id = window.setTimeout(() => setHint(true), reducedMotion ? 800 : TIMINGS.hintDelay);
    return () => window.clearTimeout(id);
  }, [reducedMotion]);

  return (
    <m.section
      className="absolute inset-0 z-10"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0, transition: { duration: 0.4 } }}
      transition={{ duration: 0.6 }}
      aria-label="ECOS · El horizonte"
    >
      <h1 className="sr-only">ECOS — Historias que siguen viajando</h1>

      {/* objetivo: el agujero negro (centro de la pantalla) */}
      <button
        type="button"
        className="horizon-target"
        data-hint={hint}
        onClick={onCross}
        onPointerEnter={() => onHover(true)}
        onPointerLeave={() => onHover(false)}
        onFocus={() => onHover(true)}
        onBlur={() => onHover(false)}
        aria-label="Atravesar el horizonte"
        autoFocus
      >
        <span className="horizon-target__ring" aria-hidden="true" />
      </button>

      <m.p
        className="pointer-events-none absolute inset-x-0 bottom-[max(2.2rem,env(safe-area-inset-bottom))] text-center font-mono text-[10px] uppercase tracking-[0.6em] text-white/40"
        initial={{ opacity: 0 }}
        animate={{ opacity: hint ? 1 : 0 }}
        transition={{ duration: 2.4 }}
        aria-hidden="true"
      >
        Toca el horizonte
      </m.p>

      <button type="button" onClick={onSkip} className="horizon-skip">
        Saltar introducción
      </button>
    </m.section>
  );
}
