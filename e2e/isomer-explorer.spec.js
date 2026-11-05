// @ts-check
const { test, expect } = require('@playwright/test');

test('isomer explorer lists every isomer of a formula and names the pair type', async ({ page }) => {
  await page.goto('/viewer/isomerism/constitutional/metamerism.html?lang=en');
  const ex = page.locator('#iso-explorer');
  await expect(ex).toBeVisible();
  await page.fill('#iso-x-formula', 'C5H12');
  await ex.locator('[data-form="formula"] button').click();
  await expect(ex.locator('.iso-x-card')).toHaveCount(3);
  await ex.locator('.iso-x-card').nth(0).click();
  await ex.locator('.iso-x-card').nth(1).click();
  await expect(ex.locator('.iso-x-type')).toHaveText(/Chain isomerism/);
  await page.fill('#iso-x-formula', 'C4H10O');
  await ex.locator('[data-form="formula"] button').click();
  await expect(ex.locator('.iso-x-card')).toHaveCount(7);
  await page.fill('#iso-x-formula', 'C4H11');
  await ex.locator('[data-form="formula"] button').click();
  await expect(ex.locator('.iso-x-error')).toBeVisible();
});

test('isomer explorer analyses chirality and meso forms', async ({ page }) => {
  await page.goto('/viewer/isomerism/spatial/optical.html?lang=pt-BR');
  const ex = page.locator('#iso-explorer');
  await expect(ex.locator('[data-tab="one"]')).toHaveAttribute('aria-selected', 'true');
  await page.fill('#iso-x-struct', 'HOOC-CH(OH)-CH(OH)-COOH');
  await ex.locator('[data-form="struct"] button').click();
  await expect(ex.locator('.iso-x-facts')).toContainText('2 carbonos quirais');
  await expect(ex.locator('.iso-x-facts')).toContainText('forma meso');
  await page.fill('#iso-x-struct', 'CH3-CH=CH-CH3');
  await ex.locator('[data-form="struct"] button').click();
  await expect(ex.locator('.iso-x-facts')).toContainText('cis/trans');
});
