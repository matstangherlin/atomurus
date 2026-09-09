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

test('Home, calculators, settings and table chrome load UI V2; element pages stay legacy', async ({ page }) => {
  await page.goto('/dev/ui');
  await page.locator('[data-ui-theme="dark"]').click();
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark');
  await expect.poll(async () => page.locator('html').evaluate((el) => getComputedStyle(el).backgroundColor))
    .toMatch(/rgb\(\s*14,\s*13,\s*12\s*\)/);

  await page.goto('/index.html');
  await expect(page.locator('.ps-shell')).toBeVisible();
  const homeUi = await page.evaluate(() =>
    [...document.styleSheets].some((sheet) => (sheet.href || '').includes('/assets/ui/'))
  );
  expect(homeUi).toBe(true);

  await page.goto('/calculators.html');
  const calcUi = await page.evaluate(() =>
    [...document.styleSheets].some((sheet) => (sheet.href || '').includes('/assets/ui/'))
  );
  expect(calcUi).toBe(true);

  await page.goto('/config.html');
  const configUi = await page.evaluate(() =>
    [...document.styleSheets].some((sheet) => (sheet.href || '').includes('/assets/ui/'))
  );
  expect(configUi).toBe(true);

  await page.goto('/periodic-table.html');
  const tableUi = await page.evaluate(() =>
    [...document.styleSheets].some((sheet) => (sheet.href || '').includes('/assets/ui/'))
  );
  expect(tableUi).toBe(true);

  await page.goto('/viewer/atomic-models.html');
  const viewerUi = await page.evaluate(() =>
    [...document.styleSheets].some((sheet) => (sheet.href || '').includes('/assets/ui/'))
  );
  expect(viewerUi).toBe(true);

  await page.goto('/periodic-table/hydrogenium.html');
  const elementUi = await page.evaluate(() =>
    [...document.styleSheets].some((sheet) => (sheet.href || '').includes('/assets/ui/'))
  );
  expect(elementUi).toBe(false);
});

test('key pages emit shared chrome in source HTML', async ({ request }) => {
  const pages = [
    '/index.html',
    '/login.html',
    '/pricing.html',
    '/about.html',
    '/calculators.html',
    '/config.html',
    '/periodic-table.html',
    '/viewer/atomic-models.html'
  ];
  for (const url of pages) {
    const text = await (await request.get(url)).text();
    expect(text, url).toContain('id="ps-shell"');
  }
  for (const url of ['/periodic-table/hydrogenium.html']) {
    const text = await (await request.get(url)).text();
    expect(text, url).not.toContain('assets/ui/index.css');
  }
  for (const url of ['/index.html', '/login.html', '/pricing.html', '/about.html', '/contact.html', '/privacy.html', '/terms.html', '/404.html', '/explore.html', '/calculators.html', '/config.html', '/periodic-table.html', '/viewer/atomic-models.html', '/viewer/molecules.html', '/viewer/allotropes.html', '/viewer/isomerism.html']) {
    const text = await (await request.get(url)).text();
    expect(text, url).toContain('assets/ui/index.css');
  }
  const explore = await (await request.get('/explore.html')).text();
  expect(explore).toContain('assets/layouts/explore.css');
  expect(explore).toContain('id="ex-search-input"');
  const calculators = await (await request.get('/calculators.html')).text();
  expect(calculators).toContain('assets/layouts/calculators.css');
  expect(calculators).toContain('data-target="molar"');
  const config = await (await request.get('/config.html')).text();
  expect(config).toContain('assets/layouts/config.css');
  expect(config).toContain('id="lang-select"');
  expect(config).toContain('settings-toggle');
  const article = await (await request.get('/explore/what-is-an-atom.html')).text();
  expect(article).toContain('assets/ui/index.css');
  expect(article).toContain('assets/layouts/article.css');
  const home = await (await request.get('/index.html')).text();
  expect(home).toContain('assets/layouts/home.css');
  expect(home).toContain('assets/product-catalog.js');
  expect(home).not.toMatch(/5 instruments|5 Calculators/);
  expect(home).not.toMatch(/html\.lang-pt-pending\s*\[data-i18n\]/);
  const pricing = await (await request.get('/pricing.html')).text();
  expect(pricing).not.toContain('app-workspace.css');
  expect(pricing).toContain('assets/layouts/pricing.css');
  expect(pricing).not.toMatch(/does not offer user accounts|there is no login/);
  const terms = await (await request.get('/terms.html')).text();
  expect(terms).not.toMatch(/does not offer user accounts/);
  const privacy = await (await request.get('/privacy.html')).text();
  expect(privacy).not.toMatch(/there is no login|we do not run a user database/);
  const table = await (await request.get('/periodic-table.html')).text();
  expect(table).toMatch(/data-i18n="common\.brandTag">chemistry lab/);
  expect(table).toContain('assets/layouts/periodic-table.css');
  expect(table).toContain('id="ptable"');
  const atomic = await (await request.get('/viewer/atomic-models.html')).text();
  expect(atomic).toContain('assets/layouts/viewer.css');
  expect(atomic).toContain('data-pro-lab-tool="atomic"');
  expect(atomic).toContain('id="viewer3d"');
  const molecules = await (await request.get('/viewer/molecules.html')).text();
  expect(molecules).toContain('assets/layouts/viewer.css');
  expect(molecules).toContain('id="viewer3d"');
  const login = await (await request.get('/login.html')).text();
  expect(login).toMatch(/lc-topnav-cta"[^>]*periodic-table/);
  expect(login).toContain('Open lab');
  expect(login).toContain('assets/ui/index.css');
  expect(login).toContain('assets/layouts/auth.css');
  expect(login).not.toMatch(/auth\.access|secure HttpOnly cookie|managed authentication|secure account flow/);
  const app = await (await request.get('/app.html')).text();
  expect(app).not.toContain('id="ps-shell"');
  expect(app).not.toContain('public-shell.css');
  expect(app).toContain('id="ws-search-q"');
  expect(app).toContain('id="ws-userchip"');
});
