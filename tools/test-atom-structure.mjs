// Atom structure for the atomic-model viewers: configurations agree with the
// element pages for all 118 elements, ions follow the textbook rules, and the
// orbital sampler has the right shapes.
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { createRequire } from 'node:module';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const require = createRequire(import.meta.url);
const A = require(path.join(ROOT, 'assets/chem/atom-structure.js'));

// 1. ground states == elements-data.js (econfig and shells), Z = 1…118
const src = fs.readFileSync(path.join(ROOT, 'elements-data.js'), 'utf8');
const re = /(\d+):\s*\{\s*econfig:"([^"]*)",\s*shells:\[([^\]]*)\]/g;
let m, checked = 0;
while ((m = re.exec(src))) {
  const z = Number(m[1]);
  const gs = A.groundState(z);
  assert.equal(gs.reduce((a, s) => a + s.e, 0), z, `Z=${z}: electron count`);
  assert.deepEqual(A.shells(gs), m[3].split(',').map(Number), `Z=${z}: shells`);
  assert.equal(A.notation(gs, true), m[2].replace(/\s+/g, ' ').trim(), `Z=${z}: configuration`);
  checked++;
}
assert.equal(checked, 118, 'all 118 elements checked');

// 2. ions: cations lose the highest-n electrons first, anions fill in order
const conf = (z, q) => A.notation(A.configuration(z, q), true);
assert.equal(conf(26, 2), '[Ar] 3d⁶', 'Fe²⁺ loses 4s first');
assert.equal(conf(26, 3), '[Ar] 3d⁵', 'Fe³⁺');
assert.equal(conf(29, 1), '[Ar] 3d¹⁰', 'Cu⁺');
assert.equal(conf(30, 2), '[Ar] 3d¹⁰', 'Zn²⁺');
assert.equal(conf(17, -1), '[Ne] 3s² 3p⁶', 'Cl⁻');
assert.deepEqual(A.shells(A.configuration(8, -2)), [2, 8], 'O²⁻ is isoelectronic with Ne');
assert.deepEqual(A.shells(A.configuration(11, 1)), [2, 8], 'Na⁺');
assert.deepEqual(A.configuration(1, 1), [], 'H⁺ has no electrons');

// 3. neutrons of the most abundant isotope
assert.equal(A.neutrons(6), 6, 'carbon-12');
assert.equal(A.neutrons(17), 18, 'chlorine-35');
assert.equal(A.neutrons(29), 34, 'copper-63');
assert.equal(A.neutrons(92), 146, 'uranium-238');
for (let z = 1; z <= 118; z++) assert.ok(A.neutrons(z) >= 0 && A.massNumber(z) >= z, `Z=${z}: mass number`);

// 4. Hund: one electron per orbital before pairing
assert.deepEqual(A.orbitals(1, 2), [1, 1, 0], 'p² unpaired');
assert.deepEqual(A.orbitals(2, 6), [2, 1, 1, 1, 1], 'd⁶');
assert.deepEqual(A.orbitals(3, 7), [1, 1, 1, 1, 1, 1, 1], 'f⁷ half-filled');

// 5. radial densities: 2s has its node at r = 2a₂; 3s two nodes; higher n lies farther out
const pdf2s = A.radialPdf(2, 0);
const a2 = 0.75;
assert.ok(pdf2s(2 * a2) < 1e-9, '2s radial node at 2a');
assert.ok(pdf2s(2 * a2 * 0.5) > 1e-3 && pdf2s(2 * a2 * 2) > 1e-3, '2s lobes on both sides of the node');
function nodes(n, l) {
  const pdf = A.radialPdf(n, l), xs = [];
  for (let r = 0.005; r < 12; r += 0.005) xs.push(pdf(r));
  const peak = Math.max(...xs);
  let count = 0;
  for (let i = 1; i < xs.length - 1; i++) if (xs[i] <= xs[i - 1] && xs[i] < xs[i + 1] && xs[i] < 1e-3 * peak) count++;
  return count;
}
assert.equal(nodes(3, 0), 2, '3s: two radial nodes');
assert.equal(nodes(3, 1), 1, '3p: one radial node');
assert.equal(nodes(3, 2), 0, '3d: no radial node');
assert.equal(nodes(4, 0), 3, '4s: three radial nodes');
let seed = 1;
const rand = () => { seed = (seed * 16807) % 2147483647; return seed / 2147483647; };
const q95 = (n, l) => A.radialSampler(n, l, rand).quantile(0.95);
assert.ok(q95(1, 0) < q95(2, 1) && q95(2, 1) < q95(3, 2) && q95(3, 2) < q95(4, 0), 'shells grow outward with n');

// 6. angular shapes: p_z points along z, d_xy has no density on the axes
const pz = Array.from({ length: 400 }, () => A.direction(1, 2, rand));
assert.ok(pz.reduce((s, d) => s + d[2] * d[2], 0) / pz.length > 0.55, 'p_z lobes along z');
const dxy = Array.from({ length: 400 }, () => A.direction(2, 3, rand));
assert.ok(dxy.every((d) => Math.abs(d[0] * d[1]) > 1e-4), 'd_xy avoids the x and y axes');

// 7. clouds: points per electron, every subshell present
const fe = A.cloud(A.configuration(26, 0), 10, rand);
assert.equal(fe.length, 7, 'Fe: 1s 2s 2p 3s 3p 3d 4s');
assert.equal(fe.reduce((s, c) => s + c.points.length / 3, 0), 260, 'Fe: 26 electrons × 10 points');

console.log('atom structure: ok (118 configurations)');
