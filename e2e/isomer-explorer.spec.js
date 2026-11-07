// @ts-check
const { test, expect } = require('@playwright/test');

test('isomer explorer lists every isomer of a formula and names the pair type', async ({ page }) => {
  await page.goto('/viewer/isomerism/constitutional/metamerism.html?lang=en');
  const ex = page.locator('#iso-explorer');
  await expect(ex).toBeVisible();
  await page.fill('#iso-x-formula', 'C5H12');
  await ex.locator('[data-form="formula"] button[type="submit"]').click();
  await expect(ex.locator('.iso-x-card')).toHaveCount(3);
  await ex.locator('.iso-x-card').nth(0).click();
  await ex.locator('.iso-x-card').nth(1).click();
  await expect(ex.locator('.iso-x-type')).toHaveText(/Chain isomerism/);
  await expect(ex.locator('.iso-x-card.is-picked')).toHaveCount(2);
  await expect(ex.locator('.iso-x-compare')).toHaveClass(/is-ready/);
  await page.fill('#iso-x-formula', 'C4H10O');
  await ex.locator('[data-form="formula"] button[type="submit"]').click();
  await expect(ex.locator('.iso-x-card')).toHaveCount(7);
  await page.fill('#iso-x-formula', 'C4H11');
  await ex.locator('[data-form="formula"] button[type="submit"]').click();
  await expect(ex.locator('.iso-x-error')).toBeVisible();
});

test('results update while typing and errors never clear the last good result', async ({ page }) => {
  await page.goto('/viewer/isomerism/constitutional/chain.html?lang=en');
  const ex = page.locator('#iso-explorer');
  await expect(ex.locator('.iso-x-card')).toHaveCount(2);           // page default C4H10
  const input = page.locator('#iso-x-formula');
  await input.fill('C5H12');                                          // no Enter, no button
  await expect(ex.locator('.iso-x-card')).toHaveCount(3);
  await expect(input).toBeFocused();                                  // typing never loses focus
  await input.fill('C5H1');                                           // mid-typing: impossible formula
  await expect(ex.locator('.iso-x-error')).toBeVisible();
  await expect(input).toHaveAttribute('aria-invalid', 'true');
  await expect(ex.locator('.iso-x-card')).toHaveCount(3);            // previous result stays
  await input.fill('C5H10');
  await expect(ex.locator('.iso-x-error')).toBeHidden();
  await expect(ex.locator('.iso-x-card')).toHaveCount(10);
  await input.press('Enter');
  await expect(ex.locator('.iso-x-card')).toHaveCount(10);
  await ex.locator('[data-formula="C4H8"]').click();                  // example chips still work
  await expect(ex.locator('.iso-x-card')).toHaveCount(5);
  await expect(input).toHaveValue('C4H8');
});

test('isomers get IUPAC-style names in the cards and in the comparison', async ({ page }) => {
  await page.goto('/viewer/isomerism/constitutional/chain.html?lang=pt-BR');
  const ex = page.locator('#iso-explorer');
  await expect(ex.locator('.iso-x-name')).toHaveText(['2-metilpropano', 'butano']);
  await ex.locator('.iso-x-card').nth(0).click();
  await ex.locator('.iso-x-card').nth(1).click();
  await expect(ex.locator('.iso-x-pair')).toContainText('2-metilpropano');
  await expect(ex.locator('.iso-x-pair')).toContainText('butano');
  await page.fill('#iso-x-formula', 'C4H10O');
  await expect(ex.locator('.iso-x-name')).toContainText(['2-metilpropan-2-ol', '2-metilpropan-1-ol', 'butan-2-ol', '2-metoxipropano', 'butan-1-ol', '1-metoxipropano', 'etoxietano']);
  // functional group highlighted in the drawing
  await expect(ex.locator('.iso-x-card').first().locator('.iso-x-halo').first()).toBeAttached();
  await expect(ex.locator('.iso-x-card').first().locator('line.is-fg').first()).toBeAttached();
  await page.goto('/viewer/isomerism/constitutional/chain.html?lang=en&formula=C4H10O');
  await expect(ex.locator('.iso-x-name').nth(2)).toHaveText('butan-2-ol');
  await expect(ex.locator('.iso-x-name').nth(3)).toHaveText('2-methoxypropane');
});

