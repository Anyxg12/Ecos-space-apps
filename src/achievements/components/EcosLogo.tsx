/**
 * Logo de ECOS (recreación vectorial del logo del usuario: letras blancas finas y un anillo
 * dorado inclinado que orbita la «O»). Escala sin perder nitidez.
 * Copia del logo del prólogo (no importa entre proyectos).
 */
let uid = 0;
export function EcosLogo({ className = '', size = 1, title = 'ECOS' }: { className?: string; size?: number; title?: string }) {
  const id = `ecos-logo-${++uid}`;
  const h = 64 * size;
  return (
    <svg
      viewBox="0 0 300 80"
      height={h}
      width={(h * 300) / 80}
      className={className}
      role="img"
      aria-label={title}
    >
      <defs>
        <linearGradient id={`${id}-gold`} x1="0" y1="0" x2="1" y2="0">
          <stop offset="0" stopColor="#a87a32" />
          <stop offset="0.35" stopColor="#f4d58d" />
          <stop offset="0.6" stopColor="#d9a84e" />
          <stop offset="1" stopColor="#8f6424" />
        </linearGradient>
        {/* la «O» se interrumpe donde el anillo pasa por delante */}
        <mask id={`${id}-front`} maskUnits="userSpaceOnUse">
          <rect x="0" y="0" width="300" height="80" fill="#fff" />
          <path d="M119 40 A46 12 0 0 0 211 40" transform="rotate(-16 165 40)" fill="none" stroke="#000" strokeWidth="7" />
        </mask>
      </defs>
      <g fill="none" stroke="#f7f4ee" strokeWidth="3" strokeLinecap="butt" strokeLinejoin="miter">
        {/* E */}
        <path d="M52 13 H14 V67 H52 M14 40 H46" />
        {/* C */}
        <path d="M117.5 21.5 A27 27 0 1 0 117.5 58.5" />
        {/* S */}
        <path d="M262 22 C257 14 249 12.5 242 12.5 C231 12.5 224 18 224 26 C224 35 232 37.5 243 40 C255 42.5 263 46 263 55 C263 63 255 67.5 243 67.5 C234 67.5 226 64 221 57" />
      </g>
      {/* anillo: mitad trasera → O → mitad delantera */}
      <path d="M119 40 A46 12 0 0 1 211 40" transform="rotate(-16 165 40)" fill="none" stroke={`url(#${id}-gold)`} strokeWidth="2.6" opacity="0.85" />
      <circle cx="165" cy="40" r="27" fill="none" stroke="#f7f4ee" strokeWidth="3" mask={`url(#${id}-front)`} />
      <path d="M119 40 A46 12 0 0 0 211 40" transform="rotate(-16 165 40)" fill="none" stroke={`url(#${id}-gold)`} strokeWidth="2.6" />
    </svg>
  );
}
