import type { AgeGroup } from '../state/types';

/** Mini-vistas previas de cada identidad, 100 % SVG (sin imágenes externas). */
export function IdentityPreview({ group }: { group: AgeGroup }) {
  if (group === 'junior')
    return (
      <svg viewBox="0 0 160 100" className="h-full w-full" preserveAspectRatio="xMidYMid slice" aria-hidden="true">
        <rect width="160" height="100" fill="#0f4c5c" />
        <circle cx="128" cy="20" r="34" fill="#13606f" />
        <path d="M0 82 Q40 66 80 80 T160 76 V100 H0Z" fill="#5b2a86" />
        <path d="M0 90 Q50 78 100 92 T160 90 V100 H0Z" fill="#3d1c5c" />
        <g transform="translate(58 44)">
          <circle r="17" fill="#ff8a3d" />
          <path d="M-12 -6 q6 -6 14 -4" stroke="#ffd2a8" strokeWidth="3" fill="none" strokeLinecap="round" />
          <ellipse cx="0" cy="-15" rx="6" ry="2" fill="#fff4e8" />
        </g>
        <circle cx="114" cy="34" r="10" fill="#e9e2f5" />
        <circle cx="111" cy="31" r="2.4" fill="#cfc4e6" />
        <circle cx="118" cy="38" r="1.6" fill="#cfc4e6" />
        {[[20, 18], [36, 40], [100, 18], [146, 50], [84, 12]].map(([x, y], i) => (
          <path key={i} d={`M${x} ${y - 4} L${x + 1.2} ${y - 1.2} L${x + 4} ${y} L${x + 1.2} ${y + 1.2} L${x} ${y + 4} L${x - 1.2} ${y + 1.2} L${x - 4} ${y} L${x - 1.2} ${y - 1.2}Z`} fill="#ffe9b8" />
        ))}
      </svg>
    );
  if (group === 'explorer')
    return (
      <svg viewBox="0 0 160 100" className="h-full w-full" preserveAspectRatio="xMidYMid slice" aria-hidden="true">
        <defs>
          <radialGradient id="exG" cx="0.5" cy="0.55" r="0.6">
            <stop offset="0" stopColor="#3a1d7a" />
            <stop offset="1" stopColor="#060a1f" />
          </radialGradient>
          <pattern id="exGrid" width="10" height="10" patternUnits="userSpaceOnUse">
            <path d="M10 0H0V10" fill="none" stroke="#4fe3ff" strokeOpacity="0.12" strokeWidth="0.6" />
          </pattern>
        </defs>
        <rect width="160" height="100" fill="url(#exG)" />
        <rect width="160" height="100" fill="url(#exGrid)" />
        <circle cx="80" cy="52" r="26" fill="none" stroke="#4fe3ff" strokeOpacity="0.7" strokeWidth="0.8" />
        <circle cx="80" cy="52" r="16" fill="none" stroke="#a77bff" strokeOpacity="0.8" strokeWidth="0.8" strokeDasharray="3 2" />
        <path d="M80 20v10M80 74v10M48 52h10M102 52h10" stroke="#4fe3ff" strokeWidth="1" />
        <path d="M80 52 L104 36" stroke="#4fe3ff" strokeOpacity="0.5" className="radar-sweep" />
        <circle cx="96" cy="44" r="2" fill="#4fe3ff" />
        <rect x="8" y="8" width="38" height="5" fill="#4fe3ff" fillOpacity="0.5" />
        <rect x="8" y="16" width="24" height="3" fill="#4fe3ff" fillOpacity="0.25" />
        <rect x="118" y="80" width="34" height="12" fill="none" stroke="#4fe3ff" strokeOpacity="0.6" />
        <rect x="120" y="82" width="20" height="8" fill="#4fe3ff" fillOpacity="0.35" />
      </svg>
    );
  return (
    <svg viewBox="0 0 160 100" className="h-full w-full" preserveAspectRatio="xMidYMid slice" aria-hidden="true">
      <rect width="160" height="100" fill="#0c0c0d" />
      <circle cx="58" cy="52" r="7" fill="#e9dcc3" />
      <ellipse cx="58" cy="52" rx="38" ry="16" fill="none" stroke="#e9dcc3" strokeOpacity="0.55" strokeWidth="0.5" />
      <ellipse cx="58" cy="52" rx="24" ry="9" fill="none" stroke="#e9dcc3" strokeOpacity="0.35" strokeWidth="0.5" />
      <circle cx="94" cy="47" r="1.8" fill="#fff" />
      <path d="M94 47 L124 26" stroke="#e9dcc3" strokeOpacity="0.5" strokeWidth="0.4" />
      <text x="126" y="25" fill="#e9dcc3" fontSize="6" fontFamily="Georgia, serif" fontStyle="italic">fig. 1</text>
      <path d="M110 70h42M110 76h34M110 82h38" stroke="#e9dcc3" strokeOpacity="0.3" strokeWidth="0.6" />
      <path d="M8 92h144" stroke="#e9dcc3" strokeOpacity="0.2" strokeWidth="0.4" />
      {Array.from({ length: 15 }).map((_, i) => (
        <path key={i} d={`M${8 + i * 10} 92v-2`} stroke="#e9dcc3" strokeOpacity="0.35" strokeWidth="0.4" />
      ))}
    </svg>
  );
}
