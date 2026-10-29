// Prompt 33: the worked examples of the solutions, acid–base and equilibrium
// articles and trails, recomputed here on their own — own arithmetic, the
// masses of elements-data.js, the pKa of calc-core's sourced table and the
// scientific calculator (sci-core) — and the numbers the prose quotes.
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';
import { CALC } from './build-trails.mjs';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const read = (rel) => fs.readFileSync(path.join(ROOT, rel), 'utf8');
const require = createRequire(import.meta.url);
const core = require('../assets/calc-core.js');
const sci = require('../assets/sci-core.js');
const ev = (expr) => sci.evaluateScientificExpression(expr).value;

const el = vm.createContext({ window: {} });
vm.runInContext(read('elements-data.js') + ';this.__E = { ELEMENTS };', el);
const MASS = Object.fromEntries(el.__E.ELEMENTS.map((e) => [e.sym, Number(e.mass)]));
const molar = (atoms) => Object.entries(atoms).reduce((s, [sym, n]) => s + MASS[sym] * n, 0);

const KW = 1e-14; // 25 °C
assert.equal(core.KW, KW, 'calc-core works at 25 °C (Kw = 1.0 × 10⁻¹⁴)');
const acetic = core.ACID_BASE_CONSTANTS.find((a) => a.id === 'acetic');
assert.deepEqual(acetic.pKa, [4.756], 'acetic acid pKa from the sourced table');
assert.match(acetic.source, /CRC Handbook/, 'with its source');
const pKa = 4.756;
const Ka = 10 ** -pKa;

const num = (n, d, lang) => { const s = n.toFixed(d); return lang === 'pt' ? s.replace('.', ',') : s; };
const sig = (n, d, lang) => { const s = String(Number(n.toPrecision(d))); return lang === 'pt' ? s.replace('.', ',') : s; };
const sciText = (n, d, lang) => {
  const [m, e] = n.toExponential(d).split('e');
  const sup = '⁰¹²³⁴⁵⁶⁷⁸⁹';
  return (lang === 'pt' ? m.replace('.', ',') : m) + ' × 10' + (Number(e) < 0 ? '⁻' : '') + String(Math.abs(Number(e))).split('').map((c) => sup[c]).join('');
};
const all = (r) => r.answer + ' ' + r.steps.map((s) => s.text + ' ' + s.expr).join(' ');
/* [H⁺] of a weak acid from the quadratic of the ICE table (water's ions left out). */
const iceX = (C, K) => (-K + Math.sqrt(K * K + 4 * K * C)) / 2;
/* Exact buffer pH, own bisection on h + Cb = (Ca + Cb)·Ka/(Ka + h) + Kw/h. */
function bufferExact(Ca, Cb, K) {
  let lo = -14;
  let hi = 0;
  for (let i = 0; i < 200; i += 1) {
    const mid = (lo + hi) / 2;
    const h = 10 ** mid;
    if (h + Cb - (Ca + Cb) * K / (K + h) - KW / h > 0) hi = mid; else lo = mid;
  }
  return -(lo + hi) / 2;
}

const xAcetic = iceX(0.1, Ka);
const pHAcetic = -Math.log10(xAcetic);
let checked = 0;
for (const lang of ['pt', 'en']) {
  const has = (id, text) => {
    assert.ok(all(CALC[id](lang)).includes(text), `${id} ${lang}: «${text}» in\n${all(CALC[id](lang))}`);
    checked += 1;
  };
  // Solutions
  has('sol-prep', 'm = ' + sig(0.1 * 0.25 * molar({ Na: 1, Cl: 1 }), 4, lang) + ' g');
  has('sol-conc', 'C = ' + sig(5.85 / molar({ Na: 1, Cl: 1 }) / 0.5, 4, lang) + ' mol/L');
  has('sol-dilute', 'V₁ = ' + sig(0.2 * 250 / 2, 4, lang) + ' mL');
  has('rev-naoh-mass', 'm = ' + sig(0.2 * 0.5 * molar({ Na: 1, O: 1, H: 1 }), 4, lang) + ' g');
  has('rev-dilute-c2', 'C₂ = ' + sig(1 * 10 / 100, 4, lang) + ' mol/L');
  // Strong acid and base: pH = −log₁₀ c, checked with the scientific calculator too.
  assert.equal(ev('pH(0.01)'), 2);
  has('ab-strong-acid', 'pH = ' + num(ev('pH(0.01)'), 2, lang));
  has('ab-strong-base', 'pH = ' + num(14 - ev('pOH(0.001)'), 2, lang));
  has('rev-ph-hcl', 'pH = ' + num(ev('pH(0.001)'), 2, lang));
  // Weak acid: Ka from the pKa, x from the quadratic.
  assert.ok(Math.abs(ev('10^(-4.756)') - Ka) < 1e-15, 'Ka = 10^(−pKa) with sci-core');
  has('ab-weak-acid', 'Ka = 10^(−' + num(pKa, 3, lang) + ') = ' + sciText(Ka, 3, lang));
  has('ab-weak-acid', 'x ≈ √(' + sciText(Ka, 3, lang) + ' × ' + num(0.1, 2, lang) + ') = ' + sciText(Math.sqrt(Ka * 0.1), 3, lang));
  has('ab-weak-acid', 'x = ' + sciText(xAcetic, 3, lang) + ' mol/L');
  has('ab-weak-acid', 'pH = ' + num(pHAcetic, 2, lang));
  has('ab-weak-acid', num(xAcetic / 0.1 * 100, 1, lang) + ' %');
  // Buffer: Henderson–Hasselbalch, and the exact balance agrees.
  const hh = ev('4.756 + log10(0.2/0.1)');
  assert.equal(num(hh, 2, 'en'), num(bufferExact(0.1, 0.2, Ka), 2, 'en'), 'Henderson–Hasselbalch holds for this buffer');
  has('ab-buffer', 'pH = ' + num(hh, 2, lang));
  has('ab-buffer', 'pH ' + num(bufferExact(0.1, 0.2, Ka), 2, lang));
  has('rev-buffer-ratio', '[A⁻]/[HA] = ' + sig(10 ** (5 - pKa), 4, lang));
  // Equilibrium: ICE table, Q against K, common ion.
  has('eq-ice', 'x = ' + sciText(xAcetic, 3, lang) + ' mol/L');
  has('eq-ice', '[CH₃COOH] = ' + sig(0.1 - xAcetic, 4, lang) + ' mol/L');
  const Q = (1e-3 * 1e-3) / 0.1;
  assert.ok(Q < Ka, 'the Q example is on the forward side');
  has('eq-q', 'Q = ' + sciText(Q, 1, lang) + ' < Ka = ' + sciText(Ka, 3, lang));
  assert.equal(CALC['eq-q'](lang).answer, 'Q < K');
  const hCommon = Ka * 0.1 / 0.1;
  has('eq-common-ion', 'pH = ' + num(-Math.log10(hCommon), 2, lang));
  has('eq-common-ion', sig(hCommon / 0.1 * 100, 2, lang) + ' %');
  assert.equal(num(-Math.log10(hCommon), 2, 'en'), num(bufferExact(0.1, 0.1, Ka), 2, 'en'), 'the common-ion pH is also the exact one');
}

