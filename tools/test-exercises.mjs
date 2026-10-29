// Prompt 30: the exercise bank. Every answer the engines give is recomputed
// here independently — own formula parser, the masses of elements-data.js,
// plain arithmetic — and must match, for the fixed exercises and for drawn
// ones. Also: no NaN, units, decimal comma in PT, pages current and drafts
// kept out of search.
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import { fileURLToPath } from 'node:url';
import { engineContext, loadDefs, renderAll, validate, fileName, OUT_DIR, TYPES, MIN_EXERCISES } from './build-exercises.mjs';
import { lintHtml } from './lint-lang-mix.mjs';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const read = (rel) => fs.readFileSync(path.join(ROOT, rel), 'utf8');

// ── Independent references ──────────────────────────────────────────────────
const el = vm.createContext({ window: {} });
vm.runInContext(read('elements-data.js') + ';this.__E = { ELEMENTS };', el);
const MASS = Object.fromEntries(el.__E.ELEMENTS.map((e) => [e.sym, Number(e.mass)]));

/* A small parser of its own: symbols, counts, parentheses, one hydrate «·n». */
function parse(formula) {
  const [main, hydrate] = formula.split('·');
  const out = {};
  const add = (sym, n) => { out[sym] = (out[sym] || 0) + n; };
  function group(text, mult) {
    const re = /\(([^()]*)\)(\d*)|([A-Z][a-z]?)(\d*)/g;
    let m;
    while ((m = re.exec(text))) {
      if (m[1] != null) group(m[1], mult * (Number(m[2]) || 1));
      else add(m[3], mult * (Number(m[4]) || 1));
    }
  }
  group(main, 1);
  if (hydrate) {
    const h = /^(\d*)(.*)$/.exec(hydrate);
    group(h[2], Number(h[1]) || 1);
  }
  return out;
}
const molar = (formula) => Object.entries(parse(formula)).reduce((s, [sym, n]) => s + MASS[sym] * n, 0);
const strongPH = (mode, c) => {
  const x = (c + Math.sqrt(c * c + 4e-14)) / 2; // complete dissociation + water
  const p = -Math.log10(x);
  return mode === 'H' ? p : 14 - p;
};
const sigText = (n, sig, lang) => {
  const s = String(Number(n.toPrecision(sig)));
  return lang === 'pt' ? s.replace('.', ',') : s;
};
const fixed2 = (n, lang) => { const s = n.toFixed(2); return lang === 'pt' ? s.replace('.', ',') : s; };

// What each type must answer, computed here.
const EXPECT = {
  'molar-mass': (v) => ({ value: molar(v.formula), text: (lang) => 'M = ' + sigText(molar(v.formula), 5, lang) + ' g/mol' }),
  'moles-mass': (v) => {
    const M = molar(v.formula);
    return v.unit === 'g'
      ? { value: v.amount / M, text: (lang) => 'n = ' + sigText(v.amount / M, 4, lang) + ' mol' }
      : { value: v.amount * M, text: (lang) => 'm = ' + sigText(v.amount * M, 4, lang) + ' g' };
  },
  dilution: (v) => v.solve === 'V2'
    ? { value: v.C1 * v.V1 / v.C2, text: (lang) => 'V₂ = ' + sigText(v.C1 * v.V1 / v.C2, 4, lang) + ' mL' }
    : { value: v.C1 * v.V1 / v.V2, text: (lang) => 'C₂ = ' + sigText(v.C1 * v.V1 / v.V2, 4, lang) + ' mol/L' },
  'ph-strong': (v) => ({ value: strongPH(v.mode, v.c), text: (lang) => 'pH = ' + fixed2(strongPH(v.mode, v.c), lang) }),
  'solution-prep': (v) => {
    const m = v.C * (v.V / 1000) * molar(v.formula);
    return { value: m, text: (lang) => 'm = ' + sigText(m, 4, lang) + ' g' };
  },
  // pKa is data (calc-core's sourced table); the arithmetic is done here.
  buffer: (v) => {
    const ratio = 10 ** (v.pH - PKA[v.acid]);
    return { value: ratio, text: (lang) => '[A⁻]/[HA] = ' + sigText(ratio, 4, lang) };
  }
};
// The engine's own number behind the answer.
const ENGINE_VALUE = {
  'molar-mass': (r) => r.result.total,
  'moles-mass': (r, v) => (v.unit === 'g' ? r.result.moles : r.result.grams),
  dilution: (r) => r.result.value,
  'ph-strong': (r) => r.result.pH,
  'solution-prep': (r) => r.result.mass,
  buffer: (r) => r.result.ratio
};

