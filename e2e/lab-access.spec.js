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

test('guest molar mass stays open and extra calculators stay public except solvers', async ({ page }) => {
  await page.goto('/calculators.html');
  await expect.poll(() => page.evaluate(() => Boolean(window.AtomurusLabToolGate))).toBe(true);
  await page.locator('.calc-chip[data-mm-example="H2O"]').click();
  await page.locator('.calc-btn-run').first().click();
  await expect(page.locator('#mm-result-body')).toContainText(/18\.02/);
  await expect(page.locator('#lab-tool-gate-molar')).toHaveCount(0);

  await page.locator('.calc-menu-item[data-target="dilute"]').click();
  await expect(page.locator('#lab-tool-gate-dilute')).toHaveCount(0);

  await page.locator('.calc-menu-item[data-target="scientific"]').click();
  await expect(page.locator('#lab-tool-gate-scientific')).toHaveCount(0);
  await expect(page.locator('.scc-device')).toBeVisible();
  await saveShot(page, 'guest-scientific-open');

  await page.locator('.calc-menu-item[data-target="ideal"]').click();
  await expect(page.locator('#lab-tool-gate-ideal')).toHaveCount(0);

  await page.locator('.calc-menu-item[data-target="stoich"]').click();
  await expect(page.locator('#lab-tool-gate-stoich')).toBeVisible();
  await expect(page.locator('#lab-tool-gate-stoich')).toContainText(/Atomurus Pro/i);
  await expect(page.locator('#lab-tool-gate-stoich a.lab-tool-gate-primary')).toHaveAttribute('href', /signup/);
  await expect(page.locator('#lab-tool-gate-stoich a.lab-tool-gate-primary')).toHaveText(/Start 30-day Pro trial/i);
  await saveShot(page, 'guest-stoich-pro-gate');
});

test('guest 3D molecule viewer loads without a PRO overlay', async ({ page }) => {
  await page.goto('/viewer/molecules.html');
  await expect.poll(() => page.evaluate(() => Boolean(window.AtomurusLabToolGate))).toBe(true);
  await expect(page.locator('#lab-tool-gate')).toHaveCount(0);
  await page.locator('#viewer3d').scrollIntoViewIfNeeded();
  await expect.poll(() => page.evaluate(() => Boolean(
    window.THREE && document.querySelector('script[data-atomurus-dep="viewer-runtime"]')
  ))).toBe(true);
  await saveShot(page, 'guest-molecules-open');

  const errors = [];
  page.on('pageerror', (err) => errors.push(String(err.message || err)));
  await page.locator('#mode-btn-2d').click({ force: true });
  await page.locator('#mode-btn-3d').click({ force: true });
  expect(errors.some((e) => /is not defined/.test(e))).toBe(false);

  await page.goto('/explore/what-is-isomerism.html');
  await expect(page.locator('.art-title, h1').first()).toBeVisible();
  await expect(page.locator('#lab-tool-gate')).toHaveCount(0);

  await page.goto('/viewer/isomerism/constitutional/function.html');
  await expect.poll(() => page.evaluate(() => Boolean(window.AtomurusLabToolGate))).toBe(true);
  await expect(page.locator('#lab-tool-gate')).toHaveCount(0);
  await page.locator('.iso-3d-stage canvas').first().scrollIntoViewIfNeeded();
  await expect.poll(() => page.evaluate(() => Boolean(
    window.THREE && document.querySelector('script[data-atomurus-dep="viewer-runtime"]')
  ))).toBe(true);
});

test('guest atomic models, allotropes and element compare stay open', async ({ page }) => {
  await page.goto('/viewer/atomic-models.html');
  await expect.poll(() => page.evaluate(() => Boolean(window.AtomurusLabToolGate))).toBe(true);
  await expect(page.locator('#lab-tool-gate')).toHaveCount(0);
  await page.locator('#viewer3d').scrollIntoViewIfNeeded();
  await expect.poll(() => page.evaluate(() => Boolean(
    window.THREE && document.querySelector('script[data-atomurus-dep="viewer-runtime"]')
  ))).toBe(true);
  await saveShot(page, 'guest-atomic-models-open');

  await page.goto('/viewer/allotropes.html');
  await expect.poll(() => page.evaluate(() => Boolean(window.AtomurusLabToolGate))).toBe(true);
  await expect(page.locator('#lab-tool-gate')).toHaveCount(0);
  await page.locator('#viewer3d').scrollIntoViewIfNeeded();
  await expect.poll(() => page.evaluate(() => Boolean(
    window.THREE && document.querySelector('script[data-atomurus-dep="viewer-runtime"]')
  ))).toBe(true);
  await saveShot(page, 'guest-allotropes-open');

  await page.goto('/periodic-table/compare.html');
  await expect.poll(() => page.evaluate(() => Boolean(window.AtomurusLabToolGate))).toBe(true);
  await expect(page.locator('#lab-tool-gate')).toHaveCount(0);
});

