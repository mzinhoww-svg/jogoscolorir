import { createCanvas } from '@napi-rs/canvas';
import type { AnyCanvas, CanvasFactory } from '@/engine/canvasFactory';
import type { PageDef } from '@/catalog/types';
import type { PointerLike } from '@/engine/session';

export const napiFactory: CanvasFactory = {
  create(w: number, h: number): AnyCanvas {
    return createCanvas(w, h) as unknown as AnyCanvas;
  },
  async toPNG(c: AnyCanvas): Promise<Blob> {
    const buf = (c as unknown as { toBuffer(t: 'image/png'): Buffer }).toBuffer('image/png');
    return new Blob([new Uint8Array(buf)], { type: 'image/png' });
  },
};

export function pageOf(id: string, draw: PageDef['draw']): PageDef {
  return { id, themeId: 'animals', index: 1, nameKey: `page.${id}`, draw };
}

/** One big square frame: inside region spans 100..900. */
export const squarePage = pageOf('test-01', (p) => p.rect(100, 100, 800, 800));
/** Square split vertically at x=500. */
export const splitPage = pageOf('test-02', (p) => {
  p.rect(100, 100, 800, 800);
  p.line(500, 100, 500, 900);
});
/** Ring: outer circle r=350, inner r=150 around (500,500). */
export const ringPage = pageOf('test-03', (p) => {
  p.circle(500, 500, 350);
  p.circle(500, 500, 150);
});

let nextId = 1;
export function ptr(x: number, y: number, extra: Partial<PointerLike> = {}): PointerLike {
  return {
    pointerId: 1,
    clientX: x,
    clientY: y,
    pressure: 0.5,
    pointerType: 'mouse',
    isPrimary: true,
    button: 0,
    ...extra,
  };
}
export const freshId = (): number => ++nextId;

export function displayCanvas(size = 500): AnyCanvas {
  return napiFactory.create(size, size);
}
