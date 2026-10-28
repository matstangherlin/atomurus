// Activity sheets with answer keys (prompt 28).
const { test, expect } = require('@playwright/test');
const { isolate } = require('./pt-pages-helpers');

const pdfPages = (buf) => (buf.toString('latin1').match(/\/Type\s*\/Page(?!s)/g) || []).length;
const SHEETS = ['F1', 'F2', 'F3'];

for (const lang of ['pt', 'en']) {
  for (const id of SHEETS) {
    test(`${id} ${lang}: the student sheet has no answers and prints on one A4 page; so does the key`, async ({ context, page }) => {
      await isolate(context, lang);
      const suffix = lang === 'pt' ? '.pt.html?lang=pt-BR' : '.html?lang=en';
      await page.goto(`/fichas/${id}${suffix}`);
      await expect(page.locator('html')).toHaveAttribute('lang', lang === 'pt' ? 'pt-BR' : 'en-US');
      await expect(page.locator('.fx-draft')).toHaveText(lang === 'pt' ? 'Rascunho — em revisão docente. Ainda não publicado.' : 'Draft — under teacher review. Not published yet.');
      await expect(page.locator('.fx-answer')).toHaveCount(0);
      await expect(page.locator('.fx-q')).not.toHaveCount(0);
      expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
      await page.emulateMedia({ media: 'print' });
      await expect(page.locator('.lc-topnav')).toBeHidden();
      await expect(page.locator('.fx-tools')).toBeHidden();
      expect(pdfPages(await page.pdf({ format: 'A4', preferCSSPageSize: true, printBackground: true }))).toBe(1);

      const key = await context.newPage();
      await key.goto(`/fichas/${id}-gabarito${suffix}`);
      await expect(key.locator('meta[name="robots"]')).toHaveAttribute('content', 'noindex,nofollow');
      await expect(key.locator('.fx-answer')).toHaveCount(await page.locator('.fx-q').count());
      await key.emulateMedia({ media: 'print' });
      expect(pdfPages(await key.pdf({ format: 'A4', preferCSSPageSize: true, printBackground: true }))).toBe(1);
    });
  }
}

test('F2 opens the molar mass calculator with H₂SO₄ already calculated', async ({ context, page }) => {
  await isolate(context, 'pt');
  await page.goto('/fichas/F2.pt.html?lang=pt-BR');
  await page.locator('.fx-tools a').first().click();
  await expect(page).toHaveURL(/\/calculators\.pt\.html\?formula=H2SO4/);
  await expect(page.locator('#mm-result-body .calc-result-v.big')).toContainText('98,07');
});

test('the answer key gives the computed values (PT)', async ({ context, page }) => {
  await isolate(context, 'pt');
  await page.goto('/fichas/F2-gabarito.pt.html?lang=pt-BR');
  await expect(page.locator('.fx-answer').nth(3)).toContainText('98,07 g/mol');
  await expect(page.locator('.fx-answer').nth(3)).toContainText('2 × 1,008 + 32,06 + 4 × 15,999');
  await page.goto('/fichas/F3-gabarito.pt.html?lang=pt-BR');
  await expect(page.locator('.fx-answer').nth(2)).toContainText('12,00');
  await expect(page.locator('.fx-answer').nth(4)).toContainText('1,0 × 10⁻⁴ mol/L');
});

test('the language button goes to the twin sheet', async ({ context, page }) => {
  await isolate(context, 'en');
  await page.goto('/fichas/F1.html?lang=en');
  await expect(page.locator('h1')).toHaveText('Reading the periodic table');
  await page.locator('.lc-topnav-lang').click();
  await expect(page).toHaveURL(/\/fichas\/F1\.pt\.html\?lang=pt-BR/);
  await expect(page.locator('h1')).toHaveText('Lendo a tabela periódica');
});
