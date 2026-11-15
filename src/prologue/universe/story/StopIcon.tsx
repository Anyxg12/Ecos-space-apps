import type { StopIcon as Icon } from '../../../data/stories';

/** Iconos de parada dibujados por código (trazo = currentColor). */
const PATHS: Record<Icon, string> = {
  build: 'M4 17h16M7 17v-4h10v4M9 13V9h6v4M12 9V5M10 5h4',
  rocket: 'M12 3c3 3 4 7 3 11H9C8 10 9 6 12 3zM9 14l-3 4 3-1M15 14l3 4-3-1M11 19h2',
  name: 'M5 6h14v9H9l-4 4zM8 10h8M8 12.5h5',
  landing: 'M12 4v6M8 7l4 3 4-3M6 18a6 4 0 0 1 12 0M4 20h16',
  route: 'M4 18c4 0 3-6 8-6s4-6 8-6M4 18h.01M20 6h.01',
  signal: 'M12 20v-8M8.5 8.5a5 5 0 0 1 7 0M6 6a8.5 8.5 0 0 1 12 0M12 12h.01',
  station: 'M5 16h14v3H5zM8 16v-4h8v4M12 12V6M9 5q3 3 6 0',
  seismo: 'M3 12h4l2-5 3 10 2-7 2 4h5',
  module: 'M8 4h8l2 6H6zM6 10l-2 8M18 10l2 8M9 18h6M12 10v8',
  power: 'M13 3L6 13h5l-1 8 7-10h-5z',
  quake: 'M3 13l3-3 3 5 3-8 3 6 3-3 3 3M12 20h.01',
  off: 'M12 4v7M7.5 7a6.5 6.5 0 1 0 9 0',
  song: 'M9 18V6l10-2v12M9 18a2.5 2 0 1 1-5 0 2.5 2 0 0 1 5 0zM19 16a2.5 2 0 1 1-5 0 2.5 2 0 0 1 5 0z',
  debris: 'M5 11a7 7 0 0 1 14 0zM8 11l4 5 4-5M12 16v2M4 20h16M15 20a3 1.4 0 0 1 5 0',
};

export function StopIcon({ icon }: { icon: Icon }) {
  return (
    <svg className="sr__icon" viewBox="0 0 24 24" aria-hidden="true">
      <path d={PATHS[icon]} fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
