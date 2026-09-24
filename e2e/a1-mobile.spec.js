// A1.0 — mobile geometry, safe areas, touch targets, keyboard, single scroll
// owner, horizontal overflow and lazy loading. Runs the AppShell harness
// (/dev/app-shell.html) plus the existing public pages.
const { test, expect } = require('@playwright/test');
const fs = require('fs');
const path = require('path');

const VIEWPORTS = [
  { width: 360, height: 740 },
  { width: 360, height: 800 },
  { width: 390, height: 844 },
  { width: 412, height: 915 },
  { width: 432, height: 960 }
];
const LANDSCAPE = { width: 844, height: 390 };
const SHELL_ROUTES = ['home', 'explore', 'study', 'periodic-table', 'account', 'lab'];
const PUBLIC_PAGES = ['/', '/periodic-table.html', '/app', '/app?section=study', '/app?section=review', '/login', '/pricing', '/calculators.html', '/explore.html', '/viewer/molecules.html'];
const SHOTS = path.join(__dirname, '..', 'docs', 'reports', 'a1-0-screens');
const THREE_MIN = path.join(__dirname, '..', 'node_modules', 'three', 'build', 'three.min.js');

const json = (route, status, body) => route.fulfill({ status, contentType: 'application/json', body: JSON.stringify(body) });

async function mockApi(context, { signedIn = false } = {}) {
  await context.route((url) => url.pathname.startsWith('/api/'), (route) => {
    const url = new URL(route.request().url());
    if (url.pathname === '/api/auth/me') return signedIn ? json(route, 200, { ok: true, user: { id: 'u1', email: 'a@b.c', displayName: 'Ada', isPro: false, features: {} } }) : json(route, 401, { ok: false, code: 'session_expired' });
    if (url.pathname === '/api/study/sets') return signedIn ? json(route, 200, { ok: true, sets: [{ id: 's1', title: 'Acids and bases', dueCount: 3 }] }) : json(route, 401, { ok: false, code: 'session_expired' });
    if (url.pathname === '/api/ads-config') return json(route, 200, { ok: true, signedIn: false, adsEnabled: false, isPro: false, user: null, features: {} });
    return json(route, 404, { ok: false, code: 'not_found' });
  });
  /* Third parties are not part of the product under test (and are blocked here). */
  await context.route(/googlesyndication|googletagmanager|google-analytics|gstatic|doubleclick|jsdelivr/, (route) => route.abort());
  await context.route(/cdnjs\.cloudflare\.com\/.*three\.min\.js/, (route) => route.fulfill({ status: 200, contentType: 'text/javascript', body: fs.readFileSync(THREE_MIN) }));
}

async function openShell(page, route = 'home') {
  await page.goto(`/dev/app-shell.html#/${route}`);
  await page.waitForFunction(() => window.__atomurusShell && ['ready', 'failed'].includes(window.__atomurusShell.stats().featureState));
  await page.waitForTimeout(150);
}

async function geometry(page) {
  return page.evaluate(() => {
    const rect = (el) => { if (!el) return null; const b = el.getBoundingClientRect(); return { top: b.top, bottom: b.bottom, left: b.left, right: b.right, width: b.width, height: b.height }; };
    const nav = document.querySelector('[data-app-nav]');
    const cta = document.querySelector('.app-primary-cta, .app-action.is-primary');
    return {
      vw: innerWidth,
      vh: innerHeight,
      scrollWidth: document.scrollingElement.scrollWidth,
      docScrollable: document.scrollingElement.scrollHeight > innerHeight + 1,
      topbar: rect(document.querySelector('[data-app-topbar]')),
      brand: rect(document.querySelector('.app-brand')),
      nav: rect(nav),
      navItems: Array.from(document.querySelectorAll('.app-nav-item')).map(rect),
      cta: rect(cta),
      main: rect(document.querySelector('.app-main')),
      /* Content wider than the scroll owner is clipped, not scrollable — as bad
         as page overflow. Only the explicit pan container may be wider. */
      clipped: (() => {
        const main = document.querySelector('.app-main');
        if (!main) return [];
        const edge = main.getBoundingClientRect().right + 1;
        return Array.from(main.querySelectorAll('*'))
          .filter((el) => !el.closest('[data-pan-x]') && el.getBoundingClientRect().right > edge)
          .slice(0, 5).map((el) => el.className || el.tagName);
      })(),
      /* Elements that scroll vertically right now (single scroll owner rule). */
      scrollers: Array.from(document.querySelectorAll('body *')).filter((el) => {
        const oy = getComputedStyle(el).overflowY;
        return (oy === 'auto' || oy === 'scroll') && el.scrollHeight > el.clientHeight + 1;
      }).map((el) => el.className || el.tagName)
    };
  });
}

