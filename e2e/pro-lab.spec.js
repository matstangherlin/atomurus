const { test, expect } = require('@playwright/test');
const path = require('node:path');
const fs = require('node:fs');
const { installApi, createStore, dueCard, SET_ID, gotoWorkspace } = require('./helpers');

const SHOTS = path.resolve(__dirname, '../test-results/e2e-screenshots');

function saveShot(page, name) {
  fs.mkdirSync(SHOTS, { recursive: true });
  return page.screenshot({ path: path.join(SHOTS, `${name}.png`), fullPage: true });
}

async function waitForLab(page) {
  await expect(page.locator('#ws-lab-home')).toBeVisible({ timeout: 20_000 });
}

test('Free opens Pro Lab locked without calling premium APIs', async ({ page }) => {
  let calculateCalls = 0;
  await installApi(page, { kind: 'free' });
  page.on('request', (req) => {
    if (req.url().includes('/api/pro-lab/')) calculateCalls += 1;
  });
  await gotoWorkspace(page, '/app?section=pro-lab');
  await expect(page.locator('#app-study')).toContainText(/Pro Lab/i);
  await expect(page.locator('#app-study')).toContainText(/PRO/);
  await expect(page.locator('#app-study')).toContainText(/Advanced analysis tools|Ferramentas avançadas/i);
  await expect(page.locator('#app-study').getByRole('link', { name: /Upgrade to Pro|Assinar o Pro/i }).first()).toBeVisible();
  await expect(page.locator('#ws-lab-home')).toHaveCount(0);
  await expect(page.locator('#ws-lab-calculate')).toHaveCount(0);
  expect(calculateCalls).toBe(0);
  await saveShot(page, 'desktop-pro-lab-home-free');
});

test('Trial opens Pro Lab tools', async ({ page }) => {
  await installApi(page, { kind: 'trial' });
  await gotoWorkspace(page, '/app?section=pro-lab');
  await waitForLab(page);
  await expect(page.locator('#ws-lab-home .is-locked')).toHaveCount(0);
  await expect(page.locator('[data-lab-tool="calculations"]')).toBeVisible();
  await saveShot(page, 'desktop-pro-lab-home-trial');
});

test('Pro Lab calculations: three scenarios, save, reopen', async ({ page }) => {
  const store = createStore();
  await installApi(page, { kind: 'pro', store });
  await gotoWorkspace(page, '/app?section=pro-lab');
  await waitForLab(page);
  await saveShot(page, 'desktop-pro-lab-home-pro');

  await page.locator('[data-lab-tool="calculations"]').click();
  await expect(page.locator('#ws-lab-calculate')).toBeVisible();
  await page.locator('#ws-lab-kind-dilution').click();
  const first = page.locator('.ws-lab-scenario').nth(0);
  await first.locator('[name="label"]').fill('Experiment A');
  await first.locator('[name="C1"]').fill('1');
  await first.locator('[name="V1"]').fill('10');
  await first.locator('[name="C2"]').fill('0.1');
  await page.locator('#ws-lab-add-scenario').click();
  const second = page.locator('.ws-lab-scenario').nth(1);
  await second.locator('[name="label"]').fill('Experiment B');
  await second.locator('[name="C1"]').fill('2');
  await second.locator('[name="V1"]').fill('10');
  await second.locator('[name="C2"]').fill('0.1');
  await page.locator('#ws-lab-add-scenario').click();
  const third = page.locator('.ws-lab-scenario').nth(2);
  await third.locator('[name="label"]').fill('Experiment C');
  await third.locator('[name="C1"]').fill('1');
  await third.locator('[name="V1"]').fill('25');
  await third.locator('[name="C2"]').fill('0.5');
  await page.locator('#ws-lab-calculate').click();
  await expect(page.locator('#ws-lab-calc-live')).toContainText(/Results updated|Resultados/);
  await expect(page.locator('.ws-lab-result')).toHaveCount(3);
  await page.locator('#ws-lab-session-title').fill('Acid-base experiment');
  await page.locator('#ws-lab-save').click();
  await expect(page.locator('.ws-toast, [role="status"]')).toBeVisible();
  await saveShot(page, 'desktop-pro-lab-calculations');

  await gotoWorkspace(page, '/app?section=pro-lab');
  await waitForLab(page);
  await expect(page.locator('#ws-lab-sessions')).toContainText('Acid-base experiment');
  await saveShot(page, 'desktop-pro-lab-sessions');
  await page.locator('#ws-lab-session-list a').first().click();
  await expect(page.locator('#ws-lab-session-title')).toHaveValue('Acid-base experiment');
  await expect(page.locator('.ws-lab-scenario')).toHaveCount(3);
});

