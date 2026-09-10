const { test, expect } = require('@playwright/test');
const { installApi } = require('./helpers');

test('signed-out workspace shows Pro navigation and explains locked features', async ({ page }) => {
  await installApi(page, { kind: 'guest', signedIn: false });
  await page.goto('/app');
  await expect(page.locator('#ws-study-nav')).toContainText(/Study|Estudo/, { timeout: 15_000 });
  await expect(page.locator('#ws-nav-main a[data-nav="home"]')).toContainText(/Home|Início/);
  await expect(page.locator('#ws-nav-main a[data-nav="periodic"]')).toBeVisible();
  await expect(page.locator('#ws-nav-main a[data-nav="viewer"]')).toBeVisible();
  await expect(page.locator('#ws-userchip')).toContainText(/Create account|Criar conta/, { timeout: 15_000 });
  await expect(page).toHaveURL(/\/app/);
  await page.locator('#ws-study-nav a[href="/app?section=library"]').first().click();
  await expect(page).toHaveURL(/section=library/);
  await expect(page.locator('#app-study')).toContainText(/Library|Biblioteca/);
  await expect(page.locator('#app-study a[href*="signup"]')).toBeVisible();
  await page.locator('#ws-study-nav a[href="/app?section=sets"]').click();
  await expect(page.locator('#app-study')).toContainText(/Study Sets/);
  await expect(page.locator('#app-study a[href*="signup"]')).toContainText(/Create free account|Criar conta gratuita/);
  await expect(page.locator('#ws-dialog-host')).not.toContainText(/available only|disponível somente/i);
  await page.locator('#ws-study-nav a[href="/app?section=review"]').click();
  await expect(page.locator('#ws-dialog-host')).toContainText(/available only|disponível somente/i);
  await expect(page.locator('#ws-dialog-host a[href^="/login"]')).toBeVisible();
  await expect(page.locator('#ws-dialog-host a[href="/pricing"]')).toBeVisible();
});

test('Account chip from a calculator keeps next= with the query string', async ({ page }) => {
  await installApi(page, { kind: 'guest', signedIn: false });
  await page.goto('/calculators.html?tab=stoich');
  const chip = page.locator('[data-atomurus-account-chip]');
  await expect(chip).toHaveAttribute('href', /next=/, { timeout: 15_000 });
  const href = await chip.getAttribute('href');
  const decoded = decodeURIComponent(href);
  expect(decoded).toMatch(/calculators/);
  expect(decoded).toMatch(/tab=stoich/);
});

test('login next keeps calculator query string', async ({ page }) => {
  await installApi(page, { kind: 'pro', signedIn: false });
  await page.goto('/login?next=' + encodeURIComponent('/calculators.html?tab=stoich'));
  await expect(page.locator('#auth-login-form')).toBeVisible();
  await page.locator('#auth-email').fill('pro@atomurus.test');
  await page.locator('#auth-password').fill('correct-horse');
  await page.locator('#auth-login-submit').click();
  await page.waitForURL((url) => /\/calculators(?:\.html)?$/.test(url.pathname), { timeout: 15_000 });
  expect(page.url()).toMatch(/tab=stoich/);
});

test('login preserves next and lands on /app', async ({ page }) => {
  await installApi(page, { kind: 'pro', signedIn: false });
  await page.goto('/login?next=%2Fapp%3Fsection%3Dlibrary');
  await expect(page.locator('#auth-login-form')).toBeVisible();
  await expect(page.locator('#auth-session-boot')).toBeHidden();
  await page.locator('#auth-email').fill('pro@atomurus.test');
  await page.locator('#auth-password').fill('correct-horse');
  await page.locator('#auth-login-submit').click();
  await page.waitForURL(/\/app/, { timeout: 15_000 });
  expect(page.url()).toMatch(/section=library/);
  await expect(page.locator('#ws-nav-main a').first()).toBeVisible({ timeout: 15_000 });
});

