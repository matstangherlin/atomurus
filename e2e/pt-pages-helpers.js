// Shared set-up for the periodic table pages: no third parties, Chart.js stubbed,
// the same central action per page for the e2e spec and tools/coverage-pt.mjs.
const fs = require('fs');
const path = require('path');

const CHART_STUB = fs.readFileSync(path.join(__dirname, 'fixtures', 'chart-stub.js'), 'utf8');

const PT_PAGES = [
  { key: 'table', en: '/periodic-table.html', pt: '/periodic-table.pt.html' },
  { key: 'heatmap', en: '/periodic-table/heatmap.html', pt: '/periodic-table/heatmap.pt.html' },
  { key: 'trends', en: '/periodic-table/trends.html', pt: '/periodic-table/trends.pt.html' },
  { key: 'compare', en: '/periodic-table/compare.html', pt: '/periodic-table/compare.pt.html' },
  { key: 'isotopes', en: '/periodic-table/isotopes.html', pt: '/periodic-table/isotopes.pt.html' }
];

const THIRD_PARTY = /googlesyndication|googletagmanager|google-analytics|gstatic|doubleclick|adservice|fundingchoices|cloudflareinsights|cdnjs\.cloudflare\.com|fonts\.googleapis|fonts\.gstatic/;

async function isolate(context, lang) {
  await context.addInitScript((value) => {
    try {
      localStorage.setItem('atomurus-cookie-consent', 'rejected');
      if (value) localStorage.setItem('atomurus-lang', value);
    } catch (_err) {}
  }, lang || '');
  await context.route((url) => url.pathname.startsWith('/api/'), (route) => {
    const url = new URL(route.request().url());
    const body = url.pathname === '/api/ads-config'
      ? { ok: true, signedIn: false, adsEnabled: false, isPro: false, user: null, features: {} }
      : { ok: false, code: url.pathname === '/api/auth/me' ? 'session_expired' : 'not_found' };
    return route.fulfill({ status: url.pathname === '/api/ads-config' ? 200 : 401, contentType: 'application/json', body: JSON.stringify(body) });
  });
  // Playwright tries the most recently added route first: block, then carve out the stubs.
  await context.route(THIRD_PARTY, (route) => route.abort());
  await context.route(/cdn\.jsdelivr\.net/, (route) => route.abort());
  await context.route(/cdn\.jsdelivr\.net\/npm\/chart\.js(\?|$)/, (route) => route.fulfill({ status: 200, contentType: 'text/javascript', body: CHART_STUB }));
  await context.route(/cdn\.jsdelivr\.net\/npm\/chartjs-plugin-zoom/, (route) => route.fulfill({ status: 200, contentType: 'text/javascript', body: 'window.ChartZoom = {};' }));
}

// The one thing each page is for. Returns a short description of what it checked.
async function centralAct(page, key) {
  if (key === 'table') {
    await page.locator('.el[data-z="26"]').click();
    await page.locator('#overlay.open').waitFor();
    await page.keyboard.press('Escape');
    await page.locator('#search-input').fill('Fe');
    return 'modal + search';
  }
  if (key === 'heatmap') {
    await page.locator('#hm-select').selectOption('radius');
    await page.waitForFunction(() => document.querySelectorAll('.el[style*="background"]').length > 50);
    return 'heatmap radius';
  }
  if (key === 'trends') {
    await page.waitForFunction(() => (window.__charts || []).some((c) => (c.data.labels || []).length > 10));
    await page.evaluate(() => {
      const select = document.getElementById('trend-prop');
      select.value = 'radius';
      select.dispatchEvent(new Event('change', { bubbles: true }));
    });
    await page.waitForFunction(() => (window.__charts || []).filter((c) => !c.destroyed).length > 0);
    return 'trend chart';
  }
  if (key === 'compare') {
    // The public page shows the Pro teaser and hides the selectors
    // (body[data-compare-canonical="pro-lab"]), but the compare code still runs:
    // drive it through the same handlers the hidden buttons call.
    await page.locator('[data-pro-canonical="element-compare"] a').waitFor();
    await page.waitForFunction(() => document.querySelectorAll('#cmp-picker-grid .cmp-picker-cell').length === 118);
    await page.evaluate(() => {
      openCompPicker(1); selectCompElement(26);
      openCompPicker(2); selectCompElement(29);
    });
    // renderCompare() returns early on the canonical (Pro) page; the selection is what changes.
    await page.waitForFunction(() => cmpSelection[1] === 26 && cmpSelection[2] === 29);
    return 'compare Fe × Cu';
  }
  if (key === 'isotopes') {
    await page.locator('#iso-list .iso-item[data-z="6"]').click();
    await page.waitForFunction(() => document.getElementById('iso-sym').textContent === 'C');
    return 'isotopes of carbon';
  }
  throw new Error('unknown page ' + key);
}

module.exports = { PT_PAGES, CHART_STUB, isolate, centralAct };
