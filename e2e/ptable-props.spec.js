// @ts-check
const { test, expect } = require('@playwright/test');

test('periodic table colours by more properties, with values, unit and source', async ({ page }) => {
  await page.goto('/periodic-table.html?lang=en');
  const more = page.locator('.rm-pt-more');
  await expect(more).toBeVisible();
  await more.selectOption('density');
  const rn = page.locator('#ptable .el[data-z="86"] .rm-pt-val');
  await expect(rn).toHaveText('9.7·10⁻³');
  await expect(page.locator('#ptable .el[data-z="76"] .rm-pt-val')).toHaveText('22.6');
  await expect(page.locator('#ptable .el[data-z="108"]')).toHaveClass(/rm-pt-pred/);
  const scale = page.locator('.rm-pt-scale');
  await expect(scale).toContainText('Density');
  await expect(scale).toContainText('g/cm³');
  await expect(scale).toContainText('Source');

  await more.selectOption('covalent');
  await expect(page.locator('#ptable .el[data-z="6"] .rm-pt-val')).toHaveText('76');
  await expect(scale).toContainText('Cordero');

  await page.locator('[data-color-by="category"]').click();
  await expect(page.locator('#ptable .rm-pt-val')).toHaveCount(0);
  await expect(scale).toBeHidden();
});
