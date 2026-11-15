import { m } from 'motion/react';
import { useEffect, useMemo, useRef, useState } from 'react';
import type { Achievement, Badge } from '../types';
import { buildShareSvg, svgToPngBlob } from './shareSvg';

interface Props {
  achievements: Achievement[];
  edges: { from: string; to: string }[];
  badges: Badge[];
  demo: boolean;
  reducedMotion: boolean;
  onClose: () => void;
}

/** Vista «Mi constelación»: resumen compartible (PNG descargable / compartir / copiar texto). */
export function ShareView({ achievements, edges, badges, demo, reducedMotion, onClose }: Props) {
  const svg = useMemo(() => buildShareSvg({ achievements, edges, badges, demo }), [achievements, edges, badges, demo]);
  const src = useMemo(() => `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`, [svg]);
  const [msg, setMsg] = useState('');
  const closeRef = useRef<HTMLButtonElement>(null);
  useEffect(() => closeRef.current?.focus({ preventScroll: true }), []);
  const unlocked = achievements.filter((a) => a.status === 'unlocked');
  const text = `Mi constelación en ECOS: ${unlocked.length} de ${achievements.length} logros — ${unlocked.map((a) => a.title).join(', ')}.${demo ? ' (datos de demostración)' : ''}`;

  const download = async () => {
    try {
      const blob = await svgToPngBlob(svg);
      const a = document.createElement('a');
      a.href = URL.createObjectURL(blob);
      a.download = 'mi-constelacion-ecos.png';
      a.click();
      setTimeout(() => URL.revokeObjectURL(a.href), 2000);
      setMsg('Imagen descargada');
    } catch {
      setMsg('No se pudo generar la imagen');
    }
  };
  const share = async () => {
    try {
      const blob = await svgToPngBlob(svg);
      const file = new File([blob], 'mi-constelacion-ecos.png', { type: 'image/png' });
      if (navigator.canShare?.({ files: [file] })) {
        await navigator.share({ files: [file], title: 'Mi constelación ECOS', text });
        return;
      }
      await navigator.clipboard.writeText(text);
      setMsg('Resumen copiado al portapapeles');
    } catch {
      setMsg('No se pudo compartir');
    }
  };

  return (
    <m.div
      className="ml-share"
      role="dialog"
      aria-modal="true"
      aria-label="Mi constelación"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: reducedMotion ? 0.1 : 0.35 }}
      onClick={(e) => {
        e.stopPropagation();
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <m.div className="ml-share__panel" initial={reducedMotion ? false : { y: 24, scale: 0.98 }} animate={{ y: 0, scale: 1 }} transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}>
        <img className="ml-share__img" src={src} alt={text} width={1080} height={1350} />
        <div className="ml-share__actions">
          <button type="button" className="ml-share__btn is-primary" onClick={() => void download()}>Descargar imagen</button>
          <button type="button" className="ml-share__btn" onClick={() => void share()}>Compartir</button>
          <button ref={closeRef} type="button" className="ml-share__btn" onClick={onClose}>Cerrar</button>
        </div>
        <p className="ml-share__msg" aria-live="polite">{msg}</p>
      </m.div>
    </m.div>
  );
}
