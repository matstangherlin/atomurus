// POE (predict · observe · explain) in the Lab guides — prompt 27.
const { test, expect } = require('@playwright/test');
const { installApi, gotoWorkspace } = require('./helpers');

async function openGuide(page, lang, query) {
  await installApi(page, { kind: 'free', lang });
  await gotoWorkspace(page, '/app?section=lab&mode=bench');
  await page.waitForSelector('.lab-beaker');
  await page.locator('#lab-q').fill(query);
  await page.locator('[data-lab-search]').first().evaluate((form) => form.requestSubmit());
  const close = page.locator('[data-dock-close]');
  if (await close.isVisible()) await close.click();
  return page.locator('[data-lab-guide]');
}

// Nothing about a prediction leaves the browser.
function watchWrites(page) {
  const writes = [];
  page.on('request', (req) => {
    if (req.method() !== 'GET' || /google-analytics|googletagmanager|collect\?/.test(req.url())) writes.push(req.method() + ' ' + req.url());
  });
  return writes;
}

test('pH: predict with the keyboard, observe, and the comparison comes from the simulation (EN)', async ({ page }) => {
  const guide = await openGuide(page, 'en', 'ph');
  await page.locator('[data-step-add="water"]').click();
  await page.locator('[data-step-add="citric_acid"]').click();
  const writes = watchWrites(page);

  const card = guide.locator('[data-poe="ph-bicarbonate"]');
  await expect(card).toContainText('What happens to the pH?');
  await expect(card).toBeFocused();
  // The step's own actions stay usable: the card never blocks the guide.
  await expect(page.locator('[data-step-add="bicarbonate"]')).toBeVisible();
  await expect(card.locator('[data-poe-confirm]')).toBeDisabled();

  const radios = card.locator('[role="radio"]');
  await expect(card.locator('[role="radiogroup"]')).toHaveCount(1);
  await page.keyboard.press('Tab');
  await expect(radios.first()).toBeFocused();
  await page.keyboard.press('ArrowDown');
  await expect(radios.nth(1)).toBeFocused();
  await expect(radios.nth(1)).toHaveAttribute('aria-checked', 'true');
  await page.keyboard.press('ArrowUp');
  await expect(radios.first()).toHaveAttribute('aria-checked', 'true');
  await expect(radios.nth(1)).toHaveAttribute('aria-checked', 'false');
  await expect(card.locator('[data-poe-confirm]')).toBeEnabled();
  await page.keyboard.press('Enter');

  await expect(guide.locator('[data-poe]')).toHaveCount(0);
  await expect(guide.locator('.lab-poe-note')).toContainText('Your prediction: It rises, towards 7');
  await page.locator('[data-step-add="bicarbonate"]').click();
  await guide.locator('[data-measure="ph"]').click();

  const result = guide.locator('[data-poe="ph-bicarbonate"].is-explain');
  await expect(result.locator('.lab-poe-compare')).toHaveText('You predicted: It rises, towards 7 · Happened: It rises, towards 7 (pH 1.7 → 7)');
  await expect(result.locator('.lab-poe-verdict')).toHaveText('Your prediction matches the simulation.');
  // POE_EXPLAIN_ON_CORRECT: the short explanation shows on a right prediction too.
  await expect(result.locator('.lab-poe-key')).toContainText('A base neutralises an acid');
  await expect(page.locator('[data-lab-poe-live]')).toContainText('Happened: It rises, towards 7');
  await expect(page.locator('[data-lab-poe-live]')).toHaveAttribute('aria-live', 'polite');
  await expect(page.locator('.lab-guide.is-complete')).toContainText('Practice complete (virtual).');
  await result.locator('[data-poe-dismiss]').click();
  await expect(guide.locator('[data-poe]')).toHaveCount(0);
  expect(writes, 'no request carries the prediction').toEqual([]);
});

