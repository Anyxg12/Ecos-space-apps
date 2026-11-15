/**
 * Motor de sonido del prólogo — 100 % Web Audio procedural (sin archivos).
 * - Apagado por defecto; la preferencia se guarda en localStorage al activarlo.
 * - Nunca arranca sin un gesto del usuario (política de autoplay): si la preferencia
 *   está activa, el contexto se reanuda en el primer clic/toque/tecla.
 * - Cadena: ganancia maestra → compresor → limitador → salida. El nivel se subió ~2,5× (v1.1)
 *   porque en altavoces de portátil apenas se oía; el limitador evita picos y distorsión.
 */
const KEY = 'ecos.sound.v1';
/** Nivel maestro (antes 0.8). Los microefectos se oyen claros; el compresor/limitador contienen los picos. */
const MASTER_LEVEL = 2;
/** Refuerzo extra de los microefectos cortos (clics, notas, aciertos): eran los que menos se oían. */
const BLIP_BOOST = 1.6;

type Listener = (on: boolean) => void;

class SoundEngine {
  private ctx: AudioContext | null = null;
  private master: GainNode | null = null;
  private ambient: { stop: () => void } | null = null;
  private listeners = new Set<Listener>();
  enabled = readPref();
  reduced = false;

  constructor() {
    if (typeof window === 'undefined') return;
    const unlock = () => {
      if (this.enabled) this.ensure();
    };
    window.addEventListener('pointerdown', unlock, { passive: true });
    window.addEventListener('keydown', unlock);
  }

  subscribe(l: Listener) {
    this.listeners.add(l);
    return () => this.listeners.delete(l);
  }

  /** Llamar sólo desde un gesto del usuario (botón de sonido). */
  setEnabled(on: boolean) {
    this.enabled = on;
    try {
      window.localStorage.setItem(KEY, on ? '1' : '0');
    } catch {
      /* sin persistencia */
    }
    if (on) this.ensure();
    else {
      this.stopLaunch();
      this.ambient?.stop();
      this.ambient = null;
      if (this.master && this.ctx) this.master.gain.setTargetAtTime(0, this.ctx.currentTime, 0.15);
    }
    this.listeners.forEach((l) => l(on));
  }

  private ensure(): AudioContext | null {
    if (!this.enabled) return null;
    if (!this.ctx) {
      const Ctx = window.AudioContext ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
      if (!Ctx) return null;
      this.ctx = new Ctx();
      const comp = this.ctx.createDynamicsCompressor();
      comp.threshold.value = -20;
      comp.knee.value = 10;
      comp.ratio.value = 4;
      comp.attack.value = 0.004;
      comp.release.value = 0.2;
      // limitador «de seguridad»: deja pasar casi todo y aplasta sólo los picos cercanos a 0 dBFS
      const limiter = this.ctx.createDynamicsCompressor();
      limiter.threshold.value = -3;
      limiter.knee.value = 0;
      limiter.ratio.value = 20;
      limiter.attack.value = 0.001;
      limiter.release.value = 0.08;
      this.master = this.ctx.createGain();
      this.master.gain.value = MASTER_LEVEL;
      this.master.connect(comp).connect(limiter).connect(this.ctx.destination);
    }
    if (this.ctx.state === 'suspended') void this.ctx.resume();
    if (this.master) this.master.gain.setTargetAtTime(MASTER_LEVEL, this.ctx.currentTime, 0.2);
    if (!this.ambient) this.ambient = this.startAmbient();
    return this.ctx;
  }

  private noiseBuffer(ctx: AudioContext, seconds: number) {
    // ruido marrón (grave y suave)
    const buf = ctx.createBuffer(1, Math.floor(ctx.sampleRate * seconds), ctx.sampleRate);
    const d = buf.getChannelData(0);
    let last = 0;
    for (let i = 0; i < d.length; i++) {
      last = (last + 0.02 * (Math.random() * 2 - 1)) / 1.02;
      d[i] = last * 3.2;
    }
    return buf;
  }

