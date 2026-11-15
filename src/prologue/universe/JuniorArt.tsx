import type { PlaceId } from '../state/destinations';

/** Ilustraciones 2D (SVG) del universo Junior: planetas con carita, estilo cuento. */
export function JuniorPlanet({ place }: { place: PlaceId }) {
  if (place === 'luna')
    return (
      <svg viewBox="0 0 200 200" className="jr-planet" aria-hidden="true">
        <circle cx="100" cy="100" r="92" fill="#e9e2f5" />
        <path d="M100 8a92 92 0 0 1 0 184a120 120 0 0 0 0-184z" fill="#cfc4e6" />
        <circle cx="62" cy="58" r="16" fill="#d6cdea" />
        <circle cx="140" cy="70" r="10" fill="#d6cdea" />
        <circle cx="128" cy="146" r="18" fill="#c9bde2" />
        <circle cx="54" cy="132" r="9" fill="#d6cdea" />
        <g className="jr-face">
          <ellipse className="jr-eye" cx="80" cy="102" rx="7" ry="9" fill="#3d2a5c" />
          <ellipse className="jr-eye" cx="120" cy="102" rx="7" ry="9" fill="#3d2a5c" />
          <circle cx="66" cy="120" r="8" fill="#ffb3c7" opacity="0.6" />
          <circle cx="134" cy="120" r="8" fill="#ffb3c7" opacity="0.6" />
          <path d="M88 124 q12 12 24 0" stroke="#3d2a5c" strokeWidth="5" fill="none" strokeLinecap="round" />
        </g>
      </svg>
    );
  if (place === 'marte')
    return (
      <svg viewBox="0 0 200 200" className="jr-planet" aria-hidden="true">
        <circle cx="100" cy="100" r="92" fill="#ff7a3d" />
        <path d="M100 8a92 92 0 0 1 0 184a118 118 0 0 0 0-184z" fill="#e8592a" />
        <path d="M30 70 q30 -14 60 0 t60 2" stroke="#d94e24" strokeWidth="12" fill="none" strokeLinecap="round" />
        <path d="M44 150 q26 10 52 -2" stroke="#d94e24" strokeWidth="10" fill="none" strokeLinecap="round" />
        <ellipse cx="100" cy="14" rx="34" ry="9" fill="#fff4e8" />
        <circle cx="150" cy="120" r="10" fill="#d94e24" />
        <g className="jr-face">
          <ellipse className="jr-eye" cx="78" cy="100" rx="8" ry="10" fill="#4a1a0c" />
          <ellipse className="jr-eye" cx="122" cy="100" rx="8" ry="10" fill="#4a1a0c" />
          <circle cx="81" cy="96" r="2.5" fill="#fff" />
          <circle cx="125" cy="96" r="2.5" fill="#fff" />
          <circle cx="62" cy="120" r="9" fill="#ffb3a0" opacity="0.7" />
          <circle cx="138" cy="120" r="9" fill="#ffb3a0" opacity="0.7" />
          <path d="M86 122 q14 14 28 0" stroke="#4a1a0c" strokeWidth="5" fill="none" strokeLinecap="round" />
        </g>
      </svg>
    );
  return null;
}

/** Fondo ilustrado: cielo petróleo, colinas violeta, estrellitas y un cohete que pasea. */
export function JuniorBackdrop({ reducedMotion }: { reducedMotion: boolean }) {
  const stars = Array.from({ length: 46 }, (_, i) => ({ x: (i * 397) % 1600, y: (i * 211) % 700, s: 4 + (i % 4) * 2, d: (i % 7) * 0.6 }));
  return (
    <svg className="absolute inset-0 h-full w-full" viewBox="0 0 1600 900" preserveAspectRatio="xMidYMid slice" aria-hidden="true">
      <defs>
        <linearGradient id="jrSky" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#0a3440" />
          <stop offset="0.55" stopColor="#0f4c5c" />
          <stop offset="1" stopColor="#2b3e70" />
        </linearGradient>
      </defs>
      <rect width="1600" height="900" fill="url(#jrSky)" />
      <circle cx="1380" cy="140" r="180" fill="#13606f" opacity="0.55" />
      <circle cx="180" cy="760" r="260" fill="#13606f" opacity="0.35" />
      {stars.map((st, i) => (
        <path
          key={i}
          className="jr-twinkle"
          style={{ animationDelay: `${st.d}s` }}
          d={`M${st.x} ${st.y - st.s} Q${st.x} ${st.y} ${st.x + st.s} ${st.y} Q${st.x} ${st.y} ${st.x} ${st.y + st.s} Q${st.x} ${st.y} ${st.x - st.s} ${st.y} Q${st.x} ${st.y} ${st.x} ${st.y - st.s}Z`}
          fill="#ffe9b8"
        />
      ))}
      <path d="M0 800 Q300 730 620 790 T1220 780 T1600 750 V900 H0Z" fill="#5b2a86" />
      <path d="M0 850 Q420 800 900 850 T1600 840 V900 H0Z" fill="#3d1c5c" />
      {!reducedMotion && (
        <g>
          <g className="jr-rocket">
            <path d="M0 -14 C8 -6 8 8 4 14 H-4 C-8 8 -8 -6 0 -14Z" fill="#fff4e8" />
            <circle cy="-2" r="3.5" fill="#4fb7c9" />
            <path d="M-4 10 L-10 16 L-4 14Z M4 10 L10 16 L4 14Z" fill="#ff7a3d" />
            <path d="M-3 15 Q0 26 3 15Z" fill="#ffd27a" />
          </g>
        </g>
      )}
    </svg>
  );
}

/** Silueta de rover dibujada por código (genérica: mástil con cámara, paneles, seis ruedas). */
export function RoverGlyph({ className = '' }: { className?: string }) {
  return (
    <svg viewBox="0 0 160 100" className={className} aria-hidden="true">
      <g fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
        {/* paneles solares */}
        <path d="M18 44 L60 36 H112 L146 44 L112 50 H52 Z" fill="currentColor" fillOpacity="0.14" />
        <path d="M60 36 L52 50 M78 36 V50 M96 36 V50 M112 36 L112 50 M32 42 L40 47 M128 41 L124 48" strokeOpacity="0.55" strokeWidth="1.4" />
        {/* cuerpo */}
        <rect x="58" y="50" width="52" height="14" rx="2.5" fill="currentColor" fillOpacity="0.22" />
        {/* mástil y cabeza de cámara */}
        <path d="M70 36 V14" />
        <rect x="61" y="6" width="20" height="9" rx="2" fill="currentColor" fillOpacity="0.3" />
        <circle cx="66" cy="10.5" r="1.6" fill="currentColor" stroke="none" />
        <circle cx="76" cy="10.5" r="1.6" fill="currentColor" stroke="none" />
        {/* antena */}
        <path d="M100 36 V24" />
        <circle cx="100" cy="21" r="3" />
        {/* brazo */}
        <path d="M110 58 L124 64 L130 74" />
        {/* suspensión rocker-bogie */}
        <path d="M68 64 L58 75 L38 84 M58 75 L84 84 M100 64 L130 84" />
      </g>
      {[36, 84, 132].map((x, i) => (
        <g key={i}>
          <circle cx={x} cy="86" r="8" fill="currentColor" fillOpacity="0.12" stroke="currentColor" strokeWidth="2.2" />
          <circle cx={x} cy="86" r="2.4" fill="currentColor" />
        </g>
      ))}
    </svg>
  );
}
