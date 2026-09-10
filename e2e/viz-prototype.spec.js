const { test, expect } = require('@playwright/test');

test('Visualization prototype is a paper lab, not a production viewer', async ({ page }) => {
  await page.goto('/dev/viz-prototype.html');
  await expect(page.locator('meta[name="robots"]')).toHaveAttribute('content', /noindex/);
  await expect(page.locator('h1')).toContainText(/Paper models|Modelos em papel/);
  await expect(page.locator('#mol-now')).toBeVisible();
  await expect(page.locator('#mol-paper')).toBeVisible();
  await expect(page.locator('#atom-2d')).toBeVisible();
  await expect(page.locator('#atom-3d')).toBeVisible();
  await expect(page.locator('#orbital-2d')).toBeVisible();
  await page.waitForFunction(() => window.THREE && document.querySelector('#mol-paper').width > 20, null, { timeout: 20_000 });
  await page.locator('[data-rep="space"]').click();
  await expect(page.locator('[data-rep="space"]')).toHaveClass(/is-on/);
  for (const model of ['dalton', 'thomson', 'rutherford', 'bohr', 'quantum']) {
    await page.locator(`[data-atom="${model}"]`).click();
    await expect(page.locator(`[data-atom="${model}"]`)).toHaveClass(/is-on/);
  }
  await page.locator('[data-atom-view="2d"]').click();
  await expect(page.locator('#atom-2d-stage')).toHaveClass(/is-off/);
  await expect(page.locator('#atom-3d-stage')).not.toHaveClass(/is-off/);
  await expect(page.locator('#app-study, #lab-tool-gate')).toHaveCount(0);
});
