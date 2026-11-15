/** Tipos públicos de «Mis logros: Constelación personal». */

export type AchievementsTheme = 'junior' | 'explorer' | 'discovery';

export type AchievementStatus = 'unlocked' | 'locked';

export interface Achievement {
  /** Identificador estable (p. ej. el de la base de datos). */
  id: string;
  /** Nombre del logro. */
  title: string;
  /** Actividad de ECOS que lo otorga (p. ej. «Misión Spirit»). */
  activity: string;
  /** Fecha ISO (AAAA-MM-DD) en que se consiguió; `null` si no se conoce o está bloqueado. */
  date: string | null;
  /** Descripción breve (1–2 frases). */
  description: string;
  status: AchievementStatus;
  /** Posición en la constelación, 0–1 (x de izquierda a derecha, y de arriba abajo). Si falta, se calcula. */
  position?: { x: number; y: number };
  /** Brillo relativo de la estrella (0,6–1,4). Por defecto 1. */
  magnitude?: number;
  /** Insignia asociada (id de `Badge`), si la hay. */
  badgeId?: string;
  /** Para logros bloqueados: cómo se desbloqueará (texto opcional). */
  hint?: string;
  /** Meta futura que todavía no se puede conseguir (se muestra como bloqueada). */
  future?: boolean;
}

export interface Badge {
  id: string;
  name: string;
  /** Insignia provisional (diseño o nombre no definitivo). */
  provisional?: boolean;
  /** Logro que la concede. */
  achievementId: string;
  /** Icono: uno de los glifos incluidos. */
  icon?: 'tracks' | 'star' | 'planet';
}

/**
 * Imagen usada en el componente. Si `aiGenerated` es true se muestra SIEMPRE una marca
 * visible «Imagen generada con IA» (transparencia obligatoria en ECOS).
 */
export interface ImageAsset {
  src: string;
  alt: string;
  aiGenerated?: boolean;
  /** Crédito visible (p. ej. «NASA/JPL-Caltech» sólo si la fuente está verificada). */
  credit?: string;
}

/** Ficha de archivo desbloqueable (p. ej. «Ficha de Spirit»). */
export interface ArchiveCard {
  id: string;
  title: string;
  /** Logro que la desbloquea. */
  achievementId: string;
  /** Resumen breve (sin datos históricos hasta tener fuente verificada). */
  summary?: string;
  image?: ImageAsset;
}

export interface ConstellationLink {
  from: string;
  to: string;
}

export interface MisLogrosProps {
  achievements: Achievement[];
  badges?: Badge[];
  /** Fichas de archivo desbloqueables. */
  archiveCards?: ArchiveCard[];
  /** Líneas de la constelación. Si se omite, une los logros en orden. */
  links?: ConstellationLink[];
  /** Se conserva por compatibilidad; la vista es única para todas las edades (sólo se expone como `data-theme`). */
  theme?: AchievementsTheme;
  /** Muestra la etiqueta «Datos de demostración». */
  demo?: boolean;
  /** Título de la pantalla. Por defecto «Mis logros». */
  title?: string;
  /** Salta la transición Tierra → cielo (p. ej. si ya se vio en esta sesión). */
  skipIntro?: boolean;
  /** Fuerza movimiento reducido (además de `prefers-reduced-motion`). */
  reducedMotion?: boolean;
  /** Se llama al abrir la tarjeta de un logro. */
  onSelect?: (achievement: Achievement) => void;
  /** Se llama al cerrar la tarjeta. */
  onClose?: () => void;
  /** Se llama cuando termina (o se salta) la transición de entrada. */
  onIntroEnd?: () => void;
  /** Viaje Tierra → espacio en WebGL (Three.js, carga diferida). Con `false` o sin WebGL se usa la versión CSS/SVG. */
  webgl?: boolean;
  /** Ids desbloqueados fuera de esta vista desde la última visita: se encienden al llegar al espacio. */
  newlyUnlocked?: string[];
  /** Botón «volver» en la barra superior (navegación del host). */
  onExit?: () => void;
  exitLabel?: string;
  /** Textura de la Tierra vista desde órbita (por defecto NASA Blue Marble, dominio público, incluida). */
  earthTextureUrl?: string;
  /** Sonido opcional al abrir un logro. Siempre empieza apagado salvo que se pase true. */
  defaultSound?: boolean;
  /** Formato de fecha. Por defecto `es` con día, mes y año. */
  formatDate?: (iso: string) => string;
  className?: string;
}
