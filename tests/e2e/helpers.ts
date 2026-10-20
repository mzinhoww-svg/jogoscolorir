import { expect, type Page } from '@playwright/test';

export const LOGICAL = 1000;
export const PREFS_KEY = 'pinta-mundo:prefs';

export interface Pt {
  x: number;
  y: number;
}
export interface Rect {
  x: number;
  y: number;
  w: number;
  h: number;
}
export interface Signature {
  changed: number;
  mean: [number, number, number];
  variance: number;
  distinct: number;
}

/** Home → play → theme → page, then wait until the paint canvas has loaded. */
export async function openPage(page: Page, themeId: string, pageId: string): Promise<void> {
  await page.goto('/');
  await page.getByTestId('play').click();
  await page.getByTestId(`theme-${themeId}`).click();
  await page.getByTestId(`page-${pageId}`).click();
  await waitReady(page);
}

export async function waitReady(page: Page): Promise<void> {
  await expect(page.getByTestId('paint-canvas')).toHaveAttribute('data-ready', 'true');
}

/** Logical (0..1000) page coordinates → client (CSS) coordinates. */
export async function toClient(page: Page, p: Pt): Promise<Pt> {
  const box = await page.getByTestId('paint-canvas').boundingBox();
  if (!box) throw new Error('canvas not visible');
  return { x: box.x + (p.x / LOGICAL) * box.width, y: box.y + (p.y / LOGICAL) * box.height };
}

/** Mouse stroke through logical points (interpolated so every tool gets many moves). */
export async function stroke(page: Page, pts: Pt[], stepsPerSeg = 12): Promise<void> {
  const first = pts[0];
  if (!first) return;
  const c0 = await toClient(page, first);
  await page.mouse.move(c0.x, c0.y);
  await page.mouse.down();
  for (let i = 1; i < pts.length; i++) {
    const c = await toClient(page, pts[i]!);
    await page.mouse.move(c.x, c.y, { steps: stepsPerSeg });
  }
  await page.mouse.up();
}

export async function tap(page: Page, p: Pt): Promise<void> {
  const c = await toClient(page, p);
  await page.mouse.click(c.x, c.y);
}

/** Store a copy of the display canvas pixels in the page under `key`. */
export async function snap(page: Page, key: string): Promise<void> {
  await page.evaluate((k) => {
    const c = document.querySelector<HTMLCanvasElement>('[data-testid="paint-canvas"]')!;
    const img = c.getContext('2d')!.getImageData(0, 0, c.width, c.height);
    const w = window as unknown as { __snaps?: Record<string, ImageData> };
    (w.__snaps ??= {})[k] = img;
  }, key);
}

/** RGBA of the display canvas at a logical point. */
export async function pixelAt(page: Page, p: Pt): Promise<[number, number, number, number]> {
  return page.evaluate(
    ({ x, y, L }) => {
      const c = document.querySelector<HTMLCanvasElement>('[data-testid="paint-canvas"]')!;
      const px = Math.min(c.width - 1, Math.floor((x / L) * c.width));
      const py = Math.min(c.height - 1, Math.floor((y / L) * c.height));
      const d = c.getContext('2d')!.getImageData(px, py, 1, 1).data;
      return [d[0]!, d[1]!, d[2]!, d[3]!] as [number, number, number, number];
    },
    { ...p, L: LOGICAL },
  );
}

/**
 * Signature of the pixels that differ between snapshot `before` and the current canvas inside a
 * logical rect (whole canvas when omitted).
 */
export async function changeSignature(page: Page, before: string, rect?: Rect): Promise<Signature> {
  return page.evaluate(
    ({ k, r, L }) => {
      const c = document.querySelector<HTMLCanvasElement>('[data-testid="paint-canvas"]')!;
      const now = c.getContext('2d')!.getImageData(0, 0, c.width, c.height);
      const prev = (window as unknown as { __snaps: Record<string, ImageData> }).__snaps[k]!;
      if (prev.width !== now.width || prev.height !== now.height) throw new Error('size changed');
      const s = c.width / L;
      const rr = r ?? { x: 0, y: 0, w: L, h: L };
      const x0 = Math.max(0, Math.floor(rr.x * s));
      const y0 = Math.max(0, Math.floor(rr.y * s));
      const x1 = Math.min(c.width, Math.ceil((rr.x + rr.w) * s));
      const y1 = Math.min(c.height, Math.ceil((rr.y + rr.h) * s));
      let n = 0;
      const sum = [0, 0, 0];
      const sq = [0, 0, 0];
      const colors = new Set<number>();
      for (let y = y0; y < y1; y++) {
        for (let x = x0; x < x1; x++) {
          const i = (y * c.width + x) * 4;
          const a = now.data;
          const b = prev.data;
          if (
            Math.abs(a[i]! - b[i]!) +
              Math.abs(a[i + 1]! - b[i + 1]!) +
              Math.abs(a[i + 2]! - b[i + 2]!) <
            12
          )
            continue;
          n++;
          for (let ch = 0; ch < 3; ch++) {
            sum[ch]! += a[i + ch]!;
            sq[ch]! += a[i + ch]! * a[i + ch]!;
          }
          colors.add(((a[i]! >> 3) << 10) | ((a[i + 1]! >> 3) << 5) | (a[i + 2]! >> 3));
        }
      }
      const mean = sum.map((v) => (n ? v / n : 0)) as [number, number, number];
      const variance = n ? sq.reduce((acc, v, ch) => acc + v / n - mean[ch]! ** 2, 0) / 3 : 0;
      return { changed: n, mean, variance, distinct: colors.size };
    },
    { k: before, r: rect ?? null, L: LOGICAL },
  );
}

