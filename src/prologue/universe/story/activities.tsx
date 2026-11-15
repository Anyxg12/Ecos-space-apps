import { useEffect, useRef, useState, type PointerEvent as RPE } from 'react';
import { createPortal } from 'react-dom';
import type { Activity, ByMode } from '../../../data/stories';
import type { AgeGroup } from '../../state/types';
import type { RoverFact } from '../../../data/opportunityFacts';
import { sound } from '../../audio/soundEngine';
import { FactBody } from './Facts';
import { SofiPlayer } from './SofiPlayer';
import { RoverGlyph } from '../JuniorArt';

/**
 * Actividades de las rutas. Son juegos sencillos para recordar hechos verificados,
 * no simulaciones científicas. Todas funcionan con ratón, toque y teclado, y sin animación.
 */
export interface ActProps {
  activity: Activity;
  variant: AgeGroup;
  reduced: boolean;
  done: boolean;
  onDone: () => void;
}

export function ActivityView(p: ActProps) {
  const a = p.activity;
  switch (a.kind) {
    case 'assemble': return <Assemble {...p} parts={a.parts} />;
    case 'hold': return <Hold {...p} label={a.label} />;
    case 'audio': return <SofiPlayer onPlayed={p.onDone} />;
    case 'choice': return <Choice {...p} prompt={a.prompt} options={a.options} bounce={a.bounce} bounceMin={a.bounceMin} />;
    case 'route': return <DragRoute {...p} waypoints={a.waypoints} />;
    case 'place': return <Place {...p} items={a.items} />;
    case 'network': return <Network {...p} sites={a.sites} hub={a.hub} />;
    case 'switch': return <Switches {...p} stations={a.stations} />;
    case 'find': return <Find {...p} items={a.items} />;
    case 'song': return <Song {...p} />;
    case 'quake': return <Quake {...p} />;
    default: return null;
  }
}

export const ACT_LABEL: Record<Activity['kind'], string> = {
  reveal: '',
  assemble: 'Actividad · arma el rover',
  hold: 'Actividad · despegue',
  audio: 'Escucha',
  choice: 'Actividad · elige',
  route: 'Actividad · arrastra la ruta',
  place: 'Actividad · coloca las piezas',
  network: 'Actividad · conecta la red',
  switch: 'Actividad · apagado',
  find: 'Actividad · encuentra',
  song: 'Actividad · última transmisión',
  quake: 'Actividad · escucha (ilustrativo)',
};

const PIN: Record<string, [number, number]> = { gusev: [138, 78], meridiani: [66, 50] };

/* ───────── Armar el rover (tocar o arrastrar cada pieza a su silueta) ───────── */
function Assemble({ parts, done, onDone }: ActProps & { parts: { id: string; label: string; fact: RoverFact }[] }) {
  const [placed, setPlaced] = useState<string[]>(done ? parts.map((x) => x.id) : []);
  const [last, setLast] = useState<RoverFact | null>(null);
  const drop = useRef<HTMLDivElement>(null);
  const place = (id: string) => {
    if (placed.includes(id)) return;
    const next = [...placed, id];
    setPlaced(next);
    setLast(parts.find((x) => x.id === id)!.fact);
    sound.snap();
    if (next.length === parts.length) {
      sound.success();
      onDone();
    }
  };
  const drag = useDrag((id, x, y) => {
    const r = drop.current?.getBoundingClientRect();
    if (r && x > r.left && x < r.right && y > r.top && y < r.bottom) place(id);
  });
  return (
    <div className="act act--assemble">
      <div ref={drop} className="asm__rover" aria-label={`Rover: ${placed.length} de ${parts.length} piezas colocadas`} role="img">
        <RoverGlyph className="asm__ghost" />
        <svg viewBox="0 0 160 100" className="asm__parts" aria-hidden="true">
          <g className={`asm__p ${placed.includes('mastil') ? 'is-on' : ''}`}><path d="M70 36 V14" /><rect x="61" y="6" width="20" height="9" rx="2" /></g>
          <g className={`asm__p ${placed.includes('brazo') ? 'is-on' : ''}`}><path d="M110 58 L124 64 L130 74" /></g>
          <g className={`asm__p ${placed.includes('rat') ? 'is-on' : ''}`}><circle cx="131" cy="76" r="4" /></g>
        </svg>
      </div>
      <div className="act__chips" role="group" aria-label="Piezas">
        {parts.map((pt) => (
          <button key={pt.id} type="button" className={`act__chip ${placed.includes(pt.id) ? 'is-done' : ''}`} disabled={placed.includes(pt.id)} onClick={() => place(pt.id)} {...drag(pt.id)}>
            {placed.includes(pt.id) ? '✓ ' : '+ '}{pt.label}
          </button>
        ))}
      </div>
      <p className="act__help">Arrastra cada pieza al rover o tócala para colocarla.</p>
      {last && <div className="act__reveal" aria-live="polite"><strong>{last.label}</strong><FactBody f={last} /></div>}
    </div>
  );
}