  private startAmbient() {
    const ctx = this.ctx!;
    const g = ctx.createGain();
    g.gain.value = 0;
    g.gain.linearRampToValueAtTime(0.03, ctx.currentTime + 3); // fondo: sube menos que los efectos
    const lp = ctx.createBiquadFilter();
    lp.type = 'lowpass';
    lp.frequency.value = 380;
    lp.connect(g).connect(this.master!);
    const oscs = [55, 82.4, 110.3].map((f, i) => {
      const o = ctx.createOscillator();
      o.type = i === 2 ? 'triangle' : 'sine';
      o.frequency.value = f;
      o.detune.value = (i - 1) * 6;
      const og = ctx.createGain();
      og.gain.value = i === 2 ? 0.1 : 0.32;
      o.connect(og).connect(lp);
      o.start();
      return o;
    });
    const lfo = ctx.createOscillator();
    const lfoG = ctx.createGain();
    lfo.frequency.value = 0.07;
    lfoG.gain.value = 140;
    lfo.connect(lfoG).connect(lp.frequency);
    lfo.start();
    return {
      stop: () => {
        const t = ctx.currentTime;
        g.gain.cancelScheduledValues(t);
        g.gain.setTargetAtTime(0, t, 0.3);
        window.setTimeout(() => [...oscs, lfo].forEach((o) => o.stop()), 1500);
      },
    };
  }

