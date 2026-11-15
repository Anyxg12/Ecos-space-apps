import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import './story.css';
import type { Story } from '../../../data/stories';
import type { AgeGroup } from '../../state/types';
import { useEcosHost } from '../../host';
import { sound } from '../../audio/soundEngine';
import { RouteScene } from './RouteScene';
import { ActivityView, ACT_LABEL } from './activities';
import { FactChips, FactBody, ExtraFacts, mainFacts } from './Facts';
import { StopIcon } from './StopIcon';
import { AnalogyChip } from './AnalogyChip';
import { SoundToggle } from '../../components/SoundToggle';

interface Props {
  story: Story;
  variant: AgeGroup;
  reducedMotion: boolean;
  onClose: () => void;
}

/**
 * Ruta narrativa inmersiva: la cámara avanza por un camino en perspectiva entre balizas (paradas).
 * Se navega con rueda/scroll, arrastre, teclado (← →), las balizas o los botones.
 * Vista de lista alternativa (accesible, sin animación). Funciona sin WebGL (Canvas 2D) y,
 * si tampoco hay Canvas 2D, muestra un fondo CSS.
 */
export function StoryRoute({ story, variant, reducedMotion, onClose }: Props) {
  const host = useEcosHost();
  const N = story.stops.length; // índice N = legado
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const sceneRef = useRef<RouteScene | null>(null);
  const [noCanvas, setNoCanvas] = useState(false);
  const [idx, setIdx] = useState(0);
  const [moving, setMoving] = useState(false);
  const target = useRef(0);
  const pos = useRef(0);
  const [doneActs, setDoneActs] = useState<Set<string>>(() => new Set());
  const [listView, setListView] = useState(false);
  /** Móvil: la tarjeta es una hoja inferior que se puede minimizar para ver el paisaje. */
  const [sheetMin, setSheetMin] = useState(false);
  const [finished, setFinished] = useState(false);
  const [newStars, setNewStars] = useState<string[]>([]);
  const headRef = useRef<HTMLHeadingElement>(null);
  const firstFocus = useRef(true);

  const labels = useMemo(() => [...story.stops.map((s) => s.title[variant]), story.legacy.title[variant]], [story, variant]);

  // la parada con actividad obligatoria pendiente limita el avance
  const maxIdx = useMemo(() => {
    const g = story.stops.findIndex((s) => s.gate && !doneActs.has(s.id) && !(s.star && host?.isUnlocked(s.star)));
    return g === -1 ? N : g;
  }, [story, doneActs, host, N]);

  const unlock = useCallback(
    (star?: string) => {
      if (!star || !host || host.isUnlocked(star)) return;
      host.unlock(star);
      setNewStars((s) => (s.includes(star) ? s : [...s, star]));
    },
    [host],
  );

  const go = useCallback(
    (i: number) => {
      const j = Math.max(0, Math.min(maxIdx, i));
      // al dejar atrás paradas con estrella, se encienden (sin duplicar)
      for (let k = 0; k < j; k++) {
        const s = story.stops[k];
        if (s.star && (!s.gate || doneActs.has(s.id) || host?.isUnlocked(s.star))) unlock(s.star);
      }
      dragSt.current = null;
      target.current = j;
    },
    [maxIdx, story, doneActs, host, unlock],
  );

  // escena canvas
  useLayoutEffect(() => {
    if (listView || !canvasRef.current) return;
    let sc: RouteScene;
    try {
      sc = new RouteScene(canvasRef.current, { place: story.place, variant, count: N + 1, labels, sets: [...story.stops.map((x) => x.icon), story.place === 'marte' ? 'rover' : 'station'], reduced: reducedMotion });
    } catch {
      setNoCanvas(true);
      return;
    }
    sceneRef.current = sc;
    sc.pos = pos.current;
    sc.active = Math.round(pos.current);
    let raf = 0;
    let lastT = performance.now();
    let settled = 0;
    let lastIdx = Math.round(pos.current);
    // tránsito con duración fija (independiente de los FPS): la cámara viaja de una parada a otra
    let anim = { from: pos.current, to: target.current, t0: performance.now(), dur: 1 };
    const ease = (u: number) => (u < 0.5 ? 4 * u * u * u : 1 - Math.pow(-2 * u + 2, 3) / 2);
    const frame = (t: number) => {
      const dt = Math.min(0.1, (t - lastT) / 1000);
      lastT = t;
      if (anim.to !== target.current) {
        const dist = Math.abs(target.current - pos.current);
        anim = { from: pos.current, to: target.current, t0: t, dur: dragSt.current ? 140 : Math.min(1700, 700 + dist * 420) };
      }
      if (reducedMotion) pos.current = target.current;
      else {
        const u = Math.min(1, (t - anim.t0) / anim.dur);
        pos.current = anim.from + (anim.to - anim.from) * (dragSt.current ? u : ease(u));
      }
      if (Math.abs(target.current - pos.current) < 0.002) pos.current = target.current;
      sc.pos = pos.current;
      const near = Math.round(pos.current);
      sc.active = near;
      const isMoving = Math.abs(target.current - pos.current) > 0.12;
      if (near !== lastIdx && !isMoving) {
        lastIdx = near;
      }
      setMoving((m) => (m !== isMoving ? isMoving : m));
      if (!isMoving) setIdx((cur) => (cur !== Math.round(target.current) ? Math.round(target.current) : cur));
      sc.draw(reducedMotion ? 0 : dt);
      settled = isMoving ? 0 : settled + dt;
      raf = requestAnimationFrame(frame);
    };
    raf = requestAnimationFrame(frame);
    const ro = new ResizeObserver(() => sc.resize());
    ro.observe(canvasRef.current);
    const vis = () => {
      cancelAnimationFrame(raf);
      if (!document.hidden) raf = requestAnimationFrame(frame);
    };
    document.addEventListener('visibilitychange', vis);
    return () => {
      cancelAnimationFrame(raf);
      ro.disconnect();
      document.removeEventListener('visibilitychange', vis);
      sceneRef.current = null;
    };
  }, [listView, story, variant, N, labels, reducedMotion]);

  // estado de las balizas
  useEffect(() => {
    const sc = sceneRef.current;
    if (!sc) return;
    sc.done = new Set(story.stops.map((s, i) => (doneActs.has(s.id) || i < idx ? i : -1)).filter((i) => i >= 0));
  }, [doneActs, idx, story]);

  // sonido y foco al llegar a una parada
  useEffect(() => {
    sound.stopArrive(idx);
    if (firstFocus.current) {
      firstFocus.current = false;
      return;
    }
    headRef.current?.focus({ preventScroll: true });
  }, [idx]);

  // rueda / scroll → avanzar entre paradas (con «imán» a la parada más cercana)
  const wheelAcc = useRef(0);
  const wheelT = useRef(0);
  const onWheel = (e: React.WheelEvent) => {
    if ((e.target as HTMLElement).closest('.sr__panel')) return;
    // La tarjeta se oculta (sin eventos) mientras la cámara viaja: si el usuario hace scroll para leerla,
    // la rueda caía sobre el paisaje y movía la ruta (adelante o, al subir, de vuelta a la parada anterior).
    // Se ignora la rueda sobre el área de la tarjeta y mientras la cámara está en movimiento.
    const panel = (e.currentTarget as HTMLElement).parentElement?.querySelector('.sr__panel');
    const pr = panel?.getBoundingClientRect();
    if (pr && e.clientX >= pr.left && e.clientX <= pr.right && e.clientY >= pr.top && e.clientY <= pr.bottom) return;
    if (Math.abs(target.current - pos.current) > 0.05) {
      wheelAcc.current = 0;
      wheelT.current = performance.now();
      return;
    }
    wheelAcc.current += e.deltaY + e.deltaX;
    const now = performance.now();
    if (Math.abs(wheelAcc.current) > 60 && now - wheelT.current > 450) {
      wheelT.current = now;
      const dir = Math.sign(wheelAcc.current);
      wheelAcc.current = 0;
      if (Math.round(target.current) + dir > maxIdx && dir > 0) {
        nudge();
        return;
      }
      sound.whoosh();
      go(Math.round(target.current) + dir);
    }
  };
  // arrastre en el paisaje
  const dragSt = useRef<{ x: number; y: number; t0: number; base: number } | null>(null);
  const [blocked, setBlocked] = useState(false);
  const nudge = () => {
    setBlocked(true);
    setTimeout(() => setBlocked(false), 1600);
  };
  const onDown = (e: React.PointerEvent) => {
    if (e.button !== 0) return;
    // captura: el «soltar» siempre llega aquí aunque el puntero acabe sobre la tarjeta o fuera de la ventana.
    // Sin esto, un arrastre que terminaba sobre la tarjeta dejaba el arrastre «vivo» y, al mover el ratón
    // después de pulsar «Continuar», la cámara volvía a la parada anterior.
    try {
      e.currentTarget.setPointerCapture(e.pointerId);
    } catch {
      /* puntero ya liberado */
    }
    dragSt.current = { x: e.clientX, y: e.clientY, t0: performance.now(), base: target.current };
  };
  const onMove = (e: React.PointerEvent) => {
    const s = dragSt.current;
    if (!s) return;
    if (e.pointerType === 'mouse' && e.buttons === 0) {
      dragSt.current = null; // botón ya soltado: no es un arrastre
      return;
    }
    const dy = s.y - e.clientY;
    const dx = s.x - e.clientX;
    const d = Math.abs(dy) > Math.abs(dx) ? dy : dx;
    if (Math.abs(d) > 10) target.current = Math.max(0, Math.min(maxIdx, s.base + d / 260));
  };
  const onUp = (e: React.PointerEvent) => {
    const s = dragSt.current;
    dragSt.current = null;
    if (!s) return;
    const moved = Math.hypot(e.clientX - s.x, e.clientY - s.y);
    if (moved < 8) {
      // toque: ¿sobre una baliza?
      const r = (e.currentTarget as HTMLElement).getBoundingClientRect();
      const hit = sceneRef.current?.hitTest(e.clientX - r.left, e.clientY - r.top);
      if (hit != null) {
        if (hit > maxIdx) nudge();
        else go(hit);
      }
      return;
    }
    const want = Math.round(target.current);
    if (want > maxIdx) nudge();
    sound.whoosh();
    go(want);
  };

  // teclado global (fuera de controles)
  useEffect(() => {
    const k = (e: KeyboardEvent) => {
      const el = e.target as HTMLElement;
      if (e.key === 'Escape') {
        e.stopPropagation();
        onClose();
        return;
      }
      if (listView || el.closest('input, textarea, [role="slider"], .act')) return;
      if (e.key === 'ArrowRight' || e.key === 'PageDown') {
        e.preventDefault();
        if (Math.round(target.current) + 1 > maxIdx) nudge();
        else (sound.whoosh(), go(Math.round(target.current) + 1));
      } else if (e.key === 'ArrowLeft' || e.key === 'PageUp') {
        e.preventDefault();
        sound.whoosh();
        go(Math.round(target.current) - 1);
      }
    };
    window.addEventListener('keydown', k, true);
    return () => window.removeEventListener('keydown', k, true);
  }, [go, maxIdx, onClose, listView]);

  const actDone = (id: string) => setDoneActs((s) => (s.has(id) ? s : new Set(s).add(id)));

  const complete = () => {
    // vista de lista: se encienden las estrellas de las paradas superadas
    story.stops.forEach((s) => s.star && (!s.gate || doneActs.has(s.id) || host?.isUnlocked(s.star)) && unlock(s.star));
    unlock(story.legacy.star);
    sound.chime(true);
    setFinished(true);
  };

  const stop = idx < N ? story.stops[idx] : null;
  const gatePending = stop?.gate && !doneActs.has(stop.id) && !(stop.star && host?.isUnlocked(stop.star));
  const allGatesOk = story.stops.every((s) => !s.gate || doneActs.has(s.id) || (s.star && host?.isUnlocked(s.star)));

  return (
    <div className={`sr sr--${variant} sr--${story.place} ${moving ? 'is-moving' : ''} ${listView ? 'is-list' : ''} ${reducedMotion ? 'is-reduced' : ''}`} role="dialog" aria-modal="true" aria-labelledby="sr-title" data-story={story.id} data-stop={idx}>
      {!listView && (
        <div className="sr__world" onWheel={onWheel} onPointerDown={onDown} onPointerMove={onMove} onPointerUp={onUp} onPointerCancel={() => (dragSt.current = null)} onLostPointerCapture={() => (dragSt.current = null)}>
          {!noCanvas ? <canvas ref={canvasRef} className="sr__canvas" aria-hidden="true" /> : <div className="sr__cssbg" aria-hidden="true" />}
          <div className="sr__vignette" aria-hidden="true" />
        </div>
      )}

      <header className="sr__top">
        <button type="button" className="sr__back" onClick={onClose}>
          <span aria-hidden="true">←</span> {story.backLabel[variant]}
        </button>
        <h2 id="sr-title" className="sr__title">{story.routeTitle[variant]}</h2>
        <div className="sr__tools">
          <span className="sr__prov">Contenido provisional</span>
          <button type="button" className="sr__tool" aria-pressed={listView} onClick={() => setListView((v) => !v)}>
            {listView ? 'Vista de ruta' : 'Vista de lista'}
          </button>
          <SoundToggle inline />
        </div>
      </header>

      {!listView && (
        <nav className="sr__pips" aria-label="Paradas de la ruta">
          <ol>
            {labels.map((l, i) => (
              <li key={i}>
                <button
                  type="button"
                  className={`sr__pip ${i === idx ? 'is-on' : ''} ${i < idx || (i < N && doneActs.has(story.stops[i].id)) ? 'is-done' : ''}`}
                  aria-current={i === idx ? 'step' : undefined}
                  disabled={i > maxIdx}
                  onClick={() => (sound.whoosh(), go(i))}
                  aria-label={`Parada ${i + 1}: ${l}${i > maxIdx ? ' (bloqueada: completa la actividad anterior)' : ''}`}
                >
                  <span aria-hidden="true">{i === N ? '★' : i + 1}</span>
                </button>
              </li>
            ))}
          </ol>
        </nav>
      )}

      {!listView && (
        <section className={`sr__panel ${moving ? 'is-hidden' : ''} ${sheetMin && !finished ? 'is-min' : ''}`} aria-live="polite" key={finished ? 'fin' : idx}>
          {!finished && (
            <button type="button" className="sr__grab" aria-expanded={!sheetMin} aria-label={sheetMin ? 'Mostrar la tarjeta completa' : 'Minimizar la tarjeta para ver el paisaje'} onClick={() => setSheetMin((v) => !v)}>
              <span aria-hidden="true" />
            </button>
          )}
          {stop ? (
            <>
              <div className="sr__kicker">
                <StopIcon icon={stop.icon} />
                <span>{stop.chapter} · {idx + 1}/{N}</span>
                {ACT_LABEL[stop.activity.kind] && <span className="sr__actlabel">{ACT_LABEL[stop.activity.kind]}</span>}
              </div>
              <h3 ref={headRef} tabIndex={-1} className="sr__h">{stop.title[variant]}</h3>
              <p className="sr__line">{stop.line[variant]}</p>
              {stop.activity.kind !== 'reveal' && (
                <ActivityView activity={stop.activity} variant={variant} reduced={reducedMotion} done={doneActs.has(stop.id) || !!(stop.star && stop.gate && host?.isUnlocked(stop.star))} onDone={() => actDone(stop.id)} />
              )}
              <FactChips facts={stop.facts} open={stop.activity.kind === 'reveal' && variant === 'discovery'} />
              <AnalogyChip storyId={story.id} fact={mainFacts(stop.facts)[0]} variant={variant} />
              <div className="sr__nav">
                <button type="button" className="sr__ghost" disabled={idx === 0} onClick={() => (sound.whoosh(), go(idx - 1))}>← Anterior</button>
                <button type="button" className="sr__cta" disabled={!!gatePending} onClick={() => (sound.whoosh(), go(idx + 1))}>
                  {gatePending ? 'Completa la actividad' : 'Continuar →'}
                </button>
              </div>
            </>
          ) : !finished ? (
            <>
              <div className="sr__kicker"><span className="sr__star" aria-hidden="true">★</span><span>Legado</span></div>
              <h3 ref={headRef} tabIndex={-1} className="sr__h">{story.legacy.title[variant]}</h3>
              <p className="sr__line">{story.legacy.line[variant]}</p>
              <FactChips facts={story.legacy.facts} />
              <AnalogyChip storyId={story.id} fact={mainFacts(story.legacy.facts)[0]} variant={variant} />
              <div className="sr__nav">
                <button type="button" className="sr__ghost" onClick={() => go(idx - 1)}>← Anterior</button>
                <button type="button" className="sr__cta" onClick={complete}>{story.legacy.completeLabel}</button>
              </div>
            </>
          ) : (
            <Done story={story} variant={variant} newStars={newStars} headRef={headRef} onClose={onClose} onReplay={() => (setFinished(false), (target.current = 0), (pos.current = reducedMotion ? 0 : pos.current), setIdx(0))} />
          )}
        </section>
      )}

      {!listView && blocked && <p className="sr__blocked" role="status">Completa la actividad de esta parada para seguir.</p>}
      {!listView && !moving && idx === 0 && !finished && <p className="sr__hint" aria-hidden="true">Desliza, arrastra o usa ← → para recorrer la ruta</p>}

      {listView && (
        <div className="sr__list">
          <p className="sr__listintro">Vista de lista: todas las paradas, sin animación. Los hechos enlazan a su fuente oficial.</p>
          <ol>
            {story.stops.map((s, i) => (
              <li key={s.id} className="sr__item">
                <p className="sr__kicker"><StopIcon icon={s.icon} /> {s.chapter} · {i + 1}/{N}</p>
                <h3 className="sr__h">{s.title[variant]}</h3>
                <p className="sr__line">{s.line[variant]}</p>
                {(s.activity.kind === 'choice' || s.activity.kind === 'audio') && (
                  <ActivityView activity={s.activity} variant={variant} reduced done={doneActs.has(s.id) || !!(s.star && s.gate && host?.isUnlocked(s.star))} onDone={() => actDone(s.id)} />
                )}
                {s.activity.kind === 'assemble' && <ListFacts facts={s.activity.parts.map((p) => p.fact)} />}
                {s.activity.kind === 'route' && <ListFacts facts={s.activity.waypoints.map((p) => p.fact)} />}
                {s.activity.kind === 'place' && <ListFacts facts={s.activity.items.map((p) => p.fact)} />}
                <ListFacts facts={s.facts} />
              </li>
            ))}
            <li className="sr__item">
              <p className="sr__kicker">★ Legado</p>
              <h3 className="sr__h">{story.legacy.title[variant]}</h3>
              <p className="sr__line">{story.legacy.line[variant]}</p>
              <ListFacts facts={story.legacy.facts} />
              {!finished ? (
                <>
                  <button type="button" className="sr__cta" disabled={!allGatesOk} onClick={complete}>{story.legacy.completeLabel}</button>
                  {!allGatesOk && <p className="sr__line"><small>Responde las preguntas de la lista para completar.</small></p>}
                </>
              ) : (
                <Done story={story} variant={variant} newStars={newStars} headRef={headRef} onClose={onClose} onReplay={() => setFinished(false)} />
              )}
            </li>
          </ol>
        </div>
      )}
    </div>
  );
}

