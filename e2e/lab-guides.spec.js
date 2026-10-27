const { test, expect } = require('@playwright/test');
const { installApi, gotoWorkspace } = require('./helpers');

async function openBench(page, lang) {
  await installApi(page, { kind: 'free', lang });
  await gotoWorkspace(page, '/app?section=lab&mode=bench');
  await page.waitForSelector('.lab-beaker');
}

async function searchGuide(page, query) {
  await page.locator('#lab-q').fill(query);
  await page.locator('[data-lab-search]').first().evaluate((form) => form.requestSubmit());
  const close = page.locator('[data-dock-close]');
  if (await close.isVisible()) await close.click();
}

async function addFromDock(page, id, amount) {
  if (!(await page.locator(`.lab-chip[data-add="${id}"]`).isVisible())) {
    await page.locator('[data-dock="materials"]').click();
  }
  await page.locator(`[data-amount="${amount}"]`).click();
  await page.locator(`.lab-chip[data-add="${id}"]`).click();
}

test('a guide started on a used bench asks first, and the default cleans only the board', async ({ page }) => {
  await openBench(page, 'en');
  await page.locator('.lab-beaker').first().click();
  await addFromDock(page, 'water', 50);
  await page.locator('[data-dock-close]').click();
  await page.locator('#lab-q').fill('prepare a solution');
  await page.locator('[data-lab-search]').first().evaluate((form) => form.requestSubmit());

  const guide = page.locator('[data-lab-guide]');
  await expect(guide).toContainText('The bench still has material from earlier work');
  // The default choice takes the keyboard focus.
  await expect(page.locator('[data-guide-clean]')).toBeFocused();
  await page.locator('[data-dock-close]').click();
  await page.locator('[data-guide-clean]').click();
  await expect(guide).toContainText(/Step 2 of 4/);
  await expect(page.locator('[data-vessel="beaker-a"]')).toContainText('0 / 250 mL');
  await expect(page.locator('[data-lab-status]')).toContainText('Bench cleared for the guide');

  // Undo brings the earlier work back.
  await page.locator('[data-lab-undo]').click();
  await expect(page.locator('[data-vessel="beaker-a"]')).toContainText('50 / 250 mL');
});

test('continuar mesmo assim mantém a bancada e avisa no guia', async ({ page }) => {
  await openBench(page, 'pt');
  await page.locator('.lab-beaker').first().click();
  await addFromDock(page, 'water', 50);
  await page.locator('[data-dock-close]').click();
  await searchGuide(page, 'preparar uma solução');
  await expect(page.locator('[data-lab-guide]')).toContainText('A bancada ainda tem material de antes');
  await page.locator('[data-guide-keep]').click();
  await expect(page.locator('[data-lab-guide] .lab-guide-note')).toContainText('Iniciado numa bancada usada');
  await expect(page.locator('[data-vessel="beaker-a"]')).toContainText('50 / 250 mL');
  // 50 mL is not the 60 mL the step asks for: the guide says so.
  await expect(page.locator('[data-lab-guide] .lab-guide-feedback')).toContainText('Esperado: 55–65 mL de água; este recipiente tem 50 mL.');
});

test('the pH challenge done right completes; a volume reading does not', async ({ page }) => {
  await openBench(page, 'en');
  await searchGuide(page, 'ph');
  const guide = page.locator('[data-lab-guide]');
  await expect(guide.locator('h2')).toContainText('pH Challenge');
  await expect(guide.locator('.lab-guide-safety')).toContainText('add acid to water');
  await page.locator('[data-step-add="water"]').click();
  await page.locator('[data-step-add="citric_acid"]').click();
  await page.locator('[data-step-add="bicarbonate"]').click();
  await expect(guide).toContainText(/Step 3 of 3/);
  await guide.locator('[data-measure="volume"]').click();
  await expect(guide.locator('.lab-guide-feedback')).toContainText('Take a pH reading of this vessel');
  await expect(page.locator('.lab-guide.is-complete')).toHaveCount(0);
  await guide.locator('[data-measure="ph"]').click();
  await expect(page.locator('.lab-guide.is-complete')).toContainText('Practice complete (virtual).');
});

test('a wrong amount or a skipped step gets feedback instead of «complete»', async ({ page }) => {
  await openBench(page, 'en');
  await searchGuide(page, 'ph');
  const guide = page.locator('[data-lab-guide]');
  await page.locator('.lab-beaker').first().click();
  await addFromDock(page, 'water', 25);
  await page.locator('[data-dock-close]').click();
  await page.locator('[data-step-add="citric_acid"]').click();
  await expect(guide.locator('.lab-guide-feedback')).toContainText('Expected 45–55 mL of water; this vessel has 25 mL.');
  await expect(guide).toContainText(/Step 1 of 3/);

  // Distillation: heating before the still is connected is a skipped step.
  await page.locator('[data-lab-guide] [data-stop-creation]').click();
  await page.locator('[data-lab-reset]').click();
  await searchGuide(page, 'distillation');
  for (const type of ['round-flask', 'condenser', 'receiving-flask', 'heating-mantle']) {
    await guide.locator(`[data-add-vessel="${type}"]`).click();
  }
  await guide.locator('[data-step-add="water"]').click();
  await guide.locator('[data-step-add="ethanol"]').click();
  await expect(guide).toContainText(/Step 6 of 8/);
  await page.locator('.lab-round-flask').click();
  await page.locator('[data-lab-context] [data-heat="10"]').click();
  for (let i = 0; i < 5; i += 1) await page.locator('[data-lab-context] [data-heat="10"]').click();
  await expect(guide.locator('.lab-guide-feedback')).toContainText('This step comes first: Connect flask to condenser');
  await guide.locator('[data-step-connect]').click();
  await expect(guide).toContainText(/Step 8 of 8/);
  await guide.locator('[data-step-distill]').click();
  await expect(guide.locator('.lab-profile')).toContainText('flat at 78 °C');
  await guide.locator('[data-step-observed]').click();
  await expect(page.locator('.lab-guide.is-complete')).toBeVisible();
});

test('water chips stop at the beaker capacity and the 7th beaker asks first', async ({ page }) => {
  await openBench(page, 'pt');
  await page.locator('.lab-beaker').first().click();
  for (let i = 0; i < 5; i += 1) await addFromDock(page, 'water', 50);
  await expect(page.locator('[data-vessel="beaker-a"]')).toContainText('250 / 250 mL');
  await expect(page.locator('[data-lab-status]')).toContainText('Recipiente cheio (250 mL)');
  await addFromDock(page, 'water', 50);
  await expect(page.locator('[data-vessel="beaker-a"]')).toContainText('250 / 250 mL');
  await page.locator('[data-dock-close]').click();

  await page.locator('[data-dock="glassware"]').click();
  for (let i = 0; i < 5; i += 1) await page.locator('.lab-dock-body [data-add-vessel="beaker"]').click();
  await expect(page.locator('[data-lab-world] .lab-beaker')).toHaveCount(6);
  await page.locator('.lab-dock-body [data-add-vessel="beaker"]').click();
  await expect(page.locator('[data-lab-status]')).toContainText('Béquer: já há 6 na bancada');
  await expect(page.locator('[data-lab-world] .lab-beaker')).toHaveCount(6);
  await page.locator('[data-lab-status] [data-vessel-confirmed]').click();
  await expect(page.locator('[data-lab-world] .lab-beaker')).toHaveCount(7);
});
