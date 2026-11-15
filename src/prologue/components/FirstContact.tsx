import { m } from 'motion/react';
import { useEffect, useState } from 'react';
import { sound } from '../audio/soundEngine';
import { SignalCore } from './SignalCore';
import { Typewriter } from './Typewriter';

const LINE1 = 'Transmisión entrante · Archivo de ECOS';
const LINE2 = 'Señal detectada. Un nuevo explorador ha llegado.';

/**
 * Escena 3 — Primer contacto.
 * Maquetación fija: el núcleo y todos los textos ocupan su espacio desde el inicio
 * (sólo cambian de opacidad), así el núcleo no «resbala» mientras se escribe.
 */
export function FirstContact({ onAnswer, reducedMotion }: { onAnswer: () => void; reducedMotion: boolean }) {
  const [step, setStep] = useState(reducedMotion ? 3 : 0);
  const d = reducedMotion ? 0 : 1;
  const [chimed, setChimed] = useState(false);
  useEffect(() => {
    if (step === 0) {
      const id = window.setTimeout(() => setStep(1), 1600);
      return () => window.clearTimeout(id);
    }
  }, [step]);
  useEffect(() => {
    if (!chimed && step >= 2) {
      setChimed(true);
      sound.reduced = reducedMotion;
      sound.signal();
    }
  }, [step, chimed, reducedMotion]);
  const all = step >= 3;
  return (
    <m.section
      className="absolute inset-0 z-10 flex flex-col items-center justify-center px-5 text-center"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0, transition: { duration: 0.6 } }}
      aria-live="polite"
    >
      <m.div
        className="shrink-0"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 1.4 * d, delay: 0.3 * d, ease: 'easeOut' }}
      >
        <SignalCore state={step === 1 || step === 2 ? 'speaking' : 'idle'} size={128} reducedMotion={reducedMotion} />
      </m.div>

      <div className="mt-8 w-full max-w-xl">
        <p className="font-mono text-[10px] uppercase tracking-[0.32em] text-[color:var(--accent)] sm:text-[11px] sm:tracking-[0.4em]">
          <Typewriter text={LINE1} speed={26} start={step >= 1} instant={reducedMotion || all} onDone={() => setStep((s) => Math.max(s, 2))} />
        </p>
        <h2 className="mx-auto mt-4 max-w-[19ch] text-balance text-[1.6rem] font-extralight leading-snug text-white sm:max-w-none sm:text-3xl">
          <Typewriter text={LINE2} speed={42} delay={300} start={step >= 2} instant={reducedMotion || all} onDone={() => setStep(3)} />
        </h2>
        <m.p
          className="mx-auto mt-5 max-w-md text-sm font-light leading-relaxed text-white/60"
          initial={false}
          animate={{ opacity: all ? 1 : 0 }}
          transition={{ duration: 0.9 * d }}
        >
          Bienvenido a ECOS. Aquí guardamos las historias de los exploradores robóticos de Marte.
          Antes de abrir el archivo, necesito saber quién eres como explorador.
        </m.p>
      </div>

      <div className="mt-7 flex h-14 items-center justify-center">
        {all ? (
          <m.button
            type="button"
            className="ecos-cta"
            onClick={onAnswer}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.8 * d, delay: 0.3 * d }}
            autoFocus
          >
            <span className="ecos-cta__label">Responder a la señal</span>
          </m.button>
        ) : (
          <button type="button" className="ecos-ghost-btn" onClick={() => setStep(3)}>
            Mostrar todo
          </button>
        )}
      </div>
    </m.section>
  );
}
