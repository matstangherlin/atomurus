const { test, expect } = require('@playwright/test');
const path = require('node:path');
const fs = require('node:fs');
const { installApi, createStore, dueCard, SET_ID, gotoWorkspace } = require('./helpers');

const SHOTS = path.resolve(__dirname, '../test-results/e2e-screenshots');

function saveShot(page, name) {
  fs.mkdirSync(SHOTS, { recursive: true });
  return page.screenshot({ path: path.join(SHOTS, `${name}.png`), fullPage: true });
}

test('Free uses Study Cloud and still sees Review as Pro', async ({ page }) => {
  await installApi(page, { kind: 'free' });
  await gotoWorkspace(page, '/app');
  await expect(page.locator('#ws-study-nav')).toContainText(/Lab/);
  await expect(page.locator('#ws-study-nav')).toContainText(/Study|Estudo/);
  await expect(page.locator('#ws-study-nav')).toContainText(/Creations|Criações/);
  await page.locator('#ws-study-nav a[href="/app?section=library"]').first().click();
  await expect(page.locator('#ws-study-nav')).toContainText(/Library|Biblioteca/);
  await expect(page.locator('#ws-study-nav')).toContainText(/Study Sets/);
  await expect(page.locator('#ws-study-nav a[href="/app?section=review"]')).toContainText(/Review/);
  await expect(page.locator('#ws-study-nav a[href="/app?section=review"]')).toContainText(/PRO/);
  await saveShot(page, 'desktop-free-overview');

  await page.locator('#ws-study-nav a[href="/app?section=sets"]').click();
  await expect(page.locator('#app-study')).toContainText(/Study Sets/);
  await expect(page.locator('#ws-dialog-host')).toHaveCount(0);

  await gotoWorkspace(page, '/app?section=library');
  await expect(page.locator('#ws-lib-list')).toContainText('Iron');
  await expect(page.locator('[data-generate-item]')).toHaveCount(0);

  const api = await page.evaluate(async () => {
    const res = await fetch('/api/study/items?exclude=calculator', {
      credentials: 'include',
      headers: { Accept: 'application/json' }
    });
    const body = await res.json().catch(() => ({}));
    return { status: res.status, code: body.code };
  });
  expect(api.status).toBe(200);

  await gotoWorkspace(page, '/app?section=review');
  await expect(page.locator('#app-study')).toContainText(/Premium|PRO|Upgrade|Assinar/);
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
  await gotoWorkspace(page, '/account');
  await expect(page).toHaveURL(/\/account/);
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
  await gotoWorkspace(page, '/account');
  await expect(page).toHaveURL(/\/account/);
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
  await gotoWorkspace(page, '/account');
  await expect(page).toHaveURL(/\/account/);
  await expect(page.locator('#ws-plan-card')).toContainText(/Atomurus Pro/);
  await expect(page.locator('#ws-plan-card')).toContainText(/will not renew|não renov/i);
  await expect(page.locator('#ws-billing-portal')).toBeVisible();
});

test('Payment issue offers Manage billing', async ({ page }) => {
  await installApi(page, { kind: 'pastdue' });
  await gotoWorkspace(page, '/account');
  await expect(page).toHaveURL(/\/account/);
  await expect(page.locator('#ws-plan-card')).toContainText(/Payment issue|problema de pagamento/i);
  await expect(page.locator('#ws-billing-portal')).toBeVisible();
});

test('Account Free shows Upgrade to Pro', async ({ page }) => {
  await installApi(page, { kind: 'free' });
  await gotoWorkspace(page, '/account');
  await expect(page).toHaveURL(/\/account/);
  await expect(page.locator('#ws-plan-card')).toContainText(/Atomurus Free/);
  await expect(page.locator('#ws-plan-card a[href="/pricing"]')).toContainText(/Upgrade to Pro|Assinar o Pro/i);
});