/* ───────── Mantener pulsado para despegar ─────────
 * Al completar, el cohete sale de la tarjeta y vuela hasta salir por arriba de la pantalla con su estela
 * (capa fija en <body>, fuera del panel con scroll). Con movimiento reducido solo se desvanece. */
const RocketSvg = ({ p = 1, className = '' }: { p?: number; className?: string }) => (
  <svg viewBox="0 0 60 120" className={className} aria-hidden="true">
    <path d="M30 4 C42 18 44 40 42 74 H18 C16 40 18 18 30 4Z" className="hold__body" />
    <path d="M18 60 L8 84 L18 80Z M42 60 L52 84 L42 80Z" className="hold__fin" />
    <circle cx="30" cy="36" r="6" className="hold__win" />
    <path d="M22 76 Q30 112 38 76Z" className="hold__flame" style={{ opacity: p > 0 ? 1 : 0, transform: `scaleY(${0.4 + p * 0.8})` }} />
  </svg>
);
function Hold({ label, done, onDone, reduced, variant }: ActProps & { label: string }) {
  const [p, setP] = useState(done ? 1 : 0);
  const [flight, setFlight] = useState<{ left: number; top: number; width: number; height: number } | null>(null);
  const raf = useRef(0);
  const holding = useRef(false);
  const rocketRef = useRef<HTMLDivElement>(null);
  const DUR = reduced ? 500 : 1400;
  const launch = () => {
    const r = rocketRef.current?.getBoundingClientRect();
    if (r && !reduced) setFlight({ left: r.left, top: r.top, width: r.width, height: r.height });
    sound.success();
    onDone();
  };
  const start = () => {
    if (p >= 1) return;
    holding.current = true;
    const t0 = performance.now() - p * DUR;
    sound.whoosh();
    const step = (t: number) => {
      if (!holding.current) return;
      const v = Math.min(1, (t - t0) / DUR);
      setP(v);
      if (v >= 1) {
        holding.current = false;
        launch();
        return;
      }
      raf.current = requestAnimationFrame(step);
    };
    raf.current = requestAnimationFrame(step);
  };
  const stop = () => {
    holding.current = false;
    cancelAnimationFrame(raf.current);
    setP((v) => (v >= 1 ? 1 : 0));
  };
  useEffect(() => () => cancelAnimationFrame(raf.current), []);
  const launched = p >= 1;
  return (
    <div className={`act act--hold ${launched ? 'is-launched' : ''} ${p > 0 && !launched ? 'is-charging' : ''}`}>
      <div className="hold__pad" aria-hidden="true">
        <div ref={rocketRef} className="hold__rocketwrap" style={{ transform: `translateY(${-p * 6}px)` }}>
          <RocketSvg p={p} className="hold__rocket" />
        </div>
        <span className="hold__tower" />
        <span className="hold__smoke" style={launched ? undefined : { opacity: p }} />
        {launched && <span className="hold__trailstub" />}
      </div>
      <button
        type="button"
        className="hold__btn"
        data-sfx="custom"
        disabled={launched}
        onPointerDown={(e) => (e.currentTarget.setPointerCapture(e.pointerId), start())}
        onPointerUp={stop}
        onPointerCancel={stop}
        onKeyDown={(e) => (e.key === ' ' || e.key === 'Enter') && !e.repeat && (e.preventDefault(), start())}
        onKeyUp={(e) => (e.key === ' ' || e.key === 'Enter') && stop()}
        style={{ ['--p' as string]: p }}
      >
        <span className="hold__ring" aria-hidden="true" />
        {launched ? '¡En camino a Marte!' : label}
      </button>
      {flight &&
        createPortal(
          <div
            className={`hold-flight hold-flight--${variant}`}
            aria-hidden="true"
            style={{ left: flight.left, top: flight.top, width: flight.width, height: flight.height, ['--dist' as string]: `${flight.top + flight.height + 160}px` }}
            onAnimationEnd={(e) => e.target === e.currentTarget && setFlight(null)}
          >
            <span className="hold-flight__trail" />
            <RocketSvg p={1} className="hold-flight__rocket" />
          </div>,
          document.body,
        )}
    </div>
  );
}