function assertNoOverlap(a, b, msg) {
  if (!a || !b) return;
  expect(a.bottom <= b.top + 0.5 || a.top >= b.bottom - 0.5, msg).toBe(true);
}

test.describe('A1.0 mobile layout', () => {
  for (const vp of VIEWPORTS) {
    test(`app shell ${vp.width}x${vp.height}: no overflow, bottom nav visible, targets ≥44px, CTA clear`, async ({ browser }) => {
      const context = await browser.newContext({ viewport: vp, isMobile: true, hasTouch: true, deviceScaleFactor: 2 });
      await mockApi(context, { signedIn: true });
      const page = await context.newPage();
      const errors = [];
      page.on('pageerror', (e) => errors.push(e.message));
      for (const route of SHELL_ROUTES) {
        await openShell(page, route);
        const g = await geometry(page);
        expect(g.vw, `${route}: layout viewport is the device width (no desktop zoom-out)`).toBe(vp.width);
        expect(g.scrollWidth, `${route}: horizontal overflow`).toBeLessThanOrEqual(g.vw);
        expect(g.clipped, `${route}: content clipped at the right edge`).toEqual([]);
        expect(g.nav.top, `${route}: phones get bottom navigation`).toBeGreaterThan(g.vh / 2);
        expect(g.scrollers.length, `${route}: nested vertical scrollers ${g.scrollers.join(', ')}`).toBeLessThanOrEqual(1);
        if (g.scrollers.length === 1) expect(String(g.scrollers[0])).toContain('app-main');
        expect(g.docScrollable, `${route}: document must not scroll (single scroll owner)`).toBe(false);
        expect(g.nav.bottom, `${route}: bottom nav inside viewport`).toBeLessThanOrEqual(g.vh + 0.5);
        expect(g.nav.top, `${route}: bottom nav visible`).toBeLessThan(g.vh);
        expect(g.navItems).toHaveLength(5);
        for (const item of g.navItems) {
          expect(item.height).toBeGreaterThanOrEqual(44);
          expect(item.width).toBeGreaterThanOrEqual(44);
        }
        expect(g.topbar.top, `${route}: header not clipped`).toBeGreaterThanOrEqual(0);
        if (g.cta) assertNoOverlap(g.cta, g.nav, `${route}: primary CTA hidden by the bottom bar`);
        if (route === 'periodic-table') {
          /* End of a long list must be reachable above the bottom bar. */
          const last = await page.evaluate(() => {
            const main = document.querySelector('.app-main');
            main.scrollTop = main.scrollHeight;
            const rows = document.querySelectorAll('.app-element-row');
            const b = rows[rows.length - 1].getBoundingClientRect();
            return { bottom: b.bottom, navTop: document.querySelector('[data-app-nav]').getBoundingClientRect().top };
          });
          expect(last.bottom, 'last row hidden under the bottom bar').toBeLessThanOrEqual(last.navTop + 0.5);
        }
        if (vp.width === 390 && vp.height === 844) {
          await page.screenshot({ path: path.join(SHOTS, `shell-${route}-390x844.png`) });
        }
      }
      expect(errors).toEqual([]);
      await context.close();
    });
  }

  test('app shell landscape 844x390 switches to the rail and stays usable', async ({ browser }) => {
    const context = await browser.newContext({ viewport: LANDSCAPE, isMobile: true, hasTouch: true });
    await mockApi(context);
    const page = await context.newPage();
    for (const route of ['home', 'periodic-table']) {
      await openShell(page, route);
      const g = await geometry(page);
      expect(g.scrollWidth).toBeLessThanOrEqual(g.vw);
      expect(g.nav.left).toBeLessThan(10);
      expect(g.nav.height).toBeGreaterThan(g.vh - 2);
      expect(g.main.left).toBeGreaterThanOrEqual(g.nav.right - 1);
    }
    await page.screenshot({ path: path.join(SHOTS, 'shell-periodic-table-844x390.png') });
    await context.close();
  });

  test('desktop keeps a sidebar, not a stretched phone', async ({ browser }) => {
    const context = await browser.newContext({ viewport: { width: 1280, height: 800 } });
    await mockApi(context);
    const page = await context.newPage();
    await openShell(page, 'home');
    const g = await geometry(page);
    expect(g.nav.width).toBeGreaterThanOrEqual(200);
    expect(g.nav.left).toBeLessThan(10);
    await page.screenshot({ path: path.join(SHOTS, 'shell-home-1280x800.png') });
    await context.close();
  });

  for (const vp of [VIEWPORTS[0], VIEWPORTS[2]]) {
    test(`public pages ${vp.width}px: no global horizontal overflow`, async ({ browser }) => {
      const context = await browser.newContext({ viewport: vp, isMobile: true, hasTouch: true });
      await mockApi(context);
      const page = await context.newPage();
      for (const url of PUBLIC_PAGES) {
        await page.goto(url, { waitUntil: 'load' });
        await page.waitForTimeout(250);
        const { sw, iw } = await page.evaluate(() => ({ sw: document.scrollingElement.scrollWidth, iw: innerWidth }));
        expect(sw, `${url} overflows at ${vp.width}px`).toBeLessThanOrEqual(iw);
      }
      await context.close();
    });
  }

  test('periodic table: list on portrait phones, real table pans inside its own box (no page overflow)', async ({ browser }) => {
    const context = await browser.newContext({ viewport: { width: 360, height: 740 }, isMobile: true, hasTouch: true });
    await mockApi(context);
    const page = await context.newPage();
    await openShell(page, 'periodic-table');
    await expect(page.locator('[data-mode="list"][aria-selected="true"]')).toBeVisible();
    await expect(page.locator('.app-element-row')).toHaveCount(118);
    await page.locator('[data-mode="table"]').click();
    const pan = await page.evaluate(() => {
      const box = document.querySelector('[data-pan-x]');
      const cell = document.querySelector('.app-pcell').getBoundingClientRect();
      return { pans: box.scrollWidth > box.clientWidth, sw: document.scrollingElement.scrollWidth, iw: innerWidth, cellW: cell.width, cellH: cell.height };
    });
    expect(pan.pans, 'table pans horizontally inside its container').toBe(true);
    expect(pan.sw).toBeLessThanOrEqual(pan.iw);
    expect(pan.cellW, 'cells stay legible (no zoom-out)').toBeGreaterThanOrEqual(44);
    expect(pan.cellH).toBeGreaterThanOrEqual(44);
    await page.screenshot({ path: path.join(SHOTS, 'shell-periodic-table-grid-360x740.png') });
    await page.locator('[data-table-search]').fill('Fe');
    await page.locator('[data-mode="list"]').click();
    await expect(page.locator('.app-element-row')).toHaveCount(2); /* Fe, Fermium */
    await context.close();
  });

  test('touch targets: tabs, icon buttons and list rows ≥44px on touch devices', async ({ browser }) => {
    const context = await browser.newContext({ viewport: { width: 360, height: 740 }, isMobile: true, hasTouch: true });
    await mockApi(context, { signedIn: true });
    const page = await context.newPage();
    await openShell(page, 'periodic-table');
    const tabs = await page.locator('.ui-tab').evaluateAll((els) => els.map((e) => e.getBoundingClientRect().height));
    expect(Math.min(...tabs)).toBeGreaterThanOrEqual(44);
    const rows = await page.locator('.app-element-row').evaluateAll((els) => els.slice(0, 10).map((e) => e.getBoundingClientRect().height));
    expect(Math.min(...rows)).toBeGreaterThanOrEqual(44);
    await openShell(page, 'study');
    await page.locator('[data-study-more]').click();
    const close = await page.locator('[data-overlay-close]').boundingBox();
    expect(close.width).toBeGreaterThanOrEqual(44);
    expect(close.height).toBeGreaterThanOrEqual(44);
    await context.close();
  });

  test('sheet and dialog fit the viewport at 360x740 and restore focus', async ({ browser }) => {
    const context = await browser.newContext({ viewport: { width: 360, height: 740 }, isMobile: true, hasTouch: true });
    await mockApi(context, { signedIn: true });
    const page = await context.newPage();
    await openShell(page, 'study');
    const opener = page.locator('[data-study-more]');
    await opener.click();
    const sheet = await page.locator('.ui-overlay-panel').boundingBox();
    expect(sheet.y).toBeGreaterThanOrEqual(0);
    expect(sheet.y + sheet.height).toBeLessThanOrEqual(740 + 0.5);
    expect(sheet.width).toBeLessThanOrEqual(360);
    await expect(page.locator('[role="dialog"][aria-modal="true"]')).toBeVisible();
    await page.screenshot({ path: path.join(SHOTS, 'shell-study-sheet-360x740.png') });
    await page.keyboard.press('Escape');
    await expect(page.locator('.ui-overlay')).toHaveCount(0);
    await expect(opener).toBeFocused();
    const dialogBox = await page.evaluate(() => {
      const shell = window.__atomurusShell;
      const content = document.createElement('p');
      content.textContent = 'x '.repeat(2000);
      shell.openDialog({ title: 'Long', content });
      const b = document.querySelector('.ui-overlay-panel').getBoundingClientRect();
      return { top: b.top, bottom: b.bottom };
    });
    expect(dialogBox.top).toBeGreaterThanOrEqual(0);
    expect(dialogBox.bottom).toBeLessThanOrEqual(740 + 0.5);
    await context.close();
  });

  test('keyboard: login uses the right inputs and keeps the CTA visible when the viewport shrinks', async ({ browser }) => {
    const context = await browser.newContext({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true });
    await mockApi(context);
    const page = await context.newPage();
    await openShell(page, 'account');
    const id = page.locator('#app-login-id');
    await expect(id).toHaveAttribute('autocomplete', 'username');
    await expect(id).toHaveAttribute('inputmode', 'email');
    await expect(page.locator('#app-login-pw')).toHaveAttribute('type', 'password');
    await expect(page.locator('#app-login-pw')).toHaveAttribute('autocomplete', 'current-password');
    const fontSize = await id.evaluate((el) => parseFloat(getComputedStyle(el).fontSize));
    expect(fontSize, 'inputs ≥16px so the page does not zoom on focus').toBeGreaterThanOrEqual(16);
    await page.locator('#app-login-pw').focus();
    /* Chromium cannot raise a soft keyboard; shrinking the viewport the way
       Android's adjustResize does is the closest deterministic simulation. */
    await page.setViewportSize({ width: 390, height: 330 });
    await page.waitForTimeout(400);
    const box = await page.locator('[data-login-submit]').boundingBox();
    const navTop = await page.locator('[data-app-nav]').evaluate((el) => (el.offsetParent === null ? Infinity : el.getBoundingClientRect().top));
    expect(navTop, 'bottom bar steps aside while typing').toBe(Infinity);
    expect(box.y).toBeGreaterThanOrEqual(0);
    expect(box.y + box.height, 'CTA above the keyboard and the bottom bar').toBeLessThanOrEqual(Math.min(330, navTop) + 0.5);
    await expect(page.locator('#app-login-pw')).toBeInViewport();
    await page.screenshot({ path: path.join(SHOTS, 'shell-login-keyboard-390x330.png') });
    await context.close();
  });

  test('keyboard: legacy /login keeps its submit reachable at 360 with a shrunk viewport', async ({ browser }) => {
    const context = await browser.newContext({ viewport: { width: 360, height: 740 }, isMobile: true, hasTouch: true });
    await mockApi(context);
    const page = await context.newPage();
    await page.goto('/login');
    const pw = page.locator('input[type="password"]').first();
    await pw.focus();
    await page.setViewportSize({ width: 360, height: 420 });
    await page.waitForTimeout(300);
    await expect(pw).toBeInViewport();
    const submit = page.locator('form button[type="submit"]').first();
    await submit.scrollIntoViewIfNeeded();
    await expect(submit).toBeInViewport();
    await context.close();
  });

  test('offline baseline: shell renders, says offline, no white screen, cached table still opens', async ({ browser }) => {
    const context = await browser.newContext({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true });
    await mockApi(context, { signedIn: true });
    const page = await context.newPage();
    await openShell(page, 'periodic-table'); /* warms the element cache */
    await page.evaluate(() => { location.hash = '#/study'; }); /* on the web, modules load once online */
    await expect(page.locator('[data-study-state="ready"]')).toBeVisible();
    await page.evaluate(() => { location.hash = '#/home'; });
    await context.setOffline(true);
    /* A feature never opened before cannot be fetched offline on the web
       (the packaged app ships it locally): error state with Retry, no white screen. */
    await page.evaluate(() => { location.hash = '#/lab'; });
    await expect(page.locator('[data-feature-failed]')).toBeVisible();
    await expect(page.locator('[data-app-nav]')).toBeVisible();
    await page.evaluate(() => { location.hash = '#/study'; });
    await expect(page.locator('[data-study-state="offline"]')).toBeVisible();
    await expect(page.locator('[data-app-banner][data-status="offline"]')).toBeVisible();
    await page.evaluate(() => { location.hash = '#/periodic-table'; });
    await expect(page.locator('.app-element-row').first()).toBeVisible();
    await page.screenshot({ path: path.join(SHOTS, 'shell-offline-study-390x844.png') });
    await context.close();
  });
});