test('Element Compare Pro: save and add to Study Set then Smart Review', async ({ page }) => {
  const store = createStore();
  store.sets = [{
    id: SET_ID,
    title: 'Metals',
    description: '',
    cardCount: 0,
    dueCount: 0,
    masteredCount: 0,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  }];
  await installApi(page, { kind: 'pro', store });
  await gotoWorkspace(page, '/app?section=pro-lab&tool=elements');
  await expect(page.locator('#ws-lab-add-element')).toBeVisible();
  for (const z of ['26', '27', '28', '29']) {
    await page.locator('#ws-lab-z').fill(z);
    await page.locator('#ws-lab-add-element').click();
  }
  await page.locator('#ws-lab-compare').click();
  await expect(page.locator('#app-study')).toContainText('Fe');
  await expect(page.locator('#app-study')).toContainText('55.845');
  await page.locator('#ws-lab-session-title').fill('Transition metals comparison');
  await page.locator('#ws-lab-save').click();
  await expect(page.locator('.ws-toast, [role="status"]').first()).toBeVisible();
  await saveShot(page, 'desktop-pro-lab-elements');

  await page.locator('#ws-lab-add-set').click();
  await expect(page.locator('#ws-dialog-host select, #ws-dialog-host .ws-input').first()).toBeVisible();
  await page.locator('#ws-dialog-host .ws-btn-primary').click();
  await expect(page.getByText(/Added to Study Set|Adicionado/i).first()).toBeVisible();

  await page.locator('#ws-lab-generate').click();
  await page.locator('#ws-dialog-host .ws-btn-primary').click();
  await expect(page.getByText(/flashcards created|flashcards criados|Added to Study Set|Adicionado|nenhum card/i).first()).toBeVisible();

  store.cards = [dueCard(), dueCard({ id: 'cccccccc-dddd-4eee-8fff-000000000000', front: 'Atomic number of iron?', back: '26' })];
  await gotoWorkspace(page, '/app?section=review&start=1');
  await expect(page.locator('[data-review-front]')).toBeVisible();
  await expect(page.locator('#app-study')).toContainText(/iron|Fe/i);
});

test('Molecule Compare and Atomic Compare Pro', async ({ page }) => {
  await installApi(page, { kind: 'pro' });
  await gotoWorkspace(page, '/app?section=pro-lab&tool=molecules');
  await expect(page.locator('#ws-lab-compare')).toBeVisible();
  await expect(page.locator('#app-study')).toContainText(/visualization|visualiza/i);
  await saveShot(page, 'desktop-pro-lab-molecules');

  await gotoWorkspace(page, '/app?section=pro-lab&tool=atomic');
  await expect(page.locator('#ws-lab-compare')).toBeVisible();
  await expect(page.locator('.ws-lab-bohr').first()).toBeVisible();
  await saveShot(page, 'desktop-pro-lab-atomic');
});

test('Pro Lab mobile stack and dark theme', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await installApi(page, { kind: 'pro' });
  await gotoWorkspace(page, '/app?section=pro-lab');
  await waitForLab(page);
  await saveShot(page, 'mobile-pro-lab');

  await page.locator('[data-lab-tool="calculations"]').click();
  await expect(page.locator('#ws-lab-calculate')).toBeVisible();
  await saveShot(page, 'mobile-pro-lab-calculations');

  await gotoWorkspace(page, '/app?section=pro-lab&tool=elements');
  await expect(page.locator('#ws-lab-add-element')).toBeVisible();
  await page.locator('#ws-lab-z').fill('26');
  await page.locator('#ws-lab-add-element').click();
  await page.locator('#ws-lab-z').fill('27');
  await page.locator('#ws-lab-add-element').click();
  await page.locator('#ws-lab-compare').click();
  await expect(page.locator('.ws-lab-stack')).toBeVisible();
  await saveShot(page, 'mobile-pro-lab-elements');
});

test('Pro Lab home light and dark', async ({ page }) => {
  await installApi(page, { kind: 'pro', theme: 'light' });
  await gotoWorkspace(page, '/app?section=pro-lab');
  await waitForLab(page);
  await saveShot(page, 'desktop-pro-lab-home-light');

  await installApi(page, { kind: 'pro', theme: 'dark' });
  await gotoWorkspace(page, '/app?section=pro-lab');
  await waitForLab(page);
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark');
  await saveShot(page, 'desktop-pro-lab-home-dark');
});

test('Public calculator discovery stays free and offers Pro Lab', async ({ page }) => {
  await installApi(page, { kind: 'guest', signedIn: false });
  await page.goto('/calculators.html');
  await expect(page.locator('[data-pro-lab-tool="calculations"]')).toBeVisible();
  await expect(page.locator('.pro-lab-discover-cta')).toBeVisible();
  await page.locator('.pro-lab-discover-cta').click();
  await expect(page.locator('#pro-lab-discover-dialog')).toBeVisible();
  await expect(page.locator('#pro-lab-discover-dialog')).toContainText(/Unlock Pro Lab|Liberar o Pro Lab/);
  await expect(page.getByRole('link', { name: /Create account|Criar conta/i })).toBeVisible();
});
