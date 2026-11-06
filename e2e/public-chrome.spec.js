const { test, expect } = require('@playwright/test');
const path = require('node:path');
const fs = require('node:fs');

/* Remake 2026 public chrome: one sticky top navigation, Figtree everywhere,
   warm paper surfaces, green accent, dark "instrument" panels, shared footer. */

const SHOTS = path.resolve(__dirname, '../test-results/e2e-screenshots');
const GREEN = /rgb\(\s*30,\s*106,\s*80\s*\)/;
const DARK = /rgb\(\s*20,\s*18,\s*14\s*\)/;

function saveShot(page, name) {
  fs.mkdirSync(SHOTS, { recursive: true });
  return page.screenshot({ path: path.join(SHOTS, `${name}.png`), fullPage: true });
}

const css = (locator, prop) => locator.evaluate((el, p) => getComputedStyle(el)[p], prop);

async function expectRemakeChrome(page, section) {
  await expect(page.locator('[data-rm-header]')).toBeVisible();
  await expect(page.locator('[data-rm-footer]')).toBeVisible();
  await expect(page.locator('#ws-sidebar, [data-atomurus-sidebar]')).toHaveCount(0);
  await expect(page.locator('.data-strip').first()).toBeHidden();
  await expect.poll(() => css(page.locator('body'), 'fontFamily')).toMatch(/Figtree/);
  const active = page.locator('.rm-nav > [data-rm-section].is-active');
  if (section) await expect(active).toHaveAttribute('data-rm-section', section);
  else await expect(active).toHaveCount(0);
}

test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => {
    localStorage.setItem('atomurus-cookie-consent', 'rejected');
    localStorage.setItem('atomurus-lang', 'en');
    localStorage.setItem('atomurus-theme', 'light');
  });
});

test('home: hero search, interactive mini table, tools and plans', async ({ page }) => {
  await page.goto('/index.html');
  await expectRemakeChrome(page, null);
  const title = page.locator('.rm-hero-title');
  await expect(title).toBeVisible();
  expect(await css(title, 'fontWeight')).toBe('700');
  await expect(page.locator('#quick-search')).toBeVisible();
  await expect(page.locator('[data-rm-mini] .rm-tile')).toHaveCount(118);
  await expect(page.locator('[data-sel-name]')).toHaveText('Carbon');
  await page.locator('.rm-tile[data-z="79"]').click();
  await expect(page.locator('.rm-tile[data-z="79"]')).toHaveAttribute('aria-current', 'true');
  await page.mouse.move(5, 5);
  await expect(page.locator('[data-sel-name]')).toHaveText('Gold');
  await expect(page.locator('[data-sel-link]')).toHaveAttribute('href', '/periodic-table/aurum.html');
  await page.locator('[data-rm-cats] .rm-chip[data-cat="nob"]').click();
  await expect(page.locator('.rm-tile.is-dim')).toHaveCount(118 - 7);
  await expect(page.locator('.rm-tools-grid > article')).toHaveCount(3);
  expect(await css(page.locator('.rm-tool-molar'), 'backgroundColor')).toMatch(DARK);
  await expect(page.locator('.rm-plan')).toHaveCount(2);
  expect(await css(page.locator('.rm-cta'), 'backgroundColor')).toMatch(GREEN);
  await expect(page.locator('.rm-cta')).toContainText(/Create free account/i);
  await saveShot(page, 'desktop-public-home');
});

