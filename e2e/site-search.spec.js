// @ts-check
const { test, expect } = require('@playwright/test');

test('site search: header button, keyboard, elements, tools and formulas', async ({ page }) => {
  await page.goto('/viewer/molecules.html?lang=en');
  // "/" opens the palette with the field focused
  await page.keyboard.press('/');
  const dialog = page.locator('.rm-cmdk');
  await expect(dialog).toBeVisible();
  const input = page.locator('.rm-cmdk-input');
  await expect(input).toBeFocused();

  await input.fill('26');
  await expect(page.locator('.rm-cmdk-opt').first()).toContainText('Iron');
  await expect(page.locator('.rm-cmdk-opt').first().locator('.rm-cmdk-sub')).toHaveAttribute('href', /atomic-models\.html\?el=Fe/);

  await input.fill('ph');
  await expect(page.locator('.rm-cmdk-opt').first()).toContainText('pH and pOH');

  await input.fill('H2SO4');
  await expect(page.locator('.rm-cmdk-opt').first()).toContainText('Molar mass of H2SO4');

  // arrows + Enter open the highlighted result
  await input.fill('gold');
  await page.keyboard.press('ArrowDown');
  await page.keyboard.press('ArrowUp');
  await Promise.all([page.waitForURL(/periodic-table\/aurum\.html/), page.keyboard.press('Enter')]);

  // the header button and Escape (focus returns to the button)
  const btn = page.locator('.rm-header .rm-search-btn');
  await btn.click();
  await expect(dialog).toBeVisible();
  await page.keyboard.press('Escape');
  await expect(dialog).toBeHidden();
  await expect(btn).toBeFocused();
});

test('site search: phones, and a tab of the page you are on', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/calculators.html?lang=pt-BR');
  const btn = page.locator('.rm-header .rm-search-btn');
  await expect(btn).toBeVisible();
  await btn.click();
  await page.locator('.rm-cmdk-input').fill('diluição');
  await expect(page.locator('.rm-cmdk-opt').first()).toContainText('Diluição');
  await page.keyboard.press('Enter');
  await expect(page).toHaveURL(/calculators\.html.*#dilute/);
  await expect(page.locator('[data-target="dilute"]')).toHaveClass(/active/);
  // nothing overlaps the header on a tablet-sized screen: the drawer takes over below 1200px
  await page.setViewportSize({ width: 1100, height: 800 });
  await expect(page.locator('[data-rm-burger]')).toBeVisible();
});
