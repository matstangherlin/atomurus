const { test, expect } = require('@playwright/test');

const AD = /pagead2|googlesyndication|googletagmanager|google-analytics|doubleclick|acscdn|adtrafficquality|googleadservices/i;
const PAGES = [
  { url: '/', viewer: false },
  { url: '/periodic-table/trends.html', viewer: false },
  { url: '/viewer/molecules.html', viewer: true },
  { url: '/viewer/atomic-models.html', viewer: true },
  { url: '/viewer/isomerism/constitutional/function.html', viewer: true },
  { url: '/contact.html', viewer: false }
];

function hostOf(raw) {
  try { return new URL(raw).hostname; } catch { return ''; }
}

async function arm(page, bag) {
  await page.route('**/*', async (route) => {
    const raw = route.request().url();
    const host = hostOf(raw);
    if (host && host !== '127.0.0.1' && host !== 'localhost') {
      if (AD.test(raw)) bag.ads.add(host);
      if (/hammer(?:\.min)?\.js/i.test(raw)) bag.hammer = true;
      if (/three(?:\.min)?\.js/i.test(raw)) bag.three = true;
      if (/recaptcha/i.test(raw)) bag.recaptcha = true;
      await route.abort();
      return;
    }
    const url = new URL(raw);
    if (url.pathname === '/api/ads-config') {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ ok: true, adsEnabled: true, signedIn: false, isPro: false, user: null, features: {} })
      });
      return;
    }
    if (url.pathname.startsWith('/api/')) {
      await route.fulfill({ status: 404, contentType: 'application/json', body: '{"ok":false}' });
      return;
    }
    await route.continue();
  });
}

async function scroll(page) {
  await page.evaluate(async () => {
    const height = Math.max(document.body.scrollHeight, document.documentElement.scrollHeight);
    const step = Math.max(240, window.innerHeight || 800);
    for (let y = 0; y < height; y += step) {
      window.scrollTo(0, y);
      await new Promise((resolve) => setTimeout(resolve, 30));
    }
  });
}

async function phase(browser, url, name, viewer) {
  const context = await browser.newContext({ viewport: { width: 1280, height: 800 } });
  const page = await context.newPage();
  const bag = { ads: new Set(), hammer: false, three: false, recaptcha: false };
  await arm(page, bag);
  await page.goto(url, { waitUntil: 'load' });
  await page.locator('#aco-cc-reject').waitFor({ state: 'visible', timeout: 8000 });
  if (viewer) {
    const near = await page.evaluate(() => {
      const el = document.getElementById('viewer3d') || document.getElementById('iso-3d-canvas');
      if (!el) return false;
      const rect = el.getBoundingClientRect();
      const vh = window.innerHeight || 800;
      return rect.top < vh + 240 && rect.bottom > -240;
    });
    if (!near) expect(bag.three, `${url} loads Three before the viewer is near`).toBe(false);
  }
  if (name === 'B') await page.locator('#aco-cc-reject').click();
  if (name === 'C') await page.locator('#aco-cc-accept').click();
  const started = Date.now();
  await scroll(page);
  const left = 8000 - (Date.now() - started);
  if (name !== 'C' && left > 0) await page.waitForTimeout(left);
  if (name === 'C') {
    await expect.poll(() => bag.ads.size, { timeout: 8000 }).toBeGreaterThan(0);
  }
  const result = {
    ads: [...bag.ads],
    hammer: bag.hammer,
    three: bag.three,
    recaptcha: bag.recaptcha
  };
  await context.close();
  return result;
}

for (const spec of PAGES) {
  test(`third parties on ${spec.url}`, async ({ browser }) => {
    test.setTimeout(90_000);
    const fresh = await phase(browser, spec.url, 'A', spec.viewer);
    expect(fresh.ads, 'phase A ad/measurement hosts').toEqual([]);
    expect(fresh.hammer, 'phase A hammer').toBe(false);

    const refused = await phase(browser, spec.url, 'B', spec.viewer);
    expect(refused.ads, 'phase B ad/measurement hosts').toEqual([]);
    expect(refused.hammer, 'phase B hammer').toBe(false);

    const accepted = await phase(browser, spec.url, 'C', spec.viewer);
    expect(accepted.ads.length, 'phase C ad/measurement hosts').toBeGreaterThan(0);
    if (spec.url === '/contact.html') expect(fresh.recaptcha).toBe(true);
  });
}
