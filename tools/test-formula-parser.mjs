import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { createRequire } from 'node:module';
import { readFileSync } from 'node:fs';
import { ATOMIC_WEIGHTS } from '../netlify/lib/chemistry-base.mjs';
import { molarMassOf } from '../netlify/lib/chemistry-calc.mjs';
import { balanceEquation } from '../netlify/lib/chemistry-reactions.mjs';
import { IONIC_UNAVAILABLE, looksIonic, parseFormulaStrict } from '../netlify/lib/chemistry-formula-strict.mjs';

const require = createRequire(import.meta.url);
const client = require('../assets/chemistry/formula-parser.js');

function mass(formula) {
  return molarMassOf(formula).molarMass;
}

function expectError(input, code, en, pt) {
  const parsed = parseFormulaStrict(input);
  assert.equal(parsed.ok, false, input);
  assert.equal(parsed.error.code, code, input);
  if (en) assert.match(parsed.error.message_en, en, input);
  if (pt) assert.match(parsed.error.message_pt, pt, input);
  assert.equal(typeof parsed.error.position === 'number' || parsed.error.position === null, true);
  const copy = client.parseFormulaStrict(input);
  assert.equal(copy.ok, false);
  assert.equal(copy.error.code, code);
  assert.equal(copy.error.message_pt, parsed.error.message_pt);
  assert.equal(copy.error.message_en, parsed.error.message_en);
}

const water = parseFormulaStrict('H2O');
assert.equal(water.ok, true);
assert.deepEqual(water.counts, { H: 2, O: 1 });
assert.equal(water.charge, 0);
assert.ok(Math.abs(mass('D2O') - (2 * 2.01410 + 15.999)) < 1e-9);
assert.ok(Math.abs(mass('T2O') - (2 * 3.01605 + 15.999)) < 1e-9);
assert.ok(Math.abs(mass('D2O') - 20.03) < 0.01);

const ac = parseFormulaStrict('AcOH');
assert.equal(ac.ok, true);
assert.equal(ac.counts.Ac, 1);
assert.ok(ac.warnings.some((w) => w.code === 'actinium_acoh' && /actínio/.test(w.message_pt) && /actinium/.test(w.message_en)));

for (const input of ['Ca(OH', 'H2(O', '[H2O)', 'Ca()2', 'Ca(OH))2', 'H2O)', 'SO4)2']) {
  expectError(input, 'unbalanced_parentheses', /unbalanced parentheses/i, /Parênteses não balanceados/);
}
expectError('H-2', 'invalid_character', /invalid character '-'/i, /Caractere inválido '-'/);
expectError('H1.5', 'integer_subscript', /integer/i, /inteiro/);
expectError('H2O!', 'invalid_character', /invalid character '!'/i, /Caractere inválido '!'/);
expectError('CuSO4·0H2O', 'hydrate_count', /at least 1/i, /≥ 1/);
expectError('2H2O', 'leading_coefficient', /not part of the formula/i, /não são parte da fórmula/);
expectError('U238', 'mass_number', /mass number/i, /Número de massa/);
expectError('14CO2', 'mass_number', /mass number/i, /Número de massa/);
expectError('H2O, NaCl', 'one_formula', /one formula/i, /Uma fórmula por vez/);

assert.ok(Math.abs(mass('CuSO4.5H2O') - mass('CuSO4·5H2O')) < 1e-9);
assert.ok(Math.abs(mass('CuSO4.5H2O') - 249.68) < 0.01);
assert.ok(Math.abs(mass('H₂SO₄') - mass('H2SO4')) < 1e-9);

const fe = parseFormulaStrict('Fe3+');
assert.equal(fe.ok, true);
assert.equal(fe.charge, 3);
assert.deepEqual(fe.counts, { Fe: 1 });
assert.match(fe.ionLabel.pt, /Íon Fe³⁺/);
assert.match(fe.ionLabel.en, /Fe³⁺ ion/);
const sulfate = parseFormulaStrict('SO4 2-');
assert.equal(sulfate.charge, -2);
assert.deepEqual(sulfate.counts, { S: 1, O: 4 });
assert.equal(parseFormulaStrict('SO4^2-').charge, -2);

