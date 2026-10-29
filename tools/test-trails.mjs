// Prompts 32 and 33: trails. Schema, links that exist, drafts out of search,
// PT/EN parity of the steps, the progress script's limits, and the worked
// examples of the stoichiometry articles recomputed here independently (own
// arithmetic with the masses of elements-data.js). The examples of the
// solutions, acid–base and equilibrium articles: tools/test-trail-examples.mjs.
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import { fileURLToPath } from 'node:url';
import { CALC, DRAFT_ARTICLES, CHIP_FILE, OUT_DIR, chipScript, fileName, hrefTarget, loadTrails, renderAll, stepHref, validate } from './build-trails.mjs';
import { lintHtml } from './lint-lang-mix.mjs';
import { STORAGE_REGISTRY, StorageClass } from '../src/core/storage/storage-policy.js';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const read = (rel) => fs.readFileSync(path.join(ROOT, rel), 'utf8');

// ── Sources ─────────────────────────────────────────────────────────────────
const trails = loadTrails();
// The order on the site and the public names are the owner's call (prompt 33).
assert.deepEqual(trails.map((t) => t.id), ['acido-base', 'estequiometria', 'solucoes'], 'three trails');
assert.deepEqual(trails.flatMap(validate), [], 'the sources validate');
const byId = Object.fromEntries(trails.map((t) => [t.id, t]));
const MAIN_TYPES = {
  estequiometria: ['article', 'tool', 'exercises', 'exercises', 'article', 'lab', 'sheet', 'review'],
  solucoes: ['article', 'tool', 'exercises', 'exercises', 'lab', 'sheet', 'review'],
  'acido-base': ['article', 'tool', 'exercises', 'lab', 'tool', 'tool', 'sheet', 'review']
};
for (const tr of trails) {
  assert.equal(tr.status, 'draft', `${tr.id}: a draft until a teacher reviews it`);
  const main = tr.steps.filter((s) => !s.optional);
  assert.ok(main.length >= 6 && main.length <= 8, `${tr.id}: 6–8 main steps`);
  assert.deepEqual(main.map((s) => s.type), MAIN_TYPES[tr.id], `${tr.id}: article → tool → exercises → Lab → sheet → review`);
  for (const s of tr.steps) {
    for (const lang of ['pt', 'en']) assert.ok(hrefTarget(s.href[lang]), `${tr.id}/${s.id} ${lang}: ${s.href[lang]} exists`);
    assert.equal(s.href.pt.startsWith('#'), s.href.en.startsWith('#'), `${tr.id}/${s.id}: same kind of link in both languages`);
  }
  // The main path needs no Pro feature and no account.
  assert.ok(main.every((s) => !s.pro), `${tr.id}: no Pro step on the main path`);
  assert.ok(tr.steps.filter((s) => s.pro).every((s) => s.optional), `${tr.id}: Pro only as an optional extra`);
  for (const q of tr.review.questions.filter((x) => x.kind === 'computed')) assert.ok(CALC[q.calc], `${tr.id}: ${q.calc} is a worked example`);
}
const trail = byId.estequiometria;
const main = trail.steps.filter((s) => !s.optional);
// Each trail lands on its own article, Lab guide and sheet.
assert.ok(byId.solucoes.steps.some((s) => s.href.en === '/fichas/F4.html') && byId.solucoes.steps.some((s) => /creation=solution\b/.test(s.href.en)), 'Solutions: sheet F4 and the Lab solution guide');
assert.ok(byId['acido-base'].steps.some((s) => s.href.en === '/fichas/F3.html') && byId['acido-base'].steps.some((s) => /creation=ph\b/.test(s.href.en)), 'Acid–base: sheet F3 and the pH Challenge (POE)');
// The calculator opens in the weak-acid and buffer modes from the URL.
for (const mode of ['weakAcid', 'buffer']) assert.ok(byId['acido-base'].steps.some((s) => s.href.en === `/calculators.html?ph=${mode}#ph`), `pH calculator in ${mode} mode`);
for (const page of ['calculators.html', 'calculators.pt.html']) assert.match(read(page), /\['weakAcid', 'weakBase', 'buffer'\]\.indexOf\(want\)/, `${page}: ?ph= picks the mode`);
// The validator catches the usual mistakes.
const broken = JSON.parse(JSON.stringify(trail));
broken.steps[0].href.pt = '/explore/no-such-page.pt.html';
broken.minutes += 1;
broken.steps[2].requires = ['ficha'];
const errors = validate(broken).join(' | ');
assert.match(errors, /no-such-page/);
assert.match(errors, /minutes/);
assert.match(errors, /requires an earlier step/);
assert.equal(stepHref(trail, trail.steps[1], 1, 'pt'), '/calculators.pt.html?formula=H2SO4&trail=estequiometria&step=2#molar', 'trail and step ride the URL, the hash stays last');

