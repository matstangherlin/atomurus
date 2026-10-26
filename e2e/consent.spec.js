const { test, expect } = require('@playwright/test');

const THIRD = /googletagmanager|google-analytics|googlesyndication|doubleclick|acscdn|adtrafficquality|googleadservices/;

async function arm(page, adsStatus) {
  const hits = [];
  await page.route('**/*', async (route) => {
    const url = route.request().url();
    let host = '';
    try { host = new URL(url).hostname; } catch (_err) { host = ''; }
    if (THIRD.test(url)) {
      hits.push(url);
      await route.abort();
      return;
    }
    if (host && host !== '127.0.0.1' && host !== 'localhost') {
      hits.push(url);
      await route.abort();
      return;
    }
    if (url.includes('/api/ads-config')) {
      const status = adsStatus || 200;
      const body = status === 200
        ? JSON.stringify({ ok: true, adsEnabled: true, signedIn: false, isPro: false, user: null, features: {} })
        : '{"ok":false}';
      await route.fulfill({ status, contentType: 'application/json', body });
      return;
    }
    await route.continue();
  });
  return hits;
}

function adHits(hits) {
  return hits.filter((url) => /googlesyndication|acscdn|doubleclick|adtrafficquality|googleadservices/.test(url));
}

function measureHits(hits) {
  return hits.filter((url) => /googletagmanager|google-analytics|googlesyndication|doubleclick|acscdn/.test(url));
}

test('a new visitor triggers no analytics or ad host for 6 seconds', async ({ page }) => {
  const hits = await arm(page);
  await page.goto('/');
  await page.waitForTimeout(6000);
  expect(measureHits(hits)).toEqual([]);
  await expect(page.locator('#aco-cookie-banner')).toBeVisible();
});

test('accept grants Consent Mode without a reload and reject deletes _ga', async ({ page }) => {
  const hits = await arm(page);
  await page.addInitScript(() => {
    document.cookie = '_ga=x; path=/';
    document.cookie = '_ga_TEST=x; path=/';
  });
  await page.goto('/');
  await page.locator('#aco-cc-accept').click();
  await expect.poll(() => measureHits(hits).some((url) => /googletagmanager/.test(url))).toBe(true);
  const granted = await page.evaluate(() => (window.dataLayer || []).some((entry) => entry && entry[0] === 'consent' && entry[1] === 'update' && entry[2] && entry[2].analytics_storage === 'granted' && entry[2].ad_storage === 'granted'));
  expect(granted).toBe(true);
  expect(page.url()).toMatch(/\/$/);

  const second = await page.context().browser().newContext();
  const other = await second.newPage();
  const otherHits = await arm(other);
  await other.addInitScript(() => {
    document.cookie = '_ga=x; path=/';
    document.cookie = '_ga_TEST=x; path=/';
  });
  await other.goto('/');
  await other.locator('#aco-cc-reject').click();
  await other.waitForTimeout(500);
  const cookie = await other.evaluate(() => document.cookie);
  expect(cookie).not.toMatch(/_ga/);
  expect(measureHits(otherHits)).toEqual([]);
  await second.close();
});

test('configure stores one category and keeps it after reload', async ({ page }) => {
  await arm(page);
  await page.goto('/');
  await page.locator('#aco-cc-configure').click();
  await page.locator('#aco-cc-analytics').check();
  await page.locator('#aco-cc-ads').uncheck();
  await page.locator('#aco-cc-save').click();
  await page.reload();
  const state = await page.evaluate(() => window.atomurusConsent.get());
  expect(state.analytics).toBe(true);
  expect(state.ads).toBe(false);
  await expect(page.locator('#aco-cookie-banner')).toBeHidden();
});

test('ads-config failure loads no ad script after accept', async ({ page }) => {
  const hits = await arm(page, 500);
  await page.goto('/');
  await page.locator('#aco-cc-accept').click();
  await page.waitForTimeout(800);
  expect(adHits(hits)).toEqual([]);
});

test('the banner stays within a quarter of a phone screen', async ({ page }) => {
  await arm(page);
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/');
  const box = await page.locator('#aco-cookie-banner').boundingBox();
  expect(box.height).toBeLessThanOrEqual(844 * 0.25 + 1);
  expect(box.x).toBeGreaterThanOrEqual(0);
  expect(box.x + box.width).toBeLessThanOrEqual(391);
});

test('Manage cookies reopens the panel on the main public pages', async ({ browser }) => {
  const pages = [
    '/',
    '/periodic-table',
    '/periodic-table/actinium.en.html',
    '/calculators',
    '/pricing',
    '/login',
    '/privacy.html',
    '/explore/what-is-an-atom.html',
    '/viewer/molecules.html',
    '/404.html'
  ];
  for (const path of pages) {
    const context = await browser.newContext();
    const page = await context.newPage();
    await arm(page);
    await page.addInitScript(() => {
      localStorage.setItem('atomurus-cookie-consent', 'rejected');
    });
    await page.goto(path);
    const manage = page.locator('[data-consent-manage]').first();
    await manage.scrollIntoViewIfNeeded();
    await manage.click();
    await expect(page.locator('#aco-cookie-banner')).toBeVisible();
    await context.close();
  }
});

test('the Portuguese home offers Gerenciar cookies', async ({ browser }) => {
  const context = await browser.newContext({ locale: 'pt-BR' });
  const page = await context.newPage();
  await arm(page);
  await page.addInitScript(() => {
    localStorage.setItem('atomurus-lang', 'pt');
    localStorage.setItem('atomurus-cookie-consent', 'rejected');
  });
  await page.goto('/index.pt.html');
  const manage = page.locator('[data-consent-manage]').first();
  await expect(manage).toContainText('Gerenciar cookies');
  await manage.click();
  await expect(page.locator('#aco-cookie-banner')).toContainText('Configurar');
  await context.close();
});
