import { getPage, renderOutline } from '@/catalog';
import { browserCanvasFactory, ctx2d } from '@/engine/canvasFactory';

export const exportName = (pageId: string): string => `pinta-mundo-${pageId}.png`;

export function downloadBlob(blob: Blob, name: string): void {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = name;
  a.rel = 'noopener';
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 10_000);
}

/** Composite (white + saved paint + outline) of a stored artwork, without a live session. */
export async function compositeFromPaint(pageId: string, paint: Blob, size = 1000): Promise<Blob> {
  const page = getPage(pageId);
  if (!page) throw new Error('unknown page');
  const bmp = await createImageBitmap(paint);
  const c = browserCanvasFactory.create(size, size);
  const ctx = ctx2d(c);
  ctx.fillStyle = '#FFFFFF';
  ctx.fillRect(0, 0, size, size);
  ctx.drawImage(bmp, 0, 0, size, size);
  bmp.close?.();
  renderOutline(ctx, page, size);
  return browserCanvasFactory.toPNG(c);
}

export const prefersReducedMotion = (): boolean =>
  typeof matchMedia === 'function' && matchMedia('(prefers-reduced-motion: reduce)').matches;