  /** Caída hacia el horizonte: retumbo + «whoosh» que crece y se apaga en la oscuridad. */
  fall(durationMs: number) {
    const ctx = this.ensure();
    if (!ctx || !this.master) return;
    const dur = (this.reduced ? Math.min(durationMs, 1200) : durationMs) / 1000;
    const peak = this.reduced ? 0.09 : 0.2;
    const t = ctx.currentTime;
    const src = ctx.createBufferSource();
    src.buffer = this.noiseBuffer(ctx, dur + 2.5);
    const bp = ctx.createBiquadFilter();
    bp.type = 'lowpass';
    bp.Q.value = 0.7;
    bp.frequency.setValueAtTime(90, t);
    bp.frequency.exponentialRampToValueAtTime(this.reduced ? 300 : 900, t + dur * 0.8);
    bp.frequency.exponentialRampToValueAtTime(70, t + dur + 1.8);
    const g = ctx.createGain();
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(peak, t + dur * 0.75);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur + 2.2);
    src.connect(bp).connect(g).connect(this.master);
    src.start(t);
    src.stop(t + dur + 2.5);
    // sub‑grave que desciende (sensación de caída)
    const sub = ctx.createOscillator();
    sub.type = 'sine';
    sub.frequency.setValueAtTime(46, t);
    sub.frequency.exponentialRampToValueAtTime(27, t + dur + 1.5);
    const sg = ctx.createGain();
    sg.gain.setValueAtTime(0.0001, t);
    sg.gain.exponentialRampToValueAtTime(peak * 0.8, t + dur * 0.7);
    sg.gain.exponentialRampToValueAtTime(0.0001, t + dur + 2);
    sub.connect(sg).connect(this.master);
    sub.start(t);
    sub.stop(t + dur + 2.2);
  }

  /** El universo «se asienta» al aparecer el logo: acorde cálido muy suave. */
  settle() {
    const ctx = this.ensure();
    if (!ctx || !this.master) return;
    const t = ctx.currentTime;
    const peak = this.reduced ? 0.02 : 0.035;
    [110, 164.8, 220, 329.6].forEach((f, i) => {
      const o = ctx.createOscillator();
      o.type = 'sine';
      o.frequency.value = f;
      o.detune.value = (i % 2 ? 1 : -1) * 4;
      const g = ctx.createGain();
      g.gain.setValueAtTime(0.0001, t);
      g.gain.exponentialRampToValueAtTime(peak / (1 + i * 0.4), t + 1.6);
      g.gain.exponentialRampToValueAtTime(0.0001, t + (this.reduced ? 2.5 : 5.5));
      o.connect(g).connect(this.master!);
      o.start(t);
      o.stop(t + 6);
    });
  }

  /** «Señal detectada»: dos notas suaves con eco. */
  signal() {
    const ctx = this.ensure();
    if (!ctx || !this.master) return;
    const t = ctx.currentTime;
    const delay = ctx.createDelay(1);
    delay.delayTime.value = 0.32;
    const fb = ctx.createGain();
    fb.gain.value = this.reduced ? 0.15 : 0.32;
    const wet = ctx.createGain();
    wet.gain.value = 0.5;
    delay.connect(fb).connect(delay);
    delay.connect(wet).connect(this.master);
    [
      [880, 0],
      [1318.5, 0.22],
    ].forEach(([f, off]) => {
      const o = ctx.createOscillator();
      o.type = 'sine';
      o.frequency.value = f;
      const g = ctx.createGain();
      const s = t + off;
      g.gain.setValueAtTime(0.0001, s);
      g.gain.exponentialRampToValueAtTime(this.reduced ? 0.02 : 0.035, s + 0.03);
      g.gain.exponentialRampToValueAtTime(0.0001, s + 0.9);
      o.connect(g);
      g.connect(this.master!);
      g.connect(delay);
      o.start(s);
      o.stop(s + 1);
    });
  }

  // ───────── Microefectos de interfaz y de Mis logros (todo procedural, volumen bajo) ─────────

  /** Contexto sólo si ya está sonando (para efectos sin gesto, p. ej. al pasar el ratón). */
  private live(): AudioContext | null {
    return this.enabled && this.ctx && this.ctx.state === 'running' && this.master ? this.ctx : null;
  }

  private blip(ctx: AudioContext, f0: number, f1: number, dur: number, peak: number, type: OscillatorType = 'sine', at = 0) {
    const t = ctx.currentTime + at;
    const o = ctx.createOscillator();
    o.type = type;
    o.frequency.setValueAtTime(f0, t);
    o.frequency.exponentialRampToValueAtTime(f1, t + dur);
    const g = ctx.createGain();
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(peak * BLIP_BOOST, t + Math.min(0.012, dur / 3));
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    o.connect(g).connect(this.master!);
    o.start(t);
    o.stop(t + dur + 0.05);
  }

  private lastTick = 0;
  /** Tic muy suave al pasar por un botón. */
  tick() {
    const ctx = this.live();
    if (!ctx) return;
    const now = performance.now();
    if (now - this.lastTick < 70) return;
    this.lastTick = now;
    this.blip(ctx, 2400, 1800, 0.035, 0.012, 'sine');
  }

  /** Clic: dos capas cortas (cuerpo + brillo). Llamar desde un gesto. */
  click() {
    const ctx = this.ensure();
    if (!ctx || !this.master) return;
    this.blip(ctx, 620, 380, 0.07, 0.03, 'triangle');
    this.blip(ctx, 1900, 1500, 0.05, 0.012, 'sine', 0.01);
  }

  /** Abrir una tarjeta: soplo de aire filtrado + nota suave. */
  cardOpen() {
    const ctx = this.ensure();
    if (!ctx || !this.master) return;
    const t = ctx.currentTime;
    const src = ctx.createBufferSource();
    src.buffer = this.noiseBuffer(ctx, 0.5);
    const bp = ctx.createBiquadFilter();
    bp.type = 'bandpass';
    bp.Q.value = 1.2;
    bp.frequency.setValueAtTime(500, t);
    bp.frequency.exponentialRampToValueAtTime(2400, t + 0.28);
    const g = ctx.createGain();
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(0.05, t + 0.08);
    g.gain.exponentialRampToValueAtTime(0.0001, t + 0.36);
    src.connect(bp).connect(g).connect(this.master);
    src.start(t);
    src.stop(t + 0.5);
    this.blip(ctx, 660, 660, 0.5, 0.015, 'sine', 0.06);
  }

  /** Campanita de logro (desbloqueado: dos notas brillantes con cola; bloqueado: una nota grave). */
  chime(unlocked: boolean) {
    const ctx = this.live() ?? this.ensure();
    if (!ctx || !this.master) return;
    const peak = this.reduced ? 0.02 : 0.035;
    const notes = unlocked ? [880, 1318.5, 1760] : [392];
    notes.forEach((f, i) => {
      this.blip(ctx, f, f, unlocked ? 1.4 : 0.6, peak / (1 + i * 0.5), 'sine', i * 0.08);
      if (unlocked) this.blip(ctx, f * 2.01, f * 2.01, 0.6, peak * 0.15, 'sine', i * 0.08);
    });
  }

  // ───────── Rutas narrativas (Spirit / ALSEP): microefectos procedurales ─────────
  /** Nota de llegada a una parada (escala pentatónica según el índice). */
  stopArrive(i: number) {
    const ctx = this.live();
    if (!ctx) return;
    const scale = [523.25, 587.33, 659.25, 783.99, 880, 1046.5, 1174.66, 1318.51];
    const f = scale[Math.abs(i) % scale.length];
    this.blip(ctx, f, f, 0.9, 0.022, 'sine');
    this.blip(ctx, f * 1.5, f * 1.5, 0.5, 0.008, 'sine', 0.05);
  }
  /** Soplo de desplazamiento por la ruta. */
  whoosh() {
    const ctx = this.live();
    if (!ctx || !this.master) return;
    const t = ctx.currentTime;
    const src = ctx.createBufferSource();
    src.buffer = this.noiseBuffer(ctx, 0.6);
    const bp = ctx.createBiquadFilter();
    bp.type = 'bandpass';
    bp.Q.value = 0.8;
    bp.frequency.setValueAtTime(300, t);
    bp.frequency.exponentialRampToValueAtTime(1400, t + 0.45);
    const g = ctx.createGain();
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(0.05, t + 0.15);
    g.gain.exponentialRampToValueAtTime(0.0001, t + 0.55);
    src.connect(bp).connect(g).connect(this.master);
    src.start(t);
    src.stop(t + 0.6);
  }
  /** Encaje de pieza (actividades de arrastrar/colocar). */
  snap() {
    const ctx = this.ensure();
    if (!ctx || !this.master) return;
    this.blip(ctx, 1200, 700, 0.06, 0.03, 'square');
    this.blip(ctx, 300, 180, 0.12, 0.03, 'triangle', 0.01);
  }
  /** Acierto. */
  success() {
    const ctx = this.ensure();
    if (!ctx || !this.master) return;
    [659.25, 830.61, 987.77].forEach((f, i) => this.blip(ctx, f, f, 0.5, 0.025, 'triangle', i * 0.07));
  }
  /** Intento fallido (suave, sin castigo). */
  wrong() {
    const ctx = this.ensure();
    if (!ctx || !this.master) return;
    this.blip(ctx, 330, 247, 0.25, 0.022, 'triangle');
  }
  /** Rebote (aterrizaje con bolsas de aire). */
  bounce(k = 1) {
    const ctx = this.live();
    if (!ctx) return;
    this.blip(ctx, 180 * k, 90 * k, 0.16, 0.035 / k, 'sine');
  }
  /** Pitido de instrumento (sismómetros, señales). */
  beep(f = 1500) {
    const ctx = this.live();
    if (!ctx) return;
    this.blip(ctx, f, f, 0.09, 0.015, 'sine');
  }
  /** Apagado de un sistema. */
  /**
   * Ambiente suave y procedural (acorde lento con trémolo) para la parada «Última canción».
   * NO es la canción real (tiene derechos de autor y no se reproduce): sólo un colchón tranquilo.
   */
  farewell(seconds = 9) {
    const ctx = this.ensure();
    if (!ctx || !this.master) return;
    const t = ctx.currentTime;
    const out = ctx.createGain();
    out.gain.setValueAtTime(0, t);
    out.gain.linearRampToValueAtTime(this.reduced ? 0.05 : 0.09, t + 2);
    out.gain.setValueAtTime(this.reduced ? 0.05 : 0.09, t + seconds - 2.5);
    out.gain.linearRampToValueAtTime(0, t + seconds);
    const lp = ctx.createBiquadFilter();
    lp.type = 'lowpass';
    lp.frequency.value = 1400;
    out.connect(lp).connect(this.master);
    // progresión lenta de dos acordes (Fa mayor 7 → Re menor 7), ilustrativa
    const chords = [[174.6, 220, 261.6, 329.6], [146.8, 174.6, 220, 261.6]];
    chords.forEach((ch, ci) => {
      const t0 = t + ci * (seconds / 2);
      ch.forEach((f, i) => {
        const o = ctx.createOscillator();
        o.type = i === 0 ? 'sine' : 'triangle';
        o.frequency.value = f;
        o.detune.value = (i - 1.5) * 4;
        const g = ctx.createGain();
        g.gain.setValueAtTime(0, t0);
        g.gain.linearRampToValueAtTime(0.22 / (i + 1), t0 + 1.2);
        g.gain.setValueAtTime(0.22 / (i + 1), t0 + seconds / 2 - 0.6);
        g.gain.linearRampToValueAtTime(0, t0 + seconds / 2 + 0.4);
        o.connect(g).connect(out);
        o.start(t0);
        o.stop(t0 + seconds / 2 + 0.5);
      });
    });
  }

  /** Retumbo procedural de un «sismo lunar» (ilustrativo, no son datos reales): crece y se apaga muy despacio. */
  moonquake(seconds = 6) {
    const ctx = this.ensure();
    if (!ctx || !this.master) return;
    const t = ctx.currentTime;
    const src = ctx.createBufferSource();
    src.buffer = this.noiseBuffer(ctx, seconds + 0.5);
    const lp = ctx.createBiquadFilter();
    lp.type = 'lowpass';
    lp.frequency.value = 160;
    lp.Q.value = 1.4;
    const g = ctx.createGain();
    const peak = this.reduced ? 0.18 : 0.42;
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(peak, t + seconds * 0.18);
    g.gain.exponentialRampToValueAtTime(0.0001, t + seconds);
    src.connect(lp).connect(g).connect(this.master);
    src.start(t);
    src.stop(t + seconds + 0.4);
    const o = ctx.createOscillator();
    o.type = 'sine';
    o.frequency.setValueAtTime(48, t);
    o.frequency.exponentialRampToValueAtTime(32, t + seconds);
    const og = ctx.createGain();
    og.gain.setValueAtTime(0.0001, t);
    og.gain.exponentialRampToValueAtTime(peak * 0.5, t + seconds * 0.2);
    og.gain.exponentialRampToValueAtTime(0.0001, t + seconds);
    o.connect(og).connect(this.master);
    o.start(t);
    o.stop(t + seconds + 0.2);
  }

  powerDown() {
    const ctx = this.ensure();
    if (!ctx || !this.master) return;
    this.blip(ctx, 880, 110, 0.9, 0.025, 'sawtooth');
  }

  private launchNodes: { stop: () => void } | null = null;
  /**
   * Despegue de Mis logros, sincronizado con la línea de tiempo (segundos desde ahora):
   * retumbo que crece en la cuenta atrás → rugido en la ignición → soplo al atravesar nubes →
   * se apaga al salir de la atmósfera. No suena si el sonido está desactivado.
   */
  launch(tl: { countdown: number; liftoff: number; clouds: number; space: number }, offset = 0) {
    const ctx = this.live() ?? (this.enabled ? this.ensure() : null);
    if (!ctx || !this.master || ctx.state !== 'running') return;
    this.stopLaunch();
    const t0 = ctx.currentTime - offset;
    const k = this.reduced ? 0.4 : 1;
    const at = (s: number) => Math.max(ctx.currentTime, t0 + s);
    const end = at(tl.space + 1.5);
    // capa grave: ruido marrón filtrado
    const src = ctx.createBufferSource();
    src.buffer = this.noiseBuffer(ctx, Math.max(1, end - ctx.currentTime + 0.5));
    const lp = ctx.createBiquadFilter();
    lp.type = 'lowpass';
    lp.Q.value = 0.9;
    lp.frequency.setValueAtTime(60, at(0));
    lp.frequency.exponentialRampToValueAtTime(140, at(tl.liftoff - 0.1));
    lp.frequency.exponentialRampToValueAtTime(900, at(tl.liftoff + 0.6));
    lp.frequency.exponentialRampToValueAtTime(420, at(tl.liftoff + 3));
    lp.frequency.exponentialRampToValueAtTime(90, at(tl.space));
    const g = ctx.createGain();
    g.gain.setValueAtTime(0.0001, at(0));
    g.gain.setValueAtTime(0.0001, at(tl.countdown));
    g.gain.exponentialRampToValueAtTime(0.06 * k, at(tl.liftoff - 0.15));
    g.gain.exponentialRampToValueAtTime(0.26 * k, at(tl.liftoff + 0.5));
    g.gain.exponentialRampToValueAtTime(0.16 * k, at(tl.liftoff + 3));
    g.gain.exponentialRampToValueAtTime(0.0001, at(tl.space + 0.8));
    src.connect(lp).connect(g).connect(this.master);
    src.start(at(0));
    src.stop(end);
    // sub‑grave que tiembla
    const sub = ctx.createOscillator();
    sub.type = 'sine';
    sub.frequency.setValueAtTime(34, at(tl.countdown));
    sub.frequency.exponentialRampToValueAtTime(48, at(tl.liftoff + 1));
    sub.frequency.exponentialRampToValueAtTime(30, at(tl.space));
    const trem = ctx.createOscillator();
    trem.frequency.value = 9;
    const tremG = ctx.createGain();
    tremG.gain.value = 0.35;
    const sg = ctx.createGain();
    sg.gain.setValueAtTime(0.0001, at(tl.countdown));
    sg.gain.exponentialRampToValueAtTime(0.09 * k, at(tl.liftoff));
    sg.gain.exponentialRampToValueAtTime(0.14 * k, at(tl.liftoff + 1.5));
    sg.gain.exponentialRampToValueAtTime(0.0001, at(tl.space));
    trem.connect(tremG).connect(sg.gain);
    sub.connect(sg).connect(this.master);
    sub.start(at(tl.countdown));
    trem.start(at(tl.countdown));
    sub.stop(end);
    trem.stop(end);
    // soplo al atravesar las nubes (ruido de banda alta que barre)
    const ws = ctx.createBufferSource();
    ws.buffer = this.noiseBuffer(ctx, 3);
    const hp = ctx.createBiquadFilter();
    hp.type = 'bandpass';
    hp.Q.value = 0.8;
    hp.frequency.setValueAtTime(700, at(tl.clouds - 0.6));
    hp.frequency.exponentialRampToValueAtTime(3200, at(tl.clouds + 0.5));
    hp.frequency.exponentialRampToValueAtTime(900, at(tl.clouds + 1.8));
    const wg = ctx.createGain();
    wg.gain.setValueAtTime(0.0001, at(tl.clouds - 0.8));
    wg.gain.exponentialRampToValueAtTime(0.09 * k, at(tl.clouds + 0.2));
    wg.gain.exponentialRampToValueAtTime(0.0001, at(tl.clouds + 2));
    ws.connect(hp).connect(wg).connect(this.master);
    ws.start(at(tl.clouds - 0.8));
    ws.stop(at(tl.clouds + 2.2));
    // tics de la cuenta atrás (3 · 2 · 1)
    [0, 0.6, 1.2].forEach((d, i) => {
      const s0 = tl.countdown + 0.1 + d;
      if (t0 + s0 >= ctx.currentTime) this.blip(ctx, i === 2 ? 1320 : 990, i === 2 ? 1320 : 990, 0.12, 0.02, 'sine', t0 + s0 - ctx.currentTime);
    });
    const nodes = [src, sub, trem, ws];
    const gains = [g, sg, wg];
    this.launchNodes = {
      stop: () => {
        const t = ctx.currentTime;
        gains.forEach((x) => {
          x.gain.cancelScheduledValues(t);
          x.gain.setTargetAtTime(0, t, 0.12);
        });
        window.setTimeout(() => nodes.forEach((n) => { try { n.stop(); } catch { /* ya parado */ } }), 700);
      },
    };
  }

  stopLaunch() {
    this.launchNodes?.stop();
    this.launchNodes = null;
  }

  /** Llegada a órbita: acorde amplio y lento (la calma tras el ascenso). */
  reveal() {
    const ctx = this.live();
    if (!ctx || !this.master) return;
    const t = ctx.currentTime;
    const peak = this.reduced ? 0.015 : 0.028;
    [130.8, 196, 261.6, 392, 523.3].forEach((f, i) => {
      const o = ctx.createOscillator();
      o.type = 'sine';
      o.frequency.value = f;
      o.detune.value = (i % 2 ? 1 : -1) * 5;
      const g = ctx.createGain();
      g.gain.setValueAtTime(0.0001, t);
      g.gain.exponentialRampToValueAtTime(peak / (1 + i * 0.35), t + 1.8);
      g.gain.exponentialRampToValueAtTime(0.0001, t + 6.5);
      o.connect(g).connect(this.master!);
      o.start(t);
      o.stop(t + 7);
    });
  }
}

function readPref(): boolean {
  try {
    return typeof window !== 'undefined' && window.localStorage.getItem(KEY) === '1';
  } catch {
    return false;
  }
}

export const sound = new SoundEngine();