test('table, calculators, explore, viewer, element, login and pricing share the remake chrome', async ({ page }) => {
  await page.goto('/periodic-table.html');
  await expectRemakeChrome(page, 'periodic');
  await expect(page.locator('h1.ph-title')).toHaveText(/Periodic table/i);
  expect(await css(page.locator('h1.ph-title'), 'fontWeight')).toBe('700');
  expect(await css(page.locator('.pt-tab.active'), 'borderBottomColor')).toMatch(GREEN);
  await expect(page.locator('#search-input')).toBeVisible();
  await expect(page.locator('.el[data-z="1"]')).toBeVisible({ timeout: 15_000 });
  expect(await css(page.locator('.el[data-z="1"]'), 'backgroundColor')).toBe('rgb(207, 228, 213)');
  await page.locator('.legend-item[data-cat="nonmetal"]').click();
  await expect(page.locator('.legend-item.active-filter')).toHaveCount(1);
  await saveShot(page, 'desktop-public-table');

  await page.goto('/calculators.html');
  await expectRemakeChrome(page, 'calculators');
  await expect(page.locator('.calc-menu-item[data-target="molar"]')).toBeVisible();
  await expect(page.locator('.calc-menu-item[data-target="scientific"]')).toBeVisible();
  await expect(page.locator('.calc-menu-item[data-target="ideal"] .calc-menu-title')).toHaveText(/Ideal Gas/);
  await expect(page.locator('#mm-result-body')).not.toContainText('Â');
  await page.locator('.calc-chip[data-mm-example="H2O"]').click();
  await page.locator('.calc-btn-run').first().click();
  await expect(page.locator('#mm-result-body')).toContainText(/18\.015/);
  await expect(page.locator('#mm-result-body')).toContainText(/g\s*·\s*mol/);
  expect(await css(page.locator('#mm-result'), 'backgroundColor')).toMatch(DARK);
  await expect(page.locator('#mm-result-meta')).toContainText(/element/i);
  await page.locator('.calc-menu-item[data-target="scientific"]').click();
  await expect(page.locator('.scc-device')).toBeVisible();
  await expect(page.locator('#lab-tool-gate-scientific')).toHaveCount(0);
  await saveShot(page, 'desktop-public-calculators');

  await page.goto('/calculators.html?formula=C6H12O6#molar');
  await expect(page.locator('#mm-input')).toHaveValue('C6H12O6');
  await expect(page.locator('#mm-result-body')).toContainText(/180\.1/);

  await page.goto('/explore.html');
  await expectRemakeChrome(page, 'explore');
  await expect(page.locator('.rm-page-title')).toHaveText(/Articles/);
  await expect(page.locator('.rm-feature')).toHaveAttribute('href', /what-is-an-atom/);
  await expect(page.locator('[data-rm-articles] .rm-art-card')).toHaveCount(16);
  await page.locator('[data-rm-filter] [data-filter="h"]').click();
  await expect(page.locator('[data-rm-articles] .rm-art-card:visible')).toHaveCount(6);
  await expect(page.locator('[data-rm-articles] .rm-art-card:visible').first()).toContainText(/History of Chemistry|Marie Curie|Chernobyl|Bhopal/);
  await saveShot(page, 'desktop-public-explore');

  await page.goto('/viewer/atomic-models.html');
  await expectRemakeChrome(page, 'models');
  await expect(page.locator('.vz-tab.active')).toContainText(/Atomic Models/i);
  await expect(page.locator('.vz-num').first()).toBeHidden();
  expect(await css(page.locator('.vz-tab.active'), 'borderBottomColor')).toMatch(GREEN);
  expect(await css(page.locator('.viewer > .canvas-wrap'), 'backgroundColor')).toMatch(DARK);
  await expect(page.locator('.av-substrip').first()).toBeHidden();
  await saveShot(page, 'desktop-public-viewer');

  await page.goto('/periodic-table/hydrogenium.html');
  await expectRemakeChrome(page, 'periodic');
  await expect(page.locator('h1.lc-el-name')).toBeVisible();
  await expect(page.locator('.rm-el-tile .rm-el-tile-sym')).toHaveText('H');
  await expect(page.locator('.rm-el-facts .rm-dl > div').first()).toBeVisible();
  await expect(page.locator('.rm-pager-link')).toHaveCount(1);
  await saveShot(page, 'desktop-public-element');

  await page.goto('/login.html');
  await expect(page.locator('.rm-header--minimal')).toBeVisible();
  await expect(page.locator('[data-atomurus-account], .rm-nav')).toHaveCount(0);
  await expect(page.locator('#auth-email')).toBeVisible();
  expect(parseFloat(await css(page.locator('#auth-email'), 'borderRadius'))).toBeGreaterThanOrEqual(10);
  await expect.poll(() => css(page.locator('#auth-login-submit'), 'backgroundColor')).toMatch(GREEN);
  expect(await css(page.locator('.auth-rail'), 'backgroundColor')).toMatch(DARK);
  await expect(page.locator('.auth-shell')).not.toContainText(/auth\.access|HttpOnly|managed authentication|secure account flow/i);
  await saveShot(page, 'desktop-public-login');

  await page.goto('/pricing.html');
  await expectRemakeChrome(page, 'plans');
  await expect(page.locator('.lc-doc-title')).toBeVisible();
  await expect(page.locator('.lc-doc-kicker .pill')).toBeHidden();
  await expect(page.locator('.rm-cta')).toHaveAttribute('href', /signup/, { timeout: 15_000 });
  await expect(page.locator('.rm-cta')).toContainText(/Create free account|Criar conta/i);
  await saveShot(page, 'desktop-public-pricing');
});