/** Count of pixels differing from snapshot `key` (whole canvas). */
export async function changedSince(page: Page, key: string, rect?: Rect): Promise<number> {
  return (await changeSignature(page, key, rect)).changed;
}

/**
 * Find `count` non-overlapping logical rects of size w×h that contain only white pixels on the
 * current display canvas (i.e. no outline crosses them). Searches a coarse grid, top to bottom.
 */
export async function findBlankRects(
  page: Page,
  count: number,
  w: number,
  h: number,
): Promise<Rect[]> {
  return page.evaluate(
    ({ count, w, h, L }) => {
      const c = document.querySelector<HTMLCanvasElement>('[data-testid="paint-canvas"]')!;
      const d = c.getContext('2d')!.getImageData(0, 0, c.width, c.height).data;
      const s = c.width / L;
      const white = (lx: number, ly: number) => {
        const i = (Math.floor(ly * s) * c.width + Math.floor(lx * s)) * 4;
        return d[i]! > 245 && d[i + 1]! > 245 && d[i + 2]! > 245;
      };
      const out: { x: number; y: number; w: number; h: number }[] = [];
      const overlaps = (x: number, y: number) =>
        out.some(
          (r) => x < r.x + r.w + 20 && x + w + 20 > r.x && y < r.y + r.h + 20 && y + h + 20 > r.y,
        );
      for (let y = 20; y + h < L - 20 && out.length < count; y += 10) {
        for (let x = 20; x + w < L - 20 && out.length < count; x += 10) {
          if (overlaps(x, y)) continue;
          let ok = true;
          for (let yy = y; yy <= y + h && ok; yy += 2)
            for (let xx = x; xx <= x + w && ok; xx += 2) ok = white(xx, yy);
          if (ok) out.push({ x, y, w, h });
        }
      }
      return out;
    },
    { count, w, h, L: LOGICAL },
  );
}

/** Wait for the save-status element to report "saved". */
export async function waitSaved(page: Page): Promise<void> {
  await expect(page.getByTestId('save-status')).toHaveAttribute('data-status', 'saved');
}

/** Read one artwork record's metadata straight from IndexedDB. */
export async function readArtwork(
  page: Page,
  pageId: string,
): Promise<{ pageId: string; strokes: number; paintSize: number } | null> {
  return page.evaluate(
    (id) =>
      new Promise((resolve, reject) => {
        const req = indexedDB.open('pinta-mundo');
        req.onerror = () => reject(req.error);
        req.onsuccess = () => {
          const db = req.result;
          if (!db.objectStoreNames.contains('artworks')) {
            db.close();
            resolve(null);
            return;
          }
          const g = db.transaction('artworks').objectStore('artworks').get(id);
          g.onsuccess = () => {
            const v = g.result as { pageId: string; strokes: number; paint: Blob } | undefined;
            db.close();
            resolve(v ? { pageId: v.pageId, strokes: v.strokes, paintSize: v.paint.size } : null);
          };
          g.onerror = () => reject(g.error);
        };
      }),
    pageId,
  );
}

/** FNV-1a hash of the display canvas pixels plus its backing size. */
export async function canvasHash(page: Page): Promise<string> {
  return page.evaluate(() => {
    const c = document.querySelector<HTMLCanvasElement>('[data-testid="paint-canvas"]')!;
    const d = c.getContext('2d')!.getImageData(0, 0, c.width, c.height).data;
    let h = 0x811c9dc5;
    for (let i = 0; i < d.length; i++) h = Math.imul(h ^ d[i]!, 0x01000193) >>> 0;
    return `${c.width}x${c.height}:${h.toString(16)}`;
  });
}

/** Wait two animation frames so a scheduled render has landed. */
export async function frames(page: Page): Promise<void> {
  await page.evaluate(
    () => new Promise<void>((r) => requestAnimationFrame(() => requestAnimationFrame(() => r()))),
  );
}

export const isWhite = (p: number[]) => p[0]! > 245 && p[1]! > 245 && p[2]! > 245;
