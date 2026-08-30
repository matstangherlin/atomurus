import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import {
  kaFromPka,
  pkaFromKa,
  solveAcidBase,
  solveMonoproticQuadratic,
  KW
} from '../netlify/lib/chemistry-acid-base.mjs';
import { accessForUser } from '../netlify/lib/plan-access.mjs';
import { nearlyEqual } from '../netlify/lib/chemistry-numerics.mjs';

const src = readFileSync(new URL('../netlify/lib/chemistry-acid-base.mjs', import.meta.url), 'utf8');
assert.doesNotMatch(src, /\beval\s*\(|new\s+Function/);
assert.match(src, /Kw = 1\.0 × 10⁻¹⁴ at 25 °C/);

assert.equal(pkaFromKa(1e-5), 5);
assert.ok(nearlyEqual(kaFromPka(5), 1e-5, 1e-12, 1e-20));

const C = 0.1;
const Ka = 1.8e-5;
const xExact = solveMonoproticQuadratic(C, Ka);
const independent = (-Ka + Math.sqrt(Ka * Ka + 4 * Ka * C)) / 2;
assert.ok(nearlyEqual(xExact, independent, 1e-12, 1e-18));
assert.ok(xExact >= 0 && xExact <= C);

const acid = solveAcidBase({ mode: 'weak-acid', C, Ka });
assert.ok(nearlyEqual(acid.hydrogen, acid.acetate, 1e-12, 1e-18));
assert.ok(nearlyEqual(acid.HA + acid.acetate, C, 1e-8, 1e-12));
assert.ok(acid.pH > 0 && acid.pH < 7);
assert.ok(acid.percentIonization > 0);
assert.match(acid.fivePercent.note, /exact quadratic/);
assert.doesNotMatch(JSON.stringify(acid), /approximation is exact/);

const base = solveAcidBase({ mode: 'weak-base', C: 0.1, Kb: 1.8e-5 });
assert.ok(nearlyEqual(base.hydroxide, base.BH, 1e-12, 1e-18));
assert.ok(nearlyEqual(base.B + base.BH, 0.1, 1e-8, 1e-12));
assert.ok(base.pH > 7);

const equalBuffer = solveAcidBase({
  mode: 'buffer',
  type: 'acid',
  pKa: 4.76,
  acid: 0.1,
  base: 0.1
});
assert.ok(nearlyEqual(equalBuffer.pH, 4.76, 1e-10, 1e-12));

const ratio10 = solveAcidBase({
  mode: 'buffer',
  type: 'acid',
  pKa: 4.76,
  acid: 0.01,
  base: 0.1
});
assert.ok(nearlyEqual(ratio10.pH, 5.76, 1e-8, 1e-10));

assert.throws(
  () => solveAcidBase({ mode: 'buffer', type: 'acid', pKa: 4.76, acid: 0.1, base: 0 }),
  /conjugate species is zero|invalid_buffer/
);

const extreme = solveAcidBase({
  mode: 'buffer',
  type: 'acid',
  pKa: 4.76,
  acid: 0.001,
  base: 0.2
});
assert.ok(extreme.warnings.some((w) => /outside the usual effective buffer range/i.test(w)));

const moles = solveAcidBase({
  mode: 'buffer',
  type: 'acid',
  pKa: 4.76,
  inputMode: 'moles',
  acidMoles: 0.05,
  baseMoles: 0.05,
  volume: 0.5
});
assert.ok(nearlyEqual(moles.pH, 4.76, 1e-10, 1e-12));

const constants = solveAcidBase({ mode: 'constants', Ka: 1e-5 });
assert.equal(constants.pKa, 5);

const conjugate = solveAcidBase({ mode: 'constants', action: 'conjugate', Ka: 1e-5 });
assert.ok(nearlyEqual(conjugate.Ka * conjugate.Kb, KW, 1e-8, 1e-20));

assert.equal(KW, 1e-14);

const paid = accessForUser({
  createdAt: new Date(Date.now() - 40 * 24 * 3600 * 1000).toISOString(),
  email: 'pro@atomurus.com',
  appMetadata: { atomurus_plan: 'paid', subscription_status: 'active' }
});
assert.equal(paid.features.acidBaseWorkbench, true);
assert.equal(paid.features.weakAcidSolver, true);
assert.equal(paid.features.bufferSolver, true);
assert.equal(paid.features.acidBaseConstants, true);

const free = accessForUser({
  createdAt: new Date(Date.now() - 40 * 24 * 3600 * 1000).toISOString(),
  email: 'free@atomurus.com'
});
assert.equal(free.features.acidBaseWorkbench, false);
assert.equal(free.features.phCalculator, true);

console.log('test-acid-base: ok');
