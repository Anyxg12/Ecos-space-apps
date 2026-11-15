import { lazy, Suspense, useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { Destination, EcosHostContext, EcosPrologue, prologueStorage, type EcosHost, type ExplorerProfile } from './prologue';
import { useProgress } from './achievements/data/useProgress';
import { progressRepo, seenStore } from './app/progress';
import { sound } from './prologue/audio/soundEngine';
import { syncProfile } from './app/repositories';

const LogrosScreen = lazy(() => import('./app/LogrosScreen'));
const RankingScreen = lazy(() => import('./app/RankingScreen'));
type View = 'prologue' | 'universe' | 'logros' | 'ranking';

/**
 * App ECOS unificada: prólogo → universo (Marte → Spirit) ⇄ Mis logros.
 * El progreso vive en un único repositorio (localStorage) compartido por todas las pantallas.
 */
export default function App() {
  const params = new URLSearchParams(window.location.search);
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches || params.get('motion') === 'reduce';

  const [profile, setProfile] = useState<ExplorerProfile | null>(() => prologueStorage.getProfile());
  const [view, setView] = useState<View>(() => {
    if (params.get('view') === 'logros') return 'logros';
    if (params.get('view') === 'ranking' && prologueStorage.getProfile()) return 'ranking';
    return prologueStorage.hasSeenIntro() && prologueStorage.getProfile() ? 'universe' : 'prologue';
  });
  const [runId, setRunId] = useState(0);
  const [rankFrom, setRankFrom] = useState<'universe' | 'logros'>('universe');
  useUiSounds();
  // con backend: el perfil existente se copia una vez al arrancar (para aparecer en el ranking global)
  useEffect(() => {
    if (profile) void syncProfile(profile);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  const progress = useProgress(progressRepo);
  const unlockRef = useRef(progress.unlock);
  unlockRef.current = progress.unlock;

  const replay = useCallback(() => {
    prologueStorage.allowReplay();
    setRunId((n) => n + 1);
    setView('prologue');
  }, []);
  const reset = useCallback(() => {
    prologueStorage.clear();
    setProfile(null);
    setRunId((n) => n + 1);
    setView('prologue');
  }, []);
  const done = useCallback((p: ExplorerProfile) => {
    prologueStorage.markSeen(p);
    setProfile(p);
    void syncProfile(p);
    void unlockRef.current('horizonte');
    setView('universe');
  }, []);

  const list = progress.achievements ?? [];
  const statusMap = useMemo(() => new Map(list.map((a) => [a.id, a.status])), [list]);
  const host = useMemo<EcosHost>(
    () => ({
      openAchievements: () => setView('logros'),
      openRanking: () => (setRankFrom('universe'), setView('ranking')),
      unlock: (id) => void unlockRef.current(id),
      isUnlocked: (id) => statusMap.get(id) === 'unlocked',
      interests: profile?.interests,
    }),
    [statusMap, profile?.interests],
  );

  // ids desbloqueados desde la última visita a Mis logros (se encienden al llegar)
  const newly = useMemo(() => {
    if (view !== 'logros' || progress.loading) return [];
    const seen = new Set(seenStore.get());
    return list.filter((a) => a.status === 'unlocked' && !seen.has(a.id)).map((a) => a.id);
  }, [view, progress.loading]);

  // perfil local editable (seudónimo, edad, intereses): se guarda en el mismo almacenamiento del prólogo
  const updateProfile = useCallback((p: ExplorerProfile) => {
    prologueStorage.markSeen(p);
    setProfile(p);
    void syncProfile(p);
  }, []);
  const dest = (p: ExplorerProfile) => <Destination profile={p} reducedMotion={reducedMotion} onReplay={replay} onReset={reset} onProfileChange={updateProfile} />;

  let body: ReactNode;
  if (view === 'logros' && progress.achievements) {
    body = (
      <Suspense fallback={<div className="fixed inset-0 bg-black" />}>
        <LogrosScreen
          progress={{ ...progress, achievements: progress.achievements }}
          newlyUnlocked={newly}
          theme={profile?.ageGroup ?? 'explorer'}
          reducedMotion={reducedMotion}
          onExit={() => setView(profile ? 'universe' : 'prologue')}
          exitLabel={profile ? 'Universo' : 'Inicio'}
          onRanking={profile ? () => (setRankFrom('logros'), setView('ranking')) : undefined}
        />
      </Suspense>
    );
  } else if (view === 'ranking' && profile) {
    body = (
      <Suspense fallback={<div className="fixed inset-0 bg-black" />}>
        <RankingScreen
          theme={profile.ageGroup}
          alias={profile.alias}
          isUnlocked={host.isUnlocked}
          reducedMotion={reducedMotion}
          onBack={() => setView(rankFrom)}
          backLabel={rankFrom === 'logros' ? 'Mis logros' : 'Universo'}
          onLogros={() => setView('logros')}
          onExplore={() => setView('universe')}
        />
      </Suspense>
    );
  } else if (view === 'prologue' || !profile) {
    body = <EcosPrologue key={runId} onComplete={done} existingProfile={profile} renderDestination={dest} />;
  } else {
    body = <div className="fixed inset-0 overflow-y-auto">{dest(profile)}</div>;
  }
  return <EcosHostContext.Provider value={host}>{body}</EcosHostContext.Provider>;
}

/**
 * Microsonidos de interfaz (procedurales, volumen bajo): tic al pasar por un botón con ratón y clic al pulsar.
 * Sólo suenan si el usuario activó el sonido; los botones con `data-sfx="custom"` gestionan su propio sonido.
 */
function useUiSounds() {
  useEffect(() => {
    let last: Element | null = null;
    const target = (e: Event) => {
      const el = (e.target as Element | null)?.closest?.('button, a[href], [role="radio"], [role="button"]');
      return el && !el.closest('[data-sfx="custom"]') && !(el as HTMLButtonElement).disabled ? el : null;
    };
    const over = (e: PointerEvent) => {
      if (e.pointerType !== 'mouse') return;
      const el = target(e);
      if (el && el !== last) sound.tick();
      last = el;
    };
    const click = (e: MouseEvent) => {
      if (target(e)) sound.click();
    };
    document.addEventListener('pointerover', over, { passive: true });
    document.addEventListener('click', click, true);
    return () => {
      document.removeEventListener('pointerover', over);
      document.removeEventListener('click', click, true);
    };
  }, []);
}
