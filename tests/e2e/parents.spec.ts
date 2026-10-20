import { expect, test, type Page } from '@playwright/test';
import type { Dict } from '../../src/i18n/pt-BR';
import { ptBR } from '../../src/i18n/pt-BR';
import { en } from '../../src/i18n/en';
import { es } from '../../src/i18n/es';
import { PREFS_KEY } from './helpers';

/** Read the gate prompt (numbers in words) and compute the answer with the dictionary's num.N table. */
async function gateAnswer(page: Page, dict: Dict = ptBR): Promise<number> {
  const text = (await page.locator('.gate-prompt').textContent()) ?? '';
  const words = new Map<string, number>();
  for (let n = 0; n <= 20; n++) words.set(dict[`num.${n}` as keyof Dict], n);
  const [pre, post] = dict['gate.prompt'].split('{a}') as [string, string];
  const [mid, end] = post.split('{b}') as [string, string];
  expect(text.startsWith(pre) && text.endsWith(end), `prompt "${text}"`).toBe(true);
  const [wa, wb] = text.slice(pre.length, text.length - end.length).split(mid);
  const x = words.get(wa ?? '');
  const y = words.get(wb ?? '');
  expect(x, `word ${wa}`).toBeDefined();
  expect(y, `word ${wb}`).toBeDefined();
  return x! + y!;
}

async function enterGate(page: Page, answer: number): Promise<void> {
  for (const d of String(answer)) await page.getByTestId(`gate-key-${d}`).click();
  await expect(page.getByTestId('gate-input')).toHaveValue(String(answer));
  await page.getByTestId('gate-submit').click();
}

async function readPrefs(page: Page) {
  return page.evaluate((k) => JSON.parse(localStorage.getItem(k) ?? 'null'), PREFS_KEY);
}

test('11. language and audio preferences behind the parental gate', async ({ page }) => {
  await page.goto('/');
  await expect(page.getByText(ptBR['app.tagline'])).toBeVisible();
  await page.getByTestId('nav-parents').click();
  await enterGate(page, await gateAnswer(page));
  await expect(page.getByRole('heading', { name: ptBR['parents.title'] })).toBeVisible();

  await page.getByTestId('lang-en').click();
  await expect(page.getByRole('heading', { name: en['parents.title'] })).toBeVisible();
  await expect(page.getByText(en['settings.music'], { exact: true })).toBeVisible();
  await expect(page.locator('html')).toHaveAttribute('lang', 'en');
  await page.getByTestId('lang-es').click();
  await expect(page.getByRole('heading', { name: es['parents.title'] })).toBeVisible();
  await expect(page.getByRole('heading', { name: en['parents.title'] })).toHaveCount(0);
  expect((await readPrefs(page)).lang).toBe('es');

  const music = page.getByTestId('toggle-music');
  const sfx = page.getByTestId('toggle-sfx');
  await expect(music).toHaveAttribute('aria-checked', 'true');
  await expect(sfx).toHaveAttribute('aria-checked', 'true');
  await music.click();
  await sfx.click();
  await expect(music).toHaveAttribute('aria-checked', 'false');
  await expect(sfx).toHaveAttribute('aria-checked', 'false');
  expect(await readPrefs(page)).toMatchObject({ v: 1, lang: 'es', music: false, sfx: false });

  await page.goto('/');
  await page.reload();
  await expect(page.getByText(es['app.tagline'])).toBeVisible();
  await expect(page.getByTestId('play')).toHaveText(es['home.play']);
  expect(await readPrefs(page)).toMatchObject({ v: 1, lang: 'es', music: false, sfx: false });
  // The gate prompt is now Spanish; answer it with the Spanish number words.
  await page.getByTestId('nav-parents').click();
  await enterGate(page, await gateAnswer(page, es));
  await expect(page.getByTestId('toggle-music')).toHaveAttribute('aria-checked', 'false');
  await expect(page.getByTestId('toggle-sfx')).toHaveAttribute('aria-checked', 'false');
  await page.getByTestId('lang-pt-BR').click();
  await expect(page.getByRole('heading', { name: ptBR['parents.title'] })).toBeVisible();
});

test('12. a wrong parental answer blocks access; three wrong answers lock with a wait message', async ({
  page,
}) => {
  await page.goto('/');
  await page.getByTestId('nav-parents').click();
  for (let i = 0; i < 2; i++) {
    const wrong = ((await gateAnswer(page)) + 1) % 19;
    await enterGate(page, wrong);
    await expect(page.getByTestId('gate-error')).toHaveText(ptBR['gate.wrong']);
    await expect(page.getByTestId('lang-pt-BR')).toHaveCount(0);
    await expect(page.getByTestId('toggle-music')).toHaveCount(0);
    await expect(page.getByRole('heading', { name: ptBR['parents.title'] })).toHaveCount(0);
  }
  await enterGate(page, ((await gateAnswer(page)) + 1) % 19);
  const wait = new RegExp(
    '^' + ptBR['gate.wait'].replace('{s}', '\\d+').replace(/[.?]/g, '\\$&') + '$',
  );
  await expect(page.getByTestId('gate-error')).toHaveText(wait);
  await expect(page.getByTestId('gate-input')).toBeDisabled();
  await expect(page.getByTestId('gate-key-1')).toBeDisabled();
  await expect(page.getByTestId('gate-submit')).toBeDisabled();
  await expect(page.getByTestId('toggle-music')).toHaveCount(0);
});
