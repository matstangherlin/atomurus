const { test, expect } = require('@playwright/test');
const path = require('node:path');
const fs = require('node:fs');
const { installApi, userFixture } = require('./helpers');

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

  await page.locator('.calc-menu-item[data-target="dilute"]').click();
  await expect(page.locator('#lab-tool-gate-dilute')).toHaveCount(0);

  await page.locator('.calc-menu-item[data-target="scientific"]').click();
  await expect(page.locator('#lab-tool-gate-scientific')).toBeVisible();
  await expect(page.locator('#lab-tool-gate-scientific')).toContainText(/Sign in to use this calculator/i);
  await expect(page.locator('#lab-tool-gate-scientific a.lab-tool-gate-primary')).toHaveAttribute('href', /signup/);
  await expect(page.locator('#lab-tool-gate-scientific a.lab-tool-gate-primary')).toHaveText(/Create a free account/i);
  await saveShot(page, 'guest-scientific-login-gate');

  await page.locator('.calc-menu-item[data-target="ideal"]').click();
  await expect(page.locator('#lab-tool-gate-ideal')).toBeVisible();
  await expect(page.locator('#lab-tool-gate-ideal a.lab-tool-gate-primary')).toHaveText(/Create a free account/i);

  await page.locator('.calc-menu-item[data-target="stoich"]').click();
  await expect(page.locator('#lab-tool-gate-stoich')).toBeVisible();
  await expect(page.locator('#lab-tool-gate-stoich')).toContainText(/Atomurus Pro/i);
  await expect(page.locator('#lab-tool-gate-stoich a.lab-tool-gate-primary')).toHaveAttribute('href', /signup/);
  await expect(page.locator('#lab-tool-gate-stoich a.lab-tool-gate-primary')).toHaveText(/Start 30-day Pro trial/i);
  await saveShot(page, 'guest-stoich-pro-gate');
});

test('guest 3D molecule viewer stays a preview without Three.js', async ({ page }) => {
  await page.goto('/viewer/molecules.html');
  await expect.poll(() => page.evaluate(() => Boolean(window.AtomurusLabToolGate))).toBe(true);
  await expect(page.locator('#lab-tool-gate')).toBeVisible();
  await expect(page.locator('#lab-tool-gate')).toContainText(/Atomurus Pro/i);
  await expect(page.locator('#lab-tool-gate a.lab-tool-gate-primary')).toHaveAttribute('href', /signup/);
  await expect(page.locator('#lab-tool-gate a.lab-tool-gate-primary')).toHaveText(/Start 30-day Pro trial/i);
  await page.locator('#viewer3d').scrollIntoViewIfNeeded();
  await page.waitForTimeout(800);
  const runtime = await page.evaluate(() => ({
    three: typeof window.THREE !== 'undefined',
    script: Boolean(document.querySelector('script[data-atomurus-dep="three"]'))
  }));
  expect(runtime.three).toBe(false);
  expect(runtime.script).toBe(false);
  await saveShot(page, 'guest-molecules-pro-gate');

  const errors = [];
  page.on('pageerror', (err) => errors.push(String(err.message || err)));
  await page.locator('#mode-btn-2d').click({ force: true });
  await page.locator('#mode-btn-3d').click({ force: true });
  expect(errors.some((e) => /is not defined/.test(e))).toBe(false);

  await page.goto('/explore/what-is-isomerism.html');
  await expect(page.locator('.art-title, h1').first()).toBeVisible();
  await expect(page.locator('#lab-tool-gate')).toHaveCount(0);
});

