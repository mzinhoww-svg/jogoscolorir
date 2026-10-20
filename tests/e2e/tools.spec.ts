import { expect, test } from '@playwright/test';
import { toolWidth } from '../../src/engine/tools';
import {
  analyzeStroke,
  changeSignature,
  changedSince,
  findBlankRects,
  frames,
  type Rect,
  type StrokeAnalysis,
  openPage,
  snap,
  stroke,
  tap,
  type Signature,
} from './helpers';

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
  // One page for all tools: seven outline-free areas on the same drawing (fair comparison).
  let rects: Rect[] = [];
  let pageId = '';
  for (let n = 1; n <= 15 && rects.length < 7; n++) {
    pageId = `animals-${String(n).padStart(2, '0')}`;
    await openPage(page, 'animals', pageId);
    rects = await findBlankRects(page, 7, 240, 100);
  }
  expect(rects.length, 'a page with seven blank areas').toBe(7);
  const RED = '#E8423F'; // default colour
  const results: Record<string, Signature> = {};
  const shapes: Record<string, StrokeAnalysis> = {};
  // Bucket last: it floods the background region, which may contain the other strokes.
  const order = ['marker', 'pencil', 'brush', 'spray', 'shine', 'pattern', 'bucket'] as const;
  let bucketTotal = 0;
  for (const [i, tool] of order.entries()) {
    const r = rects[i]!;
    await page.getByTestId(`tool-${tool}`).click();
    await expect(page.getByTestId(`tool-${tool}`)).toHaveAttribute('aria-pressed', 'true');
    if (tool === 'shine') await page.getByTestId('shine-rainbow').click();
    if (tool === 'pattern') await page.getByTestId('pattern-stripes').click();
    await snap(page, `before-${tool}`);
    const cy = r.y + r.h / 2;
    if (tool === 'bucket') {
      await tap(page, { x: r.x + r.w / 2, y: cy });
    } else
      await stroke(page, [
        { x: r.x + 20, y: cy },
        { x: r.x + r.w - 20, y: cy },
      ]);
    await expect
      .poll(async () => (await changeSignature(page, `before-${tool}`, r)).changed, {
        message: `${tool} on ${pageId} at ${JSON.stringify(r)}`,
      })
      .toBeGreaterThan(200);
    await frames(page);
    results[tool] = await changeSignature(page, `before-${tool}`, r);
    if (tool === 'bucket') bucketTotal = await changedSince(page, `before-${tool}`);
    else {
      const w = toolWidth(tool, 'm');
      shapes[tool] = await analyzeStroke(page, `before-${tool}`, r, cy, {
        color: RED,
        bandHalf: (w / 2) * 0.7,
        coreHalf: w / 4,
      });
    }
  }
  test.info().annotations.push({
    type: 'signatures',
    description: JSON.stringify({ results, shapes, bucketTotal }),
  });

  const { marker, pencil, brush, spray, shine, pattern } = shapes as Record<string, StrokeAnalysis>;
  // Marker: solid single colour, full coverage along the stroke.
  expect(marker!.coreVariance).toBeLessThan(10);
  expect(marker!.bandCoverage).toBeGreaterThan(0.97);
  expect(marker!.components).toBe(1);
  expect(marker!.alternations).toBeLessThanOrEqual(1);
  // Pencil: thinner and grainy.
  expect(pencil!.width).toBeLessThan(marker!.width * 0.7);
  expect(pencil!.coreVariance).toBeGreaterThan(marker!.coreVariance + 300);
  // Brush: soft, blended edges.
  expect(brush!.blended).toBeGreaterThan(marker!.blended * 2);
  expect(brush!.blended).toBeGreaterThan(0.3);
  // Bucket: fills the whole region.
  expect(bucketTotal).toBeGreaterThanOrEqual(5 * results['marker']!.changed);
  expect(results['bucket']!.variance).toBeLessThan(5);
  // Spray: gaps and scattered dots.
  expect(spray!.bandCoverage).toBeLessThan(0.7);
  expect(spray!.components).toBeGreaterThan(10);
  // Shine: several hues (gradient) plus near-white sparkles.
  expect(shine!.hueBins).toBeGreaterThanOrEqual(3);
  expect(shine!.sparkles).toBeGreaterThan(5);
  expect(marker!.sparkles).toBe(0);
  expect(brush!.sparkles).toBe(0);
  // Pattern: two clearly different colours alternating along the stroke.
  expect(pattern!.alternations).toBeGreaterThanOrEqual(4);
  expect(pattern!.clusterDist).toBeGreaterThan(80);

  // Pairwise: each pair differs in at least two independent metrics.
  const metrics = (t: (typeof order)[number]) => {
    const sg = results[t]!;
    const sh = shapes[t];
    return {
      count: t === 'bucket' ? bucketTotal : sg.changed,
      mean: sg.mean,
      variance: sg.variance,
      distinct: sg.distinct,
      coverage: sh ? sh.bandCoverage : 1,
      components: sh ? sh.components : 1,
    };
  };
  const ratio = (a: number, b: number) => (Math.max(a, b) + 1) / (Math.min(a, b) + 1);
  for (let i = 0; i < order.length; i++)
    for (let j = i + 1; j < order.length; j++) {
      const a = metrics(order[i]!);
      const b = metrics(order[j]!);
      const diffs = [
        ratio(a.count, b.count) > 1.2,
        Math.hypot(a.mean[0] - b.mean[0], a.mean[1] - b.mean[1], a.mean[2] - b.mean[2]) > 12,
        ratio(a.variance, b.variance) > 1.5,
        ratio(a.distinct, b.distinct) > 1.5,
        Math.abs(a.coverage - b.coverage) > 0.15,
        ratio(a.components, b.components) > 2,
      ].filter(Boolean).length;
      expect(
        diffs,
        `${order[i]} vs ${order[j]}: ${JSON.stringify({ a, b })}`,
      ).toBeGreaterThanOrEqual(2);
    }
});