function ListFacts({ facts }: { facts: import('../../../data/opportunityFacts').RoverFact[] }) {
  if (!facts.length) return null;
  const main = mainFacts(facts);
  return (
    <>
      {main.length > 0 && (
        <dl className="sr__lfacts">
          {main.map((f) => (
            <div key={f.id}>
              <dt>{f.label}</dt>
              <dd><FactBody f={f} /></dd>
            </div>
          ))}
        </dl>
      )}
      <ExtraFacts facts={facts} />
    </>
  );
}

function Done({ story, variant, newStars, headRef, onClose, onReplay }: { story: Story; variant: AgeGroup; newStars: string[]; headRef: React.RefObject<HTMLHeadingElement | null>; onClose: () => void; onReplay: () => void }) {
  const host = useEcosHost();
  useEffect(() => {
    headRef.current?.focus({ preventScroll: true });
  }, [headRef]);
  return (
    <div className="sr__done">
      <div className="sr__burst" aria-hidden="true">{Array.from({ length: 12 }, (_, i) => <i key={i} style={{ ['--a' as string]: `${i * 30}deg` }} />)}</div>
      <h3 ref={headRef} tabIndex={-1} className="sr__h">{story.legacy.doneTitle}</h3>
      <p className="sr__line" aria-live="polite">
        {newStars.length > 0
          ? `Se ${newStars.length === 1 ? 'encendió una estrella nueva' : `encendieron ${newStars.length} estrellas nuevas`} en Mis logros, y ganaste la insignia provisional «${story.legacy.badge}».`
          : 'Ya tenías estas estrellas en Mis logros. Repetir la ruta no suma puntos dos veces.'}
      </p>
      <div className="sr__nav">
        {host && <button type="button" className="sr__cta" onClick={host.openAchievements}>★ Ver Mis logros</button>}
        <button type="button" className="sr__ghost" onClick={onClose}>{story.backLabel[variant]}</button>
        <button type="button" className="sr__ghost" onClick={onReplay}>Repetir ruta</button>
      </div>
    </div>
  );
}
