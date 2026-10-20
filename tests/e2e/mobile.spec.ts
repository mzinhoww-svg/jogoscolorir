import { expect, test } from '@playwright/test';
import { changedSince, findBlankRects, openPage, snap, toClient } from './helpers';

test.use({
  viewport: { width: 390, height: 844 },
  hasTouch: true,
  isMobile: true,
  deviceScaleFactor: 3,
});

test('9. mobile touch drawing paints and does not scroll the page', async ({ page }) => {
  await openPage(page, 'animals', 'animals-08');
  const dpr = await page.evaluate(() => devicePixelRatio);
  expect(dpr).toBe(3);
  // Make the document scrollable so a scroll caused by the gesture would be observable.
  await page.evaluate(() => {
    const spacer = document.createElement('div');
    spacer.id = 'e2e-spacer';
    spacer.style.height = '3000px';
    document.body.appendChild(spacer);
    window.scrollTo(0, 120);
  });
  const metrics = await page.evaluate(() => ({
    sh: document.scrollingElement!.scrollHeight,
    ch: document.scrollingElement!.clientHeight,
    y: window.scrollY,
  }));
  expect(metrics.sh).toBeGreaterThan(metrics.ch + 1000);
  expect(metrics.y).toBe(120);
  const [r] = await findBlankRects(page, 1, 200, 120);
  expect(r).toBeTruthy();
  await snap(page, 'before');
  const scrollPos = () =>
    page.evaluate(() => [window.scrollX, window.scrollY, document.scrollingElement!.scrollTop]);
  const scroll0 = await scrollPos();

  const cdp = await page.context().newCDPSession(page);
  const tp = (p: { x: number; y: number }) => [
    { x: p.x, y: p.y, id: 1, radiusX: 4, radiusY: 4, force: 1 },
  ];
  const swipe = async (pts: { x: number; y: number }[]) => {
    const seen: number[] = [];
    await cdp.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: tp(pts[0]!) });
    for (const p of pts.slice(1)) {
      await cdp.send('Input.dispatchTouchEvent', { type: 'touchMove', touchPoints: tp(p) });
      seen.push(await page.evaluate(() => window.scrollY));
    }
    await cdp.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] });
    return seen;
  };
  // Diagonal stroke with a strong vertical component (a scroll gesture if not prevented).
  const pts = [];
  for (let i = 0; i <= 12; i++)
    pts.push(
      await toClient(page, {
        x: r!.x + 20 + ((r!.w - 40) * i) / 12,
        y: r!.y + 15 + ((r!.h - 30) * i) / 12,
      }),
    );
  const moved = await swipe(pts);

  await expect.poll(() => changedSince(page, 'before', r!)).toBeGreaterThan(300);
  expect(moved.every((y) => y === scroll0[1])).toBe(true);
  expect(await scrollPos()).toEqual(scroll0);
  // The canvas alone opts out of browser touch gestures.
  expect(
    await page.getByTestId('paint-canvas').evaluate((c) => getComputedStyle(c).touchAction),
  ).toBe('none');

  // Control: the same kind of swipe outside the canvas does scroll, so the check above is real.
  const pal = (await page.locator('.paint-palette').boundingBox())!;
  const cx = pal.x + pal.width / 2;
  const cy0 = Math.min(pal.y + pal.height / 2, 700);
  const ctl = [];
  for (let i = 0; i <= 12; i++) ctl.push({ x: cx, y: cy0 - i * 15 });
  await swipe(ctl);
  await expect.poll(() => page.evaluate(() => window.scrollY)).toBeGreaterThan(scroll0[1]!);
});