test('signed-in free uses scientific and molecules; solvers stay Pro', async ({ page }) => {
  const free = userFixture('free');
  await page.route('**/api/ads-config', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        ok: true,
        adsEnabled: true,
        signedIn: true,
        user: free,
        features: free.features
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
  await expect(page.locator('#lab-tool-gate')).toHaveCount(0);
  await page.locator('#viewer3d').scrollIntoViewIfNeeded();
  await expect.poll(() => page.evaluate(() => Boolean(
    window.THREE && document.querySelector('script[data-atomurus-dep="viewer-runtime"]')
  ))).toBe(true);

  await page.goto('/calculators.html');
  await page.locator('.calc-menu-item[data-target="stoich"]').click();
  await expect(page.locator('#lab-tool-gate-stoich')).toBeVisible();
  await expect(page.locator('#lab-tool-gate-stoich a.lab-tool-gate-primary')).toHaveAttribute('href', /pricing/);
  await expect(page.locator('#lab-tool-gate-stoich a.lab-tool-gate-primary')).toHaveText(/Upgrade to Pro/i);
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
  await expect.poll(() => page.evaluate(() => Boolean(
    window.THREE && document.querySelector('script[data-atomurus-dep="viewer-runtime"]')
  ))).toBe(true);
  await expect.poll(() => moleculeHits).toBeGreaterThan(0);
  await expect(page.locator('.lab-viewer-status, .pro-viewer-status')).toHaveCount(0);
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
    window.THREE &&
    document.querySelector('script[data-atomurus-runtime="isomerism-3d.js"]') &&
    document.querySelector('[data-3d-mode="2d"]')
  ))).toBe(true);
  await page.locator('[data-3d-mode="2d"]').click();
  await expect(page.locator('.iso-3d-panel').first()).toHaveClass(/is-2d/);
  await expect(page.locator('[data-3d-mode="2d"]')).toHaveAttribute('aria-pressed', 'true');
  await expect.poll(() => page.evaluate(() => {
    const panel = document.querySelector('.iso-3d-panel');
    const stage = panel && panel.querySelector('.iso-3d-stage');
    const s2 = panel && panel.querySelector('.iso-3d-stage2d');
    const c = stage && stage.querySelector('canvas');
    if (!panel || !stage || !s2 || !c || !s2.querySelector('svg')) return false;
    if (getComputedStyle(stage).display === 'none') return false;
    if (getComputedStyle(c).visibility !== 'visible') return false;
    if (!stage.contains(s2)) return false;
    if (getComputedStyle(s2).position !== 'absolute') return false;
    if (getComputedStyle(s2).visibility !== 'visible') return false;
    const svg = s2.querySelector('svg');
    const sr = stage.getBoundingClientRect();
    const r2 = s2.getBoundingClientRect();
    const rv = svg.getBoundingClientRect();
    return r2.top >= sr.top - 2 &&
      r2.bottom <= sr.bottom + 2 &&
      r2.height >= sr.height * 0.9 &&
      r2.width >= sr.width * 0.9 &&
      rv.width > 80 &&
      rv.height > 40 &&
      rv.top >= sr.top - 2 &&
      rv.bottom <= sr.bottom + 2;
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
  await expect(page.locator('#pricing-keep-free-copy')).not.toContainText(/3D viewers, compare and public stoichiometry/i);
  await expect(page.locator('#access-ladder')).toContainText(/OPEN LAB/i);
  await expect(page.locator('#access-ladder')).toContainText(/FREE ACCOUNT/i);
  await expect(page.locator('#ladder-trial-note')).toContainText(/No card required/i);
  await saveShot(page, 'pricing-keep-free-split');
});

async function expectShareWorks(page) {
  const host = page.locator('.share-host').first();
  await expect(host).toBeVisible();
  await host.hover();
  await host.focus();
  await expect(page.locator('.share-copy').first()).toBeVisible();
  await expect(page.locator('a[data-channel="whatsapp"]').first()).toBeVisible();
  await page.locator('.share-copy').first().click();
  await expect(page.locator('.share-toast').first()).toContainText(/copied|copiado/i);
}

async function expectViewerCanvas(page, selector) {
  await expect.poll(() => page.evaluate(() => Boolean(window.AtomurusLabToolGate))).toBe(true);
  await expect(page.locator('#lab-tool-gate')).toHaveCount(0);
  await page.locator(selector).first().scrollIntoViewIfNeeded();
  await expect.poll(() => page.evaluate(() => Boolean(
    window.THREE && document.querySelector('script[data-atomurus-dep="viewer-runtime"]')
  ))).toBe(true);
  await expect(page.locator('#lab-tool-gate')).toHaveCount(0);
}

test('guest can share all four Open Lab viewers without a gate', async ({ page }) => {
  const pages = [
    { url: '/viewer/atomic-models.html', canvas: '#viewer3d' },
    { url: '/viewer/molecules.html', canvas: '#viewer3d' },
    { url: '/viewer/allotropes.html', canvas: '#viewer3d' },
    { url: '/viewer/isomerism.html', canvas: null }
  ];
  for (const item of pages) {
    await page.goto(item.url);
    await expect(page.locator('#lab-tool-gate')).toHaveCount(0);
    if (item.canvas) await expectViewerCanvas(page, item.canvas);
    await expectShareWorks(page);
    await expect(page.locator('#lab-tool-gate')).toHaveCount(0);
  }

  await page.goto('/viewer/isomerism/constitutional/function.html');
  await expectViewerCanvas(page, '.iso-3d-stage canvas');
  await expectShareWorks(page);
});

test('guest save on molecules is a contextual account CTA, not a canvas gate', async ({ page }) => {
  await page.goto('/viewer/molecules.html');
  await expectViewerCanvas(page, '#viewer3d');
  await expect.poll(() => page.evaluate(() => Boolean(
    window.AtomurusStudySave && window.AtomurusWorkspaceUI && document.querySelector('#atomurus-study-save [data-study-save]')
  ))).toBe(true);
  const save = page.locator('#atomurus-study-save [data-study-save]');
  await expect(save).toBeVisible({ timeout: 15_000 });
  await expect(page.locator('#atomurus-study-save .study-pro-badge')).toHaveCount(0);
  await save.click();
  await expect(page.locator('#ws-dialog-title')).toContainText(/Save this molecule|workspace/i);
  await expect(page.locator('#ws-dialog-host .ws-dialog-body')).toContainText(/free account/i);
  await expect(page.locator('#ws-dialog-host a.ws-btn-primary')).toHaveAttribute('href', /signup/);
  await expect(page.locator('#lab-tool-gate')).toHaveCount(0);
  await expect(page.locator('#viewer3d')).toBeVisible();
  await saveShot(page, 'guest-molecules-save-cta');
});

test('signed-in free can save a molecule without a Pro overlay', async ({ page }) => {
  const free = userFixture('free');
  await installApi(page, { kind: 'free' });
  await page.goto('/viewer/molecules.html');
  await expect.poll(() => page.evaluate(() => {
    const ads = window.__ATOMURUS_ADS__ || {};
    return Boolean(window.AtomurusLabToolGate && ads.ready && ads.signedIn && ads.user && ads.user.features && ads.user.features.studyCloud);
  })).toBe(true);
  await expectViewerCanvas(page, '#viewer3d');
  const save = page.locator('#atomurus-study-save [data-study-save]');
  await expect(save).toBeVisible({ timeout: 15_000 });
  await expect(page.locator('#atomurus-study-save .study-pro-badge')).toHaveCount(0);
  await save.click();
  await expect(page.locator('#atomurus-study-save')).toContainText(/Saved|Salvo/i, { timeout: 8_000 });
  await expect(page.locator('#ws-dialog-host.is-open')).toHaveCount(0);
  await expect(page.locator('#lab-tool-gate')).toHaveCount(0);
  await saveShot(page, 'free-molecules-save');
});

test('Pro generate stays an extra after a public molecule save', async ({ page }) => {
  await installApi(page, { kind: 'pro' });
  await page.goto('/viewer/molecules.html');
  await expectViewerCanvas(page, '#viewer3d');
  const save = page.locator('#atomurus-study-save [data-study-save]');
  await expect(save).toBeVisible({ timeout: 15_000 });
  await save.click();
  await expect(page.locator('#atomurus-study-save')).toContainText(/Saved|Salvo/i, { timeout: 8_000 });
  await expect(page.locator('[data-study-generate]')).toBeVisible();
  await expect(page.locator('#lab-tool-gate')).toHaveCount(0);
});

test('guest Open Lab molecule viewer works on a phone viewport', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/viewer/molecules.html');
  await expectViewerCanvas(page, '#viewer3d');
  await expectShareWorks(page);
  await expect(page.locator('.vz-tabs')).toBeVisible();
  await expect(page.locator('.vz-tabs')).not.toContainText(/PRO/);
  await expect(page.locator('.vz-tabs a[href$="isomerism.html"]')).toBeVisible();
  await saveShot(page, 'guest-molecules-mobile');
});

