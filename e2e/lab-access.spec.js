const { test, expect } = require('@playwright/test');
const path = require('node:path');
const fs = require('node:fs');

const SHOTS = path.resolve(__dirname, '../test-results/e2e-screenshots');

function saveShot(page, name) {
  fs.mkdirSync(SHOTS, { recursive: true });
  return page.screenshot({ path: path.join(SHOTS, `${name}.png`), fullPage: true });
}

test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => {
    localStorage.setItem('atomurus-cookie-consent', 'rejected');
    localStorage.setItem('atomurus-lang', 'en');
    localStorage.setItem('atomurus-theme', 'light');
  });
});

test('guest molar mass stays open and extra calculators ask for an account', async ({ page }) => {
  await page.goto('/calculators.html');
  await expect.poll(() => page.evaluate(() => Boolean(window.AtomurusLabToolGate))).toBe(true);
  await page.locator('.calc-chip[data-mm-example="H2O"]').click();
  await page.locator('.calc-btn-run').first().click();
  await expect(page.locator('#mm-result-body')).toContainText(/18\.02/);
  await expect(page.locator('#lab-tool-gate-molar')).toHaveCount(0);

  await page.locator('.calc-menu-item[data-target="scientific"]').click();
  await expect(page.locator('#lab-tool-gate-scientific')).toBeVisible();
  await expect(page.locator('#lab-tool-gate-scientific')).toContainText(/Sign in to use this calculator/i);
  await expect(page.locator('#lab-tool-gate-scientific a.lab-tool-gate-primary')).toHaveAttribute('href', /signup/);
  await saveShot(page, 'guest-scientific-login-gate');

  await page.locator('.calc-menu-item[data-target="stoich"]').click();
  await expect(page.locator('#lab-tool-gate-stoich')).toBeVisible();
  await expect(page.locator('#lab-tool-gate-stoich')).toContainText(/Atomurus Pro/i);
  await saveShot(page, 'guest-stoich-pro-gate');
});

test('guest 3D molecule viewer is Pro while Explore isomerism stays open', async ({ page }) => {
  await page.goto('/viewer/molecules.html');
  await expect.poll(() => page.evaluate(() => Boolean(window.AtomurusLabToolGate))).toBe(true);
  await expect(page.locator('#lab-tool-gate')).toBeVisible();
  await expect(page.locator('#lab-tool-gate')).toContainText(/Atomurus Pro/i);
  await expect(page.locator('#lab-tool-gate a.lab-tool-gate-primary')).toHaveAttribute('href', /pricing/);
  await saveShot(page, 'guest-molecules-pro-gate');

  await page.goto('/explore/what-is-isomerism.html');
  await expect(page.locator('.art-title, h1').first()).toBeVisible();
  await expect(page.locator('#lab-tool-gate')).toHaveCount(0);
});

test('signed-in free unlocks scientific but not molecules', async ({ page }) => {
  await page.route('**/api/ads-config', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        ok: true,
        adsEnabled: true,
        signedIn: true,
        user: { id: 'u1', email: 'free@example.com', isPro: false, plan: 'free', planSource: 'free' }
      })
    });
  });

  await page.goto('/calculators.html');
  await expect.poll(() => page.evaluate(() => {
    const ads = window.__ATOMURUS_ADS__ || {};
    return Boolean(window.AtomurusLabToolGate && ads.ready && ads.signedIn);
  })).toBe(true);
  await page.locator('.calc-menu-item[data-target="scientific"]').click();
  await expect(page.locator('#lab-tool-gate-scientific')).toHaveCount(0);
  await expect(page.locator('.scc-device')).toBeVisible();

  await page.goto('/viewer/molecules.html');
  await expect.poll(() => page.evaluate(() => Boolean(window.AtomurusLabToolGate && window.__ATOMURUS_ADS__ && window.__ATOMURUS_ADS__.ready))).toBe(true);
  await expect(page.locator('#lab-tool-gate')).toBeVisible();
  await expect(page.locator('#lab-tool-gate a.lab-tool-gate-primary')).toHaveAttribute('href', /pricing/);
  await expect(page.locator('#lab-tool-gate a.lab-tool-gate-secondary')).toHaveCount(0);
});

test('pricing keep-free copy matches the new split', async ({ page }) => {
  await page.goto('/pricing.html');
  await expect(page.locator('#pricing-keep-free-copy')).toContainText(/molar mass and dilution/i);
  await expect(page.locator('#pricing-keep-free-copy')).toContainText(/3D viewers/i);
  await saveShot(page, 'pricing-keep-free-split');
});
