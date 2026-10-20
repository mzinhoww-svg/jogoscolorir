import { readFile } from 'node:fs/promises';
import { expect, test, type Page } from '@playwright/test';
import { ptBR } from '../../src/i18n/pt-BR';
import {
  canvasHash,
  changedSince,
  findBlankRects,
  frames,
  isWhite,
  openPage,
  pixelAt,
  readArtwork,
  snap,
  stroke,
  tap,
  waitReady,
  waitSaved,
  type Pt,
  type Rect,
} from './helpers';

async function line(page: Page, r: Rect): Promise<Pt> {
  const cy = r.y + r.h / 2;
  await stroke(page, [
    { x: r.x + 20, y: cy },
    { x: r.x + r.w - 20, y: cy },
  ]);
  return { x: r.x + r.w / 2, y: cy };
}

test('4. bucket fill stays inside its region (neighbour across the outline unchanged)', async ({
  page,
}) => {
  await openPage(page, 'animals', 'animals-01');
  // Find, on the middle rows, a point left of an outline and a point right of it (both white).
  const pair = await page.evaluate(() => {
    const c = document.querySelector<HTMLCanvasElement>('[data-testid="paint-canvas"]')!;
    const d = c.getContext('2d')!.getImageData(0, 0, c.width, c.height).data;
    const s = c.width / 1000;
    const kind = (lx: number, ly: number) => {
      const i = (Math.floor(ly * s) * c.width + Math.floor(lx * s)) * 4;
      if (d[i]! > 245 && d[i + 1]! > 245 && d[i + 2]! > 245) return 'w';
      if (d[i]! < 90 && d[i + 1]! < 90 && d[i + 2]! < 110) return 'd';
      return 'o';
    };
    for (const y of [500, 450, 550, 400, 600]) {
      for (let x = 30; x < 970; x++) {
        if (kind(x, y) !== 'd') continue;
        let e = x;
        while (e < 999 && kind(e, y) === 'd') e++;
        const left = x - 20;
        const right = e + 20;
        let ok = right < 980;
        for (let k = left; k < x - 2 && ok; k++) ok = kind(k, y) === 'w';
        for (let k = e + 2; k <= right && ok; k++) ok = kind(k, y) === 'w';
        if (ok)
          return { left: { x: left, y }, right: { x: right, y }, line: { x: (x + e) / 2, y } };
        x = e;
      }
    }
    return null;
  });
  expect(pair, 'outline with white on both sides').not.toBeNull();
  await page.getByTestId('tool-bucket').click();
  await page.getByTestId('color-0').click();
  await snap(page, 'before');
  const rightBefore = await pixelAt(page, pair!.right);
  await tap(page, pair!.left);
  await expect.poll(async () => isWhite(await pixelAt(page, pair!.left))).toBe(false);
  const leftAfter = await pixelAt(page, pair!.left);
  // The other side of the outline is untouched, as is a 20×20 patch around it.
  expect(await pixelAt(page, pair!.right)).toEqual(rightBefore);
  expect(
    await changedSince(page, 'before', {
      x: pair!.right.x - 2,
      y: pair!.right.y - 10,
      w: 20,
      h: 20,
    }),
  ).toBe(0);
  // The outline itself is still dark.
  const l = await pixelAt(page, pair!.line);
  expect(l[0]).toBeLessThan(90);
  // And the fill really spread (not only a dot).
  expect(await changedSince(page, 'before')).toBeGreaterThan(5000);
  expect(leftAfter.slice(0, 3)).not.toEqual(rightBefore.slice(0, 3));
});