test.describe('A1.0 safe area', () => {
  const INSETS = [
    { top: 0, bottom: 0 }, { top: 24, bottom: 24 }, { top: 32, bottom: 34 }, { top: 48, bottom: 48 }, { top: 48, bottom: 0 }, { top: 0, bottom: 34 }
  ];
  for (const inset of INSETS) {
    test(`safe area top ${inset.top} / bottom ${inset.bottom}: nothing critical under reserved regions`, async ({ browser }) => {
      const context = await browser.newContext({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true });
      await mockApi(context, { signedIn: true });
      const page = await context.newPage();
      await page.addInitScript(({ top, bottom }) => {
        document.addEventListener('DOMContentLoaded', () => {
          const s = document.documentElement.style;
          s.setProperty('--safe-area-inset-top', `${top}px`);
          s.setProperty('--safe-area-inset-bottom', `${bottom}px`);
          s.setProperty('--safe-area-inset-left', '0px');
          s.setProperty('--safe-area-inset-right', '0px');
        });
      }, inset);
      await openShell(page, 'study');
      const g = await geometry(page);
      expect(g.brand.top, 'brand below the status bar / cutout').toBeGreaterThanOrEqual(inset.top - 0.5);
      for (const item of g.navItems) expect(item.bottom, 'nav above the gesture bar').toBeLessThanOrEqual(g.vh - inset.bottom + 0.5);
      if (g.cta) assertNoOverlap(g.cta, g.nav, 'CTA covered by the bottom bar');

      await page.evaluate(() => window.__atomurusShell.toast('Saved'));
      const toast = await page.locator('.ui-toast').boundingBox();
      expect(toast.y + toast.height, 'toast above nav + gesture bar').toBeLessThanOrEqual(g.nav.top + 0.5);

      await page.locator('[data-study-more]').click();
      const panel = await page.locator('.ui-overlay-panel').boundingBox();
      const close = await page.locator('[data-overlay-close]').boundingBox();
      expect(panel.y).toBeGreaterThanOrEqual(inset.top - 0.5);
      expect(close.y).toBeGreaterThanOrEqual(inset.top - 0.5);
      const lastLink = await page.locator('[data-study-nav]').last().boundingBox();
      expect(lastLink.y + lastLink.height, 'sheet content above the gesture bar').toBeLessThanOrEqual(844 - inset.bottom + 0.5);

      const reported = await page.evaluate(async () => {
        const mod = await import('/src/core/platform/safe-area.js');
        return mod.readSafeAreaFromCss(document);
      });
      expect(reported.top).toBe(inset.top);
      expect(reported.bottom).toBe(inset.bottom);
      if (inset.top === 48 && inset.bottom === 48) await page.screenshot({ path: path.join(SHOTS, 'shell-study-safe-area-48-390x844.png') });
      await context.close();
    });
  }
});

