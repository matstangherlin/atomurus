const { test, expect } = require('@playwright/test');

test('public calculators reject impossible inputs and show 101325 Pa', async ({ page }) => {
  const errors = [];
  page.on('pageerror', (err) => errors.push(String(err)));
  await page.goto('/calculators.html#ideal');
  await page.locator('#ig-n').fill('-2');
  await page.locator('#tab-ideal .calc-btn-run').click();
  await expect(page.locator('#ig-result-body')).toContainText(/positive value/i);

  await page.locator('[data-target="dilute"]').click();
  await page.locator('#dl-C1').fill('-1');
  await page.locator('#tab-dilute .calc-btn-run').click();
  await expect(page.locator('#dl-result-body')).toContainText(/positive/i);
  await page.locator('#dl-C1').fill('1');
  await page.locator('#dl-V1').fill('25');
  await page.locator('#dl-C2').fill('5');
  await page.locator('#tab-dilute .calc-btn-run').click();
  await expect(page.locator('#dl-result-body')).toContainText(/not a dilution/i);

  await page.locator('[data-target="unit"]').click();
  await page.locator('#uc-cat').selectOption('temperature');
  await page.locator('#uc-from').selectOption('°C');
  await page.locator('#uc-to').selectOption('K');
  await page.locator('#uc-value').fill('-300');
  await page.locator('#tab-unit .calc-btn-run').click();
  await expect(page.locator('#uc-result-body')).toContainText(/absolute zero/i);
  await page.locator('#uc-cat').selectOption('pressure');
  await page.locator('#uc-from').selectOption('atm');
  await page.locator('#uc-to').selectOption('Pa');
  await page.locator('#uc-value').fill('1');
  await page.locator('#tab-unit .calc-btn-run').click();
  await expect(page.locator('#uc-result-body')).toContainText('101325');
  await expect(page.locator('#uc-result-body')).not.toContainText('1.013e+5');

  await page.locator('[data-target="thermo"]').click();
  await expect(page.locator('#tm-t-unit')).toBeVisible();
  await expect(page.locator('#tm-t-unit')).toHaveValue('C');
  await expect(page.locator('#tm-t-unit option[value="K"]')).toHaveCount(1);
  expect(errors).toEqual([]);
});

test('pH 1e-8 em português mostra 6.98 e a autoionização', async ({ page }) => {
  const errors = [];
  page.on('pageerror', (err) => errors.push(String(err)));
  await page.addInitScript(() => {
    try { localStorage.setItem('atomurus-lang', 'pt'); } catch (_err) {}
  });
  await page.goto('/calculators.pt.html#ph');
  await page.locator('#ph-mode').selectOption('H');
  await page.locator('#ph-H').fill('1e-8');
  await page.locator('#tab-ph .calc-btn-run').click();
  await expect(page.locator('#ph-result-body')).toContainText('6.98');
  await expect(page.locator('[data-ph-autoion]')).toContainText('autoionização');
  await expect(page.locator('#ph-result-body')).toContainText('levemente ácida');
  await page.locator('#ph-mode').selectOption('pH');
  await page.locator('#ph-pH').fill('6.9');
  await page.locator('#tab-ph .calc-btn-run').click();
  await expect(page.locator('#ph-result-body')).toContainText('levemente ácida');
  await page.locator('#ph-pH').fill('7');
  await page.locator('#tab-ph .calc-btn-run').click();
  await expect(page.locator('#ph-result-body')).toContainText('neutra');
  expect(errors).toEqual([]);
});
