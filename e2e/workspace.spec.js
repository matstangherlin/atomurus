const { test, expect } = require('@playwright/test');
const path = require('node:path');
const fs = require('node:fs');
const { installApi, createStore, dueCard, SET_ID, gotoWorkspace } = require('./helpers');

const SHOTS = path.resolve(__dirname, '../test-results/e2e-screenshots');

function saveShot(page, name) {
  fs.mkdirSync(SHOTS, { recursive: true });
  return page.screenshot({ path: path.join(SHOTS, `${name}.png`), fullPage: true });
}

test('Free sees premium nav locked and cannot use Study Cloud', async ({ page }) => {
  await installApi(page, { kind: 'free' });
  await gotoWorkspace(page, '/app');
  await expect(page.locator('#ws-study-nav')).toContainText(/Library|Biblioteca/);
  await expect(page.locator('#ws-study-nav')).toContainText(/Study Sets/);
  await expect(page.locator('#ws-study-nav')).toContainText(/Review/);
  await expect(page.locator('#ws-study-nav')).toContainText(/PRO/);
  await saveShot(page, 'desktop-free-overview');

  await page.locator('#ws-study-nav a[href="/app?section=sets"]').click();
  await expect(page.locator('#ws-dialog-host')).toContainText(/Atomurus Pro/);
  await expect(page).toHaveURL(/\/app$/);
  await page.locator('#ws-dialog-host button').first().click();

  await gotoWorkspace(page, '/app?section=library');
  await expect(page.locator('#app-study')).toContainText(/Premium|PRO|Upgrade|Assinar/);
  await expect(page.locator('#ws-lib-list')).toHaveCount(0);

  const api = await page.evaluate(async () => {
    const res = await fetch('/api/study/items?exclude=calculator', {
      credentials: 'include',
      headers: { Accept: 'application/json' }
    });
    const body = await res.json().catch(() => ({}));
    return { status: res.status, code: body.code };
  });
  expect(api.status).toBe(403);
  expect(api.code).toBe('feature_locked');
});

test('Trial unlocks study features and shows PRO TRIAL without billing portal', async ({ page }) => {
  await installApi(page, { kind: 'trial' });
  await gotoWorkspace(page, '/app');
  await expect(page.locator('#ws-plan-badge')).toBeVisible();
  await expect(page.locator('#ws-plan-badge')).toContainText('PRO TRIAL');
  await gotoWorkspace(page, '/app?section=library');
  await expect(page.locator('#ws-lib-list')).toContainText('Iron');
  await gotoWorkspace(page, '/app?section=sets');
  await expect(page.locator('#app-study')).toContainText(/Study Sets/);
  await gotoWorkspace(page, '/app?section=review');
  await expect(page.locator('#app-study')).toContainText(/Smart Review|Review/);
  await gotoWorkspace(page, '/app?section=account');
  await expect(page.locator('#ws-plan-card')).toContainText(/Trial|dias|days/i);
  await expect(page.locator('#ws-billing-portal')).toHaveCount(0);
  await expect(page.locator('#ws-plan-card')).toContainText(/View plans|Ver planos/);
});

test('Pro walkthrough: library, set, generate, review Good', async ({ page }) => {
  const store = createStore();
  store.cards = [dueCard()];
  await installApi(page, { kind: 'pro', store });

  await page.goto('/periodic-table/ferrum.en.html');
  const save = page.locator('#atomurus-study-save button').first();
  await save.waitFor({ state: 'visible', timeout: 15_000 }).catch(() => {});
  if (await save.count()) {
    await save.click();
    await expect(page.locator('#atomurus-study-save')).toContainText(/Saved|Salvo/i, { timeout: 8_000 });
  }

  await gotoWorkspace(page, '/app?section=library');
  await expect(page.locator('#ws-lib-list')).toContainText('Iron');
  await saveShot(page, 'desktop-library');

  await gotoWorkspace(page, '/app?section=sets');
  await page.locator('#app-set-open').click();
  await expect(page.locator('#ws-new-set-name')).toBeVisible();
  await page.locator('#ws-new-set-name').fill('Metals');
  await page.locator('#ws-dialog-host .ws-btn-primary').click();
  await expect(page.locator('#ws-set-list')).toContainText('Metals', { timeout: 8_000 });
  await saveShot(page, 'desktop-study-sets');

  await gotoWorkspace(page, '/app?section=library');
  await page.locator('[data-add-to-set]').first().click();
  await page.locator('#ws-dialog-host button.ws-btn').filter({ hasText: /Metals/ }).first().click();
  await expect(page.locator('.ws-toast, [role="status"]')).toBeVisible({ timeout: 8_000 });
  await page.locator('[data-generate-item]').first().click();
  await expect(page.locator('.ws-toast, [role="status"]')).toBeVisible({ timeout: 8_000 });

  await gotoWorkspace(page, `/app?section=sets&set=${store.sets[0] ? store.sets[0].id : SET_ID}`);
  await expect(page.locator('#ws-set-title')).toBeVisible();
  await saveShot(page, 'desktop-study-set-detail');

  await gotoWorkspace(page, '/app?section=review&start=1');
  await expect(page.locator('[data-review-front]')).toBeVisible();
  await saveShot(page, 'desktop-smart-review-front');
  await page.locator('[data-review-reveal]').click();
  await expect(page.locator('[data-review-back]')).toBeVisible();
  await saveShot(page, 'desktop-smart-review-revealed');
  await page.locator('[data-grade="good"]').click();
  await expect(page.locator('[data-review-front], .ws-complete')).toBeVisible();
});

