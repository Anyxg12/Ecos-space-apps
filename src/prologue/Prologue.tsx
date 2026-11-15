import { AnimatePresence, m } from 'motion/react';
import { useCallback, useEffect, useRef, useState, type CSSProperties, type ReactNode } from 'react';
import {
  TIMINGS,
  enterDarkness,
  playApproach,
  playHorizonIntro,
  playTransformation,
  previewIdentity,
  revealArchive,
  SCENE,
  cancelPendingChoreography,
  hoverHorizon,
} from './choreography';
import { FirstContact } from './components/FirstContact';
import { HorizonScene } from './components/HorizonScene';
import { LogoReveal } from './components/LogoReveal';
import { HorizonStage } from './components/HorizonStage';
import { IdentitySelect } from './components/IdentitySelect';
import { InterestSelect } from './components/InterestSelect';
import { SoundToggle } from './components/SoundToggle';
import { MotionProvider } from './components/MotionProvider';
import { sound } from './audio/soundEngine';
import { Destination, preloadDestination } from './components/endscreens/Destination';
import type { HorizonController } from './gl/controller';
import { usePrologue } from './hooks/usePrologue';
import { useReducedMotion } from './hooks/useReducedMotion';
import { AGE_GROUPS } from './state/catalog';
import type { ExplorerProfile } from './state/types';
import { themeFor } from './themes/themes';

export interface EcosPrologueProps {
  /** Se llama al terminar la Escena 5 con el perfil (sin datos personales). */
  onComplete: (profile: ExplorerProfile) => void;
  /** Perfil guardado: si existe, «Saltar introducción» va directo al destino. */
  existingProfile?: ExplorerProfile | null;
  /** Sustituye las pantallas finales temporales por los centros reales del producto. */
  renderDestination?: (profile: ExplorerProfile) => ReactNode;
}

/**
 * Orquestador del prólogo «El Horizonte de los Ecos».
 * Estado → state/, colores → themes/, cámara → choreography.ts, píxeles → gl/.
 */
