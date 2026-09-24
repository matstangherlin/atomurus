// A1.0 — lifecycle stress: viewer open/close ×20, navigation stress, auth
// stress with background/resume, legacy molecule viewer memory QA.
// Memory is read through CDP after a forced GC, so growth numbers are real
// JS heap, not estimates.
const { test, expect } = require('@playwright/test');
const fs = require('fs');
const path = require('path');

const THREE_MIN = path.join(__dirname, '..', 'node_modules', 'three', 'build', 'three.min.js');
const REPORT = path.join(__dirname, '..', 'docs', 'reports', 'a1-0-lifecycle-results.json');
const results = {};

const json = (route, status, body) => route.fulfill({ status, contentType: 'application/json', body: JSON.stringify(body) });

function authServer() {
  const state = { signedIn: false, logins: 0, refreshes: 0, logouts: 0 };
  const user = { id: '11111111-2222-4333-8444-555555555555', email: 'ada@example.com', displayName: 'Ada', isPro: true, plan: 'paid', features: { studySets: true } };
  return {
    state,
    async install(context) {
      await context.route((url) => url.pathname.startsWith('/api/'), (route) => {
        const url = new URL(route.request().url());
        if (url.pathname === '/api/auth/login') { state.signedIn = true; state.logins += 1; return json(route, 200, { ok: true, user }); }
        if (url.pathname === '/api/auth/logout') { state.signedIn = false; state.logouts += 1; return json(route, 200, { ok: true }); }
        if (url.pathname === '/api/auth/refresh') { state.refreshes += 1; return state.signedIn ? json(route, 200, { ok: true, user }) : json(route, 401, { ok: false }); }
        if (url.pathname === '/api/auth/me') return state.signedIn ? json(route, 200, { ok: true, user }) : json(route, 401, { ok: false, code: 'session_expired' });
        if (url.pathname === '/api/study/sets') return state.signedIn ? json(route, 200, { ok: true, sets: [{ id: 's1', title: 'Acids', dueCount: 2 }] }) : json(route, 401, { ok: false, code: 'session_expired' });
        return json(route, 404, { ok: false });
      });
      await context.route(/googlesyndication|googletagmanager|google-analytics|gstatic|doubleclick|jsdelivr/, (r) => r.abort());
      await context.route(/cdnjs\.cloudflare\.com\/.*three\.min\.js/, (r) => r.fulfill({ status: 200, contentType: 'text/javascript', body: fs.readFileSync(THREE_MIN) }));
    }
  };
}

async function heapMB(page, cdp) {
  await cdp.send('HeapProfiler.collectGarbage');
  await page.waitForTimeout(50);
  const { metrics } = await cdp.send('Performance.getMetrics');
  const used = metrics.find((m) => m.name === 'JSHeapUsedSize').value;
  return Math.round((used / 1048576) * 100) / 100;
}

async function go(page, route) {
  await page.evaluate((r) => { location.hash = `#/${r}`; }, route);
  await page.waitForFunction((r) => {
    const s = window.__atomurusShell && window.__atomurusShell.stats();
    return s && s.featureState === 'ready' && location.hash === `#/${r}`;
  }, route);
}

test.describe.configure({ mode: 'serial' });

test.afterAll(() => {
  fs.mkdirSync(path.dirname(REPORT), { recursive: true });
  fs.writeFileSync(REPORT, `${JSON.stringify({ generatedBy: 'e2e/a1-lifecycle.spec.js', chromium: 'headless, SwiftShader WebGL', ...results }, null, 2)}\n`);
});

