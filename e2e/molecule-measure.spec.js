// Molecule viewer measurement (prompt 31): distance, angle and dihedral by
// mouse/touch on the 3D view and by keyboard through the atom list; the
// value is text in an aria-live panel. Three.js is served from node_modules
// (the CDN is a third party), the molecule from the local e2e API.
const { test, expect } = require('@playwright/test');
const fs = require('fs');
const path = require('path');

const THREE_MIN = path.join(__dirname, '..', 'node_modules', 'three', 'build', 'three.min.js');

async function openViewer(page, { lang = 'en', mol = 'water' } = {}) {
  await page.addInitScript((l) => {
    try { localStorage.setItem('atomurus-lang', l); localStorage.setItem('atomurus-cookie-consent', 'rejected'); localStorage.setItem('atomurus-reduced-motion', '1'); } catch (_err) {}
  }, lang);
  await page.route(/cdnjs\.cloudflare\.com\/.*three\.min\.js/, (route) => route.fulfill({ status: 200, contentType: 'text/javascript', body: fs.readFileSync(THREE_MIN) }));
  await page.route(/googlesyndication|googletagmanager|google-analytics|gstatic|doubleclick|jsdelivr/, (route) => route.abort());
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto((lang === 'pt' ? '/viewer/molecules.pt.html?lang=pt-BR&mol=' : '/viewer/molecules.html?lang=en&mol=') + mol);
  await page.locator('#viewer3d').scrollIntoViewIfNeeded();
  await expect(page.locator('#vc-measure')).toBeVisible({ timeout: 20_000 });
  await expect(page.locator('#info-meta')).toContainText(/\d/);
}

test('keyboard: the atom list measures the H–O–H angle and the O–H distance (EN)', async ({ page }) => {
  const errors = [];
  page.on('pageerror', (err) => errors.push(String(err)));
  await openViewer(page);
  await page.locator('#vc-measure').focus();
  await page.keyboard.press('Enter');
  const panel = page.locator('#mol-measure');
  await expect(panel).toBeVisible();
  await expect(page.locator('#vc-measure')).toHaveAttribute('aria-pressed', 'true');
  await expect(panel.locator('[data-mm-mode="distance"]')).toBeFocused();
  const live = panel.locator('[data-mm-result]');
  await expect(live).toHaveAttribute('aria-live', 'polite');
  await expect(panel.locator('[data-mm-atom]')).toHaveText(['Atom 1: O', 'Atom 2: H', 'Atom 3: H']);

  // Distance O1–H2 (bonded).
  await panel.locator('[data-mm-atom="0"]').focus();
  await page.keyboard.press('Enter');
  await expect(live).toHaveText('Chosen: O1');
  await page.keyboard.press('Tab');
  await page.keyboard.press('Enter');
  await expect(live).toHaveText(/^O1–H2: 1\.\d Å \(bond\)$/);
  await expect(panel.locator('[data-mm-atom="1"]')).toHaveAttribute('aria-pressed', 'true');

  // Angle H2–O1–H3 = 104.5 (the model's angle).
  await panel.locator('[data-mm-mode="angle"]').click();
  for (const i of [1, 0, 2]) await panel.locator(`[data-mm-atom="${i}"]`).click();
  await expect(live).toHaveText('H2–O1–H3: 104.5°');

  // Esc clears, then closes.
  await page.keyboard.press('Escape');
  await expect(live).toHaveText('Selection cleared.');
  await page.keyboard.press('Escape');
  await expect(panel).toBeHidden();
  await expect(page.locator('#vc-measure')).toBeFocused();
  expect(errors).toEqual([]);
});

test('mouse: clicking atoms in the 3D view measures; the dihedral has a sign (PT)', async ({ page }) => {
  await openViewer(page, { lang: 'pt', mol: 'h2o2' });
  await page.locator('#vc-measure').click();
  const panel = page.locator('#mol-measure');
  await expect(panel.locator('.mm-title')).toHaveText('Medir');
  await panel.locator('[data-mm-mode="dihedral"]').click();
  // Where each atom is on screen, from the scene itself.
  await page.locator('#viewer3d').scrollIntoViewIfNeeded();
  const spots = await page.evaluate(() => window.__mmScreenPoints && window.__mmScreenPoints());
  expect(spots && spots.length).toBe(4);
  const box = await page.locator('#viewer3d').boundingBox();
  for (const i of [2, 0, 1, 3]) {
    await page.mouse.click(box.x + spots[i].x, box.y + spots[i].y);
  }
  const live = panel.locator('[data-mm-result]');
  await expect(live).toHaveText(/^H\d–O\d–O\d–H\d: −?\d{2,3},\d°$/);
  const text = await live.textContent();
  const deg = Number(text.split(': ')[1].replace('−', '-').replace(',', '.').replace('°', ''));
  expect(Math.abs(deg)).toBeGreaterThan(80);
  expect(Math.abs(deg)).toBeLessThan(130);
  await expect(panel.locator('[data-mm-atom][aria-pressed="true"]')).toHaveCount(4);
  // A drag rotates and does not pick.
  await page.mouse.move(box.x + 20, box.y + 20);
  await page.mouse.down();
  await page.mouse.move(box.x + 120, box.y + 60, { steps: 5 });
  await page.mouse.up();
  await expect(panel.locator('[data-mm-atom][aria-pressed="true"]')).toHaveCount(4);
});

test('labels: small, medium and large; medium is the default', async ({ page }) => {
  await openViewer(page, { lang: 'pt' });
  const btn = page.locator('#vc-label-size');
  await expect(btn).toHaveAttribute('aria-label', 'Rótulos: médios');
  await btn.click();
  await expect(btn).toHaveAttribute('aria-label', 'Rótulos: grandes');
  await btn.click();
  await expect(btn).toHaveAttribute('aria-label', 'Rótulos: pequenos');
});
