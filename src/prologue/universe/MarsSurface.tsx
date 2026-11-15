import type { AgeGroup } from '../state/types';

/**
 * Superficie marciana generada por código (SVG + filtros de ruido), una por universo.
 * Sin texturas externas. Se usa de fondo en la pantalla de Spirit y Opportunity.
 */
export function MarsSurface({ variant }: { variant: AgeGroup }) {
  if (variant === 'junior') return <JuniorMars />;
  if (variant === 'explorer') return <ExplorerMars />;
  return <DiscoveryMars />;
}

function JuniorMars() {
  return (
    <svg className="mars-surface" viewBox="0 0 1600 900" preserveAspectRatio="xMidYMid slice" aria-hidden="true">
      <defs>
        <linearGradient id="jmSky" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#ffb98a" />
          <stop offset="0.6" stopColor="#ffd9b0" />
          <stop offset="1" stopColor="#ffe6c9" />
        </linearGradient>
      </defs>
      <rect width="1600" height="900" fill="url(#jmSky)" />
      <circle cx="1270" cy="170" r="54" fill="#fff6e0" />
      <circle cx="1270" cy="170" r="84" fill="#fff6e0" opacity="0.35" />
      <g fill="#fff3e6" opacity="0.8">
        <ellipse cx="300" cy="170" rx="90" ry="26" /><ellipse cx="360" cy="150" rx="60" ry="26" />
        <ellipse cx="1420" cy="330" rx="70" ry="20" /><ellipse cx="1470" cy="316" rx="44" ry="20" />
      </g>
      <path d="M0 560 Q160 420 330 520 Q470 380 640 500 Q820 400 990 520 Q1180 410 1350 500 Q1480 440 1600 520 V900 H0Z" fill="#f0905a" />
      <path d="M0 640 Q260 560 520 640 T1040 630 T1600 610 V900 H0Z" fill="#e06d3a" />
      <path d="M0 740 Q380 680 800 740 T1600 720 V900 H0Z" fill="#c8552a" />
      {[[220, 770, 40], [520, 820, 26], [1180, 790, 46], [1420, 840, 30], [860, 860, 22]].map(([x, y, r], i) => (
        <g key={i}>
          <ellipse cx={x} cy={y + r * 0.55} rx={r * 1.1} ry={r * 0.25} fill="#a8431e" opacity="0.5" />
          <path d={`M${x - r} ${y + r * 0.5} Q${x - r * 0.8} ${y - r * 0.6} ${x} ${y - r * 0.7} Q${x + r * 0.9} ${y - r * 0.5} ${x + r} ${y + r * 0.5}Z`} fill="#9c3d1a" />
          <path d={`M${x - r * 0.5} ${y - r * 0.3} Q${x} ${y - r * 0.65} ${x + r * 0.4} ${y - r * 0.4}`} stroke="#c9653a" strokeWidth="5" fill="none" strokeLinecap="round" />
        </g>
      ))}
      <g className="jr-dust" fill="#fff0de" opacity="0.6">
        <circle cx="200" cy="600" r="5" /><circle cx="640" cy="560" r="4" /><circle cx="1100" cy="590" r="6" /><circle cx="1450" cy="560" r="4" />
      </g>
    </svg>
  );
}

function ExplorerMars() {
  const lines = Array.from({ length: 15 }, (_, i) => i);
  return (
    <svg className="mars-surface" viewBox="0 0 1600 900" preserveAspectRatio="xMidYMid slice" aria-hidden="true">
      <defs>
        <linearGradient id="emSky" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#0b0620" />
          <stop offset="0.55" stopColor="#3a1240" />
          <stop offset="0.7" stopColor="#8a2d3a" />
        </linearGradient>
        <linearGradient id="emGround" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#3b1220" />
          <stop offset="1" stopColor="#12060f" />
        </linearGradient>
        <filter id="emGlow" x="-20%" y="-20%" width="140%" height="140%">
          <feGaussianBlur stdDeviation="3" result="b" />
          <feMerge><feMergeNode in="b" /><feMergeNode in="SourceGraphic" /></feMerge>
        </filter>
      </defs>
      <rect width="1600" height="900" fill="url(#emSky)" />
      <circle cx="1220" cy="220" r="70" fill="none" stroke="#c06bff" strokeWidth="2" opacity="0.7" filter="url(#emGlow)" />
      <circle cx="1220" cy="220" r="40" fill="#c06bff" opacity="0.18" />
      <path d="M0 600 L140 520 L240 560 L380 470 L520 545 L640 500 L780 560 L900 480 L1040 540 L1180 470 L1320 540 L1460 500 L1600 560 V620 H0Z" fill="#1c0a24" stroke="#ff5a7a" strokeWidth="2" filter="url(#emGlow)" />
      <rect y="618" width="1600" height="282" fill="url(#emGround)" />
      <g stroke="#4fe3ff" strokeOpacity="0.45" strokeWidth="1.4" className="em-grid">
        {lines.map((i) => (
          <line key={`v${i}`} x1={800} y1={618} x2={800 + (i - 7) * 260} y2={900} />
        ))}
        {[0, 1, 2, 3, 4, 5, 6].map((i) => {
          const y = 618 + Math.pow(i / 6, 1.8) * 282;
          return <line key={`h${i}`} x1="0" y1={y} x2="1600" y2={y} />;
        })}
      </g>
      <line x1="0" y1="618" x2="1600" y2="618" stroke="#4fe3ff" strokeWidth="2" filter="url(#emGlow)" />
      {[[300, 760], [1250, 800], [960, 700]].map(([x, y], i) => (
        <path key={i} d={`M${x - 40} ${y} L${x - 16} ${y - 34} L${x + 22} ${y - 26} L${x + 44} ${y}Z`} fill="#24091c" stroke="#c06bff" strokeWidth="1.6" filter="url(#emGlow)" />
      ))}
    </svg>
  );
}