/* ───────── Elegir (con mapa de dos sitios o tarjetas) ───────── */
function Choice({ prompt, options, bounce, bounceMin, variant, done, onDone, reduced }: ActProps & { prompt: ByMode; options: { id: string; label: string; correct: boolean; feedback: string }[]; bounce?: number; bounceMin?: boolean }) {
  const [pick, setPick] = useState<string | null>(done ? options.find((o) => o.correct)!.id : null);
  const [n, setN] = useState(done && bounce ? bounce : 0);
  const chosen = options.find((o) => o.id === pick);
  const choose = (id: string) => {
    if (done && pick) return;
    setPick(id);
    const o = options.find((x) => x.id === id)!;
    if (o.correct) {
      sound.success();
      onDone();
      if (bounce) {
        if (reduced) setN(bounce);
        else {
          let k = 0;
          const tick = () => {
            k++;
            setN(k);
            sound.bounce(1 + k * 0.05);
            if (k < bounce) setTimeout(tick, 60 + k * 4);
          };
          tick();
        }
      }
    } else sound.wrong();
  };
  return (
    <div className="act act--choice">
      <p className="act__q">{prompt[variant]}</p>
      {bounce ? (
        <div className="choice__map" aria-hidden="true">
          <svg viewBox="0 0 200 120">
            <defs>
              <radialGradient id="cmMars" cx="0.4" cy="0.35" r="0.7"><stop offset="0" stopColor="#e9a070" /><stop offset="0.7" stopColor="#b2522c" /><stop offset="1" stopColor="#5a2312" /></radialGradient>
            </defs>
            <circle cx="100" cy="60" r="56" fill="url(#cmMars)" className="choice__globe" />
            <path d="M54 50 Q80 40 100 52 T150 46" stroke="rgba(0,0,0,.18)" strokeWidth="5" fill="none" />
            {options.map((o, i) => {
              // posiciones artísticas fijas por sitio (no dependen del orden de las opciones)
              const [x, y] = PIN[o.id] ?? (i === 0 ? [138, 78] : [66, 50]);
              return (
                <g key={o.id} className={`choice__pin ${pick === o.id ? (o.correct ? 'is-right' : 'is-wrong') : ''}`} transform={`translate(${x} ${y})`}>
                  <circle r="7" />
                  <circle r="2.4" className="choice__pin-core" />
                  <text y="-11">{o.label}</text>
                </g>
              );
            })}
          </svg>
          {pick && chosen?.correct && <div className="choice__bounce" style={{ ['--n' as string]: n }}><span className="choice__ball" /> {bounceMin ? 'al menos ' : ''}<b>{n}</b> rebotes</div>}
          <small className="choice__note">Mapa artístico, no a escala</small>
        </div>
      ) : null}
      <div className="act__options" role="group" aria-label="Opciones">
        {options.map((o) => (
          <button key={o.id} type="button" data-sfx="custom" className={`act__opt ${pick === o.id ? (o.correct ? 'is-right' : 'is-wrong') : ''}`} onClick={() => choose(o.id)}>
            {o.label}
          </button>
        ))}
      </div>
      <p className="act__feedback" aria-live="polite">{chosen?.feedback}</p>
    </div>
  );
}

