// Molecule geometry, polarity and the curated 3D coordinates.
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { execFileSync } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const require = createRequire(import.meta.url);
const MI = require(path.join(ROOT, 'assets/chem/mol-insight.js'));
const ISO = require(path.join(ROOT, 'assets/chem/isomer-engine.js'));
const coords = await import(path.join(ROOT, 'netlify/lib/viewer-molecule-coords.mjs'));

// the module is generated: it must match the generator
execFileSync(process.execPath, [path.join(ROOT, 'tools/build-molecule-geometry.mjs'), '--check'], { stdio: 'pipe' });

const C2E = {};
Object.keys(MI.VIEW.COLOR).forEach((el) => { C2E[MI.VIEW.COLOR[el]] = el; });
function curated(key) {
  const mol = coords.viewerMoleculePayload(key);
  assert.ok(mol, key);
  return MI.analyze({
    atoms: mol.atoms.map((a) => ({ el: C2E[a.color] || '?', pos: a.pos.map((v) => v / MI.VIEW.SCALE) })),
    bonds: mol.bonds
  });
}
const angle = (r, label) => r.angles.find((a) => a.label === label);
const near = (x, y, tol, msg) => assert.ok(Math.abs(x - y) <= tol, `${msg}: ${x} vs ${y}`);

// every curated molecule maps to known elements
for (const key of coords.VIEWER_MOLECULE_KEYS) {
  const mol = coords.viewerMoleculePayload(key);
  mol.atoms.forEach((a) => assert.ok(C2E[a.color], `${key}: colour ${a.color.toString(16)} has an element`));
}

// measured lengths and angles are what the model shows
for (const key of coords.VIEWER_MOLECULE_KEYS) {
  const ref = MI.reference(key);
  if (!ref) continue;
  const r = curated(key);
  for (const [label, pm] of Object.entries(ref.len || {})) {
    const t = r.bondTypes.find((b) => b.label === label);
    assert.ok(t, `${key}: bond ${label} present`);
    near(t.length * 100, pm, 0.6, `${key} ${label}`);
  }
}
const ANGLES = ['water', 'ammonia', 'methane', 'co2', 'so2', 'pcl3', 'h2o2', 'benzene', 'cyclohexane', 'acetylene', 'hcn', 'cs2'];
for (const key of ANGLES) {
  const ref = MI.reference(key);
  const r = curated(key);
  for (const [label, deg] of Object.entries(ref.ang || {})) {
    const g = angle(r, label);
    assert.ok(g, `${key}: angle ${label}`);
    near(g.values[0].deg, deg, 0.6, `${key} ${label}`);
  }
}

// shapes (VSEPR read from the 3D angles)
const shape = (key) => curated(key).shapes.map((s) => s.el + ':' + s.shape).join(' ');
assert.equal(shape('water'), 'O:bent');
assert.equal(shape('ammonia'), 'N:trigonal-pyramidal');
assert.equal(shape('methane'), 'C:tetrahedral');
assert.equal(shape('co2'), 'C:linear');
assert.equal(shape('so2'), 'S:bent');
assert.equal(shape('sf6'), 'S:octahedral');
assert.equal(shape('formaldehyde'), 'C:trigonal-planar');
assert.equal(shape('benzene'), 'C:trigonal-planar');
assert.match(shape('butane'), /^C:tetrahedral$/);
const sf6 = angle(curated('sf6'), 'F–S–F');
assert.deepEqual(sf6.values.map((v) => [Math.round(v.deg), v.count]), [[90, 12], [180, 3]]);

// polarity from the vector sum of bond dipoles
const verdict = (key) => curated(key).dipole.verdict;
['water', 'ammonia', 'hcl', 'so2', 'formaldehyde', 'methanol', 'dimethylether', 'acetone', 'h2o2', 'pcl3', 'hcn'].forEach((k) => assert.equal(verdict(k), 'polar', k));
['co2', 'sf6'].forEach((k) => assert.equal(verdict(k), 'apolar-cancel', k));
['methane', 'benzene', 'ethylene', 'n2', 'o2', 'butane'].forEach((k) => assert.equal(verdict(k), 'apolar', k));
assert.equal(verdict('nacl'), 'ionic');
assert.equal(MI.bondKind('Na', 'Cl'), 'ionic');
assert.equal(MI.bondKind('H', 'O'), 'polar');
assert.equal(MI.bondKind('C', 'H'), 'apolar');

// the dipole points to the electronegative end (water: towards O)
{
  const mol = coords.viewerMoleculePayload('water');
  const r = curated('water');
  const o = mol.atoms[0].pos, h = mol.atoms[1].pos, h2 = mol.atoms[2].pos;
  const mid = [0, 1, 2].map((k) => (h[k] + h2[k]) / 2 - o[k]);
  const dot = r.dipole.vector.reduce((s, v, k) => s + v * mid[k], 0);
  assert.ok(dot < 0, 'water dipole points from the H side to O');
}

// engine-built molecules: planar aromatic rings, exact linear centres
function built(src) {
  const mol = ISO.parseStructure(src);
  assert.ok(!mol.error, src + ': ' + mol.error);
  const m = ISO.embed3d(mol, {});
  const m3 = { atoms: m.atoms.map((a, i) => ({ el: a.el, pos: m.coords[i] })), bonds: m.bonds.map((b) => [b.a, b.b, b.o]) };
  MI.snapBondLengths(m3, null);
  return MI.analyze(m3);
}
{
  const r = built('C6H5OH');
  assert.ok(r.shapes.some((s) => s.el === 'C' && s.shape === 'trigonal-planar' && s.count === 6), 'phenol ring planar');
  near(angle(r, 'C–C–C').values[0].deg, 120, 1.5, 'phenol ring angle');
  r.bondTypes.filter((b) => /C[=–]C/.test(b.label)).forEach((b) => near(b.length * 100, 139.7, 1.5, 'aromatic C–C'));
  assert.equal(r.dipole.verdict, 'polar');
}
near(angle(built('CH3CN'), 'C–C–N').values[0].deg, 180, 0.01, 'acetonitrile linear');
near(angle(built('CC#CC'), 'C–C–C').values[0].deg, 180, 0.01, '2-butyne linear');
assert.equal(built('CCl4').dipole.verdict, 'apolar-cancel');
assert.equal(built('CHCl3').dipole.verdict, 'polar');
assert.equal(built('CH3CH2OH').dipole.verdict, 'polar');
near(built('CH3CH2OH').bondTypes.find((b) => b.label === 'C–O').length * 100, 143.0, 0.2, 'typical C–O');

// condensed formula with a phenyl group
const ph = ISO.parseStructure('C6H5COOH');
assert.equal(ISO.classify(ph).main, 'acid');
assert.equal(ISO.withHydrogens(ph).atoms.length, 15);

console.log('mol insight ok');
