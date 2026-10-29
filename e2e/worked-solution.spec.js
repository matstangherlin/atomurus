// «Solução comentada» in the calculators (prompt 30): it appears after a
// calculation, its answer is the number the calculator shows, the steps are
// an ordered list behind a toggle, and a failed calculation shows none.
const { test, expect } = require('@playwright/test');

async function open(page, lang, tab) {
  await page.addInitScript((l) => {
    try { localStorage.setItem('atomurus-lang', l); localStorage.setItem('atomurus-cookie-consent', 'rejected'); } catch (_err) {}
  }, lang);
  await page.goto((lang === 'pt' ? '/calculators.pt.html' : '/calculators.html') + '#' + tab);
}

async function expectSolution(page, bodyId, { show, answer, firstStep, steps }) {
  const body = page.locator(bodyId);
  const box = body.locator('.wsol');
  await expect(box).toBeVisible();
  const toggle = box.locator('.wsol-toggle');
  await expect(toggle).toHaveText(show);
  await expect(toggle).toHaveAttribute('aria-expanded', 'false');
  await expect(box.locator('.wsol-steps')).toBeHidden();
  await expect(box.locator('.wsol-answer strong')).toHaveText(answer);
  await toggle.focus();
  await page.keyboard.press('Enter');
  await expect(toggle).toHaveAttribute('aria-expanded', 'true');
  const list = box.locator('ol.wsol-steps');
  await expect(list).toBeVisible();
  await expect(list.locator('li')).toHaveCount(steps);
  await expect(list.locator('li').first()).toContainText(firstStep);
  await expect(toggle).toBeFocused();
  return box;
}

test('molar mass (PT): the solution ends at the M the calculator shows', async ({ page }) => {
  const errors = [];
  page.on('pageerror', (err) => errors.push(String(err)));
  await open(page, 'pt', 'molar');
  await page.locator('#mm-input').fill('H2SO4');
  await page.locator('#tab-molar .calc-btn-run').click();
  await expect(page.locator('#mm-result-body .calc-result-v.big')).toContainText('98,072');
  const box = await expectSolution(page, '#mm-result-body', {
    show: 'Ver solução comentada', answer: 'M = 98,072 g/mol', firstStep: 'Conte os átomos', steps: 4
  });
  await expect(box.locator('li').nth(2)).toContainText('4 × 15,999 = 63,996');
  await expect(box.locator('.wsol-toggle')).toHaveText('Mostrar só o resultado');

  // An unknown symbol: no worked solution.
  await page.locator('#mm-input').fill('Xx2O');
  await page.locator('#tab-molar .calc-btn-run').click();
  await expect(page.locator('#mm-result-body .wsol')).toHaveCount(0);
  expect(errors).toEqual([]);
});

test('ideal gas (EN): V at STP, with the SI conversion and R', async ({ page }) => {
  await open(page, 'en', 'ideal');
  await page.locator('#ig-solve').selectOption('V');
  await page.locator('#ig-P').fill('1');
  await page.locator('#ig-P-u').selectOption('atm');
  await page.locator('#ig-n').fill('1');
  await page.locator('#ig-T').fill('273.15');
  await page.locator('#ig-T-u').selectOption('K');
  await page.locator('#ig-V-u').selectOption('L');
  await page.locator('#tab-ideal .calc-btn-run').click();
  await expect(page.locator('#ig-result-body .calc-result-v.big')).toContainText('22.41');
  const box = await expectSolution(page, '#ig-result-body', {
    show: 'Show worked solution', answer: 'V = 22.41 L', firstStep: 'SI units', steps: 4
  });
  await expect(box.locator('li').nth(2)).toContainText('8.3145');

  // Invalid input: the solution goes away with the result.
  await page.locator('#ig-n').fill('-1');
  await page.locator('#tab-ideal .calc-btn-run').click();
  await expect(page.locator('#ig-result-body .wsol')).toHaveCount(0);
});