test.describe('A1.0 lazy loading', () => {
  test('app shell: Home and Study load no 3D runtime; Molecules loads it on demand', async ({ browser }) => {
    const context = await browser.newContext({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true });
    await mockApi(context, { signedIn: true });
    const page = await context.newPage();
    const three = [];
    page.on('request', (r) => { if (/three(\.module|\.min)?\.js/.test(r.url())) three.push(r.url()); });
    await openShell(page, 'home');
    expect(three).toEqual([]);
    await page.evaluate(() => { location.hash = '#/study'; });
    await page.waitForFunction(() => window.__atomurusShell.stats().feature === 'study');
    expect(three).toEqual([]);
    expect(await page.evaluate(() => window.__atomurusShell.stats().viewer.renderers)).toBe(0);
    await page.evaluate(() => { location.hash = '#/molecules'; });
    await page.waitForFunction(() => window.__atomurusShell.stats().viewer.renderers === 1);
    expect(three.length).toBe(1);
    await context.close();
  });

  test('legacy pages: Home and /app?section=study do not load Three; the molecule viewer does', async ({ browser }) => {
    const context = await browser.newContext({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true });
    await mockApi(context);
    const page = await context.newPage();
    const three = [];
    page.on('request', (r) => { if (/three(\.module|\.min)?\.js/.test(r.url())) three.push(r.url()); });
    await page.goto('/', { waitUntil: 'load' });
    await page.waitForTimeout(1500);
    expect(three, 'Home').toEqual([]);
    await page.goto('/app?section=study', { waitUntil: 'load' });
    await page.waitForTimeout(1500);
    expect(three, 'Study').toEqual([]);
    await page.goto('/viewer/molecules.html', { waitUntil: 'load' });
    await page.waitForFunction(() => Boolean(window.THREE), null, { timeout: 15000 });
    expect(three.length).toBeGreaterThan(0);
    await context.close();
  });
});
