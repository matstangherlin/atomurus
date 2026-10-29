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
  // Prompt 30: the gas law, dilution and molar mass are solved in calc-core
  // (which validates first), so the page calls the compute* engines.
  for (const name of ['computeIdealGas', 'computeDilution', 'computeMolarMass', 'convertUnit', 'validateThermo', 'computePH', 'classifyPH']) {
    assert.match(html, new RegExp(name), file + ' ' + name);
  }
  assert.match(html, /id="tm-t-unit"/);
  assert.doesNotMatch(html, /function toPascals[\s\S]{0,220}return v;/);
  assert.doesNotMatch(html, /function toM3[\s\S]{0,180}return v;/);
  assert.doesNotMatch(html, /function toK[\s\S]{0,180}return v;/);
}

// The compute* engines keep the validators' answers.
assert.equal(core.computeIdealGas({ solve: 'V', P: 101325, V: 1, n: -2, T: 298, Pu: 'Pa', Vu: 'L', Tu: 'K' }).code, 'igInvalidPositive');
assert.equal(core.computeIdealGas({ solve: 'P', P: 1, V: 1, n: 1, T: 300, Pu: 'bar', Vu: 'L', Tu: 'K' }).code, 'igUnknownUnit');
assert.equal(core.computeDilution({ solve: 'C2', C1: 1, V1: 10, V2: 5 }).code, 'dilutionNotDilution');
assert.equal(core.computeDilution({ solve: 'V2', C1: 0, V1: 10, C2: 0.5 }).code, 'dlInvalidPositive');

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

function extractFunction(html, name) {
  const start = html.indexOf('function ' + name + '(');
  assert.ok(start >= 0, name);
  let depth = 0;
  let opened = false;
  for (let i = start; i < html.length; i += 1) {
    if (html[i] === '{') {
      depth += 1;
      opened = true;
    } else if (html[i] === '}') {
      depth -= 1;
      if (opened && depth === 0) return html.slice(start, i + 1);
    }
  }
  throw new Error('unclosed ' + name);
}

const calcEn = readFileSync(new URL('../calculators.html', import.meta.url), 'utf8');
const calcPt = readFileSync(new URL('../calculators.pt.html', import.meta.url), 'utf8');
const formatEn = extractFunction(calcEn, 'formatNumber');
const formatPt = extractFunction(calcPt, 'formatNumber');
assert.equal(formatEn, formatPt);
const vm = await import('node:vm');
const sandbox = { Intl, Number, Math, isFinite, String };
vm.createContext(sandbox);
vm.runInContext(formatEn + '\nthis.formatNumber = formatNumber;', sandbox);
assert.equal(sandbox.formatNumber(98.0678, { sig: 4, lang: 'pt' }), '98,07');
assert.equal(sandbox.formatNumber(98.0678, { sig: 4, lang: 'en' }), '98.07');
assert.equal(sandbox.formatNumber(0.0821, { sig: 4, lang: 'pt' }), '0,0821');
assert.equal(sandbox.formatNumber(101325, { sig: 4, lang: 'pt' }), '1,013×10⁵');
assert.equal(sandbox.formatNumber(101325, { sig: 4, lang: 'en' }), '1.013e+5');
assert.equal(sandbox.formatNumber(12345, { sig: 5, lang: 'pt' }), '12.345');
assert.equal(sandbox.formatNumber(12345, { sig: 5, lang: 'en' }), '12345');
assert.equal(sandbox.formatNumber(-0.0001234, { sig: 4, lang: 'pt' }), '-1,234×10⁻⁴');

