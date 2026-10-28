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
