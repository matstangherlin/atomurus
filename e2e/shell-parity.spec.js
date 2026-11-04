const { test, expect } = require('@playwright/test');
const path = require('node:path');
const fs = require('node:fs');
const { installApi } = require('./helpers');

const SHOTS = path.resolve(__dirname, '../test-results/e2e-screenshots');

function saveShot(page, name) {
  fs.mkdirSync(SHOTS, { recursive: true });
  return page.screenshot({ path: path.join(SHOTS, `${name}.png`), fullPage: false });
}

async function chromeMetrics(page) {
  return page.evaluate(() => {
    const top = document.querySelector('.ps-shell > .lc-topnav, .ps-shell > .topbar, .ws-topbar');
    const side = document.querySelector('#ps-pub-sidebar, .ps-shell > aside.sidebar, .ws-sidebar');
    const brand = document.querySelector('.lc-topnav-name, .logo-text, .ws-brand-name');
    const search = document.querySelector('.lc-topnav-search, .ps-search, .search-box, .ws-search');
    const lang = document.querySelector('[data-i18n-toggle], button[aria-label*="anguage" i], button[title*="anguage" i], button[aria-label*="idioma" i]');
    const theme = document.querySelector('#theme-toggle, .theme-btn, [onclick="toggleTheme()"]');
    const account = document.querySelector('[data-atomurus-account-chip], .lc-topnav-cta, #ws-userchip');
    const box = (el) => {
      if (!el) return null;
      const r = el.getBoundingClientRect();
      return { x: Math.round(r.x), y: Math.round(r.y), w: Math.round(r.width), h: Math.round(r.height) };
    };
    return {
      top: box(top),
      side: box(side),
      brand: brand ? String(brand.textContent || '').trim() : '',
      brandBox: box(brand),
      search: box(search),
      lang: box(lang),
      theme: box(theme),
      account: box(account),
      accountText: account ? String(account.textContent || '').replace(/\s+/g, ' ').trim() : ''
    };
  });
}

const ROUTES = [
  { name: 'home', path: '/index.html' },
  { name: 'table', path: '/periodic-table.html' },
  { name: 'calculators', path: '/calculators.html' },
  { name: 'explore', path: '/explore.html' },
  { name: 'workspace', path: '/app' }
];

const CREATE = /Create (free )?account|Criar conta/i;

test.describe('shell parity guest desktop', () => {
  test.use({ viewport: { width: 1280, height: 800 } });

  for (const route of ROUTES) {
    test(`${route.name} keeps its chrome and Create account`, async ({ page }) => {
      await installApi(page, { kind: 'guest', signedIn: false });
      await page.goto(route.path);
      await expect(page.locator('[data-atomurus-account-chip], #ws-userchip')).toContainText(CREATE, { timeout: 15_000 });
      if (route.name === 'workspace') {
        /* /app keeps the workspace chrome: 64px top bar + 248px sidebar. */
        const chrome = await chromeMetrics(page);
        expect(chrome.top).toBeTruthy();
        expect(chrome.top.h).toBeGreaterThanOrEqual(60);
        expect(chrome.top.h).toBeLessThanOrEqual(68);
        expect(chrome.side).toBeTruthy();
        expect(chrome.side.w).toBeGreaterThanOrEqual(240);
        expect(chrome.side.w).toBeLessThanOrEqual(256);
        expect(chrome.brand).toMatch(/Atomurus/i);
        expect(chrome.search).toBeTruthy();
        expect(chrome.account).toBeTruthy();
        expect(chrome.accountText).toMatch(CREATE);
      } else {
        /* Public pages: remake top navigation, no sidebar. */
        const m = await page.evaluate(() => {
          const header = document.querySelector('[data-rm-header]');
          const r = header.getBoundingClientRect();
          return {
            h: r.height,
            brand: (document.querySelector('.rm-brand-name') || {}).textContent || '',
            sidebar: document.querySelectorAll('#ws-sidebar, [data-atomurus-sidebar]').length,
            signin: Boolean(document.querySelector('.rm-signin')),
            items: document.querySelectorAll('.rm-nav > [data-rm-section]').length
          };
        });
        expect(m.h).toBeGreaterThanOrEqual(64);
        expect(m.h).toBeLessThanOrEqual(76);
        expect(m.brand).toMatch(/Atomurus/i);
        expect(m.sidebar).toBe(0);
        expect(m.signin).toBe(true);
        expect(m.items).toBe(5);
        await expect(page.locator('.rm-cta')).toContainText(CREATE);
      }
      await saveShot(page, `shell-guest-${route.name}`);
    });
  }
});

test('Pro chip is the same on Home, Periodic Table and Workspace', async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 800 });
  await installApi(page, { kind: 'pro' });
  await page.goto('/index.html');
  await expect(page.locator('[data-atomurus-account-chip], .lc-topnav-cta')).toContainText(/Pro User/i, { timeout: 15_000 });
  await expect(page.locator('[data-atomurus-plan-badge], .ps-plan-badge').first()).toContainText(/PRO/);
  await saveShot(page, 'shell-pro-home');

  await page.goto('/periodic-table.html');
  await expect(page.locator('[data-atomurus-account-chip]')).toContainText(/Pro User/i, { timeout: 15_000 });
  await expect(page.locator('[data-atomurus-plan-badge], .ps-plan-badge').first()).toContainText(/PRO/);
  await saveShot(page, 'shell-pro-table');

  await page.goto('/app');
  await expect(page.locator('#ws-userchip')).toContainText(/Pro User/i, { timeout: 15_000 });
  await expect(page.locator('#ws-plan-badge')).toContainText(/PRO/);
  await expect(page.locator('.ws-topbar [data-atomurus-plan-badge]')).toHaveCount(1);
  await saveShot(page, 'shell-pro-app');
});

test('Account Center tabs live on /account', async ({ page }) => {
  await installApi(page, { kind: 'pro' });
  await page.goto('/app?section=account');
  await expect(page).toHaveURL(/\/account/);
  await expect(page.locator('#ws-plan-card')).toContainText(/Atomurus Pro/);
  await page.locator('.ws-account-tab[href*="tab=profile"]').click();
  await expect(page.locator('#app-study')).toContainText(/Display name|Nome/i);
  await page.locator('.ws-account-tab[href*="tab=security"]').click();
  await expect(page.locator('#app-study')).toContainText(/Reset password|Redefinir/i);
  await page.locator('.ws-account-tab[href*="tab=preferences"]').click();
  await expect(page.locator('#app-study')).toContainText(/Language|Idioma/i);
});

test('Free chip stays FREE on Home and Workspace', async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 800 });
  await installApi(page, { kind: 'free' });
  await page.goto('/index.html');
  await expect(page.locator('[data-atomurus-account-chip]')).toContainText(/Free User/i, { timeout: 15_000 });
  await expect(page.locator('[data-atomurus-plan-badge]').first()).toContainText(/FREE/);
  await page.goto('/app');
  await expect(page.locator('#ws-userchip')).toContainText(/Free User/i, { timeout: 15_000 });
  await expect(page.locator('#ws-plan-badge')).toContainText(/FREE/);
});

test('Molecules keeps 3D models current in the top navigation', async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 800 });
  await page.goto('/viewer/molecules.html');
  await expect(page.locator('.rm-nav > .is-active')).toHaveCount(1);
  await expect(page.locator('.rm-dd[data-rm-section="models"]')).toHaveClass(/is-active/);
  await expect(page.locator('.vz-tabs a[aria-current="page"], .vz-tab.active').first()).toContainText(/Molecules/i);
});
