// Trails (prompt 32): progress is marked explicitly, survives a reload, and
// sends nothing anywhere; step pages opened from the trail show the chip.
const { test, expect } = require('@playwright/test');

async function setup(page, lang) {
  await page.addInitScript((l) => {
    try { localStorage.setItem('atomurus-lang', l); localStorage.setItem('atomurus-cookie-consent', 'rejected'); } catch (_err) {}
  }, lang);
}

test('PT: «Concluí» marks steps, the count updates, and it survives a reload with no network calls', async ({ page }) => {
  await setup(page, 'pt');
  await page.goto('/trilhas/estequiometria.pt.html?lang=pt-BR');
  await expect(page.locator('meta[name="robots"]')).toHaveAttribute('content', 'noindex,nofollow');
  const count = page.locator('[data-trail-count]');
  await expect(count).toHaveText('0 de 8 etapas concluídas');
  await expect(count).toHaveAttribute('aria-live', 'polite');

  const requests = [];
  page.on('request', (req) => requests.push(req.url()));
  const first = page.locator('[data-trail-done="mol"]');
  await first.click();
  await expect(first).toHaveAttribute('aria-pressed', 'true');
  await expect(first).toHaveText('Concluída ✓');
  await page.locator('[data-trail-done="massa-molar"]').click();
  await page.locator('[data-trail-done="extra-estequiometria"]').click(); // optional: not counted
  await expect(count).toHaveText('2 de 8 etapas concluídas');
  expect(requests, 'marking a step sends nothing').toEqual([]);

  await page.reload();
  await expect(page.locator('[data-trail-count]')).toHaveText('2 de 8 etapas concluídas');
  await expect(page.locator('[data-trail-done="mol"]')).toHaveAttribute('aria-pressed', 'true');
  const stored = await page.evaluate(() => JSON.parse(localStorage.getItem('atomurus-trail-progress')));
  expect(stored).toEqual({ estequiometria: ['mol', 'massa-molar', 'extra-estequiometria'] });

  // Unmark one, then start over.
  await page.locator('[data-trail-done="mol"]').click();
  await expect(page.locator('[data-trail-count]')).toHaveText('1 de 8 etapas concluídas');
  await page.locator('[data-trail-reset]').click();
  await expect(page.locator('[data-trail-count]')).toHaveText('0 de 8 etapas concluídas');
});

test('EN: step 2 opens the calculator with the chip and H₂SO₄ already calculated', async ({ page }) => {
  await setup(page, 'en');
  await page.goto('/trilhas/estequiometria.html?lang=en');
  await expect(page.locator('.tr-step').first()).toContainText('What is the mole');
  await page.locator('.tr-step a', { hasText: 'Molar mass calculator' }).click();
  await expect(page).toHaveURL(/\/calculators\.html\?formula=H2SO4&trail=estequiometria&step=2(&lang=en)?#molar/);
  const chip = page.locator('.trail-chip a');
  await expect(chip).toHaveText('Trail: Stoichiometry — step 2/8');
  await expect(chip).toHaveAttribute('href', /^\/trilhas\/estequiometria\.html(\?lang=en)?$/); // i18n.js may add ?lang
  await expect(page.locator('#mm-result-body .calc-result-v.big')).toContainText('98.072');
});

test('PT: the draft article shows the draft band, the worked examples and the chip', async ({ page }) => {
  await setup(page, 'pt');
  await page.goto('/explore/what-is-the-mole.pt.html?lang=pt-BR&trail=estequiometria&step=1');
  await expect(page.locator('.art-draft')).toHaveText('Rascunho — em revisão docente. Ainda não publicado.');
  await expect(page.locator('.trail-chip a')).toHaveText('Trilha: Estequiometria — etapa 1/8');
  await expect(page.locator('[data-calc="mole-water"] .aw-a')).toHaveText('Resposta: n = 1,998 mol');
  await expect(page.locator('[data-calc="mole-co2"] .wsol-steps li')).toHaveCount(4);
  // Without the trail parameters there is no chip.
  await page.goto('/explore/what-is-the-mole.pt.html?lang=pt-BR');
  await expect(page.locator('.trail-chip')).toHaveCount(0);
});
