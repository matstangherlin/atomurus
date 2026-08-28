const { test, expect } = require('@playwright/test');
const path = require('node:path');
const fs = require('node:fs');
const { installApi, createStore, dueCard, SET_ID, CARD_A, CARD_B, gotoWorkspace } = require('./helpers');

const SHOTS = path.resolve(__dirname, '../test-results/e2e-screenshots');

function saveShot(page, name) {
  fs.mkdirSync(SHOTS, { recursive: true });
  return page.screenshot({ path: path.join(SHOTS, `${name}.png`), fullPage: true });
}

function insightsStore() {
  const store = createStore();
  store.sets = [{
    id: SET_ID,
    title: 'Organic Chemistry',
    description: '',
    cardCount: 2,
    dueCount: 2,
    masteredCount: 0,
    activeCount: 2,
    learningCount: 1,
    newCount: 0,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  }];
  store.cards = [
    dueCard({
      id: CARD_A,
      front: 'Periodic trend: atomic radius',
      back: 'Decreases across a period',
      lapses: 5,
      easeFactor: 1.5,
      reviewState: 'learning',
      studySetId: SET_ID
    }),
    dueCard({
      id: CARD_B,
      front: 'Symbol for iron?',
      back: 'Fe',
      lapses: 0,
      easeFactor: 2.5,
      reviewState: 'review',
      studySetId: SET_ID
    })
  ];
  return store;
}

test('Free Insights shows locked preview and never calls the Insights API', async ({ page }) => {
  let insightsCalls = 0;
  await installApi(page, { kind: 'free' });
  page.on('request', (req) => {
    if (req.url().includes('/api/study/insights')) insightsCalls += 1;
  });
  await gotoWorkspace(page, '/app?section=insights');
  await expect(page.locator('#app-study')).toContainText(/Study Insights|Insights de Estudo/);
  await expect(page.locator('#app-study')).toContainText(/Review activity|Atividade de revisão|Understand how|Como seu estudo/i);
  await expect(page.locator('#app-study').getByRole('link', { name: /Upgrade|Assinar/i })).toBeVisible();
  await expect(page.locator('#app-study')).not.toContainText(/87%/);
  await expect(page.locator('#ws-insight-set')).toHaveCount(0);
  expect(insightsCalls).toBe(0);
  await saveShot(page, 'desktop-insights-free-locked');
});

test('Pro Insights: 30 days, set filter, Needs attention, Focus Review, Good', async ({ page }) => {
  const store = insightsStore();
  await installApi(page, { kind: 'pro', store });
  await gotoWorkspace(page, '/app');
  await expect(page.locator('#ws-nav-main')).toContainText(/Insights/);
  await page.locator('#ws-nav-main a[href*="section=insights"]').click();
  await expect(page.locator('#app-study')).toContainText(/Study Insights|Insights de Estudo/);
  await expect(page.locator('#app-study')).toContainText(/30 days|30 dias/);
  await expect(page.locator('#app-study')).toContainText(/Confident reviews|Revisões confiantes/);
  await expect(page.locator('#app-study')).not.toContainText(/Accuracy/i);
  await saveShot(page, 'desktop-insights-pro');

  await page.locator('a.ws-chip').filter({ hasText: /30 days|30 dias/ }).click();
  await expect(page.locator('#ws-insight-set')).toBeVisible();
  await page.locator('#ws-insight-set').selectOption(SET_ID);
  await expect(page.locator('#app-study')).toContainText(/Needs attention|Precisa de atenção/);
  await expect(page.locator('#ws-weak-list')).toContainText('Periodic trend: atomic radius');
  await saveShot(page, 'desktop-insights-filtered');

  await page.getByRole('link', { name: /Start Focus Review|Começar Focus Review/i }).first().click();
  await expect(page.locator('[data-review-front]')).toBeVisible();
  await expect(page.locator('#app-study')).toContainText(/Periodic trend: atomic radius|Focus Review/);
  await saveShot(page, 'desktop-focus-review-front');
  await page.locator('[data-review-reveal]').click();
  await expect(page.locator('[data-review-back]')).toBeVisible();
  await page.locator('[data-grade="good"]').click();
  await expect(page.locator('[data-review-front], .ws-complete')).toBeVisible();
  await saveShot(page, 'desktop-focus-review-next');
});

test('Pro Insights empty state', async ({ page }) => {
  const store = createStore();
  store.cards = [];
  await installApi(page, { kind: 'pro', store });
  await gotoWorkspace(page, '/app?section=insights');
  await expect(page.locator('#app-study')).toContainText(/will appear here|aparecem aqui/i);
  await saveShot(page, 'desktop-insights-empty');
});

