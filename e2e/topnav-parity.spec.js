const { test, expect } = require('@playwright/test');
const path = require('node:path');
const fs = require('node:fs');
const { installApi } = require('./helpers');

/* Remake 2026: every public page shares one top navigation (no sidebar).
   The /app workspace keeps its own chrome and is not part of this contract. */

const SHOTS = path.resolve(__dirname, '../test-results/e2e-screenshots');

function saveShot(page, name) {
  fs.mkdirSync(SHOTS, { recursive: true });
  return page.screenshot({ path: path.join(SHOTS, `${name}.png`), fullPage: false });
}

const ROUTES = [
  { name: 'home', path: '/', section: null },
  { name: 'periodic-table', path: '/periodic-table.html', section: 'periodic' },
  { name: 'compare', path: '/periodic-table/compare.html', section: 'periodic' },
  { name: 'element', path: '/periodic-table/carboneum.html', section: 'periodic' },
  { name: 'viewer', path: '/viewer/atomic-models.html', section: 'models' },
  { name: 'calculators', path: '/calculators.html', section: 'calculators' },
  { name: 'explore', path: '/explore.html', section: 'explore' },
  { name: 'pricing', path: '/pricing.html', section: 'plans' }
];

const TOP_LEVEL = ['periodic', 'models', 'calculators', 'lab', 'explore', 'plans'];

async function navMetrics(page) {
  return page.evaluate(() => {
    const header = document.querySelector('[data-rm-header]');
    const r = header ? header.getBoundingClientRect() : null;
    const brand = document.querySelector('.rm-brand');
    const b = brand ? brand.getBoundingClientRect() : null;
    return {
      header: r && { y: r.y, h: r.height, w: r.width },
      brandX: b && b.x,
      sections: Array.from(document.querySelectorAll('.rm-nav > [data-rm-section]')).map((el) => el.getAttribute('data-rm-section')),
      active: Array.from(document.querySelectorAll('.rm-nav > [data-rm-section].is-active')).map((el) => el.getAttribute('data-rm-section')),
      sidebar: document.querySelectorAll('[data-atomurus-sidebar], #ws-sidebar').length,
      footer: Boolean(document.querySelector('[data-rm-footer]'))
    };
  });
}

test.describe('public top navigation is one component', () => {
  test.use({ viewport: { width: 1280, height: 800 } });

  test('same header, same items, no legacy sidebar on every public route', async ({ page }) => {
    await installApi(page, { kind: 'guest', signedIn: false });
    const samples = [];
    for (const route of ROUTES) {
      await page.goto(route.path);
      await expect(page.locator('[data-rm-header]')).toBeVisible();
      const m = await navMetrics(page);
      expect(m.sections, route.path).toEqual(TOP_LEVEL);
      expect(m.sidebar, route.path + ' legacy sidebar').toBe(0);
      expect(m.footer, route.path + ' footer').toBe(true);
      expect(m.active, route.path + ' active section').toEqual(route.section ? [route.section] : []);
      samples.push({ name: route.name, m });
      await saveShot(page, `topnav-parity-${route.name}`);
    }
    const ref = samples[0].m;
    for (const { name, m } of samples.slice(1)) {
      expect(Math.abs(m.header.h - ref.header.h), name + ' header height').toBeLessThanOrEqual(2);
      expect(Math.abs(m.brandX - ref.brandX), name + ' brand x').toBeLessThanOrEqual(2);
    }
  });

  test('dropdowns open on hover and the sticky header stays on top while scrolling', async ({ page }) => {
    await installApi(page, { kind: 'guest', signedIn: false });
    await page.goto('/periodic-table/carboneum.html');
    await page.locator('.rm-dd[data-rm-section="models"] .rm-dd-toggle').hover();
    await expect(page.locator('.rm-dd[data-rm-section="models"] .rm-dd-panel')).toBeVisible();
    await expect(page.locator('.rm-dd[data-rm-section="models"] .rm-dd-item')).toHaveCount(4);
    await page.mouse.move(640, 700);
    await page.evaluate(() => window.scrollTo(0, 900));
    const top = await page.locator('[data-rm-header]').evaluate((el) => el.getBoundingClientRect().top);
    expect(top).toBe(0);
  });
});
