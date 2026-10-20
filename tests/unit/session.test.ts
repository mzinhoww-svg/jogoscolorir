import { describe, it, expect, beforeAll } from 'vitest';
import { PaintSession, type PaintSessionOptions } from '@/engine/session';
import { History } from '@/engine/history';
import {
  napiFactory,
  squarePage,
  splitPage,
  ringPage,
  ptr,
  displayCanvas,
} from './helpers/napiFactory';
import type { PageDef } from '@/catalog/types';
import type { AnyCanvas } from '@/engine/canvasFactory';

interface Rect {
  left: number;
  top: number;
  width: number;
  height: number;
}
function make(page: PageDef, extra: Partial<PaintSessionOptions> = {}) {
  let rect: Rect = { left: 0, top: 0, width: 1000, height: 1000 };
  let dpr = 1;
  const states: { canUndo: boolean; canRedo: boolean; dirty: boolean }[] = [];
  let commits = 0;
  const canvas = displayCanvas(10);
  const s = new PaintSession({
    page,
    canvas,
    factory: napiFactory,
    onChange: (st) => states.push(st),
    onCommit: () => commits++,
    getRect: () => rect,
    dpr: () => dpr,
    schedule: (cb) => cb(),
    ...extra,
  });
  s.setBrush({ tool: 'marker', color: '#E8423F', size: 'm' });
  return {
    s,
    canvas,
    states,
    commits: () => commits,
    setRect: (r: Rect) => (rect = r),
    setDpr: (d: number) => (dpr = d),
  };
}
function alphaAt(img: ImageData, x: number, y: number): number {
  return img.data[(y * img.width + x) * 4 + 3]!;
}
function countAlpha(img: ImageData, x0: number, y0: number, x1: number, y1: number): number {
  let n = 0;
  for (let y = y0; y < y1; y++) for (let x = x0; x < x1; x++) if (alphaAt(img, x, y) > 0) n++;
  return n;
}
function stroke(s: PaintSession, pts: [number, number][], id = 1) {
  s.pointerDown(ptr(pts[0]![0], pts[0]![1], { pointerId: id }));
  for (const [x, y] of pts.slice(1)) s.pointerMove(ptr(x, y, { pointerId: id }));
  const l = pts[pts.length - 1]!;
  s.pointerUp(ptr(l[0], l[1], { pointerId: id }));
}
const same = (a: ImageData, b: ImageData) =>
  Buffer.compare(Buffer.from(a.data), Buffer.from(b.data)) === 0;

