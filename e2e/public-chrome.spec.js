const { test, expect } = require('@playwright/test');
const path = require('node:path');
const fs = require('node:fs');

const SHOTS = path.resolve(__dirname, '../test-results/e2e-screenshots');

function saveShot(page, name) {
  fs.mkdirSync(SHOTS, { recursive: true });
  return page.screenshot({ path: path.join(SHOTS, `${name}.png`), fullPage: true });
}

async function fontFamily(locator) {
  return locator.evaluate((el) => getComputedStyle(el).fontFamily);
}

test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => {
    localStorage.setItem('atomurus-cookie-consent', 'rejected');
    localStorage.setItem('atomurus-lang', 'en');
    localStorage.setItem('atomurus-theme', 'light');
  });
});

test('public home uses workspace chrome, not lab-console ticker', async ({ page }) => {
  await page.goto('/index.html');
  await expect(page.locator('.lc-topnav-name')).toBeVisible();
  await expect.poll(() => fontFamily(page.locator('.lc-topnav-name'))).toMatch(/Instrument Serif/i);
  await expect(page.locator('.lc-tn-no').first()).toBeHidden();
  await expect(page.locator('.lc-landing .data-strip, .data-strip').first()).toBeHidden();
  await expect(page.locator('.lc-statusbar')).toBeHidden();

  const ctaBg = await page.locator('.lc-topnav-cta').evaluate((el) => getComputedStyle(el).backgroundColor);
  expect(ctaBg).toMatch(/rgb\(\s*30,\s*106,\s*80\s*\)/);

  await expect(page.locator('.lc-hero-title')).toBeVisible();
  await expect(page.locator('#preview-grid .lc-preview-cell').first()).toBeVisible();
  await expect(page.locator('.lc-mod-card')).toHaveCount(4);
  await saveShot(page, 'desktop-public-home');
});

