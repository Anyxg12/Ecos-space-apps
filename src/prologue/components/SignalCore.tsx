/**
 * MASCOTA TEMPORAL — núcleo luminoso / señal holográfica abstracta.
 * Fijo en su sitio: todo se anima con CSS alrededor de su propio centro (transform-origin: 50% 50%),
 * sólo pulso y brillo; nada se desplaza.
 * Sustituir por la mascota oficial manteniendo esta API:
 *   <SignalCore state="idle" | "speaking" | "listening" size={px} reducedMotion />
 */
export type SignalCoreState = 'idle' | 'speaking' | 'listening';

export function SignalCore({ state = 'idle', size = 140, reducedMotion = false }: { state?: SignalCoreState; size?: number; reducedMotion?: boolean }) {
  return (
    <div
      className={`signal-core ${reducedMotion ? 'signal-core--still' : ''}`}
      style={{ width: size, height: size }}
      data-state={state}
      aria-hidden="true"
    >
      <span className="signal-core__wave" />
      <span className="signal-core__wave signal-core__wave--2" />
      <svg viewBox="0 0 100 100" className="signal-core__orbits">
        <circle cx="50" cy="50" r="46" fill="none" stroke="var(--accent, #ffb36b)" strokeOpacity="0.22" strokeWidth="0.6" />
        <ellipse cx="50" cy="50" rx="40" ry="13" fill="none" stroke="var(--accent, #ffb36b)" strokeOpacity="0.55" strokeWidth="0.7" strokeDasharray="2 3" />
        <ellipse cx="50" cy="50" rx="13" ry="40" fill="none" stroke="var(--accent, #ffb36b)" strokeOpacity="0.28" strokeWidth="0.6" />
      </svg>
      <span className="signal-core__glow" />
      <span className="signal-core__dot" />
    </div>
  );
}
