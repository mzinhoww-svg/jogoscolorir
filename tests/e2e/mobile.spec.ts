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
  const [r] = await findBlankRects(page, 1, 200, 80);
  expect(r).toBeTruthy();
  await snap(page, 'before');
  const scroll0 = await page.evaluate(() => [
    window.scrollX,
    window.scrollY,
    document.scrollingElement!.scrollTop,
  ]);

  const cdp = await page.context().newCDPSession(page);
  const cy = r!.y + r!.h / 2;
  const pts = [];
  for (let i = 0; i <= 12; i++)
    pts.push(
      await toClient(page, { x: r!.x + 20 + ((r!.w - 40) * i) / 12, y: cy + (i % 2 ? 6 : -6) }),
    );
  const tp = (p: { x: number; y: number }) => [
    { x: p.x, y: p.y, id: 1, radiusX: 4, radiusY: 4, force: 1 },
  ];
  await cdp.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: tp(pts[0]!) });
  const moved: number[] = [];
  for (const p of pts.slice(1)) {
    await cdp.send('Input.dispatchTouchEvent', { type: 'touchMove', touchPoints: tp(p) });
    moved.push(await page.evaluate(() => window.scrollY));
  }
  await cdp.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] });

  await expect.poll(() => changedSince(page, 'before', r!)).toBeGreaterThan(300);
  expect(moved.every((y) => y === scroll0[1])).toBe(true);
  expect(
    await page.evaluate(() => [
      window.scrollX,
      window.scrollY,
      document.scrollingElement!.scrollTop,
    ]),
  ).toEqual(scroll0);
  // The canvas alone opts out of browser touch gestures.
  expect(
    await page.getByTestId('paint-canvas').evaluate((c) => getComputedStyle(c).touchAction),
  ).toBe('none');
});
