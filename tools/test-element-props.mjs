// Periodic-table property scales: units, sources and predicted values.
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import fs from 'node:fs';
import vm from 'node:vm';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const require = createRequire(import.meta.url);
const P = require(path.join(ROOT, 'assets/chem/element-props.js'));

const ctx = {};
vm.createContext(ctx);
vm.runInContext(fs.readFileSync(path.join(ROOT, 'elements-data.js'), 'utf8') + ';this.E=ELEMENTS;this.g1=getExtra;this.g2=getExtra2;this.gi=getIonization;', ctx);
function raw(z) {
  const el = ctx.E.find((e) => e.z === z);
  return { en: el.en, mass: el.mass, density: ctx.g2(z).density, melt: ctx.g1(z).melt, boil: ctx.g1(z).boil, ionization: ctx.gi(z) };
}
const val = (prop, z) => P.value(prop, z, raw(z));

// covalent radii (Cordero 2008): H … Cm
assert.equal(P.COVALENT.length - 1, 96);
assert.equal(P.COVALENT[1], 31);
assert.equal(P.COVALENT[6], 76);
assert.equal(P.COVALENT[17], 102);
assert.equal(P.COVALENT[55], 244);
assert.equal(P.COVALENT[79], 136);
assert.equal(val('covalent', 97), null);
// radius grows down a group and shrinks across a period
assert.ok(val('covalent', 3) < val('covalent', 11) && val('covalent', 11) < val('covalent', 19));
assert.ok(val('covalent', 11) > val('covalent', 17));

// density: one unit (g/cm³) for every element; gases came in g/L
for (const z of [1, 2, 7, 8, 9, 10, 17, 18, 36, 54, 86]) {
  const d = val('density', z);
  assert.ok(d > 0 && d < 0.02, `gas ${z}: ${d}`);
}
near(val('density', 86), 0.00973, 1e-6, 'Rn');
near(val('density', 1), 0.0000899, 1e-9, 'H');
near(val('density', 76), 22.59, 0.1, 'Os');
assert.ok(val('density', 3) > 0.5 && val('density', 3) < 0.6, 'Li');
near(val('density', 112), 23.7, 0.01, 'Cn (from g/L)');
for (let z = 1; z <= 118; z++) {
  const d = val('density', z);
  if (d != null) assert.ok(d < 45, `density ${z} = ${d}`);
}
// measured range excludes predictions
assert.ok(P.predicted('density', 108) && !P.predicted('density', 76));
assert.ok(P.predicted('melt', 100) && P.predicted('melt', 85) && !P.predicted('melt', 26));

// temperatures in °C, signs kept
assert.equal(val('melt', 1), -259.16);
assert.equal(val('boil', 26), 2861);
// ionization: measured to Lr, nothing after
assert.equal(val('ionization', 1), 1312.0);
assert.equal(val('ionization', 104), null);
// electron affinity: halogens highest, Cl above F; no stable anion → 0
assert.ok(val('affinity', 17) > val('affinity', 9));
assert.equal(val('affinity', 10), 0);
assert.equal(val('affinity', 22), null);
assert.equal(P.format('affinity', 0, 'pt', 10), '≤ 0');
// formatting
assert.equal(P.format('density', 0.00973, 'pt', 86), '9,7·10⁻³');
assert.equal(P.format('density', 23.7, 'en', 112), '≈23.7');
assert.equal(P.format('electronegativity', 2.2, 'pt', 1), '2,20');
assert.equal(P.format('ionization', 1312, 'en', 1), '1312');
assert.equal(P.format('melt', -259.16, 'pt', 1), '-259');
// every property has a unit field, label and source in both languages
Object.keys(P.PROPS).forEach((k) => {
  const p = P.PROPS[k];
  assert.ok(p.label.en && p.label.pt && p.source.en && p.source.pt, k);
});

function near(x, y, tol, msg) { assert.ok(Math.abs(x - y) <= tol, `${msg}: ${x} vs ${y}`); }
console.log('element props ok');
