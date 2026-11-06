// @ts-check
const { test, expect } = require('@playwright/test');

// three.js comes from the CDN in production; serve the pinned npm copy here.
async function localThree(page) {
  await page.route(/cdnjs\.cloudflare\.com\/ajax\/libs\/three\.js\//, (route) =>
    route.fulfill({ path: require.resolve('three/build/three.min.js'), contentType: 'application/javascript' }));
}

test('allotropes: deep link, element chips, measured structure and the 3D model in step', async ({ page }) => {
  await localThree(page);
  await page.goto('/viewer/allotropes.html?lang=en&elem=carbon&form=diamond');
  await expect(page.locator('#allo-variants .allo-btn.active .allo-n')).toHaveText('Diamond');
  await expect(page.locator('#model-name')).toHaveText('Diamond');
  await expect(page.locator('#allo-kicker')).toHaveText('Allotrope of carbon');
  await expect(page.locator('#allo-side-facts')).toContainText('Tetrahedral network (sp³)');
  const facts = page.locator('#allo-facts');
  await expect(facts).toContainText('154.4 pm');
  await expect(facts).toContainText('109.47°');
  await expect(facts).toContainText('3.515 g/cm³');
  await expect(facts.locator('tr.is-on')).toContainText('Diamond');
  await expect(page.locator('#allo-stage-count')).toContainText('atoms');

  // the 3D runtime draws the selected form
  await page.locator('#viewer3d').scrollIntoViewIfNeeded();
  await expect.poll(() => page.evaluate(() => window.AtomurusAlloViewer && window.AtomurusAlloViewer.current())).toBe('diamond');

  // element chip → first form of that element, URL follows
  await page.locator('.allo-chip[data-elem="oxygen"]').click();
  await expect(page.locator('.allo-chip[data-elem="oxygen"]')).toHaveAttribute('aria-pressed', 'true');
  await expect(page.locator('#model-name')).toHaveText('Oxygen (O₂)');
  await expect(facts).toContainText('120.75 pm');
  await expect(page).toHaveURL(/elem=oxygen&form=o2/);
  await expect.poll(() => page.evaluate(() => window.AtomurusAlloViewer.current())).toBe('o2');

  // a row of the comparison table selects that form
  await facts.locator('.allo-row-btn', { hasText: 'Ozone' }).click();
  await expect(page.locator('#model-name')).toHaveText('Ozone (O₃)');
  await expect(facts).toContainText('116.8°');
  await expect(page.locator('#allo-el-link')).toHaveAttribute('href', '/periodic-table/oxygenium.html');
});

test('allotropes: Portuguese numbers and the teaching-model note', async ({ page }) => {
  await localThree(page);
  await page.goto('/viewer/allotropes.html?lang=pt-BR&form=p_black');
  await expect(page.locator('#allo-kicker')).toHaveText('Alótropo do fósforo');
  await expect(page.locator('#model-name')).toHaveText('Negro');
  const facts = page.locator('#allo-facts');
  await expect(facts).toContainText('222,4 · 224,4 pm');
  await expect(facts).toContainText('96,3° · 102,1°');
  await expect(facts).toContainText('2,69 g/cm³');
  await expect(page.locator('#allo-el-link')).toHaveText('Ver a página do fósforo →');

  await page.locator('#allo-variants .allo-btn', { hasText: 'Vermelho' }).click();
  await expect(facts).toContainText('modelo didático');
  await expect(facts).toContainText('≈ 2,2 g/cm³');
});

test('element pages: allotrope cards open that form, half-lives in words', async ({ page }) => {
  await localThree(page);
  await page.goto('/periodic-table/sulfur.html?lang=pt-BR');
  await page.locator('.rm-allo', { hasText: 'Plástico' }).click();
  await expect(page).toHaveURL(/\/viewer\/allotropes(\.html)?\?elem=sulfur&form=s_plastic/);
  await expect(page.locator('#allo-variants .allo-btn.active .allo-n')).toHaveText('Plástico (Sₙ)');

  await page.goto('/periodic-table/natrium.html?lang=pt-BR');
  await expect(page.locator('.rm-hl').first()).toHaveText('2,60 anos');
  await page.goto('/periodic-table/natrium.html?lang=en');
  await expect(page.locator('.rm-hl').first()).toHaveText('2.60 years');
});