test('settings, compare, trends, docs, articles and isomerism keep the remake pattern', async ({ page }) => {
  await page.goto('/config.html');
  await expectRemakeChrome(page, null);
  expect(await css(page.locator('.settings-toggle.active').first(), 'backgroundColor')).toMatch(GREEN);
  await saveShot(page, 'desktop-public-config');

  await page.goto('/periodic-table/compare.html');
  await expectRemakeChrome(page, 'periodic');
  await expect(page.locator('.pt-tab.active')).toBeVisible();
  await expect(page.locator('[data-pro-canonical="element-compare"]')).toBeVisible();
  await expect(page.locator('[data-i18n="ptable.cmpOpenAdvanced"]')).toBeVisible();
  await saveShot(page, 'desktop-public-compare');

  await page.goto('/periodic-table/trends.html');
  await expectRemakeChrome(page, 'periodic');
  await expect(page.locator('#trend-auto')).toBeVisible();
  await saveShot(page, 'desktop-public-trends');

  await page.goto('/about.html');
  await expectRemakeChrome(page, null);
  await expect(page.locator('.lc-doc-title')).toBeVisible();
  expect(await css(page.locator('.lc-doc-title'), 'fontWeight')).toBe('700');
  await expect(page.locator('.h-no').first()).toBeHidden();
  await saveShot(page, 'desktop-public-about');

  await page.goto('/explore/what-is-an-atom.html');
  await expectRemakeChrome(page, 'explore');
  await expect(page.locator('.art-title')).toBeVisible();
  const grid = await page.evaluate(() => {
    const aside = document.querySelector('.art-aside').getBoundingClientRect();
    const body = document.querySelector('.art-body').getBoundingClientRect();
    return { asideRight: aside.right, bodyLeft: body.left };
  });
  expect(grid.asideRight, 'table of contents sits left of the article').toBeLessThanOrEqual(grid.bodyLeft);
  await saveShot(page, 'desktop-public-article');

  await page.goto('/viewer/isomerism.html');
  await expectRemakeChrome(page, 'models');
  await expect(page.locator('.vz-tab').first()).toBeVisible();
  await saveShot(page, 'desktop-public-isomerism');

  await page.goto('/viewer/isomerism/constitutional/function.html');
  await expectRemakeChrome(page, 'models');
  await expect(page.locator('.sub-tab.active')).toBeVisible();
  await expect(page.locator('.sub-num').first()).toBeHidden();
  await saveShot(page, 'desktop-public-isomerism-function');
});

test('molecules, allotropes and 404 use the list + stage layout and document pattern', async ({ page }) => {
  await page.goto('/viewer/molecules.html');
  await expectRemakeChrome(page, 'models');
  const active = page.locator('.viewer .pill.active').first();
  expect(await css(active, 'backgroundColor')).toBe('rgb(248, 245, 236)');
  expect(await css(active, 'fontWeight')).toBe('600');
  const cols = await page.locator('.viewer').evaluate((el) => getComputedStyle(el).gridTemplateColumns.split(' ').length);
  expect(cols, 'list · stage · info').toBe(3);
  await saveShot(page, 'desktop-public-molecules');

  await page.goto('/viewer/allotropes.html');
  await expectRemakeChrome(page, 'models');
  await expect(page.locator('.viewer .pill.active').first()).toBeVisible();
  await saveShot(page, 'desktop-public-allotropes');

  await page.goto('/404.html');
  await expectRemakeChrome(page, null);
  await expect(page.locator('.lc-doc-title')).toBeVisible();
  await expect(page.locator('.lc-doc-card .lbl').first()).toHaveText(/Periodic Table/);
  await expect(page.locator('.h-no').first()).toBeHidden();
  await saveShot(page, 'desktop-public-404');
});

