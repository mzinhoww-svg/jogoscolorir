import type { PageDef } from './types';
import { PathPen } from './dsl';

export const OUTLINE_COLOR = '#2B2340';
export const OUTLINE_WIDTH = 7;

export function renderOutline(ctx: CanvasRenderingContext2D, page: PageDef, size: number): void {
  const pen = new PathPen();
  page.draw(pen);
  ctx.save();
  ctx.scale(size / 1000, size / 1000);
  ctx.lineWidth = OUTLINE_WIDTH;
  ctx.strokeStyle = OUTLINE_COLOR;
  ctx.lineJoin = 'round';
  ctx.lineCap = 'round';
  ctx.stroke(pen.path2d);
  ctx.restore();
}

export type CanvasFactory = (w: number, h: number) => { getContext(type: '2d'): unknown };

/** Rasterize the outline to RGBA at size×size using any canvas factory. */
export function rasterizeOutline(
  page: PageDef,
  size: number,
  createCanvas: CanvasFactory,
): Uint8ClampedArray {
  const ctx = createCanvas(size, size).getContext('2d') as CanvasRenderingContext2D;
  renderOutline(ctx, page, size);
  return new Uint8ClampedArray(ctx.getImageData(0, 0, size, size).data);
}
