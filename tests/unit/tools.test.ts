import { describe, it, expect } from 'vitest';
import {
  COLORS,
  SHINES,
  TOOL_SIZES,
  toolWidth,
  stampSegment,
  mulberry32,
  type Brush,
  type ToolId,
} from '@/engine/tools';
import { PATTERNS, makePattern } from '@/engine/patterns';
import { napiFactory, squarePage, displayCanvas, ptr } from './helpers/napiFactory';
import { PaintSession } from '@/engine/session';

describe('tool constants', () => {
  it('sizes and multipliers', () => {
    expect(TOOL_SIZES).toEqual({ s: 14, m: 28, l: 48 });
    expect(toolWidth('brush', 'm')).toBeCloseTo(28 * 1.2);
    expect(toolWidth('pencil', 'm')).toBeCloseTo(28 * 0.45);
    expect(toolWidth('spray', 'l')).toBeCloseTo(48 * 1.6);
    expect(toolWidth('marker', 's')).toBe(14);
  });
  it('palettes', () => {
    expect(COLORS).toHaveLength(24);
    expect(new Set(COLORS).size).toBe(24);
    for (const c of COLORS) expect(c).toMatch(/^#[0-9A-F]{6}$/);
    expect(COLORS).toContain('#FFFFFF');
    expect(SHINES.map((s) => s.id)).toEqual([
      'gold',
      'silver',
      'rainbow',
      'pink',
      'ice',
      'emerald',
    ]);
    for (const s of SHINES) expect(s.stops.length).toBeGreaterThanOrEqual(2);
    expect(PATTERNS).toEqual([
      'stripes',
      'dots',
      'checks',
      'hearts',
      'stars',
      'waves',
      'zigzag',
      'scales',
    ]);
  });
  it('mulberry32 is deterministic', () => {
    const a = mulberry32(7);
    const b = mulberry32(7);
    for (let i = 0; i < 5; i++) expect(a()).toBe(b());
  });
});

describe('stampSegment', () => {
  const base: Brush = {
    tool: 'pencil',
    color: '#E8423F',
    shine: 'gold',
    pattern: 'dots',
    size: 'm',
  };
  it('is deterministic for the same seed', () => {
    const draw = () => {
      const c = napiFactory.create(200, 200);
      const ctx = c.getContext('2d') as CanvasRenderingContext2D;
      stampSegment(ctx, base, { x: 20, y: 20, p: 0.5 }, { x: 180, y: 160, p: 0.5 }, mulberry32(42));
      return Array.from(ctx.getImageData(0, 0, 200, 200).data);
    };
    expect(draw()).toEqual(draw());
  });
  it('every pattern produces a tile with two colours', () => {
    const c = napiFactory.create(120, 120);
    const ctx = c.getContext('2d') as CanvasRenderingContext2D;
    for (const id of PATTERNS) {
      ctx.clearRect(0, 0, 120, 120);
      ctx.fillStyle = makePattern(ctx, id, '#3A7BE0', napiFactory.create);
      ctx.fillRect(0, 0, 120, 120);
      const d = ctx.getImageData(0, 0, 120, 120).data;
      const set = new Set<number>();
      for (let i = 0; i < d.length; i += 4) set.add((d[i]! << 16) | (d[i + 1]! << 8) | d[i + 2]!);
      expect(set.size, id).toBeGreaterThan(1);
    }
  });
});

interface Metrics {
  covered: number;
  meanAlpha: number;
  alphaVar: number;
  colors: number;
}
function metrics(img: ImageData): Metrics {
  const d = img.data;
  let covered = 0;
  let sum = 0;
  let sum2 = 0;
  const set = new Set<number>();
  for (let i = 0; i < d.length; i += 4) {
    const a = d[i + 3]!;
    if (a === 0) continue;
    covered++;
    sum += a;
    sum2 += a * a;
    set.add((d[i]! << 16) | (d[i + 1]! << 8) | d[i + 2]!);
  }
  const mean = sum / covered;
  return { covered, meanAlpha: mean, alphaVar: sum2 / covered - mean * mean, colors: set.size };
}
const rel = (a: number, b: number) => Math.abs(a - b) / Math.max(Math.abs(a), Math.abs(b), 1e-9);

describe('tool distinctness', () => {
  it('each pair of tools differs by >=15% in at least one metric', () => {
    const tools: ToolId[] = ['marker', 'pencil', 'brush', 'bucket', 'spray', 'shine', 'pattern'];
    const s = new PaintSession({
      page: squarePage,
      canvas: displayCanvas(1000),
      factory: napiFactory,
      onChange: () => {},
      getRect: () => ({ left: 0, top: 0, width: 1000, height: 1000 }),
      dpr: () => 1,
      schedule: (cb) => cb(),
    });
    const m: Record<string, Metrics> = {};
    for (const tool of tools) {
      s.loadPaint(null);
      s.setBrush({ tool, color: '#E8423F', size: 'm', shine: 'gold', pattern: 'stripes' });
      s.pointerDown(ptr(200, 200));
      for (let i = 1; i <= 30; i++) s.pointerMove(ptr(200 + i * 20, 200 + i * 20));
      s.pointerUp(ptr(800, 800));
      m[tool] = metrics(s.getPaintImageData());
    }
    s.dispose();
    for (let i = 0; i < tools.length; i++)
      for (let j = i + 1; j < tools.length; j++) {
        const a = m[tools[i]!]!;
        const b = m[tools[j]!]!;
        const best = Math.max(
          rel(a.covered, b.covered),
          rel(a.meanAlpha, b.meanAlpha),
          rel(a.alphaVar, b.alphaVar),
          rel(a.colors, b.colors),
        );
        expect(best, `${tools[i]} vs ${tools[j]} ${JSON.stringify([a, b])}`).toBeGreaterThanOrEqual(
          0.15,
        );
      }
  });
});