test('molecule viewer open/close ×20: one renderer, one loop, bounded heap', async ({ browser }) => {
  const context = await browser.newContext({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true });
  await authServer().install(context);
  const page = await context.newPage();
  const cdp = await context.newCDPSession(page);
  await cdp.send('Performance.enable');
  const errors = [];
  page.on('pageerror', (e) => errors.push(e.message));
  await page.goto('/dev/app-shell.html#/home');
  await page.waitForFunction(() => window.__atomurusShell && window.__atomurusShell.stats().featureState === 'ready');

  const samples = [];
  for (let i = 1; i <= 20; i += 1) {
    await go(page, 'molecules');
    await page.waitForFunction(() => window.__atomurusShell.stats().viewer.renderers === 1);
    const open = await page.evaluate(() => window.__atomurusShell.stats());
    expect(open.viewer).toEqual({ renderers: 1, loops: 1 });
    await go(page, 'explore');
    const closed = await page.evaluate(() => window.__atomurusShell.stats());
    expect(closed.viewer).toEqual({ renderers: 0, loops: 0 });
    expect(closed.lifecycleSubscribers).toBe(0);
    expect(await page.locator('canvas').count()).toBe(0);
    if (i === 1 || i === 5 || i === 10 || i === 20) samples.push({ cycle: i, heapMB: await heapMB(page, cdp) });
  }
  const growth = samples[samples.length - 1].heapMB - samples[1].heapMB;
  results.moleculeViewerCycles = { cycles: 20, samples, growthMB_5_to_20: Math.round(growth * 100) / 100 };
  expect(growth, `heap grew ${growth} MB between cycle 5 and 20`).toBeLessThan(2);
  expect(errors).toEqual([]);
  await context.close();
});

test('navigation stress: Home → Study → Lab → Periodic → Molecule → Study ×10', async ({ browser }) => {
  const context = await browser.newContext({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true });
  const server = authServer();
  server.state.signedIn = true;
  await server.install(context);
  const page = await context.newPage();
  const cdp = await context.newCDPSession(page);
  await cdp.send('Performance.enable');
  const errors = [];
  page.on('pageerror', (e) => errors.push(e.message));
  await page.goto('/dev/app-shell.html#/home');
  await page.waitForFunction(() => window.__atomurusShell && window.__atomurusShell.stats().featureState === 'ready');
  const baseline = await page.evaluate(() => window.__atomurusShell.stats());
  const heap = [];
  const loopTimes = [];
  for (let i = 0; i < 10; i += 1) {
    const t0 = Date.now();
    for (const route of ['home', 'study', 'lab', 'periodic-table', 'molecules', 'study']) await go(page, route);
    loopTimes.push(Date.now() - t0);
    const s = await page.evaluate(() => window.__atomurusShell.stats());
    expect(s.navCount, 'no duplicated navigation').toBe(1);
    expect(s.shellListeners, 'shell listeners do not accumulate').toBe(baseline.shellListeners);
    expect(s.mountedFeatures).toBe(1);
    expect(s.viewer).toEqual({ renderers: 0, loops: 0 });
    expect(s.lifecycleSubscribers).toBe(0);
    expect(s.liveScopes, 'scopes do not accumulate').toBeLessThanOrEqual(baseline.liveScopes + 1);
    if (i === 1 || i === 9) heap.push({ round: i + 1, heapMB: await heapMB(page, cdp) });
    expect(await page.locator('[data-app-shell]').count(), 'no white screen / duplicated shell').toBe(1);
  }
  const growth = heap[1].heapMB - heap[0].heapMB;
  results.navigationStress = { rounds: 10, routesPerRound: 6, heap, growthMB: Math.round(growth * 100) / 100, msPerRoundMedian: loopTimes.sort((a, b) => a - b)[5] };
  expect(growth).toBeLessThan(2);
  expect(errors).toEqual([]);
  await context.close();
});

