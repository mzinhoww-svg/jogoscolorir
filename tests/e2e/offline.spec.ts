import { expect, test } from '@playwright/test';
import { ptBR } from '../../src/i18n/pt-BR';
import {
  changedSince,
  findBlankRects,
  openPage,
  readArtwork,
  snap,
  stroke,
  waitReady,
} from './helpers';

test('10. reopen and paint offline after the app is fully cached', async ({ page, context }) => {
  await page.goto('/');
  await page.evaluate(() => navigator.serviceWorker.ready.then(() => undefined));
  if (!(await page.evaluate(() => !!navigator.serviceWorker.controller))) await page.reload();
  await expect.poll(() => page.evaluate(() => !!navigator.serviceWorker.controller)).toBe(true);
  // Visit pages while online.
  await openPage(page, 'ocean', 'ocean-01');

  await context.setOffline(true);
  expect(await page.evaluate(() => navigator.onLine)).toBe(false);
  await page.goto('/');
  await page.reload();
  await expect(page.getByTestId('play')).toBeVisible();
  await page.getByTestId('play').click();
  await page.getByTestId('theme-ocean').click();
  await page.getByTestId('page-ocean-02').click();
  await waitReady(page);

  const [r] = await findBlankRects(page, 1, 220, 80);
  await snap(page, 'before');
  const cy = r!.y + r!.h / 2;
  await stroke(page, [
    { x: r!.x + 20, y: cy },
    { x: r!.x + r!.w - 20, y: cy },
  ]);
  await expect.poll(() => changedSince(page, 'before', r!)).toBeGreaterThan(500);
  const status = page.getByTestId('save-status');
  await expect(status).toHaveAttribute('data-status', 'saved');
  await expect(status).toHaveText(ptBR['save.saved']);
  await expect(page.getByText(ptBR['save.failed'])).toHaveCount(0);
  expect(await readArtwork(page, 'ocean-02')).toMatchObject({ strokes: 1 });
  await context.setOffline(false);
});