// ── What the prose says ─────────────────────────────────────────────────────
const prose = (base, lang) => {
  const html = read(base + (lang === 'pt' ? '.pt.html' : '.html'));
  const body = html.slice(html.indexOf('id="art-body"'), html.indexOf('<section class="art-refs">'));
  return body.replace(/<!-- calc:([a-z0-9-]+) -->[\s\S]*?<!-- \/calc:\1 -->/g, ' ');
};
for (const lang of ['pt', 'en']) {
  const ab = prose('explore/acids-bases-and-ph', lang);
  // 0.10 mol/L HCl against 0.10 mol/L acetic acid: pH 1.00 and about 75 times fewer H⁺.
  assert.equal(core.computePH({ mode: 'H', value: 0.1 }).pH.toFixed(2), '1.00');
  assert.ok(ab.includes((lang === 'pt' ? 'teria pH ' : 'would have pH ') + num(1, 2, lang)), `acids ${lang}: HCl 0.10 mol/L`);
  const times = 10 ** (pHAcetic - 1);
  assert.equal(Math.round(times / 5) * 5, 75, `about 75 times fewer H⁺ (${times.toFixed(1)})`);
  assert.ok(ab.includes(lang === 'pt' ? 'cerca de 75 vezes menos' : 'about 75 times fewer'), `acids ${lang}: «75 times»`);
  assert.ok(ab.includes('pKa = ' + num(pKa, 3, lang)), `acids ${lang}: pKa as in the table`);
  assert.ok(ab.includes('1' + (lang === 'pt' ? ',' : '.') + '0 × 10⁻¹⁴'), `acids ${lang}: Kw at 25 °C`);
  assert.match(ab, /25 °C/);
  // pH 7 is neutral only at 25 °C: the misconception is there (prompts 09 and 33).
  assert.ok(ab.includes(lang === 'pt' ? '"pH 7 é sempre neutro"' : '"pH 7 is always neutral"'), `acids ${lang}: pH 7 misconception`);
  assert.ok(ab.includes(lang === 'pt' ? '"Ácido forte é ácido concentrado"' : '"A strong acid is a concentrated acid"'), `acids ${lang}: strong ≠ concentrated`);

  const eq = prose('explore/chemical-equilibrium', lang);
  assert.ok(eq.includes('= ' + sciText(Ka, 3, lang) + ' (25 °C)'), `equilibrium ${lang}: Ka`);
  assert.ok(eq.includes('pKa = ' + num(pKa, 3, lang)), `equilibrium ${lang}: pKa`);
  assert.ok(eq.includes(num(xAcetic / 0.1 * 100, 1, lang) + ' %'), `equilibrium ${lang}: 1.3 % ionized`);
  assert.ok(100 - xAcetic / 0.1 * 100 > 98 && eq.includes('98 %'), `equilibrium ${lang}: more than 98 % un-ionized`);
  for (const claim of lang === 'pt'
    ? ['"No equilíbrio as reações pararam"', '"Mudar uma concentração muda K"', '"Um catalisador desloca o equilíbrio para os produtos"']
    : ['"At equilibrium the reactions have stopped"', '"Changing a concentration changes K"', '"A catalyst shifts the equilibrium towards the products"']) {
    assert.ok(eq.includes(claim), `equilibrium ${lang}: ${claim}`);
  }

  const sol = prose('explore/solutions-and-concentration', lang);
  assert.ok(sol.includes(lang === 'pt' ? 'quatro vezes' : 'four times'), `solutions ${lang}: 2 L ÷ 0.5 L = 4`);
  assert.equal(2 / 0.5, 4);
}

console.log(`test-trail-examples: ok (${checked} values checked in PT and EN)`);