/* ───────── Arrastrar el rover por la ruta (deslizador accesible) ───────── */
function DragRoute({ waypoints, done, onDone }: ActProps & { waypoints: { id: string; label: string; fact: RoverFact }[] }) {
  const pathRef = useRef<SVGPathElement>(null);
  const svgRef = useRef<SVGSVGElement>(null);
  const [v, setV] = useState(done ? 1 : 0);
  const [pt, setPt] = useState({ x: 20, y: 100 });
  const reached = waypoints.filter((_, i) => v >= (i + 1) / waypoints.length - 0.001);
  const prevReached = useRef(reached.length);
  useEffect(() => {
    const path = pathRef.current;
    if (!path) return;
    const p = path.getPointAtLength(path.getTotalLength() * v);
    setPt({ x: p.x, y: p.y });
    if (reached.length > prevReached.current) {
      sound.stopArrive(reached.length + 2);
      if (reached.length === waypoints.length) {
        sound.success();
        onDone();
      }
    }
    prevReached.current = reached.length;
  }, [v]); // eslint-disable-line react-hooks/exhaustive-deps
  const fromPointer = (e: RPE) => {
    const svg = svgRef.current;
    const path = pathRef.current;
    if (!svg || !path) return;
    const r = svg.getBoundingClientRect();
    const x = ((e.clientX - r.left) / r.width) * 320;
    const y = ((e.clientY - r.top) / r.height) * 130;
    const L = path.getTotalLength();
    let best = 0;
    let bd = Infinity;
    for (let i = 0; i <= 80; i++) {
      const q = path.getPointAtLength((L * i) / 80);
      const d = (q.x - x) ** 2 + (q.y - y) ** 2;
      if (d < bd) (bd = d), (best = i / 80);
    }
    // no se puede saltar adelante más de un tramo de golpe
    setV((cur) => Math.max(cur, Math.min(best, cur + 0.2)));
  };
  const drag = useRef(false);
  const last = reached[reached.length - 1];
  return (
    <div className="act act--route">
      <svg ref={svgRef} viewBox="0 0 320 130" className="route__map" onPointerDown={(e) => ((drag.current = true), e.currentTarget.setPointerCapture(e.pointerId), fromPointer(e))} onPointerMove={(e) => drag.current && fromPointer(e)} onPointerUp={() => (drag.current = false)}>
        <path d="M20 100 C70 96 80 40 130 36 S190 70 210 78 S270 96 300 70" className="route__trail" />
        <path ref={pathRef} d="M20 100 C70 96 80 40 130 36 S190 70 210 78 S270 96 300 70" className="route__done" pathLength={1} style={{ strokeDasharray: `${v} 1` }} />
        <g className="route__start"><circle cx="20" cy="100" r="5" /><text x="20" y="120">Aterrizaje</text></g>
        {waypoints.map((w, i) => {
          const pos = [[130, 36], [210, 78], [300, 70]][i] ?? [0, 0];
          return (
            <g key={w.id} className={`route__wp ${reached.includes(w) ? 'is-on' : ''}`}>
              <circle cx={pos[0]} cy={pos[1]} r="8" />
              <text x={pos[0]} y={pos[1] - 14}>{w.label}</text>
            </g>
          );
        })}
        <g transform={`translate(${pt.x - 16} ${pt.y - 22})`} className="route__rover"><RoverGlyphMini /></g>
      </svg>
      <div
        className="route__slider"
        role="slider"
        tabIndex={0}
        aria-label="Avance de Spirit por su ruta"
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={Math.round(v * 100)}
        aria-valuetext={last ? `Llegó a ${last.label}` : 'En el lugar de aterrizaje'}
        onKeyDown={(e) => {
          if (e.key === 'ArrowRight' || e.key === 'ArrowUp') (e.preventDefault(), e.stopPropagation(), setV((c) => Math.min(1, +(c + 1 / waypoints.length / 2).toFixed(4))));
          if (e.key === 'End') (e.preventDefault(), e.stopPropagation(), setV(1));
        }}
      >
        <button type="button" className="act__chip" onClick={() => setV((c) => Math.min(1, Math.ceil((c + 0.01) * waypoints.length) / waypoints.length))} disabled={v >= 1}>
          Avanzar al siguiente punto →
        </button>
      </div>
      <p className="act__help">Arrastra el rover por el camino, o usa el botón o las flechas. Mapa artístico, no a escala.</p>
      {last && <div className="act__reveal" aria-live="polite"><strong>{last.label}</strong><FactBody f={last.fact} /></div>}
    </div>
  );
}
function RoverGlyphMini() {
  return (
    <svg width="32" height="22" viewBox="0 0 160 100" aria-hidden="true">
      <g fill="currentColor"><rect x="50" y="40" width="70" height="20" rx="4" /><rect x="20" y="34" width="130" height="8" rx="3" /><rect x="66" y="8" width="6" height="28" /><rect x="58" y="4" width="24" height="10" rx="3" /></g>
      {[36, 84, 132].map((x) => <circle key={x} cx={x} cy="82" r="13" fill="currentColor" />)}
    </svg>
  );
}

