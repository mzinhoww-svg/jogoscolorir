import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { createAudio, type AudioName } from '@/audio/audio';

class Param {
  value = 1;
  setValueAtTime(v: number) {
    this.value = v;
    return this;
  }
  linearRampToValueAtTime(v: number) {
    this.value = v;
    return this;
  }
  exponentialRampToValueAtTime(v: number) {
    this.value = v;
    return this;
  }
  cancelScheduledValues() {
    return this;
  }
  setTargetAtTime(v: number) {
    this.value = v;
    return this;
  }
}
class MockOsc {
  type = 'sine';
  frequency = new Param();
  started = false;
  stopped = false;
  connect() {
    return this;
  }
  disconnect() {}
  start() {
    this.started = true;
  }
  stop() {
    this.stopped = true;
  }
}
class MockGain {
  gain = new Param();
  connect() {
    return this;
  }
  disconnect() {}
}
class MockCtx {
  static instances: MockCtx[] = [];
  currentTime = 0;
  state: 'suspended' | 'running' = 'suspended';
  destination = {};
  oscillators: MockOsc[] = [];
  gains: MockGain[] = [];
  resume = vi.fn(() => {
    this.state = 'running';
    return Promise.resolve();
  });
  constructor() {
    MockCtx.instances.push(this);
  }
  createOscillator() {
    const o = new MockOsc();
    this.oscillators.push(o);
    return o;
  }
  createGain() {
    const g = new MockGain();
    this.gains.push(g);
    return g;
  }
}
const Ctor = MockCtx as unknown as new () => AudioContext;

function fakeDoc() {
  const target = new EventTarget();
  return Object.assign(target, { hidden: false }) as EventTarget & { hidden: boolean };
}

beforeEach(() => {
  MockCtx.instances = [];
  vi.useFakeTimers();
});
afterEach(() => {
  vi.useRealTimers();
});

describe('audio', () => {
  it('creates no AudioContext before unlock, and play/setMusic are inert', () => {
    const a = createAudio({ AudioContextCtor: Ctor, doc: fakeDoc() });
    a.setVolumes({ music: true, sfx: true, volume: 0.7 });
    a.setMusic(true);
    a.play('click');
    expect(MockCtx.instances).toHaveLength(0);
  });

  it('unlock creates one context, resumes it, and is safe to repeat', () => {
    const a = createAudio({ AudioContextCtor: Ctor, doc: fakeDoc() });
    a.unlock();
    a.unlock();
    expect(MockCtx.instances).toHaveLength(1);
    expect(MockCtx.instances[0]!.resume).toHaveBeenCalled();
  });

  it('plays distinct effects with oscillators', () => {
    const a = createAudio({ AudioContextCtor: Ctor, doc: fakeDoc() });
    a.setVolumes({ music: false, sfx: true, volume: 1 });
    a.unlock();
    const ctx = MockCtx.instances[0]!;
    const names: AudioName[] = ['click', 'color', 'fill', 'shine', 'celebrate', 'error'];
    const counts = names.map((n) => {
      const before = ctx.oscillators.length;
      a.play(n);
      return ctx.oscillators.length - before;
    });
    for (const c of counts) expect(c).toBeGreaterThan(0);
    expect(new Set(counts).size).toBeGreaterThan(2);
  });

  it('sfx off creates no oscillator', () => {
    const a = createAudio({ AudioContextCtor: Ctor, doc: fakeDoc() });
    a.setVolumes({ music: false, sfx: false, volume: 1 });
    a.unlock();
    a.play('click');
    a.play('celebrate');
    expect(MockCtx.instances[0]!.oscillators).toHaveLength(0);
  });

  it('volume scales the master gain', () => {
    const a = createAudio({ AudioContextCtor: Ctor, doc: fakeDoc() });
    a.setVolumes({ music: false, sfx: true, volume: 0.4 });
    a.unlock();
    const ctx = MockCtx.instances[0]!;
    expect(ctx.gains[0]!.gain.value).toBeCloseTo(0.4);
    a.setVolumes({ music: false, sfx: true, volume: 0.9 });
    expect(ctx.gains[0]!.gain.value).toBeCloseTo(0.9);
    a.setVolumes({ music: false, sfx: true, volume: 7 });
    expect(ctx.gains[0]!.gain.value).toBe(1);
  });

  it('music is quiet, starts on unlock, stops when disabled', () => {
    const a = createAudio({ AudioContextCtor: Ctor, doc: fakeDoc() });
    a.setVolumes({ music: true, sfx: true, volume: 1 });
    a.unlock();
    const ctx = MockCtx.instances[0]!;
    expect(ctx.oscillators.length).toBeGreaterThan(0);
    // gains[0] master (= volume), gains[1] music bus
    expect(ctx.gains[1]!.gain.value).toBeLessThanOrEqual(0.15);
    expect(ctx.gains[1]!.gain.value).toBeGreaterThan(0);
    a.setMusic(false);
    expect(ctx.oscillators.every((o) => o.stopped)).toBe(true);
    const n = ctx.oscillators.length;
    vi.advanceTimersByTime(60_000);
    expect(ctx.oscillators.length).toBe(n);
  });

  it('keeps looping while enabled', () => {
    const a = createAudio({ AudioContextCtor: Ctor, doc: fakeDoc() });
    a.setVolumes({ music: true, sfx: false, volume: 1 });
    a.unlock();
    const ctx = MockCtx.instances[0]!;
    const n = ctx.oscillators.length;
    vi.advanceTimersByTime(30_000);
    expect(ctx.oscillators.length).toBeGreaterThan(n);
  });

  it('pauses music when hidden and resumes when visible', () => {
    const doc = fakeDoc();
    const a = createAudio({ AudioContextCtor: Ctor, doc });
    a.setVolumes({ music: true, sfx: true, volume: 1 });
    a.unlock();
    const ctx = MockCtx.instances[0]!;
    doc.hidden = true;
    doc.dispatchEvent(new Event('visibilitychange'));
    expect(ctx.oscillators.every((o) => o.stopped)).toBe(true);
    const n = ctx.oscillators.length;
    vi.advanceTimersByTime(30_000);
    expect(ctx.oscillators.length).toBe(n);
    doc.hidden = false;
    doc.dispatchEvent(new Event('visibilitychange'));
    expect(ctx.oscillators.length).toBeGreaterThan(n);
  });

  it('does not start music on visible when music is off', () => {
    const doc = fakeDoc();
    const a = createAudio({ AudioContextCtor: Ctor, doc });
    a.setVolumes({ music: false, sfx: true, volume: 1 });
    a.unlock();
    doc.dispatchEvent(new Event('visibilitychange'));
    expect(MockCtx.instances[0]!.oscillators).toHaveLength(0);
  });

  it('survives a missing AudioContext implementation', () => {
    const a = createAudio({ AudioContextCtor: null, doc: fakeDoc() });
    expect(() => {
      a.unlock();
      a.play('click');
      a.setMusic(true);
    }).not.toThrow();
  });
});
