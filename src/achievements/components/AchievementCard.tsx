import { m } from 'motion/react';
import { useEffect, useRef } from 'react';
import type { Achievement, ArchiveCard, Badge } from '../types';
import { BadgeGlyph } from './Glyphs';
import { AssetImage } from './AssetImage';
import { RoverMark } from './RoverMark';

interface Props {
  achievement: Achievement;
  badge?: Badge;
  archive?: ArchiveCard;
  demo: boolean;
  reducedMotion: boolean;
  formatDate: (iso: string) => string;
  onClose: () => void;
  compact: boolean;
}

/** Tarjeta de detalle de un logro. Panel lateral en escritorio y hoja inferior en móvil. */
export function AchievementCard({ achievement: a, badge, archive, demo, reducedMotion, formatDate, onClose, compact }: Props) {
  const closeRef = useRef<HTMLButtonElement>(null);
  const locked = a.status === 'locked';
  useEffect(() => {
    closeRef.current?.focus({ preventScroll: true });
  }, [a.id]);

  const from = reducedMotion ? { opacity: 0 } : compact ? { opacity: 0, y: 40 } : { opacity: 0, x: 30 };
  const titleId = `ml-card-title-${a.id}`;
  return (
    <m.section
      className={`ml-card ${locked ? 'is-locked' : 'is-unlocked'}`}
      role="dialog"
      aria-modal="false"
      aria-labelledby={titleId}
      initial={from}
      animate={{ opacity: 1, x: 0, y: 0 }}
      exit={from}
      transition={{ duration: reducedMotion ? 0.15 : 0.45, ease: [0.22, 1, 0.36, 1] }}
      onClick={(e) => e.stopPropagation()}
    >
      <div className="ml-card__top">
        <p className={`ml-card__status ${locked ? 'is-locked' : 'is-unlocked'}`}>
          <span className="ml-card__dot" aria-hidden="true" />
          {locked ? (a.future ? 'Bloqueado · meta futura' : 'Bloqueado') : 'Desbloqueado'}
        </p>
        <button ref={closeRef} type="button" className="ml-card__close" onClick={onClose} aria-label="Cerrar tarjeta">
          <svg viewBox="0 0 16 16" width="14" height="14" aria-hidden="true">
            <path d="M3 3l10 10M13 3L3 13" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
          </svg>
        </button>
      </div>
      <h2 id={titleId} className="ml-card__title">{a.title}</h2>
      <dl className="ml-card__meta">
        <div>
          <dt>{locked ? 'Cómo se consigue' : 'Lo otorgó'}</dt>
          <dd>{a.activity}</dd>
        </div>
        <div>
          <dt>Fecha</dt>
          <dd>
            {locked ? '—' : a.date ? formatDate(a.date) : 'Sin fecha registrada'}
            {demo && a.date && !locked && <span className="ml-card__demo"> (demo)</span>}
          </dd>
        </div>
      </dl>
      <p className="ml-card__desc">{a.description}</p>
      {locked && a.hint && <p className="ml-card__hint">{a.hint}</p>}
      {badge && !locked && (
        <div className="ml-card__badge">
          <BadgeGlyph badge={badge} size={52} />
          <div>
            <p className="ml-card__badge-kicker">Insignia{badge.provisional ? ' · provisional' : ''}</p>
            <p className="ml-card__badge-name">{badge.name}</p>
          </div>
        </div>
      )}
      {archive && !locked && (
        <div className="ml-card__archive">
          <div className="ml-card__archive-visual">
            {archive.image ? <AssetImage asset={archive.image} /> : <RoverMark className="ml-card__rover" />}
          </div>
          <div>
            <p className="ml-card__badge-kicker">Ficha de archivo desbloqueada</p>
            <p className="ml-card__badge-name">{archive.title}</p>
            {archive.summary && <p className="ml-card__archive-sum">{archive.summary}</p>}
          </div>
        </div>
      )}
    </m.section>
  );
}
