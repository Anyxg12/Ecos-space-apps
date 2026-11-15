import { CineFx } from './CineFx';
import { useCallback, useEffect, useLayoutEffect, useMemo, useReducer, useRef, useState } from 'react';
import './universe.css';
import { EcosLogo } from '../components/EcosLogo';
import { InterestIcon } from '../components/InterestIcon';
import { INTERESTS } from '../state/catalog';
import { PLACES, type PlaceId } from '../state/destinations';
import { buildWelcome } from '../state/personalization';
import { initialUniverse, universeReducer } from '../state/universeMachine';
import type { ExplorerProfile } from '../state/types';
import { detectCapability } from '../gl/quality';
import { PlanetRenderer, type Anchor } from './PlanetRenderer';
import { ArtifactsScreen, MoonScreen } from './ArtifactsScreen';
import { ProfileScreen } from './ProfileScreen';
import { TravelFx } from './TravelFx';
import { JuniorBackdrop, JuniorPlanet } from './JuniorArt';
import { useEcosHost } from '../host';
import { SoundToggle } from '../components/SoundToggle';

export interface UniverseProps {
  profile: Pick<ExplorerProfile, 'ageGroup' | 'interests'> & Partial<ExplorerProfile>;
  /** guarda el perfil editado (seudónimo, edad, intereses) */
  onProfileChange?: (p: ExplorerProfile) => void;
  onReplay: () => void;
  onReset: () => void;
  reducedMotion: boolean;
}

/** Cada universo viaja con su propio ritmo: cuento ágil, salto de videojuego, aproximación documental. */
const FLY: Record<string, number> = { junior: 1700, explorer: 1900, discovery: 2400 };
const BACK_MS = 1300;
const GROUP_LABEL = { junior: 'Junior', explorer: 'Explorer', discovery: 'Discovery' } as const;

/**
 * Universo final por grupo. Misma estructura para los tres; cambia el render:
 * junior → ilustración SVG (zoom por transform CSS); explorer → shader holográfico + HUD;
 * discovery → shader realista. Sin WebGL, los dos últimos usan planetas CSS y zoom CSS.
 */
