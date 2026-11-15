import type { AgeGroup } from '../state/types';

/**
 * Superficie lunar dibujada por código (SVG), una por universo. Sin texturas ni fotos.
 * Representación artística: no reproduce ningún sitio Apollo concreto.
 */
export function MoonSurface({ variant }: { variant: AgeGroup }) {
  if (variant === 'junior') return <JuniorMoon />;
  if (variant === 'explorer') return <ExplorerMoon />;
  return <DiscoveryMoon />;
}

const STARS = Array.from({ length: 90 }, (_, i) => {
  const h = (n: number) => {
    const s = Math.sin(n * 91.7 + i * 13.3) * 43758.5453;
    return s - Math.floor(s);
  };
  return [h(1) * 1600, h(2) * 520, 0.6 + h(3) * 1.6, 0.3 + h(4) * 0.7] as const;
});

function JuniorMoon() {
  return (
    <svg className="mars-surface moon-surface" viewBox="0 0 1600 900" preserveAspectRatio="xMidYMid slice" aria-hidden="true">
      <defs>
        <linearGradient id="jlSky" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#082e3a" /><stop offset="1" stopColor="#1d6574" /></linearGradient>
        <filter id="jlWob"><feTurbulence type="fractalNoise" baseFrequency="0.02" numOctaves="2" seed="4" /><feDisplacementMap in="SourceGraphic" scale="5" /></filter>
      </defs>
      <rect width="1600" height="900" fill="url(#jlSky)" />
      {STARS.map(([x, y, r, a], i) => <circle key={i} className={i % 5 ? '' : 'jr-twinkle'} cx={x} cy={y} r={r * 1.4} fill="#fff4e2" opacity={a} />)}
      <g filter="url(#jlWob)" stroke="#123a46" strokeWidth="5" strokeLinejoin="round">
        <g className="earthrise">
          <circle cx="1260" cy="190" r="78" fill="#4fa8d8" />
          <path d="M1215 150 q30 -20 50 10 q-10 30 -40 25z M1280 215 q30 -10 40 20 q-30 20 -45 0z" fill="#7bd389" strokeWidth="4" />
        </g>
        <path d="M0 560 Q200 470 420 540 Q640 450 860 530 Q1100 440 1320 520 Q1480 470 1600 520 V900 H0Z" fill="#a48fd8" />
        <path d="M0 640 Q300 580 640 640 T1300 630 T1600 620 V900 H0Z" fill="#e9e0cf" />
        <path d="M0 760 Q400 700 820 760 T1600 740 V900 H0Z" fill="#f6efe2" />
        {[[260, 700, 70], [1120, 690, 90], [700, 820, 50], [1430, 820, 40]].map(([x, y, r], i) => (
          <g key={i}><ellipse cx={x} cy={y} rx={r} ry={r * 0.3} fill="#c9b8ef" /><ellipse cx={x} cy={y + r * 0.06} rx={r * 0.7} ry={r * 0.18} fill="#b39ee6" strokeWidth="3" /></g>
        ))}
      </g>
    </svg>
  );
}

function ExplorerMoon() {
  const lines = Array.from({ length: 15 }, (_, i) => i);
  return (
    <svg className="mars-surface moon-surface" viewBox="0 0 1600 900" preserveAspectRatio="xMidYMid slice" aria-hidden="true">
      <defs>
        <linearGradient id="elSky" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#020309" /><stop offset="1" stopColor="#0d1a3a" /></linearGradient>
        <linearGradient id="elGround" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#0b1430" /><stop offset="1" stopColor="#03050c" /></linearGradient>
        <filter id="elGlow" x="-20%" y="-20%" width="140%" height="140%"><feGaussianBlur stdDeviation="3" result="b" /><feMerge><feMergeNode in="b" /><feMergeNode in="SourceGraphic" /></feMerge></filter>
      </defs>
      <rect width="1600" height="900" fill="url(#elSky)" />
      {STARS.map(([x, y, r, a], i) => <circle key={i} cx={x} cy={y} r={r} fill="#bff6ff" opacity={a * 0.8} />)}
      <g filter="url(#elGlow)" fill="none" stroke="#4fe3ff" strokeWidth="2" className="earthrise">
        <circle cx="1240" cy="200" r="62" />
        <ellipse cx="1240" cy="200" rx="62" ry="20" opacity="0.6" />
        <ellipse cx="1240" cy="200" rx="20" ry="62" opacity="0.4" />
      </g>
      <path d="M0 610 L160 560 L300 590 L460 540 L640 585 L820 548 L980 590 L1160 545 L1340 585 L1600 560 V630 H0Z" fill="#081026" stroke="#4fe3ff" strokeWidth="2" filter="url(#elGlow)" />
      <rect y="626" width="1600" height="274" fill="url(#elGround)" />
      <g stroke="#4fe3ff" strokeOpacity="0.35" strokeWidth="1.3">
        {lines.map((i) => <line key={`v${i}`} x1={800} y1={626} x2={800 + (i - 7) * 260} y2={900} />)}
        {[0, 1, 2, 3, 4, 5, 6].map((i) => { const y = 626 + Math.pow(i / 6, 1.8) * 274; return <line key={`h${i}`} x1="0" y1={y} x2="1600" y2={y} />; })}
      </g>
      {[[300, 760, 80], [1220, 800, 110], [900, 690, 50]].map(([x, y, r], i) => <ellipse key={i} cx={x} cy={y} rx={r} ry={r * 0.28} fill="none" stroke="#c06bff" strokeWidth="1.8" filter="url(#elGlow)" />)}
    </svg>
  );
}

