import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const core = require('../assets/calc-core.js');

const dict = readFileSync(new URL('../tools/i18n-dict-source.js', import.meta.url), 'utf8');
const codes = [
  'igInvalidPositive', 'igUnknownUnit', 'dlInvalidPositive', 'dilutionNotDilution',
  'ucBelowAbsZero', 'ucNegativeNotAllowed', 'tmUnitLabel', 'tmUnitC', 'tmUnitK',
  'tmDhLooksLikeJoules', 'phAutoionNote', 'slightlyAcidic', 'slightlyBasic',
  'positiveNum', 'tmInvalid', 'ucInvalid'
];
for (const key of codes) {
  const hits = dict.match(new RegExp('\\b' + key + ':', 'g')) || [];
  assert.ok(hits.length >= 2, key + ' in EN and PT');
}

assert.equal(core.validateIdeal({ solve: 'V', P: 101325, V: 1, n: -2, T: 298, Pu: 'Pa', Vu: 'L', Tu: 'K' }).code, 'igInvalidPositive');
assert.equal(core.validateIdeal({ solve: 'V', P: 101325, V: 1, n: 0, T: 298, Pu: 'Pa', Vu: 'L', Tu: 'K' }).ok, false);
assert.equal(core.validateIdeal({ solve: 'V', P: 101325, V: 1, n: 1, T: -10, Pu: 'Pa', Vu: 'L', Tu: 'K' }).code, 'igInvalidPositive');
assert.equal(core.validateIdeal({ solve: 'P', P: 1, V: 1, n: 1, T: 0, Pu: 'Pa', Vu: 'm3', Tu: 'K' }).ok, false);
assert.equal(core.validateIdeal({ solve: 'n', P: 0, V: 1, n: 1, T: 300, Pu: 'Pa', Vu: 'L', Tu: 'K' }).ok, false);
assert.equal(core.validateIdeal({ solve: 'T', P: 1, V: -1, n: 1, T: 300, Pu: 'Pa', Vu: 'L', Tu: 'K' }).ok, false);
assert.equal(core.validateIdeal({ solve: 'P', P: 1, V: 1, n: 1, T: 300, Pu: 'bar', Vu: 'L', Tu: 'K' }).code, 'igUnknownUnit');
assert.equal(core.toPascals(1, 'bar'), null);
assert.equal(core.toM3(1, 'gal'), null);
assert.equal(core.toK(1, 'R'), null);

const ideal = core.validateIdeal({ solve: 'P', P: 1, V: 10, n: 2.5, T: 350, Pu: 'atm', Vu: 'L', Tu: 'K' });
assert.equal(ideal.ok, true);
const pAtm = core.fromPascals(2.5 * core.R_IDEAL * 350 / core.toM3(10, 'L'), 'atm');
assert.ok(Math.abs(pAtm - 7.18) < 0.005, pAtm);

assert.equal(core.validateDilution({ solve: 'V2', C1: -1, V1: 25, C2: 0.1, V2: NaN }).code, 'dlInvalidPositive');
assert.equal(core.validateDilution({ solve: 'V2', C1: 0, V1: 25, C2: 0.1, V2: NaN }).ok, false);
const backward = core.validateDilution({ solve: 'V2', C1: 1, V1: 25, C2: 5, V2: 5, phase: 'result' });
assert.equal(backward.ok, false);
assert.equal(backward.code, 'dilutionNotDilution');
assert.equal(core.validateDilution({ solve: 'V2', C1: 1, V1: 25, C2: 0.1, V2: 250, phase: 'result' }).ok, true);

assert.equal(core.validateUnitConversion({ cat: 'temperature', value: -300, from: '°C', to: 'K' }).code, 'ucBelowAbsZero');
assert.equal(core.convertUnit({ cat: 'pressure', value: 1, from: 'atm', to: 'Pa' }).value, 101325);
assert.equal(core.formatUnit(101325), '101325');
assert.equal(core.formatUnit(101325).includes('e'), false);
assert.equal(core.validateUnitConversion({ cat: 'mass', value: -1, from: 'g', to: 'kg' }).code, 'ucNegativeNotAllowed');
assert.equal(core.validateUnitConversion({ cat: 'volume', value: -2, from: 'L', to: 'mL' }).ok, false);
assert.equal(core.validateUnitConversion({ cat: 'amount', value: -1, from: 'mol', to: 'mmol' }).ok, false);
assert.equal(core.validateUnitConversion({ cat: 'concentration', value: -1, from: 'M', to: 'mM' }).ok, false);
assert.equal(core.validateUnitConversion({ cat: 'pressure', value: -1, from: 'Pa', to: 'atm' }).ok, false);
assert.equal(core.validateUnitConversion({ cat: 'energy', value: -92, from: 'kJ', to: 'J' }).ok, true);

