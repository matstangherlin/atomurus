const { test, expect } = require('@playwright/test');
const path = require('node:path');
const fs = require('node:fs');
const { installApi } = require('./helpers');

const SHOTS = path.resolve(__dirname, '../test-results/e2e-screenshots');

function saveShot(page, name) {
  fs.mkdirSync(SHOTS, { recursive: true });
  return page.screenshot({ path: path.join(SHOTS, `${name}.png`), fullPage: false });
}

const ROUTES = [
  { name: 'workspace', path: '/app' },
  { name: 'calculators', path: '/calculators.html' },
  { name: 'periodic-table', path: '/periodic-table.html' },
  { name: 'viewer', path: '/viewer/atomic-models.html' },
  { name: 'explore', path: '/explore.html' }
];

const GLOBAL_NAV = ['home', 'periodic', 'viewer', 'calculators', 'explore', 'workspace'];

async function sidebarMetrics(page) {
  return page.evaluate(() => {
    const side = document.querySelector('#ws-sidebar');
    const top = document.querySelector('.ws-topbar, .ps-shell > .topbar, .ps-shell > .lc-topnav');
    const main = document.querySelector('.ws-main, .ps-shell > main.main, .ps-shell > main.ps-main');
    const first = document.querySelector('#ws-sidebar [data-atomurus-lab-nav] a.ws-nav-item, #ws-nav-main a.ws-nav-item');
    const box = (el) => {
      if (!el) return null;
      const r = el.getBoundingClientRect();
      return {
        x: r.x,
        y: r.y,
        w: r.width,
        h: r.height,
        right: r.right,
        bottom: r.bottom
      };
    };
    const navIds = Array.prototype.map.call(
      document.querySelectorAll('#ws-sidebar [data-atomurus-lab-nav] a[data-nav]'),
      (a) => a.getAttribute('data-nav')
    );
    return {
      side: box(side),
      top: box(top),
      main: box(main),
      first: box(first),
      navIds: navIds,
      expandable: document.querySelectorAll('#ws-sidebar .nav-expandable, #ws-sidebar .nav-children').length,
      settings: Array.prototype.some.call(
        document.querySelectorAll('#ws-sidebar a, #ws-sidebar button'),
        (el) => /config\.html|common\.nav\.settings/i.test((el.getAttribute('href') || '') + (el.getAttribute('data-i18n') || ''))
      )
    };
  });
}

test.describe('global sidebar is the /app component', () => {
  test.use({ viewport: { width: 1280, height: 800 } });

  test('structural metrics match across laboratory routes', async ({ page }) => {
    await installApi(page, { kind: 'guest', signedIn: false });
    const samples = [];
    for (const route of ROUTES) {
      await page.goto(route.path);
      await expect(page.locator('#ws-sidebar')).toBeVisible();
      const metrics = await sidebarMetrics(page);
      expect(metrics.side, route.path).toBeTruthy();
      expect(metrics.top, route.path).toBeTruthy();
      expect(metrics.first, route.path).toBeTruthy();
      expect(metrics.navIds).toEqual(GLOBAL_NAV);
      expect(metrics.expandable).toBe(0);
      expect(metrics.settings).toBeFalsy();
      samples.push({ name: route.name, metrics });
      await saveShot(page, `sidebar-parity-${route.name}`);
    }

    const ref = samples[0].metrics;
    for (const sample of samples.slice(1)) {
      const m = sample.metrics;
      expect(Math.abs(m.side.w - ref.side.w), sample.name + ' sidebar width').toBeLessThanOrEqual(2);
      expect(Math.abs(m.top.h - ref.top.h), sample.name + ' topbar height').toBeLessThanOrEqual(2);
      expect(Math.abs(m.first.y - ref.first.y), sample.name + ' first item y').toBeLessThanOrEqual(4);
      expect(Math.abs(m.first.h - ref.first.h), sample.name + ' item height').toBeLessThanOrEqual(2);
      expect(Math.abs(m.main.x - ref.main.x), sample.name + ' main start x').toBeLessThanOrEqual(2);
    }
  });

  test('active item follows the laboratory route', async ({ page }) => {
    await installApi(page, { kind: 'guest', signedIn: false });
    const cases = [
      { path: '/app', nav: 'workspace' },
      { path: '/calculators.html', nav: 'calculators' },
      { path: '/periodic-table.html', nav: 'periodic' },
      { path: '/viewer/atomic-models.html', nav: 'viewer' },
      { path: '/explore.html', nav: 'explore' }
    ];
    for (const row of cases) {
      await page.goto(row.path);
      const current = page.locator('#ws-sidebar [data-atomurus-lab-nav] a[aria-current="page"]');
      await expect(current, row.path).toHaveCount(1);
      await expect(current).toHaveAttribute('data-nav', row.nav);
    }
  });
});
