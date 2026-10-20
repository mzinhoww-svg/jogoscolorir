import { ok, toError, type Result } from './result';

export type Lang = 'pt-BR' | 'en' | 'es';
export interface Prefs {
  v: 1;
  lang: Lang;
  music: boolean;
  sfx: boolean;
  volume: number;
}

export const PREFS_KEY = 'pinta-mundo:prefs';
export const DEFAULT_PREFS: Prefs = { v: 1, lang: 'pt-BR', music: true, sfx: true, volume: 0.7 };

const LANGS: readonly Lang[] = ['pt-BR', 'en', 'es'];

export function loadPrefs(): Prefs {
  try {
    const text = localStorage.getItem(PREFS_KEY);
    if (text === null) return { ...DEFAULT_PREFS };
    const raw: unknown = JSON.parse(text);
    if (typeof raw !== 'object' || raw === null) return { ...DEFAULT_PREFS };
    const o = raw as Record<string, unknown>;
    if (o.v !== 1) return { ...DEFAULT_PREFS };
    return {
      v: 1,
      lang: LANGS.includes(o.lang as Lang) ? (o.lang as Lang) : DEFAULT_PREFS.lang,
      music: typeof o.music === 'boolean' ? o.music : DEFAULT_PREFS.music,
      sfx: typeof o.sfx === 'boolean' ? o.sfx : DEFAULT_PREFS.sfx,
      volume:
        typeof o.volume === 'number' && Number.isFinite(o.volume)
          ? Math.min(1, Math.max(0, o.volume))
          : DEFAULT_PREFS.volume,
    };
  } catch {
    return { ...DEFAULT_PREFS };
  }
}

export function savePrefs(p: Prefs): Result<void> {
  try {
    localStorage.setItem(PREFS_KEY, JSON.stringify(p));
    return ok(undefined);
  } catch (e) {
    return toError(e);
  }
}