test('auth stress: login → refresh → navigate → background → resume → logout ×5', async ({ browser }) => {
  const context = await browser.newContext({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true });
  const server = authServer();
  await server.install(context);
  const page = await context.newPage();
  const errors = [];
  page.on('pageerror', (e) => errors.push(e.message));
  await page.goto('/dev/app-shell.html#/account');
  await page.waitForFunction(() => window.__atomurusShell && window.__atomurusShell.stats().featureState === 'ready');

  async function setVisibility(state) {
    await page.evaluate((s) => {
      Object.defineProperty(document, 'visibilityState', { configurable: true, get: () => s });
      document.dispatchEvent(new Event('visibilitychange'));
    }, state);
  }

  for (let i = 0; i < 5; i += 1) {
    await go(page, 'account');
    await page.locator('#app-login-id').fill('ada@example.com');
    await page.locator('#app-login-pw').fill('correct horse!');
    await page.locator('[data-login-submit]').click();
    await expect(page.locator('[data-account="signed-in"]')).toBeVisible();
    await expect(page.locator('[data-app-shell]')).toHaveAttribute('data-signed-in', 'true');

    const refreshed = await page.evaluate(() => window.__atomurusServices.auth.refresh());
    expect(refreshed.signedIn).toBe(true);

    await go(page, 'study');
    await expect(page.locator('[data-study-state="ready"]')).toBeVisible();
    await go(page, 'molecules');
    await page.waitForFunction(() => window.__atomurusShell.stats().viewer.loops === 1);

    await setVisibility('hidden');
    /* Background keeps the session and the viewer instance (no reload on
       resume); draws stopping is asserted in the dedicated test below. */
    const paused = await page.evaluate(() => window.__atomurusShell.stats().viewer);
    expect(paused.renderers).toBe(1);
    await setVisibility('visible');
    await expect(page.locator('[data-app-shell]')).toHaveAttribute('data-signed-in', 'true');

    await go(page, 'account');
    await page.locator('[data-account-signout]').click();
    await expect(page.locator('[data-login-form]')).toBeVisible();
    await expect(page.locator('[data-app-shell]')).toHaveAttribute('data-signed-in', 'false');
  }
  const s = await page.evaluate(() => window.__atomurusShell.stats());
  expect(s.navCount).toBe(1);
  expect(server.state.logins).toBe(5);
  expect(server.state.logouts).toBe(5);
  expect(server.state.refreshes).toBe(5);
  results.authStress = { cycles: 5, logins: server.state.logins, refreshes: server.state.refreshes, logouts: server.state.logouts, finalStats: s };
  expect(errors).toEqual([]);
  await context.close();
});

test('background pauses the app-shell render loop (no invisible GPU work)', async ({ browser }) => {
  const context = await browser.newContext({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true });
  await authServer().install(context);
  const page = await context.newPage();
  await page.goto('/dev/app-shell.html#/molecules');
  await page.waitForFunction(() => window.__atomurusShell && window.__atomurusShell.stats().viewer.renderers === 1);
  const renders = () => page.evaluate(() => new Promise((resolve) => {
    const canvas = document.querySelector('.viewer-canvas');
    const ctx = canvas.getContext('webgl2') || canvas.getContext('webgl');
    const orig = ctx.drawElements.bind(ctx);
    let draws = 0;
    ctx.drawElements = (...a) => { draws += 1; return orig(...a); };
    setTimeout(() => { ctx.drawElements = orig; resolve(draws); }, 400);
  }));
  expect(await renders()).toBeGreaterThan(0);
  await page.evaluate(() => {
    Object.defineProperty(document, 'visibilityState', { configurable: true, get: () => 'hidden' });
    document.dispatchEvent(new Event('visibilitychange'));
  });
  expect(await renders(), 'no draws while in background').toBe(0);
  await page.evaluate(() => {
    Object.defineProperty(document, 'visibilityState', { configurable: true, get: () => 'visible' });
    document.dispatchEvent(new Event('visibilitychange'));
  });
  expect(await renders()).toBeGreaterThan(0);
  await context.close();
});

test('legacy molecule viewer page: switching molecules ×20 keeps GPU resources flat', async ({ browser }) => {
  const context = await browser.newContext({ viewport: { width: 1280, height: 800 } });
  await authServer().install(context);
  const page = await context.newPage();
  const cdp = await context.newCDPSession(page);
  await cdp.send('Performance.enable');
  await page.goto('/viewer/molecules.html');
  await page.locator('#viewer3d').scrollIntoViewIfNeeded();
  await page.waitForFunction(() => typeof window.setMolecule === 'function' && typeof window.__atomurusPaperStats === 'function' && window.__atomurusPaperStats(), null, { timeout: 20000 });
  const keys = ['water', 'methane', 'ethanol', 'co2', 'ammonia'];
  const samples = [];
  for (let i = 1; i <= 20; i += 1) {
    await page.evaluate((k) => window.setMolecule(k), keys[i % keys.length]);
    await page.waitForTimeout(120);
    if (i === 5 || i === 20) {
      const stats = await page.evaluate(() => window.__atomurusPaperStats());
      samples.push({ switch: i, geometries: stats.geometries, textures: stats.textures, calls: stats.calls, heapMB: await heapMB(page, cdp) });
    }
  }
  results.legacyMoleculeViewer = { switches: 20, samples };
  expect(samples[1].geometries - samples[0].geometries).toBeLessThanOrEqual(2);
  expect(samples[1].heapMB - samples[0].heapMB).toBeLessThan(3);
  await context.close();
});
