import { useEffect, useMemo, useRef } from 'react';
import { EcosLogo } from '../achievements';
import { buildRanking } from '../prologue/state/ranking';
import './ranking.css';

interface Props {
  theme: 'junior' | 'explorer' | 'discovery';
  alias?: string;
  isUnlocked: (id: string) => boolean;
  reducedMotion: boolean;
  onBack: () => void;
  backLabel: string;
  onLogros?: () => void;
  onExplore?: () => void;
}

const COPY = {
  junior: { title: 'Top exploradores', lead: '¿Cuántas estrellas has encendido? Mira dónde estarías en la tabla.', me: 'Tu lugar' },
  explorer: { title: 'Top exploradores', lead: 'Clasificación de tripulación · simulación de tabla con tu progreso real.', me: 'Tu posición' },
  discovery: { title: 'Top exploradores', lead: 'Una tabla de ejemplo para mostrar cómo se vería la comunidad de ECOS. Tu fila usa tu progreso real.', me: 'Tu posición' },
};

/** Ranking «Top exploradores»: tabla de DEMOSTRACIÓN + la posición local real del usuario. */
export default function RankingScreen({ theme, alias, isUnlocked, reducedMotion, onBack, backLabel, onLogros, onExplore }: Props) {
  const { rows, me, position, total } = useMemo(() => buildRanking(alias, isUnlocked), [alias, isUnlocked]);
  const head = useRef<HTMLHeadingElement>(null);
  const c = COPY[theme];
  useEffect(() => {
    head.current?.focus({ preventScroll: true });
    const k = (e: KeyboardEvent) => e.key === 'Escape' && onBack();
    window.addEventListener('keydown', k);
    return () => window.removeEventListener('keydown', k);
  }, [onBack]);
  const podium = rows.slice(0, 3);
  const pct = Math.round((me.stars / total) * 100);

  return (
    <div className={`rk rk--${theme} ${reducedMotion ? 'rk--still' : ''}`}>
      <div className="rk__bg" aria-hidden="true" />
      <header className="rk__top">
        <button type="button" className="rk__back" onClick={onBack}>
          <span aria-hidden="true">← </span>{backLabel}
        </button>
        <EcosLogo size={0.34} className="rk__logo" />
        <span className="rk__demo" role="note">Datos de demostración</span>
      </header>

      <main className="rk__main">
        <h1 ref={head} tabIndex={-1} className="rk__h1">{c.title}</h1>
        <p className="rk__lead">{c.lead}</p>

        <section className="rk__me" aria-labelledby="rk-me">
          <div className="rk__pos" aria-hidden="true">#{position}</div>
          <div className="rk__meinfo">
            <h2 id="rk-me">{c.me}: #{position} de {rows.length}</h2>
            <p className="rk__alias">{me.alias}</p>
            <div className="rk__bar" role="img" aria-label={`${me.stars} de ${total} estrellas`}>
              <span style={{ width: `${pct}%` }} />
            </div>
            <p className="rk__small">
              ★ {me.stars} de {total} estrellas · {me.missions} de 3 misiones completas. Calculado con tus estrellas reales guardadas en este dispositivo.
            </p>
          </div>
          {onExplore && (
            <button type="button" className="rk__cta" onClick={onExplore}>
              Ganar más estrellas
            </button>
          )}
        </section>

        <ol className="rk__podium" aria-label="Podio (datos de demostración)">
          {podium.map((r, i) => (
            <li key={r.alias} className={`rk__step rk__step--${i + 1} ${r.me ? 'is-me' : ''}`} style={{ ['--i' as string]: i }}>
              <span className="rk__medal" aria-hidden="true">{i + 1}</span>
              <b>{r.alias}{r.me ? ' (tú)' : ''}</b>
              <small>★ {r.stars}</small>
            </li>
          ))}
        </ol>

        <div className="rk__tablewrap">
          <table className="rk__table">
            <caption>Tabla de demostración: los seudónimos marcados «demo» son inventados, no son personas reales.</caption>
            <thead>
              <tr>
                <th scope="col">#</th>
                <th scope="col">Explorador</th>
                <th scope="col">Estrellas</th>
                <th scope="col" className="rk__hide-s">Misiones</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r, i) => (
                <tr key={r.alias} className={r.me ? 'is-me' : ''} aria-current={r.me ? 'true' : undefined} style={{ ['--i' as string]: i }}>
                  <td className="rk__n">{i + 1}</td>
                  <td>{r.alias}{r.me && <span className="rk__you"> tú</span>}</td>
                  <td>
                    <span className="rk__stars" aria-label={`${r.stars} estrellas`}>
                      <span className="rk__sbar" aria-hidden="true"><span style={{ width: `${(r.stars / total) * 100}%` }} /></span>
                      {r.stars}
                    </span>
                  </td>
                  <td className="rk__hide-s">{r.missions}/3</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <section className="rk__note" aria-labelledby="rk-pend">
          <h2 id="rk-pend">Ranking global — Pendiente</h2>
          <p>
            Un ranking real entre exploradores necesita un servidor (está previsto con Supabase). Hoy ECOS no envía datos a ningún sitio:
            tu progreso y tu seudónimo viven solo en este navegador. Las demás filas son ejemplos para la demostración.
          </p>
          {onLogros && (
            <button type="button" className="rk__ghost" onClick={onLogros}>
              ✦ Ver Mis logros
            </button>
          )}
        </section>
      </main>
    </div>
  );
}