// ── Sources ─────────────────────────────────────────────────────────────────
const ctx = engineContext();
const X = ctx.AtomurusExercises;
const PKA = Object.fromEntries(ctx.AtomurusCalcCore.ACID_BASE_CONSTANTS.filter((r) => r.pKa).map((r) => [r.id, r.pKa[0]]));
assert.ok(ctx.AtomurusCalcCore.ACID_BASE_CONSTANTS.every((r) => /CRC|McQuarrie|OpenStax/.test(r.source)), 'every constant used by the buffer bank has a source');
const defs = loadDefs();
assert.deepEqual(defs.map((d) => d.id), TYPES, 'six types (prompts 30 and 33)');
assert.deepEqual(defs.flatMap((d) => validate(d, ctx)), [], 'the sources validate');

// The two weight tables agree for every element the bank uses (the site has
// two tables; where they differ the value is pending teacher review).
const used = new Set();
for (const def of defs) {
  const formulas = [...(def.variables.formula?.list || []), ...def.exercises.map((e) => e.vars.formula).filter(Boolean)];
  formulas.forEach((f) => Object.keys(parse(f)).forEach((s) => used.add(s)));
}
const W = ctx.AtomurusFormula.ATOMIC_WEIGHTS;
assert.deepEqual([...used].filter((s) => W[s] !== MASS[s]), [], 'calculator and periodic-table masses agree for the elements used');

let checked = 0;
function check(def, vars, label) {
  const want = EXPECT[def.id](vars);
  for (const lang of ['pt', 'en']) {
    const r = X.solve(def, vars, lang);
    assert.ok(r.ok, `${label}: solved`);
    const got = ENGINE_VALUE[def.id](r, vars);
    assert.ok(Math.abs(got - want.value) <= 1e-9 * Math.max(1, Math.abs(want.value)), `${label}: engine ${got} = independent ${want.value}`);
    assert.equal(r.answer, want.text(lang), `${label} ${lang}: the answer reads «${want.text(lang)}»`);
    assert.doesNotMatch(r.answer + r.statement + JSON.stringify(r.steps), /NaN|undefined|Infinity/, `${label}: no NaN`);
    assert.match(r.answer, /(g\/mol|mol|g|mL|mol\/L)$|^pH = |^\[A⁻\]\/\[HA\] = /, `${label}: the answer has its unit (a ratio has none)`);
    if (lang === 'pt') assert.doesNotMatch(r.answer + r.statement, /\d\.\d/, `${label}: decimal comma in PT (${r.answer})`);
    else assert.doesNotMatch(r.answer + r.statement, /\d,\d/, `${label}: decimal point in EN`);
    assert.ok(r.steps.length >= 3 && r.steps.every((s) => s.text && s.expr), `${label}: steps with text and expression`);
    const value = r.answer.split(' = ')[1];
    assert.ok(r.steps.some((s) => s.expr.endsWith(value) || s.expr.includes('= ' + value)), `${label}: a step ends at the answer (${value})`);
    checked += 1;
  }
}

for (const def of defs) {
  assert.ok(def.exercises.length >= MIN_EXERCISES, `${def.id}: ≥ ${MIN_EXERCISES}`);
  assert.equal(def.status, 'draft', `${def.id} stays a draft until a teacher reviews it`);
  def.exercises.forEach((ex) => check(def, ex.vars, `${def.id}.${ex.id}`));
  // Drawn exercises: the same seed gives the same one, and every draw checks out.
  assert.deepEqual(X.pickVars(def, 2026), X.pickVars(def, 2026), `${def.id}: a seed is reproducible`);
  const seen = new Set();
  for (let seed = 1; seed <= 150; seed += 1) {
    const vars = X.pickVars(def, seed);
    seen.add(JSON.stringify(vars));
    check(def, vars, `${def.id} seed ${seed}`);
  }
  assert.ok(seen.size > 10, `${def.id}: draws vary (${seen.size} distinct)`);
}

// Common errors: at least two types explain a typical wrong result, and the
// wrong value is the mistake made on purpose.
const withErrors = defs.filter((d) => d.commonErrors.length);
assert.ok(withErrors.length >= 2, 'common errors for two types or more');
const mm = defs.find((d) => d.id === 'molar-mass');
const h2so4 = X.solve(mm, { formula: 'H2SO4' }, 'pt');
assert.ok(h2so4.errors[0].includes(sigText(MASS.H + MASS.S + MASS.O, 5, 'pt') + ' g/mol'), 'H₂SO₄ with each element once');
assert.equal(X.solve(mm, { formula: 'NaCl' }, 'pt').errors.length, 0, 'no «forgot the subscript» where there is none');
const sp = defs.find((d) => d.id === 'solution-prep');
assert.ok(X.solve(sp, { formula: 'NaCl', C: 0.1, V: 250 }, 'pt').errors[0].includes(sigText(0.1 * 250 * molar('NaCl'), 4, 'pt') + ' g'), 'millilitres used as litres');
const bf = defs.find((d) => d.id === 'buffer');
const outOfRange = X.solve(bf, { acid: 'acetic', pH: 6 }, 'pt');
assert.ok(outOfRange.steps[2].expr.endsWith('✗'), 'a ratio past 10 is flagged (pH beyond pKa + 1)');
assert.ok(X.solve(bf, { acid: 'acetic', pH: 5 }, 'pt').steps[2].expr.endsWith('✓'));
assert.match(X.solve(bf, { acid: 'acetic', pH: 5 }, 'pt').statement, /ácido acético e acetato/, 'names from calc-core, lower case mid-sentence');
const ph = defs.find((d) => d.id === 'ph-strong');
assert.ok(X.solve(ph, { mode: 'OH', solute: 'NaOH', c: 0.01 }, 'en').errors[0].includes('2.00'), 'pOH taken for the pH');
assert.ok(X.solve(ph, { mode: 'H', solute: 'HCl', c: 0.01 }, 'en').errors[0].includes('−2.00'), 'the sign dropped');

