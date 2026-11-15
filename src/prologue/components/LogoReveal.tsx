import { m } from 'motion/react';
import { useEffect } from 'react';
import { TIMINGS } from '../choreography';
import { EcosLogo } from './EcosLogo';

/**
 * Escena 2b — Tras la oscuridad, el logo de ECOS emerge.
 * Continúa solo tras TIMINGS.logoHold, o antes con clic / Enter / Espacio.
 */
export function LogoReveal({ onDone, reducedMotion }: { onDone: () => void; reducedMotion: boolean }) {
  const d = reducedMotion ? 0 : 1;
  useEffect(() => {
    const id = window.setTimeout(onDone, reducedMotion ? 2600 : TIMINGS.logoHold);
    const key = (e: KeyboardEvent) => {
      if (e.key === 'Enter' || e.key === ' ') onDone();
    };
    window.addEventListener('keydown', key);
    return () => {
      window.clearTimeout(id);
      window.removeEventListener('keydown', key);
    };
  }, [onDone, reducedMotion]);

  return (
    <m.section
      className="absolute inset-0 z-10 flex cursor-pointer flex-col items-center justify-center px-6 text-center"
      onClick={onDone}
      initial={{ opacity: 1 }}
      exit={{ opacity: 0, scale: reducedMotion ? 1 : 1.04, filter: reducedMotion ? 'none' : 'blur(6px)', transition: { duration: 0.9 } }}
      aria-live="polite"
    >
      <m.div
        initial={{ opacity: 0, filter: reducedMotion ? 'blur(0px)' : 'blur(14px)', scale: reducedMotion ? 1 : 0.94 }}
        animate={{ opacity: 1, filter: 'blur(0px)', scale: 1 }}
        transition={{ duration: 2.6 * d + 0.4, delay: 0.5 * d, ease: [0.2, 0.65, 0.2, 1] }}
      >
        <EcosLogo size={1.7} className="logo-reveal__mark" />
      </m.div>
      <m.div
        className="logo-reveal__line mt-6 w-[min(60vw,420px)]"
        initial={{ scaleX: 0, opacity: 0 }}
        animate={{ scaleX: 1, opacity: 1 }}
        transition={{ duration: 1.8 * d + 0.3, delay: 1.6 * d, ease: [0.65, 0, 0.35, 1] }}
        aria-hidden="true"
      />
      <m.p
        className="mt-5 font-mono text-[11px] uppercase tracking-[0.55em] text-[#f3e6d4]/70 sm:text-xs"
        initial={{ opacity: 0, y: reducedMotion ? 0 : 6 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 1.6 * d + 0.3, delay: 2.2 * d }}
      >
        Historias que siguen viajando
      </m.p>
      <m.p
        className="mt-10 max-w-sm text-[11px] font-light leading-relaxed text-white/30"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 1.4 * d + 0.3, delay: 3.2 * d }}
      >
        Ficción narrativa: en ECOS, el horizonte es la puerta a nuestro archivo de memorias.
      </m.p>
    </m.section>
  );
}
