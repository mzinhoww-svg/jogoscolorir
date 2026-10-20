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
          // Not covered by another element (e.g. a toast): pointer input must reach the canvas.
          const b = c.getBoundingClientRect();
          for (let yy = y; yy <= y + h && ok; yy += h / 4)
            for (let xx = x; xx <= x + w && ok; xx += w / 8)
              ok =
                document.elementFromPoint(
                  b.left + (xx / L) * b.width,
                  b.top + (yy / L) * b.height,
                ) === c;
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

export interface StrokeAnalysis {
  /** Median count of changed pixels per column (perpendicular width, backing px). */
  width: number;
  /** Fraction of pixels changed inside the central band (|dy| < bandHalf logical). */
  bandCoverage: number;
  /** Mean per-channel variance of ALL pixels in the core (|dy| < coreHalf logical). */
  coreVariance: number;
  /** Fraction of changed pixels that are only partly toward `color` (blended/soft). */
  blended: number;
  /** 4-connected components of changed pixels in the rect. */
  components: number;
  /** 30° hue bins holding ≥3% of saturated changed pixels. */
  hueBins: number;
  /** Near-white (min channel > 215) pixels enclosed above and below by painted pixels. */
  sparkles: number;
  /** Colour alternations along the stroke centre line between two clusters. */
  alternations: number;
  /** Colour distance between the two centre-line clusters. */
  clusterDist: number;
}

/**
 * Analyse a straight horizontal stroke at logical y=`cy` inside `rect`, versus snapshot `before`.
 * `color` is the selected colour (for the blend measure).
 */
