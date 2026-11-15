import { useEffect, useRef, useState, type CSSProperties, type ReactNode } from 'react';
import { CARD_FACT_IDS } from '../../data/spiritFacts';
import { FactList } from './SpiritExplore';
import { useEcosHost } from '../host';
import type { AgeGroup } from '../state/types';
import type { PlaceId } from '../state/destinations';
import { RoverGlyph } from './JuniorArt';
import { MarsSurface } from './MarsSurface';
import { MoonSurface, AlsepGlyph } from './MoonSurface';
import { OPPORTUNITY_FACTS } from '../../data/opportunityFacts';
import { ALSEP_FACTS, ALSEP_CREW_BIOS, MOON_SOURCES } from '../../data/alsepFacts';
import { SPIRIT_STORY, OPPORTUNITY_STORY, ALSEP_STORY, type Story } from '../../data/stories';
import { StoryRoute } from './story/StoryRoute';
import { FactChips } from './story/Facts';
import { sound } from '../audio/soundEngine';

interface Signal {
  id: string;
  name: string;
  status: string;
  primary: boolean;
  x: number; // % del ancho
  y: number; // % del alto
  glyph: ReactNode;
  story?: Story;
  aria: string;
  /** misión con ruta pero no principal (Opportunity) */
  mission?: boolean;
}

/** Señales futuras: artefactos sin historia todavía. Sin nombres inventados; sólo un icono tenue con candado. */
/** Posición en % (escritorio) y, opcional, en móvil (mx/my) para no amontonarse con los rovers. */
export interface FutureSignal { x: number; y: number; mx?: number; my?: number }

const COPY: Record<PlaceId, Record<AgeGroup, { kicker: string; title: string; back: string; hint: string }>> = {
  marte: {
    junior: { kicker: 'Superficie de Marte', title: '¡Llegaste a Marte!', back: 'Volver al universo', hint: 'Toca la señal que más brilla: ¡Spirit te espera!' },
    explorer: { kicker: 'ECOS // SUPERFICIE · MARTE', title: 'Señales detectadas', back: 'Volver al mapa', hint: 'Spirit: misión principal · Opportunity: misión disponible.' },
    discovery: { kicker: 'Superficie de Marte', title: 'Dos rovers gemelos', back: 'Volver', hint: 'Elige una señal para acercarte.' },
  },
  luna: {
    junior: { kicker: 'Superficie de la Luna', title: '¡Llegaste a la Luna!', back: 'Volver al universo', hint: 'Toca la estación que brilla para empezar.' },
    explorer: { kicker: 'ECOS // SUPERFICIE · LUNA', title: 'Señal detectada', back: 'Volver al mapa', hint: 'Selecciona la señal ALSEP: misión disponible.' },
    discovery: { kicker: 'Superficie de la Luna', title: 'Instrumentos que se quedaron', back: 'Volver', hint: 'Acércate a la estación ALSEP.' },
  },
};