// ── Weak acids, weak bases and buffers (M06) ──────────────────────────────
{
  const near = (got, want, tol, label) => assert.ok(Math.abs(got - want) <= tol, `${label}: ${got} vs ${want} ± ${tol}`);
  const acetic = core.ACID_BASE_CONSTANTS.find((row) => row.id === 'acetic');
  const ammonia = core.ACID_BASE_CONSTANTS.find((row) => row.id === 'ammonia');
  assert.ok(acetic && ammonia);
  core.ACID_BASE_CONSTANTS.forEach((row) => {
    assert.ok(row.source && row.T === 25 && row.name.pt && row.name.en, row.id + ' carries a source, 25 °C and both names');
    assert.ok(row.kind === 'acid' ? row.pKa.length >= 1 : typeof row.pKb === 'number', row.id);
  });
  assert.ok(core.ACID_BASE_CONSTANTS.length <= 15);

  const weakAcid = core.computeWeakAcidPH({ C: 0.100, pKa: acetic.pKa[0] });
  near(weakAcid.pH, 2.88, 0.01, 'acetic acid 0.100 mol/L');
  near(core.computeWeakAcidPH({ C: 0.100, Ka: 1.8e-5 }).pH, 2.88, 0.01, 'acetic acid with Ka 1.8e-5');
  assert.ok(weakAcid.alpha > 0.01 && weakAcid.alpha < 0.02, 'about 1.3% dissociated');
  assert.ok(weakAcid.shortcutOff < 0.01, 'the √(Ka·C) shortcut is close here, and reported');

  const weakBase = core.computeWeakBasePH({ C: 0.100, pKb: ammonia.pKb });
  near(weakBase.pH, 11.13, 0.01, 'ammonia 0.100 mol/L');
  near(core.computeWeakBasePH({ C: 0.100, Kb: 1.8e-5 }).pH, 11.13, 0.01, 'ammonia with Kb 1.8e-5');

  const buffer = core.computeBufferPH({ acid: 0.10, base: 0.10, pKa: acetic.pKa[0] });
  near(buffer.pH, acetic.pKa[0], 0.02, 'acetic/acetate 0.10/0.10');
  assert.deepEqual(buffer.warnings, []);
  near(buffer.exactPH, buffer.pH, 0.02, 'the charge balance agrees');
  assert.ok(buffer.beta > 0.1 && buffer.beta < 0.13, 'buffer capacity β ≈ 0.115 mol/(L·pH)');
  assert.ok(core.computeBufferPH({ acid: 0.10, base: 2.0, pKa: 4.756 }).warnings.includes('bufferRange'), 'ratio 20 is outside 0.1–10');
  assert.ok(core.computeBufferPH({ acid: 0.10, base: 0.005, pKa: 4.756 }).warnings.includes('bufferRange'), 'ratio 0.05 is outside 0.1–10');
  const thin = core.computeBufferPH({ acid: 1e-5, base: 1e-5, pKa: 4.756 });
  assert.ok(thin.warnings.includes('bufferDilute') && thin.warnings.includes('bufferApprox'), 'a very dilute buffer is flagged');
  assert.ok(thin.exactPH > thin.pH + 0.3, 'and the exact pH says why');

  // Very dilute weak acid: water's own H⁺ matters, so the pH is below 7 but not 7.
  const dilute = core.computeWeakAcidPH({ C: 1e-7, pKa: 4.756 });
  assert.ok(dilute.pH > 6.5 && dilute.pH < 7, `1e-7 mol/L acetic acid: pH ${dilute.pH}`);
  near(dilute.pH, 6.79, 0.01, '1e-7 mol/L acetic acid');
  assert.ok(dilute.warnings.includes('autoion'));

  // Polyprotic acids use only the first pKa here, and say so.
  assert.ok(core.computeWeakAcidPH({ C: 0.1, pKa: 2.16, polyprotic: true }).warnings.includes('polyproticApprox'));

  // Validation.
  assert.equal(core.computeWeakAcidPH({ C: 0, pKa: 4.76 }).ok, false);
  assert.equal(core.computeWeakAcidPH({ C: -1, pKa: 4.76 }).field, 'C');
  assert.equal(core.computeWeakAcidPH({ C: 0.1 }).field, 'Ka');
  assert.equal(core.computeWeakAcidPH({ C: 0.1, Ka: -1 }).field, 'Ka');
  assert.equal(core.computeWeakBasePH({ C: 0.1, Kb: 0 }).ok, false);
  assert.equal(core.computeBufferPH({ acid: 0.1, base: 0, pKa: 4.76 }).field, 'base');
  assert.equal(core.computeBufferPH({ acid: 0.1, base: 0.1 }).field, 'Ka');
}

console.log('test-calc-validation: ok');
console.log('H 1e-8', dilute.pH.toFixed(4), 'OH 1e-8', base.pH.toFixed(4), 'P atm', pAtm.toFixed(4));
