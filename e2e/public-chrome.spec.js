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
  await expect(page.locator('.lc-landing .data-strip')).toBeHidden();
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
  const stripBg = await page.locator('.data-strip').evaluate((el) => getComputedStyle(el).backgroundColor);
  expect(stripBg).not.toBe('rgb(20, 18, 14)');
  await expect(page.locator('.el[data-z="1"]')).toBeVisible({ timeout: 15_000 });
  await saveShot(page, 'desktop-public-table');

  await page.goto('/calculators.html');
  await expect(page.locator('.calc-menu-item[data-target="molar"]')).toBeVisible();
  await expect(page.locator('.calc-menu-item[data-target="scientific"]')).toBeVisible();
  await saveShot(page, 'desktop-public-calculators');

  await page.goto('/login.html');
  await expect(page.locator('.lc-topnav-name')).toBeVisible();
  await expect.poll(() => fontFamily(page.locator('.lc-topnav-name'))).toMatch(/Instrument Serif/i);
  await expect(page.locator('#auth-email')).toBeVisible();
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
