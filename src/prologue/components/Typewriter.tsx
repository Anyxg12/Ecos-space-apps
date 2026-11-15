import { useEffect, useState } from 'react';

/**
 * Máquina de escribir SIN saltos de maquetación: el texto completo se reserva desde el
 * primer fotograma (la parte aún no escrita es transparente), así nada se desplaza.
 */
export function Typewriter({ text, speed = 38, delay = 0, instant = false, start = true, onDone, className }: {
  text: string; speed?: number; delay?: number; instant?: boolean; start?: boolean; onDone?: () => void; className?: string;
}) {
  const [n, setN] = useState(instant ? text.length : 0);
  useEffect(() => {
    if (instant) {
      setN(text.length);
      onDone?.();
      return;
    }
    if (!start) return;
    let i = 0;
    let id = 0;
    const t = window.setTimeout(() => {
      id = window.setInterval(() => {
        i += 1;
        setN(i);
        if (i >= text.length) {
          window.clearInterval(id);
          onDone?.();
        }
      }, speed);
    }, delay);
    return () => {
      window.clearTimeout(t);
      window.clearInterval(id);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [text, instant, start]);
  const typing = start && n > 0 && n < text.length;
  return (
    <span className={className}>
      <span aria-hidden="true">
        {text.slice(0, n)}
        {typing && <span className="typewriter-caret" />}
        <span style={{ opacity: 0 }}>{text.slice(n)}</span>
      </span>
      <span className="sr-only">{text}</span>
    </span>
  );
}
