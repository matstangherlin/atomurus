const { test, expect } = require('@playwright/test');
const { installApi, gotoWorkspace } = require('./helpers');

function phReading(page) {
  return page.locator('.lab-kv').filter({ has: page.locator('span', { hasText: /^pH$/ }) }).locator('strong');
}

async function openChallenge(page) {
  await gotoWorkspace(page, '/app?section=lab&mode=bench');
  await page.waitForSelector('.lab-beaker');
  await page.locator('#lab-q').fill('ph');
  await page.locator('[data-lab-search]').first().evaluate((form) => form.requestSubmit());
  const close = page.locator('[data-dock-close]');
  if (await close.count()) await close.first().click();
  await expect(page.locator('[data-lab-guide] h2')).toBeVisible();
}

test('pH challenge adds 7.3 g and reads about 7', async ({ page }) => {
  await installApi(page, { kind: 'free' });
  await openChallenge(page);
  await expect(page.locator('[data-lab-guide] h2')).toContainText('pH Challenge');
  await page.locator('[data-step-add="water"]').click();
  await page.locator('[data-step-add="citric_acid"]').click();
  await expect(page.locator('.lab-guide-why')).toContainText(/not the equivalence point/i);
  await expect(page.locator('[data-step-add="bicarbonate"]')).toContainText('7.3');
  await page.locator('[data-step-add="bicarbonate"]').click();
  await expect(page.locator('.lab-glass-product')).toContainText('CO₂');
  await page.locator('[data-side="inspector"]').click();
  await expect(phReading(page)).toHaveText('7');
  await expect(page.locator('.ws-lede', { hasText: 'Open system' })).toBeVisible();
  await page.locator('[data-side="guide"]').click();
  await page.locator('[data-lab-guide] [data-measure="ph"]').click();
  await expect(page.locator('.lab-guide.is-complete')).toContainText(/not the equivalence point/i);
  await expect(page.locator('.lab-guide-step.is-done')).toHaveCount(3);
});

test('desafio de pH em português explica o ponto de equivalência', async ({ page }) => {
  await installApi(page, { kind: 'free', lang: 'pt' });
  await openChallenge(page);
  await expect(page.locator('[data-lab-guide] h2')).toContainText('Desafio de pH');
  await page.locator('[data-step-add="water"]').click();
  await page.locator('[data-step-add="citric_acid"]').click();
  await expect(page.locator('.lab-guide-why')).toContainText(/não é o ponto de equivalência/);
  await expect(page.locator('[data-step-add="bicarbonate"]')).toContainText('7.3');
  await page.locator('[data-step-add="bicarbonate"]').click();
  await page.locator('[data-side="inspector"]').click();
  await expect(page.locator('.ws-lede', { hasText: 'Sistema aberto' })).toBeVisible();
  await expect(phReading(page)).toHaveText('7');
  await page.locator('[data-side="guide"]').click();
  await page.locator('[data-lab-guide] [data-measure="ph"]').click();
  await expect(page.locator('.lab-guide.is-complete')).toContainText(/não é o ponto de equivalência/);
});

test('ready saline is 0.9% and dissolved copper sulfate is blue', async ({ page }) => {
  await installApi(page, { kind: 'free' });
  await gotoWorkspace(page, '/app?section=lab&mode=bench');
  await page.waitForSelector('.lab-beaker');
  await page.locator('.lab-beaker').first().click();
  await page.locator('[data-dock="ready"]').click();
  await expect(page.locator('[data-ready="saline_ready"]')).toContainText('0.9%');
  await expect(page.locator('[data-ready="cu_ready"]')).toContainText('20 g/100 mL');
  await page.locator('[data-ready="saline_ready"]').click();
  await page.locator('[data-side="inspector"]').click();
  await expect(page.locator('.lab-content-row', { hasText: 'Sodium chloride' })).toContainText('0.36');
  await expect(phReading(page)).toHaveText('7');
  await page.locator('[data-lab-empty]').click();
  if (!(await page.locator('[data-ready="cu_ready"]').isVisible())) {
    await page.locator('[data-dock="ready"]').click();
  }
  await page.locator('[data-ready="cu_ready"]').click();
  await expect(page.locator('.lab-kv').filter({ hasText: 'Appearance' })).toContainText('blue solution');
  await expect(page.locator('.lab-beaker .lab-liquid')).toHaveAttribute('fill', '#3F8CDA');
});
