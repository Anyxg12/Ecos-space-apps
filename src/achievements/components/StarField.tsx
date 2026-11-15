import { memo } from 'react';

/** Cielo de fondo: estrellas deterministas en SVG (sin canvas ni WebGL). */
function rng(seed: number) {
  return () => {
    seed = (seed * 16807) % 2147483647;
    return (seed - 1) / 2147483646;
  };
}
export const StarField = memo(function StarField({ count = 150, seed = 7 }: { count?: number; seed?: number }) {
  const r = rng(seed);
  const stars = Array.from({ length: count }, (_, i) => ({ x: r() * 100, y: r() * 100, s: 0.35 + r() * r() * 1.4, o: 0.25 + r() * 0.65, tw: i % 9 === 0 }));
  return (
    <svg className="ml-starfield" viewBox="0 0 1000 1000" preserveAspectRatio="xMidYMid slice" aria-hidden="true">
      {stars.map((st, i) => (
        <circle
          key={i}
          cx={st.x * 10}
          cy={st.y * 10}
          r={st.s * 1.6}
          fill="var(--ml-bgstar)"
          opacity={st.o}
          className={st.tw ? 'ml-twinkle' : undefined}
          style={st.tw ? { animationDelay: `${(i % 7) * 0.7}s` } : undefined}
        />
      ))}
    </svg>
  );
});