describe('PaintSession', () => {
  let split: ReturnType<typeof make>;
  beforeAll(() => {
    split = make(splitPage);
  });

  it('stroke started left never paints right half', () => {
    const { s } = split;
    s.loadPaint(null);
    stroke(s, [
      [300, 500],
      [450, 500],
      [700, 500],
      [850, 520],
    ]);
    const img = s.getPaintImageData();
    expect(countAlpha(img, 300, 480, 490, 520)).toBeGreaterThan(1000);
    expect(countAlpha(img, 506, 100, 900, 900)).toBe(0);
  });

  it('pointer starting on the line paints the nearest region', () => {
    const { s } = split;
    s.loadPaint(null);
    stroke(s, [
      [495, 300],
      [495, 320],
    ]);
    const img = s.getPaintImageData();
    expect(countAlpha(img, 460, 290, 494, 330)).toBeGreaterThan(50);
    expect(countAlpha(img, 506, 290, 540, 330)).toBe(0);
  });

  it('tap on the area outside the frame is still a valid region', () => {
    const { s, commits } = split;
    s.loadPaint(null);
    const c0 = commits();
    s.setBrush({ tool: 'bucket' });
    s.pointerDown(ptr(50, 50));
    s.pointerUp(ptr(50, 50));
    expect(commits()).toBe(c0 + 1); // outside is a valid region
    s.setBrush({ tool: 'marker' });
  });

  it('bucket fills the ring but not the hole or outside', () => {
    const { s } = make(ringPage);
    s.setBrush({ tool: 'bucket', color: '#2F9E44' });
    s.pointerDown(ptr(500, 250));
    s.pointerUp(ptr(500, 250));
    const img = s.getPaintImageData();
    expect(alphaAt(img, 500, 250)).toBe(255);
    expect(alphaAt(img, 250, 500)).toBe(255);
    expect(alphaAt(img, 500, 500)).toBe(0);
    expect(alphaAt(img, 20, 20)).toBe(0);
    expect(s.canUndo).toBe(true);
  });

  it('second pointer is ignored while the first is active', () => {
    const { s } = split;
    s.loadPaint(null);
    s.pointerDown(ptr(300, 300, { pointerId: 1 }));
    s.pointerDown(ptr(300, 700, { pointerId: 2, isPrimary: false }));
    s.pointerMove(ptr(300, 750, { pointerId: 2, isPrimary: false }));
    s.pointerMove(ptr(350, 300, { pointerId: 1 }));
    s.pointerUp(ptr(300, 750, { pointerId: 2 }));
    s.pointerUp(ptr(350, 300, { pointerId: 1 }));
    const img = s.getPaintImageData();
    expect(countAlpha(img, 280, 680, 320, 770)).toBe(0);
    expect(countAlpha(img, 300, 290, 350, 310)).toBeGreaterThan(100);
    expect(s.historySize).toBe(1);
  });

  it('pointercancel commits the stroke', () => {
    const { s, commits } = split;
    s.loadPaint(null);
    const c0 = commits();
    s.pointerDown(ptr(300, 300));
    s.pointerMove(ptr(400, 300));
    s.pointerCancel(ptr(400, 300));
    expect(commits()).toBe(c0 + 1);
    expect(countAlpha(s.getPaintImageData(), 300, 290, 400, 310)).toBeGreaterThan(100);
    expect(s.canUndo).toBe(true);
  });

  it('one history entry per gesture; undo/redo are pixel exact; new gesture clears redo', () => {
    const { s, states } = split;
    s.loadPaint(null);
    const blank = s.getPaintImageData();
    stroke(s, [
      [200, 200],
      [300, 250],
      [400, 300],
    ]);
    const after1 = s.getPaintImageData();
    stroke(s, [
      [200, 600],
      [400, 650],
    ]);
    const after2 = s.getPaintImageData();
    expect(s.historySize).toBe(2);
    s.undo();
    expect(same(s.getPaintImageData(), after1)).toBe(true);
    s.undo();
    expect(same(s.getPaintImageData(), blank)).toBe(true);
    expect(states.at(-1)).toMatchObject({ canUndo: false, canRedo: true });
    s.redo();
    s.redo();
    expect(same(s.getPaintImageData(), after2)).toBe(true);
    s.undo();
    stroke(s, [
      [600, 600],
      [700, 700],
    ]);
    expect(s.canRedo).toBe(false);
    expect(states.at(-1)).toMatchObject({ canUndo: true, canRedo: false, dirty: true });
  });

  it('history limit drops oldest entries', () => {
    const { s } = split;
    s.loadPaint(null);
    for (let i = 0; i < History.MAX_ENTRIES + 3; i++)
      stroke(s, [
        [150 + i * 5, 200],
        [150 + i * 5, 210],
      ]);
    expect(s.historySize).toBe(History.MAX_ENTRIES);
  });

  it('clear is a single undoable entry', () => {
    const { s } = split;
    s.loadPaint(null);
    stroke(s, [
      [200, 200],
      [400, 400],
    ]);
    const painted = s.getPaintImageData();
    s.clear();
    expect(countAlpha(s.getPaintImageData(), 0, 0, 1000, 1000)).toBe(0);
    expect(s.historySize).toBe(2);
    s.undo();
    expect(same(s.getPaintImageData(), painted)).toBe(true);
  });

  it('resize preserves paint and sets backing = rect × dpr', () => {
    const h = make(squarePage);
    stroke(h.s, [
      [200, 200],
      [600, 600],
    ]);
    const before = h.s.getPaintImageData();
    for (const dpr of [1, 2, 3]) {
      h.setRect({ left: 40, top: 70, width: 400, height: 400 });
      h.setDpr(dpr);
      h.s.resize();
      expect(h.canvas.width).toBe(400 * dpr);
      expect(h.canvas.height).toBe(400 * dpr);
      expect(same(h.s.getPaintImageData(), before)).toBe(true);
    }
  });

  it('pointer mapping uses the offset rect (corners -> 0/1000)', () => {
    const h = make(squarePage);
    h.setRect({ left: 40, top: 70, width: 400, height: 400 });
    h.setDpr(2);
    h.s.resize();
    // client (40+200, 70+200) -> logical (500,500)
    h.s.setBrush({ tool: 'marker', size: 's' });
    stroke(h.s, [
      [240, 270],
      [241, 270],
    ]);
    const img = h.s.getPaintImageData();
    expect(alphaAt(img, 502, 500)).toBe(255);
    expect(alphaAt(img, 200, 200)).toBe(0);
  });

  it('composite render draws white, paint and outline into the display canvas', () => {
    const h = make(squarePage);
    h.setRect({ left: 0, top: 0, width: 200, height: 200 });
    h.s.resize();
    h.s.setBrush({ tool: 'bucket', color: '#2F9E44' });
    h.s.pointerDown(ptr(100, 100));
    h.s.pointerUp(ptr(100, 100));
    h.s.renderNow();
    const ctx = (h.canvas as AnyCanvas).getContext('2d') as CanvasRenderingContext2D;
    const px = (x: number, y: number) => Array.from(ctx.getImageData(x, y, 1, 1).data);
    expect(px(5, 5)).toEqual([255, 255, 255, 255]);
    expect(px(100, 100).slice(0, 3)).toEqual([0x2f, 0x9e, 0x44]);
    const edge = px(20, 100); // outline at logical 100
    expect(edge[0]!).toBeLessThan(90);
  });

  it('pattern tap fills region; exports produce PNG blobs', async () => {
    const h = make(squarePage);
    h.s.setBrush({ tool: 'pattern', pattern: 'checks', color: '#3A7BE0' });
    h.s.pointerDown(ptr(500, 500));
    h.s.pointerMove(ptr(502, 501));
    h.s.pointerUp(ptr(502, 501));
    const img = h.s.getPaintImageData();
    expect(countAlpha(img, 100, 100, 900, 900)).toBeGreaterThan(600000);
    const p1 = await h.s.exportPaintPNG();
    const p2 = await h.s.exportCompositePNG(256);
    expect(p1.size).toBeGreaterThan(100);
    expect(p2.type).toBe('image/png');
  });
});