// ── Worked examples, recomputed independently ───────────────────────────────
const el = vm.createContext({ window: {} });
vm.runInContext(read('elements-data.js') + ';this.__E = { ELEMENTS };', el);
const MASS = Object.fromEntries(el.__E.ELEMENTS.map((e) => [e.sym, Number(e.mass)]));
const molar = (atoms) => Object.entries(atoms).reduce((s, [sym, n]) => s + MASS[sym] * n, 0);
const sig = (n, d, lang) => { const s = String(Number(n.toPrecision(d))); return lang === 'pt' ? s.replace('.', ',') : s; };
const NA = 6.02214076e23; // exact (SI 2019)
const R = 1.380649e-23 * NA;
const W = { H2O: molar({ H: 2, O: 1 }), CO2: molar({ C: 1, O: 2 }), H2: molar({ H: 2 }), O2: molar({ O: 2 }), CH4: molar({ C: 1, H: 4 }), CaCO3: molar({ Ca: 1, C: 1, O: 3 }), CaO: molar({ Ca: 1, O: 1 }), H2SO4: molar({ H: 2, S: 1, O: 4 }) };
for (const lang of ['pt', 'en']) {
  const has = (id, text) => assert.ok(CALC[id](lang).answer.includes(text) || CALC[id](lang).steps.some((s) => s.expr.includes(text)), `${id} ${lang}: «${text}»`);
  has('mole-co2', 'M = ' + sig(W.CO2, 5, lang) + ' g/mol');
  has('mole-water', 'n = ' + sig(36 / W.H2O, 4, lang) + ' mol');
  const N = (36 / W.H2O) * NA;
  const [mant, exp] = N.toExponential(3).split('e');
  assert.equal(CALC['mole-particles'](lang).answer, 'N = ' + (lang === 'pt' ? mant.replace('.', ',') : mant) + ' × 10²⁴ ' + (lang === 'pt' ? 'moléculas' : 'molecules'));
  assert.equal(Number(exp), 24);
  has('mole-gas', 'V = ' + sig(R * 273.15 / 101325 * 1000, 4, lang) + ' L');
  const water = CALC['mass-water'](lang);
  assert.ok(Math.abs(water.left - (2 * W.H2 + W.O2)) < 1e-9 && Math.abs(water.right - 2 * W.H2O) < 1e-9, 'mass of 2 H₂ + O₂ and 2 H₂O');
  assert.ok(Math.abs(water.left - water.right) < 1e-9, 'conserved');
  const ch4 = CALC['mass-methane'](lang);
  assert.ok(Math.abs(ch4.left - (W.CH4 + 2 * W.O2)) < 1e-9 && Math.abs(ch4.left - ch4.right) < 1e-9, 'methane balances');
  const lime = CALC['mass-limestone'](lang);
  assert.ok(Math.abs(lime.right - 10) < 1e-9, 'CaO + CO₂ = 10 g');
  has('mass-limestone', 'm(CaO) = ' + sig(10 / W.CaCO3, 4, lang) + ' mol × ' + sig(W.CaO, 5, lang) + ' g/mol = ' + sig(10 / W.CaCO3 * W.CaO, 4, lang) + ' g');
  has('moles-co2', 'n = ' + sig(88 / W.CO2, 4, lang) + ' mol');
  has('mass-h2so4', 'm = ' + sig(0.5 * W.H2SO4, 4, lang) + ' g');
  for (const id of Object.keys(CALC)) {
    const r = CALC[id](lang);
    assert.doesNotMatch(r.answer + JSON.stringify(r.steps), /NaN|undefined|Infinity/, `${id}: no NaN`);
    if (lang === 'pt') assert.doesNotMatch(r.answer, /\d\.\d/, `${id}: decimal comma in PT`);
  }
}

// ── Pages ───────────────────────────────────────────────────────────────────
const out = renderAll();
const unstamp = (s) => s.replace(/\?v=\d+/g, '?v=0');
for (const p of out.pages) assert.equal(unstamp(read('trilhas/' + p.name)), unstamp(p.html), `trilhas/${p.name} is current (node tools/build-trails.mjs)`);
assert.deepEqual(fs.readdirSync(OUT_DIR).sort(), out.pages.map((p) => p.name).sort(), 'nothing else in trilhas/');
for (const a of out.articles) assert.equal(read(a.rel), a.html, `${a.rel}: worked examples current`);
assert.equal(read(path.relative(ROOT, CHIP_FILE)), chipScript(trails), 'assets/trail-chip.js current');
const sitemap = read('sitemap.xml');
const drafts = new RegExp('trilhas\\/|' + DRAFT_ARTICLES.map((b) => b.replace('explore/', '')).join('|'));
assert.equal(DRAFT_ARTICLES.length, 5, 'five draft articles (prompts 32 and 33)');
assert.doesNotMatch(sitemap, drafts, 'drafts stay out of the sitemap');
assert.doesNotMatch(read('explore.html') + read('explore.pt.html'), drafts, 'drafts stay out of the menus');