/* ───────── Colocar los módulos de ALSEP ───────── */
function Place({ items, done, onDone }: ActProps & { items: { id: string; label: string; slot: 'center' | 'side' | 'ring'; fact: RoverFact }[] }) {
  const [placed, setPlaced] = useState<string[]>(done ? items.map((x) => x.id) : []);
  const [sel, setSel] = useState<string | null>(null);
  const [msg, setMsg] = useState('');
  const [last, setLast] = useState<RoverFact | null>(null);
  const slotRefs = useRef<Record<string, SVGGElement | null>>({});
  const put = (id: string, slot: string) => {
    const it = items.find((x) => x.id === id)!;
    if (it.slot !== slot) {
      sound.wrong();
      setMsg(`Ese no es el lugar de «${it.label}». Prueba otro.`);
      return;
    }
    const next = [...placed, id];
    setPlaced(next);
    setSel(null);
    setMsg('');
    setLast(it.fact);
    sound.snap();
    if (next.length === items.length) {
      sound.success();
      onDone();
    }
  };
  const drag = useDrag((id, x, y) => {
    for (const [slot, el] of Object.entries(slotRefs.current)) {
      const r = el?.getBoundingClientRect();
      if (r && x > r.left - 10 && x < r.right + 10 && y > r.top - 10 && y < r.bottom + 10) return put(id, slot);
    }
  });
  const slotFor = (s: string) => items.find((x) => x.slot === s)!;
  const SLOTS: { slot: 'center' | 'side' | 'ring'; x: number; y: number }[] = [
    { slot: 'center', x: 160, y: 70 },
    { slot: 'side', x: 104, y: 92 },
    { slot: 'ring', x: 236, y: 46 },
  ];
  return (
    <div className="act act--place">
      <svg viewBox="0 0 320 140" className="place__site">
        <ellipse cx="160" cy="74" rx="150" ry="58" className="place__ground" />
        {placed.includes('central') && SLOTS.filter((s) => s.slot !== 'center' && placed.includes(slotFor(s.slot).id)).map((s) => <path key={s.slot} d={`M160 70 Q${(160 + s.x) / 2} ${Math.max(70, s.y) + 18} ${s.x} ${s.y}`} className="place__cable" />)}
        {SLOTS.map((s) => {
          const it = slotFor(s.slot);
          const on = placed.includes(it.id);
          return (
            <g
              key={s.slot}
              ref={(el) => {
                slotRefs.current[s.slot] = el;
              }}
              className={`place__slot ${on ? 'is-on' : ''} ${sel ? 'is-armed' : ''}`}
              transform={`translate(${s.x} ${s.y})`}
              role="button"
              tabIndex={on || !sel ? -1 : 0}
              aria-label={on ? `${it.label} colocado` : `Hueco ${s.slot === 'center' ? 'central' : s.slot === 'side' ? 'junto a la estación' : 'alrededor'}`}
              onClick={() => sel && !on && put(sel, s.slot)}
              onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ') && sel && !on && (e.preventDefault(), put(sel, s.slot))}
            >
              <circle r="20" className="place__hole" />
              {on && <ModuleGlyph id={it.id} />}
              <text y="34">{on ? it.label : s.slot === 'center' ? 'centro' : s.slot === 'side' ? 'al lado' : 'alrededor'}</text>
            </g>
          );
        })}
      </svg>
      <div className="act__chips" role="group" aria-label="Módulos">
        {items.map((it) => (
          <button key={it.id} type="button" data-sfx="custom" aria-pressed={sel === it.id} className={`act__chip ${placed.includes(it.id) ? 'is-done' : ''} ${sel === it.id ? 'is-sel' : ''}`} disabled={placed.includes(it.id)} onClick={() => (sound.click(), setSel(sel === it.id ? null : it.id))} {...drag(it.id)}>
            {placed.includes(it.id) ? '✓ ' : ''}{it.label}
          </button>
        ))}
      </div>
      <p className="act__help">Elige un módulo y toca su hueco, o arrástralo. Disposición ilustrativa, no a escala.</p>
      <p className="act__feedback" aria-live="polite">{msg}</p>
      {last && <div className="act__reveal" aria-live="polite"><strong>{last.label}</strong><FactBody f={last} /></div>}
    </div>
  );
}
function ModuleGlyph({ id }: { id: string }) {
  if (id === 'central') return <g className="mod"><rect x="-13" y="-8" width="26" height="14" rx="2" /><path d="M0 -8 V-20 M-7 -22 Q0 -14 7 -22" /></g>;
  if (id === 'rtg') return <g className="mod"><rect x="-6" y="-12" width="12" height="20" rx="3" />{[-10, -4, 2].map((y) => <path key={y} d={`M-11 ${y} H11`} />)}</g>;
  return <g className="mod"><path d="M-9 6 L0 -12 L9 6Z" /><circle cy="-2" r="3" /></g>;
}

