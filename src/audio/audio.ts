/**
 * Synthesized audio (WebAudio only, no files). Nothing is created before `unlock()`,
 * which must be called from a user gesture.
 */
export type AudioName = 'click' | 'color' | 'fill' | 'shine' | 'celebrate' | 'error';
export interface Volumes {
  music: boolean;
  sfx: boolean;
  volume: number;
}

type CtxCtor = new () => AudioContext;
interface DocLike extends EventTarget {
  hidden: boolean;
}
export interface AudioOptions {
  /** Injectable for tests; null = no WebAudio available. Default: window.AudioContext. */
  AudioContextCtor?: CtxCtor | null;
  doc?: DocLike | null;
}

/** Peak gain of the music bus (relative to master volume). */
const MUSIC_LEVEL = 0.12;
const SFX_LEVEL = 0.5;

// C major pentatonic, two octaves (Hz).
const P = [261.63, 293.66, 329.63, 392.0, 440.0, 523.25, 587.33, 659.25];
// Original 16-step melody (indexes into P; -1 = rest) and a slow bass line.
const MELODY = [0, 2, 4, 2, 5, 4, 2, -1, 3, 4, 5, 7, 5, 4, 2, -1];
const BASS = [0, 0, 3, 3];
const STEP = 0.5; // seconds
const LOOP = MELODY.length * STEP;

function defaultCtor(): CtxCtor | null {
  const w = globalThis as unknown as { AudioContext?: CtxCtor; webkitAudioContext?: CtxCtor };
  return w.AudioContext ?? w.webkitAudioContext ?? null;
}

