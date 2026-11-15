import { useEffect, useRef, useState } from 'react';
import { BlackHoleRenderer } from '../gl/BlackHoleRenderer';
import { CssHorizonController, WebGLHorizonController, type HorizonController } from '../gl/controller';
import { detectCapability, type QualityTier } from '../gl/quality';
import { CssBlackHole } from './CssBlackHole';

interface Props {
  reducedMotion: boolean;
  onController: (c: HorizonController) => void;
}

/**
 * Capa visual persistente de todo el prólogo (una sola escena que se transforma).
 * Decide WebGL vs CSS, crea el controlador y reenvía el puntero / toque.
 */
export function HorizonStage({ reducedMotion, onController }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const cssRef = useRef<HTMLDivElement>(null);
  const [cap] = useState(detectCapability);
  const [mode, setMode] = useState<'webgl' | 'css'>(cap.webgl ? 'webgl' : 'css');
  const [tier, setTier] = useState<QualityTier>(cap.tier);
  const ctrl = useRef<HorizonController | null>(null);
  const onControllerRef = useRef(onController);
  onControllerRef.current = onController;
  const search = new URLSearchParams(window.location.search);
  const debug = search.get('debug') === '1';
  const watchdog = search.get('watchdog') !== '0';

  useEffect(() => {
    if (mode !== 'webgl' || !canvasRef.current) return;
    let renderer: BlackHoleRenderer | null = null;
    try {
      renderer = new BlackHoleRenderer(canvasRef.current, {
        tier: cap.tier,
        reducedMotion,
        watchdog,
        onTierChange: setTier,
        onFallback: () => setMode('css'),
      });
    } catch (err) {
      console.warn('[ECOS] WebGL falló, usando fallback CSS', err);
      setMode('css');
      return;
    }
    // si hay un controlador previo, heredamos sus parámetros para no «saltar»
    const c = new WebGLHorizonController(renderer);
    ctrl.current = c;
    onControllerRef.current(c);
    renderer.start();
    return () => renderer?.dispose();
  }, [mode, cap.tier, reducedMotion, watchdog]);

  useEffect(() => {
    if (mode !== 'css' || !cssRef.current) return;
    const c = new CssHorizonController(cssRef.current, reducedMotion);
    ctrl.current = c;
    onControllerRef.current(c);
  }, [mode, reducedMotion]);

  useEffect(() => {
    const move = (e: PointerEvent) => {
      const x = (e.clientX / window.innerWidth) * 2 - 1;
      const y = -((e.clientY / window.innerHeight) * 2 - 1);
      ctrl.current?.setPointer(x, y);
    };
    window.addEventListener('pointermove', move, { passive: true });
    window.addEventListener('pointerdown', move, { passive: true });
    return () => {
      window.removeEventListener('pointermove', move);
      window.removeEventListener('pointerdown', move);
    };
  }, []);

  return (
    <div className="absolute inset-0 overflow-hidden bg-black" data-horizon-mode={mode} data-horizon-tier={tier}>
      {mode === 'webgl' ? (
        <canvas ref={canvasRef} className="block h-full w-full" aria-hidden="true" />
      ) : (
        <CssBlackHole ref={cssRef} reducedMotion={reducedMotion} />
      )}
      {debug && (
        <div className="pointer-events-none absolute left-2 top-2 z-50 rounded bg-black/70 px-2 py-1 font-mono text-[10px] text-white/70">
          modo: {mode} · calidad: {tier} · gpu: {cap.renderer || 'desconocida'}
        </div>
      )}
    </div>
  );
}
