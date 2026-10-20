/** Minimal structural canvas type shared by DOM canvases and @napi-rs/canvas (tests). */
export interface AnyCanvas {
  width: number;
  height: number;
  getContext(type: '2d'): unknown;
}

export interface CanvasFactory {
  create(w: number, h: number): AnyCanvas;
  toPNG(c: AnyCanvas): Promise<Blob>;
}

export function ctx2d(c: AnyCanvas): CanvasRenderingContext2D {
  const ctx = c.getContext('2d') as CanvasRenderingContext2D | null;
  if (!ctx) throw new Error('2D context unavailable');
  return ctx;
}

export const browserCanvasFactory: CanvasFactory = {
  create(w, h) {
    const c = document.createElement('canvas');
    c.width = w;
    c.height = h;
    return c as AnyCanvas;
  },
  toPNG(c) {
    return new Promise((resolve, reject) => {
      (c as HTMLCanvasElement).toBlob(
        (b) => (b ? resolve(b) : reject(new Error('toBlob failed'))),
        'image/png',
      );
    });
  },
};