for (const tr of trails) {
  const shape = {};
  for (const lang of ['pt', 'en']) {
    const html = read('trilhas/' + fileName(tr, lang));
    assert.match(html, /<meta name="robots" content="noindex,nofollow">/);
    assert.match(html, /class="fx-draft"/);
    assert.doesNotMatch(html, /ads-gate|lazy-ads|adsbygoogle|atomurusRunAutoTag|googletagmanager/, 'no ads, no trackers');
    assert.match(html, new RegExp(`data-trail="${tr.id}"`));
    assert.match(html, /assets\/trail-progress\.js/);
    const buttons = (html.match(/data-trail-done="/g) || []).length;
    assert.equal(buttons, tr.steps.length, `${tr.id}: a «done» button per step`);
    assert.equal((html.match(/data-optional/g) || []).length, tr.steps.filter((s) => s.optional).length);
    assert.match(html, /id="revisao"/, 'the review step lands on the page');
    assert.equal((html.match(/class="tr-q"/g) || []).length, 5, 'five self-check questions');
    assert.doesNotMatch(html, /NaN|undefined/, `${tr.id} ${lang}: no NaN`);
    const lint = lintHtml(html, { maxWords: 0 });
    assert.deepEqual(lint.foreign.map((b) => `${b.where} ${b.text}`), [], `trail ${tr.id} ${lang}: one language per page`);
    shape[lang] = { steps: buttons, items: (html.match(/<li/g) || []).length };
  }
  assert.deepEqual(shape.pt, shape.en, `${tr.id}: PT and EN have the same steps`);
}

for (const base of DRAFT_ARTICLES) {
  for (const lang of ['pt', 'en']) {
    const rel = base + (lang === 'pt' ? '.pt.html' : '.html');
    const html = read(rel);
    assert.match(html, /<meta name="robots" content="noindex,nofollow">/, `${rel}: noindex`);
    assert.match(html, /class="art-draft" role="note"/, `${rel}: draft band`);
    assert.doesNotMatch(html, /ads-gate|lazy-ads|adsbygoogle|atomurusRunAutoTag|google-adsense-account/, `${rel}: no ads`);
    assert.match(html, /<figure class="art-fig" role="img" aria-label="[^"]{40,}"/, `${rel}: a figure with a description`);
    assert.match(html, /class="article-level-chip"/, `${rel}: level`);
    assert.match(html, /class="article-learn"/, `${rel}: you will learn`);
    assert.ok((html.match(/<!-- calc:/g) || []).length >= 3, `${rel}: worked examples`);
    // 1,200–1,800 words from the body to the references, worked examples included.
    const body = html.slice(html.indexOf('id="art-body"'), html.indexOf('<section class="art-refs">'));
    const n = body.replace(/<[^>]+>/g, ' ').replace(/&[a-z#0-9]+;/gi, ' ').split(/\s+/).filter(Boolean).length;
    assert.ok(n >= 1200 && n <= 1800, `${rel}: ${n} words`);
    assert.match(html, /assets\/trail-chip\.js/);
    // The hero and the body are this prompt's; the sidebar and search chrome
    // are the Explore pages' shared (and, in PT, partly English) chrome.
    const region = html.slice(html.indexOf('<header class="art-hero">'), html.indexOf('<aside class="art-aside">'));
    const lint = lintHtml(`<html lang="${lang === 'pt' ? 'pt-BR' : 'en-US'}"><body>${region}</body></html>`, { maxWords: 0 });
    assert.deepEqual(lint.foreign.map((b) => `${b.where} ${b.text}`), [], `${rel}: the article is in one language`);
  }
}
// The chip goes on the new pages and the calculators only.
for (const page of ['calculators.html', 'calculators.pt.html', 'exercises/molar-mass.html', 'exercises/solution-prep.pt.html', 'exercises/buffer.html', 'fichas/F2.pt.html', 'fichas/F4.html']) assert.match(read(page), /assets\/trail-chip\.js/, page);
assert.doesNotMatch(read('index.html') + read('periodic-table.html'), /trail-chip/, 'no change to the other pages');

// ── Progress script ─────────────────────────────────────────────────────────
const progress = read('assets/trail-progress.js');
assert.ok(Buffer.byteLength(progress) <= 2048, 'trail-progress.js ≤ 2 KB');
assert.doesNotMatch(progress, /fetch|XMLHttpRequest|sendBeacon|navigator\./, 'no network');
assert.equal(STORAGE_REGISTRY['atomurus-trail-progress'].cls, StorageClass.LOCAL_STATE, 'the progress key is registered');
assert.match(read('assets/account-center.js'), /'atomurus-trail-progress'/, 'deleting the account clears it');
const chip = read('assets/trail-chip.js');
assert.ok(Buffer.byteLength(chip) <= 1536, 'trail-chip.js is small');
assert.doesNotMatch(chip, /fetch|localStorage|sessionStorage/, 'the chip reads only the URL');

console.log(`test-trails: ok (${trails.length} trails, ${trails.map((t) => t.steps.filter((s) => !s.optional).length).join('/')} main steps, ${Object.keys(CALC).length} worked examples)`);
