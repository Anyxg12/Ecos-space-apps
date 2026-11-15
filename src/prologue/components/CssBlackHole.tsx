import { forwardRef, useEffect, useRef } from 'react';

/**
 * Fallback sin WebGL: mismo encuadre e identidad (sombra, anillo de fotones, disco inclinado
 * y arco lenteado) con gradientes CSS + un campo de estrellas en canvas 2D dibujado una sola vez.
 */
export const CssBlackHole = forwardRef<HTMLDivElement, { reducedMotion: boolean }>(function CssBlackHole(
  { reducedMotion },
  ref,
) {
  const stars = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    const c = stars.current;
    if (!c) return;
    const draw = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 1.5);
      c.width = c.clientWidth * dpr;
      c.height = c.clientHeight * dpr;
      const g = c.getContext('2d');
      if (!g) return;
      let seed = 7;
      const rnd = () => ((seed = (seed * 16807) % 2147483647) / 2147483647);
      const n = Math.round((c.width * c.height) / 2600);
      for (let i = 0; i < n; i++) {
        const x = rnd() * c.width;
        const y = rnd() * c.height;
        const r = Math.pow(rnd(), 6) * 1.6 * dpr + 0.35 * dpr;
        const warm = rnd() > 0.5;
        g.fillStyle = warm ? `rgba(255,220,190,${0.35 + rnd() * 0.65})` : `rgba(190,210,255,${0.35 + rnd() * 0.65})`;
        g.beginPath();
        g.arc(x, y, r, 0, Math.PI * 2);
        g.fill();
      }
    };
    draw();
    window.addEventListener('resize', draw);
    return () => window.removeEventListener('resize', draw);
  }, []);

  return (
    <div ref={ref} className={`bh-css ${reducedMotion ? 'bh-css--still' : ''}`} aria-hidden="true">
      <canvas ref={stars} className="bh-css__stars" />
      <div className="bh-css__nebula" />
      <div className="bh-css__rig">
        <div className="bh-css__halo" />
        <div className="bh-css__disk bh-css__disk--back" />
        <div className="bh-css__arc" />
        <div className="bh-css__shadow" />
        <div className="bh-css__disk bh-css__disk--front" />
      </div>
      <div className="bh-css__fade" />
    </div>
  );
});
