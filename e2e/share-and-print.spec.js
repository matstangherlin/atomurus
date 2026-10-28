// Prompt 26 — B01 (share with state, keyboard menu) and B02 (print stylesheet).
const { test, expect } = require('@playwright/test');
const { isolate } = require('./pt-pages-helpers');

test('a shared ?formula= opens the molar mass already calculated, in EN and PT', async ({ context, page }) => {
  await isolate(context, 'en');
  await page.goto('/calculators.html?formula=H2SO4');
  await expect(page.locator('#mm-input')).toHaveValue('H2SO4');
  await expect(page.locator('#mm-result-body .calc-result-v.big')).toContainText('98.07');

  const pt = await context.newPage();
  await pt.addInitScript(() => { try { localStorage.setItem('atomurus-lang', 'pt'); } catch (_err) {} });
  await pt.goto('/calculators.pt.html?formula=H2SO4');
  await expect(pt.locator('#mm-result-body .calc-result-v.big')).toContainText('98,07');
});

test('the default formula does not touch the URL; a calculation writes ?formula= and the share links carry it', async ({ context, page }) => {
  await isolate(context, 'en');
  await page.goto('/calculators.html?ref=test');
  await expect(page.locator('#mm-result-body .calc-result-v.big')).toBeVisible();
  expect(new URL(page.url()).searchParams.get('formula')).toBeNull();
  const historyLength = await page.evaluate(() => history.length);

  await page.locator('#mm-input').fill('NaCl');
  await page.locator('#tab-molar .calc-btn-run').click();
  await expect(page.locator('#mm-result-body .calc-result-v.big')).toContainText('58.44');
  const url = new URL(page.url());
  expect(url.searchParams.get('formula')).toBe('NaCl');
  expect(url.searchParams.get('ref')).toBe('test');
  expect(await page.evaluate(() => history.length)).toBe(historyLength);

  const host = page.locator('.share-host').first();
  await host.hover();
  const whatsapp = await host.locator('a[data-channel="whatsapp"]').getAttribute('href');
  const shared = decodeURIComponent(whatsapp);
  expect(shared).toContain('formula=NaCl');
  expect(shared).toContain('utm_source=whatsapp');
  const telegram = decodeURIComponent(await host.locator('a[data-channel="telegram"]').getAttribute('href'));
  expect(telegram).toContain('formula=NaCl');
  expect(telegram).toContain('utm_source=telegram');
});

test('an unsafe ?formula= is ignored', async ({ context, page }) => {
  await isolate(context, 'en');
  await page.goto('/calculators.html?formula=' + encodeURIComponent('<img src=x onerror=alert(1)>'));
  await expect(page.locator('#mm-input')).toHaveValue('H2SO4');
  await expect(page.locator('#mm-result-body img')).toHaveCount(0);
});

test('share menu: keyboard opens it, arrows move, Esc closes it and focus returns', async ({ context, page }) => {
  await isolate(context, 'en');
  await page.goto('/calculators.html');
  const host = page.locator('.share-host').first();
  const menu = host.locator('.share-menu');
  await host.focus();
  await expect(host).toHaveAttribute('aria-expanded', 'true');
  await expect(menu).toHaveCSS('visibility', 'visible');

  await page.keyboard.press('Escape');
  await expect(host).toHaveAttribute('aria-expanded', 'false');
  await expect(host).toBeFocused();
  await expect.poll(() => menu.evaluate((el) => getComputedStyle(el).visibility)).toBe('hidden');

  await page.keyboard.press('Enter');
  await expect(host).toHaveAttribute('aria-expanded', 'true');
  await expect(host.locator('[role="menuitem"]').first()).toBeFocused();
  await page.keyboard.press('ArrowDown');
  await expect(host.locator('[role="menuitem"]').nth(1)).toBeFocused();
  await page.keyboard.press('ArrowUp');
  await page.keyboard.press('ArrowUp');
  await expect(host.locator('[role="menuitem"]').last()).toBeFocused();
  await page.keyboard.press('Escape');
  await expect(host).toBeFocused();
  await expect(host).toHaveAttribute('aria-expanded', 'false');
});
