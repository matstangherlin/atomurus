const { test, expect } = require('@playwright/test');
const path = require('node:path');
const fs = require('node:fs');
const { installApi, createStore, gotoWorkspace, userFixture } = require('./helpers');

const SHOTS = path.resolve(__dirname, '../test-results/e2e-screenshots');

function saveShot(page, name) {
  fs.mkdirSync(SHOTS, { recursive: true });
  return page.screenshot({ path: path.join(SHOTS, `${name}.png`), fullPage: true });
}

test('Free Reaction Workbench is a locked preview with no solver API calls', async ({ page }) => {
  let solverCalls = 0;
  await installApi(page, { kind: 'free' });
  page.on('request', (req) => {
    if (req.url().includes('/api/pro-lab/reaction/') || req.url().includes('/api/pro-lab/formula/') || req.url().includes('/api/pro-lab/solutions/') || req.url().includes('/api/pro-lab/equilibrium') || req.url().includes('/api/pro-lab/acid-base')) {
      solverCalls += 1;
    }
  });
  await gotoWorkspace(page, '/app?section=pro-lab');
  await expect(page.locator('#ws-lab-home')).toBeVisible({ timeout: 20_000 });
  const workbench = page.locator('[data-lab-tool="reactions"]');
  await expect(workbench).toBeVisible();
  await expect(workbench).toHaveAttribute('href', /section=pro-lab&tool=reactions/);
  await expect(page.locator('[data-lab-tool="formula"]')).toHaveAttribute('href', /tool=formula/);
  await expect(page.locator('[data-lab-tool="solutions"]')).toHaveAttribute('href', /tool=solutions/);
  await expect(page.locator('[data-lab-tool="equilibrium"]')).toHaveAttribute('href', /tool=equilibrium/);
  await expect(page.locator('[data-lab-tool="acid-base"]')).toHaveAttribute('href', /tool=acid-base/);
  await workbench.click();
  await expect(page.locator('#app-study')).toContainText(/Reaction Workbench|Laboratório de Reações/);
  await expect(page.locator('#app-study')).toContainText(/PRO/);
  await expect(page.locator('#app-study').getByRole('link', { name: /Upgrade|Assinar/i })).toBeVisible();
  await expect(page.locator('#ws-lab-balance')).toHaveCount(0);
  await expect(page.locator('#ws-lab-equation')).toHaveCount(0);
  expect(solverCalls).toBe(0);
  await saveShot(page, 'desktop-solver-locked-free');
  await page.locator('#app-study a[href*="section=pro-lab"]').first().click();
  await expect(page.locator('#ws-lab-home')).toBeVisible();
  await page.locator('[data-lab-tool="formula"]').click();
  await expect(page.locator('#ws-lab-formula-solve')).toHaveCount(0);
  await page.locator('#app-study a[href*="section=pro-lab"]').first().click();
  await expect(page.locator('#ws-lab-home')).toBeVisible();
  await page.locator('[data-lab-tool="solutions"]').click();
  await expect(page.locator('#ws-lab-sol-solve')).toHaveCount(0);
  await page.locator('#app-study a[href*="section=pro-lab"]').first().click();
  await expect(page.locator('#ws-lab-home')).toBeVisible();
  await page.locator('[data-lab-tool="equilibrium"]').click();
  await expect(page.locator('#ws-lab-eq-solve')).toHaveCount(0);
  await expect(page.locator('#app-study')).toContainText(/Calculate Kc and Kp|Calcule Kc e Kp/);
  await page.locator('#app-study a[href*="section=pro-lab"]').first().click();
  await expect(page.locator('#ws-lab-home')).toBeVisible();
  await page.locator('[data-lab-tool="acid-base"]').click();
  await expect(page.locator('#ws-lab-ab-solve')).toHaveCount(0);
  expect(solverCalls).toBe(0);
});

