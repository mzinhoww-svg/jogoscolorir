import { describe, it, expect } from 'vitest';
import { ViewTransform } from '@/engine/transform';

describe('ViewTransform', () => {
  it('maps corners of an offset rect to 0 and 1000', () => {
    const t = new ViewTransform({ left: 37, top: 112, width: 640, height: 640 });
    expect(t.toLogical(37, 112)).toEqual({ x: 0, y: 0 });
    expect(t.toLogical(37 + 640, 112 + 640)).toEqual({ x: 1000, y: 1000 });
    const c = t.toLogical(37 + 320, 112 + 160);
    expect(c.x).toBeCloseTo(500);
    expect(c.y).toBeCloseTo(250);
  });
  it('honours custom logical size', () => {
    const t = new ViewTransform({ left: 0, top: 0, width: 100, height: 100 }, 200);
    expect(t.toLogical(50, 100)).toEqual({ x: 100, y: 200 });
  });
  it('backingSize scales by dpr 1/2/3', () => {
    const r = { left: 10, top: 20, width: 300, height: 300 };
    for (const dpr of [1, 2, 3]) {
      expect(ViewTransform.backingSize(r, dpr)).toEqual({ width: 300 * dpr, height: 300 * dpr });
    }
  });
});
