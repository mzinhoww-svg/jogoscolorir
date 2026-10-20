import { afterEach, describe, expect, it, vi } from 'vitest';
import { DEFAULT_PREFS, loadPrefs, savePrefs } from '@/persistence/prefs';

const KEY = 'pinta-mundo:prefs';
function stubStorage(init: Record<string, string> = {}) {
  const data = { ...init };
  vi.stubGlobal('localStorage', {
    getItem: (k: string) => (k in data ? data[k]! : null),
    setItem: (k: string, v: string) => void (data[k] = v),
  });
  return data;
}
afterEach(() => vi.unstubAllGlobals());

describe('prefs', () => {
  it('defaults', () => {
    expect(DEFAULT_PREFS).toEqual({ v: 1, lang: 'pt-BR', music: true, sfx: true, volume: 0.7 });
    stubStorage();
    expect(loadPrefs()).toEqual(DEFAULT_PREFS);
  });
  it('round-trips', () => {
    const d = stubStorage();
    const p = { v: 1 as const, lang: 'es' as const, music: false, sfx: true, volume: 0.2 };
    expect(savePrefs(p).ok).toBe(true);
    expect(JSON.parse(d[KEY]!)).toEqual(p);
    expect(loadPrefs()).toEqual(p);
  });
  it('corrupt JSON -> defaults', () => {
    stubStorage({ [KEY]: '{nope' });
    expect(loadPrefs()).toEqual(DEFAULT_PREFS);
  });
  it('non-object / wrong version -> defaults', () => {
    stubStorage({ [KEY]: '42' });
    expect(loadPrefs()).toEqual(DEFAULT_PREFS);
    stubStorage({ [KEY]: JSON.stringify({ v: 2, lang: 'en', music: false }) });
    expect(loadPrefs()).toEqual(DEFAULT_PREFS);
  });
  it('merges field by field and validates', () => {
    stubStorage({ [KEY]: JSON.stringify({ v: 1, lang: 'fr', music: false, sfx: 'yes', volume: 5 }) });
    expect(loadPrefs()).toEqual({ v: 1, lang: 'pt-BR', music: false, sfx: true, volume: 1 });
    stubStorage({ [KEY]: JSON.stringify({ v: 1, lang: 'en', volume: -3 }) });
    expect(loadPrefs()).toEqual({ ...DEFAULT_PREFS, lang: 'en', volume: 0 });
    stubStorage({ [KEY]: JSON.stringify({ v: 1, volume: null }) });
    expect(loadPrefs().volume).toBe(0.7);
  });
  it('throwing localStorage methods -> defaults and ok:false', () => {
    vi.stubGlobal('localStorage', {
      getItem: () => {
        throw new DOMException('no', 'SecurityError');
      },
      setItem: () => {
        throw new DOMException('full', 'QuotaExceededError');
      },
    });
    expect(loadPrefs()).toEqual(DEFAULT_PREFS);
    expect(savePrefs(DEFAULT_PREFS)).toMatchObject({ ok: false, error: 'quota' });
  });
  it('throwing localStorage getter -> defaults and ok:false', () => {
    Object.defineProperty(globalThis, 'localStorage', {
      configurable: true,
      get() {
        throw new DOMException('blocked', 'SecurityError');
      },
    });
    expect(loadPrefs()).toEqual(DEFAULT_PREFS);
    expect(savePrefs(DEFAULT_PREFS)).toMatchObject({ ok: false, error: 'unavailable' });
    delete (globalThis as Record<string, unknown>).localStorage;
  });
});