test('Pro Reaction Workbench: balance, stoichiometry, save and reopen', async ({ page }) => {
  const store = createStore();
  await installApi(page, { kind: 'pro', store });
  await gotoWorkspace(page, '/app?section=pro-lab');
  await expect(page.locator('#ws-lab-home')).toBeVisible({ timeout: 20_000 });
  await saveShot(page, 'desktop-pro-lab-solver-home');
  await expect(page.locator('[data-lab-tool="reactions"]')).toBeVisible();
  await page.locator('[data-lab-tool="reactions"]').click();
  await expect(page.locator('#ws-lab-equation')).toBeVisible();
  await saveShot(page, 'desktop-reaction-empty');
  await page.locator('#ws-lab-equation').fill('C2H6 + O2 -> CO2 + H2O');
  await page.locator('#ws-lab-balance').click();
  await expect(page.locator('#ws-lab-balanced')).toContainText(/C₂H₆|C2H6/);
  await expect(page.locator('#ws-lab-balanced')).toContainText(/7/);
  await expect(page.locator('#ws-lab-stoich')).toBeVisible();
  await saveShot(page, 'desktop-reaction-balanced');
  const firstQty = page.locator('.ws-solver-qty').first();
  await firstQty.locator('[name="amount"]').fill('10');
  await saveShot(page, 'desktop-reaction-stoich-inputs');
  await page.locator('#ws-lab-solve').click();
  await expect(page.locator('#ws-lab-basis')).toBeVisible();
  await expect(page.locator('#ws-lab-basis')).toContainText(/C₂H₆|C2H6/);
  await expect(page.locator('#ws-lab-result')).not.toContainText(/Limiting reagent|Reagente limitante/i);
  await expect(page.locator('#ws-lab-basis-note')).toContainText(/excess|excesso/i);
  await saveShot(page, 'desktop-reaction-limiting');
  await page.locator('#ws-lab-show-steps').click();
  await expect(page.locator('#ws-lab-steps')).toBeVisible();
  await expect(page.locator('#ws-lab-steps')).toContainText(/mol/);
  await saveShot(page, 'desktop-reaction-steps');
  await page.locator('#ws-lab-session-title').fill('Combustion of ethane');
  await page.locator('#ws-lab-save').click();
  await expect(page.locator('.ws-toast, [role="status"]').first()).toBeVisible();
  await gotoWorkspace(page, '/app?section=pro-lab');
  await expect(page.locator('#ws-lab-sessions')).toContainText('Combustion of ethane');
  await page.locator('#ws-lab-session-list a').first().click();
  await expect(page.locator('#ws-lab-equation')).toHaveValue(/C2H6/);
  await expect(page.locator('#ws-lab-balanced')).toBeVisible();
});

test('Formula Solver and Solution Builder', async ({ page }) => {
  await installApi(page, { kind: 'pro' });
  await gotoWorkspace(page, '/app?section=pro-lab&tool=formula');
  await expect(page.locator('#ws-lab-formula-solve')).toBeVisible();
  const rows = page.locator('#ws-lab-composition .ws-lab-scenario');
  await rows.nth(0).locator('[name="value"]').fill('40.00');
  await rows.nth(1).locator('[name="value"]').fill('6.71');
  await rows.nth(2).locator('[name="value"]').fill('53.29');
  await page.locator('#ws-lab-formula-solve').click();
  await expect(page.locator('#ws-lab-formula-answer')).toContainText(/CH₂O|CH2O/);
  await saveShot(page, 'desktop-formula-solver');

  await rows.nth(0).locator('[name="unit"]').selectOption('g');
  await rows.nth(1).locator('[name="unit"]').selectOption('g');
  await rows.nth(2).locator('[name="unit"]').selectOption('g');
  await rows.nth(0).locator('[name="value"]').fill('12');
  await rows.nth(1).locator('[name="value"]').fill('2');
  await rows.nth(2).locator('[name="value"]').fill('16');
  await page.locator('#ws-lab-formula-solve').click();
  await expect(page.locator('#ws-lab-formula-answer')).toContainText(/CH₂O|CH2O/);
  await saveShot(page, 'desktop-formula-mass');

  await page.locator('#ws-lab-formula-mode-molecular').click();
  await page.locator('#ws-lab-empirical-formula').fill('CH2O');
  await page.locator('#ws-lab-molar-mass').fill('180.16');
  await page.locator('#ws-lab-formula-solve').click();
  await expect(page.locator('#ws-lab-formula-answer')).toContainText(/C₆H₁₂O₆|C6H12O6/);
  await saveShot(page, 'desktop-formula-molecular');

  await gotoWorkspace(page, '/app?section=pro-lab&tool=solutions');
  await expect(page.locator('#ws-lab-sol-solve')).toBeVisible();
  await page.locator('#ws-lab-solute').fill('NaCl');
  await page.locator('#ws-lab-conc').fill('0.5');
  await page.locator('#ws-lab-vol').fill('1');
  await page.locator('#ws-lab-sol-solve').click();
  await expect(page.locator('#ws-lab-sol-answer')).toContainText(/29\.2/);
  await expect(page.locator('#app-study')).toContainText(/additive solution volumes|volumes de solução aditivos/i);
  await saveShot(page, 'desktop-solution-builder');
});

