// Account → My data (prompt 29): export as JSON and delete the account. The
// API is mocked; nothing reaches Supabase or Stripe.
const { test, expect } = require('@playwright/test');
const { installApi, gotoWorkspace } = require('./helpers');

function json(route, status, body, headers = {}) {
  return route.fulfill({ status, contentType: 'application/json', headers, body: JSON.stringify(body) });
}

async function mockAccountApi(page, { deleteStatus = 200, deleteBody = { ok: true, deleted: true }, exportStatus = 200 } = {}) {
  const calls = { exports: 0, deletes: [] };
  await page.route('**/api/account/**', async (route) => {
    const req = route.request();
    const path = new URL(req.url()).pathname;
    if (path === '/api/account/export' && req.method() === 'GET') {
      calls.exports += 1;
      if (exportStatus !== 200) return json(route, exportStatus, { ok: false, error: 'x', code: 'export_failed' });
      return json(route, 200, { schemaVersion: 1, exportedAt: '2026-10-29T12:00:00.000Z', account: { email: 'e2e@atomurus.com' } }, {
        'content-disposition': 'attachment; filename="atomurus-dados-2026-10-29.json"',
        'cache-control': 'no-store'
      });
    }
    if (path === '/api/account/delete' && req.method() === 'POST') {
      calls.deletes.push(req.postDataJSON());
      const status = typeof deleteStatus === 'function' ? deleteStatus(calls.deletes.length) : deleteStatus;
      return json(route, status, status === 200 ? deleteBody : { ok: false, error: 'no', code: status === 401 ? 'reauth_failed' : 'subscription_active' });
    }
    return route.fallback();
  });
  return calls;
}

test('My data: the export downloads a JSON file (EN)', async ({ page }) => {
  await installApi(page, { kind: 'free', lang: 'en' });
  const calls = await mockAccountApi(page);
  await gotoWorkspace(page, '/account?tab=data');
  await expect(page.locator('.ws-account-tab.is-active')).toHaveText('My data');
  const button = page.locator('#ac-export');
  await expect(button).toHaveText('Download my data (JSON)');
  const [download] = await Promise.all([page.waitForEvent('download'), button.click()]);
  expect(download.suggestedFilename()).toBe('atomurus-dados-2026-10-29.json');
  await expect(page.locator('#ac-export-status')).toHaveText('Download started.');
  expect(calls.exports).toBe(1);
});

test('Meus dados: erro do export aparece em PT e o botão volta', async ({ page }) => {
  await installApi(page, { kind: 'free', lang: 'pt' });
  await mockAccountApi(page, { exportStatus: 429 });
  await gotoWorkspace(page, '/account?tab=data');
  await expect(page.locator('#ac-export')).toHaveText('Baixar meus dados (JSON)');
  await page.locator('#ac-export').click();
  await expect(page.locator('#ac-export-status')).toHaveText('Você pode baixar seus dados 3 vezes por hora. Tente mais tarde.');
  await expect(page.locator('#ac-export-status')).toHaveClass(/is-error/);
  await expect(page.locator('#ac-export')).toBeEnabled();
});

test('Excluir conta: diálogo com senha e frase; sucesso limpa os dados locais e volta à home com aviso', async ({ page }) => {
  await installApi(page, { kind: 'free', lang: 'pt' });
  const calls = await mockAccountApi(page, { deleteStatus: (n) => (n === 1 ? 401 : 200) });
  await page.addInitScript(() => {
    if (sessionStorage.getItem('seeded')) return;
    sessionStorage.setItem('seeded', '1');
    localStorage.setItem('atomurus-lab-v1', '{"sessions":[]}');
    localStorage.setItem('atomurus-compare-queue', '[26]');
    localStorage.setItem('atomurus-theme', 'dark');
  });
  await gotoWorkspace(page, '/account?tab=data');
  const opener = page.locator('#ac-delete-open');
  await opener.click();
  const dialog = page.getByRole('dialog', { name: 'Excluir sua conta Atomurus?' });
  await expect(dialog).toBeVisible();
  await expect(dialog).toContainText('Study Sets, cartões, progresso e histórico de revisões');
  await expect(page.locator('#ac-delete-password')).toBeFocused();

  const submit = page.locator('#ac-delete-submit');
  await expect(submit).toBeDisabled();
  await page.locator('#ac-delete-password').fill('senha-errada!');
  await page.locator('#ac-delete-confirm').fill('excluir');
  await expect(submit).toBeDisabled();
  await page.locator('#ac-delete-confirm').fill('EXCLUIR');
  await expect(submit).toBeEnabled();

  // Wrong password: the error shows, nothing is cleared, the dialog stays.
  await submit.click();
  await expect(page.locator('#ac-delete-error')).toHaveText('A senha não está correta.');
  await expect(page.locator('#ac-delete-password')).toHaveValue('');
  expect(await page.evaluate(() => localStorage.getItem('atomurus-lab-v1'))).not.toBeNull();

  await page.locator('#ac-delete-password').fill('senha-certa!');
  await submit.click();
  await page.waitForURL((url) => url.pathname === '/' || url.pathname === '/index.pt.html');
  expect(calls.deletes).toEqual([{ password: 'senha-errada!', confirm: 'EXCLUIR' }, { password: 'senha-certa!', confirm: 'EXCLUIR' }]);
  await expect(page.locator('#lc-notice')).toHaveText('Sua conta foi excluída. Obrigado por usar o Atomurus.');
  await expect(page).not.toHaveURL(/notice=/);
  const left = await page.evaluate(() => ({
    lab: localStorage.getItem('atomurus-lab-v1'),
    compare: localStorage.getItem('atomurus-compare-queue'),
    theme: localStorage.getItem('atomurus-theme')
  }));
  expect(left).toEqual({ lab: null, compare: null, theme: 'dark' });
});

test('Delete account: Escape closes the dialog and focus returns; an active subscription is refused (EN)', async ({ page }) => {
  await installApi(page, { kind: 'pro', lang: 'en' });
  await mockAccountApi(page, { deleteStatus: 409 });
  await gotoWorkspace(page, '/account?tab=data');
  await expect(page.locator('#ac-delete-subscription')).toContainText('Cancel it in Plan & Billing first');
  const opener = page.locator('#ac-delete-open');
  await opener.click();
  await expect(page.getByRole('dialog', { name: 'Delete your Atomurus account?' })).toBeVisible();
  await page.keyboard.press('Escape');
  await expect(page.locator('#ac-delete-host')).toBeHidden();
  await expect(opener).toBeFocused();

  await opener.click();
  await page.locator('#ac-delete-password').fill('Correct#Pass');
  await page.locator('#ac-delete-confirm').fill('DELETE');
  await page.locator('#ac-delete-submit').click();
  await expect(page.locator('#ac-delete-error')).toContainText('Cancel it in Plan & Billing first');
  await expect(page).toHaveURL(/\/account\?tab=data/);
});
