import { useEffect, useRef, useState } from 'react';
import { AGE_GROUPS, INTERESTS, MAX_INTERESTS } from '../state/catalog';
import type { AgeGroup, ExplorerProfile, InterestId } from '../state/types';
import { InterestIcon } from '../components/InterestIcon';
import { useEcosHost } from '../host';
import { buildRanking } from '../state/ranking';
import { SecretKeyBox } from './SecretKeyBox';
import { secretStore } from '../state/secretKey';

const ALIAS_RE = /^[\p{L}\p{N} _.-]{2,20}$/u;

/**
 * Perfil local del explorador: seudónimo, franja de edad e intereses.
 * Se guarda sólo en este navegador (localStorage). Sin correo, nombre real, fecha de nacimiento ni ubicación.
 */
export function ProfileScreen({ profile, onSave, onClose, onReplay, onReset }: { profile: Pick<ExplorerProfile, 'ageGroup' | 'interests'> & Partial<ExplorerProfile>; onSave: (p: ExplorerProfile) => void; onClose: () => void; onReplay?: () => void; onReset?: () => void }) {
  const host = useEcosHost();
  const [alias, setAlias] = useState(profile.alias ?? '');
  const [age, setAge] = useState<AgeGroup>(profile.ageGroup);
  const [ints, setInts] = useState<InterestId[]>(profile.interests);
  const [saved, setSaved] = useState(false);
  const headRef = useRef<HTMLHeadingElement>(null);
  const aliasOk = alias.trim() === '' || ALIAS_RE.test(alias.trim());
  const rank = buildRanking(alias, (id) => !!host?.isUnlocked(id));
  const [unlocked, setUnlocked] = useState(() => secretStore.isUnlocked());
  const locked = !unlocked;

  useEffect(() => {
    headRef.current?.focus({ preventScroll: true });
    const k = (e: KeyboardEvent) => e.key === 'Escape' && (e.stopPropagation(), onClose());
    window.addEventListener('keydown', k, true);
    return () => window.removeEventListener('keydown', k, true);
  }, [onClose]);

  const toggle = (id: InterestId) => setInts((cur) => (cur.includes(id) ? cur.filter((x) => x !== id) : cur.length >= MAX_INTERESTS ? cur : [...cur, id]));
  const save = () => {
    if (locked || !aliasOk || ints.length === 0) return;
    onSave({ ageGroup: age, interests: ints, createdAt: profile.createdAt ?? new Date().toISOString(), ...(alias.trim() ? { alias: alias.trim() } : {}) });
    setSaved(true);
  };

  return (
    <div className="prof" role="dialog" aria-modal="true" aria-labelledby="prof-title" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="prof__panel">
        <div className="prof__top">
          <h2 id="prof-title" ref={headRef} tabIndex={-1}>Tu perfil de explorador</h2>
          <button type="button" className="prof__x" onClick={onClose} aria-label="Cerrar perfil">✕</button>
        </div>
        <p className="prof__lead">Se guarda solo en este navegador. No pedimos correo, nombre real, fecha de nacimiento ni ubicación.</p>
        {locked && (
          <SecretKeyBox mode="unlock" onChange={() => setUnlocked(secretStore.isUnlocked())} />
        )}
        <fieldset className="prof__lockset" disabled={locked}>

        <label className="prof__label" htmlFor="prof-alias">Seudónimo de explorador</label>
        <input id="prof-alias" className="prof__input" value={alias} maxLength={20} autoComplete="off" spellCheck={false} placeholder="Ej.: Eco-7, Polvo Rojo…" aria-invalid={!aliasOk} aria-describedby="prof-alias-help" onChange={(e) => (setAlias(e.target.value), setSaved(false))} />
        <p id="prof-alias-help" className={`prof__help ${aliasOk ? '' : 'is-bad'}`}>{aliasOk ? 'Opcional. 2 a 20 caracteres. Inventa uno: no uses tu nombre real.' : 'Usa de 2 a 20 letras, números, espacios, «-», «_» o «.».'}</p>

        <fieldset className="prof__set">
          <legend className="prof__label">Franja de edad</legend>
          <div className="prof__ages">
            {AGE_GROUPS.map((g) => (
              <label key={g.id} className={`prof__age ${age === g.id ? 'is-on' : ''}`}>
                <input type="radio" name="prof-age" value={g.id} checked={age === g.id} onChange={() => (setAge(g.id), setSaved(false))} />
                <b>{g.label}</b> <small>{g.range}</small>
              </label>
            ))}
          </div>
          <p className="prof__help">Cambia el estilo de ECOS (Junior, Explorer o Discovery). Tu progreso se conserva.</p>
        </fieldset>

        <fieldset className="prof__set">
          <legend className="prof__label">Intereses <small>({ints.length}/{MAX_INTERESTS})</small></legend>
          <div className="prof__ints">
            {INTERESTS.map((i) => (
              <button key={i.id} type="button" aria-pressed={ints.includes(i.id)} className={`prof__int ${ints.includes(i.id) ? 'is-on' : ''}`} disabled={!ints.includes(i.id) && ints.length >= MAX_INTERESTS} onClick={() => (toggle(i.id), setSaved(false))}>
                <InterestIcon id={i.id} /> {i.label}
              </button>
            ))}
          </div>
        </fieldset>

        <div className="prof__row">
          <button type="button" className="prof__save" disabled={!aliasOk || ints.length === 0} onClick={save}>Guardar perfil</button>
          <span className="prof__saved" role="status">{saved ? '✓ Guardado en este navegador' : ''}</span>
        </div>
        </fieldset>

        {(onReplay || onReset) && (
          <div className="prof__row prof__more">
            {onReplay && <button type="button" className="prof__ghost" onClick={onReplay}>Ver la intro otra vez</button>}
            {onReset && <button type="button" className="prof__ghost" onClick={onReset}>Empezar de nuevo (elegir edad e intereses)</button>}
          </div>
        )}

        {!locked && <SecretKeyBox mode="manage" onChange={() => setUnlocked(secretStore.isUnlocked())} />}

        <section className="prof__box" aria-labelledby="prof-key">
          <h3 id="prof-key">Clave de recuperación — Pendiente</h3>
          <p>La clave secreta solo funciona en este dispositivo. Recuperar tu cuenta o seguir en otro dispositivo llegará cuando ECOS se conecte a un servidor (Supabase — Pendiente). Hoy, si borras los datos del navegador, tu progreso se pierde.</p>
        </section>

        <section className="prof__box" aria-labelledby="prof-rank">
          <h3 id="prof-rank">Top exploradores <span className="prof__demo">Datos de demostración</span></h3>
          <p>Con tus estrellas reales ({rank.me.stars} de {rank.total}) estarías en el puesto #{rank.position} de una tabla de ejemplo. El ranking global está pendiente.</p>
          {host?.openRanking && (
            <button type="button" className="prof__ghost" onClick={host.openRanking}>▲ Ver Top exploradores</button>
          )}
        </section>
      </div>
    </div>
  );
}
