// Allotropes: the 3D structures are generated from the measured values the
// page quotes, so the model and the reference must agree.
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { createRequire } from 'node:module';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const require = createRequire(import.meta.url);
const A = require(path.join(ROOT, 'assets/chem/allotrope-data.js'));

const near = (x, y, tol, msg) => assert.ok(Math.abs(x - y) <= tol, `${msg}: ${x} vs ${y}`);
const pm = (list) => (Array.isArray(list[0]) ? list : [list]).map((b) => b[1]);
const distinct = (xs, d) => [...new Set(xs.map((x) => x.toFixed(d)))].map(Number).sort((a, b) => a - b);

// every element lists its forms, every form belongs to one element and has the copy the page shows
const listed = Object.values(A.ORDER).flat();
assert.deepEqual([...listed].sort(), Object.keys(A.FORMS).sort(), 'ORDER covers every form once');
for (const [key, f] of Object.entries(A.FORMS)) {
  assert.ok(A.element(f.el), `${key}: element`);
  assert.ok(A.ORDER[f.el].includes(key), `${key}: listed under ${f.el}`);
  for (const field of ['name', 'short', 'label', 'note', 'structure', 'props', 'use', 'conducts']) {
    assert.ok(f[field] && f[field].pt && f[field].en, `${key}: ${field} in PT and EN`);
  }
  assert.ok(f.src.length && f.src.every((s) => A.SOURCES[s]), `${key}: sources`);
}

// models: bonds are the measured lengths, every atom is bonded, no atom over-bonded
const maxCn = { carbon: 4, oxygen: 2, sulfur: 2, phosphorus: 3 };
for (const key of Object.keys(A.FORMS)) {
  const f = A.FORMS[key];
  const m = A.model(key);
  const a = m.analysis;
  assert.ok(a.atoms >= 2 && a.bonds >= 1, `${key}: built`);
  const bonded = new Set(m.bonds.flatMap((b) => [b[0], b[1]]));
  assert.equal(bonded.size, a.atoms, `${key}: no loose atoms`);
  assert.ok(a.maxCn <= maxCn[f.el], `${key}: at most ${maxCn[f.el]} neighbours (${a.maxCn})`);
  if (f.ref.bond) {
    const refs = pm(f.ref.bond);
    // each model length is within 1.5 pm of some measured length (the rolled
    // nanotube's circumferential chords are 1 pm shorter than the flat sheet)
    a.lengths.forEach((l) => {
      const best = Math.min(...refs.map((r) => Math.abs(l * 100 - r)));
      assert.ok(best <= 1.5, `${key}: model bond ${(l * 100).toFixed(1)} pm vs ${refs.join('/')}`);
    });
  }
}

// carbon
const graphite = A.model('graphite');
near(graphite.analysis.lengths[0] * 100, 142.2, 0.2, 'graphite C–C');
distinct(graphite.analysis.angles, 1).forEach((x) => near(x, 120, 0.05, 'graphite angle'));
const layers = distinct(graphite.atoms.map((p) => p[1]), 4);
assert.equal(layers.length, 3, 'graphite: three layers');
near((layers[1] - layers[0]) * 100, 335.5, 0.1, 'graphite interlayer spacing');

const diamond = A.model('diamond').analysis;
near(diamond.lengths[0] * 100, 154.4, 0.1, 'diamond C–C');
distinct(diamond.angles, 2).forEach((x) => near(x, 109.47, 0.02, 'diamond angle'));
assert.equal(diamond.maxCn, 4, 'diamond: four neighbours');

const c60 = A.model('fullerene').analysis;
assert.equal(c60.atoms, 60, 'C60 atoms');
assert.equal(c60.bonds, 90, 'C60 bonds');
assert.deepEqual(distinct(c60.lengths.map((l) => l * 100), 1), [140.1, 145.8], 'C60 6:6 and 5:6 bonds');
assert.deepEqual(distinct(c60.angles, 1), [108, 120], 'C60 pentagon and hexagon angles');
const short = c60.lengths.filter((l) => l < 1.43).length;
assert.equal(short, 30, 'C60: 30 double (6:6) bonds');
near(2 * c60.reach * 100, 710, 3, 'C60 diameter');

