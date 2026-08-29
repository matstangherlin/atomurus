const { test, expect } = require('@playwright/test');
const { installApi, createStore, gotoWorkspace } = require('./helpers');

test('skip link, dialog focus trap, Escape and restored focus', async ({ page }) => {
  await installApi(page, { kind: 'pro' });
  await gotoWorkspace(page, '/app?section=sets');
  const skip = page.locator('#ws-skip');
  await expect(skip).toHaveAttribute('href', '#app-study');
  await page.keyboard.press('Tab');
  await expect(skip).toBeFocused();

  await page.locator('#app-set-open').click();
  const dialog = page.locator('#ws-dialog-host .ws-dialog');
  await expect(dialog).toBeVisible();
  await expect(page.locator('#ws-new-set-name')).toBeFocused({ timeout: 5_000 });
  await page.keyboard.press('Tab');
  await expect(page.locator('#ws-new-set-desc')).toBeFocused();
  await page.keyboard.press('Escape');
  await expect(dialog).toHaveCount(0);
  await expect(page.locator('#app-set-open')).toBeFocused();
});

test('toast host is aria-live', async ({ page }) => {
  await installApi(page, { kind: 'pro' });
  await gotoWorkspace(page, '/app?section=sets');
  await page.locator('#app-set-open').click();
  await page.locator('#ws-new-set-name').fill('Metals');
  await page.locator('#ws-dialog-host .ws-btn-primary').click();
  const live = page.locator('#ws-toast-host');
  await expect(live).toHaveAttribute('aria-live', 'polite');
  await expect(page.locator('.ws-toast, [role="status"]')).toBeVisible();
});

test('Load more does not duplicate library ids', async ({ page }) => {
  const store = createStore();
  store.items = Array.from({ length: 80 }, (_, i) => ({
    id: `00000000-0000-4000-8000-${String(i + 1).padStart(12, '0')}`,
    itemType: 'element',
    itemKey: `el-${i}`,
    title: `Element ${i}`,
    href: '/periodic-table/ferrum',
    note: '',
    tags: [],
    payload: {},
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  }));
  await installApi(page, { kind: 'pro', store });
  await gotoWorkspace(page, '/app?section=library');
  const firstIds = await page.locator('[data-library-id]').evaluateAll((nodes) => nodes.map((n) => n.getAttribute('data-library-id')));
  expect(firstIds.length).toBe(40);
  await page.locator('#ws-lib-more').click();
  await expect(page.locator('[data-library-id]')).toHaveCount(80);
  const ids = await page.locator('[data-library-id]').evaluateAll((nodes) => nodes.map((n) => n.getAttribute('data-library-id')));
  expect(new Set(ids).size).toBe(ids.length);
});

test('empty sections render without raw errors', async ({ page }) => {
  const store = createStore();
  store.items = [];
  await installApi(page, { kind: 'pro', store });
  for (const section of ['notes', 'history', 'progress', 'sets', 'review']) {
    await gotoWorkspace(page, `/app?section=${section}`);
    await expect(page.locator('#app-study')).not.toContainText('undefined');
    await expect(page.locator('#app-study')).not.toContainText('[object Object]');
    await expect(page.locator('#app-study .ws-empty, #app-study .ws-hero, #app-study .ws-title').first()).toBeVisible();
  }
});