for (const input of ['CuSO₄·5H₂O', 'K₄[Fe(CN)₆]', 'Ca₃(PO₄)₂', 'Al₂(SO₄)₃']) {
  const parsed = parseFormulaStrict(input);
  assert.equal(parsed.ok, true, input);
  assert.equal(client.parseFormulaStrict(input).ok, true, input);
}
assert.ok(Math.abs(mass('Al2(SO4)3') - 342.132) < 1e-9);

assert.equal(looksIonic('H2+O2=H2O'), false);
assert.equal(looksIonic('Fe+O2->Fe2O3'), false);
assert.equal(looksIonic('H2 + O2 = H2O'), false);
assert.equal(looksIonic('Na+ + Cl- -> NaCl'), true);
assert.equal(balanceEquation('H2+O2=H2O').balanced, '2 H2 + O2 -> 2 H2O');
assert.equal(balanceEquation('Fe+O2->Fe2O3').balanced, '4 Fe + 3 O2 -> 2 Fe2O3');
assert.throws(() => balanceEquation('Na+ + Cl- -> NaCl'), new RegExp(IONIC_UNAVAILABLE));

const noDT = parseFormulaStrict('D2O', { allowIsotopes: false });
assert.equal(noDT.ok, false);
assert.equal(noDT.error.code, 'unknown_element');

const fixtures = JSON.parse(readFileSync(new URL('../fixtures/formulas-validas.json', import.meta.url), 'utf8'));
assert.ok(fixtures.formulas.length >= 60);
for (const row of fixtures.formulas) {
  const got = mass(row.formula);
  assert.ok(Math.abs(got - row.molarMass) <= 1e-9, `${row.formula} ${got} vs ${row.molarMass}`);
  const parsed = parseFormulaStrict(row.formula);
  const copy = client.parseFormulaStrict(row.formula);
  assert.equal(parsed.ok, true, row.formula);
  assert.deepEqual(copy.counts, parsed.counts);
  assert.equal(copy.charge, parsed.charge);
}

function mulberry32(seed) {
  let a = seed >>> 0;
  return function rand() {
    a = (a + 0x6D2B79F5) >>> 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
const alphabet = '()[]{}·.*^+-=0-9A-Za-z!';
const rand = mulberry32(20261026);
for (let i = 0; i < 2000; i += 1) {
  const n = 1 + Math.floor(rand() * 40);
  let sample = '';
  for (let k = 0; k < n; k += 1) sample += alphabet[Math.floor(rand() * alphabet.length)];
  const parsed = parseFormulaStrict(sample);
  assert.equal(typeof parsed.ok, 'boolean');
  if (!parsed.ok) assert.ok(parsed.error.message_pt && parsed.error.message_en);
}

const strictSrc = readFileSync(new URL('../netlify/lib/chemistry-formula-strict.mjs', import.meta.url));
const hash = createHash('sha256').update(strictSrc).digest('hex');
const built = readFileSync(new URL('../assets/chemistry/formula-parser.js', import.meta.url), 'utf8');
assert.match(built, new RegExp(`source-sha256: ${hash}`));
assert.deepEqual(client.ATOMIC_WEIGHTS, ATOMIC_WEIGHTS);

for (const file of ['calculators.html', 'calculators.pt.html']) {
  const html = readFileSync(new URL(`../${file}`, import.meta.url), 'utf8');
  assert.match(html, /formula-parser\.js/);
  assert.match(html, /fmt\(total, 5\)/);
  const block = html.match(/const AW = \{([\s\S]*?)\};/);
  assert.ok(block, file);
  const aw = Function(`return ({${block[1]}})`)();
  assert.deepEqual(aw, ATOMIC_WEIGHTS);
}

console.log('test-formula-parser: ok');
