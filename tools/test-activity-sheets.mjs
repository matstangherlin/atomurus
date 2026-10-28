// Prompt 28: activity sheets and their answer keys. The expected values are
// computed here, independently of the generator (the server's formula engine,
// plain −log₁₀, the element data, the Lab engine), never copied.
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';
import { molarMassOf } from '../netlify/lib/chemistry-calc.mjs';
import { renderAll, loadSheets, fileName, round, fmtNum, fmtSci, ENGINE_NAMES, OUT_DIR } from './build-activity-sheets.mjs';
import { lintHtml } from './lint-lang-mix.mjs';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const require = createRequire(import.meta.url);
const read = (rel) => fs.readFileSync(path.join(ROOT, rel), 'utf8');
const page = (sheet, lang, key) => read('fichas/' + fileName(sheet, lang, key));
const num = (n, d, lang) => { const s = (Math.round(n * 10 ** d) / 10 ** d).toFixed(d); return lang === 'pt' ? s.replace('.', ',') : s; };

// ── Number helpers ──────────────────────────────────────────────────────────
assert.equal(round(18.015, 2), 18.02, 'halves round up on the decimal value');
assert.equal(round(2.0049, 2), 2);
assert.equal(fmtNum(98.072, 2, 'pt'), '98,07');
assert.equal(fmtNum(98.072, 2, 'en'), '98.07');
assert.equal(fmtSci(1e-4, 'pt'), '1,0 × 10⁻⁴');
assert.equal(fmtSci(3.2e-9, 'en'), '3.2 × 10⁻⁹');

// ── Sources ─────────────────────────────────────────────────────────────────
const sheets = loadSheets();
assert.deepEqual(sheets.map((s) => s.id), ['F1', 'F2', 'F3']);
for (const sheet of sheets) {
  assert.equal(sheet.status, 'draft', `${sheet.id} stays a draft until the owner publishes it`);
  assert.equal(sheet.reviewedBy, null);
  assert.equal(sheet.minutes, 50);
  assert.equal(sheet.steps.reduce((sum, s) => sum + s.minutes, 0), sheet.minutes, `${sheet.id}: the plan adds up to ${sheet.minutes} min`);
  for (const lang of ['pt', 'en']) {
    for (const field of ['title', 'summary', 'level', 'teacherNotes']) assert.ok(String(sheet[field][lang] || '').trim(), `${sheet.id}.${field}.${lang}`);
    assert.ok(sheet.objectives[lang].length >= 2 && sheet.materials[lang].length >= 1);
    assert.equal(sheet.objectives.pt.length, sheet.objectives.en.length, `${sheet.id}: objectives in parity`);
    sheet.steps.forEach((s) => assert.ok(s[lang]));
    sheet.commonErrors.forEach((e) => assert.ok(e[lang]));
    assert.ok(sheet.tool.href[lang].startsWith('/'), 'internal, absolute route');
  }
  const ids = sheet.questions.map((q) => q.id);
  assert.equal(new Set(ids).size, ids.length, `${sheet.id}: question ids are unique`);
  for (const q of sheet.questions) {
    assert.ok(q.prompt.pt && q.prompt.en && q.points > 0 && q.lines >= 1, `${sheet.id}.${q.id}`);
    if (q.answer.kind === 'computed') assert.ok(ENGINE_NAMES.includes(q.answer.engine), `${sheet.id}.${q.id}: engine ${q.answer.engine}`);
    else {
      assert.equal(q.answer.kind, 'text');
      assert.ok(q.answer.value.pt && q.answer.value.en && q.answer.source && q.answer.source.pt && q.answer.source.en, `${sheet.id}.${q.id}: a text answer cites its source`);
    }
  }
  // A number in the key is computed, never typed.
  sheet.questions.filter((q) => q.kind === 'numeric').forEach((q) => assert.equal(q.answer.kind, 'computed', `${sheet.id}.${q.id}: numeric answers are computed`));
}

// ── Expected answers, computed here ─────────────────────────────────────────
const ctx = { window: {} };
vm.createContext(ctx);
vm.runInContext(read('elements-data.js') + ';this.__E = { ELEMENTS };', ctx);
const { ELEMENTS } = ctx.__E;
const syms = (rows) => rows.sort((a, b) => a.z - b.z).map((e) => e.sym).join(', ');
const M = (f) => molarMassOf(f).molarMass;
assert.ok(Math.abs(M('H2SO4') - 98.07) < 0.01, 'M(H₂SO₄) ≈ 98.07 g/mol');

const lab = require('../assets/lab/virtual-lab.js');
const quiet = console.debug;
console.debug = () => {};
const phSession = lab.emptySession({ title: 'test', mode: 'bench' });
lab.startGuide(phSession, 'ph');
const beaker = phSession.containers.find((row) => row.type === 'beaker');
lab.addToContainer(phSession, beaker.id, 'water', 50);
lab.addToContainer(phSession, beaker.id, 'citric_acid', 6);
const phBefore = lab.measure(phSession, beaker.id, 'ph').row.value;
lab.addToContainer(phSession, beaker.id, 'bicarbonate', 7.3);
const phAfter = lab.measure(phSession, beaker.id, 'ph').row.value;
console.debug = quiet;
assert.ok(phBefore < 2.5 && phAfter >= 6.5 && phAfter <= 7.5, `Lab pH ${phBefore} → ${phAfter}`);