test('the formula, structure and tab live in the URL and can be copied', async ({ page, context }) => {
  await context.grantPermissions(['clipboard-read', 'clipboard-write']);
  await page.goto('/viewer/isomerism/constitutional/function.html?lang=en');
  const ex = page.locator('#iso-explorer');
  await page.fill('#iso-x-formula', 'C5H12');
  await expect(ex.locator('.iso-x-card')).toHaveCount(3);
  await expect.poll(() => page.evaluate(() => location.search)).toContain('formula=C5H12');
  await expect.poll(() => page.evaluate(() => location.search)).toContain('tab=all');
  await expect.poll(() => page.evaluate(() => location.search)).toContain('lang=en');
  const copy = ex.locator('[data-copy]');
  await copy.click();
  await expect(copy).toHaveText(/Copied/);
  const clip = await page.evaluate(() => navigator.clipboard.readText());
  expect(clip).toContain('formula=C5H12');
  // restore from the URL
  await page.goto('/viewer/isomerism/constitutional/function.html?lang=en&formula=C4H8&tab=all');
  await expect(page.locator('#iso-x-formula')).toHaveValue('C4H8');
  await expect(ex.locator('.iso-x-card')).toHaveCount(5);
  await page.goto('/viewer/isomerism/constitutional/function.html?lang=pt-BR&structure=CH3-CH(OH)-COOH');
  await expect(ex.locator('[data-tab="one"]')).toHaveAttribute('aria-selected', 'true');
  await expect(page.locator('#iso-x-struct')).toHaveValue('CH3-CH(OH)-COOH');
  await expect(ex.locator('.iso-x-facts')).toContainText('1 carbono quiral');
  await expect(ex.locator('.iso-x-one-name')).toHaveText(/.+/);
});

test('isomer explorer analyses chirality and meso forms', async ({ page }) => {
  await page.goto('/viewer/isomerism/spatial/optical.html?lang=pt-BR');
  const ex = page.locator('#iso-explorer');
  await expect(ex.locator('[data-tab="one"]')).toHaveAttribute('aria-selected', 'true');
  await page.fill('#iso-x-struct', 'HOOC-CH(OH)-CH(OH)-COOH');
  await ex.locator('[data-form="struct"] button[type="submit"]').click();
  await expect(ex.locator('.iso-x-facts')).toContainText('2 carbonos quirais');
  await expect(ex.locator('.iso-x-facts')).toContainText('forma meso');
  await expect(ex.locator('.iso-x-facts .iso-x-chiral-ring')).toHaveCount(2);
  await page.fill('#iso-x-struct', 'CH3-CH=CH-CH3');                 // live, no submit
  await expect(ex.locator('.iso-x-facts')).toContainText('cis/trans');
  await expect(ex.locator('.iso-x-one-name')).toHaveText('but-2-eno');
  await page.fill('#iso-x-struct', 'CH3-CH=CH-CH(');                  // mid-typing: unbalanced bracket
  await expect(ex.locator('.iso-x-error')).toBeVisible();
  await expect(ex.locator('.iso-x-one-name')).toHaveText('but-2-eno'); // last good result stays
});

test('the isomerism landing page loads at the top (no hash jump)', async ({ page }) => {
  await page.goto('/isomerism.html?lang=pt-BR');
  await page.waitForURL(/constitutional\/function/);
  await expect(page.locator('#iso-explorer')).toBeVisible();
  await page.waitForTimeout(800);
  expect(await page.evaluate(() => window.scrollY)).toBeLessThan(2);
  expect(await page.evaluate(() => location.search)).toContain('lang=pt-BR');
});

test('explorer fits a 360 px screen with 44 px targets', async ({ page }) => {
  await page.setViewportSize({ width: 360, height: 740 });
  await page.goto('/viewer/isomerism/constitutional/metamerism.html?lang=pt-BR');
  const ex = page.locator('#iso-explorer');
  await expect(ex.locator('.iso-x-card')).toHaveCount(7);
  const widths = await page.evaluate(() => [document.documentElement.scrollWidth, window.innerWidth]);
  expect(widths[0]).toBeLessThanOrEqual(widths[1]);
  for (const sel of ['.iso-x-chips button', '.iso-x-filter button', '.iso-x-tabs button', '.iso-x-card', '.iso-x-go', '[data-copy]']) {
    const h = await ex.locator(sel).first().evaluate((el) => el.getBoundingClientRect().height);
    expect(h, sel).toBeGreaterThanOrEqual(44);
  }
  await expect(page.locator('#iso-x-formula')).toHaveAttribute('autocapitalize', 'characters');
});