test('Limiting reagent, stoichiometric mixture, calculation basis and hydrate display', async ({ page }) => {
  await installApi(page, { kind: 'pro' });
  await gotoWorkspace(page, '/app?section=pro-lab&tool=reactions');
  await page.locator('#ws-lab-equation').fill('H2 + O2 -> H2O');
  await page.locator('#ws-lab-balance').click();
  await expect(page.locator('#ws-lab-balanced-heading')).toBeVisible();
  await expect(page.locator('#ws-lab-balanced')).toBeVisible();
  const qtys = page.locator('.ws-solver-qty');
  await qtys.nth(0).locator('[name="kind"]').selectOption('amount');
  await qtys.nth(0).locator('[name="amount"]').fill('2');
  await page.locator('#ws-lab-solve').click();
  await expect(page.locator('#ws-lab-basis')).toBeVisible();
  await expect(page.locator('#ws-lab-basis')).toContainText(/H₂|H2/);
  await expect(page.locator('#ws-lab-limiting')).toHaveCount(0);
  await expect(page.locator('#ws-lab-result')).not.toContainText(/Limiting reagent|Reagente limitante/i);
  await saveShot(page, 'desktop-calculation-basis');

  await qtys.nth(0).locator('[name="kind"]').selectOption('mass');
  await qtys.nth(0).locator('[name="amount"]').fill('10');
  await qtys.nth(1).locator('[name="amount"]').fill('40');
  await page.locator('#ws-lab-solve').click();
  await expect(page.locator('#ws-lab-limiting')).toContainText(/O₂|O2/);
  await expect(page.locator('#ws-lab-basis')).toHaveCount(0);
  await saveShot(page, 'desktop-complete-limiting');

  await qtys.nth(0).locator('[name="kind"]').selectOption('amount');
  await qtys.nth(0).locator('[name="amount"]').fill('2');
  await qtys.nth(1).locator('[name="kind"]').selectOption('amount');
  await qtys.nth(1).locator('[name="amount"]').fill('1');
  await page.locator('#ws-lab-solve').click();
  await expect(page.locator('#ws-lab-mixture')).toBeVisible();
  await expect(page.locator('#ws-lab-limiting')).toHaveCount(0);
  await saveShot(page, 'desktop-stoichiometric-mixture');

  await page.locator('#ws-lab-equation').fill('CuSO4·5H2O -> CuSO4 + H2O');
  await page.locator('#ws-lab-balance').click();
  await expect(page.locator('#ws-lab-balanced')).toContainText('CuSO₄·5H₂O');
  await expect(page.locator('#ws-lab-result')).toHaveText('');
  await saveShot(page, 'desktop-hydrate-display');
});

