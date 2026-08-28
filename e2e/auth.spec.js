const { test, expect } = require('@playwright/test');
const { installApi, preparePage } = require('./helpers');

test('signed-out /app redirects to login preserving next', async ({ page }) => {
  await preparePage(page);
  await page.goto('/app?section=library');
  await page.waitForURL(/\/login/, { timeout: 15_000 });
  const url = new URL(page.url());
  expect(url.pathname.replace(/\.html$/, '')).toBe('/login');
  expect(url.searchParams.get('next')).toMatch(/\/app/);
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
