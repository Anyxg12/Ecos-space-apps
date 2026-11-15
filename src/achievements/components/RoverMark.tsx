/** Silueta genérica de rover dibujada por código (no es un plano real de Spirit). */
export function RoverMark({ className = '' }: { className?: string }) {
  return (
    <svg viewBox="0 0 160 100" className={className} aria-hidden="true">
      <g fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
        <path d="M18 44 L60 36 H112 L146 44 L112 50 H52 Z" fill="currentColor" fillOpacity="0.14" />
        <path d="M60 36 L52 50 M78 36 V50 M96 36 V50" strokeOpacity="0.55" strokeWidth="1.4" />
        <rect x="58" y="50" width="52" height="14" rx="2.5" fill="currentColor" fillOpacity="0.2" />
        <path d="M70 36 V14" />
        <rect x="61" y="6" width="20" height="9" rx="2" fill="currentColor" fillOpacity="0.3" />
        <path d="M100 36 V24" />
        <circle cx="100" cy="21" r="3" />
        <path d="M110 58 L124 64 L130 74" />
        <path d="M68 64 L58 75 L38 84 M58 75 L84 84 M100 64 L130 84" />
      </g>
      {[38, 84, 130].map((x) => (
        <g key={x}>
          <circle cx={x} cy="86" r="8" fill="currentColor" fillOpacity="0.12" stroke="currentColor" strokeWidth="2.4" />
          <circle cx={x} cy="86" r="2.4" fill="currentColor" />
        </g>
      ))}
    </svg>
  );
}
