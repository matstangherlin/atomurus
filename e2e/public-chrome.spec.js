const { test, expect } = require('@playwright/test');
const path = require('node:path');
const fs = require('node:fs');

const SHOTS = path.resolve(__dirname, '../test-results/e2e-screenshots');

function saveShot(page, name) {
  fs.mkdirSync(SHOTS, { recursive: true });
  return page.screenshot({ path: path.join(SHOTS, `${name}.png`), fullPage: true });
}

async function fontFamily(locator) {
  return locator.evaluate((el) => getComputedStyle(el).fontFamily);
}

test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => {
    localStorage.setItem('atomurus-cookie-consent', 'rejected');
    localStorage.setItem('atomurus-lang', 'en');
    localStorage.setItem('atomurus-theme', 'light');
  });
});

test('public home uses workspace chrome, not lab-console ticker', async ({ page }) => {
  await page.goto('/index.html');
  await expect(page.locator('.ps-shell')).toBeVisible();
  await expect(page.locator('.ps-pub-sidebar')).toBeVisible();
  await expect(page.locator('.lc-topnav-name')).toBeVisible();
  await expect.poll(() => fontFamily(page.locator('.lc-topnav-name'))).toMatch(/Instrument Serif/i);
  await expect(page.locator('.lc-tn-no').first()).toBeHidden();
  await expect(page.locator('.lc-topnav-links')).toBeHidden();
  await expect(page.locator('.lc-landing .data-strip, .data-strip').first()).toBeHidden();
  await expect(page.locator('.lc-statusbar')).toBeHidden();

  const areas = await page.locator('.ps-shell').evaluate((el) => getComputedStyle(el).gridTemplateAreas);
  expect(areas).toMatch(/topbar/);

  await expect(page.locator('.lc-hero-title')).toBeVisible();
  await expect(page.locator('#preview-grid .lc-preview-cell').first()).toBeVisible();
  await expect(page.locator('.lc-mod-card')).toHaveCount(4);
  const openBg = await page.locator('.lc-mod-go').first().evaluate((el) => getComputedStyle(el).backgroundColor);
  expect(openBg).toMatch(/rgb\(\s*30,\s*106,\s*80\s*\)/);
  await expect(page.locator('.lc-footer-bottom > span:has(.lc-st-dot)')).toBeHidden();
  await saveShot(page, 'desktop-public-home');
});