function DiscoveryMars() {
  return (
    <svg className="mars-surface" viewBox="0 0 1600 900" preserveAspectRatio="xMidYMid slice" aria-hidden="true">
      <defs>
        <linearGradient id="dmSky" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#3a2a24" />
          <stop offset="0.45" stopColor="#a7795c" />
          <stop offset="0.62" stopColor="#d6a882" />
        </linearGradient>
        <radialGradient id="dmSun" cx="0.72" cy="0.3" r="0.35">
          <stop offset="0" stopColor="#f6e6cf" stopOpacity="0.85" />
          <stop offset="0.2" stopColor="#e8c6a0" stopOpacity="0.35" />
          <stop offset="1" stopColor="#e8c6a0" stopOpacity="0" />
        </radialGradient>
        <filter id="dmRock" x="0" y="0" width="100%" height="100%">
          <feTurbulence type="fractalNoise" baseFrequency="0.012 0.03" numOctaves="5" seed="7" result="n" />
          <feDiffuseLighting in="n" surfaceScale="6" lightingColor="#ffd9b8" result="l">
            <feDistantLight azimuth="210" elevation="38" />
          </feDiffuseLighting>
          <feComposite in="l" in2="SourceGraphic" operator="in" result="lit" />
          <feBlend in="SourceGraphic" in2="lit" mode="multiply" />
        </filter>
        <filter id="dmFar" x="0" y="0" width="100%" height="100%">
          <feTurbulence type="fractalNoise" baseFrequency="0.006 0.02" numOctaves="4" seed="3" result="n" />
          <feDisplacementMap in="SourceGraphic" in2="n" scale="40" />
        </filter>
        <linearGradient id="dmHaze" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#d6a882" stopOpacity="0" />
          <stop offset="0.5" stopColor="#d6a882" stopOpacity="0.55" />
          <stop offset="1" stopColor="#d6a882" stopOpacity="0" />
        </linearGradient>
        <linearGradient id="dmShade" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#000" stopOpacity="0" />
          <stop offset="1" stopColor="#0b0604" stopOpacity="0.75" />
        </linearGradient>
      </defs>
      <rect width="1600" height="900" fill="url(#dmSky)" />
      <rect width="1600" height="900" fill="url(#dmSun)" />
      <g filter="url(#dmFar)">
        <path d="M-40 560 L120 520 L300 535 L460 490 L620 520 L820 470 L1000 505 L1180 480 L1360 515 L1640 500 V620 H-40Z" fill="#9a6a50" opacity="0.8" />
        <path d="M-40 590 L200 560 L420 575 L700 545 L980 570 L1240 548 L1640 575 V660 H-40Z" fill="#8a573e" />
      </g>
      <rect y="480" width="1600" height="160" fill="url(#dmHaze)" />
      <g filter="url(#dmRock)">
        <path d="M0 610 Q400 590 800 615 T1600 600 V900 H0Z" fill="#9b5a3a" />
        <path d="M0 720 Q300 690 700 730 Q1100 770 1600 700 V900 H0Z" fill="#7d4329" />
      </g>
      {/* rocas sueltas (irregulares, con cara iluminada) */}
      {[[230, 820, 70], [1290, 790, 95], [1500, 870, 40], [620, 880, 30]].map(([x, y, r], i) => (
        <g key={i}>
          <ellipse cx={x + r * 0.3} cy={y + r * 0.32} rx={r * 1.25} ry={r * 0.16} fill="#1a0b06" opacity="0.45" />
          <path d={`M${x - r} ${y + r * 0.3} L${x - r * 0.75} ${y - r * 0.25} L${x - r * 0.2} ${y - r * 0.5} L${x + r * 0.45} ${y - r * 0.38} L${x + r * 0.95} ${y + r * 0.05} L${x + r} ${y + r * 0.3}Z`} fill="#4e281a" />
          <path d={`M${x - r * 0.75} ${y - r * 0.25} L${x - r * 0.2} ${y - r * 0.5} L${x + r * 0.05} ${y - r * 0.1} L${x - r * 0.55} ${y + r * 0.05}Z`} fill="#8a5034" opacity="0.8" />
        </g>
      ))}
      <rect width="1600" height="900" fill="url(#dmShade)" />
    </svg>
  );
}
