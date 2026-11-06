// @ts-check
const { test, expect } = require('@playwright/test');

// three.js comes from the CDN in production; serve the pinned npm copy here.
async function localThree(page) {
  await page.route(/cdnjs\.cloudflare\.com\/ajax\/libs\/three\.js\//, (route) =>
    route.fulfill({ path: require.resolve('three/build/three.min.js'), contentType: 'application/javascript' }));
}

test('atomic models: any element, real shells, ions and the element-page link', async ({ page }) => {
  await localThree(page);
  // the element page opens the viewer on that element
  await page.goto('/periodic-table/natrium.html?lang=en');
  const view3d = page.locator('a[data-i18n="el.rm.view3d"]');
  await expect(view3d).toHaveAttribute('href', /atomic-models\.html\?model=bohr&el=Na/);
  await view3d.click();
  await expect(page.locator('#atom-el')).toHaveValue('11');
  await expect(page.locator('#info-meta')).toContainText('11 protons');
  await expect(page.locator('#info-meta')).toContainText('12 neutrons');
  await expect(page.locator('#md-shells')).toContainText('K 2');
  await expect(page.locator('#md-shells')).toContainText('M 1');
  await expect(page.locator('.model-detail-ref')).toContainText('Sodium-23 (Z = 11)');

  // quantum: configuration and roles of the subshells; the list follows ?model=
  await page.goto('/viewer/atomic-models.html?lang=en&el=Fe&model=quantum');
  await expect(page.locator('[data-model="quantum"]')).toHaveClass(/active/);
  await expect(page.locator('#md-shells')).toContainText('[Ar] 3d⁶ 4s²');
  await expect(page.locator('#md-shells')).toContainText('d / f being filled');

  // ions: Fe³⁺ loses the 4s electrons first
  await page.locator('[data-model="bohr"]').click();
  for (let i = 0; i < 3; i++) await page.locator('#charge-up').click();
  await expect(page.locator('#info-meta')).toContainText('23 electrons');
  await expect(page.locator('#md-shells')).toContainText('M 13');

  // previous / next walk the periodic table and keep a shareable URL
  await page.locator('[data-atom-step="1"]').click();
  await expect(page.locator('#atom-el')).toHaveValue('27');
  await expect(page).toHaveURL(/el=Co/);

  // hydrogen can lose one electron only
  await page.locator('#atom-el').selectOption('1');
  await expect(page.locator('#charge-up')).toBeDisabled();
  await expect(page.locator('#charge-val')).toHaveText('+1');
});

test('atomic models: Portuguese copy and legend colours that match the stage', async ({ page }) => {
  await localThree(page);
  await page.goto('/viewer/atomic-models.html?lang=pt-BR&el=U&model=bohr');
  await expect(page.locator('#atom-el option:checked')).toHaveText('92 · U · Urânio');
  await expect(page.locator('#md-shells')).toContainText('Q 2');
  await expect(page.locator('.model-detail-ref')).toContainText('Urânio-238 (Z = 92)');
  const electronDot = page.locator('#atom-legend .atom-dot-e');
  expect(await electronDot.evaluate((el) => getComputedStyle(el).backgroundColor)).toBe('rgb(232, 226, 212)');
  await expect(page.locator('.vz-tab.active, .vz-tab[aria-current="page"]').first()).toContainText('Modelos atômicos');
});