const EXPECT = {
  F1: (lang) => [
    lang === 'pt' ? 'grupo 8, período 4' : 'group 8, period 4',
    '6: <span translate="no">' + syms(ELEMENTS.filter((e) => e.cat === 'alkali')) + '</span>',
    '7, ' + (lang === 'pt' ? 'no grupo' : 'in group') + ' 18: <span translate="no">' + syms(ELEMENTS.filter((e) => e.cat === 'noble')) + '</span>',
    (lang === 'pt' ? 'Cloro' : 'Chlorine') + ' (Cl) — ',
    '2: <span translate="no">Li, Be</span>'
  ],
  F2: (lang) => [
    num(M('H2O'), 2, lang) + ' g/mol', num(M('CO2'), 2, lang) + ' g/mol', num(M('NaCl'), 2, lang) + ' g/mol',
    num(M('H2SO4'), 2, lang) + ' g/mol', num(M('C6H12O6'), 2, lang) + ' g/mol',
    num(117 / num2(M('NaCl')), 2, lang) + ' mol', num(0.5 * num2(M('H2SO4')), 2, lang) + ' g'
  ],
  F3: (lang) => [
    num(-Math.log10(0.01), 2, lang), num(-Math.log10(0.001), 2, lang),
    num(14 + Math.log10(0.01), 2, lang), num(14 + Math.log10(0.0001), 2, lang),
    num(1, 1, lang) + ' × 10⁻⁴ mol/L',
    String(10 ** (5 - 3)) + (lang === 'pt' ? ' vezes' : ' times'),
    num(phBefore, 1, lang), num(phAfter, 1, lang)
  ]
};
function num2(x) { return Math.round(x * 100) / 100; }
assert.equal(EXPECT.F1('pt')[1].includes('Li, Na, K, Rb, Cs, Fr'), true, 'six alkali metals in the data');
assert.equal(ELEMENTS.filter((e) => e.cat === 'noble').length, 7);

// ── Pages ───────────────────────────────────────────────────────────────────
const pages = renderAll();
assert.equal(pages.length, 12);
const unstamp = (s) => s.replace(/\?v=\d+/g, '?v=0');
for (const p of pages) assert.equal(unstamp(read('fichas/' + p.name)), unstamp(p.html), `fichas/${p.name} is current (node tools/build-activity-sheets.mjs)`);
assert.deepEqual(fs.readdirSync(OUT_DIR).sort(), pages.map((p) => p.name).sort(), 'nothing else in fichas/');

for (const sheet of sheets) {
  for (const lang of ['pt', 'en']) {
    const student = page(sheet, lang, false);
    const key = page(sheet, lang, true);
    for (const expected of EXPECT[sheet.id](lang)) {
      assert.ok(key.includes(expected), `${sheet.id} ${lang} key has «${expected}»`);
      if (/\d{2}|vezes|times|grupo|group|Cl\)/.test(expected)) assert.ok(!student.includes(expected), `${sheet.id} ${lang} student sheet does not give away «${expected}»`);
    }
    assert.doesNotMatch(student, /class="fx-answer"|class="fx-work"/, 'no answers on the student sheet');
    assert.equal((key.match(/class="fx-answer"/g) || []).length, sheet.questions.length, 'one answer per question');
    assert.equal((student.match(/class="fx-lines"/g) || []).length, sheet.questions.length, 'answer lines for each question');
    for (const html of [student, key]) {
      assert.match(html, /<meta name="robots" content="noindex,nofollow">/, 'draft and key: not indexed');
      assert.match(html, /class="fx-draft"/, 'the draft band shows');
      assert.match(html, new RegExp(`<html[^>]*\\slang="${lang === 'pt' ? 'pt-BR' : 'en-US'}"`));
      assert.doesNotMatch(html, /ads-gate|lazy-ads|adsbygoogle|atomurusRunAutoTag|consent\.js|googletagmanager/, 'no ads, no trackers');
      assert.match(html, /href="\/assets\/print\.css\?v=\d+" media="print"/, 'site print stylesheet');
      assert.match(html, /\[licença: definir\]/, 'licence is an owner decision');
      const lint = lintHtml(html, { maxWords: 0 });
      assert.deepEqual(lint.foreign.map((b) => `${b.where} ${b.text}`), [], `${sheet.id} ${lang}: one language per page`);
    }
    // The language button goes to the twin page.
    const twin = fileName(sheet, lang === 'pt' ? 'en' : 'pt', false);
    assert.ok(student.includes(`location.href='${twin}?lang=${lang === 'pt' ? 'en' : 'pt-BR'}'`));
    // The tool links are the routes the sheet names.
    assert.ok(student.includes(`href="${sheet.tool.href[lang]}"`));
  }
}

// The build writes the sheets last, after the version bump and the PT bake.
const buildCmd = JSON.parse(read('package.json')).scripts.build.split(' && ');
assert.equal(buildCmd[buildCmd.length - 1], 'node tools/build-activity-sheets.mjs');
assert.ok(buildCmd.indexOf('node bump-version.js') < buildCmd.length - 1 && buildCmd.indexOf('node tools/inject-ui-chrome.js') < buildCmd.length - 1);
assert.doesNotMatch(read('sitemap.xml'), /fichas\//, 'drafts stay out of the sitemap');

console.log(`test-activity-sheets: ok (${sheets.length} sheets, ${pages.length} pages)`);
