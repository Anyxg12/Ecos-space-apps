import { useEffect, useLayoutEffect, useRef } from 'react';
import { SkyScene, SKY_TIMELINE, detectSkyTier } from './SkyScene';

interface Props {
  textureUrl: string;
  getTime: () => number;
  /** cambia para pedir que el bucle se reanude (repetir, saltar, congelar) */
  kickKey: number;
  /** movimiento reducido: fundido estático suelo → espacio */
  reduced: boolean;
  onReady: () => void;
  onError: () => void;
}

/** Lienzo WebGL del viaje Tierra → espacio (Three.js, carga diferida). */
export default function SkyCanvas({ textureUrl, getTime, kickKey, reduced, onReady, onError }: Props) {
  const ref = useRef<HTMLCanvasElement>(null);
  const imgRef = useRef<HTMLImageElement>(null);
  const sceneRef = useRef<SkyScene | null>(null);
  const cb = useRef({ onReady, onError, getTime });
  cb.current = { onReady, onError, getTime };

  useLayoutEffect(() => {
    const canvas = ref.current!;
    let scene: SkyScene;
    const params = new URLSearchParams(window.location.search);
    try {
      scene = new SkyScene(canvas, {
        textureUrl,
        getTime: () => (reduced ? SKY_TIMELINE.end : cb.current.getTime()),
        tier: detectSkyTier(),
        adaptive: !params.has('quality') && !params.has('qa'),
        onReady: () => {
          if (reduced && imgRef.current) {
            // fundido estático: fotograma a ras de suelo → fotograma final en órbita
            scene.renderAt(0);
            imgRef.current.src = scene.snapshot();
            imgRef.current.style.opacity = '1';
            scene.renderAt(SKY_TIMELINE.end);
            window.setTimeout(() => imgRef.current && (imgRef.current.style.opacity = '0'), 900);
          }
          cb.current.onReady();
        },
        onError: () => cb.current.onError(),
      });
    } catch (e) {
      console.warn('[ECOS] Mis logros sin WebGL:', e);
      cb.current.onError();
      return;
    }
    sceneRef.current = scene;
    const ro = new ResizeObserver(([e]) => scene.resize(e.contentRect.width, e.contentRect.height));
    ro.observe(canvas.parentElement!);
    const vis = () => (document.hidden ? scene.stop() : scene.kick());
    document.addEventListener('visibilitychange', vis);
    (window as unknown as { __ecosSky?: unknown }).__ecosSky = { quality: () => scene.quality };
    return () => {
      ro.disconnect();
      document.removeEventListener('visibilitychange', vis);
      scene.dispose();
      sceneRef.current = null;
    };
  }, [textureUrl, reduced]);

  useEffect(() => {
    sceneRef.current?.kick();
  }, [kickKey]);

  return (
    <>
      <canvas ref={ref} className="ml-gl" aria-hidden="true" />
      <img ref={imgRef} className="ml-gl-still" alt="" aria-hidden="true" style={{ opacity: 0 }} />
    </>
  );
}
