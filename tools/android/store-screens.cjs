// Raw phone screenshots of the APK pages for the Google Play listing.
// Needs dist/android-web served like Capacitor's local server (extension-less
// paths → index.html) at STORE_BASE (default http://127.0.0.1:4300).
// Usage: node tools/android/store-screens.cjs <outDir>
const { chromium } = require('playwright');
const path = require('path');
const fs = require('fs');

const BASE = process.env.STORE_BASE || 'http://127.0.0.1:4300';
const OUT = process.argv[2] || 'release/android/store/raw';
const VIEW = { width: 432, height: 768 }; // × 2.5 = 1080 × 1920 (9:16)

const SCREENS = [
  { id: '1-tabela', pt: '/periodic-table.html?lang=pt-BR', en: '/periodic-table.html?lang=en', prep: async (p) => {
    const btn = p.locator('button, [role="radio"]', { hasText: /^(Cor real|Real colou?r)$/ }).first();
    if (await btn.count()) { await btn.click(); await p.waitForTimeout(600); }
    await p.evaluate(() => { const t = document.querySelector('#ptable'); if (t) t.scrollIntoView({ block: 'start' }); window.scrollBy(0, -90); });
  } },
  { id: '2-laboratorio', pt: '/app?section=lab&lang=pt-BR', en: '/app?section=lab&lang=en', prep: async (p, lang) => {
    const focus = p.locator('[data-lab-focus]'); if (await focus.count()) await focus.click();
    await p.locator('#lab-q').fill(lang === 'pt' ? 'solução de CuSO4 0,5 mol/L em 100 mL' : '0.5 mol/L CuSO4 solution in 100 mL');
    await p.keyboard.press('Enter'); await p.waitForTimeout(900);
    await p.locator('[data-dock="materials"]').click(); await p.waitForTimeout(400);
    await p.locator('[data-dock-body] [data-add="fe"]').click(); await p.waitForTimeout(300);
    await p.locator('[data-dock="materials"]').click(); await p.waitForTimeout(300);
    await p.evaluate(() => { const s = document.querySelector('.lab-stage-frame'); if (s) s.scrollIntoView({ block: 'start' }); window.scrollBy(0, -80); });
    await p.waitForTimeout(250);
  } },
  { id: '3-isomeria', pt: '/isomerism.html?lang=pt-BR&formula=C4H10O', en: '/isomerism.html?lang=en&formula=C4H10O', prep: async (p) => {
    await p.waitForSelector('.iso-x-card', { timeout: 15000 });
    await p.evaluate(() => { const g = document.querySelector('.iso-x-card'); const box = g.closest('section, .iso-x') || g; box.scrollIntoView({ block: 'start' }); });
    const head = await p.evaluate(() => { const h = document.querySelector('.iso-x-count, .iso-x-summary, .iso-x-cards, .iso-x-grid'); return h ? h.getBoundingClientRect().top + scrollY : null; });
    if (head) await p.evaluate((y) => window.scrollTo(0, y - 150), head);
  } },
  { id: '4-elemento', pt: '/periodic-table/ferrum.html?lang=pt-BR', en: '/periodic-table/ferrum.en.html?lang=en', prep: async () => {} },
  { id: '5-moleculas', pt: '/viewer/molecules.html?lang=pt-BR', en: '/viewer/molecules.html?lang=en', prep: async (p) => {
    await p.evaluate(() => { const c = document.querySelector('#viewer3d'); if (c) c.scrollIntoView({ block: 'center' }); });
    await p.waitForFunction(() => typeof THREE !== 'undefined', null, { timeout: 20000 }).catch(() => {});
    await p.waitForTimeout(7000);
    await p.evaluate(() => { const h = document.querySelector('h1'); if (h) h.scrollIntoView({ block: 'start' }); window.scrollBy(0, -70); });
    await p.waitForTimeout(1500);
  } },
  { id: '6-calculadoras', pt: '/calculators.html?lang=pt-BR', en: '/calculators.html?lang=en', prep: async (p) => {
    await p.evaluate(() => { const f = document.querySelector('#mm-input'); const panel = f && (f.closest('.calc-panel') || f); if (panel) panel.scrollIntoView({ block: 'start' }); window.scrollBy(0, -80); });
  } },
  { id: '7-modelos-atomicos', pt: '/viewer/atomic-models.html?lang=pt-BR', en: '/viewer/atomic-models.html?lang=en', prep: async (p) => {
    await p.evaluate(() => { const c = document.querySelector('canvas'); if (c) c.scrollIntoView({ block: 'center' }); });
    await p.waitForTimeout(6000);
    await p.evaluate(() => { const h = document.querySelector('h1'); if (h) h.scrollIntoView({ block: 'start' }); window.scrollBy(0, -70); });
    await p.waitForTimeout(1500);
  } },
  { id: '8-inicio', pt: '/?lang=pt-BR', en: '/?lang=en', prep: async () => {} }
];

(async () => {
  const browser = await chromium.launch(process.env.PW_CHROMIUM_EXECUTABLE ? { executablePath: process.env.PW_CHROMIUM_EXECUTABLE } : {});
  for (const lang of ['pt', 'en']) {
    const dir = path.join(OUT, lang === 'pt' ? 'pt-BR' : 'en-US');
    fs.mkdirSync(dir, { recursive: true });
    const ctx = await browser.newContext({ viewport: VIEW, deviceScaleFactor: 2.5, isMobile: true, hasTouch: true, locale: lang === 'pt' ? 'pt-BR' : 'en-US' });
    await ctx.addInitScript((l) => { try { localStorage.setItem('atomurus-lang', l); localStorage.setItem('atomurus-theme', 'light'); localStorage.setItem('atomurus-lab-sound', '0'); } catch (e) {} }, lang);
    await ctx.route(/^https?:\/\/(?!127\.0\.0\.1)/, (r) => r.abort());
    for (const s of SCREENS) {
      const page = await ctx.newPage();
      page.on('pageerror', (e) => console.warn(`${lang} ${s.id}: ${e.message}`));
      await page.goto(BASE + s[lang], { waitUntil: 'networkidle' });
      await page.waitForTimeout(800);
      try { await s.prep(page, lang); } catch (e) { console.warn(`${lang} ${s.id} prep: ${e.message}`); }
      await page.waitForTimeout(500);
      await page.screenshot({ path: path.join(dir, `${s.id}.png`) });
      await page.close();
      console.log(`${lang} ${s.id}`);
    }
    await ctx.close();
  }
  await browser.close();
})();