test('Review complete, review again and exit', async ({ page }) => {
  const store = createStore();
  store.cards = [dueCard({ front: 'Fe?', back: 'Iron' })];
  await installApi(page, { kind: 'pro', store });
  await gotoWorkspace(page, '/app?section=review&start=1');
  await page.locator('[data-review-reveal]').click();
  await page.locator('[data-grade="good"]').click();
  await expect(page.locator('#app-study')).toContainText(/Review complete|Revisão concluída/i);
  await saveShot(page, 'desktop-review-complete');
  await expect(page.getByRole('link', { name: /Review again|Revisar de novo/i })).toBeVisible();
  await page.getByRole('link', { name: /Exit|Sair/i }).first().click();
  await expect(page).toHaveURL(/section=review/);
  await expect(page.locator('#app-review-session')).toHaveCount(0);
});

test('Review network failure stays on the card and can retry', async ({ page }) => {
  const store = createStore();
  store.cards = [dueCard({ front: 'Fe?', back: 'Iron' })];
  await installApi(page, { kind: 'pro', store, reviewFails: 1 });
  await gotoWorkspace(page, '/app?section=review&start=1');
  await page.locator('[data-review-reveal]').click();
  await page.locator('[data-grade="good"]').click();
  const err = page.locator('[data-review-error]');
  await expect(err).toBeVisible();
  await expect(err).toContainText(/couldn't save|não foi possível salvar/i);
  await expect(page.locator('[data-review-back]')).toBeVisible();
  await err.locator('button').click();
  await expect(page.locator('#app-study')).toContainText(/Review complete|Revisão concluída/i);
});

test('Account Pro shows Manage subscription and opens portal URL', async ({ page }) => {
  await installApi(page, { kind: 'pro' });
  await gotoWorkspace(page, '/app?section=account');
  await expect(page.locator('#ws-plan-card')).toContainText(/Atomurus Pro/);
  await expect(page.locator('#ws-plan-card')).toContainText(/Active|Ativo/);
  const portal = page.locator('#ws-billing-portal');
  await expect(portal).toBeVisible();
  await saveShot(page, 'desktop-account-pro');

  const [request] = await Promise.all([
    page.waitForRequest((req) => req.url().includes('/api/billing/portal') && req.method() === 'POST'),
    portal.click()
  ]);
  const body = request.postDataJSON() || {};
  expect(body).not.toHaveProperty('stripeCustomerId');
  expect(body).not.toHaveProperty('customerId');
  expect(body).not.toHaveProperty('userId');
  await page.waitForURL(/billing\.stripe\.com/, { timeout: 8_000 });
});

test('Account cancel-scheduled stays Pro until period end', async ({ page }) => {
  await installApi(page, { kind: 'cancel' });
  await gotoWorkspace(page, '/app?section=account');
  await expect(page.locator('#ws-plan-card')).toContainText(/Atomurus Pro/);
  await expect(page.locator('#ws-plan-card')).toContainText(/will not renew|não renov/i);
  await expect(page.locator('#ws-billing-portal')).toBeVisible();
});

test('Payment issue offers Manage billing', async ({ page }) => {
  await installApi(page, { kind: 'pastdue' });
  await gotoWorkspace(page, '/app?section=account');
  await expect(page.locator('#ws-plan-card')).toContainText(/Payment issue|problema de pagamento/i);
  await expect(page.locator('#ws-billing-portal')).toBeVisible();
});

test('PT/EN workspace rerender', async ({ page }) => {
  await installApi(page, { kind: 'pro', lang: 'en' });
  await gotoWorkspace(page, '/app');
  await expect(page.locator('#ws-study-nav')).toContainText(/Overview|Library/);
  await page.locator('[data-i18n-toggle]').first().click();
  await expect(page.locator('#ws-study-nav')).toContainText('Visão geral');
  await expect(page.locator('#ws-study-nav')).toContainText('Biblioteca');
  await saveShot(page, 'app-overview-pt');
  await page.locator('[data-i18n-toggle]').first().click();
  await expect(page.locator('#ws-study-nav')).toContainText('Overview');
  await saveShot(page, 'app-overview-en');
});

test('Library server search does not keep stale results', async ({ page }) => {
  const store = createStore();
  store.items.push({
    id: '00000000-0000-4000-8000-000000000099',
    itemType: 'element',
    itemKey: 'aurum',
    title: 'Gold',
    href: '/periodic-table/aurum',
    note: '',
    tags: ['noble'],
    payload: {},
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  });
  await installApi(page, { kind: 'pro', store });
  await gotoWorkspace(page, '/app?section=library');
  await page.locator('#ws-lib-q').fill('Gold');
  await expect(page.locator('#ws-lib-list')).toContainText('Gold', { timeout: 8_000 });
  await expect(page.locator('#ws-lib-list')).not.toContainText('Iron');
});

test('mobile 390x844: bottom nav, drawer, no horizontal overflow', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  const store = createStore();
  store.cards = [dueCard({ front: 'Fe?', back: 'Iron' })];
  await installApi(page, { kind: 'pro', store });
  await gotoWorkspace(page, '/app');
  await expect(page.locator('#ws-bottom')).toBeVisible();
  await expect(page.locator('#ws-bottom a')).toHaveCount(5);
  const tops = await page.locator('#ws-bottom a').evaluateAll((els) => els.map((el) => el.getBoundingClientRect().top));
  expect(Math.max(...tops) - Math.min(...tops)).toBeLessThan(8);
  await expect(page.locator('#app-study')).toContainText(/1 card is due today|1 card vence hoje/);
  await expect(page.locator('#app-study')).not.toContainText(/1 cards are due|1 cards vencem/);
  const destCards = page.locator('.ws-dest-card');
  await expect(destCards).toHaveCount(4);
  const destLayout = await destCards.evaluateAll((els) => els.map((el) => {
    const box = el.getBoundingClientRect();
    return { left: box.left, top: box.top, right: box.right, bottom: box.bottom };
  }));
  expect(destLayout.every((box, i) => destLayout.every((other, j) => {
    if (i === j) return true;
    return box.bottom <= other.top + 1 || other.bottom <= box.top + 1;
  }))).toBeTruthy();
  const overflow = await page.evaluate(() => document.documentElement.scrollWidth > document.documentElement.clientWidth + 2);
  expect(overflow).toBeFalsy();
  await saveShot(page, 'mobile-overview');
  await page.locator('#ws-menu-btn').click();
  await expect(page.locator('#ws-sidebar')).toBeVisible();
  await saveShot(page, 'mobile-drawer');
  await page.keyboard.press('Escape');
  await gotoWorkspace(page, '/app?section=library');
  await saveShot(page, 'mobile-library');
  await gotoWorkspace(page, '/app?section=review&start=1');
  await saveShot(page, 'mobile-smart-review');
  await page.goto('/pricing');
  await saveShot(page, 'mobile-pricing');
});

test('dark screenshots for overview, review, pricing, login', async ({ page }) => {
  const api = await installApi(page, { kind: 'pro', theme: 'dark' });
  await gotoWorkspace(page, '/app');
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark');
  await saveShot(page, 'dark-overview');
  await gotoWorkspace(page, '/app?section=review');
  await saveShot(page, 'dark-smart-review');
  await page.goto('/pricing');
  await saveShot(page, 'dark-pricing');
  api.setSignedIn(false);
  await page.goto('/login');
  await expect(page.locator('#auth-login-form')).toBeVisible();
  await saveShot(page, 'dark-login');
});

test('desktop public screenshots', async ({ page }) => {
  const api = await installApi(page, { kind: 'pro' });
  await gotoWorkspace(page, '/app');
  await saveShot(page, 'desktop-pro-overview');
  await page.goto('/pricing');
  await saveShot(page, 'desktop-pricing');
  api.setSignedIn(false);
  await page.goto('/login');
  await expect(page.locator('#auth-login-form')).toBeVisible();
  await saveShot(page, 'desktop-login');
});