/* ───────── Conectar la red sísmica ───────── */
function Network({ sites, hub, done, onDone }: ActProps & { hub?: string; sites: { id: string; label: string; x: number; y: number }[] }) {
  const [on, setOn] = useState<string[]>(done ? sites.map((s) => s.id) : []);
  const tap = (id: string) => {
    if (on.includes(id)) return;
    const next = [...on, id];
    setOn(next);
    sound.beep(700 + next.length * 160);
    if (next.length === sites.length) {
      sound.success();
      onDone();
    }
  };
  const lit = sites.filter((s) => on.includes(s.id));
  const all = on.length === sites.length;
  const site = (s: { id: string; label: string; x: number; y: number }) => (
    <g key={s.id} className={`net__site ${on.includes(s.id) ? 'is-on' : ''}`} transform={`translate(${s.x * 200} ${s.y * 200})`} role="button" tabIndex={0} aria-pressed={on.includes(s.id)} aria-label={hub ? `Conectar: ${s.label}` : `Sismómetro de ${s.label}`} onClick={() => tap(s.id)} onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ') && (e.preventDefault(), tap(s.id))}>
      <circle r={hub ? 16 : 13} className="net__hit" />
      <circle r="6" className="net__dot" />
      <text y={hub && s.y > 0.5 ? 19 : -11}>{hub ? s.label : s.label.replace('Apollo ', 'A')}</text>
    </g>
  );
  return (
    <div className={`act act--network ${hub ? 'act--hub' : ''} ${all ? 'is-all' : ''}`}>
      <svg viewBox="0 0 200 200" className="net__moon">
        <defs>
          <radialGradient id="netMoon" cx="0.42" cy="0.38" r="0.7"><stop offset="0" stopColor="#e9e5dc" /><stop offset="0.7" stopColor="#a19c92" /><stop offset="1" stopColor="#4d4a45" /></radialGradient>
        </defs>
        {hub ? (
          <>
            <ellipse cx="100" cy="104" rx="96" ry="88" fill="url(#netMoon)" className="net__disk" />
            {[[40, 150, 9], [160, 40, 7], [150, 160, 6], [52, 46, 5]].map(([x, y, r], i) => <ellipse key={i} cx={x} cy={y} rx={r} ry={r * 0.6} className="net__mare" />)}
            {lit.map((a) => <line key={a.id} x1="100" y1="100" x2={a.x * 200} y2={a.y * 200} className="net__link net__link--cable" />)}
            <g className={`net__hub ${all ? 'is-all' : ''}`} transform="translate(100 100)" aria-hidden="true">
              <circle r="22" className="net__hubglow" />
              <rect x="-13" y="-9" width="26" height="18" rx="2" className="net__hubbox" />
              <path d="M0 -9 V-20 M-6 -20 H6" className="net__hubant" />
              <text y="26">{hub}</text>
            </g>
            {sites.map(site)}
          </>
        ) : (
          <>
            <circle cx="100" cy="100" r="90" fill="url(#netMoon)" className="net__disk" />
            {[[70, 70, 16], [128, 120, 10], [60, 132, 8], [140, 66, 12]].map(([x, y, r], i) => <ellipse key={i} cx={x} cy={y} rx={r} ry={r * 0.8} className="net__mare" />)}
            {lit.map((a, i) => lit.slice(i + 1).map((b) => <line key={a.id + b.id} x1={a.x * 200} y1={a.y * 200} x2={b.x * 200} y2={b.y * 200} className="net__link" />))}
            {sites.map(site)}
          </>
        )}
      </svg>
      <svg viewBox="0 0 300 40" className="net__seis" aria-hidden="true">
        <path d={seis(on.length)} />
      </svg>
      <p className="act__help" aria-live="polite">
        {hub
          ? all
            ? `Estación lista: ${sites.length} instrumentos conectados. Disposición ilustrativa.`
            : `Toca cada instrumento (${on.length}/${sites.length}). Disposición ilustrativa, no a escala.`
          : all
            ? 'Red conectada.'
            : `Toca los sismómetros (${on.length}/${sites.length}). Posiciones ilustrativas.`}
      </p>
    </div>
  );
}
function seis(k: number) {
  let d = 'M0 20';
  for (let x = 0; x <= 300; x += 3) d += ` L${x} ${20 + Math.sin(x * 0.35) * Math.sin(x * 0.05) * (2 + k * 3.2) * (x > 120 && x < 200 ? 1.6 : 0.5)}`;
  return d;
}

/* ───────── Apagar las estaciones (1977) ───────── */
function Switches({ stations, done, onDone }: ActProps & { stations: string[] }) {
  const [off, setOff] = useState<string[]>(done ? stations : []);
  const flip = (s: string) => {
    if (off.includes(s)) return;
    const next = [...off, s];
    setOff(next);
    sound.powerDown();
    if (next.length === stations.length) onDone();
  };
  const all = off.length === stations.length;
  return (
    <div className="act act--switch">
      <div className="sw__panel" role="group" aria-label="Instrumentos de la estación ALSEP de Apollo 12">
        {stations.map((s) => (
          <button key={s} type="button" data-sfx="custom" role="switch" aria-checked={!off.includes(s)} className={`sw ${off.includes(s) ? 'is-off' : ''}`} onClick={() => flip(s)}>
            <span className="sw__lamp" aria-hidden="true" />
            <span className="sw__name">{s}</span>
            <span className="sw__state">{off.includes(s) ? 'Apagado' : 'Encendido'}</span>
          </button>
        ))}
      </div>
      <p className="act__help" aria-live="polite">{all ? 'Estación apagada · 30 de septiembre de 1977.' : `Toca cada instrumento para apagarlo (${off.length}/${stations.length}).`}</p>
    </div>
  );
}

/* ───────── utilidades: arrastrar fichas con puntero (complemento del toque/teclado) ───────── */
function useDrag(onDrop: (id: string, x: number, y: number) => void) {
  const st = useRef<{ id: string; el: HTMLElement; x0: number; y0: number; moved: boolean } | null>(null);
  return (id: string) => ({
    onPointerDown: (e: RPE<HTMLElement>) => {
      if (e.pointerType === 'mouse' && e.button !== 0) return;
      st.current = { id, el: e.currentTarget, x0: e.clientX, y0: e.clientY, moved: false };
      e.currentTarget.setPointerCapture(e.pointerId);
    },
    onPointerMove: (e: RPE<HTMLElement>) => {
      const s = st.current;
      if (!s) return;
      const dx = e.clientX - s.x0;
      const dy = e.clientY - s.y0;
      if (!s.moved && Math.hypot(dx, dy) < 8) return;
      s.moved = true;
      s.el.style.transform = `translate(${dx}px, ${dy}px) scale(1.06)`;
      s.el.classList.add('is-dragging');
    },
    onPointerUp: (e: RPE<HTMLElement>) => {
      const s = st.current;
      st.current = null;
      if (!s) return;
      s.el.style.transform = '';
      s.el.classList.remove('is-dragging');
      if (s.moved) {
        e.preventDefault();
        onDrop(s.id, e.clientX, e.clientY);
        // evita que el clic posterior coloque la pieza otra vez
        const block = (ev: Event) => (ev.stopPropagation(), ev.preventDefault());
        s.el.addEventListener('click', block, { capture: true, once: true });
        setTimeout(() => s.el.removeEventListener('click', block, { capture: true }), 50);
      }
    },
    onPointerCancel: () => {
      if (st.current) st.current.el.style.transform = '';
      st.current = null;
    },
  });
}