export function createAudio(opts: AudioOptions = {}) {
  const Ctor = opts.AudioContextCtor === undefined ? defaultCtor() : opts.AudioContextCtor;
  const doc: DocLike | null =
    opts.doc === undefined ? ((globalThis as { document?: DocLike }).document ?? null) : opts.doc;

  let ctx: AudioContext | null = null;
  let master: GainNode | null = null;
  let musicBus: GainNode | null = null;
  let sfxBus: GainNode | null = null;
  const flags: Volumes = { music: false, sfx: true, volume: 0.7 };

  const musicOsc = new Set<OscillatorNode>();
  let nextStart = 0;
  let musicTimer: ReturnType<typeof setTimeout> | null = null;
  let musicRunning = false;

  const clamp01 = (v: number) => (Number.isFinite(v) ? Math.min(1, Math.max(0, v)) : 0);

  function tone(
    dest: AudioNode,
    type: OscillatorType,
    freq: number,
    start: number,
    dur: number,
    peak: number,
    slideTo?: number,
    onEnd?: (o: OscillatorNode) => void,
  ): OscillatorNode | null {
    if (!ctx) return null;
    const osc = ctx.createOscillator();
    const g = ctx.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(freq, start);
    if (slideTo !== undefined) osc.frequency.linearRampToValueAtTime(slideTo, start + dur);
    g.gain.setValueAtTime(0, start);
    g.gain.linearRampToValueAtTime(peak, start + Math.min(0.015, dur / 3));
    g.gain.linearRampToValueAtTime(0, start + dur);
    osc.connect(g);
    g.connect(dest);
    osc.onended = () => {
      onEnd?.(osc);
      try {
        osc.disconnect();
        g.disconnect();
      } catch {
        /* already disconnected */
      }
    };
    osc.start(start);
    osc.stop(start + dur + 0.02);
    return osc;
  }

  const forget = (o: OscillatorNode) => void musicOsc.delete(o);

  function scheduleLoop() {
    if (!ctx || !musicBus || !musicRunning) return;
    const t0 = Math.max(nextStart, ctx.currentTime + 0.05);
    const bus = musicBus;
    const add = (o: OscillatorNode | null) => {
      if (o) musicOsc.add(o);
    };
    MELODY.forEach((n, i) => {
      if (n < 0) return;
      add(tone(bus, 'sine', P[n]!, t0 + i * STEP, STEP * 0.9, 0.6, undefined, forget));
    });
    BASS.forEach((n, i) => {
      add(tone(bus, 'triangle', P[n]! / 2, t0 + i * STEP * 4, STEP * 3.6, 0.45, undefined, forget));
    });
    nextStart = t0 + LOOP;
    // wake ~1 s before the loop ends, driven by the audio clock rather than a fixed period
    const delay = Math.max(0, (nextStart - ctx.currentTime - 1) * 1000);
    musicTimer = setTimeout(scheduleLoop, delay);
  }

  function stopMusic() {
    musicRunning = false;
    if (musicTimer !== null) clearTimeout(musicTimer);
    musicTimer = null;
    if (!ctx) return;
    const now = ctx.currentTime;
    const bus = musicBus;
    if (bus) {
      bus.gain.setValueAtTime(bus.gain.value, now);
      bus.gain.linearRampToValueAtTime(0, now + 0.04);
    }
    for (const o of musicOsc) {
      try {
        o.stop(now + 0.06);
      } catch {
        /* already stopped */
      }
    }
    musicOsc.clear();
    musicBus = null;
  }

  function startMusic() {
    if (!ctx || !master || musicRunning || !flags.music || doc?.hidden) return;
    musicRunning = true;
    musicBus = ctx.createGain();
    musicBus.gain.value = MUSIC_LEVEL;
    musicBus.connect(master);
    nextStart = 0;
    scheduleLoop();
  }

  function setMusic(on: boolean): void {
    flags.music = on;
    if (on) startMusic();
    else stopMusic();
  }

  function applyVolume() {
    if (master) master.gain.value = clamp01(flags.volume);
  }

  doc?.addEventListener('visibilitychange', () => {
    if (doc.hidden) stopMusic();
    else startMusic();
  });

  const EFFECTS: Record<AudioName, (t: number, d: AudioNode) => void> = {
    click: (t, d) => void tone(d, 'triangle', 660, t, 0.06, 0.5),
    color: (t, d) => {
      tone(d, 'sine', 523.25, t, 0.09, 0.6);
      tone(d, 'sine', 783.99, t + 0.07, 0.12, 0.6);
    },
    fill: (t, d) => {
      tone(d, 'sine', 260, t, 0.28, 0.6, 720);
      tone(d, 'triangle', 1318.5, t + 0.2, 0.12, 0.3);
    },
    shine: (t, d) => {
      [1046.5, 1318.5, 1568, 2093].forEach((f, i) =>
        tone(d, 'triangle', f, t + i * 0.06, 0.18, 0.4),
      );
    },
    celebrate: (t, d) => {
      [523.25, 659.25, 783.99, 1046.5, 783.99, 1046.5, 1318.5].forEach((f, i) =>
        tone(d, 'triangle', f, t + i * 0.13, 0.22, 0.55),
      );
    },
    error: (t, d) => void tone(d, 'sawtooth', 220, t, 0.28, 0.35, 130),
  };

  return {
    /** Create/resume the context. Call from a user gesture; safe to repeat. */
    unlock(): void {
      if (!Ctor) return;
      if (!ctx) {
        try {
          ctx = new Ctor();
        } catch {
          ctx = null;
          return;
        }
        master = ctx.createGain();
        sfxBus = ctx.createGain();
        sfxBus.gain.value = SFX_LEVEL;
        sfxBus.connect(master);
        master.connect(ctx.destination);
        applyVolume();
      }
      if (ctx.state !== 'running') void ctx.resume().catch(() => undefined);
      startMusic();
    },
    play(name: AudioName): void {
      if (!ctx || !sfxBus || !flags.sfx) return;
      EFFECTS[name](ctx.currentTime + 0.005, sfxBus);
    },
    setMusic,
    /** test hook: live scheduled music oscillators */
    _musicOscCount: (): number => musicOsc.size,
    setVolumes(v: Volumes): void {
      flags.sfx = v.sfx;
      flags.volume = clamp01(v.volume);
      applyVolume();
      setMusic(v.music);
    },
  };
}

export type AudioEngine = ReturnType<typeof createAudio>;
export const audio: AudioEngine = createAudio();