test('public table, calculators, login and pricing share the new chrome', async ({ page }) => {
  await page.goto('/periodic-table.html');
  await expect(page.locator('.logo-text')).toBeVisible();
  await expect.poll(() => fontFamily(page.locator('.logo-text'))).toMatch(/Instrument Serif/i);
  await expect(page.locator('.nl-no').first()).toBeHidden();
  await expect(page.locator('.data-strip').first()).toBeHidden();
  const topbar = await page.locator('main.main > .topbar').evaluate((el) => {
    const s = getComputedStyle(el);
    return { position: s.position, top: s.top, left: s.left };
  });
  expect(topbar.position).toBe('fixed');
  expect(topbar.top).toBe('0px');
  expect(topbar.left).toBe('0px');
  const logoPos = await page.locator('aside.sidebar > .logo-wrap').evaluate((el) => getComputedStyle(el).position);
  expect(logoPos).toBe('fixed');
  const dlBg = await page.locator('#dl-action-btn').evaluate((el) => getComputedStyle(el).backgroundColor);
  expect(dlBg).toMatch(/rgb\(\s*30,\s*106,\s*80\s*\)/);
  const tabColor = await page.locator('.pt-tab.active').evaluate((el) => getComputedStyle(el).color);
  expect(tabColor).toMatch(/rgb\(\s*30,\s*106,\s*80\s*\)/);
  const tabBg = await page.locator('.pt-tab.active').evaluate((el) => getComputedStyle(el).backgroundColor);
  expect(tabBg).not.toBe('rgb(20, 18, 14)');
  await page.locator('.legend-item[data-cat="nonmetal"]').click();
  const legendColor = await page.locator('.legend-item.active-filter').evaluate((el) => getComputedStyle(el).color);
  expect(legendColor).toMatch(/rgb\(\s*30,\s*106,\s*80\s*\)/);
  const legendBg = await page.locator('.legend-item.active-filter').evaluate((el) => getComputedStyle(el).backgroundColor);
  expect(legendBg).not.toBe('rgb(20, 18, 14)');
  await expect(page.locator('.el[data-z="1"]')).toBeVisible({ timeout: 15_000 });
  await saveShot(page, 'desktop-public-table');

  await page.goto('/calculators.html');
  await expect(page.locator('.data-strip').first()).toBeHidden();
  await expect(page.locator('.calc-menu-item[data-target="molar"]')).toBeVisible();
  await expect(page.locator('.calc-menu-item[data-target="scientific"]')).toBeVisible();
  const idealTitle = page.locator('.calc-menu-item[data-target="ideal"] .calc-menu-title');
  await expect(idealTitle).toHaveText(/Ideal Gas/);
  const idealGrid = await page.locator('.calc-menu-item[data-target="ideal"]').evaluate((el) => getComputedStyle(el).gridTemplateColumns);
  expect(idealGrid.split(/\s+/).filter(Boolean)).toHaveLength(2);
  const titleFits = await idealTitle.evaluate((el) => el.scrollWidth <= el.clientWidth + 1);
  expect(titleFits).toBe(true);
  await expect(page.locator('#mm-result-body')).not.toContainText('Â');
  await page.locator('.calc-chip[data-mm-example="H2O"]').click();
  await page.locator('.calc-btn-run').first().click();
  await expect(page.locator('#mm-result-body')).toContainText(/18\.02/);
  await expect(page.locator('#mm-result-body')).toContainText(/g\s*·\s*mol/);
  const resultHeadBg = await page.locator('#mm-result .calc-result-head').evaluate((el) => getComputedStyle(el).backgroundColor);
  expect(resultHeadBg).not.toBe('rgb(20, 18, 14)');
  await page.locator('.calc-menu-item[data-target="scientific"]').click();
  await expect(page.locator('.scc-device')).toBeVisible();
  const deviceBg = await page.locator('.scc-device').evaluate((el) => getComputedStyle(el).backgroundColor);
  const deviceR = Number((deviceBg.match(/rgb\(\s*(\d+)/) || [0, '0'])[1]);
  expect(deviceR).toBeGreaterThan(180);
  const padOn = await page.locator('.scc-keypad-tab.is-on').evaluate((el) => getComputedStyle(el).backgroundColor);
  expect(padOn).not.toBe('rgb(20, 18, 14)');
  const padColor = await page.locator('.scc-keypad-tab.is-on').evaluate((el) => getComputedStyle(el).color);
  expect(padColor).toMatch(/rgb\(\s*30,\s*106,\s*80\s*\)/);
  await saveShot(page, 'desktop-public-calculators');

  await page.goto('/explore.html');
  await expect(page.locator('.ex-title')).toBeVisible();
  await expect.poll(() => fontFamily(page.locator('.ex-title'))).toMatch(/Instrument Serif/i);
  await expect(page.locator('.ex-title')).toContainText(/explore/i);
  await expect(page.locator('.ex-title')).not.toContainText('Â');
  const pillColor = await page.locator('.ex-pill.active').evaluate((el) => getComputedStyle(el).color);
  expect(pillColor).toMatch(/rgb\(\s*30,\s*106,\s*80\s*\)/);
  const pillBg = await page.locator('.ex-pill.active').evaluate((el) => getComputedStyle(el).backgroundColor);
  expect(pillBg).not.toBe('rgb(20, 18, 14)');
  await expect(page.locator('.data-strip').first()).toBeHidden();
  await saveShot(page, 'desktop-public-explore');

  await page.goto('/viewer/atomic-models.html');
  await expect(page.locator('.vz-tab.active')).toBeVisible();
  await expect(page.locator('.vz-num').first()).toBeHidden();
  await expect(page.locator('.vz-tab.active')).toContainText(/Atomic Models/i);
  await expect(page.locator('.data-strip').first()).toBeHidden();
  await expect(page.locator('.av-substrip').first()).toBeHidden();
  const vcBg = await page.locator('.viewer-controls').first().evaluate((el) => getComputedStyle(el).backgroundColor);
  expect(vcBg).not.toBe('rgba(20, 18, 14, 0.78)');
  await saveShot(page, 'desktop-public-viewer');

  await page.goto('/periodic-table/heatmap.html');
  await expect(page.locator('.pt-tab.active')).toBeVisible();
  const heatTab = await page.locator('.pt-tab.active').evaluate((el) => getComputedStyle(el).color);
  expect(heatTab).toMatch(/rgb\(\s*30,\s*106,\s*80\s*\)/);
  await expect(page.locator('.data-strip').first()).toBeHidden();
  await saveShot(page, 'desktop-public-heatmap');

  await page.goto('/periodic-table/hydrogenium.html');
  await expect(page.locator('.lc-el-name')).toBeVisible();
  await expect.poll(() => fontFamily(page.locator('.lc-el-name'))).toMatch(/Instrument Serif/i);
  await expect(page.locator('.data-strip').first()).toBeHidden();
  await saveShot(page, 'desktop-public-element');

  await page.goto('/login.html');
  await expect(page.locator('.lc-topnav-name')).toBeVisible();
  await expect.poll(() => fontFamily(page.locator('.lc-topnav-name'))).toMatch(/Instrument Serif/i);
  await expect(page.locator('#auth-email')).toBeVisible();
  const inputRadius = await page.locator('#auth-email').evaluate((el) => getComputedStyle(el).borderRadius);
  expect(parseFloat(inputRadius)).toBeGreaterThanOrEqual(10);
  await saveShot(page, 'desktop-public-login');

  await page.goto('/pricing.html');
  await expect(page.locator('.price-card, .lc-doc-title').first()).toBeVisible();
  await expect.poll(() => fontFamily(page.locator('.lc-topnav-name'))).toMatch(/Instrument Serif/i);
  await saveShot(page, 'desktop-public-pricing');
});

test('public home dark mode and mobile keep the workspace chrome', async ({ page }) => {
  await page.goto('/index.html');
  await page.locator('#theme-toggle').click();
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark');
  await expect.poll(() => fontFamily(page.locator('.lc-topnav-name'))).toMatch(/Instrument Serif/i);
  await saveShot(page, 'desktop-public-home-dark');

  await page.setViewportSize({ width: 390, height: 844 });
  await expect(page.locator('.lc-mobile-hamb')).toBeVisible();
  await page.locator('.lc-mobile-hamb').click();
  await expect(page.locator('#lc-mobile-menu.open, .lc-mobile-menu.open')).toBeVisible();
  await expect(page.locator('.lc-mobile-menu-num')).toHaveCount(0);
  await saveShot(page, 'mobile-public-home-menu');
});
