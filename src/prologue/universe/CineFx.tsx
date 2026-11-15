/**
 * Capa cinematográfica de Discovery: grano de película, viñeta y etalonaje suave.
 * Sólo CSS/SVG (sin WebGL), no captura eventos y se queda estática con movimiento reducido.
 */
export function CineFx() {
  return (
    <div className="cinefx" aria-hidden="true">
      <div className="cinefx__grade" />
      <div className="cinefx__vignette" />
      <div className="cinefx__grain" />
    </div>
  );
}
