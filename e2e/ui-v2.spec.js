const { test, expect } = require('@playwright/test');

test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => {
    localStorage.setItem('atomurus-cookie-consent', 'rejected');
    localStorage.setItem('atomurus-lang', 'en');
    localStorage.setItem('atomurus-theme', 'light');
  });
});

test('UI V2 gallery: buttons, focus-visible, disabled, forms, dialog, mobile', async ({ page }) => {
  await page.goto('/dev/ui');
  await expect(page.locator('.ui-display')).toBeVisible();
  await expect(page.locator('.ui-brand-name')).toHaveCSS('font-family', /Instrument Serif/i);

  const primary = page.locator('#ui-buttons .ui-btn-primary').first();
  const accent = page.locator('#ui-buttons .ui-btn-accent').first();
  const disabled = page.locator('#ui-buttons .ui-btn-primary[disabled]').first();

  await expect.poll(async () => primary.evaluate((el) => getComputedStyle(el).backgroundColor))
    .toMatch(/rgb\(\s*20,\s*18,\s*14\s*\)/);
  await expect.poll(async () => accent.evaluate((el) => getComputedStyle(el).backgroundColor))
    .toMatch(/rgb\(\s*30,\s*106,\s*80\s*\)/);
  await expect.poll(async () => disabled.evaluate((el) => Number(getComputedStyle(el).opacity)))
    .toBeLessThan(0.7);

  await primary.hover();
  const hovered = await primary.evaluate((el) => getComputedStyle(el).backgroundColor);
  expect(hovered).not.toBe('rgba(0, 0, 0, 0)');

  await page.locator('.ui-skip').focus();
  await expect(page.locator('.ui-skip')).toBeFocused();
  await page.keyboard.press('Tab');
  await expect.poll(async () => page.evaluate(() => {
    const el = document.activeElement;
    if (!el) return '';
    return getComputedStyle(el).outlineStyle;
  })).not.toBe('none');

  await page.locator('#ui-demo-form button[type="submit"]').click();
  await expect(page.locator('#ui-demo-email-error')).toBeVisible();
  await expect(page.locator('#ui-demo-email')).toHaveAttribute('aria-invalid', 'true');

  await page.locator('[data-password-toggle="ui-demo-password"]').click();
  await expect(page.locator('#ui-demo-password')).toHaveAttribute('type', 'text');

  await page.locator('#ui-dialog-open').click();
  await expect(page.locator('#ui-dialog-host.ui-dialog-host.is-open')).toBeVisible();
  await page.keyboard.press('Escape');
  await expect(page.locator('#ui-dialog-host.is-open')).toHaveCount(0);

  const darkInput = page.locator('#ui-dark-input');
  await expect.poll(async () => darkInput.evaluate((el) => getComputedStyle(el).backgroundColor))
    .not.toMatch(/rgb\(\s*242,\s*239,\s*231\s*\)/);

  await page.setViewportSize({ width: 390, height: 844 });
  const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
  expect(overflow).toBeLessThanOrEqual(1);
});

test('UI V2 gallery dark theme and production pages stay on legacy CSS', async ({ page }) => {
  await page.goto('/dev/ui');
  await page.locator('[data-ui-theme="dark"]').click();
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark');
  await expect.poll(async () => page.locator('html').evaluate((el) => getComputedStyle(el).backgroundColor))
    .toMatch(/rgb\(\s*14,\s*13,\s*12\s*\)/);

  await page.goto('/index.html');
  await expect(page.locator('.ps-shell')).toBeVisible();
  const loadedUi = await page.evaluate(() =>
    [...document.styleSheets].some((sheet) => (sheet.href || '').includes('/assets/ui/'))
  );
  expect(loadedUi).toBe(false);
});

test('key pages emit shared chrome in source HTML', async ({ request }) => {
  const pages = [
    '/index.html',
    '/login.html',
    '/pricing.html',
    '/about.html',
    '/calculators.html',
    '/periodic-table.html'
  ];
  for (const url of pages) {
    const text = await (await request.get(url)).text();
    expect(text, url).toContain('id="ps-shell"');
    expect(text, url).not.toContain('assets/ui/index.css');
  }
  const table = await (await request.get('/periodic-table.html')).text();
  expect(table).toMatch(/data-i18n="common\.brandTag">chemistry lab/);
  const login = await (await request.get('/login.html')).text();
  expect(login).toMatch(/lc-topnav-cta"[^>]*periodic-table/);
  expect(login).toContain('Open lab');
  const app = await (await request.get('/app.html')).text();
  expect(app).not.toContain('id="ps-shell"');
  expect(app).not.toContain('public-shell.css');
  expect(app).toContain('id="ws-search-q"');
  expect(app).toContain('id="ws-userchip"');
});