test('Guest account section does not expose profile fields', async ({ page }) => {
  await installApi(page, { kind: 'guest', signedIn: false });
  await gotoWorkspace(page, '/account');
  await expect(page).toHaveURL(/\/account/);
  await expect(page.locator('#ws-acc-email')).toHaveCount(0);
  await expect(page.locator('#app-study')).toContainText(/Create an Atomurus account|Crie uma conta Atomurus/i);
});

test('Overview lists recent lab sessions and viewer names', async ({ page }) => {
  const store = createStore();
  store.labSessions = [{
    id: 'aaaaaaaa-bbbb-4ccc-8ddd-000000000001',
    sessionType: 'reaction',
    title: 'Combustion of CH4',
    updatedAt: new Date().toISOString()
  }];
  await installApi(page, { kind: 'pro', store });
  await gotoWorkspace(page, '/app');
  await expect(page.locator('#app-study')).toContainText(/Recent Lab Sessions|Sessões recentes/);
  await expect(page.locator('#app-study')).toContainText('Combustion of CH4');
  await expect(page.locator('#app-study .ws-viz-links a[href="/viewer/atomic-models.html"]')).toContainText(/Atomic Models|Modelos atômicos/);
  await expect(page.locator('#app-study .ws-viz-links a[href="/viewer/atomic-models.html"]')).not.toContainText(/Atomic Compare|Comparar átomos/);
});

