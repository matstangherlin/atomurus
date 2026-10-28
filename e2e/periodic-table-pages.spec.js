// Characterisation of the periodic table pages (prompt 24): must pass before and
// after periodic-table.js is split into a core and per-page modules.
const { test, expect } = require('@playwright/test');
const { PT_PAGES, isolate, centralAct } = require('./pt-pages-helpers');

// What changes on screen when the language switches, per page (after the central act).
const LANGUAGE_PROBE = {
  table: '.el[data-z="26"] .el-name',
  heatmap: '.el[data-z="26"] .el-name',
  trends: '.pt-tab.active',
  compare: '[data-pro-canonical="element-compare"] p',
  isotopes: '#iso-name'
};

for (const spec of PT_PAGES) {
  for (const lang of ['en', 'pt']) {
    const url = spec[lang];
    test(`${url}: loads clean, searches, opens the modal, does its job, switches language`, async ({ context, page }) => {
      await isolate(context, lang);
      const errors = [];
      page.on('pageerror', (err) => errors.push('pageerror: ' + err.message));
      page.on('console', (msg) => {
        if (msg.type() !== 'error') return;
        const text = msg.text();
        // Blocked third parties and the signed-out /api answers are expected here.
        if (/Failed to load resource|net::ERR_FAILED|ERR_BLOCKED_BY_CLIENT|status of 40[14]/.test(text)) return;
        errors.push('console: ' + text);
      });
      await page.goto(url);
      await page.waitForFunction(() => typeof ELEMENTS !== 'undefined' && ELEMENTS.length === 118);

      const table = page.locator('#ptable');
      if (await table.isVisible()) await expect(page.locator('#ptable .el')).toHaveCount(118);

      // Search «Fe» and open its modal: from the suggestions (table), from the
      // highlighted cell (heatmap), or directly where the page has no grid.
      await page.locator('#search-input').fill('Fe');
      if (await page.locator('#search-suggestions').count()) {
        await page.locator('#search-suggestions .search-suggestion').first().waitFor();
        await page.locator('#search-input').press('Enter');
      } else if (await page.locator('.el[data-z="26"]').isVisible()) {
        await page.locator('.el.shine[data-z="26"]').waitFor();
        await page.locator('.el[data-z="26"]').click();
      } else {
        await page.evaluate(() => openModal(ELEMENTS.find((e) => e.z === 26)));
      }
      await expect(page.locator('#overlay')).toHaveClass(/\bopen\b/);
      await expect(page.locator('#m-sym')).toHaveText('Fe');
      await page.keyboard.press('Escape');
      await expect(page.locator('#overlay')).not.toHaveClass(/\bopen\b/);
      await page.locator('#search-input').fill('');

      await centralAct(page, spec.key);

      const probe = page.locator(LANGUAGE_PROBE[spec.key]).first();
      const before = (await probe.textContent()).trim();
      const charts = await page.evaluate(() => (window.__charts || []).length);
      await page.locator('[data-i18n-toggle]').first().click();
      await expect(page.locator('html')).toHaveAttribute('lang', lang === 'en' ? /^pt/ : /^en/);
      if (spec.key === 'trends') {
        await expect.poll(() => page.evaluate(() => (window.__charts || []).length)).toBeGreaterThan(charts);
      }
      await expect.poll(async () => (await probe.textContent()).trim()).not.toBe(before);

      expect(errors).toEqual([]);
    });
  }
}

// Export lives in assets/pt/pt-export.js and is fetched on the first click.
test('element PNG export loads its module on demand, once', async ({ context, page }) => {
  await isolate(context, 'en');
  const errors = [];
  page.on('pageerror', (err) => errors.push(err.message));
  const exportRequests = [];
  page.on('request', (req) => { if (/assets\/pt\/pt-export\.js/.test(req.url())) exportRequests.push(req.url()); });
  await page.goto('/periodic-table.html');
  await page.waitForFunction(() => typeof ELEMENTS !== 'undefined' && ELEMENTS.length === 118);
  expect(exportRequests).toEqual([]);
  await page.locator('.el[data-z="26"]').click();
  const download = page.waitForEvent('download');
  await page.locator('#modal .modal-dl-btn').first().click();
  expect((await download).suggestedFilename()).toBe('atomurus-fe.png');
  expect(exportRequests).toHaveLength(1);
  expect(exportRequests[0]).toMatch(/\?v=\d+$/);
  // The module's own function replaced the stub; a second export does not fetch again.
  const second = page.waitForEvent('download');
  await page.locator('#modal .modal-dl-btn').first().click();
  await second;
  expect(exportRequests).toHaveLength(1);
  expect(errors).toEqual([]);
});

test('if the export module cannot load, the page says so and keeps working', async ({ context, page }) => {
  await isolate(context, 'pt');
  await context.route(/assets\/pt\/pt-export\.js/, (route) => route.abort());
  const dialogs = [];
  page.on('dialog', async (dialog) => { dialogs.push(dialog.message()); await dialog.dismiss(); });
  const errors = [];
  page.on('pageerror', (err) => errors.push(err.message));
  await page.goto('/periodic-table.pt.html');
  await page.waitForFunction(() => typeof ELEMENTS !== 'undefined' && ELEMENTS.length === 118);
  await page.locator('.el[data-z="26"]').click();
  await page.locator('#modal .modal-dl-btn').first().click();
  await expect.poll(() => dialogs.length).toBe(1);
  expect(dialogs[0]).toContain('Não foi possível carregar a ferramenta de exportação');
  await expect(page.locator('html')).not.toHaveClass(/pt-export-loading/);
  await page.keyboard.press('Escape');
  await expect(page.locator('#overlay')).not.toHaveClass(/\bopen\b/);
  expect(errors).toEqual([]);
});
