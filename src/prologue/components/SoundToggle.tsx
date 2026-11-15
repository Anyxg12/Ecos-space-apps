import { useEffect, useState } from 'react';
import { sound } from '../audio/soundEngine';

/** Sonido desactivado por defecto; el usuario decide. La preferencia se recuerda. */
export function SoundToggle({ inline = false }: { inline?: boolean } = {}) {
  const [on, setOn] = useState(sound.enabled);
  useEffect(() => {
    const unsub = sound.subscribe(setOn);
    return () => {
      unsub();
    };
  }, []);
  return (
    <button
      type="button"
      className={inline ? 'uni-btn uni-sound' : 'sound-toggle'}
      aria-pressed={on}
      aria-label={on ? 'Desactivar sonido' : 'Activar sonido'}
      title={on ? 'Sonido activado' : 'Activar sonido'}
      onClick={(e) => {
        e.stopPropagation();
        sound.setEnabled(!on);
      }}
    >
      <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true">
        <path d="M4 9h4l5-4v14l-5-4H4z" />
        {on ? <path d="M16 9a4 4 0 0 1 0 6M18.5 6.5a7.5 7.5 0 0 1 0 11" /> : <path d="M16 9l5 6M21 9l-5 6" />}
      </svg>
      <span className={inline ? 'uni-sound__label' : 'sound-toggle__label'}>{on ? 'Sonido' : 'Sin sonido'}</span>
    </button>
  );
}