const cold = core.validateThermo({ dh: -92, ds: -199, T: -300, TUnit: 'C' });
assert.equal(cold.code, 'ucBelowAbsZero');
const kelvin = core.validateThermo({ dh: -92, ds: -199, T: 298, TUnit: 'K' });
assert.equal(kelvin.ok, true);
assert.equal(kelvin.warnings.length, 0);
const joules = core.validateThermo({ dh: -92000, ds: -199, T: 25, TUnit: 'C' });
assert.equal(joules.ok, true);
assert.ok(joules.warnings.includes('tmDhLooksLikeJoules'));
assert.equal(core.validateThermo({ dh: -92, ds: -199, T: 0, TUnit: 'K' }).ok, false);

const strong = core.computePH({ mode: 'H', value: 0.01 });
assert.ok(Math.abs(strong.pH - 2) < 0.005, strong.pH);
const dilute = core.computePH({ mode: 'H', value: 1e-8 });
assert.ok(dilute.pH > 6.97 && dilute.pH < 6.99, dilute.pH);
assert.equal(dilute.autoion, true);
const one = core.computePH({ mode: 'H', value: 1 });
assert.ok(Math.abs(one.pH - 0) < 0.005, one.pH);
const base = core.computePH({ mode: 'OH', value: 1e-8 });
assert.ok(base.pH > 7.01 && base.pH < 7.03, base.pH);
assert.equal(core.classifyPH(6.9).key, 'slightlyAcidic');
assert.notEqual(core.classifyPH(6.9).key, 'neutral');
assert.equal(core.classifyPH(7).key, 'neutral');
assert.equal(core.classifyPH(6.995).key, 'neutral');
assert.notEqual(core.classifyPH(6.99).key, 'neutral');
assert.equal(core.classifyPH(7.4).key, 'slightlyBasic');
const direct = core.computePH({ mode: 'pH', value: 6.9 });
assert.ok(Math.abs(direct.pOH - (14 - 6.9)) < 1e-9);
assert.equal(direct.autoion, false);

for (const file of ['calculators.html', 'calculators.pt.html']) {
  const html = readFileSync(new URL('../' + file, import.meta.url), 'utf8');
  assert.match(html, /assets\/calc-core\.js/);
  assert.match(html, /AtomurusCalcCore/);
  for (const name of ['validateIdeal', 'validateDilution', 'convertUnit', 'validateThermo', 'computePH', 'classifyPH']) {
    assert.match(html, new RegExp(name), file + ' ' + name);
  }
  assert.match(html, /id="tm-t-unit"/);
  assert.doesNotMatch(html, /function toPascals[\s\S]{0,220}return v;/);
  assert.doesNotMatch(html, /function toM3[\s\S]{0,180}return v;/);
  assert.doesNotMatch(html, /function toK[\s\S]{0,180}return v;/);
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
const rand = mulberry32(20261026);
const solves = ['P', 'V', 'n', 'T'];
const cats = Object.keys(core.UNIT_CATEGORIES);
for (let i = 0; i < 2000; i += 1) {
  const n = (rand() - 0.5) * 1e6;
  const ideal = core.validateIdeal({
    solve: solves[i % 4],
    P: n, V: Math.abs(n) + 1, n: 1, T: 300,
    Pu: i % 17 === 0 ? 'bar' : 'Pa',
    Vu: 'L',
    Tu: 'K',
    resultK: i % 19 === 0 ? -5 : null
  });
  assert.equal(typeof ideal.ok, 'boolean');
  const cat = cats[i % cats.length];
  const conv = core.convertUnit({ cat: cat, value: n, from: 'g', to: 'kg' });
  assert.equal(typeof conv.ok, 'boolean');
  if (conv.ok) assert.equal(Number.isFinite(conv.value), true);
  const ph = core.computePH({ mode: i % 2 ? 'H' : 'pH', value: n });
  assert.equal(typeof ph.ok, 'boolean');
  if (ph.ok) {
    assert.equal(Number.isFinite(ph.pH), true);
    if (i % 2 && n > 0) assert.equal(ph.H > 0, true);
  }
  const cls = core.classifyPH(n);
  assert.ok(cls.key);
}

console.log('test-calc-validation: ok');
console.log('H 1e-8', dilute.pH.toFixed(4), 'OH 1e-8', base.pH.toFixed(4), 'P atm', pAtm.toFixed(4));
