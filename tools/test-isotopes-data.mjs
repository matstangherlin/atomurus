// isotopes-data.js — schema, coherence and the stability rules of prompt 25.
// Loads the file in a vm with a fake window, no dependencies.
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const SRC = fs.readFileSync(path.join(ROOT, 'isotopes-data.js'), 'utf8');
const sandbox = { window: {} };
vm.createContext(sandbox);
vm.runInContext(SRC, sandbox);
const W = sandbox.window;
const ISOTOPES = W.ISOTOPES;
const YEAR = 3.15576e7;

const DECAY = new Set(['β-', 'β+', 'α', 'EC', 'γ', '2β-', '2β+', '2EC', 'SF', 'IT', 'p', 'n']);
const STAB = new Set(['stable', 'obs-stable', 'radioactive']);
const HLKIND = new Set(['measured', 'lower-limit', 'estimated']);
const name = (z, iso) => `Z=${z} A=${iso.a}${iso.m ? 'm' : ''}`;

// The header no longer claims memory as a source, and says what is pending.
const header = SRC.slice(0, SRC.indexOf('(function'));
assert.doesNotMatch(header, /training-data/i);
assert.match(header, /NUBASE2020/);
assert.match(header, /PENDING/);

assert.equal(Object.keys(ISOTOPES).length, 118, 'one entry per element');
for (const [z, list] of Object.entries(ISOTOPES)) {
  assert.ok(Array.isArray(list) && list.length, `Z=${z} has isotopes`);
  let last = -1;
  for (const iso of list) {
    const id = name(z, iso);
    assert.ok(Number.isInteger(iso.a) && iso.a >= Number(z), `${id}: mass number ≥ Z`);
    assert.ok(iso.a >= last, `${id}: isotopes sorted by mass number`);
    last = iso.a;
    assert.ok(iso.ab === null || (iso.ab > 0 && iso.ab <= 1), `${id}: abundance is null or a fraction`);
    assert.ok(iso.hl === null || iso.hl > 0, `${id}: half-life is null or positive seconds`);
    assert.equal(typeof iso.hlf, 'string', `${id}: hlf`);
    assert.ok(Array.isArray(iso.dec) && iso.dec.every((d) => DECAY.has(d)), `${id}: decay modes`);
    assert.equal(typeof iso.prim, 'boolean', `${id}: prim`);
    assert.ok(STAB.has(iso.stab), `${id}: stab`);
    if (iso.hlKind !== undefined) assert.ok(HLKIND.has(iso.hlKind), `${id}: hlKind`);
    if (iso.hl != null) assert.ok(iso.hlKind, `${id}: a half-life says what kind it is`);
    if (iso.verified !== undefined) assert.equal(iso.verified, false, `${id}: verified is only written as false`);
    if (iso.ab != null) assert.equal(iso.prim, true, `${id}: naturally abundant ⇒ primordial`);
    // Stability rules.
    if (iso.dec.length && iso.hl != null) assert.notEqual(iso.stab, 'stable', `${id}: decays, so not "stable"`);
    if (iso.hl == null && iso.dec.length) assert.equal(iso.stab, 'obs-stable', `${id}: decay mode without half-life ⇒ obs-stable`);
    if (iso.stab === 'stable') assert.ok(iso.hl == null && !iso.dec.length, `${id}: "stable" has no half-life and no decay`);
    if (iso.stab === 'radioactive') assert.ok(iso.hl != null && iso.hl / YEAR <= W.OBS_STABLE_MIN_YEARS, `${id}: radioactive below the obs-stable threshold`);
    if (iso.hl != null && iso.hl / YEAR > W.OBS_STABLE_MIN_YEARS) assert.equal(iso.stab, 'obs-stable', `${id}: beyond 10^18 y ⇒ obs-stable`);
  }
  // Natural abundances add up to 1 (± 0.001) for every element that has any.
  const natural = list.filter((i) => i.ab != null);
  if (natural.length) {
    const sum = natural.reduce((s, i) => s + i.ab, 0);
    assert.ok(Math.abs(sum - 1) <= 0.001, `Z=${z}: abundances add up to ${sum}`);
  }
}

// The audit cases.
const find = (z, a, m = false) => ISOTOPES[z].find((i) => i.a === a && !!i.m === m);
for (const [z, a, m] of [[20, 48], [36, 78], [63, 151], [73, 180, true]]) {
  const iso = find(z, a, m);
  assert.ok(iso, `Z=${z} A=${a} present`);
  assert.equal(iso.stab, 'obs-stable', `Z=${z} A=${a}${m ? 'm' : ''} is observationally stable`);
}
assert.equal(find(73, 180, true).hlKind, 'lower-limit');
for (const [z, a, dec] of [[6, 11, 'β+'], [82, 210, 'β-']]) {
  const iso = find(z, a);
  assert.ok(iso, `Z=${z} A=${a} added`);
  assert.equal(iso.stab, 'radioactive');
  assert.equal(iso.verified, false, 'added without the source check, so flagged');
  assert.ok(iso.dec.includes(dec));
}
// Already obs-stable by the 10^18 y rule (decay seen, half-life known).
assert.equal(find(83, 209).stab, 'obs-stable');
assert.equal(find(52, 128).stab, 'obs-stable');
assert.equal(find(19, 40).stab, 'radioactive');

// Every isotope that is still flagged is listed for review.
const pending = fs.readFileSync(path.join(ROOT, 'docs/data/isotopos-pendencias.md'), 'utf8');
for (const [z, list] of Object.entries(ISOTOPES)) {
  for (const iso of list.filter((i) => i.verified === false)) {
    assert.ok(pending.includes(`Z=${z} A=${iso.a}${iso.m ? 'm' : ''}`), `${name(z, iso)} is in docs/data/isotopos-pendencias.md`);
  }
}

// Sources and the teaching switch.
assert.equal(W.ISOTOPE_SOURCES.reviewed, false);
assert.match(W.ISOTOPE_SOURCES.halfLife, /NUBASE2020/);
assert.match(W.ISOTOPE_SOURCES.abundance, /CIAAW/);
assert.equal(W.DEFAULT_SHOW_OBS_STABLE_AS_STABLE, false);
assert.equal(W.isotopeStability({ hl: null, dec: [] }), 'stable');
assert.equal(W.isotopeStability({ hl: null, dec: ['α'] }), 'obs-stable');
assert.equal(W.isotopeStability({ hl: 1e19 * YEAR, dec: ['α'] }), 'obs-stable');
assert.equal(W.isotopeStability({ hl: 10, dec: ['β-'] }), 'radioactive');

// Average atomic mass: with whole mass numbers until AME2020 masses are in.
assert.equal(W.AVERAGE_MASS_METHOD, 'mass-number');
assert.ok(Math.abs(W.averageAtomicMass(17) - 35.4848) < 1e-4, 'Cl with mass numbers: 0.7576·35 + 0.2424·37');
assert.equal(W.averageAtomicMass(9), 19, 'one natural isotope');
assert.equal(W.averageAtomicMass(43), null, 'Tc has no natural isotope');
assert.deepEqual(JSON.parse(JSON.stringify(W.averageAtomicMassTerms(17))), [
  { a: 35, m: false, ab: 0.7576, mass: 35 },
  { a: 37, m: false, ab: 0.2424, mass: 37 }
]);

console.log('test-isotopes-data: ok');