const tube = A.model('nanotube');
near(tube.diameter * 100, 814, 1, 'nanotube (6,6) diameter');
assert.equal(tube.analysis.maxCn, 3, 'nanotube: sp²');

const sheet = A.model('graphene').analysis;
distinct(sheet.lengths.map((l) => l * 100), 1).forEach((x) => near(x, 142, 0.1, 'graphene C–C'));

// oxygen
near(A.model('o2').analysis.lengths[0] * 100, 120.75, 0.01, 'O=O');
assert.equal(A.model('o2').bonds[0][2], 2, 'O2 drawn as a double bond');
near(A.model('ozone').analysis.angles[0], 116.8, 0.01, 'O3 angle');

// sulfur: the S8 crown matches bond, angle and the measured torsion
const s8 = A.model('s_rhombic');
near(s8.analysis.lengths[0] * 100, 204.6, 0.01, 'S–S');
distinct(s8.analysis.angles, 2).forEach((x) => near(x, 108, 0.01, 'S–S–S'));
const t8 = Math.abs(A.torsion(s8.atoms[0], s8.atoms[1], s8.atoms[2], s8.atoms[3]));
near(t8, A.FORMS.s_rhombic.ref.torsion, 0.5, 'S8 torsion (measured 98.5°)');
const helix = A.model('s_plastic');
for (let i = 0; i + 3 < helix.atoms.length; i++) {
  near(Math.abs(A.torsion(...helix.atoms.slice(i, i + 4))), 85.3, 0.01, 'helix torsion');
}

// phosphorus
const p4 = A.model('p_white').analysis;
near(p4.lengths[0] * 100, 219.94, 0.01, 'P–P (P4)');
distinct(p4.angles, 1).forEach((x) => near(x, 60, 0.01, 'P4 angle'));
const black = A.model('p_black').analysis;
assert.deepEqual(distinct(black.lengths.map((l) => l * 100), 1), [222.4, 224.4], 'black P bonds');
assert.deepEqual(distinct(black.angles, 1), [96.3, 102.1], 'black P angles');
assert.ok(A.FORMS.p_red.didactic, 'red P is marked as a teaching model');

// numbers in the page language
assert.equal(A.fmt(142.2, 'pt'), '142,2');
assert.equal(A.fmt(142.2, 'en'), '142.2');
assert.equal(A.fmt(-182.96, 'pt'), '−182,96');
assert.equal(A.fmt(12345.6, 'pt'), '12.345,6');

// element pages link to forms the viewer knows, with ?elem=…&form=…
for (const file of ['carboneum', 'oxygenium', 'sulfur', 'phosphorus']) {
  const html = fs.readFileSync(path.join(ROOT, 'periodic-table', `${file}.html`), 'utf8');
  const links = [...html.matchAll(/\/viewer\/allotropes\.html\?elem=(\w+)&amp;form=(\w+)/g)];
  assert.ok(links.length >= 2, `${file}: allotrope cards`);
  links.forEach(([, el, form]) => {
    assert.ok(A.FORMS[form], `${file}: unknown form ${form}`);
    assert.equal(A.FORMS[form].el, el, `${file}: ${form} belongs to ${el}`);
  });
}

// the page loads the data before the UI and both before the 3D runtime
for (const page of ['viewer/allotropes.html', 'viewer/allotropes.pt.html']) {
  const html = fs.readFileSync(path.join(ROOT, page), 'utf8');
  const iData = html.indexOf('/assets/chem/allotrope-data.js');
  const iLab = html.indexOf('/assets/chem/allo-lab.js');
  const iRun = html.indexOf('load-three.js');
  assert.ok(iData > 0 && iLab > iData && iRun > iLab, `${page}: script order`);
  assert.match(html, /id="allo-elems"/, `${page}: element chips`);
  assert.match(html, /id="allo-variants"/, `${page}: list of forms`);
}
const runtime = fs.readFileSync(path.join(ROOT, 'viewer/runtime/allotrope-viewer.js'), 'utf8');
assert.match(runtime, /AtomurusAllotropes/, 'runtime draws from the data module');
assert.doesNotMatch(runtime, /AB-stacked|alloMeta/, 'no hand-placed structures left in the runtime');

console.log('allotropes: ok');
