const { test, expect } = require('@playwright/test');
const { installApi } = require('./helpers');

test('signed-out workspace shows Pro navigation and explains locked features', async ({ page }) => {
  await installApi(page, { kind: 'guest', signedIn: false });
  await page.goto('/app');
  await expect(page.locator('#ws-nav-main')).toContainText(/Library|Biblioteca/, { timeout: 15_000 });
  await expect(page).toHaveURL(/\/app/);
  await page.locator('#ws-nav-main a[href="/app?section=library"]').click();
  await expect(page.locator('#ws-dialog-host')).toContainText(/available only|disponível somente/i);
  await expect(page.locator('#ws-dialog-host a[href^="/login"]')).toBeVisible();
  await expect(page.locator('#ws-dialog-host a[href="/pricing"]')).toBeVisible();
});

test('login preserves next and lands on /app', async ({ page }) => {
  await installApi(page, { kind: 'pro', signedIn: false });
  await page.goto('/login?next=%2Fapp%3Fsection%3Dlibrary');
  await expect(page.locator('#auth-login-form')).toBeVisible();
  await page.locator('#auth-email').fill('pro@atomurus.test');
  await page.locator('#auth-password').fill('correct-horse');
  await page.locator('#auth-login-submit').click();
  await page.waitForURL(/\/app/, { timeout: 15_000 });
  expect(page.url()).toMatch(/section=library/);
  await expect(page.locator('#ws-nav-main a').first()).toBeVisible({ timeout: 15_000 });
});
