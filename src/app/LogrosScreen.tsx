import { useEffect, useState } from 'react';
import { MisLogros, type AchievementsTheme, type UnlockMeta } from '../achievements';
import type { Achievement } from '../achievements';
import { APP_ARCHIVE, APP_BADGES, APP_LINKS } from './catalog';
import { seenStore } from './progress';

interface Props {
  progress: { achievements: Achievement[]; unlock: (id: string, meta?: UnlockMeta) => Promise<unknown>; reset: () => Promise<unknown> };
  newlyUnlocked: string[];
  theme: AchievementsTheme;
  reducedMotion: boolean;
  onExit: () => void;
  exitLabel: string;
  onRanking?: () => void;
}

const STAGES = [
  { id: 'spirit-historia', label: 'Spirit · Historia' },
  { id: 'spirit-actividad', label: 'Spirit · Actividad' },
  { id: 'spirit-legado', label: 'Spirit · Legado' },
  { id: 'opportunity-historia', label: 'Opportunity · Historia' },
  { id: 'opportunity-actividad', label: 'Opportunity · Actividad' },
  { id: 'opportunity-legado', label: 'Opportunity · Legado' },
  { id: 'alsep-historia', label: 'ALSEP · Historia' },
  { id: 'alsep-actividad', label: 'ALSEP · Actividad' },
  { id: 'alsep-legado', label: 'ALSEP · Legado' },
];

/** Pantalla «Mis logros» de la app + panel de demostración claramente rotulado. */
export default function LogrosScreen({ progress, newlyUnlocked, theme, reducedMotion, onExit, exitLabel, onRanking }: Props) {
  const [run, setRun] = useState(0);
  const [introDone, setIntroDone] = useState(false);
  const [panel, setPanel] = useState(false);
  const [cardOpen, setCardOpen] = useState(false);
  const { achievements } = progress;
  const params = new URLSearchParams(window.location.search);

  // al entrar, lo desbloqueado pasa a «visto»
  useEffect(() => {
    seenStore.set(achievements.filter((a) => a.status === 'unlocked').map((a) => a.id));
  }, [achievements]);

  const isOn = (id: string) => achievements.find((a) => a.id === id)?.status === 'unlocked';
  return (
    <div className="fixed inset-0">
      <MisLogros
        key={run}
        achievements={achievements}
        badges={APP_BADGES}
        archiveCards={APP_ARCHIVE}
        links={APP_LINKS}
        theme={theme}
        demo
        reducedMotion={reducedMotion}
        skipIntro={params.get('skip') === '1'}
        webgl={params.get('gl') !== '0'}
        newlyUnlocked={run === 0 ? newlyUnlocked : []}
        onIntroEnd={() => setIntroDone(true)}
        onSelect={() => setCardOpen(true)}
        onClose={() => setCardOpen(false)}
        onExit={onExit}
        exitLabel={exitLabel}
      />
      {introDone && !cardOpen && onRanking && (
        <button type="button" className="rank-link" onClick={onRanking}>
          <span aria-hidden="true">▲ </span>Top exploradores
        </button>
      )}
      {introDone && !cardOpen && (
        <div className="demo-dock">
          <button type="button" className="demo-dock__toggle" aria-expanded={panel} onClick={() => setPanel((v) => !v)}>
            Panel demo
          </button>
          {panel && (
            <div className="demo-dock__panel" role="group" aria-label="Panel de demostración: simular progreso">
              <p className="demo-dock__title">Demostración · simular progreso</p>
              {STAGES.map((s) => (
                <button key={s.id} type="button" disabled={isOn(s.id)} onClick={() => void progress.unlock(s.id)}>
                  {isOn(s.id) ? '✓ ' : ''}Completar {s.label}
                </button>
              ))}
              <button type="button" onClick={() => (setIntroDone(false), setRun((r) => r + 1))}>
                Repetir entrada
              </button>
              <button type="button" className="is-danger" onClick={() => (void progress.reset(), seenStore.clear())}>
                Reiniciar progreso
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
