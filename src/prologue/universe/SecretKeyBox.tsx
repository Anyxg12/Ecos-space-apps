import { useId, useState } from 'react';
import { SECRET_MAX, SECRET_MIN, cryptoAvailable, secretStore } from '../state/secretKey';

type Step = 'idle' | 'create' | 'change' | 'confirmRemove';

/**
 * Clave secreta local: crear, desbloquear, cambiar o quitar.
 * Sólo se guarda sal + hash (PBKDF2-SHA-256). La clave nunca sale del navegador; no hay recuperación.
 */
export function SecretKeyBox({ mode, onChange }: { mode: 'unlock' | 'manage'; onChange: () => void }) {
  const id = useId();
  const [has, setHas] = useState(() => secretStore.has());
  const [step, setStep] = useState<Step>('idle');
  const [a, setA] = useState('');
  const [b, setB] = useState('');
  const [msg, setMsg] = useState('');
  const [busy, setBusy] = useState(false);
  const ok = cryptoAvailable();
  const lenOk = a.length >= SECRET_MIN && a.length <= SECRET_MAX;
  const reset = () => (setA(''), setB(''), setStep('idle'));

  const unlock = async () => {
    setBusy(true);
    const good = await secretStore.verify(a).catch(() => false);
    setBusy(false);
    setMsg(good ? '✓ Perfil desbloqueado en este dispositivo.' : 'Clave incorrecta. Inténtalo otra vez.');
    if (good) (reset(), onChange());
  };
  const create = async () => {
    if (!lenOk || a !== b) return;
    setBusy(true);
    try {
      await secretStore.set(a);
      setHas(true);
      setMsg(step === 'change' ? '✓ Clave cambiada.' : '✓ Clave creada. Guárdala bien: no se puede recuperar.');
      reset();
      onChange();
    } catch {
      setMsg('No se pudo guardar la clave en este navegador.');
    }
    setBusy(false);
  };

  if (mode === 'unlock')
    return (
      <form className="prof__box prof__key prof__key--lock" aria-labelledby={`${id}-h`} onSubmit={(e) => (e.preventDefault(), void unlock())}>
        <h3 id={`${id}-h`}>🔒 Perfil protegido con clave secreta</h3>
        <p>Escribe tu clave para editar el perfil en este dispositivo.</p>
        <label className="prof__label" htmlFor={`${id}-u`}>Clave secreta</label>
        <div className="prof__row">
          <input id={`${id}-u`} className="prof__input" type="password" autoComplete="current-password" value={a} maxLength={SECRET_MAX} onChange={(e) => (setA(e.target.value), setMsg(''))} />
          <button type="submit" className="prof__save" disabled={busy || !a}>Desbloquear</button>
        </div>
        <p className="prof__help" role="status">{msg}</p>
      </form>
    );

  return (
    <section className="prof__box prof__key" aria-labelledby={`${id}-h`}>
      <h3 id={`${id}-h`}>Clave secreta <span className="prof__demo">Solo este dispositivo</span></h3>
      {!ok ? (
        <p>Este navegador no permite crear claves seguras (Web Crypto no disponible). Tu perfil sigue funcionando sin clave.</p>
      ) : step === 'create' || step === 'change' ? (
        <form onSubmit={(e) => (e.preventDefault(), void create())}>
          <label className="prof__label" htmlFor={`${id}-a`}>{step === 'change' ? 'Nueva clave secreta' : 'Clave secreta'}</label>
          <input id={`${id}-a`} className="prof__input" type="password" autoComplete="new-password" value={a} maxLength={SECRET_MAX} aria-describedby={`${id}-help`} onChange={(e) => (setA(e.target.value), setMsg(''))} />
          <label className="prof__label" htmlFor={`${id}-b`}>Repite la clave</label>
          <input id={`${id}-b`} className="prof__input" type="password" autoComplete="new-password" value={b} maxLength={SECRET_MAX} onChange={(e) => (setB(e.target.value), setMsg(''))} />
          <p id={`${id}-help`} className={`prof__help ${a && !lenOk ? 'is-bad' : b && a !== b ? 'is-bad' : ''}`}>
            {a && !lenOk ? `Usa de ${SECRET_MIN} a ${SECRET_MAX} caracteres.` : b && a !== b ? 'Las dos claves no coinciden.' : `De ${SECRET_MIN} a ${SECRET_MAX} caracteres. Inventa una nueva: no uses la contraseña de otra cuenta.`}
          </p>
          <div className="prof__row">
            <button type="submit" className="prof__save" disabled={busy || !lenOk || a !== b}>{step === 'change' ? 'Cambiar clave' : 'Crear clave secreta'}</button>
            <button type="button" className="prof__ghost" onClick={reset}>Cancelar</button>
          </div>
        </form>
      ) : step === 'confirmRemove' ? (
        <div>
          <p>¿Quitar la clave? Tu progreso y tu perfil se conservan; solo dejarán de estar protegidos.</p>
          <div className="prof__row">
            <button type="button" className="prof__save" onClick={() => (secretStore.clear(), setHas(false), setStep('idle'), setMsg('Clave quitada.'), onChange())}>Sí, quitar clave</button>
            <button type="button" className="prof__ghost" onClick={() => setStep('idle')}>Cancelar</button>
          </div>
        </div>
      ) : has ? (
        <div>
          <p>✓ Tu perfil está protegido con una clave en este dispositivo (creada {secretStore.info()?.createdAt}). Guardamos solo una huella cifrada (hash PBKDF2-SHA-256 con sal), nunca la clave.</p>
          <div className="prof__row">
            <button type="button" className="prof__ghost" onClick={() => (secretStore.lock(), onChange())}>Bloquear ahora</button>
            <button type="button" className="prof__ghost" onClick={() => setStep('change')}>Cambiar clave</button>
            <button type="button" className="prof__ghost" onClick={() => setStep('confirmRemove')}>Quitar clave</button>
          </div>
        </div>
      ) : (
        <div>
          <p>Protege tu perfil con un seudónimo y una clave secreta. Guardamos solo una huella cifrada (hash con sal), nunca la clave, y nada sale de este navegador. Si la olvidas, no se puede recuperar.</p>
          <button type="button" className="prof__ghost" onClick={() => setStep('create')}>Crear clave secreta</button>
        </div>
      )}
      <p className="prof__help" role="status">{msg}</p>
    </section>
  );
}