test('Insights mobile 360 and 768', async ({ page }) => {
  const store = insightsStore();
  await installApi(page, { kind: 'pro', store });
  await page.setViewportSize({ width: 360, height: 800 });
  await gotoWorkspace(page, '/app?section=insights');
  await expect(page.locator('.ws-chart').first()).toBeVisible();
  await expect(page.locator('#ws-bottom')).toBeVisible();
  await expect(page.locator('#ws-bottom')).not.toContainText(/Insights/);
  await saveShot(page, 'mobile-360-insights');

  await page.setViewportSize({ width: 768, height: 1024 });
  await gotoWorkspace(page, '/app?section=insights');
  await saveShot(page, 'tablet-768-insights');
});

test('Insights dark theme', async ({ page }) => {
  const store = insightsStore();
  await installApi(page, { kind: 'pro', store, theme: 'dark' });
  await gotoWorkspace(page, '/app?section=insights');
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark');
  await saveShot(page, 'dark-insights');
});

test('Pro Lab delete confirmation: cancel keeps, confirm removes', async ({ page }) => {
  const store = createStore();
  store.labSessions = [{
    id: 'aaaaaaaa-bbbb-4ccc-8ddd-000000000001',
    sessionType: 'calculation',
    title: 'Acid-base experiment',
    state: {},
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  }];
  await installApi(page, { kind: 'pro', store });
  await gotoWorkspace(page, '/app?section=pro-lab');
  await expect(page.locator('#ws-lab-sessions')).toContainText('Acid-base experiment');
  await saveShot(page, 'desktop-pro-lab-session-card');
  await page.locator('[data-session-more]').click();
  await page.locator('[data-lab-delete]').click();
  await expect(page.locator('#ws-dialog-host')).toContainText(/Delete this Lab Session|Excluir esta sessão/i);
  await saveShot(page, 'desktop-pro-lab-delete-dialog');
  await page.locator('#ws-dialog-host .ws-btn-ghost').click();
  await expect(page.locator('#ws-lab-sessions')).toContainText('Acid-base experiment');
  await page.locator('[data-session-more]').click();
  await page.locator('[data-lab-delete]').click();
  await page.locator('#ws-dialog-host .ws-btn-danger').click();
  await expect(page.locator('#ws-lab-sessions')).not.toContainText('Acid-base experiment');
});

test('Visual regression: public lab, pricing and /app at 360px', async ({ page }) => {
  await page.setViewportSize({ width: 360, height: 800 });
  await page.addInitScript(() => {
    localStorage.setItem('atomurus-cookie-consent', 'rejected');
    localStorage.setItem('atomurus-lang', 'en');
  });
  await page.goto('/calculators.html');
  await expect(page.locator('.ps-shell')).toBeVisible();
  await saveShot(page, 'mobile-360-calculators');
  await page.goto('/periodic-table.html');
  await saveShot(page, 'mobile-360-periodic-table');
  await page.goto('/viewer/atomic-models.html');
  await saveShot(page, 'mobile-360-viewer');
  await page.goto('/pricing');
  await expect(page.locator('#pricing-pro-list, #pricing-free-list').first()).toBeVisible();
  await saveShot(page, 'mobile-360-pricing');

  const store = insightsStore();
  await installApi(page, { kind: 'pro', store });
  await gotoWorkspace(page, '/app?section=sets');
  await saveShot(page, 'mobile-360-study-sets');
  await gotoWorkspace(page, '/app?section=pro-lab');
  await saveShot(page, 'mobile-360-pro-lab');
});

test('Overview hierarchy: Pro due hero and Free workspace copy', async ({ page }) => {
  const store = insightsStore();
  await installApi(page, { kind: 'pro', store });
  await gotoWorkspace(page, '/app');
  await expect(page.locator('#app-study')).toContainText(/Ready to study|Pronto para estudar/i);
  await expect(page.locator('#app-study').getByRole('link', { name: /Start Smart Review|Começar Smart Review/i })).toBeVisible();
  await saveShot(page, 'desktop-overview-pro-hero');

  await installApi(page, { kind: 'free' });
  await gotoWorkspace(page, '/app');
  await expect(page.locator('#app-study')).toContainText(/chemistry workspace|workspace de química/i);
  await expect(page.locator('#app-study').getByRole('link', { name: /Explore Pro|Conhecer o Pro/i })).toBeVisible();
  await saveShot(page, 'desktop-overview-free');
});