export async function analyzeStroke(
  page: Page,
  before: string,
  rect: Rect,
  cy: number,
  opts: { color: string; bandHalf: number; coreHalf: number },
): Promise<StrokeAnalysis> {
  return page.evaluate(
    ({ k, r, cy, o, L }) => {
      const c = document.querySelector<HTMLCanvasElement>('[data-testid="paint-canvas"]')!;
      const W = c.width;
      const a = c.getContext('2d')!.getImageData(0, 0, W, c.height).data;
      const b = (window as unknown as { __snaps: Record<string, ImageData> }).__snaps[k]!.data;
      const s = W / L;
      const x0 = Math.ceil((r.x + 40) * s);
      const x1 = Math.floor((r.x + r.w - 40) * s);
      const y0 = Math.ceil(r.y * s);
      const y1 = Math.floor((r.y + r.h) * s);
      const yc = cy * s;
      const idx = (x: number, y: number) => (y * W + x) * 4;
      const changed = (x: number, y: number) => {
        const i = idx(x, y);
        return (
          Math.abs(a[i]! - b[i]!) +
            Math.abs(a[i + 1]! - b[i + 1]!) +
            Math.abs(a[i + 2]! - b[i + 2]!) >=
          12
        );
      };
      const hex = o.color.replace('#', '');
      const target = [0, 2, 4].map((j) => parseInt(hex.slice(j, j + 2), 16));
      const full = Math.hypot(255 - target[0]!, 255 - target[1]!, 255 - target[2]!);
      const widths: number[] = [];
      let band = 0;
      let bandN = 0;
      const sum = [0, 0, 0];
      const sq = [0, 0, 0];
      let coreN = 0;
      let ch = 0;
      let blended = 0;
      let sparkles = 0;
      const bins = new Array(12).fill(0) as number[];
      let sat = 0;
      for (let x = x0; x < x1; x++) {
        let w = 0;
        let colPainted = false;
        for (let y = y0; y < y1; y++) {
          const i = idx(x, y);
          const isC = changed(x, y);
          if (isC) {
            w++;
            ch++;
            colPainted = true;
            const st = Math.hypot(255 - a[i]!, 255 - a[i + 1]!, 255 - a[i + 2]!) / full;
            if (st > 0.05 && st < 0.6) blended++;
            const mx = Math.max(a[i]!, a[i + 1]!, a[i + 2]!);
            const mn = Math.min(a[i]!, a[i + 1]!, a[i + 2]!);
            if (mx > 40 && (mx - mn) / mx > 0.3) {
              sat++;
              let h = 0;
              const [R, G, B] = [a[i]!, a[i + 1]!, a[i + 2]!];
              const d = mx - mn;
              if (mx === R) h = ((G - B) / d + 6) % 6;
              else if (mx === G) h = (B - R) / d + 2;
              else h = (R - G) / d + 4;
              bins[Math.floor(h * 2) % 12]!++;
            }
          }
          const dy = Math.abs(y - yc) / s;
          if (dy < o.bandHalf) {
            bandN++;
            if (isC) band++;
          }
          if (dy < o.coreHalf) {
            coreN++;
            for (let j = 0; j < 3; j++) {
              sum[j]! += a[i + j]!;
              sq[j]! += a[i + j]! * a[i + j]!;
            }
          }
        }
        widths.push(w);
        if (colPainted) {
          // Near-white pixels enclosed (in this column) by painted pixels above and below.
          let top = -1;
          let bot = -1;
          for (let y = y0; y < y1; y++)
            if (changed(x, y)) {
              if (top < 0) top = y;
              bot = y;
            }
          for (let y = top + 1; y < bot; y++) {
            const i = idx(x, y);
            if (a[i]! > 215 && a[i + 1]! > 215 && a[i + 2]! > 215) sparkles++;
          }
        }
      }
      widths.sort((p, q) => p - q);
      const coreVariance =
        sq.reduce((acc, v, j) => acc + v / coreN - (sum[j]! / coreN) ** 2, 0) / 3;
      // Components (4-connected) of changed pixels.
      const RW = x1 - x0;
      const RH = y1 - y0;
      const seen = new Uint8Array(RW * RH);
      let components = 0;
      for (let y = 0; y < RH; y++)
        for (let x = 0; x < RW; x++) {
          if (seen[y * RW + x] || !changed(x + x0, y + y0)) continue;
          components++;
          const st = [y * RW + x];
          seen[y * RW + x] = 1;
          while (st.length) {
            const p = st.pop()!;
            const px = p % RW;
            const py = (p - px) / RW;
            for (const [dx, dy] of [
              [1, 0],
              [-1, 0],
              [0, 1],
              [0, -1],
            ] as const) {
              const nx = px + dx;
              const ny = py + dy;
              if (nx < 0 || ny < 0 || nx >= RW || ny >= RH) continue;
              const q = ny * RW + nx;
              if (seen[q] || !changed(nx + x0, ny + y0)) continue;
              seen[q] = 1;
              st.push(q);
            }
          }
        }
      // Centre line: 2-means on luminance, count alternations of runs ≥ 2 px.
      const yy = Math.round(yc);
      const line: number[][] = [];
      for (let x = x0; x < x1; x++) {
        const i = idx(x, yy);
        line.push([a[i]!, a[i + 1]!, a[i + 2]!]);
      }
      const lum = line.map((p) => 0.3 * p[0]! + 0.59 * p[1]! + 0.11 * p[2]!);
      const thr = (Math.min(...lum) + Math.max(...lum)) / 2;
      const cls = lum.map((v) => (v > thr ? 1 : 0));
      const mean = (sel: number) => {
        const ps = line.filter((_, i) => cls[i] === sel);
        return [0, 1, 2].map((j) => ps.reduce((acc, p) => acc + p[j]!, 0) / Math.max(1, ps.length));
      };
      const m0 = mean(0);
      const m1 = mean(1);
      const flat = Math.max(...lum) - Math.min(...lum) < 40;
      let alternations = 0;
      let run = 0;
      let cur = -1;
      for (const v of cls) {
        if (v === cur) run++;
        else {
          if (!flat && cur !== -1 && run >= 2) alternations++;
          cur = v;
          run = 1;
        }
      }
      return {
        width: widths[widths.length >> 1] ?? 0,
        bandCoverage: band / Math.max(1, bandN),
        coreVariance,
        blended: blended / Math.max(1, ch),
        components,
        hueBins: bins.filter((n) => n >= sat * 0.03 && n > 0).length,
        sparkles,
        alternations,
        clusterDist: Math.hypot(m0[0]! - m1[0]!, m0[1]! - m1[1]!, m0[2]! - m1[2]!),
      };
    },
    { k: before, r: rect, cy, o: opts, L: LOGICAL },
  );
}
