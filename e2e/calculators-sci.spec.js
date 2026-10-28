const { test, expect } = require('@playwright/test');

async function open(page, lang) {
  await page.addInitScript((value) => {
    try {
      localStorage.setItem('atomurus-lang', value);
      localStorage.setItem('atomurus-cookie-consent', 'rejected');
    } catch (_err) {}
  }, lang);
  await page.goto(lang === 'pt' ? '/calculators.pt.html' : '/calculators.html');
}

async function console(page) {
  await page.locator('.calc-menu-item[data-target="scientific"]').click();
  await page.locator('.scc-top-btn[data-sci-mode="console"]').click();
}

async function evaluate(page, expr) {
  await page.locator('#sci-input').fill(expr);
  await page.locator('#sci-input').press('Enter');
  return page.locator('#sci-display-result');
}

test('the scientific console follows mathematical precedence and degrees', async ({ page }) => {
  await open(page, 'en');
  await console(page);
  await expect(await evaluate(page, '-2^2')).toHaveText('-4');
  await expect(await evaluate(page, '(-2)^2')).toHaveText('4');
  await expect(await evaluate(page, '2^-3')).toHaveText('0.125');
  await expect(await evaluate(page, 'log(1000)')).toHaveText('3');
  await expect(await evaluate(page, 'round(-2.5)')).toHaveText('-3');

  // DEG is the default, visible on the display, and switching changes the result.
  const deg = page.locator('.sci-display [data-sci-angle="deg"]');
  const rad = page.locator('.sci-display [data-sci-angle="rad"]');
  await expect(deg).toHaveAttribute('aria-pressed', 'true');
  await expect(await evaluate(page, 'sin(30)')).toHaveText('0.5');
  await rad.click();
  await expect(rad).toHaveAttribute('aria-pressed', 'true');
  await expect(page.locator('#sci-display-result')).toHaveText('-0.9880316241');
  await expect(await evaluate(page, 'sin(pi/6)')).toHaveText('0.5');

  // The choice is remembered on this device.
  await page.reload();
  await page.locator('.calc-menu-item[data-target="scientific"]').click();
  await expect(page.locator('.scc-device [data-sci-angle="rad"]')).toHaveAttribute('aria-pressed', 'true');

  await page.locator('.scc-top-btn[data-sci-mode="console"]').click();
  await evaluate(page, '1/0');
  await expect(page.locator('#sci-result-body')).toContainText('Division by zero');
  await expect(page.locator('#sci-display-result')).toHaveText('Error');
});

test('a calculadora científica em português não mostra inglês e usa vírgula', async ({ page }) => {
  await open(page, 'pt');
  await console(page);
  await evaluate(page, '1/0');
  await expect(page.locator('#sci-result-body')).toContainText('Divisão por zero');
  await expect(page.locator('#sci-display-result')).toHaveText('Erro');
  await evaluate(page, 'sqrt(-1)');
  await expect(page.locator('#sci-result-body')).toContainText('Fora do domínio da função sqrt()');
  await evaluate(page, '1+');
  await expect(page.locator('#sci-result-body')).toContainText('Expressão incompleta');
  await expect(await evaluate(page, '1/8')).toHaveText('0,125');
  await expect(page.locator('#tab-scientific')).not.toContainText(/Invalid expression|Division by zero|requires a/);
  await expect(page.locator('[data-i18n="calc.sciDecimalHelp"]')).toContainText('a vírgula separa argumentos');
});

test('pH of a weak acid, a weak base and a buffer, with steps', async ({ page }) => {
  await open(page, 'en');
  await page.locator('.calc-menu-item[data-target="ph"]').click();
  await page.locator('#ph-kind').selectOption('weakAcid');
  await expect(page.locator('#ph-species')).toHaveValue('acetic');
  await expect(page.locator('#ph-K')).toHaveValue('4.756');
  await page.locator('#ph-C').fill('0.1');
  await page.locator('#tab-ph .calc-btn-run').click();
  const body = page.locator('#ph-result-body');
  await expect(body.locator('.calc-result-v.big')).toContainText('2.88');
  await expect(body).toContainText('CRC Handbook');
  await body.locator('.ph-steps summary').click();
  await expect(body.locator('.ph-steps')).toContainText('Charge balance');

  await page.locator('#ph-kind').selectOption('weakBase');
  await expect(page.locator('#ph-species')).toHaveValue('ammonia');
  await page.locator('#tab-ph .calc-btn-run').click();
  await expect(body.locator('.calc-result-v.big')).toContainText('11.12');

  await page.locator('#ph-kind').selectOption('buffer');
  await page.locator('#ph-Ca').fill('0.1');
  await page.locator('#ph-Cb').fill('2');
  await page.locator('#tab-ph .calc-btn-run').click();
  await expect(body.locator('[data-ph-warning="bufferRange"]')).toBeVisible();

  await page.locator('#ph-kind').selectOption('weakAcid');
  await page.locator('#ph-C').fill('0');
  await page.locator('#tab-ph .calc-btn-run').click();
  await expect(body).toContainText('Enter a positive concentration');
});

test('pH de ácido fraco em português', async ({ page }) => {
  await open(page, 'pt');
  await page.locator('.calc-menu-item[data-target="ph"]').click();
  await page.locator('#ph-kind').selectOption('weakAcid');
  await expect(page.locator('#ph-species option:checked')).toHaveText('Ácido acético (CH₃COOH)');
  await page.locator('#tab-ph .calc-btn-run').click();
  await expect(page.locator('#ph-result-body .calc-result-v.big')).toContainText('2,88');
  await expect(page.locator('#ph-result-body')).toContainText('sem coeficientes de atividade');
});
