import { describe, it, expect } from 'vitest';
import { createCanvas } from '@napi-rs/canvas';
import { THEMES, CATALOG_COMPLETE, getPage } from '@/catalog';
import { rasterizeOutline } from '@/catalog/render';
import { buildRegionMap } from '@/engine/regions';

const all = THEMES.flatMap((t) => t.pages);
const SIZE = 1000;

describe('catalog structure', () => {
  it('has 9 themes in fixed order', () => {
    expect(THEMES.map((t) => t.id)).toEqual([
      'animals',
      'ocean',
      'dinosaurs',
      'space',
      'transport',
      'princess',
      'robots',
      'christmas',
      'fairytale',
    ]);
    for (const t of THEMES) expect(t.nameKey).toBe(`theme.${t.id}`);
  });

  it('ids unique, formatted, and consistent with theme/index', () => {
    const ids = all.map((p) => p.id);
    expect(new Set(ids).size).toBe(ids.length);
    for (const t of THEMES)
      for (const p of t.pages) {
        expect(p.id).toMatch(/^[a-z]+-\d{2}$/);
        expect(p.themeId).toBe(t.id);
        expect(p.id).toBe(`${t.id}-${String(p.index).padStart(2, '0')}`);
        expect(p.index).toBeGreaterThanOrEqual(1);
        expect(p.index).toBeLessThanOrEqual(15);
        expect(getPage(p.id)).toBe(p);
      }
    expect(new Set(all.map((p) => p.nameKey)).size).toBe(all.length);
  });

  it.skipIf(!CATALOG_COMPLETE)('has exactly 135 pages, 15 per theme', () => {
    expect(all.length).toBe(135);
    for (const t of THEMES) expect(t.pages.length).toBe(15);
  });

  // TODO(Task 5): enable once i18n exists, checking nameKey in pt-BR, en and es.
  it.skip('every nameKey exists in all 3 languages', () => {});
});

describe.each(all.map((p) => [p.id, p] as const))('page %s', (_id, pg) => {
  const rgba = rasterizeOutline(pg, SIZE, createCanvas);
  const map = buildRegionMap(rgba, SIZE, SIZE);

  it('has at least 4 regions with area >= 600 px', () => {
    let big = 0;
    for (let l = 1; l <= map.count; l++) if (map.areas[l]! >= 600) big++;
    expect(big).toBeGreaterThanOrEqual(4);
  });

  it('line pixels occupy at most 25%', () => {
    expect(map.areas[0]! / (SIZE * SIZE)).toBeLessThanOrEqual(0.25);
    expect(map.areas[0]!).toBeGreaterThan(0);
  });
});

describe('pairs within a theme differ', () => {
  const R = 250;
  for (const t of THEMES) {
    it(`theme ${t.id}: line pixels differ by >= 8%`, () => {
      const lines = t.pages.map((p) => {
        const d = rasterizeOutline(p, R, createCanvas);
        const m = new Uint8Array(R * R);
        for (let i = 0; i < m.length; i++) m[i] = d[i * 4 + 3]! >= 128 ? 1 : 0;
        return m;
      });
      for (let a = 0; a < lines.length; a++)
        for (let b = a + 1; b < lines.length; b++) {
          let diff = 0;
          let la = 0;
          let lb = 0;
          for (let i = 0; i < R * R; i++) {
            if (lines[a]![i] !== lines[b]![i]) diff++;
            la += lines[a]![i]!;
            lb += lines[b]![i]!;
          }
          // symmetric difference relative to the larger line set
          expect(diff / Math.max(la, lb, 1)).toBeGreaterThanOrEqual(0.08);
        }
    });
  }
});
