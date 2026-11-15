import { useEffect, useRef, useState } from 'react';
import { SOFI_AUDIO, SOFI_ESSAY, SOFI_ESSAY_ES } from '../../../data/stories';

type St = 'idle' | 'loading' | 'playing' | 'paused' | 'error';

/**
 * Reproductor del fragmento oficial (NASA/JPL) en el que Sofi Collis lee su ensayo.
 * Se reproduce directamente desde nasa.gov (no se aloja copia). Nunca autoplay.
 * Si no carga (sin red, bloqueo), se muestra el estado de error con el enlace a la fuente.
 */
export function SofiPlayer({ onPlayed }: { onPlayed?: () => void }) {
  const ref = useRef<HTMLAudioElement | null>(null);
  const [st, setSt] = useState<St>('idle');
  const [t, setT] = useState(0);
  const [showText, setShowText] = useState(false);
  const len = SOFI_AUDIO.end - SOFI_AUDIO.start;

  useEffect(() => () => ref.current?.pause(), []);

  const ensure = () => {
    if (ref.current) return ref.current;
    const a = new Audio();
    a.preload = 'none';
    a.src = `${SOFI_AUDIO.src}#t=${SOFI_AUDIO.start},${SOFI_AUDIO.end}`;
    a.addEventListener('timeupdate', () => {
      const rel = a.currentTime - SOFI_AUDIO.start;
      setT(Math.max(0, Math.min(len, rel)));
      if (a.currentTime >= SOFI_AUDIO.end) {
        a.pause();
        setSt('paused');
        setT(len);
        onPlayed?.();
      }
    });
    a.addEventListener('playing', () => setSt('playing'));
    a.addEventListener('waiting', () => setSt('loading'));
    a.addEventListener('error', () => setSt('error'));
    ref.current = a;
    return a;
  };

  const toggle = async () => {
    const a = ensure();
    if (st === 'playing' || st === 'loading') {
      a.pause();
      setSt('paused');
      return;
    }
    try {
      setSt('loading');
      if (a.currentTime < SOFI_AUDIO.start || a.currentTime >= SOFI_AUDIO.end - 0.2) a.currentTime = SOFI_AUDIO.start;
      await a.play();
    } catch {
      setSt('error');
    }
  };

  const fmt = (s: number) => `0:${String(Math.floor(s)).padStart(2, '0')}`;
  const playing = st === 'playing';
  return (
    <div className={`sofi sofi--${st}`} data-sfx="custom">
      <div className="sofi__row">
        <button type="button" className="sofi__play" onClick={() => void toggle()} aria-label={playing ? 'Pausar la voz de Sofi' : 'Escuchar a Sofi leer su ensayo'}>
          {playing || st === 'loading' ? (
            <svg viewBox="0 0 24 24" aria-hidden="true"><rect x="6" y="5" width="4" height="14" rx="1" /><rect x="14" y="5" width="4" height="14" rx="1" /></svg>
          ) : (
            <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M8 5v14l11-7z" /></svg>
          )}
        </button>
        <div className="sofi__meta">
          <p className="sofi__title">Voz real de Sofi Collis (2003)</p>
          <div className="sofi__bar" role="progressbar" aria-label="Progreso del audio" aria-valuemin={0} aria-valuemax={Math.round(len)} aria-valuenow={Math.round(t)}>
            <span style={{ width: `${(t / len) * 100}%` }} />
            <i className="sofi__wave" aria-hidden="true">{Array.from({ length: 28 }, (_, i) => <b key={i} style={{ animationDelay: `${(i % 7) * -0.13}s` }} />)}</i>
          </div>
          <p className="sofi__time" aria-live="off">{st === 'loading' ? 'Cargando desde nasa.gov…' : `${fmt(t)} / ${fmt(len)}`}</p>
        </div>
      </div>
      {st === 'error' && (
        <p className="sofi__error" role="status">
          No se pudo cargar el audio desde nasa.gov. Escúchalo en la{' '}
          <a href={SOFI_AUDIO.page} target="_blank" rel="noopener noreferrer">página oficial del episodio ↗</a> (minuto 3:48).
        </p>
      )}
      <p className="sofi__credit">
        {SOFI_AUDIO.credit}{' '}
        <a href={SOFI_AUDIO.page} target="_blank" rel="noopener noreferrer">Fuente ↗<span className="sr-only"> (se abre en otra pestaña)</span></a>{' '}
        Se reproduce desde el servidor de la NASA; ECOS no aloja copia.
      </p>
      <button type="button" className="sofi__textbtn" aria-expanded={showText} onClick={() => setShowText((v) => !v)}>
        {showText ? 'Ocultar el ensayo' : 'Leer el ensayo'}
      </button>
      {showText && (
        <div className="sofi__text">
          <p lang="en">{SOFI_ESSAY.value.split('” ')[0]}”</p>
          <p>{SOFI_ESSAY_ES} <em>(traducción del equipo The Last Neuron, no oficial)</em></p>
          <p>
            <a href={SOFI_ESSAY.source.url} target="_blank" rel="noopener noreferrer">Texto original: {SOFI_ESSAY.source.publisher} ↗</a>
          </p>
        </div>
      )}
    </div>
  );
}
