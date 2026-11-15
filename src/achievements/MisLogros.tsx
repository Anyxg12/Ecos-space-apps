import { AnimatePresence, LazyMotion, domAnimation } from 'motion/react';
import { lazy, Suspense, useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState, type CSSProperties, type KeyboardEvent } from 'react';
import defaultEarthTexture from './assets/earth-blue-marble-2048.jpg';
import './achievements.css';
import type { Achievement, MisLogrosProps } from './types';
import { StarField } from './components/StarField';
import { BadgeGlyph } from './components/Glyphs';
import { AchievementCard } from './components/AchievementCard';
import { EcosLogo } from './components/EcosLogo';
import { sound } from './sound';
import { ShareView } from './components/ShareView';
import { usePrefersReducedMotion } from './usePrefersReducedMotion';
import { layoutStars, nextInDirection } from './layout';
import { SKY_TIMELINE, poseAt, fxAt, WORLDS_ON_SCREEN } from './sky/timeline';

type Phase = 'ground' | 'rising' | 'space';
const SkyCanvas = lazy(() => import('./sky/SkyCanvas'));
const hasWebGL = () => {
  try {
    const c = document.createElement('canvas');
    return !!(c.getContext('webgl2') || c.getContext('webgl'));
  } catch {
    return false;
  }
};

/** Tiempos de la secuencia de entrada (segundos). */
export const INTRO_TIMINGS = SKY_TIMELINE;
const STAR_TINTS = ['#dfe8ff', '#fff3e2', '#ffe2bf', '#e9efff', '#fff8ef', '#d6e4ff'];
const LINE_GAP = 13;

const defaultFormat = (iso: string) => {
  const d = new Date(`${iso}T12:00:00`);
  return Number.isNaN(d.getTime()) ? iso : d.toLocaleDateString('es', { day: 'numeric', month: 'long', year: 'numeric' });
};

const phaseAt = (t: number): Phase => (t < SKY_TIMELINE.riseStart ? 'ground' : t < SKY_TIMELINE.spaceAt ? 'rising' : 'space');
const fmtAlt = (km: number) => (km < 1 ? `${Math.round(km * 1000)} m` : `${km < 10 ? km.toFixed(1) : Math.round(km).toLocaleString('es')} km`);
/** Reloj de misión: T− durante la cuenta atrás, T+ tras el despegue. */
const fmtClock = (t: number) => {
  const d = t - SKY_TIMELINE.riseStart;
  const s = Math.abs(d);
  return `T${d < 0 ? '−' : '+'} 00:${String(Math.floor(s + (d < 0 ? 0.999 : 0))).padStart(2, '0')}`;
};
/** Rótulo del momento del viaje (sin datos: sólo acompaña a la imagen). */
function stageText(t: number, alt: number): { key: string; text: string; big?: boolean } | null {
  const T = SKY_TIMELINE;
  if (t < T.countdown) return { key: 'sunset', text: 'Atardecer en la Tierra' };
  if (t < T.riseStart) {
    const n = 3 - Math.min(2, Math.floor((t - T.countdown) / ((T.riseStart - T.countdown) / 3)));
    return { key: `c${n}`, text: String(n), big: true };
  }
  if (t < T.riseStart + 1.3) return { key: 'lift', text: 'Despegue' };
  if (fxAt(t).fog > 0.2) return { key: 'clouds', text: 'Atravesando las nubes' };
  if (alt >= 100 && t < T.spaceAt) return { key: 'beyond', text: 'Más allá de la atmósfera' };
  return null;
}
const SPACE_LIFT = { countdown: SKY_TIMELINE.countdown, liftoff: SKY_TIMELINE.riseStart, clouds: SKY_TIMELINE.riseStart + 2.2, space: SKY_TIMELINE.spaceAt };

/**
 * «Mis logros: Constelación personal» — versión única, realista y cinematográfica.
 * A ras de suelo al atardecer → la cámara mira hacia arriba → asciende atravesando la atmósfera →
 * en órbita, cada estrella desbloqueada es un logro.
 */