test('cristal: previsão errada com o mouse mostra o que aconteceu e por quê (PT)', async ({ page }) => {
  const guide = await openGuide(page, 'pt', 'crescimento de cristal');
  await expect(guide.locator('h2')).toContainText('Crescimento de cristal');
  await page.locator('[data-step-add="water"]').click();
  await page.locator('[data-step-add="sucrose"]').click();
  const card = guide.locator('[data-poe="crystal-heat"]');
  await expect(card).toContainText('Vão aparecer cristais?');
  await expect(card.locator('.lab-poe-kicker')).toHaveText('Predizer · Observar · Explicar');
  await card.locator('[role="radio"]', { hasText: 'Sim: aquecer faz o açúcar cristalizar' }).click();
  await card.locator('[data-poe-confirm]').click();
  await expect(guide.locator('.lab-poe-note')).toContainText('Sua previsão: Sim: aquecer faz o açúcar cristalizar');

  // This step has no target temperature: the guide offers «Warm +20 °C».
  await guide.locator('[data-heat="20"]').click();
  await guide.locator('[data-step-observed]').click();
  const result = guide.locator('[data-poe="crystal-heat"].is-explain');
  await expect(result.locator('.lab-poe-compare')).toHaveText(/^Você previu: Sim: aquecer faz o açúcar cristalizar · Aconteceu: Não: tudo continua dissolvido \(20 g de sacarose em 60 mL de água a 4\d °C, sem cristais\)$/);
  await expect(result.locator('.lab-poe-verdict')).toHaveText('Não foi o que aconteceu. Vale pensar de novo no porquê.');
  await expect(result.locator('.lab-poe-key')).toHaveText('Ideia-chave: Concentrada não é saturada: para cristalizar, a água precisa sair.');
  await expect(result.locator('.lab-poe-misc')).toContainText('Equívoco comum:');
  await expect(page.locator('.lab-guide.is-complete')).toContainText('Prática concluída (virtual).');
});

test('pular a previsão segue o guia sem comparação (PT)', async ({ page }) => {
  const guide = await openGuide(page, 'pt', 'crescimento de cristal');
  await page.locator('[data-step-add="water"]').click();
  await page.locator('[data-step-add="sucrose"]').click();
  await guide.locator('[data-poe-skip]').click();
  await expect(guide.locator('[data-poe]')).toHaveCount(0);
  // Focus goes to the step's first action.
  await expect(guide.locator('[data-heat="20"]')).toBeFocused();
  await guide.locator('[data-heat="20"]').click();
  await guide.locator('[data-step-observed]').click();
  await expect(page.locator('.lab-guide.is-complete')).toContainText('Prática concluída (virtual).');
  await expect(guide.locator('[data-poe]')).toHaveCount(0);
  await expect(guide.locator('.lab-poe-note')).toHaveCount(0);
});

test('acting before predicting just leaves the exercise unanswered (EN)', async ({ page }) => {
  const guide = await openGuide(page, 'en', 'ph');
  await page.locator('[data-step-add="water"]').click();
  await page.locator('[data-step-add="citric_acid"]').click();
  await expect(guide.locator('[data-poe="ph-bicarbonate"]')).toBeVisible();
  await page.locator('[data-step-add="bicarbonate"]').click();
  await expect(guide.locator('[data-poe]')).toHaveCount(0);
  await guide.locator('[data-measure="ph"]').click();
  await expect(page.locator('.lab-guide.is-complete')).toContainText('Practice complete (virtual).');
  await expect(guide.locator('[data-poe]')).toHaveCount(0);
});

test('keys inside the card do not reach the board shortcuts', async ({ page }) => {
  const guide = await openGuide(page, 'en', 'ph');
  await page.locator('[data-step-add="water"]').click();
  await page.locator('[data-step-add="citric_acid"]').click();
  const vessels = await page.locator('[data-vessel]').count();
  const card = guide.locator('[data-poe="ph-bicarbonate"]');
  await card.locator('[role="radio"]').first().focus();
  await page.keyboard.press('Delete');
  await page.keyboard.press('Backspace');
  await page.keyboard.press('ArrowRight');
  await expect(page.locator('[data-vessel]')).toHaveCount(vessels);
  await expect(card.locator('[role="radio"]').nth(1)).toBeFocused();
});