test('5. undo, redo, cancel-clear, clear and undo-after-clear', async ({ page }) => {
  await openPage(page, 'animals', 'animals-02');
  const rects = await findBlankRects(page, 2, 220, 80);
  expect(rects.length).toBe(2);
  await expect(page.getByTestId('undo')).toBeDisabled();
  await snap(page, 'blank');
  await line(page, rects[0]!);
  await expect.poll(() => changedSince(page, 'blank')).toBeGreaterThan(500);
  await snap(page, 'one');
  await line(page, rects[1]!);
  await expect.poll(() => changedSince(page, 'one')).toBeGreaterThan(500);
  await snap(page, 'two');

  await page.getByTestId('undo').click();
  await expect.poll(() => changedSince(page, 'one')).toBe(0);
  await page.getByTestId('undo').click();
  await expect.poll(() => changedSince(page, 'blank')).toBe(0);
  await page.getByTestId('redo').click();
  await expect.poll(() => changedSince(page, 'one')).toBe(0);
  await page.getByTestId('redo').click();
  await expect.poll(() => changedSince(page, 'two')).toBe(0);
  await expect(page.getByTestId('redo')).toBeDisabled();

  await page.getByTestId('clear').click();
  await page.getByTestId('confirm-no').click();
  await expect(page.getByTestId('confirm-no')).toHaveCount(0);
  await frames(page);
  expect(await changedSince(page, 'two')).toBe(0);

  await page.getByTestId('clear').click();
  await page.getByTestId('confirm-yes').click();
  await expect.poll(() => changedSince(page, 'blank')).toBe(0);

  await page.getByTestId('undo').click();
  await expect.poll(() => changedSince(page, 'two')).toBe(0);
});

test('6. save, reload and continue painting', async ({ page }) => {
  await openPage(page, 'animals', 'animals-03');
  const rects = await findBlankRects(page, 2, 220, 80);
  const p1 = await line(page, rects[0]!);
  await waitSaved(page);
  await expect(page.getByTestId('save-status')).toHaveText(ptBR['save.saved']);
  expect(await readArtwork(page, 'animals-03')).toMatchObject({ pageId: 'animals-03', strokes: 1 });
  const h1 = await canvasHash(page);

  await page.reload();
  await page.goto('/');
  await page.getByTestId('play').click();
  await page.getByTestId('theme-animals').click();
  await page.getByTestId('page-animals-03').click();
  await waitReady(page);
  await frames(page);
  expect(await canvasHash(page)).toBe(h1);
  expect(isWhite(await pixelAt(page, p1))).toBe(false);

  const p2 = await line(page, rects[1]!);
  await waitSaved(page);
  expect(await readArtwork(page, 'animals-03')).toMatchObject({ strokes: 2 });
  const h2 = await canvasHash(page);
  expect(h2).not.toBe(h1);
  await page.reload();
  await waitReady(page);
  await frames(page);
  expect(await canvasHash(page)).toBe(h2);
  expect(isWhite(await pixelAt(page, p1))).toBe(false);
  expect(isWhite(await pixelAt(page, p2))).toBe(false);
});

