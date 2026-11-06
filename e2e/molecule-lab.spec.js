// @ts-check
const { test, expect } = require('@playwright/test');
const { installApi } = require('./helpers');

// three.js comes from the CDN in production; serve the pinned npm copy here.
async function localThree(page) {
  await page.route(/cdnjs\.cloudflare\.com\/ajax\/libs\/three\.js\//, (route) =>
    route.fulfill({ path: require.resolve('three/build/three.min.js'), contentType: 'application/javascript' }));
}

test('molecules: measured geometry, polarity and the dipole vector', async ({ page }) => {
  await localThree(page);
  await installApi(page, { kind: 'pro' });
  await page.goto('/viewer/molecules.html?lang=en&mol=water');
  const facts = page.locator('#mol-facts');
  await expect(facts).toContainText('Geometry and polarity');
  await expect(facts).toContainText('104.5°');
  await expect(facts).toContainText('1.85 D');
  await expect(facts.locator('.mol-v-polar')).toHaveText('Polar');
  await page.locator('#vc-dipole').click({ force: true });
  await expect(page.locator('#vc-dipole')).toHaveAttribute('aria-pressed', 'true');
  await expect(facts.locator('[data-mol-dipole]')).toHaveAttribute('aria-pressed', 'true');

  await page.goto('/viewer/molecules.html?lang=en&mol=sf6');
  await expect(facts).toContainText('octahedral');
  await expect(facts).toContainText('90.0°');
  await expect(facts).toContainText('Nonpolar');
});

test('molecules: build any organic structure and pick an isomer of a formula', async ({ page }) => {
  await localThree(page);
  await installApi(page, { kind: 'pro' });
  await page.goto('/viewer/molecules.html?lang=pt-BR');
  const facts = page.locator('#mol-facts');
  await expect(facts).toContainText('Geometria e polaridade');

  await page.fill('#mol-build-input', 'CCl4');
  await page.locator('.mol-build-go').click();
  await expect(page.locator('.mol-build-msg')).toContainText('Montada');
  await expect(facts).toContainText('tetraédrica');
  await expect(facts).toContainText('Apolar');
  await expect(page).toHaveURL(/build=CCl4/);

  await page.fill('#mol-build-input', 'C4H10O');
  await page.locator('.mol-build-go').click();
  await expect(page.locator('.mol-build-msg')).toContainText('7 estruturas');
  await page.locator('.mol-build-msg [data-iso]').first().click();
  await expect(page.locator('.mol-build-msg')).toContainText('Montada');
  await expect(facts).toContainText('Polar');

  await page.fill('#mol-build-input', 'H2O');
  await page.locator('.mol-build-go').click();
  await expect(page.locator('.mol-build-msg')).toHaveClass(/is-error/);
});
