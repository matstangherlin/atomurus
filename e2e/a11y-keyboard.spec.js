const { test, expect } = require('@playwright/test');

async function open(page, url, lang) {
  await page.addInitScript((value) => {
    try {
      if (value) localStorage.setItem('atomurus-lang', value);
      localStorage.setItem('atomurus-cookie-consent', 'rejected');
    } catch (_err) {}
  }, lang || '');
  await page.goto(url);
}

const focusInModal = (page) => page.evaluate(() => {
  const modal = document.getElementById('modal');
  return Boolean(modal && modal.contains(document.activeElement));
});

test('element modal: keyboard opens it, Tab stays inside, Esc closes and focus returns', async ({ page }) => {
  await open(page, '/periodic-table.html');
  const overlay = page.locator('#overlay');
  await expect(overlay).toHaveAttribute('aria-hidden', 'true');
  await expect(overlay).toHaveAttribute('inert', '');
  await expect(page.locator('#modal')).toHaveAttribute('aria-label', 'Element details');

  const iron = page.locator('.el[data-z="26"]');
  await iron.focus();
  await page.keyboard.press('Enter');
  await expect(overlay).toHaveClass(/\bopen\b/);
  await expect(overlay).not.toHaveAttribute('aria-hidden', /.*/);
  await expect(overlay).not.toHaveAttribute('inert', /.*/);
  await expect(page.locator('#m-nm')).not.toBeEmpty();
  expect(await focusInModal(page)).toBe(true);

  for (let i = 0; i < 40; i += 1) {
    await page.keyboard.press('Tab');
    expect(await focusInModal(page), `Tab #${i + 1} left the modal`).toBe(true);
  }
  for (let i = 0; i < 6; i += 1) {
    await page.keyboard.press('Shift+Tab');
    expect(await focusInModal(page), `Shift+Tab #${i + 1} left the modal`).toBe(true);
  }

  await page.keyboard.press('Escape');
  await expect(overlay).not.toHaveClass(/\bopen\b/);
  await expect(overlay).toHaveAttribute('aria-hidden', 'true');
  await expect(iron).toBeFocused();

  // A click on the backdrop still closes it, and focus goes back to the opener.
  await page.keyboard.press('Enter');
  await expect(overlay).toHaveClass(/\bopen\b/);
  await page.mouse.click(4, 4);
  await expect(overlay).not.toHaveClass(/\bopen\b/);
  await expect(iron).toBeFocused();
});

test('element modal in Portuguese has a Portuguese name', async ({ page }) => {
  await open(page, '/periodic-table.pt.html', 'pt');
  await expect(page.locator('#modal')).toHaveAttribute('aria-label', 'Detalhes do elemento');
  await page.locator('.el[data-z="8"]').click();
  await expect(page.locator('#overlay')).toHaveClass(/\bopen\b/);
  expect(await focusInModal(page)).toBe(true);
  await page.keyboard.press('Escape');
  await expect(page.locator('.el[data-z="8"]')).toBeFocused();
});

test('language button: its name starts with the visible code, in both languages', async ({ page }) => {
  await open(page, '/calculators.html', 'en');
  const btn = page.locator('[data-i18n-toggle]').first();
  await expect(btn).toHaveText('PT');
  await expect(btn).toHaveAttribute('aria-label', 'PT — Switch language');
  await btn.click();
  await expect(btn).toHaveText('EN');
  await expect(btn).toHaveAttribute('aria-label', 'EN — Trocar idioma');
  // A later I18N.apply() (the periodic table calls it) must not undo the name.
  await page.evaluate(() => window.I18N.apply());
  await expect(btn).toHaveAttribute('aria-label', 'EN — Trocar idioma');
});

test('language button on a Portuguese page', async ({ page }) => {
  await open(page, '/periodic-table.pt.html', 'pt');
  const btn = page.locator('[data-i18n-toggle]').first();
  await expect(btn).toHaveText('EN');
  await expect(btn).toHaveAttribute('aria-label', 'EN — Trocar idioma');
});

for (const [url, lang, text] of [
  ['/index.html', 'en', 'Skip to content'],
  ['/periodic-table.html', 'en', 'Skip to content'],
  ['/calculators.html', 'en', 'Skip to content'],
  ['/calculators.pt.html', 'pt', 'Pular para o conteúdo']
]) {
  test(`skip link on ${url}: Tab shows it, Enter moves focus to <main>`, async ({ page }) => {
    await open(page, url, lang);
    const skip = page.locator('a.skip-link');
    await expect(skip).toHaveCount(1);
    await expect(skip).toHaveText(text);
    // Hidden until focused.
    expect((await skip.boundingBox()).y).toBeLessThan(0);
    await page.keyboard.press('Tab');
    await expect(skip).toBeFocused();
    // Visible once focused (after the short slide-in).
    await expect.poll(async () => (await skip.boundingBox()).y).toBeGreaterThanOrEqual(0);
    await page.keyboard.press('Enter');
    await expect.poll(() => page.evaluate(() => document.activeElement && document.activeElement.tagName)).toBe('MAIN');
    const target = await skip.getAttribute('href');
    await expect(page.locator('main')).toHaveAttribute('id', target.slice(1));
  });
}