test('Reaction Workbench mobile and dark', async ({ page }) => {
  await page.setViewportSize({ width: 360, height: 740 });
  await installApi(page, { kind: 'pro' });
  await gotoWorkspace(page, '/app?section=pro-lab&tool=reactions');
  await expect(page.locator('#ws-lab-equation')).toBeVisible();
  await saveShot(page, 'mobile-360-reaction-input');
  await page.locator('#ws-lab-equation').fill('C2H6 + O2 -> CO2 + H2O');
  await page.locator('#ws-lab-balance').click();
  await expect(page.locator('#ws-lab-balanced')).toBeVisible();
  await saveShot(page, 'mobile-360-reaction-balanced');
  const overflow = await page.evaluate(() => document.documentElement.scrollWidth > document.documentElement.clientWidth + 2);
  expect(overflow).toBeFalsy();

  await gotoWorkspace(page, '/app?section=pro-lab&tool=equilibrium');
  await page.locator('#ws-lab-eq-equation').fill('H2(g) + I2(g) ⇌ 2HI(g)');
  await page.locator('#ws-lab-eq-mode-ice').click();
  await page.locator('#ws-lab-eq-k').fill('50');
  await page.locator('#ws-lab-eq-solve').click();
  await expect(page.locator('#ws-lab-ice-table')).toBeVisible();
  await saveShot(page, 'mobile-360-ice-table');
  const iceOverflow = await page.evaluate(() => document.documentElement.scrollWidth > document.documentElement.clientWidth + 2);
  expect(iceOverflow).toBeFalsy();
  await gotoWorkspace(page, '/app?section=pro-lab&tool=acid-base');
  await page.locator('#ws-lab-ab-C').fill('0.1');
  await page.locator('#ws-lab-ab-Ka').fill('1e-5');
  await page.locator('#ws-lab-ab-solve').click();
  await expect(page.locator('#ws-lab-ab-answer')).toContainText(/pH = /);
  await saveShot(page, 'mobile-360-weak-acid');
  await page.locator('#ws-lab-ab-mode-buffer').click();
  await page.locator('#ws-lab-ab-HA').fill('0.1');
  await page.locator('#ws-lab-ab-A').fill('0.1');
  await page.locator('#ws-lab-ab-buf-pKa').fill('4.76');
  await page.locator('#ws-lab-ab-solve').click();
  await expect(page.locator('#ws-lab-ab-answer')).toContainText(/pH = 4\.76/);
  await saveShot(page, 'mobile-360-buffer');

  await gotoWorkspace(page, '/app?section=pro-lab&tool=reactions');
  await page.locator('#ws-lab-equation').fill('C2H6 + O2 -> CO2 + H2O');
  await page.locator('#ws-lab-balance').click();
  await expect(page.locator('#ws-lab-balanced')).toBeVisible();

  await page.setViewportSize({ width: 390, height: 844 });
  await page.locator('.ws-solver-qty').first().locator('[name="amount"]').fill('10');
  await page.locator('#ws-lab-solve').click();
  await expect(page.locator('#ws-lab-result')).toBeVisible();
  await saveShot(page, 'mobile-390-stoich-result');

  await page.setViewportSize({ width: 768, height: 1024 });
  await gotoWorkspace(page, '/app?section=pro-lab&tool=formula');
  await saveShot(page, 'tablet-768-formula');

  await installApi(page, { kind: 'pro', theme: 'dark' });
  await gotoWorkspace(page, '/app?section=pro-lab');
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark');
  await saveShot(page, 'dark-pro-lab-solver-home');
  await gotoWorkspace(page, '/app?section=pro-lab&tool=reactions');
  await expect(page.locator('#ws-lab-equation')).toBeVisible();
  await saveShot(page, 'dark-reaction-workbench');
  await gotoWorkspace(page, '/app?section=pro-lab&tool=equilibrium');
  await expect(page.locator('#ws-lab-eq-equation')).toBeVisible();
  await saveShot(page, 'dark-equilibrium-workbench');
  await gotoWorkspace(page, '/app?section=pro-lab&tool=acid-base');
  await expect(page.locator('#ws-lab-ab-solve')).toBeVisible();
  await saveShot(page, 'dark-acid-base-workbench');
});

test('Public calculator solver discovery is not a modal', async ({ page }) => {
  await installApi(page, { kind: 'guest', signedIn: false });
  await page.goto('/calculators.html');
  await expect(page.locator('#solver-discover')).toBeVisible();
  await expect(page.locator('#solver-discover')).toContainText(/Need to solve a full reaction|resolver uma reação/i);
  await expect(page.locator('#solver-discover a')).toHaveAttribute('href', /tool=reactions/);
});

test('Pricing lists Chemistry Solver separately', async ({ page }) => {
  await page.goto('/pricing');
  await expect(page.locator('#pricing-title-copy')).toContainText(/Solve, visualize, analyze and study chemistry|Resolva, visualize, analise e estude química/i);
  await expect(page.locator('#pricing-pro-list')).toContainText(/ADVANCED CHEMISTRY SOLVERS/);
  await expect(page.locator('#pricing-pro-list')).toContainText(/Reaction balancing|Balanceamento/);
  await expect(page.locator('#pricing-pro-list')).toContainText(/Chemical equilibrium|Equilíbrio químico/);
  await saveShot(page, 'desktop-pricing-solver');
});