test('public table, calculators, login and pricing share the new chrome', async ({ page }) => {
  await page.goto('/periodic-table.html');
  await expect(page.locator('.ps-shell')).toBeVisible();
  await expect(page.locator('.ps-shell > .topbar .logo-text')).toBeVisible();
  await expect.poll(() => fontFamily(page.locator('.ps-shell > .topbar .logo-text'))).toMatch(/Instrument Serif/i);
  await expect(page.locator('.nl-no').first()).toBeHidden();
  await expect(page.locator('.data-strip').first()).toBeHidden();
  const shell = await page.locator('.ps-shell').evaluate((el) => {
    const s = getComputedStyle(el);
    return { areas: s.gridTemplateAreas, columns: s.gridTemplateColumns };
  });
  expect(shell.areas).toMatch(/topbar/);
  expect(shell.columns.split(/\s+/).filter(Boolean).length).toBeGreaterThanOrEqual(2);
  const brandInTopbar = await page.locator('.ps-shell > .topbar .logo-wrap').count();
  expect(brandInTopbar).toBe(1);
  await expect(page.locator('.ps-shell > .topbar .breadcrumb')).toBeHidden();
  const dlBg = await page.locator('#dl-action-btn').evaluate((el) => getComputedStyle(el).backgroundColor);
  expect(dlBg).toMatch(/rgb\(\s*30,\s*106,\s*80\s*\)/);
  const tabColor = await page.locator('.pt-tab.active').evaluate((el) => getComputedStyle(el).color);
  expect(tabColor).toMatch(/rgb\(\s*30,\s*106,\s*80\s*\)/);
  const tabBg = await page.locator('.pt-tab.active').evaluate((el) => getComputedStyle(el).backgroundColor);
  expect(tabBg).not.toBe('rgb(20, 18, 14)');
  await page.locator('.legend-item[data-cat="nonmetal"]').click();
  const legendColor = await page.locator('.legend-item.active-filter').evaluate((el) => getComputedStyle(el).color);
  expect(legendColor).toMatch(/rgb\(\s*30,\s*106,\s*80\s*\)/);
  const legendBg = await page.locator('.legend-item.active-filter').evaluate((el) => getComputedStyle(el).backgroundColor);
  expect(legendBg).not.toBe('rgb(20, 18, 14)');
  await expect(page.locator('.el[data-z="1"]')).toBeVisible({ timeout: 15_000 });
  await saveShot(page, 'desktop-public-table');

  await page.goto('/calculators.html');
  await expect(page.locator('.ps-shell')).toBeVisible();
  await expect(page.locator('.ps-shell > .topbar .mobile-menu-btn')).toBeHidden();
  await expect(page.locator('.ps-shell .nav-label')).toBeHidden();
  await expect(page.locator('.sidebar-foot a[href*="login"]')).toBeVisible();
  await expect(page.locator('.sidebar-foot a[href*="pricing"]')).toBeVisible();
  await expect(page.locator('.data-strip').first()).toBeHidden();
  await expect.poll(() => fontFamily(page.locator('.ph-title'))).toMatch(/Instrument Serif/i);
  const innerMax = await page.locator('.content-inner').evaluate((el) => getComputedStyle(el).maxWidth);
  expect(innerMax).toBe('none');
  await expect(page.locator('.calc-menu-item[data-target="molar"]')).toBeVisible();
  await expect(page.locator('.calc-menu-item[data-target="scientific"]')).toBeVisible();
  const idealTitle = page.locator('.calc-menu-item[data-target="ideal"] .calc-menu-title');
  await expect(idealTitle).toHaveText(/Ideal Gas/);
  const idealGrid = await page.locator('.calc-menu-item[data-target="ideal"]').evaluate((el) => getComputedStyle(el).gridTemplateColumns);
  expect(idealGrid.split(/\s+/).filter(Boolean)).toHaveLength(2);
  const titleFits = await idealTitle.evaluate((el) => el.scrollWidth <= el.clientWidth + 1);
  expect(titleFits).toBe(true);
  await expect(page.locator('#mm-result-body')).not.toContainText('Â');
  await page.locator('.calc-chip[data-mm-example="H2O"]').click();
  await page.locator('.calc-btn-run').first().click();
  await expect(page.locator('#mm-result-body')).toContainText(/18\.02/);
  await expect(page.locator('#mm-result-body')).toContainText(/g\s*·\s*mol/);
  const resultHeadBg = await page.locator('#mm-result .calc-result-head').evaluate((el) => getComputedStyle(el).backgroundColor);
  expect(resultHeadBg).not.toBe('rgb(20, 18, 14)');
  const copyColor = await page.locator('#mm-result .calc-copy-btn').evaluate((el) => getComputedStyle(el).color);
  const copyR = Number((copyColor.match(/rgb\(\s*(\d+)/) || [0, '0'])[1]);
  expect(copyR).toBeLessThan(80);
  const metaOverflow = await page.locator('#mm-result-meta').evaluate((el) => getComputedStyle(el).overflow);
  expect(metaOverflow).toBe('visible');
  await expect(page.locator('#mm-result-meta')).toContainText(/element/i);
  await page.locator('.calc-menu-item[data-target="scientific"]').click();
  await expect(page.locator('.scc-device')).toBeVisible();
  const deviceBg = await page.locator('.scc-device').evaluate((el) => getComputedStyle(el).backgroundColor);
  const deviceR = Number((deviceBg.match(/rgb\(\s*(\d+)/) || [0, '0'])[1]);
  expect(deviceR).toBeGreaterThan(180);
  const padOn = await page.locator('.scc-keypad-tab.is-on').evaluate((el) => getComputedStyle(el).backgroundColor);
  expect(padOn).not.toBe('rgb(20, 18, 14)');
  const padColor = await page.locator('.scc-keypad-tab.is-on').evaluate((el) => getComputedStyle(el).color);
  expect(padColor).toMatch(/rgb\(\s*30,\s*106,\s*80\s*\)/);
  await expect.poll(async () => (await page.locator('.scc-brand').textContent()).trim()).toBe('Atomurus');
  await saveShot(page, 'desktop-public-calculators');

  await page.goto('/explore.html');
  await expect(page.locator('.ex-title')).toBeVisible();
  await expect.poll(() => fontFamily(page.locator('.ex-title'))).toMatch(/Instrument Serif/i);
  await expect(page.locator('.ex-title')).toContainText(/explore/i);
  await expect(page.locator('.ex-title')).not.toContainText('Â');
  const pillColor = await page.locator('.ex-pill.active').evaluate((el) => getComputedStyle(el).color);
  expect(pillColor).toMatch(/rgb\(\s*30,\s*106,\s*80\s*\)/);
  const pillBg = await page.locator('.ex-pill.active').evaluate((el) => getComputedStyle(el).backgroundColor);
  expect(pillBg).not.toBe('rgb(20, 18, 14)');
  await expect(page.locator('.data-strip').first()).toBeHidden();
  await saveShot(page, 'desktop-public-explore');

  await page.goto('/viewer/atomic-models.html');
  await expect(page.locator('.vz-tab.active')).toBeVisible();
  await expect(page.locator('.vz-num').first()).toBeHidden();
  await expect(page.locator('.vz-tab.active')).toContainText(/Atomic Models/i);
  await expect(page.locator('.data-strip').first()).toBeHidden();
  await expect(page.locator('.av-substrip').first()).toBeHidden();
  const vcBg = await page.locator('.viewer-controls').first().evaluate((el) => getComputedStyle(el).backgroundColor);
  expect(vcBg).not.toBe('rgba(20, 18, 14, 0.78)');
  await saveShot(page, 'desktop-public-viewer');

  await page.goto('/periodic-table/heatmap.html');
  await expect(page.locator('.pt-tab.active')).toBeVisible();
  const heatTab = await page.locator('.pt-tab.active').evaluate((el) => getComputedStyle(el).color);
  expect(heatTab).toMatch(/rgb\(\s*30,\s*106,\s*80\s*\)/);
  await expect(page.locator('.data-strip').first()).toBeHidden();
  await saveShot(page, 'desktop-public-heatmap');

  await page.goto('/periodic-table/hydrogenium.html');
  await expect(page.locator('.lc-el-name')).toBeVisible();
  await expect.poll(() => fontFamily(page.locator('.lc-el-name'))).toMatch(/Instrument Serif/i);
  await expect.poll(() => fontFamily(page.locator('.lc-el-lat'))).toMatch(/Inter Tight/i);
  await expect.poll(() => fontFamily(page.locator('.lc-el-prop .k').first())).toMatch(/Inter Tight/i);
  await expect(page.locator('.data-strip').first()).toBeHidden();
  await saveShot(page, 'desktop-public-element');

  await page.goto('/login.html');
  await expect(page.locator('.ps-shell')).toBeVisible();
  await expect(page.locator('.ps-pub-sidebar')).toBeVisible();
  await expect(page.locator('.lc-topnav-name')).toBeVisible();
  await expect.poll(() => fontFamily(page.locator('.lc-topnav-name'))).toMatch(/Instrument Serif/i);
  await expect(page.locator('.ps-shell > .lc-topnav .lc-topnav-cta')).toHaveAttribute('href', /periodic-table/);
  await expect(page.locator('.ps-shell > .lc-topnav .lc-topnav-cta')).toContainText(/Open lab/i);
  await expect(page.locator('#auth-email')).toBeVisible();
  const inputRadius = await page.locator('#auth-email').evaluate((el) => getComputedStyle(el).borderRadius);
  expect(parseFloat(inputRadius)).toBeGreaterThanOrEqual(10);
  await saveShot(page, 'desktop-public-login');

  await page.goto('/pricing.html');
  await expect(page.locator('.ps-shell')).toBeVisible();
  await expect(page.locator('.price-card, .lc-doc-title').first()).toBeVisible();
  await expect.poll(() => fontFamily(page.locator('.lc-topnav-name'))).toMatch(/Instrument Serif/i);
  await expect.poll(() => fontFamily(page.locator('.price-card h3').first())).toMatch(/Instrument Serif/i);
  await expect(page.locator('.lc-doc-kicker .pill')).toBeHidden();
  await expect(page.locator('.ps-shell > .lc-topnav .lc-topnav-cta')).toHaveAttribute('href', /login/);
  await expect(page.locator('.ps-shell > .lc-topnav .lc-topnav-cta')).toContainText(/Account/i);
  await saveShot(page, 'desktop-public-pricing');
});

test('settings, compare, docs and articles keep the workspace pattern', async ({ page }) => {
  await page.goto('/config.html');
  await expect(page.locator('.ps-shell')).toBeVisible();
  await expect(page.locator('.data-strip').first()).toBeHidden();
  const toggleBg = await page.locator('.settings-toggle.active').first().evaluate((el) => getComputedStyle(el).backgroundColor);
  expect(toggleBg).toMatch(/rgb\(\s*30,\s*106,\s*80\s*\)/);
  const segBg = await page.locator('.seg-btn.active').first().evaluate((el) => getComputedStyle(el).backgroundColor);
  expect(segBg).not.toBe('rgb(20, 18, 14)');
  const segColor = await page.locator('.seg-btn.active').first().evaluate((el) => getComputedStyle(el).color);
  expect(segColor).toMatch(/rgb\(\s*30,\s*106,\s*80\s*\)/);
  await saveShot(page, 'desktop-public-config');

  await page.goto('/periodic-table/compare.html');
  await expect(page.locator('.pt-tab.active')).toBeVisible();
  const cmpTab = await page.locator('.pt-tab.active').evaluate((el) => getComputedStyle(el).color);
  expect(cmpTab).toMatch(/rgb\(\s*30,\s*106,\s*80\s*\)/);
  await expect(page.locator('.cmp-slot').first()).toBeVisible();
  await expect(page.locator('.data-strip').first()).toBeHidden();
  await saveShot(page, 'desktop-public-compare');

  await page.goto('/periodic-table/trends.html');
  await expect(page.locator('.pt-tab.active')).toBeVisible();
  await expect(page.locator('.data-strip').first()).toBeHidden();
  const autoOn = await page.locator('#trend-auto').evaluate((el) => {
    const s = getComputedStyle(el);
    return { color: s.color, fontFamily: s.fontFamily, backgroundColor: s.backgroundColor };
  });
  expect(autoOn.color).toMatch(/rgb\(\s*30,\s*106,\s*80\s*\)/);
  expect(autoOn.fontFamily).toMatch(/Inter Tight/i);
  expect(autoOn.backgroundColor).not.toBe('rgb(20, 18, 14)');
  await saveShot(page, 'desktop-public-trends');

  await page.goto('/about.html');
  await expect(page.locator('.lc-doc-title')).toBeVisible();
  await expect.poll(() => fontFamily(page.locator('.lc-doc-title'))).toMatch(/Instrument Serif/i);
  await expect(page.locator('.lc-landing .data-strip, .data-strip').first()).toBeHidden();
  await expect(page.locator('.ps-shell > .lc-topnav .lc-topnav-cta')).toHaveAttribute('href', /login/);
  await expect(page.locator('.ps-shell > .lc-topnav .lc-topnav-cta')).toContainText(/Account/i);
  await saveShot(page, 'desktop-public-about');

  await page.goto('/explore/what-is-an-atom.html');
  await expect(page.locator('.art-title')).toBeVisible();
  await expect.poll(() => fontFamily(page.locator('.art-title'))).toMatch(/Instrument Serif/i);
  await expect(page.locator('.data-strip').first()).toBeHidden();
  await saveShot(page, 'desktop-public-article');

  await page.goto('/viewer/isomerism.html');
  await expect(page.locator('.data-strip').first()).toBeHidden();
  await expect(page.locator('.vz-tab').first()).toBeVisible();
  await expect(page.locator('.ph-kicker').first()).not.toContainText('§');
  await saveShot(page, 'desktop-public-isomerism');

  await page.goto('/viewer/isomerism/constitutional/function.html');
  await expect(page.locator('.sub-tab.active')).toBeVisible();
  await expect(page.locator('.sub-num').first()).toBeHidden();
  await saveShot(page, 'desktop-public-isomerism-function');
});

test('molecules, allotropes and 404 drop leftover console chrome', async ({ page }) => {
  await page.goto('/viewer/molecules.html');
  const molPill = await page.locator('.viewer .pill.active').first().evaluate((el) => {
    const s = getComputedStyle(el);
    return { bg: s.backgroundColor, color: s.color };
  });
  expect(molPill.bg).toMatch(/rgb\(\s*30,\s*106,\s*80\s*\)/);
  expect(molPill.color).not.toMatch(/rgb\(\s*91,\s*33,\s*182\s*\)/);
  await expect.poll(() => fontFamily(page.locator('.mol-search'))).toMatch(/Inter Tight/i);
  await saveShot(page, 'desktop-public-molecules');

  await page.goto('/viewer/allotropes.html');
  const alloPill = await page.locator('.viewer .pill.purple.active').first().evaluate((el) => {
    const s = getComputedStyle(el);
    return { bg: s.backgroundColor, color: s.color };
  });
  expect(alloPill.bg).toMatch(/rgb\(\s*30,\s*106,\s*80\s*\)/);
  expect(alloPill.color).not.toMatch(/rgb\(\s*91,\s*33,\s*182\s*\)/);
  await expect.poll(() => fontFamily(page.locator('.allo-search'))).toMatch(/Inter Tight/i);
  await saveShot(page, 'desktop-public-allotropes');

  await page.goto('/404.html');
  await expect(page.locator('.lc-doc-title')).toBeVisible();
  await expect(page.locator('.lc-doc-card .lbl').first()).toHaveText(/Periodic Table/);
  await expect(page.locator('.lc-doc-card .lbl').first()).not.toHaveText(/01/);
  await expect(page.locator('.h-no')).toBeHidden();
  await saveShot(page, 'desktop-public-404');
});

test('public home dark mode and mobile keep the workspace chrome', async ({ page }) => {
  await page.goto('/index.html');
  await page.locator('#theme-toggle').click();
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark');
  await expect.poll(() => fontFamily(page.locator('.lc-topnav-name'))).toMatch(/Instrument Serif/i);
  await saveShot(page, 'desktop-public-home-dark');

  await page.setViewportSize({ width: 390, height: 844 });
  await expect(page.locator('.lc-mobile-hamb')).toBeVisible();
  await page.locator('.lc-mobile-hamb').click();
  await expect(page.locator('#lc-mobile-menu.open, .lc-mobile-menu.open')).toBeVisible();
  await expect(page.locator('.lc-mobile-menu-num')).toHaveCount(0);
  await saveShot(page, 'mobile-public-home-menu');

  await page.goto('/calculators.html');
  await expect(page.locator('.ps-shell > .topbar .mobile-menu-btn')).toBeVisible();
  const closed = await page.locator('.ps-shell > aside.sidebar').evaluate((el) => {
    const r = el.getBoundingClientRect();
    return { x: r.x, width: r.width, transform: getComputedStyle(el).transform };
  });
  expect(closed.x + closed.width).toBeLessThanOrEqual(1);
  await page.locator('.ps-shell > .topbar .mobile-menu-btn').click();
  await expect.poll(async () => {
    const r = await page.locator('.ps-shell > aside.sidebar').evaluate((el) => el.getBoundingClientRect());
    return r.x;
  }).toBeGreaterThanOrEqual(0);
  await saveShot(page, 'mobile-public-calculators');
});