// ── Pages ───────────────────────────────────────────────────────────────────
const pages = renderAll();
assert.equal(pages.length, defs.length * 2);
const unstamp = (s) => s.replace(/\?v=\d+/g, '?v=0');
for (const p of pages) assert.equal(unstamp(read('exercises/' + p.name)), unstamp(p.html), `exercises/${p.name} is current (node tools/build-exercises.mjs)`);
assert.deepEqual(fs.readdirSync(OUT_DIR).sort(), pages.map((p) => p.name).sort(), 'nothing else in exercises/');
const sitemap = read('sitemap.xml');
for (const def of defs) {
  for (const lang of ['pt', 'en']) {
    const html = read('exercises/' + fileName(def, lang));
    const label = `${def.id} ${lang}`;
    assert.match(html, new RegExp(`<html[^>]*\\slang="${lang === 'pt' ? 'pt-BR' : 'en-US'}"`));
    assert.match(html, /<meta name="robots" content="noindex,nofollow">/, `${label}: a draft is not indexed`);
    assert.match(html, /class="fx-draft"/, `${label}: the draft band shows`);
    assert.doesNotMatch(html, /ads-gate|lazy-ads|adsbygoogle|atomurusRunAutoTag|consent\.js|googletagmanager/, `${label}: no ads, no trackers`);
    const n = def.exercises.length;
    assert.equal((html.match(/<details class="ex-answer"><summary>/g) || []).length, n, `${label}: an «Answer» per exercise`);
    assert.equal((html.match(/<details class="ex-solution"><summary>/g) || []).length, n, `${label}: a «Worked solution» per exercise`);
    assert.match(html, /<details class="ex-key" id="gabarito">/, `${label}: the answer key is its own section`);
    assert.match(html, /\.ex-item details\{display:none!important\}/, `${label}: printed without answers`);
    assert.match(html, /html\.ex-print-key \.ex-key\{display:block;break-before:page\}/, `${label}: the key prints on its own page, on request`);
    assert.match(html, /data-ex-new-root/, `${label}: the «new exercise» mode`);
    const def2 = JSON.parse(/<script type="application\/json" id="ex-def">([\s\S]*?)<\/script>/.exec(html)[1]);
    assert.equal(def2.id, def.id);
    for (const src of ['physical-constants.js', 'calc-core.js', 'formula-parser.js', 'worked-steps.js', 'worked-solution.js', 'exercises.js']) assert.ok(html.includes(src), `${label}: loads ${src}`);
    assert.ok(!sitemap.includes('exercises/' + def.id), `${label}: drafts stay out of the sitemap`);
    const lint = lintHtml(html, { maxWords: 0 });
    assert.deepEqual(lint.foreign.map((b) => `${b.where} ${b.text}`), [], `${label}: one language per page`);
  }
}

// Every step text exists in both languages, with the same slots.
const TEXT = ctx.AtomurusWorkedSteps.TEXT;
for (const [id, t] of Object.entries(TEXT)) {
  assert.ok(t.pt && t.en, `worked-steps ${id}: PT and EN`);
  const slots = (x) => (x.match(/\{\w+\}/g) || []).sort().join();
  assert.equal(slots(t.pt), slots(t.en), `worked-steps ${id}: same slots`);
}

// Sizes the prompt sets for the component.
assert.ok(fs.statSync(path.join(ROOT, 'assets/worked-solution.js')).size <= 3072, 'worked-solution.js ≤ 3 KB');
assert.ok(fs.statSync(path.join(ROOT, 'assets/ui/worked-solution.css')).size <= 3072, 'worked-solution.css ≤ 3 KB');

// The build writes the pages after the version bump and the PT bake.
const buildCmd = JSON.parse(read('package.json')).scripts.build.split(' && ');
assert.ok(buildCmd.indexOf('node tools/build-exercises.mjs') > buildCmd.indexOf('node bump-version.js'), 'exercises after the version bump');

console.log(`test-exercises: ok (${defs.length} types, ${checked} answers checked)`);