test('Pro Equilibrium Workbench: Kc, ICE, save and reopen', async ({ page }) => {
  const store = createStore();
  await installApi(page, { kind: 'pro', store });
  await gotoWorkspace(page, '/app?section=pro-lab&tool=equilibrium');
  await expect(page.locator('#ws-lab-eq-equation')).toBeVisible();
  await expect(page.locator('#ws-lab-eq-equation')).toHaveValue(/H2\(g\).*I2\(g\).*2HI\(g\)/);
  await page.locator('#ws-lab-eq-solve').click();
  await expect(page.locator('#ws-lab-eq-answer')).toContainText(/Kc = 4|4\.00/);
  await saveShot(page, 'desktop-equilibrium-kc');
  await page.locator('#ws-lab-eq-kind-kp').click();
  await page.locator('#ws-lab-eq-solve').click();
  await expect(page.locator('#ws-lab-eq-answer')).toContainText(/Kp = 4|4\.00/);
  await saveShot(page, 'desktop-equilibrium-kp');
  await page.locator('#ws-lab-eq-kind-kc').click();
  await page.locator('#ws-lab-eq-mode-quotient').click();
  await page.locator('#ws-lab-eq-k').fill('50');
  await page.locator('#ws-lab-eq-solve').click();
  await expect(page.locator('#ws-lab-eq-answer')).toContainText(/Q/);
  await saveShot(page, 'desktop-equilibrium-q');
  await page.locator('#ws-lab-eq-mode-ice').click();
  await page.locator('#ws-lab-eq-k').fill('50');
  await page.locator('#ws-lab-eq-solve').click();
  await expect(page.locator('#ws-lab-ice-table')).toBeVisible();
  await expect(page.locator('#ws-lab-ice-table thead th')).toHaveCount(4);
  await saveShot(page, 'desktop-equilibrium-ice');
  await page.locator('#ws-lab-session-title').fill('HI ICE');
  await page.locator('#ws-lab-save').click();
  await expect(page.locator('.ws-toast, [role="status"]').first()).toBeVisible();
  await gotoWorkspace(page, '/app?section=pro-lab');
  await expect(page.locator('#ws-lab-sessions')).toContainText('HI ICE');
  await page.locator('#ws-lab-session-list a').first().click();
  await expect(page.locator('#ws-lab-eq-equation')).toHaveValue(/HI/);
  await expect(page.locator('#ws-lab-ice-table, #ws-lab-eq-answer').first()).toBeVisible();
});

test('Pro Acid–Base Workbench: weak acid and buffer', async ({ page }) => {
  await installApi(page, { kind: 'pro' });
  await gotoWorkspace(page, '/app?section=pro-lab&tool=acid-base');
  await expect(page.locator('#ws-lab-ab-solve')).toBeVisible();
  await page.locator('#ws-lab-ab-C').fill('0.1');
  await page.locator('#ws-lab-ab-Ka').fill('1e-5');
  await page.locator('#ws-lab-ab-solve').click();
  await expect(page.locator('#ws-lab-ab-answer')).toContainText(/pH = /);
  await saveShot(page, 'desktop-acid-base-weak-acid');
  await page.locator('#ws-lab-ab-mode-weak-base').click();
  await page.locator('#ws-lab-ab-Cb').fill('0.1');
  await page.locator('#ws-lab-ab-Kb').fill('1e-5');
  await page.locator('#ws-lab-ab-solve').click();
  await expect(page.locator('#ws-lab-ab-answer')).toContainText(/pH = /);
  await saveShot(page, 'desktop-acid-base-weak-base');
  await page.locator('#ws-lab-ab-mode-buffer').click();
  await page.locator('#ws-lab-ab-HA').fill('0.1');
  await page.locator('#ws-lab-ab-A').fill('0.1');
  await page.locator('#ws-lab-ab-buf-pKa').fill('4.76');
  await page.locator('#ws-lab-ab-solve').click();
  await expect(page.locator('#ws-lab-ab-answer')).toContainText(/pH = 4\.76/);
  await saveShot(page, 'desktop-acid-base-buffer');
  await page.locator('#ws-lab-session-title').fill('Acetate buffer');
  await page.locator('#ws-lab-save').click();
  await expect(page.locator('.ws-toast, [role="status"]').first()).toBeVisible();
  await gotoWorkspace(page, '/app?section=pro-lab');
  await expect(page.locator('#ws-lab-sessions')).toContainText('Acetate buffer');
  await page.locator('#ws-lab-session-list a').first().click();
  await expect(page.locator('#ws-lab-ab-solve')).toBeVisible();
  await expect(page.locator('#ws-lab-ab-answer')).toContainText(/pH = 4\.76/);
});

test('Basic pH calculator still works and points at Acid–Base Workbench', async ({ page }) => {
  const free = userFixture('free');
  await page.route('**/api/ads-config', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ ok: true, adsEnabled: true, signedIn: true, user: free })
    });
  });
  await page.goto('/calculators.html');
  await expect.poll(() => page.evaluate(() => Boolean(window.AtomurusLabToolGate))).toBe(true);
  await page.locator('.calc-menu-item[data-target="ph"]').click();
  await expect(page.locator('#lab-tool-gate-ph')).toHaveCount(0);
  await page.locator('#tab-ph button.calc-btn-run').click();
  await expect(page.locator('#ph-result-body')).toContainText(/pH/);
  await expect(page.locator('#ph-acid-base-discover a')).toHaveAttribute('href', /tool=acid-base/);
  await page.locator('.calc-menu-item[data-target="equilibrium"]').click();
  await expect(page.locator('#tab-equilibrium')).toBeVisible();
  await expect(page.locator('#tab-equilibrium a[href*="tool=equilibrium"]')).toBeVisible();
});
