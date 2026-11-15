import type { ReactNode } from 'react';
import type { InterestId } from '../state/types';

/**
 * Iconos de trazo propios (24×24), dibujados con primitivas y centrados ópticamente
 * en la caja 3–21 para que todos tengan el mismo peso y alineación.
 */
const ICONS: Record<InterestId, ReactNode> = {
  futbol: (
    <>
      <circle cx="12" cy="12" r="9" />
      <path d="M12 8.2l3.6 2.6-1.4 4.2H9.8l-1.4-4.2z" />
      <path d="M12 3v5.2M15.6 10.8l4.9-1.6M14.2 15l3 4.2M9.8 15l-3 4.2M8.4 10.8L3.5 9.2" />
    </>
  ),
  videojuegos: (
    <>
      <path d="M7.5 7.5h9a4.5 4.5 0 0 1 4.5 4.5v1.3a3 3 0 0 1-5.4 1.8L14.4 13.5H9.6L8.4 15.1A3 3 0 0 1 3 13.3V12a4.5 4.5 0 0 1 4.5-4.5z" />
      <path d="M8 10v3.5M6.25 11.75h3.5" />
      <circle cx="15.5" cy="10.75" r="0.6" fill="currentColor" />
      <circle cx="17.25" cy="12.75" r="0.6" fill="currentColor" />
    </>
  ),
  arte: (
    <>
      <path d="M12 3a9 9 0 1 0 0 18c1.2 0 1.8-.8 1.8-1.7 0-1.3-1.1-1.6-1.1-2.7 0-.9.8-1.6 1.7-1.6H17a4 4 0 0 0 4-4C21 6.6 17 3 12 3z" />
      <circle cx="7.5" cy="11.5" r="1" fill="currentColor" />
      <circle cx="10" cy="7.5" r="1" fill="currentColor" />
      <circle cx="14.5" cy="7.5" r="1" fill="currentColor" />
      <circle cx="17" cy="11" r="1" fill="currentColor" />
    </>
  ),
  animales: (
    <>
      <path d="M12 12.2c-3 0-5.2 2.7-5.2 4.9 0 1.6 1.2 2.6 2.7 2.6 1 0 1.6-.6 2.5-.6s1.5.6 2.5.6c1.5 0 2.7-1 2.7-2.6 0-2.2-2.2-4.9-5.2-4.9z" />
      <ellipse cx="5.6" cy="10" rx="1.7" ry="2.2" />
      <ellipse cx="9.4" cy="5.8" rx="1.7" ry="2.3" />
      <ellipse cx="14.6" cy="5.8" rx="1.7" ry="2.3" />
      <ellipse cx="18.4" cy="10" rx="1.7" ry="2.2" />
    </>
  ),
  musica: (
    <>
      <path d="M9 17.5V5.5l10-2v12" />
      <circle cx="6.5" cy="17.5" r="2.5" />
      <circle cx="16.5" cy="15.5" r="2.5" />
      <path d="M9 9.5l10-2" />
    </>
  ),
  tecnologia: (
    <>
      <rect x="6.5" y="6.5" width="11" height="11" rx="1.5" />
      <rect x="9.5" y="9.5" width="5" height="5" rx="0.5" />
      <path d="M9.5 3.5v3M14.5 3.5v3M9.5 17.5v3M14.5 17.5v3M3.5 9.5h3M3.5 14.5h3M17.5 9.5h3M17.5 14.5h3" />
    </>
  ),
  ciencia: (
    <>
      <path d="M9 3.5h6M10 3.5v5.5L5.2 17.6A2 2 0 0 0 7 20.5h10a2 2 0 0 0 1.8-2.9L14 9V3.5" />
      <path d="M7.6 14.5h8.8" />
    </>
  ),
  robotica: (
    <>
      <rect x="5" y="8" width="14" height="11" rx="2.5" />
      <path d="M12 8V5" />
      <circle cx="12" cy="4" r="1" />
      <circle cx="9.3" cy="12.8" r="1" fill="currentColor" />
      <circle cx="14.7" cy="12.8" r="1" fill="currentColor" />
      <path d="M9.5 16h5M3 12v3M21 12v3" />
    </>
  ),
  naturaleza: (
    <>
      <path d="M12 21v-7.5" />
      <path d="M12 13.5C8 13.5 5 10.6 5 5.5c4 0 7 2.9 7 8z" />
      <path d="M12 16c3.2 0 6-2.1 6-6.3-3.2 0-6 2.1-6 6.3z" />
    </>
  ),
  historia: (
    <>
      <path d="M5 5.5A2 2 0 0 1 7 3.5h12v14H7a2 2 0 0 0-2 2z" />
      <path d="M5 19.5a1 1 0 0 0 1 1h13M9 8h6M9 11h4" />
    </>
  ),
  cine: (
    <>
      <rect x="3.5" y="8.5" width="17" height="11" rx="1.5" />
      <path d="M3.5 8.5l2-4.5h15l-2 4.5M9 4l-2 4.5M14.5 4l-2 4.5" />
      <path d="M10.5 11.5l4 2.5-4 2.5z" />
    </>
  ),
  cocina: (
    <>
      <path d="M7 3.5v6a2 2 0 0 0 4 0v-6M9 9.5v11" />
      <path d="M17 20.5v-17c-2 .9-3 3.8-3 7h3" />
    </>
  ),
};

export function InterestIcon({ id, className = '' }: { id: InterestId; className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      className={`block shrink-0 ${className}`}
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      {ICONS[id]}
    </svg>
  );
}