export function MisLogros({
  achievements,
  badges = [],
  archiveCards = [],
  defaultSound = false,
  webgl = true,
  earthTextureUrl = defaultEarthTexture,
  links,
  theme,
  demo = false,
  title = 'Mis logros',
  skipIntro = false,
  reducedMotion: forceReduced,
  newlyUnlocked,
  onSelect,
  onClose,
  onIntroEnd,
  onExit,
  exitLabel = 'Volver',
  formatDate = defaultFormat,
  className = '',
}: MisLogrosProps) {
  const prefersReduced = usePrefersReducedMotion();
  const reduced = !!forceReduced || prefersReduced;
  const qaT = useMemo(() => {
    const v = new URLSearchParams(window.location.search).get('t');
    return v != null && v !== '' && !Number.isNaN(Number(v)) ? Number(v) : null;
  }, []);
  const [glFailed, setGlFailed] = useState(false);
  const useGL = useMemo(() => webgl && hasWebGL(), [webgl]) && !glFailed;
  const [ready, setReady] = useState(!useGL);
  const instantStart = skipIntro || reduced;

  // reloj único de la secuencia (GL, CSS y fases leen el mismo tiempo)
  const clock = useRef({ start: 0, ready: !useGL, frozen: instantStart ? SKY_TIMELINE.end : qaT });
  const getTime = useCallback(() => {
    const c = clock.current;
    if (c.frozen != null) return c.frozen;
    if (!c.ready) return 0;
    return (performance.now() - c.start) / 1000;
  }, []);
  const [kickKey, setKickKey] = useState(0);
  const [phase, setPhase] = useState<Phase>(() => phaseAt(getTime()));
  const [alt, setAlt] = useState(0.002);
  const [tNow, setTNow] = useState(0);
  const [shakeAmp, setShakeAmp] = useState(0);
  const [flash, setFlash] = useState(false);

  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [activeId, setActiveId] = useState<string | null>(() => achievements.find((a) => a.status === 'unlocked')?.id ?? achievements[0]?.id ?? null);
  const rootRef = useRef<HTMLDivElement>(null);
  const starRefs = useRef(new Map<string, HTMLButtonElement>());
  const [box, setBox] = useState({ w: 1280, h: 720 });
  const introEnded = useRef(false);
  const constRef = useRef<HTMLDivElement>(null);
  const [cbox, setCbox] = useState({ w: 1000, h: 400 });
  const [igniting, setIgniting] = useState<Set<string>>(new Set());
  const [announce, setAnnounce] = useState('');
  const [shareOpen, setShareOpen] = useState(false);
  const prevStatus = useRef<Map<string, string> | null>(null);
  // interruptor global (el mismo en todas las pantallas de ECOS); apagado por defecto
  const [soundOn, setSoundOn] = useState(sound.enabled);
  void defaultSound; // compatibilidad: el sonido lo decide siempre el usuario (interruptor global)
  useEffect(() => {
    const off = sound.subscribe(setSoundOn);
    return () => {
      off();
      sound.stopLaunch();
    };
  }, []);
  useEffect(() => {
    sound.reduced = reduced;
  }, [reduced]);

  useLayoutEffect(() => {
    const el = rootRef.current;
    if (!el) return;
    const ro = new ResizeObserver(([e]) => setBox({ w: e.contentRect.width, h: e.contentRect.height }));
    ro.observe(el);
    return () => ro.disconnect();
  }, []);
  useLayoutEffect(() => {
    const el = constRef.current;
    if (!el) return;
    const ro = new ResizeObserver(([e]) => setCbox({ w: Math.max(1, e.contentRect.width), h: Math.max(1, e.contentRect.height) }));
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const markReady = useCallback(() => {
    if (clock.current.ready) return;
    clock.current.ready = true;
    clock.current.start = performance.now();
    setReady(true);
    if (clock.current.frozen == null) sound.launch(SPACE_LIFT);
  }, []);
  // sin GL o si la textura tarda: el reloj arranca igual (máx. 4 s de espera)
  useEffect(() => {
    if (ready) return;
    const t = window.setTimeout(() => {
      setGlFailed(true);
      markReady();
    }, 4000);
    return () => clearTimeout(t);
  }, [ready, markReady]);
  useEffect(() => {
    if (!useGL) markReady();
  }, [useGL, markReady]);

  const endIntro = useCallback(() => {
    if (introEnded.current) return;
    introEnded.current = true;
    onIntroEnd?.();
  }, [onIntroEnd]);

  // fases + altímetro (10 Hz; el lienzo GL se anima por su cuenta a 60 Hz)
  useEffect(() => {
    let id = 0;
    const tick = () => {
      const t = getTime();
      setPhase(phaseAt(t));
      const tc = Math.min(t, SKY_TIMELINE.end);
      setAlt(poseAt(tc, 16 / 9).alt);
      setTNow(tc);
      setShakeAmp(fxAt(tc).shake);
      if (t >= SKY_TIMELINE.end) {
        endIntro();
        if (clock.current.frozen == null || clock.current.frozen >= SKY_TIMELINE.end) return;
      }
      id = window.setTimeout(tick, 50);
    };
    tick();
    return () => clearTimeout(id);
  }, [getTime, endIntro, kickKey]);

  const skip = useCallback(() => {
    sound.stopLaunch();
    clock.current.frozen = null;
    clock.current.ready = true;
    clock.current.start = performance.now() - SKY_TIMELINE.end * 1000;
    setFlash(true);
    window.setTimeout(() => setFlash(false), 700);
    setKickKey((k) => k + 1);
  }, []);

  // QA: congelar el viaje en un instante (sólo herramientas de prueba)
  useEffect(() => {
    (window as unknown as { __ecosLogros?: unknown }).__ecosLogros = {
      freeze: (t: number | null) => {
        clock.current.frozen = t;
        if (t == null) clock.current.start = performance.now();
        setKickKey((k) => k + 1);
      },
    };
  }, []);

  // logros recién desbloqueados → la estrella se enciende y traza su línea
  const igniteNow = useCallback(
    (list: Achievement[]) => {
      if (!list.length) return;
      setIgniting(new Set(list.map((a) => a.id)));
      setAnnounce(`Nuevo logro desbloqueado: ${list.map((a) => a.title).join(', ')}`);
      sound.chime(true);
      window.setTimeout(() => setIgniting(new Set()), 2800);
    },
    [reduced],
  );
  useEffect(() => {
    const now = new Map(achievements.map((a) => [a.id, a.status]));
    const prev = prevStatus.current;
    prevStatus.current = now;
    if (!prev) return;
    igniteNow(achievements.filter((a) => a.status === 'unlocked' && prev.get(a.id) === 'locked'));
  }, [achievements, igniteNow]);
  const prevPhase = useRef(phase);
  useEffect(() => {
    if (prevPhase.current === 'rising' && phase === 'space') sound.reveal();
    prevPhase.current = phase;
  }, [phase]);
  // desbloqueados fuera de esta vista (p. ej. en Marte): se encienden al llegar al espacio
  const pendingNew = useRef(newlyUnlocked ?? []);
  useEffect(() => {
    if (phase !== 'space' || !pendingNew.current.length) return;
    const ids = pendingNew.current;
    pendingNew.current = [];
    const t = window.setTimeout(() => igniteNow(achievements.filter((a) => ids.includes(a.id) && a.status === 'unlocked')), reduced ? 300 : 900);
    return () => clearTimeout(t);
  }, [phase, achievements, igniteNow, reduced]);

  const portrait = box.w / Math.max(1, box.h) < 0.8;
  const compact = box.w < 720;
  const placed = useMemo(() => layoutStars(achievements, portrait), [achievements, portrait]);
  const byId = useMemo(() => new Map(placed.map((p) => [p.a.id, p])), [placed]);
  const edges = useMemo(() => {
    const L = links ?? achievements.slice(1).map((a, i) => ({ from: achievements[i].id, to: a.id }));
    return L.map((l) => ({ ...l, p: byId.get(l.from), q: byId.get(l.to) })).filter((e) => e.p && e.q);
  }, [links, achievements, byId]);

  const unlocked = achievements.filter((a) => a.status === 'unlocked').length;
  const selected = achievements.find((a) => a.id === selectedId) ?? null;
  const badgeFor = (a: Achievement) => badges.find((b) => b.id === a.badgeId || b.achievementId === a.id);
  const isUnlocked = (id: string) => achievements.find((a) => a.id === id)?.status === 'unlocked';
  const earnedBadges = badges.filter((b) => isUnlocked(b.achievementId));
  const earnedArchive = archiveCards.filter((c) => isUnlocked(c.achievementId));

  const open = (a: Achievement) => {
    setSelectedId(a.id);
    setActiveId(a.id);
    sound.cardOpen();
    sound.chime(a.status === 'unlocked');
    onSelect?.(a);
  };
  const close = useCallback(() => {
    if (!selectedId) return;
    const id = selectedId;
    setSelectedId(null);
    onClose?.();
    requestAnimationFrame(() => starRefs.current.get(id)?.focus({ preventScroll: true }));
  }, [selectedId, onClose]);

  useEffect(() => {
    const k = (e: globalThis.KeyboardEvent) => {
      if (e.key !== 'Escape') return;
      if (shareOpen) setShareOpen(false);
      else if (selectedId) close();
      else if (phase !== 'space') skip();
    };
    window.addEventListener('keydown', k);
    return () => window.removeEventListener('keydown', k);
  }, [selectedId, close, phase, skip, shareOpen]);

  const onStarKey = (e: KeyboardEvent<HTMLButtonElement>, a: Achievement) => {
    const dir = { ArrowLeft: 'left', ArrowRight: 'right', ArrowUp: 'up', ArrowDown: 'down' }[e.key] as 'left' | 'right' | 'up' | 'down' | undefined;
    let next: string | null = null;
    if (dir) next = nextInDirection(placed, a.id, dir);
    else if (e.key === 'Home') next = placed[0]?.a.id ?? null;
    else if (e.key === 'End') next = placed[placed.length - 1]?.a.id ?? null;
    else return;
    e.preventDefault();
    if (next) {
      setActiveId(next);
      starRefs.current.get(next)?.focus();
      if (selectedId) open(achievements.find((x) => x.id === next)!);
    }
  };

  const reveal = phase === 'space';

  // Etiquetas sin solaparse (sobre todo en móvil): se ocultan las que chocarían con otra etiqueta ya visible,
  // con los nombres de los mundos, el encabezado o el crédito. Prioridad: seleccionada > desbloqueadas > bloqueadas.
  // En vertical, las estrellas bloqueadas sólo muestran su nombre al tocarlas/enfocarlas.
  useLayoutEffect(() => {
    const root = rootRef.current;
    if (!root || !reveal) return;
    const fit = () => {
      const pad = 3;
      const hit = (a: DOMRect, b: DOMRect) => a.left < b.right + pad && b.left < a.right + pad && a.top < b.bottom + pad && b.top < a.bottom + pad;
      const kept: DOMRect[] = [...root.querySelectorAll<HTMLElement>('.ml-world__label, .ml-header, .ml-credit, .ml-badges')].map((e) => e.getBoundingClientRect()).filter((r) => r.width > 0);
      const stars = [...root.querySelectorAll<HTMLElement>('.ml-star')];
      const rank = (el: HTMLElement) => (el.classList.contains('is-selected') ? 0 : el.classList.contains('is-unlocked') ? 1 : 2);
      stars.sort((a, b) => rank(a) - rank(b));
      for (const st of stars) {
        const lab = st.querySelector<HTMLElement>('.ml-star__label');
        if (!lab) continue;
        st.classList.remove('label-off');
        if (rank(st) === 0) {
          kept.push(lab.getBoundingClientRect());
          continue;
        }
        if (portrait && rank(st) === 2) {
          st.classList.add('label-off');
          continue;
        }
        const r = lab.getBoundingClientRect();
        const outside = r.left < 2 || r.right > window.innerWidth - 2;
        if (outside || kept.some((k) => hit(r, k))) st.classList.add('label-off');
        else kept.push(r);
      }
    };
    fit();
    const t = window.setTimeout(fit, 2200); // tras la animación de entrada (mundos y crédito)
    return () => window.clearTimeout(t);
  }, [reveal, portrait, box.w, box.h, placed, selectedId]);
  const instant = instantStart && !reduced;
  const stage = reduced || reveal ? null : stageText(tNow, alt);
  return (
    <LazyMotion features={domAnimation} strict>
      <div
        ref={rootRef}
        className={`ml-root ${selected && !compact ? 'has-card' : ''} ${instant ? 'ml-instant' : ''} ${reduced ? 'ml-reduced' : ''} ${flash ? 'ml-flash' : ''} ${className}`}
        data-phase={phase}
        data-gl={useGL ? 'gl' : 'css'}
        data-theme={theme}
        data-ready={ready}
        style={{ '--ml-shake': reduced ? 0 : shakeAmp } as CSSProperties}
        onClick={() => selectedId && close()}
      >
        {useGL ? (
          <div className="ml-gl-host">
            <Suspense fallback={null}>
              <SkyCanvas
                textureUrl={earthTextureUrl}
                getTime={getTime}
                kickKey={kickKey}
                reduced={reduced}
                onReady={markReady}
                onError={() => {
                  setGlFailed(true);
                  markReady();
                }}
              />
            </Suspense>
          </div>
        ) : (
          <div className="ml-fb" aria-hidden="true">
            <div className="ml-fb__space">
              <StarField count={compact ? 160 : 260} />
              <div className="ml-fb__mw" />
              <div className="ml-fb__earth" />
            </div>
            <div className="ml-fb__ground">
              <svg className="ml-fb__ridges" viewBox="0 0 1200 300" preserveAspectRatio="none">
                <path d="M0 150 L80 120 L150 140 L230 90 L300 125 L380 80 L470 130 L560 95 L640 135 L730 70 L820 120 L900 100 L980 140 L1080 95 L1200 130 V300 H0Z" fill="#1a2133" />
                <path d="M0 200 L90 170 L170 190 L260 150 L350 185 L450 160 L540 195 L640 165 L740 190 L840 150 L940 185 L1040 165 L1200 190 V300 H0Z" fill="#0c111c" />
                <path d="M0 250 L120 228 L240 245 L380 222 L520 248 L660 230 L800 250 L940 226 L1080 246 L1200 232 V300 H0Z" fill="#05070b" />
              </svg>
            </div>
          </div>
        )}

        <div className="ml-vignette" aria-hidden="true" />

        <div className="ml-intro" aria-hidden="true">
          {stage && (
            <p key={stage.key} className={`ml-intro__line is-on ${stage.big ? 'is-count' : ''}`}>
              {stage.text}
            </p>
          )}
        </div>
        {!reveal && !reduced && (
          <div className="ml-hud" aria-hidden="true">
            <p className="ml-alt">
              <span>Altitud</span> {fmtAlt(alt)}
            </p>
            <p className="ml-alt ml-alt--clock">{fmtClock(tNow)}</p>
            <i className="ml-hud__bar" style={{ transform: `scaleX(${Math.min(1, Math.log(1 + alt) / Math.log(1 + 1300))})` }} />
          </div>
        )}
        {reveal && (
          <div className="ml-worlds" aria-hidden="true">
            {(['moon', 'mars'] as const).map((w) => {
              const [x, y] = (portrait ? WORLDS_ON_SCREEN.portrait : WORLDS_ON_SCREEN.landscape)[w];
              return (
                <span key={w} className={`ml-world ml-world--${w} ${x > 0.5 ? 'is-right' : ''}`} style={{ left: `${x * 100}%`, top: `${y * 100}%` }}>
                  {!useGL && <i className="ml-world__body" />}
                  <span className="ml-world__label">
                    {w === 'moon' ? 'La Luna' : 'Marte'}
                    {w === 'mars' && <small>Spirit sigue allí, en el cráter Gusev</small>}
                  </span>
                </span>
              );
            })}
          </div>
        )}

        <div className="ml-topbar">
          <div className="ml-topbar__left">
            {onExit && (
              <button
                type="button"
                className="ml-btn ml-exit"
                aria-label={exitLabel}
                onClick={(e) => {
                  e.stopPropagation();
                  onExit();
                }}
              >
                <span aria-hidden="true">←</span> <span className="ml-exit__txt">{exitLabel}</span>
              </button>
            )}
            <EcosLogo size={0.36} className="ml-logo" />
          </div>
          <div className="ml-topbar__right">
            <button
              type="button"
              className="ml-btn ml-share-btn"
              tabIndex={reveal ? 0 : -1}
              disabled={!reveal}
              onClick={(e) => {
                e.stopPropagation();
                setSelectedId(null);
                setShareOpen(true);
              }}
            >
              Mi constelación
            </button>
            <button
              type="button"
              className="ml-btn ml-sound"
              aria-pressed={soundOn}
              aria-label="Sonido"
              title={soundOn ? 'Sonido activado' : 'Sonido desactivado'}
              onClick={(e) => {
                e.stopPropagation();
                const on = !sound.enabled;
                sound.setEnabled(on);
                // si se activa a mitad del despegue, el retumbo entra sincronizado con la imagen
                const t = getTime();
                if (on && clock.current.ready && clock.current.frozen == null && t < SKY_TIMELINE.spaceAt) sound.launch(SPACE_LIFT, t);
              }}
            >
              <svg viewBox="0 0 20 20" width="14" height="14" aria-hidden="true">
                <path d="M3 8h3l4-3v10l-4-3H3z" fill="currentColor" />
                {soundOn ? <path d="M13 7a4 4 0 0 1 0 6M15 5a7 7 0 0 1 0 10" stroke="currentColor" strokeWidth="1.5" fill="none" strokeLinecap="round" /> : <path d="M13 7l5 6M18 7l-5 6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />}
              </svg>
              <span>{soundOn ? 'Sonido' : 'Sin sonido'}</span>
            </button>
          </div>
        </div>

        <header className="ml-header">
          <p className="ml-header__kicker">Constelación personal</p>
          <h1 className="ml-header__title">{title}</h1>
          <p className="ml-header__count">
            <strong>{unlocked}</strong> de {achievements.length} logros desbloqueados
          </p>
          {demo && <span className="ml-demo-tag">Datos de demostración</span>}
        </header>

        <div
          ref={constRef}
          className="ml-constellation"
          role="group"
          aria-label={`Constelación de logros: ${unlocked} de ${achievements.length} desbloqueados. Usa las flechas para moverte y Enter para abrir.`}
        >
          <svg className="ml-lines" viewBox={`0 0 ${cbox.w} ${cbox.h}`} aria-hidden="true">
            {edges.map((e, i) => {
              const lockedEdge = e.p!.a.status === 'locked' || e.q!.a.status === 'locked';
              const fresh = igniting.has(e.to) || igniting.has(e.from);
              const x1 = e.p!.x * cbox.w, y1 = e.p!.y * cbox.h, x2 = e.q!.x * cbox.w, y2 = e.q!.y * cbox.h;
              const len = Math.hypot(x2 - x1, y2 - y1) || 1;
              const ux = (x2 - x1) / len, uy = (y2 - y1) / len;
              const g = Math.min(LINE_GAP, len / 3);
              const delay = fresh ? 0.5 : 0.4 + i * 0.22;
              return (
                <line
                  key={`${e.from}-${e.to}-${lockedEdge ? 'l' : 'u'}`}
                  x1={x1 + ux * g}
                  y1={y1 + uy * g}
                  x2={x2 - ux * g}
                  y2={y2 - uy * g}
                  pathLength={lockedEdge ? undefined : 1}
                  className={`ml-line ${lockedEdge ? 'is-locked' : ''} ${fresh ? 'is-fresh' : ''}`}
                  style={{ animationDelay: `${delay}s` }}
                />
              );
            })}
          </svg>
          {placed.map(({ a, x, y }, i) => {
            const locked = a.status === 'locked';
            const isSel = a.id === selectedId;
            const tint = STAR_TINTS[i % STAR_TINTS.length];
            return (
              <button
                key={`${a.id}-${a.status}`}
                ref={(el) => {
                  if (el) starRefs.current.set(a.id, el);
                  else starRefs.current.delete(a.id);
                }}
                type="button"
                data-sfx="custom"
                className={`ml-star ${locked ? 'is-locked' : 'is-unlocked'} ${igniting.has(a.id) ? 'is-igniting' : ''} ${isSel ? 'is-selected' : ''} ${y > 0.78 && !portrait ? 'label-up' : ''}`}
                style={{ left: `${x * 100}%`, top: `${y * 100}%`, '--ml-mag': a.magnitude ?? 1, '--ml-tint': tint, animationDelay: `${0.15 + i * 0.16}s` } as CSSProperties}
                tabIndex={reveal && a.id === activeId ? 0 : -1}
                disabled={!reveal}
                aria-label={`${a.title}: ${locked ? (a.future ? 'bloqueado, meta futura' : 'bloqueado') : 'desbloqueado'}`}
                aria-haspopup="dialog"
                aria-expanded={isSel}
                onClick={(e) => {
                  e.stopPropagation();
                  if (isSel) close();
                  else open(a);
                }}
                onFocus={() => setActiveId(a.id)}
                onKeyDown={(e) => onStarKey(e, a)}
              >
                <span className="ml-star__visual" aria-hidden="true">
                  <span className="ml-star__halo" />
                  <span className="ml-star__spike" />
                  <span className="ml-star__spike is-v" />
                  <span className="ml-star__core" />
                  {locked && <span className="ml-star__ring" />}
                  <span className="ml-star__burst" />
                </span>
                <span className="ml-star__label" aria-hidden="true">
                  {locked && (
                    <svg viewBox="0 0 12 14" width="9" height="10" aria-hidden="true">
                      <rect x="1.5" y="6" width="9" height="7" rx="1.5" fill="currentColor" />
                      <path d="M3.5 6V4.5a2.5 2.5 0 0 1 5 0V6" fill="none" stroke="currentColor" strokeWidth="1.5" />
                    </svg>
                  )}
                  {a.title}
                  {locked && <small>{a.future ? 'Meta futura' : 'Bloqueado'}</small>}
                </span>
              </button>
            );
          })}
        </div>

        {(earnedBadges.length > 0 || earnedArchive.length > 0) && (
          <div className="ml-badges" role="group" aria-label="Insignias y fichas">
            {earnedBadges.map((b) => (
              <button
                key={b.id}
                type="button"
                className="ml-badge"
                tabIndex={reveal ? 0 : -1}
                disabled={!reveal}
                onClick={(e) => {
                  e.stopPropagation();
                  const a = achievements.find((x) => x.id === b.achievementId);
                  if (a) open(a);
                }}
              >
                <BadgeGlyph badge={b} size={28} />
                <span>
                  {b.name}
                  {b.provisional && <small>insignia provisional</small>}
                </span>
              </button>
            ))}
            {earnedArchive.map((c) => (
              <button
                key={c.id}
                type="button"
                className="ml-badge ml-badge--archive"
                tabIndex={reveal ? 0 : -1}
                disabled={!reveal}
                onClick={(e) => {
                  e.stopPropagation();
                  const a = achievements.find((x) => x.id === c.achievementId);
                  if (a) open(a);
                }}
              >
                <span className="ml-badge__file" aria-hidden="true">
                  <svg viewBox="0 0 24 24" width="16" height="16"><path d="M6 3h8l4 4v14H6z M14 3v4h4" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" /></svg>
                </span>
                <span>
                  {c.title}
                  <small>ficha de archivo</small>
                </span>
              </button>
            ))}
          </div>
        )}

        {reveal && (
          <p className="ml-credit">
            <span className="ml-credit__full">Tierra: NASA <i>Blue Marble</i> (dominio público) · Cielo, Luna y Marte: recreación por código · Código con asistencia de IA</span>
            <span className="ml-credit__short">Tierra: NASA <i>Blue Marble</i> · resto recreado por código · código con IA</span>
          </p>
        )}

        <p className="ml-sr" aria-live="polite">{announce}</p>

        {shareOpen && (
          <ShareView
            achievements={achievements}
            edges={edges.map((e) => ({ from: e.from, to: e.to }))}
            badges={earnedBadges}
            demo={demo}
            reducedMotion={reduced}
            onClose={() => setShareOpen(false)}
          />
        )}

        {!reveal && !reduced && (
          <button type="button" className="ml-btn ml-skip" onClick={(e) => (e.stopPropagation(), skip())}>
            Saltar transición
          </button>
        )}

        <div className="ml-card-host">
          <AnimatePresence>
            {selected && (
              <AchievementCard
                key={selected.id}
                achievement={selected}
                badge={badgeFor(selected)}
                archive={archiveCards.find((c) => c.achievementId === selected.id)}
                demo={demo}
                reducedMotion={reduced}
                formatDate={formatDate}
                onClose={close}
                compact={compact}
              />
            )}
          </AnimatePresence>
        </div>
      </div>
    </LazyMotion>
  );
}
