import { describe, it, expect } from 'vitest';
import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { ptBR } from '@/i18n/pt-BR';
import { en } from '@/i18n/en';
import { es } from '@/i18n/es';
import { t, hasKey, pageName, themeName, I18nProvider, useT, type Lang } from '@/i18n';
import { THEMES, CATALOG_COMPLETE } from '@/catalog';

const LANGS: Lang[] = ['pt-BR', 'en', 'es'];
const dicts: Record<Lang, Record<string, string>> = { 'pt-BR': ptBR, en, es };

describe('dictionaries', () => {
  it('have identical key sets', () => {
    const base = Object.keys(ptBR).sort();
    expect(Object.keys(en).sort()).toEqual(base);
    expect(Object.keys(es).sort()).toEqual(base);
  });
  it.each(LANGS)('%s has no empty strings', (l) => {
    for (const [k, v] of Object.entries(dicts[l])) expect(v.trim(), k).not.toBe('');
  });
  it('keeps the same {placeholders} across languages', () => {
    const ph = (s: string) => (s.match(/\{\w+\}/g) ?? []).sort().join();
    for (const k of Object.keys(ptBR)) {
      expect(ph(en[k as keyof typeof en]), k).toBe(ph(ptBR[k as keyof typeof ptBR]));
      expect(ph(es[k as keyof typeof es]), k).toBe(ph(ptBR[k as keyof typeof ptBR]));
    }
  });
  it('covers 24 colors, 6 shines, 8 patterns, 7 tools', () => {
    const n = (p: string) => Object.keys(ptBR).filter((k) => k.startsWith(p)).length;
    expect(n('color.')).toBe(24);
    expect(n('shine.')).toBe(6);
    expect(n('pattern.')).toBe(8);
    expect(n('tool.')).toBe(7);
  });
});

describe('t()', () => {
  it('interpolates {vars}', () => {
    expect(t('pt-BR', 'gate.prompt', { a: 'seis', b: 'sete' })).toBe('Quanto é seis mais sete?');
    expect(t('en', 'gate.wait', { s: 10 })).toBe('Wait 10 s to try again.');
  });
  it('leaves unknown placeholders intact', () => {
    expect(t('en', 'gate.wait')).toContain('{s}');
    expect(t('en', 'gate.wait', { x: 1 })).toContain('{s}');
  });
  it('falls back to the key when missing everywhere', () => {
    expect(t('es', 'page.nope-99')).toBe('page.nope-99');
  });
});

describe('names', () => {
  it.each(LANGS)('theme names exist for all 9 themes in %s', (l) => {
    expect(THEMES).toHaveLength(9);
    for (const th of THEMES) {
      expect(hasKey(l, th.nameKey), th.nameKey).toBe(true);
      expect(themeName(l, th.id)).not.toBe(th.nameKey);
    }
  });
  it.skipIf(!CATALOG_COMPLETE).each(LANGS)('every catalog page has a name in %s', (l) => {
    for (const th of THEMES)
      for (const p of th.pages) {
        expect(hasKey(l, p.nameKey), p.nameKey).toBe(true);
        expect(pageName(l, p.id)).not.toBe(p.nameKey);
      }
  });
});

describe('React provider', () => {
  it('provides t bound to lang', () => {
    function C() {
      const { t: tr, lang } = useT();
      return createElement('span', null, `${lang}:${tr('home.play')}`);
    }
    const html = renderToStaticMarkup(
      createElement(I18nProvider, { lang: 'en', setLang: () => {} }, createElement(C)),
    );
    expect(html).toContain('en:Play');
  });
  it('throws without provider', () => {
    function C() {
      useT();
      return null;
    }
    expect(() => renderToStaticMarkup(createElement(C))).toThrow();
  });
});