test('7. export downloads a valid, non-blank 1000×1000 PNG', async ({ page }) => {
  await openPage(page, 'animals', 'animals-04');
  const [r] = await findBlankRects(page, 1, 220, 80);
  await page.getByTestId('color-0').click();
  const p = await line(page, r!);
  await expect.poll(async () => isWhite(await pixelAt(page, p))).toBe(false);
  const painted = await pixelAt(page, p);
  const dl = page.waitForEvent('download');
  await page.getByTestId('export').click();
  const download = await dl;
  expect(download.suggestedFilename()).toMatch(/\.png$/);
  const bytes = await readFile((await download.path())!);
  expect([...bytes.subarray(0, 8)]).toEqual([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);
  expect(bytes.subarray(12, 16).toString('ascii')).toBe('IHDR');
  expect(bytes.readUInt32BE(16)).toBe(1000);
  expect(bytes.readUInt32BE(20)).toBe(1000);

  const stats = await page.evaluate(
    async ({ b64, px, py }) => {
      const img = new Image();
      img.src = `data:image/png;base64,${b64}`;
      await img.decode();
      const c = document.createElement('canvas');
      c.width = img.naturalWidth;
      c.height = img.naturalHeight;
      const ctx = c.getContext('2d')!;
      ctx.drawImage(img, 0, 0);
      const d = ctx.getImageData(0, 0, c.width, c.height).data;
      let white = 0;
      let dark = 0;
      let opaque = 0;
      for (let i = 0; i < d.length; i += 4) {
        if (d[i + 3] === 255) opaque++;
        if (d[i]! > 245 && d[i + 1]! > 245 && d[i + 2]! > 245) white++;
        else if (d[i]! < 80 && d[i + 1]! < 80 && d[i + 2]! < 100) dark++;
      }
      const at = (x: number, y: number) => [...ctx.getImageData(x, y, 1, 1).data];
      return {
        w: c.width,
        h: c.height,
        white,
        dark,
        opaque,
        total: d.length / 4,
        corner: at(2, 2),
        stroke: at(px, py),
      };
    },
    { b64: bytes.toString('base64'), px: Math.round(p.x), py: Math.round(p.y) },
  );
  expect(stats.w).toBe(1000);
  expect(stats.h).toBe(1000);
  expect(stats.opaque).toBe(stats.total);
  expect(stats.white / stats.total).toBeGreaterThan(0.4);
  expect(stats.dark / stats.total).toBeGreaterThan(0.005);
  expect(stats.corner).toEqual([255, 255, 255, 255]);
  for (let ch = 0; ch < 3; ch++)
    expect(Math.abs(stats.stroke[ch]! - painted[ch]!)).toBeLessThan(25);
});

test('8. orientation change keeps the painting', async ({ page }) => {
  await page.setViewportSize({ width: 1024, height: 768 });
  await openPage(page, 'animals', 'animals-05');
  const [r] = await findBlankRects(page, 1, 220, 80);
  const p = await line(page, r!);
  await expect.poll(async () => isWhite(await pixelAt(page, p))).toBe(false);
  const painted = await pixelAt(page, p);
  const box1 = (await page.getByTestId('paint-canvas').boundingBox())!;
  const backing = () =>
    page.evaluate(
      () => document.querySelector<HTMLCanvasElement>('[data-testid="paint-canvas"]')!.width,
    );
  const w1 = await backing();

  await page.setViewportSize({ width: 768, height: 1024 });
  await expect.poll(backing).not.toBe(w1);
  const box2 = (await page.getByTestId('paint-canvas').boundingBox())!;
  expect(box2.width).not.toBeCloseTo(box1.width, 0);
  await frames(page);
  // pixelAt maps the logical point through the new backing size: same place on the page.
  const after = await pixelAt(page, p);
  for (let ch = 0; ch < 3; ch++) expect(Math.abs(after[ch]! - painted[ch]!)).toBeLessThan(25);
  // And via client coordinates (bounding rect) the stroke is where the logical point maps.
  const hit = await page.evaluate(
    ({ x, y }) => {
      const c = document.querySelector<HTMLCanvasElement>('[data-testid="paint-canvas"]')!;
      const b = c.getBoundingClientRect();
      const px = Math.floor(((x - b.left) / b.width) * c.width);
      const py = Math.floor(((y - b.top) / b.height) * c.height);
      return [...c.getContext('2d')!.getImageData(px, py, 1, 1).data];
    },
    { x: box2.x + (p.x / 1000) * box2.width, y: box2.y + (p.y / 1000) * box2.height },
  );
  expect(isWhite(hit)).toBe(false);

  await page.setViewportSize({ width: 1024, height: 768 });
  await expect.poll(backing).toBe(w1);
  await frames(page);
  const back = await pixelAt(page, p);
  for (let ch = 0; ch < 3; ch++) expect(Math.abs(back[ch]! - painted[ch]!)).toBeLessThan(25);
});

for (const mode of ['sync-throw', 'async-error'] as const) {
  test.describe(`storage failure (${mode})`, () => {
    test.beforeEach(async ({ page }) => {
      await page.addInitScript((m) => {
        const quota = () => new DOMException('The quota has been exceeded.', 'QuotaExceededError');
        const realPut = IDBObjectStore.prototype.put;
        IDBObjectStore.prototype.put = function (this: IDBObjectStore, ...args) {
          if (m === 'sync-throw') throw quota();
          // Async: a real request whose transaction aborts; request/transaction report quota.
          const req = realPut.apply(this, args as Parameters<IDBObjectStore['put']>);
          const err = quota();
          const tx = this.transaction;
          Object.defineProperty(req, 'error', { get: () => err });
          Object.defineProperty(tx, 'error', { get: () => err });
          setTimeout(() => {
            try {
              tx.abort();
            } catch {
              /* already finished */
            }
          }, 0);
          return req;
        } as IDBObjectStore['put'];
        // Every mutation record touching save-status, in order (attribute changes and inserts).
        const log: string[] = [];
        (window as unknown as { __statusLog: string[] }).__statusLog = log;
        new MutationObserver((records) => {
          for (const rec of records) {
            if (rec.type === 'attributes' && rec.target instanceof Element) {
              if (rec.target.getAttribute('data-testid') === 'save-status')
                log.push(`attr:${rec.target.getAttribute('data-status')}`);
            } else if (rec.type === 'childList') {
              for (const n of rec.addedNodes) {
                const el =
                  n instanceof Element
                    ? n.matches('[data-testid="save-status"]')
                      ? n
                      : n.querySelector('[data-testid="save-status"]')
                    : null;
                if (el) log.push(`add:${el.getAttribute('data-status')}`);
                const host = rec.target instanceof Element ? rec.target : null;
                if (host?.getAttribute('data-testid') === 'save-status')
                  log.push(`text:${host.textContent}`);
              }
            } else if (rec.type === 'characterData') {
              const host = rec.target.parentElement;
              if (host?.getAttribute('data-testid') === 'save-status')
                log.push(`text:${host.textContent}`);
            }
          }
        }).observe(document, {
          subtree: true,
          childList: true,
          characterData: true,
          attributes: true,
          attributeFilter: ['data-status'],
        });
      }, mode);
    });

    test('IndexedDB quota error shows the failure text and never "saved"', async ({ page }) => {
      await openPage(page, 'animals', 'animals-06');
      const [r] = await findBlankRects(page, 1, 220, 80);
      await line(page, r!);
      const status = page.getByTestId('save-status');
      await expect(status).toHaveAttribute('data-status', 'failed');
      await expect(status).toHaveText(ptBR['save.failed']);
      await expect(
        page.getByRole('alert').filter({ hasText: ptBR['save.failed.help'] }),
      ).toBeVisible();
      await page.getByTestId('done').click();
      await expect(status).toHaveAttribute('data-status', 'failed');
      // A second gesture and a retry still fail.
      await line(page, { ...r!, y: r!.y + 10 });
      await page.getByRole('button', { name: ptBR['save.retry'] }).click();
      await expect(status).toHaveAttribute('data-status', 'failed');
      const log = await page.evaluate(
        () => (window as unknown as { __statusLog: string[] }).__statusLog,
      );
      test.info().annotations.push({ type: 'status-log', description: JSON.stringify(log) });
      expect(log).toContain('attr:failed');
      expect(log).toContain('attr:saving');
      expect(log).not.toContain('attr:saved');
      expect(log.filter((e) => e === `text:${ptBR['save.saved']}`)).toEqual([]);
      expect(log).toContain(`text:${ptBR['save.failed']}`);
      expect(await readArtwork(page, 'animals-06')).toBeNull();
    });
  });
}

test('toast on the paint screen sits at the top and never blocks canvas taps', async ({ page }) => {
  await openPage(page, 'animals', 'animals-01');
  const r = await page.evaluate(() => {
    const region = document.querySelector('.toast-region')!;
    region.insertAdjacentHTML(
      'beforeend',
      '<div class="toast toast-info"><span>hello</span><button class="toast-close">x</button></div>',
    );
    const c = document.querySelector<HTMLCanvasElement>('[data-testid="paint-canvas"]')!;
    const b = c.getBoundingClientRect();
    const toast = region.querySelector('.toast')!.getBoundingClientRect();
    const close = region.querySelector('.toast-close')!.getBoundingClientRect();
    const hit = (x: number, y: number) => document.elementFromPoint(x, y);
    return {
      regionTop: region.classList.contains('toast-region-top'),
      toastBottom: toast.bottom,
      canvasBottom: b.bottom,
      bottomIsCanvas: hit(b.left + b.width / 2, b.bottom - 6) === c,
      overToastBody: hit(toast.left + 4, toast.top + toast.height / 2)?.className ?? '',
      closeIsButton: hit(close.left + close.width / 2, close.top + close.height / 2)?.className,
    };
  });
  expect(r.regionTop).toBe(true);
  expect(r.bottomIsCanvas).toBe(true);
  expect(r.overToastBody).not.toContain('toast');
  expect(r.closeIsButton).toBe('toast-close');
});