export function Universe({ profile, onReplay, onReset, reducedMotion, onProfileChange }: UniverseProps) {
  const FLY_MS = FLY[profile.ageGroup] ?? 1900;
  const [profileOpen, setProfileOpen] = useState(false);
  const profileBtn = useRef<HTMLButtonElement>(null);
  const variant = profile.ageGroup;
  const host = useEcosHost();
  const welcome = buildWelcome(profile);
  const [st, dispatch] = useReducer(universeReducer, initialUniverse);
  const cap = useMemo(() => detectCapability(), []);
  const [glFailed, setGlFailed] = useState(false);
  // ?gl=0 fuerza el modo sin WebGL (planetas CSS) para pruebas y equipos con problemas gráficos
  const forceNoGL = useMemo(() => new URLSearchParams(window.location.search).get('gl') === '0', []);
  const useGL = variant !== 'junior' && cap.webgl && !glFailed && !forceNoGL;

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const sceneRef = useRef<HTMLDivElement>(null);
  const slotRefs = useRef<(HTMLDivElement | null)[]>([]);
  const placeRefs = useRef<Partial<Record<PlaceId, HTMLButtonElement | null>>>({});
  const lastPlace = useRef<PlaceId | null>(null);
  // «Saltar transición»: resuelve al instante todas las esperas pendientes
  const waiters = useRef(new Set<() => void>());
  const wait = useCallback((ms: number) => new Promise<void>((res) => {
    if (ms <= 0) return res();
    const done = () => (clearTimeout(t), waiters.current.delete(done), res());
    const t = setTimeout(done, ms);
    waiters.current.add(done);
  }), []);
  const skip = useCallback(() => {
    if (sceneRef.current) sceneRef.current.style.transition = 'none';
    rendererRef.current?.finish();
    [...waiters.current].forEach((f) => f());
  }, []);
  const rendererRef = useRef<PlanetRenderer | null>(null);
  const [hover, setHover] = useState<number | null>(null);
  const accent = INTERESTS.find((i) => i.id === profile.interests[0]);

  const readAnchors = useCallback((): Anchor[] => {
    return PLACES.map((_p, i) => {
      const el = slotRefs.current[i];
      if (!el) return { x: 0, y: 0, r: 1 };
      const r = el.getBoundingClientRect();
      const host = sceneRef.current!.getBoundingClientRect();
      return { x: r.left - host.left + r.width / 2, y: r.top - host.top + r.height / 2, r: r.width / 2 };
    });
  }, []);

  // WebGL: un único contexto por universo.
  useLayoutEffect(() => {
    if (!useGL || !canvasRef.current) return;
    let r: PlanetRenderer;
    try {
      r = new PlanetRenderer(canvasRef.current, {
        style: variant === 'explorer' ? 1 : 0,
        tier: cap.tier,
        reducedMotion,
        onLost: () => setGlFailed(true),
      });
    } catch (e) {
      console.warn('[ECOS] universo sin WebGL:', e);
      setGlFailed(true);
      return;
    }
    rendererRef.current = r;
    r.setAnchors(readAnchors());
    r.start();
    const onResize = () => {
      r.resize();
      r.setAnchors(readAnchors());
    };
    const ro = new ResizeObserver(onResize);
    ro.observe(sceneRef.current!);
    const vis = () => (document.hidden ? r.stop() : r.start());
    document.addEventListener('visibilitychange', vis);
    return () => {
      ro.disconnect();
      document.removeEventListener('visibilitychange', vis);
      r.dispose();
      rendererRef.current = null;
    };
  }, [useGL, variant, cap.tier, reducedMotion, readAnchors]);

  useEffect(() => rendererRef.current?.setHover(hover), [hover]);

  /** Zoom CSS (junior y fallback): lleva el planeta al centro y amplía. */
  const domZoom = useCallback(
    async (i: number | null, ms: number) => {
      const el = sceneRef.current;
      if (!el) return;
      let transform = 'translate(0px, 0px) scale(1)';
      if (i !== null) {
        const a = readAnchors()[i];
        const W = el.clientWidth;
        const H = el.clientHeight;
        const Z = (Math.max(W, H) / a.r) * 0.75;
        transform = `translate(${W / 2 - a.x * Z}px, ${H / 2 - a.y * Z}px) scale(${Z})`;
      }
      const d = reducedMotion ? 0 : ms;
      el.style.transition = d ? `transform ${d}ms ${i !== null ? 'cubic-bezier(.64,0,.78,0)' : 'cubic-bezier(.22,1,.36,1)'}` : 'none';
      el.style.transform = transform;
      await wait(d);
    },
    [readAnchors, reducedMotion, wait],
  );

  const select = useCallback(
    async (place: PlaceId) => {
      if (st.view !== 'browse') return;
      const i = PLACES.findIndex((p) => p.id === place);
      dispatch({ type: 'SELECT', place });
      lastPlace.current = place;
      setHover(null);
      const r = rendererRef.current;
      if (r) r.setAnchors(readAnchors());
      const zoom = r ? r.flyTo(i, FLY_MS) : domZoom(i, FLY_MS);
      // La superficie de Marte aparece durante el último tramo del zoom (aterrizaje continuo).
      if (!reducedMotion) await wait(FLY_MS * 0.66);
      dispatch({ type: 'ARRIVED' });
      await zoom;
    },
    [st.view, readAnchors, domZoom, reducedMotion, wait, FLY_MS],
  );

  const back = useCallback(async () => {
    dispatch({ type: 'BACK' });
    if (!reducedMotion) await wait(420); // la superficie se desvanece antes de alejarse
    const r = rendererRef.current;
    if (r) {
      await r.flyBack(BACK_MS);
    } else {
      await domZoom(null, BACK_MS);
    }
    dispatch({ type: 'RETURNED' });
  }, [domZoom, reducedMotion, wait]);

  // Al volver, el foco regresa al mundo del que se vino.
  const visited = useRef(false);
  useEffect(() => {
    if (st.view === 'arrived') visited.current = true;
    if (st.view === 'browse' && visited.current && lastPlace.current) placeRefs.current[lastPlace.current]?.focus({ preventScroll: true });
  }, [st.view]);

  const flying = st.view === 'flying' || st.view === 'returning';
  const zoomed = st.view !== 'browse';
  const arrived = st.view === 'arrived';
  const flyIndex = st.place ? PLACES.findIndex((p) => p.id === st.place) : -1;

  return (
    <div
      className={`universe universe--${variant} theme-${variant} ${useGL ? 'universe--gl' : 'universe--css'} ${reducedMotion ? 'reduce-motion' : ''} ${zoomed ? 'is-zoomed' : ''} ${flying ? 'is-flying' : ''} ${arrived ? 'is-arrived' : ''}`}
      style={accent ? ({ '--uni-accent': accentColor(variant, accent.id) } as React.CSSProperties) : undefined}
      data-universe={variant}
      data-view={st.view}
      data-render={useGL ? 'webgl' : variant === 'junior' ? 'svg' : 'css'}
    >
      <div ref={sceneRef} className="universe__scene" inert={arrived}>
        {variant === 'junior' && <JuniorBackdrop reducedMotion={reducedMotion} />}
        {variant !== 'junior' && !useGL && <div className={`uni-cssbg uni-cssbg--${variant}`} aria-hidden="true" />}
        {useGL && <canvas ref={canvasRef} className="universe__canvas" aria-hidden="true" />}

        <div className="universe__places">
          {PLACES.map((p, i) => {
            const slot = (
              <div
                ref={(el) => {
                  slotRefs.current[i] = el;
                }}
                className="uni-place__slot"
              >
                {variant === 'junior' && (
                  <div className="jr-float" style={{ animationDelay: `${i * -1.3}s` }}>
                    <JuniorPlanet place={p.id} />
                  </div>
                )}
                {variant !== 'junior' && !useGL && <div className={`css-planet css-planet--${p.id} css-planet--${variant}`} />}
                {variant === 'explorer' && p.interactive && (
                  <span className="hud-reticle" aria-hidden="true">
                    <i /><i /><i /><i />
                  </span>
                )}
              </div>
            );
            if (!p.interactive)
              return (
                <div key={p.id} className={`uni-place uni-place--${p.id} uni-place--scenery`}>
                  {slot}
                  <span className="uni-place__label uni-place__label--world">
                    <span className="uni-place__name">{p.name}</span>
                  </span>
                </div>
              );
            return (
              <div key={p.id} className={`uni-place uni-place--${p.id} uni-place--dest ${hover === i ? 'is-hover' : ''} ${flyIndex === i ? 'is-target' : ''}`}>
                <button
                  ref={(el) => {
                    placeRefs.current[p.id] = el;
                  }}
                  type="button"
                  className="uni-place__btn"
                  disabled={st.view !== 'browse'}
                  onClick={() => void select(p.id)}
                  onPointerEnter={() => setHover(i)}
                  onPointerLeave={() => setHover(null)}
                  onFocus={() => setHover(i)}
                  onBlur={() => setHover(null)}
                  aria-label={`Viajar a ${p.name}: ${p.id === 'marte' ? 'Spirit y Opportunity, misiones disponibles' : 'estaciones ALSEP, misión disponible'}`}
                >
                  {slot}
                  <span className="uni-place__label">
                    {variant === 'explorer' && <small>OBJETIVO</small>}
                    <span className="uni-place__name">{p.name}</span>
                    {variant === 'explorer' && <small className="is-on">{p.id === 'marte' ? 'SPIRIT · OPPORTUNITY' : 'ALSEP · APOLLO'}</small>}
                    {variant === 'discovery' && <small>{p.id === 'marte' ? 'Spirit · Opportunity' : 'Estaciones ALSEP'}</small>}
                    {variant === 'junior' && <small className="uni-place__sub">{p.id === 'marte' ? 'Spirit' : 'ALSEP'}</small>}
                  </span>
                </button>
              </div>
            );
          })}
        </div>
      </div>

      {variant === 'explorer' && <div className={`hud-warp ${flying && st.view === 'flying' ? 'is-on' : ''}`} aria-hidden="true" />}
      {variant === 'explorer' && <HudFrame />}

      <header className="universe__header" inert={arrived || profileOpen}>
        <EcosLogo size={0.42} className="universe__logo" title="ECOS" />
        <div className="universe__profile">
          <span className="universe__group">{GROUP_LABEL[variant]}</span>
          <span className="universe__interests" aria-label="Tus intereses">
            {profile.interests.slice(0, 5).map((id) => (
              <span key={id} className="universe__interest" title={INTERESTS.find((x) => x.id === id)?.label}>
                <InterestIcon id={id} />
              </span>
            ))}
          </span>
        </div>
        <div className="universe__actions">
          {host && (
            <button type="button" className="uni-btn uni-btn--logros" onClick={host.openAchievements}>
              <span aria-hidden="true">✦ </span>Mis logros
            </button>
          )}
          {host?.openRanking && (
            <button type="button" className="uni-btn uni-btn--rank" onClick={host.openRanking} title="Top exploradores">
              <span aria-hidden="true">▲ </span><span className="uni-btn__txt">Top exploradores</span>
            </button>
          )}
          <button ref={profileBtn} type="button" className="uni-btn uni-btn--profile" onClick={() => setProfileOpen(true)} aria-haspopup="dialog">
            <span aria-hidden="true">◎ </span>{profile.alias ? profile.alias : 'Perfil'}
          </button>
          <button type="button" className="uni-btn uni-btn--sec" onClick={onReplay}>Ver intro</button>
          <button type="button" className="uni-btn uni-btn--sec" onClick={onReset}>Cambiar perfil</button>
          <SoundToggle inline />
        </div>
      </header>

      <div className="universe__title" aria-live="polite" inert={arrived}>
        <p className="universe__greeting">{welcome.greeting}</p>
        <h1 className="universe__h1">{welcome.title}</h1>
        <p className="universe__hint">{welcome.hint}</p>
      </div>

      <p className="universe__scale">Mapa artístico: distancias y tamaños no están a escala.</p>

      {st.view === 'flying' && st.place && <TravelFx variant={variant} place={st.place} reducedMotion={reducedMotion} />}
      {flying && !reducedMotion && (
        <button type="button" className="uni-skip" onClick={skip}>
          Saltar transición <span aria-hidden="true">»</span>
        </button>
      )}

      {(arrived || st.view === 'returning') && st.place === 'marte' && (
        <ArtifactsScreen variant={variant} leaving={st.view === 'returning'} reducedMotion={reducedMotion} onBack={() => void back()} />
      )}
      {(arrived || st.view === 'returning') && st.place === 'luna' && (
        <MoonScreen variant={variant} leaving={st.view === 'returning'} reducedMotion={reducedMotion} onBack={() => void back()} />
      )}

      {profileOpen && (
        <ProfileScreen
          profile={profile}
          onSave={(p) => onProfileChange?.(p)}
          onReplay={onReplay}
          onReset={onReset}
          onClose={() => {
            setProfileOpen(false);
            requestAnimationFrame(() => profileBtn.current?.focus({ preventScroll: true }));
          }}
        />
      )}
      {variant === 'discovery' && <CineFx />}
    </div>
  );
}

function HudFrame() {
  return (
    <div className="hud-frame" aria-hidden="true">
      <span className="hud-frame__tl">ECOS // NAVEGACIÓN</span>
      <span className="hud-frame__br">LUNA · MARTE · EN LÍNEA</span>
    </div>
  );
}

/** Los intereses sólo tiñen un detalle (acento del rótulo activo). */
function accentColor(variant: string, id: string) {
  const warm = ['arte', 'musica', 'historia', 'animales', 'naturaleza', 'deportes'].includes(id);
  if (variant === 'explorer') return warm ? '#c06bff' : '#4fe3ff';
  if (variant === 'junior') return warm ? '#ffb3c7' : '#ffd27a';
  return warm ? '#e8c38a' : '#bcd6f2';
}
