const { test, expect } = require('@playwright/test');

test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => {
    localStorage.setItem('atomurus-cookie-consent', 'rejected');
    localStorage.setItem('atomurus-lang', 'en');
    localStorage.setItem('atomurus-theme', 'light');
  });
});

async function search(page, query) {
  const input = page.locator('#search-input');
  await input.fill(query);
  await expect(page.locator('.search-suggestion').first()).toBeVisible();
}

test('periodic table search prefers the symbol and shows 118 cards', async ({ page }) => {
  const errors = [];
  page.on('pageerror', (err) => errors.push(String(err)));

  await page.goto('/periodic-table.html');
  await expect(page.locator('.el:not(.el-ph)')).toHaveCount(118);
  await expect(page.locator('.el-ph')).toHaveCount(2);
  await expect(page.locator('.el[data-z="57"]')).toBeVisible();
  await expect(page.locator('.el[data-z="89"]')).toBeVisible();
  await expect(page.locator('.el[data-z="57"]')).toHaveAttribute('data-row', '9');
  await expect(page.locator('.el[data-z="89"]')).toHaveAttribute('data-row', '10');

  await search(page, 'Na');
  await expect(page.locator('.search-suggestion').first()).toHaveAttribute('data-z', '11');
  await expect(page.locator('.el[data-z="11"]')).toHaveClass(/shine/);
  await expect(page.locator('.el.shine')).toHaveCount(1);

  await search(page, 'Fe');
  await expect(page.locator('.search-suggestion').first()).toHaveAttribute('data-z', '26');
  await expect(page.locator('.el[data-z="26"]')).toHaveClass(/shine/);

  await search(page, '118');
  await expect(page.locator('.search-suggestion').first()).toHaveAttribute('data-z', '118');
  await expect(page.locator('.el.shine')).toHaveCount(1);

  await page.locator('.el[data-z="57"]').click();
  await expect(page.locator('#m-group')).toHaveText(/f-block/);
  await page.keyboard.press('Escape');

  await page.goto('/config.html');
  await page.locator('#heatmap-select').selectOption('atomic_radius');
  await page.goto('/periodic-table.html');
  await expect(page.locator('.el[data-z="11"]')).toHaveAttribute('style', /background:\s*(hsl|rgb)\(/);

  await page.goto('/config.html');
  await page.locator('#heatmap-select').selectOption('ionization');
  await page.goto('/periodic-table.html');
  await expect(page.locator('.el[data-z="1"]')).toHaveAttribute('style', /background:\s*(hsl|rgb)\(/);
  await expect(page.locator('.el[data-z="118"]')).toHaveAttribute('style', /var\(--surface\)/);
  await expect(page.locator('.hm-settings-legend .hm-unit')).toHaveText('kJ/mol');

  await page.goto('/config.html');
  await page.locator('#heatmap-select').selectOption('state');
  await page.goto('/periodic-table.html');
  await expect(page.locator('.el[data-z="1"]')).toHaveAttribute('data-state', 'gas');
  await expect(page.locator('.el[data-z="26"]')).toHaveAttribute('data-state', 'solid');
  await expect(page.locator('.el[data-z="80"]')).toHaveAttribute('data-state', 'liquid');
  await expect(page.locator('.hm-settings-legend .hm-state-legend')).toBeVisible();

  expect(errors).toEqual([]);
});

test('portuguese page accepts english names and the heatmap tab lists ionization', async ({ page }) => {
  const errors = [];
  page.on('pageerror', (err) => errors.push(String(err)));

  await page.goto('/periodic-table.html?lang=pt-BR');
  await expect(page.locator('.el:not(.el-ph)')).toHaveCount(118);
  await search(page, 'oxygen');
  await expect(page.locator('.search-suggestion').first()).toHaveAttribute('data-z', '8');
  await search(page, 'gold');
  await expect(page.locator('.search-suggestion').first()).toHaveAttribute('data-z', '79');
  await search(page, 'iron');
  await expect(page.locator('.search-suggestion').first()).toHaveAttribute('data-z', '26');
  await search(page, 'sodio');
  await expect(page.locator('.search-suggestion').first()).toHaveAttribute('data-z', '11');

  await page.locator('.el[data-z="57"]').click();
  await expect(page.locator('#m-group')).toHaveText(/bloco f/);
  await page.keyboard.press('Escape');

  await page.goto('/periodic-table/heatmap.html?lang=pt-BR');
  await expect(page.locator('#hm-select option[value="ionization"]')).toHaveCount(1);
  await page.locator('#hm-select').selectOption('ionization');
  await expect(page.locator('.hm-unit')).toHaveText('kJ/mol');
  await expect(page.locator('.el[data-z="1"]')).toHaveAttribute('style', /background:\s*(hsl|rgb)\(/);
  await expect(page.locator('.el[data-z="118"]')).toHaveAttribute('style', /var\(--surface\)/);

  await page.goto('/periodic-table/heatmap.html');
  await expect(page.locator('#hm-select option[value="ionization"]')).toContainText(/Ionization Energy/);

  expect(errors).toEqual([]);
});
