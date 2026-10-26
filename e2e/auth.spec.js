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
  await page.locator('#ws-study-nav a[href="/app?section=study"]').first().click();
  await expect(page).toHaveURL(/section=study/);
  await expect(page.locator('#app-study')).toContainText(/Study with Atomurus|Estude com o Atomurus/);
  await expect(page.locator('#app-study a[href*="signup"]').first()).toBeVisible();
  await page.locator('#ws-study-nav a[href="/app?section=sets"]').click();
  await expect(page.locator('#app-study')).toContainText(/Study Sets/);
  await expect(page.locator('#app-study a[href*="signup"]')).toContainText(/Create free account|Criar conta gratuita/);
  await expect(page.locator('#ws-dialog-host')).toHaveCount(0);
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
  await expect(page.locator('#auth-resend-confirmation')).toBeHidden();
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
  await expect(page.locator('#auth-resend-confirmation')).toBeVisible();
  await expect(page).toHaveURL(/\/login/);
});

test('signup with confirmation required returns to login with a success message', async ({ page }) => {
  await installApi(page, { kind: 'pro', signedIn: false });
  await page.goto('/signup');
  await expect(page.locator('#auth-signup-form')).toBeVisible();
  await expect(page).toHaveTitle(/Create account|Criar conta/);
  await expect(page.locator('#auth-signup-name')).toHaveValue('');
  await expect(page.locator('#auth-signup-email')).toHaveValue('');
  await expect(page.locator('#auth-signup-name')).not.toHaveAttribute('placeholder', /Matheus|Stangherlin|matheusstan/i);
  await expect(page.locator('#auth-signup-email')).not.toHaveAttribute('placeholder', /@|matheus/i);
  await expect(page.locator('#auth-email')).not.toHaveAttribute('placeholder', /Matheus|matheusstan|@gmail/i);
  await page.locator('#auth-signup-name').fill('Pro User');
  await page.locator('#auth-signup-username').fill('prouser1');
  await page.locator('#auth-signup-email').fill('newpro@atomurus.test');
  await page.locator('#auth-signup-password').fill('Correct#Pass');
  await page.locator('#auth-signup-password-confirm').fill('Correct#Pass');
  await page.locator('#auth-signup-submit').click();
  await expect(page.locator('#auth-login-form')).toBeVisible();
  await expect(page.locator('#auth-login-ok')).toBeVisible();
  await expect(page.locator('#auth-login-ok')).toContainText(/Account created|Check your email/i);
  await expect(page.locator('#auth-email')).toHaveValue('newpro@atomurus.test');
  await expect(page.locator('#auth-email')).not.toHaveValue(/matheus|stangherlin/i);
});

test('password recovery shows the generic success copy', async ({ page }) => {
  await installApi(page, { kind: 'pro', signedIn: false });
  await page.goto('/forgot-password');
  await expect(page.locator('#auth-reset-form')).toBeVisible();
  await page.locator('#auth-reset-email').fill('pro@atomurus.test');
  await page.locator('#auth-reset-submit').click();
  await expect(page.locator('#auth-reset-ok')).toBeVisible();
  await expect(page.locator('#auth-reset-ok')).toContainText(/sent a link/i);
  await page.locator('#auth-panel-recover [data-auth-route="login"]').click();
  await expect(page.locator('#auth-login-form')).toBeVisible();
});

test('signed-in visitor on /login is sent to /app', async ({ page }) => {
  await installApi(page, { kind: 'pro', signedIn: true });
  await page.goto('/login');
  await page.waitForURL(/\/app/, { timeout: 15_000 });
  await expect(page.locator('#ws-nav-main a').first()).toBeVisible({ timeout: 15_000 });
});

function watchAuthLeaks(page, secret) {
  const logs = [];
  const foreign = [];
  page.on('console', (msg) => logs.push(msg.text()));
  page.on('request', (req) => {
    const url = req.url();
    let host = '';
    try { host = new URL(url).hostname; } catch (_err) { host = ''; }
    if (host && host !== '127.0.0.1' && host !== 'localhost' && url.includes(secret)) foreign.push(url);
  });
  return { logs, foreign };
}

test('reset link with token_hash opens the new-password panel', async ({ page }) => {
  const secret = 'fake-token-hash';
  const leaks = watchAuthLeaks(page, secret);
  await installApi(page, { kind: 'pro', signedIn: false });
  await page.goto(`/reset-password?token_hash=${secret}&type=recovery`);
  await expect(page.locator('#auth-password-panel')).toBeVisible();
  await expect(page.locator('#auth-new-password')).toHaveAttribute('autocomplete', 'new-password');
  await expect(page.locator('label[for="auth-new-password"]')).toBeVisible();
  await expect(page.locator('#auth-new-password-confirm')).toHaveAttribute('autocomplete', 'new-password');
  await expect(page.locator('#auth-password-err')).not.toContainText(secret);
  expect(leaks.logs.join('\n')).not.toContain(secret);
  expect(leaks.foreign).toEqual([]);
});

test('reset hash on /reset-password opens the new-password panel', async ({ page }) => {
  const secret = 'fake-access-token';
  const leaks = watchAuthLeaks(page, secret);
  await installApi(page, { kind: 'pro', signedIn: false });
  await page.goto(`/reset-password#access_token=${secret}&refresh_token=fake-refresh-token&type=recovery`);
  await expect(page.locator('#auth-password-panel')).toBeVisible();
  await expect(page.locator('#auth-password-err')).not.toContainText(secret);
  expect(page.url()).not.toContain(secret);
  expect(leaks.logs.join('\n')).not.toContain(secret);
  expect(leaks.foreign).toEqual([]);
});

test('recovery hash on the home page redirects to the new-password panel', async ({ page }) => {
  const secret = 'fake-access-token';
  const leaks = watchAuthLeaks(page, secret);
  await installApi(page, { kind: 'pro', signedIn: false });
  await page.goto(`/#access_token=${secret}&refresh_token=fake-refresh-token&type=recovery`);
  await expect(page.locator('#auth-password-panel')).toBeVisible();
  await expect(page).toHaveURL(/\/reset-password/);
  expect(page.url()).not.toContain(secret);
  expect(leaks.logs.join('\n')).not.toContain(secret);
  expect(leaks.foreign).toEqual([]);
});

test('expired auth hash on the home page opens login with a new-link button', async ({ page }) => {
  const secret = 'otp_expired';
  const leaks = watchAuthLeaks(page, 'fake-expired-description');
  await installApi(page, { kind: 'pro', signedIn: false });
  await page.goto('/#error=access_denied&error_code=otp_expired&error_description=fake-expired-description');
  await expect(page.locator('#auth-login-form')).toBeVisible();
  await expect(page.locator('#auth-login-err')).toContainText(/expired/i);
  await expect(page.locator('#auth-request-new-link')).toBeVisible();
  await page.locator('#auth-request-new-link').click();
  await expect(page.locator('#auth-reset-form')).toBeVisible();
  expect(page.url()).not.toContain(secret);
  expect(leaks.logs.join('\n')).not.toContain('fake-expired-description');
  expect(leaks.foreign).toEqual([]);
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