export function EcosPrologue({ onComplete, existingProfile, renderDestination }: EcosPrologueProps) {
  const reducedMotion = useReducedMotion();
  const { state, send, complete } = usePrologue();
  const ctrl = useRef<HorizonController | null>(null);
  const [blackout, setBlackout] = useState(false);
  const [revealProfile, setRevealProfile] = useState<ExplorerProfile | null>(null);
  const phaseRef = useRef(state.phase);
  phaseRef.current = state.phase;

  const onController = useCallback(
    (c: HorizonController) => {
      ctrl.current = c;
      if (phaseRef.current === 'horizon') void playHorizonIntro(c);
      else c.set({ ...SCENE.archive });
    },
    [],
  );

  // Escena 2 — acercamiento
  useEffect(() => {
    if (state.phase !== 'approach' || !ctrl.current) return;
    let cancelled = false;
    const c = ctrl.current;
    sound.reduced = reducedMotion;
    sound.fall(reducedMotion ? 900 : TIMINGS.approachTotal);
    (async () => {
      if (reducedMotion) {
        setBlackout(true);
        await new Promise((r) => setTimeout(r, 900));
      } else {
        await playApproach(c, () => cancelled);
      }
      if (cancelled) return;
      enterDarkness(c);
      setBlackout(false);
      send({ type: 'APPROACH_DONE' });
    })();
    return () => {
      cancelled = true;
      setBlackout(false);
    };
  }, [state.phase, reducedMotion, send]);

  // Escena 4 — el archivo emerge al fondo (o directo si se saltó la intro)
  useEffect(() => {
    if (state.phase !== 'identity' || !ctrl.current) return;
    if (state.skipped) {
      cancelPendingChoreography();
      ctrl.current.set({ ...SCENE.archive });
    }
    else void revealArchive(ctrl.current);
  }, [state.phase, state.skipped]);

  // Vista previa en vivo: el horizonte adopta la paleta de la identidad enfocada
  useEffect(() => {
    if ((state.phase !== 'identity' && state.phase !== 'interests') || !ctrl.current) return;
    void previewIdentity(ctrl.current, state.previewGroup ?? state.ageGroup);
  }, [state.previewGroup, state.ageGroup, state.phase]);

  // Escena 5 — transformación
  useEffect(() => {
    if (state.phase !== 'transform' || !state.ageGroup) return;
    const c = ctrl.current;
    const profile = complete();
    let cancelled = false;
    (async () => {
      if (c) await playTransformation(c, state.ageGroup!);
      if (cancelled || !profile) return;
      setRevealProfile(profile);
      await new Promise((r) => setTimeout(r, reducedMotion ? 300 : TIMINGS.destinationReveal + 100));
      if (cancelled) return;
      c?.pause(); // el destino ya cubre la pantalla: sólo un contexto WebGL sigue dibujando
      send({ type: 'TRANSFORM_DONE' });
      onComplete(profile);
    })();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state.phase]);

  useEffect(() => {
    if (state.phase === 'logo') sound.settle();
  }, [state.phase]);

  const logoDone = useCallback(() => send({ type: 'LOGO_DONE' }), [send]);

  const skip = useCallback(() => {
    if (existingProfile) onComplete(existingProfile);
    else send({ type: 'SKIP' });
  }, [existingProfile, onComplete, send]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && (phaseRef.current === 'horizon' || phaseRef.current === 'approach' || phaseRef.current === 'logo' || phaseRef.current === 'contact')) skip();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [skip]);

  const theme = themeFor(state.previewGroup ?? state.ageGroup);
  const style = { '--accent': theme.ui.accent, '--accent-soft': theme.ui.accentSoft, '--theme-font': theme.ui.font } as CSSProperties;
  const groupLabel = AGE_GROUPS.find((g) => g.id === state.ageGroup)?.label ?? '';

  return (
    <MotionProvider>
    <div className="ecos-prologue fixed inset-0 overflow-hidden bg-black text-white" style={style} data-phase={state.phase}>
      <HorizonStage reducedMotion={reducedMotion} onController={onController} />
      <div className="pointer-events-none absolute inset-0 z-[5] ecos-letterbox" aria-hidden="true" data-active={state.phase === 'approach'} />

      <AnimatePresence mode="wait">
        {state.phase === 'horizon' && (
          <HorizonScene
            key="horizon"
            reducedMotion={reducedMotion}
            onCross={() => send({ type: 'CROSS_HORIZON' })}
            onSkip={skip}
            onHover={(on) => ctrl.current && phaseRef.current === 'horizon' && void hoverHorizon(ctrl.current, on)}
          />
        )}
        {state.phase === 'logo' && <LogoReveal key="logo" reducedMotion={reducedMotion} onDone={logoDone} />}
        {state.phase === 'contact' && <FirstContact key="contact" reducedMotion={reducedMotion} onAnswer={() => send({ type: 'ANSWER_SIGNAL' })} />}
        {state.phase === 'identity' && (
          <IdentitySelect
            key="identity"
            reducedMotion={reducedMotion}
            selected={state.ageGroup}
            onPreview={(g) => send({ type: 'PREVIEW_GROUP', group: g })}
            onChoose={(g) => {
              preloadDestination(g);
              send({ type: 'CHOOSE_GROUP', group: g });
            }}
          />
        )}
        {state.phase === 'interests' && (
          <InterestSelect
            key="interests"
            reducedMotion={reducedMotion}
            groupLabel={groupLabel}
            selected={state.interests}
            onToggle={(id) => send({ type: 'TOGGLE_INTEREST', id })}
            onBack={() => send({ type: 'BACK' })}
            onConfirm={() => send({ type: 'CONFIRM' })}
          />
        )}
      </AnimatePresence>

      {state.phase === 'approach' && (
        <p className="sr-only" aria-live="assertive">
          Atravesando el horizonte…
        </p>
      )}

      <m.div
        className="pointer-events-none absolute inset-0 z-20 bg-black"
        initial={false}
        animate={{ opacity: blackout ? 1 : 0 }}
        transition={{ duration: 0.8 }}
        aria-hidden="true"
      />

      {revealProfile && (
        <m.div
          className="absolute inset-0 z-40 overflow-y-auto"
          initial={reducedMotion ? { opacity: 0 } : { clipPath: 'circle(0% at 50% 50%)', opacity: 1 }}
          animate={reducedMotion ? { opacity: 1 } : { clipPath: 'circle(150% at 50% 50%)' }}
          transition={{ duration: reducedMotion ? 0.3 : TIMINGS.destinationReveal / 1000, ease: [0.65, 0, 0.35, 1] }}
        >
          {renderDestination ? (
            renderDestination(revealProfile)
          ) : (
            <Destination profile={revealProfile} reducedMotion={reducedMotion} onReplay={() => undefined} onReset={() => undefined} />
          )}
        </m.div>
      )}

      {state.phase !== 'transform' && state.phase !== 'done' && <SoundToggle />}
    </div>
    </MotionProvider>
  );
}
