import type { Badge } from '../types';

/** Insignia (provisional): medallón con glifo. */
export function BadgeGlyph({ badge, size = 56 }: { badge: Badge; size?: number }) {
  return (
    <svg viewBox="0 0 64 64" width={size} height={size} className="ml-badge__glyph" aria-hidden="true">
      <circle cx="32" cy="32" r="29" fill="var(--ml-badge-bg)" stroke="var(--ml-badge-ring)" strokeWidth="2.5" />
      <circle cx="32" cy="32" r="23" fill="none" stroke="var(--ml-badge-ring)" strokeWidth="1" strokeDasharray="2 3" opacity="0.7" />
      {(badge.icon ?? 'tracks') === 'tracks' ? (
        // huellas de rueda: dos franjas de marcas inclinadas
        <g fill="var(--ml-badge-fg)">
          {[0, 1, 2, 3, 4].map((i) => (
            <g key={i} transform={`translate(${21 + i * 0.6} ${18 + i * 6.4}) rotate(-12)`}>
              <rect x="-4" y="-1.6" width="8" height="3.2" rx="1" />
              <rect x="14" y="-1.6" width="8" height="3.2" rx="1" />
            </g>
          ))}
        </g>
      ) : badge.icon === 'planet' ? (
        <g fill="none" stroke="var(--ml-badge-fg)" strokeWidth="2.4">
          <circle cx="32" cy="32" r="9" fill="var(--ml-badge-fg)" />
          <ellipse cx="32" cy="32" rx="17" ry="5.5" transform="rotate(-18 32 32)" />
        </g>
      ) : (
        <path d="M32 16 L35.6 27.4 L47.5 27.6 L38 34.8 L41.4 46.2 L32 39.4 L22.6 46.2 L26 34.8 L16.5 27.6 L28.4 27.4Z" fill="var(--ml-badge-fg)" />
      )}
    </svg>
  );
}