test('header light / dark switch: visible, in step with the footer, kept on phones and /app', async ({ page }) => {
  await page.goto('/index.html');
  const light = page.locator('.rm-header .rm-theme-opt[data-rm-theme-set="light"]');
  const dark = page.locator('.rm-header .rm-theme-opt[data-rm-theme-set="dark"]');
  await expect(light).toBeVisible();
  await expect(light).toHaveAttribute('aria-pressed', 'true');
  await dark.click();
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark');
  await expect(dark).toHaveAttribute('aria-pressed', 'true');
  await expect(page.locator('[data-rm-theme]')).toHaveText(/Light theme/);
  expect(await page.evaluate(() => localStorage.getItem('atomurus-theme'))).toBe('dark');
  // the footer link moves the header switch too
  await page.locator('[data-rm-theme]').click();
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'light');
  await expect(light).toHaveAttribute('aria-pressed', 'true');

  // phones: next to the menu button, without opening the drawer
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/calculators.html');
  await expect(page.locator('.rm-header .rm-theme-switch')).toBeVisible();
  await page.locator('.rm-header .rm-theme-opt[data-rm-theme-set="dark"]').click();
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark');
  // (beforeEach resets the stored theme on every load, so check the store, not a reload)
  expect(await page.evaluate(() => localStorage.getItem('atomurus-theme'))).toBe('dark');

  // /app has its own top bar with the same switch
  await page.setViewportSize({ width: 1280, height: 800 });
  await page.goto('/app');
  const appLight = page.locator('.ws-topbar .rm-theme-opt[data-rm-theme-set="light"]');
  await expect(appLight).toBeVisible();
  await appLight.click();
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'light');
  await expect(appLight).toHaveAttribute('aria-pressed', 'true');
});

test('footer theme switch and the mobile drawer', async ({ page }) => {
  await page.goto('/index.html');
  await page.locator('[data-rm-theme]').click();
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark');
  await expect(page.locator('[data-rm-theme]')).toHaveText(/Light theme/);
  await saveShot(page, 'desktop-public-home-dark');
  await page.locator('[data-rm-theme]').click();
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'light');

  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/calculators.html');
  const burger = page.locator('[data-rm-burger]');
  await expect(burger).toBeVisible();
  await expect(page.locator('#rm-nav')).toBeHidden();
  await burger.click();
  await expect(page.locator('#rm-nav')).toBeVisible();
  await expect(page.locator('#rm-nav .rm-signin')).toBeVisible();
  await expect(page.locator('#rm-nav .rm-cta')).toBeVisible();
  await saveShot(page, 'mobile-public-calculators-menu');
  await page.locator('#rm-nav [data-rm-section="explore"]').click();
  await expect(page).toHaveURL(/explore/);
});

test('signup and recover keep the forms and the 30-day trial copy', async ({ page }) => {
  await page.goto('/signup');
  await expect(page.locator('#auth-signup-form')).toBeVisible();
  await expect(page.locator('#auth-signup-name')).toHaveValue('');
  await expect(page.locator('#auth-signup-email')).toHaveValue('');
  await expect(page.locator('#auth-signup-name')).not.toHaveAttribute('placeholder', /Matheus|Stangherlin|matheusstan/i);
  await expect(page.locator('#auth-signup-email')).not.toHaveAttribute('placeholder', /@|matheus/i);
  await expect(page.locator('#auth-panel-signup')).toContainText(/30 days/i);
  await expect.poll(() => css(page.locator('#auth-signup-submit'), 'backgroundColor')).toMatch(GREEN);
  await saveShot(page, 'desktop-public-signup');

  await page.goto('/forgot-password');
  await expect(page.locator('#auth-reset-form')).toBeVisible();
  await expect(page.locator('#auth-reset-email')).toBeVisible();
  await saveShot(page, 'desktop-public-recover');

  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/login.html');
  await expect(page.locator('#auth-email')).toBeVisible();
  await saveShot(page, 'mobile-public-login');
});
