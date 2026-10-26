const { test, expect } = require('@playwright/test');
const fs = require('fs');
const path = require('path');

const THREE_MIN = path.join(__dirname, '..', 'node_modules', 'three', 'build', 'three.min.js');
const VIEWPORTS = [
  { width: 360, height: 740 },
  { width: 390, height: 844 }
];
const PAGES = [
  '/',
  '/index.pt.html',
  '/periodic-table.html',
  '/periodic-table.pt.html',
  '/periodic-table/heatmap.html',
  '/periodic-table/trends.html',
  '/calculators.html',
  '/calculators.pt.html',
  '/explore.html',
  '/explore/what-is-an-atom.html',
  '/explore/what-is-chemical-bonding.pt.html',
  '/explore/what-is-the-periodic-table.html',
  '/viewer/molecules.html',
  '/viewer/atomic-models.html',
  '/viewer/isomerism/constitutional/function.html',
  '/login',
  '/pricing',
  '/contact.html',
  '/periodic-table/actinium.html',
  '/periodic-table/actinium.en.html',
  '/periodic-table/lithium.html',
  '/periodic-table/helium.en.html',
  '/periodic-table/lanthanum.html',
  '/periodic-table/rutherfordium.en.html'
];

const json = (route, status, body) => route.fulfill({ status, contentType: 'application/json', body: JSON.stringify(body) });

async function mockApi(context) {
  await context.route((url) => url.pathname.startsWith('/api/'), (route) => {
    const url = new URL(route.request().url());
    if (url.pathname === '/api/auth/me') return json(route, 401, { ok: false, code: 'session_expired' });
    if (url.pathname === '/api/ads-config') return json(route, 200, { ok: true, signedIn: false, adsEnabled: false, isPro: false, user: null, features: {} });
    return json(route, 404, { ok: false, code: 'not_found' });
  });
  await context.route(/googlesyndication|googletagmanager|google-analytics|gstatic|doubleclick|jsdelivr/, (route) => route.abort());
  await context.route(/cdnjs\.cloudflare\.com\/.*three\.min\.js/, (route) => route.fulfill({ status: 200, contentType: 'text/javascript', body: fs.readFileSync(THREE_MIN) }));
}

async function fit(page) {
  return page.evaluate(() => {
    const view = Math.round((visualViewport && visualViewport.width) || document.documentElement.clientWidth);
    const bar = document.querySelector('.lc-topnav, .ps-shell > .topbar');
    const kids = bar ? [...bar.children].filter((el) => getComputedStyle(el).display !== 'none').map((el) => {
      const box = el.getBoundingClientRect();
      return { right: box.right, top: box.top, name: el.className || el.tagName };
    }) : [];
    const tops = kids.map((kid) => kid.top).sort((a, b) => a - b);
    let lines = 0;
    let last = -999;
    for (const top of tops) {
      if (top - last > 12) lines += 1;
      last = top;
    }
    return {
      sw: document.documentElement.scrollWidth,
      view,
      clipped: kids.filter((kid) => kid.right > view + 1).map((kid) => kid.name),
      lines
    };
  });
}

for (const vp of VIEWPORTS) {
  test(`public overflow ${vp.width}px: scrollWidth fits the screen`, async ({ browser }) => {
    const context = await browser.newContext({ viewport: vp, isMobile: true, hasTouch: true });
    await mockApi(context);
    const page = await context.newPage();
    for (const url of PAGES) {
      await page.goto(url, { waitUntil: 'load' });
      await page.waitForTimeout(150);
      const box = await fit(page);
      expect(box.sw, `${url} overflows at ${vp.width}`).toBeLessThanOrEqual(box.view + 1);
      expect(box.clipped, `${url} header clipped`).toEqual([]);
    }
    await context.close();
  });
}

test('topnav at 360px stays one line until search is opened', async ({ browser }) => {
  const context = await browser.newContext({ viewport: { width: 360, height: 740 }, isMobile: true, hasTouch: true });
  await mockApi(context);
  const page = await context.newPage();
  await page.goto('/', { waitUntil: 'load' });
  const closed = await fit(page);
  expect(closed.lines).toBeLessThanOrEqual(1);
  expect(closed.clipped).toEqual([]);
  await page.locator('.lc-topnav-search').click();
  await expect(page.locator('#quick-search')).toBeFocused();
  const open = await fit(page);
  expect(open.sw).toBeLessThanOrEqual(open.view + 1);
  await page.emulateMedia({ colorScheme: 'dark' });
  await page.evaluate(() => document.documentElement.setAttribute('data-theme', 'dark'));
  const dark = await fit(page);
  expect(dark.sw).toBeLessThanOrEqual(dark.view + 1);
  expect(dark.clipped).toEqual([]);
  await context.close();
});

test('element page menu opens, Escape closes, and focus returns', async ({ browser }) => {
  const context = await browser.newContext({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true });
  await mockApi(context);
  const page = await context.newPage();
  for (const url of ['/periodic-table/actinium.html', '/periodic-table/rutherfordium.en.html']) {
    await page.goto(url, { waitUntil: 'load' });
    const menu = page.locator('.topbar .mobile-menu-btn');
    await expect(menu).toBeVisible();
    await menu.click();
    await expect(page.locator('.ps-shell')).toHaveClass(/is-nav-open/);
    await expect(page.locator('#ws-sidebar')).toBeVisible();
    await page.keyboard.press('Escape');
    await expect(page.locator('.ps-shell')).not.toHaveClass(/is-nav-open/);
    await expect(menu).toBeFocused();
    const gap = await page.evaluate(() => {
      const host = document.querySelector('#atomurus-study-save');
      if (!host) return null;
      const box = host.getBoundingClientRect();
      return { left: box.left, right: innerWidth - box.right };
    });
    if (gap) {
      expect(gap.left).toBeGreaterThanOrEqual(12);
      expect(gap.right).toBeGreaterThanOrEqual(12);
    }
  }
  await context.close();
});
