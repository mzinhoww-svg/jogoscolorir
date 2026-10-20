import { createContext, createElement, useContext, useMemo, type ReactNode } from 'react';
import type { Lang } from '@/persistence/prefs';
import { ptBR, type DictKey } from './pt-BR';
import { en } from './en';
import { es } from './es';

export type { Lang } from '@/persistence/prefs';
export type { Dict, DictKey } from './pt-BR';

type Vars = Record<string, string | number>;
type Table = Record<string, string>;

/** Page names are contributed by src/i18n/pages/<theme>.ts as `pageNames`. */
const pageModules = import.meta.glob('./pages/*.ts', { eager: true }) as Record<string, unknown>;

function mergePages(lang: Lang): Table {
  const out: Table = {};
  for (const mod of Object.values(pageModules)) {
    const names = (mod as { pageNames?: Partial<Record<Lang, Table>> }).pageNames;
    const part = names?.[lang];
    if (part) Object.assign(out, part);
  }
  return out;
}

const TABLES: Record<Lang, Table> = {
  'pt-BR': { ...ptBR, ...mergePages('pt-BR') },
  en: { ...en, ...mergePages('en') },
  es: { ...es, ...mergePages('es') },
};

export const LANGS: readonly Lang[] = ['pt-BR', 'en', 'es'];

/** True when `key` has a translation in `lang` itself (no fallback). */
export function hasKey(lang: Lang, key: string): boolean {
  const v = TABLES[lang][key];
  return typeof v === 'string' && v !== '';
}

export function t(lang: Lang, key: string, vars?: Vars): string {
  const raw = TABLES[lang][key] ?? TABLES['pt-BR'][key] ?? key;
  if (!vars) return raw;
  return raw.replace(/\{(\w+)\}/g, (m, name: string) =>
    Object.prototype.hasOwnProperty.call(vars, name) ? String(vars[name]) : m,
  );
}

export const pageName = (lang: Lang, pageId: string): string => t(lang, `page.${pageId}`);
export const themeName = (lang: Lang, themeId: string): string => t(lang, `theme.${themeId}`);

export interface I18nValue {
  lang: Lang;
  setLang: (lang: Lang) => void;
  t: (key: DictKey | (string & {}), vars?: Vars) => string;
}

const I18nContext = createContext<I18nValue | null>(null);

export function I18nProvider(props: {
  lang: Lang;
  setLang: (lang: Lang) => void;
  children?: ReactNode;
}) {
  const { lang, setLang, children } = props;
  const value = useMemo<I18nValue>(
    () => ({ lang, setLang, t: (key, vars) => t(lang, key, vars) }),
    [lang, setLang],
  );
  return createElement(I18nContext.Provider, { value }, children);
}

export function useT(): I18nValue {
  const v = useContext(I18nContext);
  if (!v) throw new Error('useT must be used inside <I18nProvider>');
  return v;
}
