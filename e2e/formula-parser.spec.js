const { test, expect } = require('@playwright/test');

test('molar mass uses the strict parser and five significant figures', async ({ page }) => {
  await page.goto('/calculators.html#molar');
  await expect(page.locator('#mm-result-body')).toContainText('98.072');
  await page.locator('#mm-input').fill('CuSO4.5H2O');
  await page.locator('#tab-molar .calc-btn-run').click();
  await expect(page.locator('#mm-result-body')).toContainText('249.68');
  await page.locator('#mm-input').fill('H2O!');
  await page.locator('#tab-molar .calc-btn-run').click();
  await expect(page.locator('#mm-result-body')).toContainText(/invalid character '!'/i);
  await page.locator('#mm-input').fill('AcOH');
  await page.locator('#tab-molar .calc-btn-run').click();
  await expect(page.locator('#mm-result-body')).toContainText(/Ac = actinium/i);
});

test('massa molar em português mostra o erro de parênteses', async ({ page }) => {
  await page.addInitScript(() => {
    try { localStorage.setItem('atomurus-lang', 'pt'); } catch (_err) {}
  });
  await page.goto('/calculators.pt.html#molar');
  await page.locator('#mm-input').fill('Ca(OH');
  await page.locator('#tab-molar .calc-btn-run').click();
  await expect(page.locator('#mm-result-body')).toContainText('Parênteses não balanceados');
  await page.locator('#mm-input').fill('2H2O');
  await page.locator('#tab-molar .calc-btn-run').click();
  await expect(page.locator('#mm-result-body')).toContainText('não são parte da fórmula');
});