test('wrong password stays on login and unsticks the submit button', async ({ page }) => {
  await installApi(page, { kind: 'pro', signedIn: false, loginResult: 'invalid' });
  await page.goto('/login');
  await expect(page.locator('#auth-login-form')).toBeVisible();
  await page.locator('#auth-email').fill('pro@atomurus.test');
  await page.locator('#auth-password').fill('wrong-horse');
  await page.locator('#auth-login-submit').click();
  await expect(page.locator('#auth-login-err')).toBeVisible();
  await expect(page.locator('#auth-login-err')).toContainText(/Invalid email or password/i);
  await expect(page).toHaveURL(/\/login/);
  await expect(page.locator('#auth-login-submit')).toBeEnabled();
});

test('unconfirmed email shows a confirm-inbox message', async ({ page }) => {
  await installApi(page, { kind: 'pro', signedIn: false, loginResult: 'unconfirmed' });
  await page.goto('/login');
  await expect(page.locator('#auth-login-form')).toBeVisible();
  await page.locator('#auth-email').fill('pro@atomurus.test');
  await page.locator('#auth-password').fill('correct-horse');
  await page.locator('#auth-login-submit').click();
  await expect(page.locator('#auth-login-err')).toBeVisible();
  await expect(page.locator('#auth-login-err')).toContainText(/Confirm your email/i);
  await expect(page).toHaveURL(/\/login/);
});

test('signup with confirmation required returns to login with a success message', async ({ page }) => {
  await installApi(page, { kind: 'pro', signedIn: false });
  await page.goto('/signup');
  await expect(page.locator('#auth-signup-form')).toBeVisible();
  await page.locator('#auth-signup-name').fill('Pro User');
  await page.locator('#auth-signup-username').fill('prouser1');
  await page.locator('#auth-signup-email').fill('newpro@atomurus.test');
  await page.locator('#auth-signup-password').fill('Correct#Pass');
  await page.locator('#auth-signup-password-confirm').fill('Correct#Pass');
  await page.locator('#auth-signup-submit').click();
  await expect(page.locator('#auth-login-form')).toBeVisible();
  await expect(page.locator('#auth-login-ok')).toBeVisible();
  await expect(page.locator('#auth-login-ok')).toContainText(/Account created|Check your email/i);
});

test('password recovery shows the generic success copy', async ({ page }) => {
  await installApi(page, { kind: 'pro', signedIn: false });
  await page.goto('/forgot-password');
  await expect(page.locator('#auth-reset-form')).toBeVisible();
  await page.locator('#auth-reset-email').fill('pro@atomurus.test');
  await page.locator('#auth-reset-submit').click();
  await expect(page.locator('#auth-reset-ok')).toBeVisible();
  await expect(page.locator('#auth-reset-ok')).toContainText(/recovery instructions/i);
  await page.locator('#auth-panel-recover [data-auth-route="login"]').click();
  await expect(page.locator('#auth-login-form')).toBeVisible();
});

test('signed-in visitor on /login is sent to /app', async ({ page }) => {
  await installApi(page, { kind: 'pro', signedIn: true });
  await page.goto('/login');
  await page.waitForURL(/\/app/, { timeout: 15_000 });
  await expect(page.locator('#ws-nav-main a').first()).toBeVisible({ timeout: 15_000 });
});

test('logout from the workspace stays on /app as a guest', async ({ page }) => {
  await installApi(page, { kind: 'pro', signedIn: true });
  await page.goto('/app');
  await expect(page.locator('#app-logout-aside')).toBeVisible({ timeout: 15_000 });
  await page.locator('#app-logout-aside').click();
  await expect(page).toHaveURL(/\/app/);
  await expect(page.locator('#ws-userchip')).toContainText(/Create account|Criar conta/, { timeout: 15_000 });
  await expect(page.locator('#app-logout-aside')).toHaveCount(0);
});