test('PT/EN workspace rerender', async ({ page }) => {
  await installApi(page, { kind: 'pro', lang: 'en' });
  await gotoWorkspace(page, '/app');
  await expect(page.locator('#ws-study-nav')).toContainText(/Lab|Study|Estudo/);
  await page.locator('[data-i18n-toggle]').first().click();
  await expect(page.locator('#ws-study-nav')).toContainText(/Estudo|Criações|Caderno/);
  await expect(page.locator('#ws-study-nav')).toContainText(/Estudo|Lab|Atividade/);
  await saveShot(page, 'app-overview-pt');
  await page.locator('[data-i18n-toggle]').first().click();
  await expect(page.locator('#ws-study-nav')).toContainText('Lab');
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
  const review = page.locator('[data-hub="review"]');
  const practice = page.locator('[data-hub="practice"]');
  const insights = page.locator('[data-hub="insights"]');
  await expect(review).toBeVisible();
  await expect(practice).toBeVisible();
  const hubTops = await Promise.all([review, practice, insights].map((loc) => loc.evaluate((el) => el.getBoundingClientRect().top)));
  expect(hubTops[0]).toBeLessThan(hubTops[1]);
  expect(hubTops[1]).toBeLessThan(hubTops[2]);
  const overflow = await page.evaluate(() => document.documentElement.scrollWidth > document.documentElement.clientWidth + 2);
  expect(overflow).toBeFalsy();
  await saveShot(page, 'mobile-overview');
  await page.locator('#ws-menu-btn').click();
  await expect(page.locator('#ws-sidebar')).toBeVisible();
  const account = page.locator('#ws-nav-foot a[data-nav="account"]');
  await expect(account).toBeVisible();
  const accountBox = await account.boundingBox();
  expect(accountBox).toBeTruthy();
  expect(accountBox.y + accountBox.height).toBeLessThan(844);
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

test('Guest Study Hub is a presentation, not locked Pro cards', async ({ page }) => {
  await installApi(page, { kind: 'guest', signedIn: false });
  await gotoWorkspace(page, '/app');
  await expect(page.locator('#app-study')).toContainText(/Study with Atomurus|Estude com o Atomurus/);
  await expect(page.locator('#app-study')).toContainText(/Save chemistry resources, build sets and continue learning|Salve materiais de química/);
  await expect(page.locator('#app-study a[href*="signup"]').first()).toContainText(/Create free account|Criar conta gratuita/);
  await expect(page.locator('#app-study')).toContainText(/Visualize|Visualizar/);
  await expect(page.locator('#app-study')).toContainText(/With a free account|Com uma conta gratuita/);
  await expect(page.locator('#app-study')).toContainText(/Practice Chemistry|Praticar química/);
  await expect(page.locator('#app-study')).not.toContainText(/Unlock with Pro|Liberar com o Pro/);
  await expect(page.locator('#app-study')).not.toContainText(/chemistry workspace|workspace de química/i);
  await expect(page.locator('#app-study')).not.toContainText(/Start Smart Review|Começar Smart Review/);
  await saveShot(page, 'desktop-study-hub-guest');

  await page.locator('[data-i18n-toggle]').first().click();
  await expect(page.locator('#ws-userchip')).toContainText(/Criar conta/);
  await expect(page.locator('#app-study')).toContainText(/Estude com o Atomurus/);
  await page.locator('[data-i18n-toggle]').first().click();

  await gotoWorkspace(page, '/app?section=library');
  await expect(page.locator('#app-study')).toContainText(/Library|Biblioteca/);
  await expect(page.locator('#app-study a[href*="signup"]').first()).toContainText(/Create free account|Criar conta gratuita/);
});

test('Study Hub empty account shows architecture without invented progress', async ({ page }) => {
  const store = createStore();
  store.items = [];
  store.sets = [];
  store.cards = [];
  await installApi(page, { kind: 'free', store });
  await gotoWorkspace(page, '/app');
  await expect(page.locator('[data-study-hub="account"]')).toBeVisible();
  await expect(page.locator('#app-study')).toContainText(/Continue your chemistry work|Continue seu trabalho de química/);
  await expect(page.locator('#app-study')).toContainText(/You're caught up|Você está em dia/);
  await expect(page.locator('#app-study')).toContainText(/Practice Chemistry|Praticar química/);
  await expect(page.locator('#app-study')).toContainText(/Learning Paths|Caminhos de aprendizado/);
  await expect(page.locator('[data-hub="continue"]')).toHaveCount(0);
  await expect(page.locator('[data-hub="saved"]')).toHaveCount(0);
  await expect(page.locator('#app-study')).not.toContainText(/62% complete|62% concluído/);
  await expect(page.locator('#app-study')).not.toContainText(/Start Smart Review|Começar Smart Review/);
  await saveShot(page, 'desktop-study-hub-empty');
});

test('Study Hub shows saved resources from the library', async ({ page }) => {
  await installApi(page, { kind: 'free' });
  await gotoWorkspace(page, '/app');
  await expect(page.locator('[data-hub="saved"]')).toContainText('Iron');
  await expect(page.locator('[data-hub="continue"]')).toHaveCount(0);
  await saveShot(page, 'desktop-study-hub-library');
});

test('Study Hub summarizes study sets and due cards without Smart Review for Free', async ({ page }) => {
  const store = createStore();
  store.sets = [{
    id: SET_ID,
    title: 'Organic Chemistry',
    cardCount: 18,
    dueCount: 6,
    masteredCount: 0,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  }];
  await installApi(page, { kind: 'free', store });
  await gotoWorkspace(page, '/app');
  await expect(page.locator('[data-hub="sets"]')).toContainText('Organic Chemistry');
  await expect(page.locator('[data-hub="sets"]')).toContainText(/18 cards/);
  await expect(page.locator('[data-hub="sets"]')).toContainText(/6 due/);
  await expect(page.locator('[data-hub="review"]')).toContainText(/6 cards due in your sets|6 cards vencidos/);
  await expect(page.locator('#app-study')).not.toContainText(/Start Smart Review|Começar Smart Review/);
  await saveShot(page, 'desktop-study-hub-sets');
});

test('Study Hub Continue Learning uses real progress titles', async ({ page }) => {
  const store = createStore();
  store.continueStudying = [{
    contentType: 'element',
    contentKey: 'ferrum',
    progress: 62,
    lastPosition: '/periodic-table/ferrum',
    updatedAt: new Date().toISOString()
  }];
  await installApi(page, { kind: 'free', store });
  await gotoWorkspace(page, '/app');
  await expect(page.locator('[data-hub="continue"]')).toContainText('Iron');
  await expect(page.locator('[data-hub="continue"]')).toContainText(/62%/);
  await expect(page.locator('#app-study')).not.toContainText(/Nothing in progress yet|Nada em andamento/);
  await saveShot(page, 'desktop-study-hub-continue');
});

test('Study Hub Pro with due cards and insights stays a learning home', async ({ page }) => {
  const store = createStore();
  store.sets = [{
    id: SET_ID,
    title: 'Organic Chemistry',
    cardCount: 2,
    dueCount: 2,
    masteredCount: 0,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  }];
  store.cards = [dueCard({
    front: 'Periodic trend: atomic radius',
    lapses: 5,
    easeFactor: 1.5,
    reviewState: 'learning',
    studySetId: SET_ID
  })];
  await installApi(page, { kind: 'pro', store });
  await gotoWorkspace(page, '/app');
  await expect(page.locator('[data-hub="review"]')).toContainText(/Ready to study|Pronto para estudar/);
  await expect(page.locator('[data-hub="review"]').getByRole('link', { name: /Start Smart Review|Começar Smart Review/i })).toBeVisible();
  await expect(page.locator('[data-hub="insights"]')).toContainText(/Open Insights|Abrir Insights/);
  await expect(page.locator('[data-hub="weak"]')).toContainText('Periodic trend: atomic radius');
  await expect(page.locator('[data-hub="weak"]')).toContainText(/From review history|histórico de revisão/);
  await expect(page.locator('#app-study')).not.toContainText(/Unlock your potential|Become a chemistry master/i);
  await saveShot(page, 'desktop-study-hub-pro');
});

test('Guest workspace footer opens signup, not login', async ({ page }) => {
  await installApi(page, { kind: 'guest', signedIn: false });
  await gotoWorkspace(page, '/app');
  const signup = page.locator('#ws-nav-foot a[data-nav="signup"]');
  await expect(signup).toBeVisible();
  const footBox = await signup.boundingBox();
  expect(footBox).toBeTruthy();
  expect(footBox.y).toBeGreaterThan(64);
  expect(footBox.y + footBox.height).toBeLessThan(800);
  await expect(signup).toHaveAttribute('href', /\/signup/);
  await expect(page.locator('#ws-nav-foot a[data-nav="signin"]')).toHaveAttribute('href', /\/login/);
  await expect(page.locator('#ws-nav-foot a[data-nav="plans"]')).toHaveAttribute('href', /\/pricing/);
  await signup.click();
  await expect(page).toHaveURL(/\/signup/);
  await expect(page.locator('#auth-signup-form')).toBeVisible();
  await expect(page).toHaveTitle(/Create account|Criar conta/);
});

test('Signed-in Account and Plan leave Workspace', async ({ page }) => {
  await installApi(page, { kind: 'free' });
  await gotoWorkspace(page, '/app');
  await expect(page.locator('#ws-nav-foot a[data-nav="account"]')).toHaveAttribute('href', /\/account/);
  await expect(page.locator('#ws-userchip')).toHaveAttribute('href', /\/account/);
  await expect(page.locator('#ws-nav-foot a.is-upgrade')).toBeVisible();
  await expect(page.locator('#ws-study-nav a[href*="section=account"]')).toHaveCount(0);
  await page.locator('#ws-nav-foot a[data-nav="account"]').click();
  await expect(page).toHaveURL(/\/account/);
  await expect(page.locator('#app-study')).toContainText(/Account|Conta/);
});

test('Pro footer has Plan billing and no Upgrade', async ({ page }) => {
  await installApi(page, { kind: 'pro' });
  await gotoWorkspace(page, '/app');
  await expect(page.locator('#ws-nav-foot a[data-nav="upgrade"]')).toHaveCount(0);
  await expect(page.locator('#ws-nav-foot a.is-upgrade')).toHaveCount(0);
  await expect(page.locator('#ws-nav-foot a[data-nav="plan"]')).toHaveAttribute('href', /\/account\?tab=plan/);
});

test('Lab reactions fire with an equation and the still runs from the guide', async ({ page }) => {
  await installApi(page, { kind: 'free' });
  await gotoWorkspace(page, '/app?section=lab');
  await page.waitForSelector('.lab-beaker');

  // Iron in copper sulfate solution is a registered reaction, not free text.
  await page.locator('[data-dock="materials"]').click();
  await page.locator('.lab-chip[data-add="water"]').click();
  await page.locator('.lab-chip[data-add="cusulfate"]').click();
  await expect(page.locator('[data-lab-reaction]')).toHaveCount(0);
  await page.locator('.lab-chip[data-add="fe"]').click();
  await page.locator('[data-dock-close]').click();
  await expect(page.locator('[data-lab-reaction] .lab-reaction-eq')).toContainText('Fe + CuSO');
  await expect(page.locator('.lab-notes')).toContainText(/Fe \+ CuSO/);

  // Searching for gasoline reaches the conceptual separation, never a recipe.
  await page.locator('#lab-q').fill('gasolina');
  await page.locator('[data-lab-search]').evaluate((form) => form.requestSubmit());
  await expect(page.locator('[data-lab-guide]')).toContainText(/Petroleum Fractions|Frações do petróleo/i);

  // The distillation guide builds a working still step by step.
  await page.locator('#lab-q').fill('distillation');
  await page.locator('[data-lab-search]').evaluate((form) => form.requestSubmit());
  await page.locator('[data-dock-close]').click();
  await expect(page.locator('[data-lab-guide]')).toContainText(/Step 1 of 8|Passo 1 de 8/i);
  for (const type of ['round-flask', 'condenser', 'receiving-flask', 'heating-mantle']) {
    await page.locator(`[data-lab-guide] [data-add-vessel="${type}"]`).click();
  }
  await expect(page.locator('[data-lab-guide]')).toContainText(/Step 5 of 8|Passo 5 de 8/i);
  await page.locator('[data-lab-guide] [data-step-add="water"]').click();
  await page.locator('[data-lab-guide] [data-step-add="ethanol"]').click();
  // The charge went into the flask the step named, not the beaker that was selected.
  await expect(page.locator('.lab-round-flask')).toContainText('100 / 250 mL');
  await expect(page.locator('[data-vessel="beaker-a"]')).toContainText('25 / 250 mL');
  await expect(page.locator('[data-lab-guide]')).toContainText(/Step 6 of 8|Passo 6 de 8/i);
  await page.locator('[data-lab-guide] [data-step-connect]').click();
  await expect(page.locator('.lab-links path')).toHaveCount(2);
  await page.locator('[data-lab-guide] [data-step-heat="80"]').click();
  await expect(page.locator('[data-lab-guide]')).toContainText(/Step 8 of 8|Passo 8 de 8/i);
  await page.locator('[data-lab-guide] [data-step-distill]').click();
  await expect(page.locator('.lab-notes')).toContainText(/Distilled|Destilou/i);
  await expect(page.locator('.lab-notes')).toContainText(/azeotrope|azeótropo/i);
  await expect(page.locator('[data-lab-guide]')).toContainText(/All steps done|Todos os passos/i);
});

test('Workspace home is the Virtual Lab and Open Bench runs', async ({ page }) => {
  await installApi(page, { kind: 'free' });
  await gotoWorkspace(page, '/app');
  await expect(page.locator('[data-hub="lab"]')).toContainText(/Virtual Laboratory|Laboratório virtual/);
  await expect(page.locator('#ws-lab-q')).toBeVisible();
  await page.locator('#ws-study-nav a[href="/app?section=lab"]').first().click();
  await expect(page.locator('.lab-beaker')).toBeVisible();

  // The dock starts compact: material chips only exist once a panel is opened.
  await expect(page.locator('.lab-chip[data-add="water"]')).toHaveCount(0);
  await page.locator('[data-dock="materials"]').click();
  await page.locator('.lab-chip[data-add="water"]').click();
  await expect(page.locator('.lab-notes')).toContainText(/Water|água|H₂O|Added virtual/i);
  await expect.poll(async () => page.locator('[data-vessel="beaker-a"] .lab-liquid').evaluate((el) => Number(el.getAttribute('data-fill')) || 0)).toBeGreaterThan(15);
  await expect(page.locator('.lab-flask, .lab-cylinder')).toHaveCount(2);
  await page.locator('.lab-chip[data-add="nacl"]').click();
  await expect(page.locator('[data-vessel="beaker-a"]')).toContainText(/Saline|salina/i);
  await page.locator('[data-lab-pour]').click();
  await page.locator('[data-vessel="flask-b"]').click();
  await expect(page.locator('.lab-notes')).toContainText(/Poured|Transfer/i);
  await expect(page.locator('[data-lab-stage]')).toBeVisible();

  await page.locator('[data-dock="glassware"]').click();
  await page.locator('[data-add-vessel="test-tube"]').first().click();
  await expect(page.locator('.lab-test-tube')).toBeVisible();
  await page.locator('[data-dock="heat"]').click();
  await expect(page.locator('[data-add-vessel="condenser"]').first()).toBeVisible();
  await page.locator('[data-add-vessel="bunsen"]').first().click();
  await expect(page.locator('.lab-bunsen .lab-svg-flame')).toBeVisible();
  await page.locator('[data-dock="transfer"]').click();
  await page.locator('[data-add-vessel="burette"]').first().click();
  await expect(page.locator('.lab-burette')).toBeVisible();
  await page.locator('[data-dock="materials"]').click();
  await page.locator('.lab-chip[data-add="water"]').click();
  await page.locator('[data-dock-close]').click();
  await expect(page.locator('[data-dock-panel]')).toBeHidden();
  await page.locator('[data-lab-drop]').click();
  await page.locator('[data-vessel="beaker-a"]').click();
  await expect(page.locator('.lab-notes')).toContainText(/1 mL/);

  // Sound is opt-out and the choice survives a reload.
  const soundBtn = page.locator('[data-lab-sound]');
  await expect(soundBtn).toHaveAttribute('aria-pressed', 'true');
  await soundBtn.click();
  await expect(soundBtn).toHaveAttribute('aria-pressed', 'false');
  await expect.poll(async () => page.evaluate(() => localStorage.getItem('atomurus-lab-sound'))).toBe('0');

  await page.locator('#lab-q').fill('cocaine');
  await page.locator('[data-lab-search]').evaluate((form) => form.requestSubmit());
  await expect(page.locator('.lab-msg')).toContainText(/isn't available|não está disponível/i);

  // Searching an approved creation starts the step-by-step guide on this board.
  await page.locator('#lab-q').fill('sunscreen');
  await page.locator('[data-lab-search]').evaluate((form) => form.requestSubmit());
  await expect(page.locator('[data-lab-guide]')).toContainText(/Step 1 of 4|Passo 1 de 4/i);
  await expect(page.locator('[data-lab-guide] .lab-do-chip').first()).toBeVisible();
  await page.locator('[data-lab-guide] [data-lab-hint]').click();
  await expect(page.locator('[data-lab-guide] .lab-hints li')).toHaveCount(1);
  await page.locator('[data-lab-guide] [data-step-add="water"]').click();
  await page.locator('[data-lab-guide] [data-step-add="oil"]').click();
  await expect(page.locator('[data-lab-guide]')).toContainText(/Step 2 of 4|Passo 2 de 4/i);
  await expect(page.locator('[data-lab-guide]')).toContainText(/zinc oxide|óxido de zinco/i);
});