/* ───────── Encontrar el equipo abandonado (escena artística, tocar cada pieza) ───────── */
function Find({ items, done, onDone }: ActProps & { items: { id: string; label: string; x: number; y: number; fact?: RoverFact }[] }) {
  const [found, setFound] = useState<string[]>(done ? items.map((x) => x.id) : []);
  const [last, setLast] = useState<string | null>(null);
  const tap = (id: string) => {
    if (found.includes(id)) return;
    const next = [...found, id];
    setFound(next);
    setLast(id);
    sound.beep(700 + next.length * 160);
    if (next.length === items.length) {
      sound.success();
      onDone();
    }
  };
  const all = found.length === items.length;
  const lastItem = items.find((x) => x.id === last);
  return (
    <div className={`act act--find ${all ? 'is-all' : ''}`}>
      <div className="find__scene">
        <svg viewBox="0 0 300 150" aria-hidden="true" className="find__art">
          <defs>
            <linearGradient id="findSky" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#d9a27c" /><stop offset="1" stopColor="#f0c9a2" /></linearGradient>
          </defs>
          <rect width="300" height="150" fill="url(#findSky)" />
          <path d="M0 70 Q60 58 120 66 T300 62 V150 H0Z" fill="#b8693f" />
          <path d="M0 96 Q80 84 160 92 T300 90 V150 H0Z" fill="#a0552f" />
          <ellipse cx="150" cy="128" rx="120" ry="10" fill="rgba(0,0,0,.12)" />
          {/* módulo de aterrizaje: pétalos abiertos */}
          <g transform="translate(66 96)" className="find__obj">
            <path d="M-26 6 L-8 -6 L8 -6 L26 6 Z" fill="#8b8f99" stroke="#3b3e46" strokeWidth="1.2" />
            <path d="M-8 -6 L0 -18 L8 -6Z" fill="#a7abb4" stroke="#3b3e46" strokeWidth="1.2" />
          </g>
          {/* paracaídas sobre la cubierta trasera */}
          <g transform="translate(150 66)" className="find__obj">
            <path d="M-18 6 Q0 -14 18 6 Z" fill="#f2efe6" stroke="#7d6f5c" strokeWidth="1" />
            <path d="M-6 6 L-2 12 L2 12 L6 6" fill="#6f6a62" />
          </g>
          {/* escudo térmico desechado */}
          <g transform="translate(222 100)" className="find__obj">
            <ellipse rx="14" ry="5" fill="#6c4a35" stroke="#2f2018" strokeWidth="1" />
          </g>
          {/* roca metálica */}
          <g transform="translate(264 118)" className="find__obj"><circle r="5" fill="#4b4c52" stroke="#1f2024" strokeWidth="1" /></g>
          {/* huellas de Opportunity */}
          <path d="M10 140 Q90 120 150 128 T296 112" stroke="rgba(60,30,15,.35)" strokeWidth="3" strokeDasharray="2 3" fill="none" />
        </svg>
        {items.map((it) => (
          <button
            key={it.id}
            type="button"
            data-sfx="custom"
            className={`find__spot ${found.includes(it.id) ? 'is-found' : ''}`}
            style={{ left: `${it.x * 100}%`, top: `${it.y * 100}%` }}
            aria-pressed={found.includes(it.id)}
            aria-label={found.includes(it.id) ? `${it.label}: encontrado` : `Buscar aquí (${items.indexOf(it) + 1} de ${items.length})`}
            onClick={() => tap(it.id)}
          >
            <span className="find__ring" aria-hidden="true" />
            {found.includes(it.id) && <span className="find__tag">{it.label}</span>}
          </button>
        ))}
      </div>
      <p className="act__help" aria-live="polite">
        {lastItem?.fact ? lastItem.fact.value : all ? 'Encontraste todo el equipo que quedó atrás.' : `Toca los puntos brillantes (${found.length}/${items.length}). Escena artística, no a escala.`}
      </p>
    </div>
  );
}