test('removing the overlay does not boot the Pro molecule runtime', async ({ page }) => {
  await page.goto('/viewer/molecules.html');
  await expect.poll(() => page.evaluate(() => Boolean(window.AtomurusLabToolGate))).toBe(true);
  await expect(page.locator('#lab-tool-gate')).toBeVisible();
  await page.evaluate(() => {
    document.querySelectorAll('.lab-tool-gate').forEach((el) => el.remove());
    document.querySelectorAll('[inert]').forEach((el) => el.removeAttribute('inert'));
  });
  const canvas = page.locator('#viewer3d');
  if (await canvas.count()) await canvas.scrollIntoViewIfNeeded();
  await page.waitForTimeout(1000);
  const runtime = await page.evaluate(() => ({
    three: typeof window.THREE !== 'undefined',
    script: Boolean(document.querySelector('script[data-atomurus-dep="three"]')),
    overlay: Boolean(document.querySelector('.lab-tool-gate'))
  }));
  expect(runtime.overlay).toBe(false);
  expect(runtime.three).toBe(false);
  expect(runtime.script).toBe(false);
});

test('signed-in free unlocks scientific but not molecules', async ({ page }) => {
  const free = userFixture('free');
  await page.route('**/api/ads-config', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        ok: true,
        adsEnabled: true,
        signedIn: true,
        user: free
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
  await expect(page.locator('#lab-tool-gate a.lab-tool-gate-primary')).toHaveText(/Upgrade to Pro/i);
  await expect(page.locator('#lab-tool-gate a.lab-tool-gate-secondary')).toHaveCount(0);
  const runtime = await page.evaluate(() => ({
    three: typeof window.THREE !== 'undefined',
    script: Boolean(document.querySelector('script[data-atomurus-dep="three"]'))
  }));
  expect(runtime.three).toBe(false);
  expect(runtime.script).toBe(false);
});

test('Pro loads the molecule runtime after entitlement', async ({ page }) => {
  let moleculeHits = 0;
  await installApi(page, { kind: 'pro' });
  page.on('request', (req) => {
    if (req.url().includes('/api/pro-lab/viewer/molecule')) moleculeHits += 1;
  });

  await page.goto('/viewer/molecules.html');
  await expect.poll(() => page.evaluate(() => {
    const ads = window.__ATOMURUS_ADS__ || {};
    const user = ads.user || {};
    return Boolean(ads.ready && user.features && user.features.moleculeViewer);
  })).toBe(true);
  await expect(page.locator('#lab-tool-gate')).toHaveCount(0);
  await page.locator('#viewer3d').scrollIntoViewIfNeeded();
  await expect.poll(() => page.evaluate(() => Boolean(document.querySelector('script[data-atomurus-dep="three"]') || window.THREE))).toBe(true);
  await expect.poll(() => moleculeHits).toBeGreaterThan(0);
  await expect(page.locator('.pro-viewer-status')).toHaveCount(0);
  await saveShot(page, 'pro-molecules-runtime');

  await expect.poll(() => page.evaluate(() => {
    const fn = window.setViewerMode;
    return typeof fn === 'function' && String(fn).indexOf('is-2d') !== -1;
  })).toBe(true);
  await page.locator('#mode-btn-2d').click();
  await expect(page.locator('#canvas-wrap')).toHaveClass(/is-2d/);
  await expect(page.locator('#mode-btn-2d')).toHaveAttribute('aria-pressed', 'true');
  await expect.poll(() => page.evaluate(() => {
    const c = document.getElementById('viewer2d-full');
    const c3 = document.getElementById('viewer3d');
    return Boolean(
      c && c.width > 100 && c.height > 100 &&
      getComputedStyle(c).visibility === 'visible' &&
      c3 && getComputedStyle(c3).visibility === 'visible'
    );
  })).toBe(true);
  await saveShot(page, 'pro-molecules-mode-2d');

  await page.locator('.mol-btn[data-mol="ethanol"]').click();
  await expect.poll(() => page.evaluate(() => {
    const wrap = document.getElementById('canvas-wrap');
    const c2 = document.getElementById('viewer2d-full');
    return Boolean(
      wrap && wrap.classList.contains('is-2d') &&
      c2 && c2.width > 100 && getComputedStyle(c2).visibility === 'visible'
    );
  })).toBe(true);

  await page.locator('#mode-btn-3d').click();
  await expect(page.locator('#canvas-wrap')).not.toHaveClass(/is-2d/);
  await expect(page.locator('#mode-btn-3d')).toHaveAttribute('aria-pressed', 'true');
  await expect.poll(() => page.evaluate(() => {
    const c3 = document.getElementById('viewer3d');
    const c2 = document.getElementById('viewer2d-full');
    return Boolean(
      c3 && c3.width > 100 && c3.height > 100 &&
      getComputedStyle(c3).visibility === 'visible' &&
      c2 && getComputedStyle(c2).visibility === 'hidden'
    );
  })).toBe(true);
  await saveShot(page, 'pro-molecules-mode-3d');
});

test('Pro isomerism 2D overlays the stage without hiding WebGL', async ({ page }) => {
  await installApi(page, { kind: 'pro' });
  await page.goto('/viewer/isomerism/constitutional/function.html');
  await expect.poll(() => page.evaluate(() => {
    const ads = window.__ATOMURUS_ADS__ || {};
    const user = ads.user || {};
    return Boolean(ads.ready && user.features && user.features.isomerismViewer);
  })).toBe(true);
  await expect(page.locator('#lab-tool-gate')).toHaveCount(0);
  const canvas = page.locator('.iso-3d-stage canvas').first();
  await canvas.scrollIntoViewIfNeeded();
  await expect.poll(() => page.evaluate(() => Boolean(
    window.THREE && document.querySelector('[data-3d-mode="2d"]')
  ))).toBe(true);
  await page.locator('[data-3d-mode="2d"]').click();
  await expect(page.locator('.iso-3d-panel').first()).toHaveClass(/is-2d/);
  await expect(page.locator('[data-3d-mode="2d"]')).toHaveAttribute('aria-pressed', 'true');
  await expect.poll(() => page.evaluate(() => {
    const panel = document.querySelector('.iso-3d-panel');
    const stage = panel && panel.querySelector('.iso-3d-stage');
    const s2 = panel && panel.querySelector('.iso-3d-stage2d');
    const c = stage && stage.querySelector('canvas');
    return Boolean(
      panel && panel.classList.contains('is-2d') &&
      stage && getComputedStyle(stage).display !== 'none' &&
      c && getComputedStyle(c).visibility === 'visible' &&
      s2 && stage.contains(s2) &&
      getComputedStyle(s2).visibility === 'visible' &&
      s2.querySelector('svg')
    );
  })).toBe(true);
  await saveShot(page, 'pro-isomerism-mode-2d');
  await page.locator('[data-3d-mode="3d"]').click();
  await expect(page.locator('.iso-3d-panel').first()).not.toHaveClass(/is-2d/);
  await expect(page.locator('[data-3d-mode="3d"]')).toHaveAttribute('aria-pressed', 'true');
  await expect.poll(() => page.evaluate(() => {
    const s2 = document.querySelector('.iso-3d-stage2d');
    const c = document.querySelector('.iso-3d-stage canvas');
    return Boolean(
      c && getComputedStyle(c).visibility === 'visible' &&
      s2 && getComputedStyle(s2).visibility === 'hidden'
    );
  })).toBe(true);
  await saveShot(page, 'pro-isomerism-mode-3d');
});

test('guest periodic table stays fully public', async ({ page }) => {
  await page.goto('/periodic-table.html');
  await expect(page.locator('#lab-tool-gate')).toHaveCount(0);
  await expect(page.locator('#ptable')).toBeVisible();
});

test('pricing access ladder and keep-free copy', async ({ page }) => {
  await page.goto('/pricing.html');
  await expect(page.locator('#pricing-keep-free-copy')).toContainText(/molar mass and dilution/i);
  await expect(page.locator('#pricing-keep-free-copy')).toContainText(/3D viewers/i);
  await expect(page.locator('#access-ladder')).toContainText(/OPEN LAB/i);
  await expect(page.locator('#access-ladder')).toContainText(/FREE ACCOUNT/i);
  await expect(page.locator('#ladder-trial-note')).toContainText(/No card required/i);
  await saveShot(page, 'pricing-keep-free-split');
});