test('dilution (PT): V₂ from C₁V₁ = C₂V₂', async ({ page }) => {
  await open(page, 'pt', 'dilute');
  await page.locator('#dl-solve').selectOption('V2');
  await page.locator('#dl-C1').fill('2');
  await page.locator('#dl-V1').fill('10');
  await page.locator('#dl-C2').fill('0.5');
  await page.locator('#tab-dilute .calc-btn-run').click();
  await expect(page.locator('#dl-result-body .calc-result-v.big')).toContainText('40');
  const box = await expectSolution(page, '#dl-result-body', {
    show: 'Ver solução comentada', answer: 'V₂ = 40 mL', firstStep: 'Diluir não muda', steps: 3
  });
  await expect(box.locator('li').nth(2)).toContainText('(2 mol/L × 10 mL) / 0,5 mol/L = 40 mL');
});

test('pH (EN): strong acid 0.01 mol/L → pH 2.00, and the print shows the steps', async ({ page }) => {
  await open(page, 'en', 'ph');
  await page.locator('#ph-mode').selectOption('H');
  await page.locator('#ph-H').fill('0.01');
  await page.locator('#tab-ph .calc-btn-run').click();
  await expect(page.locator('#ph-result-body .calc-result-v.big')).toContainText('2.00');
  const box = await expectSolution(page, '#ph-result-body', {
    show: 'Show worked solution', answer: 'pH = 2.00', firstStep: 'strong acid', steps: 4
  });
  await expect(box.locator('li').nth(1)).toContainText('pH = −log₁₀(0.01) = 2.00');
  await box.locator('.wsol-toggle').click();
  await expect(box.locator('.wsol-steps')).toBeHidden();
  await page.emulateMedia({ media: 'print' });
  await expect(box.locator('.wsol-steps')).toBeVisible();
  await expect(box.locator('.wsol-toggle')).toBeHidden();
});

// ── Exercise bank pages ──────────────────────────────────────────────────────
test('exercises (PT): answers fold away, the print has no answers, the key prints on request', async ({ page }) => {
  const errors = [];
  page.on('pageerror', (err) => errors.push(String(err)));
  await open(page, 'pt', '');
  await page.goto('/exercises/molar-mass.pt.html?lang=pt-BR');
  await expect(page.locator('meta[name="robots"]')).toHaveAttribute('content', 'noindex,nofollow');
  await expect(page.locator('.ex-item')).toHaveCount(10);
  const item = page.locator('#MM07');
  await expect(item.locator('.ex-statement')).toContainText('H₂SO₄');
  await expect(item.locator('.ex-answer p')).toBeHidden();
  await item.locator('.ex-answer summary').click();
  await expect(item.locator('.ex-answer p')).toHaveText('M = 98,072 g/mol');
  await item.locator('.ex-solution summary').click();
  await expect(item.locator('.wsol-steps li')).toHaveCount(4);

  await page.emulateMedia({ media: 'print' });
  await expect(item.locator('.ex-answer')).toBeHidden();
  await expect(item.locator('.ex-statement')).toBeVisible();
  await expect(page.locator('#gabarito')).toBeHidden();
  await page.emulateMedia({ media: 'screen' });
  await page.locator('[data-ex-print-key]').check();
  await page.emulateMedia({ media: 'print' });
  await expect(page.locator('#gabarito')).toBeVisible();
  await expect(page.locator('#gabarito li').nth(6)).toHaveText('MM07 · M = 98,072 g/mol');
  expect(errors).toEqual([]);
});

test('exercises (EN): a drawn exercise keeps its seed in the address and comes back the same', async ({ page }) => {
  await open(page, 'en', '');
  await page.goto('/exercises/dilution.html?lang=en');
  await page.locator('[data-ex-new]').click();
  await expect(page).toHaveURL(/[?&]seed=\d+/);
  const out = page.locator('[data-ex-out]');
  const statement = await out.locator('.ex-statement').textContent();
  await out.locator('.ex-answer summary').click();
  const answer = await out.locator('.ex-answer-v').textContent();
  expect(answer).toMatch(/^(V₂ = .+ mL|C₂ = .+ mol\/L)$/);
  const toggle = out.locator('.wsol-toggle');
  await expect(toggle).toHaveText('Show worked solution');
  await toggle.click();
  await expect(out.locator('.wsol-steps li')).toHaveCount(3);

  await page.goto(page.url());
  await expect(page.locator('[data-ex-out] .ex-statement')).toHaveText(statement);
  await page.locator('[data-ex-out] .ex-answer summary').click();
  await expect(page.locator('[data-ex-out] .ex-answer-v')).toHaveText(answer);
});