// The five POE guides, in both languages, predicted (with the answer the
// simulation gives) or skipped, finished from the guide panel.
const ANSWER = { ph: 'up', ethanol: 'convert', crystal: 'dissolved', distillation: 'mostly', reflux: 'same' };
for (const lang of ['en', 'pt']) {
  for (const id of Object.keys(ANSWER)) {
    for (const mode of ['predict', 'skip']) {
      test(`${lang}: ${id} — ${mode} the POE and finish the guide`, async ({ page }) => {
        const errors = [];
        page.on('pageerror', (err) => errors.push(String(err)));
        await installApi(page, { kind: 'free', lang });
        await gotoWorkspace(page, `/app?section=lab&mode=guided&creation=${id}`);
        await page.locator('[data-side="guide"]').click();
        const guide = page.locator('[data-lab-guide]');
        let asked = 0;
        for (let round = 0; round < 30; round += 1) {
          if (await page.locator('.lab-guide.is-complete').count()) break;
          const card = guide.locator('[data-poe]:not(.is-explain)');
          if (await card.count()) {
            asked += 1;
            if (mode === 'skip') await card.locator('[data-poe-skip]').click();
            else {
              await card.locator(`[data-poe-option="${ANSWER[id]}"]`).click();
              await card.locator('[data-poe-confirm]').click();
            }
            continue;
          }
          const observed = guide.locator('[data-step-observed]');
          if (await observed.count()) {
            await observed.click();
            continue;
          }
          const chips = guide.locator('.lab-do-row .lab-do-chip');
          const before = await guide.innerText();
          let moved = false;
          for (let i = 0; i < await chips.count(); i += 1) {
            await chips.nth(i).click();
            if ((await guide.innerText()) !== before) {
              moved = true;
              break;
            }
          }
          if (!moved) break;
        }
        await expect(page.locator('.lab-guide.is-complete')).toContainText(lang === 'pt' ? 'Prática concluída (virtual).' : 'Practice complete (virtual).');
        expect(asked, 'the card opened once').toBe(1);
        const verdict = guide.locator('.lab-poe.is-explain .lab-poe-verdict');
        if (mode === 'skip') await expect(verdict).toHaveCount(0);
        else await expect(verdict).toHaveText(lang === 'pt' ? 'Sua previsão bate com a simulação.' : 'Your prediction matches the simulation.');
        expect(errors).toEqual([]);
      });
    }
  }
}

test('resumo no fim do guia: quantas previsões bateram e «Copiar resumo» em texto simples (PT)', async ({ page, context }) => {
  await context.grantPermissions(['clipboard-read', 'clipboard-write']);
  const guide = await openGuide(page, 'pt', 'crescimento de cristal');
  await page.locator('[data-step-add="water"]').click();
  await page.locator('[data-step-add="sucrose"]').click();
  const writes = watchWrites(page);
  const card = guide.locator('[data-poe="crystal-heat"]');
  await card.locator('[data-poe-option="crystals"]').click();
  await card.locator('[data-poe-confirm]').click();
  await guide.locator('[data-heat="20"]').click();
  await guide.locator('[data-step-observed]').click();

  const summary = guide.locator('.lab-poe-summary');
  await expect(summary.locator('h3')).toHaveText('Suas previsões');
  await expect(summary.locator('p').first()).toHaveText('Sua previsão não bateu com o resultado. Veja onde pensar de novo.');
  await expect(summary.locator('li')).toHaveCount(1);
  await summary.locator('[data-poe-copy]').click();
  await expect(summary.locator('[data-poe-copied]')).toHaveText('Copiado.');
  const text = await page.evaluate(() => navigator.clipboard.readText());
  expect(text.split('\n')[0]).toBe('Atomurus Lab · Crescimento de cristal — previsões (POE, virtual)');
  expect(text).toContain('   Previsto: Sim: aquecer faz o açúcar cristalizar');
  expect(text).toContain('   Aconteceu: Não: tudo continua dissolvido');
  expect(text).toContain('   Ideia-chave: Concentrada não é saturada: para cristalizar, a água precisa sair.');
  expect(text.trim().split('\n').pop()).toBe('Previsões que bateram com a simulação: 0 de 1.');
  expect(writes, 'copying sends nothing').toEqual([]);
});

test('the summary does not appear when the prediction was skipped (EN)', async ({ page }) => {
  const guide = await openGuide(page, 'en', 'ph');
  await page.locator('[data-step-add="water"]').click();
  await page.locator('[data-step-add="citric_acid"]').click();
  await guide.locator('[data-poe-skip]').click();
  await page.locator('[data-step-add="bicarbonate"]').click();
  await guide.locator('[data-measure="ph"]').click();
  await expect(page.locator('.lab-guide.is-complete')).toBeVisible();
  await expect(guide.locator('.lab-poe-summary')).toHaveCount(0);
});