/** Pantalla de llegada a un mundo: superficie + señales seleccionables + fichas + ruta narrativa. */
function SurfaceScreen({ place, variant, onBack, leaving, reducedMotion, signals, future = [], drawers }: { place: PlaceId; variant: AgeGroup; onBack: () => void; leaving: boolean; reducedMotion: boolean; signals: Signal[]; future?: FutureSignal[]; drawers: { id: string; label: string; body: ReactNode }[] }) {
  const c = COPY[place][variant];
  const backRef = useRef<HTMLButtonElement>(null);
  const sigRefs = useRef<Record<string, HTMLButtonElement | null>>({});
  const sceneRef = useRef<HTMLDivElement>(null);
  const [story, setStory] = useState<{ s: Story; from: string } | null>(null);
  const [zoomTo, setZoomTo] = useState<Signal | null>(null);
  const [drawer, setDrawer] = useState<string | null>(null);
  const [tilt, setTilt] = useState({ x: 0, y: 0 });

  useEffect(() => {
    // al llegar, el foco va a la señal principal (misión disponible)
    const main = signals.find((s) => s.primary);
    (main ? sigRefs.current[main.id] : backRef.current)?.focus({ preventScroll: true });
  }, []); // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => {
    const k = (e: KeyboardEvent) => {
      if (e.key !== 'Escape' || leaving || story) return;
      if (drawer) setDrawer(null);
      else onBack();
    };
    window.addEventListener('keydown', k);
    return () => window.removeEventListener('keydown', k);
  }, [onBack, leaving, story, drawer]);

  const open = (s: Signal) => {
    if (!s.story) return;
    sound.cardOpen();
    if (reducedMotion) {
      setStory({ s: s.story, from: s.id });
      return;
    }
    setZoomTo(s);
    setTimeout(() => {
      setStory({ s: s.story!, from: s.id });
      setZoomTo(null);
    }, 850);
  };
  const closeStory = () => {
    const from = story?.from;
    setStory(null);
    requestAnimationFrame(() => from && sigRefs.current[from]?.focus({ preventScroll: true }));
  };

  const zoomStyle = zoomTo ? { transformOrigin: `${zoomTo.x}% ${zoomTo.y}%`, transform: 'scale(2.6)', filter: 'blur(2px)' } : { transform: `translate(${tilt.x * -14}px, ${tilt.y * -8}px) scale(1.04)` };

  return (
    <section
      className={`arrive arrive--${variant} arrive--${place} ${leaving ? 'is-leaving' : ''} ${zoomTo ? 'is-zooming' : ''}`}
      aria-labelledby="arrive-title"
      onPointerMove={(e) => {
        if (reducedMotion || e.pointerType !== 'mouse') return;
        setTilt({ x: e.clientX / window.innerWidth - 0.5, y: e.clientY / window.innerHeight - 0.5 });
      }}
    >
      <div className="arrive__surface">
        <div ref={sceneRef} className="arrive__scene" style={zoomStyle}>
          {place === 'marte' ? <MarsSurface variant={variant} /> : <MoonSurface variant={variant} />}
          <div className="arrive__dust" aria-hidden="true">{Array.from({ length: 14 }, (_, i) => <i key={i} style={{ left: `${(i * 37) % 100}%`, animationDelay: `${i * -0.9}s` }} />)}</div>
        </div>
      </div>
      <button ref={backRef} type="button" className="arrive__back" onClick={onBack} disabled={leaving}>
        <span aria-hidden="true">←</span> {c.back}
      </button>
      <div className="arrive__head">
        <p className="arrive__kicker">{c.kicker}</p>
        <h2 id="arrive-title" className="arrive__title">{c.title}</h2>
        <p className="arrive__hint">{c.hint}</p>
      </div>

      <div className="arrive__signals" style={zoomTo ? { opacity: 0 } : undefined}>
        {future.map((f, i) => (
          <span key={`f${i}`} className="sig sig--future" style={{ '--x': `${f.x}%`, '--y': `${f.y}%`, '--mx': `${f.mx ?? f.x}%`, '--my': `${f.my ?? f.y}%` } as CSSProperties} role="img" aria-label="Señal futura: artefacto por descubrir, bloqueada">
            <span className="sig__glow" aria-hidden="true" />
            <svg className="sig__lock" viewBox="0 0 24 24" aria-hidden="true">
              <rect x="6" y="11" width="12" height="9" rx="2" />
              <path d="M9 11V8a3 3 0 0 1 6 0v3" />
            </svg>
            <span className="sig__ftag" aria-hidden="true">Señal por descubrir</span>
          </span>
        ))}
        {signals.map((s) => (
          <button
            key={s.id}
            ref={(el) => {
              sigRefs.current[s.id] = el;
            }}
            type="button"
            className={`sig ${s.primary ? 'sig--primary' : s.mission ? 'sig--primary sig--mission' : 'sig--info'}`}
            style={{ left: `${s.x}%`, top: `${s.y}%` }}
            aria-label={s.aria}
            onClick={() => (s.story ? open(s) : setDrawer(s.id))}
            data-sfx={s.story ? 'custom' : undefined}
          >
            <span className="sig__rings" aria-hidden="true"><i /><i /><i /></span>
            <span className="sig__glyph" aria-hidden="true">{s.glyph}</span>
            <span className="sig__tag" aria-hidden="true">
              <b>{s.name}</b>
              <small>{s.status}</small>
            </span>
          </button>
        ))}
      </div>

      <div className="arrive__dock">
        {drawers.map((d) => (
          <button key={d.id} type="button" className="arrive__chip" aria-expanded={drawer === d.id} onClick={() => setDrawer(drawer === d.id ? null : d.id)}>
            {d.label}
          </button>
        ))}
        <p className="arrive__note">Contenido provisional · Posiciones y tamaños artísticos, no a escala.</p>
      </div>

      {drawer && (
        <aside className="arrive__drawer" role="dialog" aria-modal="false" aria-label={drawers.find((d) => d.id === drawer)?.label}>
          <button type="button" className="arrive__drawer-x" onClick={() => setDrawer(null)} aria-label="Cerrar ficha">✕</button>
          {drawers.find((d) => d.id === drawer)?.body}
        </aside>
      )}

      {story && <StoryRoute story={story.s} variant={variant} reducedMotion={reducedMotion} onClose={closeStory} />}
    </section>
  );
}