/* ───────── Última transmisión a Opportunity (12 feb 2019) ───────── */
function Song({ done, onDone, reduced }: ActProps) {
  const [phase, setPhase] = useState<'idle' | 'sending' | 'sent'>(done ? 'sent' : 'idle');
  const send = () => {
    if (phase !== 'idle') return;
    sound.farewell(9);
    if (reduced) {
      setPhase('sent');
      onDone();
      return;
    }
    setPhase('sending');
    setTimeout(() => {
      setPhase('sent');
      onDone();
    }, 2600);
  };
  return (
    <div className={`act act--song is-${phase}`}>
      <svg viewBox="0 0 300 110" className="song__art" aria-hidden="true">
        <defs>
          <radialGradient id="songE" cx="0.4" cy="0.35" r="0.7"><stop offset="0" stopColor="#9fd3ff" /><stop offset="0.65" stopColor="#2f6fb8" /><stop offset="1" stopColor="#0b2a55" /></radialGradient>
          <radialGradient id="songM" cx="0.4" cy="0.35" r="0.7"><stop offset="0" stopColor="#e9a070" /><stop offset="0.7" stopColor="#b2522c" /><stop offset="1" stopColor="#5a2312" /></radialGradient>
        </defs>
        <circle cx="40" cy="58" r="24" fill="url(#songE)" />
        <path d="M30 34 l10 -14 l10 14" className="song__dish" />
        <circle cx="262" cy="58" r="16" fill="url(#songM)" />
        <circle cx="262" cy="58" r="22" className="song__storm" />
        <path d="M66 58 Q150 22 238 58" className="song__path" />
        {phase !== 'idle' && <circle r="5" className="song__pulse"><animateMotion dur={reduced ? '0.01s' : '2.6s'} fill="freeze" path="M66 58 Q150 22 238 58" /></circle>}
        {phase === 'sent' && (
          <g className="song__notes">
            <text x="120" y="30">♪</text>
            <text x="150" y="22">♫</text>
            <text x="180" y="30">♪</text>
          </g>
        )}
        <text x="40" y="100" className="song__lbl">Goldstone · Tierra</text>
        <text x="262" y="100" className="song__lbl">Opportunity · Marte</text>
      </svg>
      {phase === 'idle' ? (
        <button type="button" data-sfx="custom" className="song__btn act__opt" onClick={send}>
          ▶ Enviar la última transmisión
        </button>
      ) : (
        <p className="song__state" aria-live="polite">{phase === 'sending' ? 'Transmitiendo…' : 'Transmisión enviada. No hubo respuesta.'}</p>
      )}
      <p className="act__help">
        La canción real tiene derechos de autor: ECOS no la reproduce ni la aloja. Si el sonido está activado, suena sólo un ambiente suave creado por código. Representación artística, no a escala.
      </p>
    </div>
  );
}

/* ───────── Escuchar un sismo lunar (sonido y sismograma ilustrativos) ───────── */
function Quake({ done, onDone, reduced }: ActProps) {
  const [k, setK] = useState(done ? 1 : 0);
  const [run, setRun] = useState(false);
  const raf = useRef(0);
  useEffect(() => () => cancelAnimationFrame(raf.current), []);
  const play = () => {
    if (run) return;
    sound.moonquake(6);
    if (reduced) {
      setK(1);
      onDone();
      return;
    }
    setRun(true);
    const t0 = performance.now();
    const step = (t: number) => {
      const u = Math.min(1, (t - t0) / 5200);
      setK(u);
      if (u < 1) raf.current = requestAnimationFrame(step);
      else {
        setRun(false);
        onDone();
      }
    };
    raf.current = requestAnimationFrame(step);
  };
  // sismograma: crece unos «7 minutos» y se apaga muy despacio (forma ilustrativa)
  const N = 220;
  let d = 'M0 40';
  for (let i = 0; i <= N * k; i++) {
    const x = (i / N) * 300;
    const tt = i / N;
    const env = tt < 0.12 ? tt / 0.12 : Math.exp(-(tt - 0.12) * 3.2);
    const y = 40 + Math.sin(i * 1.7) * Math.sin(i * 0.23 + 1) * 30 * env + Math.sin(i * 3.1) * 3 * env;
    d += ` L${x.toFixed(1)} ${y.toFixed(1)}`;
  }
  return (
    <div className={`act act--quake ${run ? 'is-run' : ''}`}>
      <div className="quake__screen">
        <svg viewBox="0 0 300 80" aria-hidden="true">
          {[0, 1, 2, 3, 4, 5, 6].map((i) => <line key={i} x1={i * 50} y1="0" x2={i * 50} y2="80" className="quake__grid" />)}
          <line x1="0" y1="40" x2="300" y2="40" className="quake__grid" />
          <path d={d} className="quake__trace" />
        </svg>
        <div className="quake__axis" aria-hidden="true"><span>impacto</span><span>tiempo →</span></div>
      </div>
      <button type="button" data-sfx="custom" className="quake__btn act__opt" onClick={play} disabled={run} aria-label="Reproducir el sismo lunar (recreación ilustrativa)">
        {k >= 1 ? '↻ Escuchar otra vez' : run ? 'Escuchando…' : '▶ Escuchar el impacto'}
      </button>
      <p className="act__help">Sonido y sismograma recreados por código: forma ilustrativa, no son los datos reales de ALSEP.</p>
    </div>
  );
}
