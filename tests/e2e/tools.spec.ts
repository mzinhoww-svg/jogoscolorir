import { expect, test } from '@playwright/test';
import {
  changeSignature,
  findBlankRects,
  openPage,
  snap,
  stroke,
  tap,
  pixelAt,
  type Signature,
} from './helpers';

const TOOLS = ['marker', 'pencil', 'brush', 'bucket', 'spray', 'shine', 'pattern'] as const;

test('1. opens the game and selects a page', async ({ page }) => {
  await openPage(page, 'animals', 'animals-01');
  await expect(page).toHaveURL(/#\/pintar\/animals-01$/);
  // The display canvas really has the page drawn: white background and dark outline pixels.
  const sig = await page.evaluate(() => {
    const c = document.querySelector<HTMLCanvasElement>('[data-testid="paint-canvas"]')!;
    const d = c.getContext('2d')!.getImageData(0, 0, c.width, c.height).data;
    let white = 0;
    let dark = 0;
    for (let i = 0; i < d.length; i += 4) {
      if (d[i]! > 245 && d[i + 1]! > 245 && d[i + 2]! > 245) white++;
      else if (d[i]! < 80 && d[i + 1]! < 80 && d[i + 2]! < 100) dark++;
    }
    return { white, dark, total: d.length / 4, w: c.width, cssW: c.getBoundingClientRect().width };
  });
  expect(sig.w).toBe(Math.round(sig.cssW * (await page.evaluate(() => devicePixelRatio))));
  expect(sig.white / sig.total).toBeGreaterThan(0.5);
  expect(sig.dark / sig.total).toBeGreaterThan(0.005);
});

test('2+3. every tool paints and each result is distinct', async ({ page }) => {
  const results: Record<string, Signature> = {};
  // Seven separate fresh pages so each tool paints on a clean, known-blank area.
  const pages = [
    'animals-01',
    'animals-02',
    'animals-03',
    'animals-04',
    'animals-05',
    'animals-06',
    'animals-07',
  ];
  for (const [i, tool] of TOOLS.entries()) {
    await openPage(page, 'animals', pages[i]!);
    const [r] = await findBlankRects(page, 1, 240, 100);
    expect(r, `blank area on ${pages[i]}`).toBeTruthy();
    await page.getByTestId(`tool-${tool}`).click();
    await expect(page.getByTestId(`tool-${tool}`)).toHaveAttribute('aria-pressed', 'true');
    await snap(page, `before-${tool}`);
    const cy = r!.y + r!.h / 2;
    if (tool === 'bucket') {
      await tap(page, { x: r!.x + r!.w / 2, y: cy });
    } else {
      await stroke(page, [
        { x: r!.x + 30, y: cy },
        { x: r!.x + r!.w / 2, y: cy - 10 },
        { x: r!.x + r!.w - 30, y: cy },
      ]);
    }
    // Wait for the committed render, then measure inside the stroke area.
    await expect
      .poll(async () => (await changeSignature(page, `before-${tool}`, r!)).changed)
      .toBeGreaterThan(200);
    results[tool] = await changeSignature(page, `before-${tool}`, r!);
    // Sanity: the pixel under the middle of the gesture is no longer white.
    const mid = await pixelAt(page, { x: r!.x + r!.w / 2, y: cy - 5 });
    if (tool !== 'spray') expect(mid.slice(0, 3)).not.toEqual([255, 255, 255]);
  }
  test.info().annotations.push({ type: 'signatures', description: JSON.stringify(results) });

  const differs = (a: Signature, b: Signature) => {
    const countRatio = Math.max(a.changed, b.changed) / Math.max(1, Math.min(a.changed, b.changed));
    const meanDist = Math.hypot(
      a.mean[0] - b.mean[0],
      a.mean[1] - b.mean[1],
      a.mean[2] - b.mean[2],
    );
    const varRatio =
      (Math.max(a.variance, b.variance) + 1) / (Math.min(a.variance, b.variance) + 1);
    const distinctRatio =
      Math.max(a.distinct, b.distinct) / Math.max(1, Math.min(a.distinct, b.distinct));
    return countRatio > 1.2 || meanDist > 12 || varRatio > 1.5 || distinctRatio > 1.5;
  };
  for (let i = 0; i < TOOLS.length; i++)
    for (let j = i + 1; j < TOOLS.length; j++) {
      const a = TOOLS[i]!;
      const b = TOOLS[j]!;
      expect(differs(results[a]!, results[b]!), `${a} vs ${b}`).toBe(true);
    }
});