/** Llegada a Marte: Spirit (misión principal) y Opportunity (segunda misión), ambas con ruta narrativa, + señales futuras. */
export function ArtifactsScreen({ variant, onBack, leaving = false, reducedMotion = false }: { variant: AgeGroup; onBack: () => void; leaving?: boolean; reducedMotion?: boolean }) {
  const host = useEcosHost();
  const done = host?.isUnlocked('spirit-legado');
  const oppDone = host?.isUnlocked('opportunity-legado');
  const signals: Signal[] = [
    { id: 'spirit', name: 'Spirit', status: done ? '✓ Misión completada · repetir' : 'Misión principal', primary: true, x: 36, y: 66, glyph: <RoverGlyph />, story: SPIRIT_STORY, aria: done ? 'Explorar Spirit otra vez: misión completada' : 'Explorar Spirit: misión disponible' },
    { id: 'opportunity', name: 'Opportunity', status: oppDone ? '✓ Misión completada · repetir' : 'Misión disponible', primary: false, mission: true, x: 70, y: 72, glyph: <RoverGlyph />, story: OPPORTUNITY_STORY, aria: oppDone ? 'Explorar Opportunity otra vez: misión completada' : 'Explorar Opportunity: misión disponible' },
  ];
  // en móvil (mx/my) se alejan de los rovers: zonas libres arriba y abajo a la izquierda
  const future: FutureSignal[] = [{ x: 15, y: 56, mx: 13, my: 37 }, { x: 54, y: 50, mx: 86, my: 41 }, { x: 87, y: 54, mx: 12, my: 81 }];
  const drawers = [
    {
      id: 'spirit',
      label: 'Ficha de Spirit',
      body: (
        <>
          <h3 className="arrive__dtitle">Spirit</h3>
          <FactList ids={CARD_FACT_IDS} compact />
        </>
      ),
    },
    {
      id: 'opportunity',
      label: 'Ficha de Opportunity',
      body: (
        <>
          <h3 className="arrive__dtitle">Opportunity</h3>
          <p className="arrive__dlead">Gemelo de Spirit, con su propia ruta en ECOS. Datos de la página oficial de la misión (NASA Science).</p>
          <FactChips facts={OPPORTUNITY_FACTS} open />
        </>
      ),
    },
  ];
  return <SurfaceScreen place="marte" variant={variant} onBack={onBack} leaving={leaving} reducedMotion={reducedMotion} signals={signals} future={future} drawers={drawers} />;
}

/** Llegada a la Luna: estación ALSEP (misión disponible, ruta narrativa). */
export function MoonScreen({ variant, onBack, leaving = false, reducedMotion = false }: { variant: AgeGroup; onBack: () => void; leaving?: boolean; reducedMotion?: boolean }) {
  const host = useEcosHost();
  const done = host?.isUnlocked('alsep-legado');
  const signals: Signal[] = [
    { id: 'alsep', name: 'ALSEP', status: done ? '✓ Ruta completada · repetir' : 'Misión disponible', primary: true, x: 46, y: 70, glyph: <AlsepGlyph />, story: ALSEP_STORY, aria: done ? 'Explorar ALSEP otra vez: ruta completada' : 'Explorar ALSEP: misión disponible' },
  ];
  const future: FutureSignal[] = [{ x: 18, y: 60, mx: 13, my: 50 }, { x: 78, y: 58, mx: 87, my: 52 }, { x: 70, y: 82, mx: 14, my: 80 }];
  const drawers = [
    {
      id: 'alsep',
      label: 'Ficha de ALSEP',
      body: (
        <>
          <h3 className="arrive__dtitle">ALSEP</h3>
          <p className="arrive__dlead">Apollo Lunar Surface Experiments Package. Ilustración dibujada por código, no es una foto.</p>
          <FactChips facts={[ALSEP_FACTS.que_es, ALSEP_FACTS.apollo12, ALSEP_FACTS.energia, ALSEP_FACTS.apagado, ALSEP_FACTS.siguen_alli, ...ALSEP_CREW_BIOS]} open />
          <div className="arrive__srcs">
            <p className="arrive__srcs-h">Fuentes oficiales (NASA)</p>
            <ul>
              {Object.values(MOON_SOURCES).map((s) => (
                <li key={s.url}>
                  <a href={s.url} target="_blank" rel="noopener noreferrer">{s.publisher}<span aria-hidden="true"> ↗</span><span className="sr-only"> (se abre en otra pestaña)</span></a>
                </li>
              ))}
            </ul>
          </div>
        </>
      ),
    },
  ];
  return <SurfaceScreen place="luna" variant={variant} onBack={onBack} leaving={leaving} reducedMotion={reducedMotion} signals={signals} future={future} drawers={drawers} />;
}