function DiscoveryMoon() {
  return (
    <svg className="mars-surface moon-surface" viewBox="0 0 1600 900" preserveAspectRatio="xMidYMid slice" aria-hidden="true">
      <defs>
        <filter id="dlRock" x="0" y="0" width="100%" height="100%">
          <feTurbulence type="fractalNoise" baseFrequency="0.02 0.05" numOctaves="5" seed="11" result="n" />
          <feDiffuseLighting in="n" surfaceScale="5" lightingColor="#f4f1ea" result="l"><feDistantLight azimuth="200" elevation="30" /></feDiffuseLighting>
          <feComposite in="l" in2="SourceGraphic" operator="in" result="lit" />
          <feBlend in="SourceGraphic" in2="lit" mode="multiply" />
        </filter>
        <radialGradient id="dlEarth" cx="0.35" cy="0.35" r="0.7"><stop offset="0" stopColor="#bfe3ff" /><stop offset="0.55" stopColor="#2f6fb8" /><stop offset="1" stopColor="#0b2a55" /></radialGradient>
        <radialGradient id="dlAtmo" cx="0.5" cy="0.5" r="0.5"><stop offset="0.68" stopColor="#7fb6ff" stopOpacity="0.45" /><stop offset="1" stopColor="#7fb6ff" stopOpacity="0" /></radialGradient>
        <linearGradient id="dlShade" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#000" stopOpacity="0" /><stop offset="1" stopColor="#000" stopOpacity="0.6" /></linearGradient>
      </defs>
      <rect width="1600" height="900" fill="#000" />
      {STARS.map(([x, y, r, a], i) => <circle key={i} cx={x} cy={y} r={r * 0.8} fill="#fff" opacity={a * 0.7} />)}
      <g className="earthrise">
        <circle cx="1230" cy="190" r="86" fill="url(#dlAtmo)" />
        <circle cx="1230" cy="190" r="60" fill="url(#dlEarth)" />
        <path d="M1196 160 q22 -16 40 4 q-6 22 -30 20z M1240 206 q26 -6 34 14 q-20 16 -36 2z M1210 222 q12 -4 18 6" fill="#6f9a5c" opacity="0.75" />
        <path d="M1180 178 q40 -10 90 6 M1186 200 q30 8 70 -2" stroke="#fff" strokeOpacity="0.55" strokeWidth="5" fill="none" strokeLinecap="round" />
        <path d="M1230 130 A60 60 0 0 1 1230 250 A30 60 0 0 0 1230 130Z" fill="#000" opacity="0.62" />
      </g>
      <g filter="url(#dlRock)">
        <path d="M-20 600 Q300 570 620 590 T1300 575 T1620 590 V900 H-20Z" fill="#8f8b84" />
        <path d="M-20 700 Q400 670 800 705 T1620 690 V900 H-20Z" fill="#77736d" />
      </g>
      {[[280, 690, 90], [1160, 650, 70], [760, 820, 120], [1450, 800, 60]].map(([x, y, r], i) => (
        <g key={i}>
          <ellipse cx={x} cy={y} rx={r} ry={r * 0.26} fill="#3f3d39" />
          <ellipse cx={x} cy={y + r * 0.05} rx={r * 0.92} ry={r * 0.2} fill="#5e5b56" />
          <path d={`M${x - r} ${y} A${r} ${r * 0.26} 0 0 0 ${x + r} ${y}`} fill="none" stroke="#c9c5bc" strokeWidth="3" opacity="0.6" />
        </g>
      ))}
      <rect width="1600" height="900" fill="url(#dlShade)" />
    </svg>
  );
}

/** Estación ALSEP esquemática (dibujo por código, no es una foto). */
export function AlsepGlyph({ className = '' }: { className?: string }) {
  return (
    <svg viewBox="0 0 120 70" className={className} aria-hidden="true">
      <g fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
        <rect x="40" y="38" width="40" height="18" rx="2" fill="currentColor" fillOpacity="0.18" />
        <path d="M60 38 V20 M50 16 Q60 28 70 16" />
        <rect x="14" y="36" width="12" height="22" rx="3" fill="currentColor" fillOpacity="0.18" />
        <path d="M10 42 H30 M10 48 H30 M10 54 H30" strokeOpacity="0.6" />
        <path d="M26 52 Q34 60 40 52 M80 50 Q92 60 100 56" strokeDasharray="3 3" />
        <path d="M96 58 L104 44 L112 58Z" fill="currentColor" fillOpacity="0.18" />
      </g>
    </svg>
  );
}
