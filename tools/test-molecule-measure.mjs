// Prompt 31: the viewer's measurement (distance, angle, dihedral) and the
// SDF → COORDS converter. Geometry with exact answers, the 42 molecules
// against tools/molecule-geometry.mjs, the hand-written water fixture, and a
// guard: no new molecule without the owner's source files.
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import vm from 'node:vm';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { bondAngle, dihedral as refDihedral, distance as refDistance, loadMoleculeTable, labelsOf, COORDS_FILE_PATH } from './molecule-geometry.mjs';
import { parseMolfile, toViewerEntry, insertEntry, elementPalette, medianDraw2dBond, readRaw, RAW_DIR } from './build-molecule-from-sdf.mjs';
import { VIEWER_MOLECULE_KEYS } from '../netlify/lib/viewer-molecule-coords.mjs';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const FIX = path.join(ROOT, 'tools', 'fixtures', 'molecules');
const near = (a, b, tol, msg) => assert.ok(Math.abs(a - b) <= tol, `${msg}: ${a} vs ${b}`);

// The measurement functions as the browser gets them: the viewer runtime,
// loaded without Three.js (only its module scope runs).
const ctx = vm.createContext({});
vm.runInContext(fs.readFileSync(path.join(ROOT, 'viewer/runtime/molecule-viewer.js'), 'utf8'), ctx, { filename: 'molecule-viewer.js' });
const M = ctx.AtomurusMoleculeMeasure;
assert.ok(M && typeof ctx.atomurusInitMoleculeViewer === 'function', 'the runtime exports the measure functions');

// ── Exact geometry ──────────────────────────────────────────────────────────
near(M.distance([0, 0, 0], [3, 4, 0]), 5, 1e-12, '3-4-5');
near(M.angle([1, 0, 0], [0, 0, 0], [0, 1, 0]), 90, 1e-9, 'right angle');
near(M.angle([1, 0, 0], [0, 0, 0], [-2, 0, 0]), 180, 1e-9, 'straight');
near(M.angle([1, 1, 1], [0, 0, 0], [1, -1, -1]), Math.acos(-1 / 3) * 180 / Math.PI, 1e-9, 'tetrahedral 109.47°');
for (const phi of [0, 60, -60, 120, -120, 179.9]) {
  const r = (phi * Math.PI) / 180;
  const pts = [[1, 0, 0], [0, 0, 0], [0, 0, 1.5], [Math.cos(r), Math.sin(r), 1.5]];
  near(M.dihedral(...pts), phi, 1e-9, `dihedral ${phi} (IUPAC sign)`);
  // tools/molecule-geometry.mjs (prompt 19) uses the opposite sign; same size.
  near(Math.abs(M.dihedral(...pts)), Math.abs(refDihedral(pts, 0, 1, 2, 3)), 1e-9, `same size as molecule-geometry (${phi})`);
}
// A mirror image flips the dihedral's sign, not its size.
const mirror = (p) => [-p[0], p[1], p[2]];
const chiralPts = [[1, 0, 0], [0, 0, 0], [0, 0, 1.5], [0.5, 0.8, 1.5]];
near(M.dihedral(...chiralPts.map(mirror)), -M.dihedral(...chiralPts), 1e-9, 'mirror flips the sign');

// ── The 42 molecules: same numbers as the geometry test's helpers ───────────
const table = loadMoleculeTable();
let checks = 0;
for (const [key, row] of Object.entries(table)) {
  const pts = row.atoms.map((a) => a.pos);
  for (const [i, j] of row.bonds) {
    near(M.distance(pts[i], pts[j]), refDistance(pts[i], pts[j]), 1e-12, `${key} bond ${i}-${j}`);
    checks += 1;
  }
  const nb = pts.map(() => []);
  row.bonds.forEach(([i, j]) => { nb[i].push(j); nb[j].push(i); });
  nb.forEach((list, c) => {
    for (let a = 0; a < list.length; a += 1) for (let b = a + 1; b < list.length; b += 1) {
      near(M.angle(pts[list[a]], pts[c], pts[list[b]]), bondAngle(pts, list[a], c, list[b]), 1e-9, `${key} angle`);
      checks += 1;
    }
  });
}
// The viewer's water keeps the NIST angle (104.48° → «104.5°»); its O–H is
// the older teaching scale (1.121), so 0.96 Å is checked on the fixture below.
const water = table.water;
const waterRes = M.measureResult(water.atoms.map((a) => a.pos), [1, 0, 2], 'angle', water.bonds);
assert.equal(M.formatMeasure(waterRes, labelsOf(water), 'pt'), 'H2–O1–H3: 104,5°');

// ── Selection and text ──────────────────────────────────────────────────────
assert.deepEqual([...M.nextSelection([], 3, 'distance')], [3]);
assert.deepEqual([...M.nextSelection([3], 5, 'distance')], [3, 5]);
assert.deepEqual([...M.nextSelection([3, 5], 7, 'distance')], [7], 'a third atom starts a new distance');
assert.deepEqual([...M.nextSelection([3, 5, 7], 5, 'angle')], [3, 7], 'choosing an atom again drops it');
assert.equal(M.measureResult(water.atoms.map((a) => a.pos), [0], 'distance', water.bonds), null, 'incomplete → no value');
const pts = water.atoms.map((a) => a.pos);
const labels = labelsOf(water);
assert.match(M.formatMeasure(M.measureResult(pts, [0, 1], 'distance', water.bonds), labels, 'pt'), /^O1–H2: 1,1 Å \(ligação\)$/);
assert.match(M.formatMeasure(M.measureResult(pts, [1, 2], 'distance', water.bonds), labels, 'en'), /^H2···H3: \d\.\d Å \(not bonded\)$/);
const neg = M.measureResult(chiralPts.map(mirror), [0, 1, 2, 3], 'dihedral', []);
assert.match(M.formatMeasure(neg, ['H', 'C', 'C', 'H'], 'pt'), /^H1–C2–C3–H4: −\d+,\d°$/, 'a negative dihedral reads with a minus sign and a comma');
for (const lang of ['en', 'pt']) {
  assert.deepEqual(Object.keys(M.MEASURE_TEXT[lang]).sort(), Object.keys(M.MEASURE_TEXT.en).sort(), `measure text ${lang}`);
  for (const [k, v] of Object.entries(M.MEASURE_TEXT[lang])) {
    const slots = (s) => (s.match(/\{\w+\}/g) || []).sort().join();
    assert.equal(slots(v), slots(M.MEASURE_TEXT.en[k]), `measure text ${k}: same slots`);
  }
}

// ── Converter on the hand-written water ─────────────────────────────────────
const sdf3 = fs.readFileSync(path.join(FIX, 'water.sdf'), 'utf8');
const sdf2 = fs.readFileSync(path.join(FIX, 'water.2d.sdf'), 'utf8');
const mol3d = parseMolfile(sdf3);
const mol2d = parseMolfile(sdf2);
assert.equal(mol3d.atoms.length, 3);
assert.deepEqual(mol3d.bonds, [{ a: 0, b: 1, order: 1 }, { a: 0, b: 2, order: 1 }]);
const palette = elementPalette(table);
const meta = JSON.parse(fs.readFileSync(path.join(FIX, 'water.json'), 'utf8'));
for (const withTwoD of [true, false]) {
  const entry = toViewerEntry({ mol3d, mol2d: withTwoD ? mol2d : null, meta, palette, bond2d: medianDraw2dBond(table) });
  const p = entry.atoms.map((a) => a.pos);
  near(M.distance(p[0], p[1]), 0.9578, 2e-4, 'fixture O–H ≈ 0.96 Å');
  near(M.angle(p[1], p[0], p[2]), 104.48, 0.02, 'fixture H–O–H ≈ 104.5°');
  assert.deepEqual(entry.bonds, [[0, 1], [0, 2]]);
  assert.deepEqual(entry.atoms.map((a) => [a.r, a.color]), [[palette.O.r, palette.O.color], [palette.H.r, palette.H.color], [palette.H.r, palette.H.color]], 'colours and radii of the existing molecules');
  const c = p.reduce((s, q) => [s[0] + q[0], s[1] + q[1], s[2] + q[2]], [0, 0, 0]);
  c.forEach((v) => near(v / 3, 0, 1e-3, 'centred'));
  const d = entry.draw2d;
  assert.deepEqual(d.atoms.map((a) => a.label), ['O', 'H', 'H']);
  near(Math.hypot(d.atoms[0].x - d.atoms[1].x, d.atoms[0].y - d.atoms[1].y), medianDraw2dBond(table), 0.01, `draw2d bond like the existing drawings (${withTwoD ? '2D record' : 'projection'})`);
  if (!withTwoD) {
    const ang = M.angle([d.atoms[1].x, d.atoms[1].y, 0], [d.atoms[0].x, d.atoms[0].y, 0], [d.atoms[2].x, d.atoms[2].y, 0]);
    near(ang, 104.48, 0.1, 'a planar molecule keeps its angle in the projection');
  }
}
// Palette = the most used colour/radius per element in COORDS.
assert.deepEqual({ ...palette.H }, { r: 0.2, color: 14540253 });
assert.deepEqual({ ...palette.C }, { r: 0.35, color: 6710886 });

// Refusals.
const coordsText = fs.readFileSync(COORDS_FILE_PATH, 'utf8');
const entry = toViewerEntry({ mol3d, mol2d, meta, palette, bond2d: 1.5 });
const added = insertEntry(coordsText, 'fixture-water', entry);
const line = added.split('\n').find((l) => l.startsWith('const COORDS = Object.freeze('));
assert.ok(line && line.includes('"fixture-water":'), 'the new key is in the one-line COORDS');
assert.equal(added.split('\n').length, coordsText.split('\n').length, 'no lines added: COORDS stays one line');
assert.throws(() => insertEntry(coordsText, 'water', entry), /already in COORDS/, 'existing molecules are not rewritten');
assert.throws(() => parseMolfile(sdf3.replace('V2000', 'V3000')), /V3000/);
assert.throws(() => parseMolfile(sdf3.replace('  1  2  1  0', '  1  2  4  0')), /Kekulé/);
assert.throws(() => toViewerEntry({ mol3d: mol2d, meta, palette }), /flat/, 'a 2D record is not a 3D model');
assert.throws(() => toViewerEntry({ mol3d: parseMolfile(sdf3.replace(' O   0', ' Xe  0')), meta, palette }), /no colour\/radius in COORDS for Xe/, 'no invented palette');
assert.throws(() => toViewerEntry({ mol3d, mol2d: { ...mol2d, atoms: [mol2d.atoms[1], mol2d.atoms[0], mol2d.atoms[2]] }, meta, palette }), /same order/);
assert.throws(() => toViewerEntry({ mol3d, meta: { name: 'x' }, palette }), /name and desc/);

// The command line, dry run, on a copy of the fixture under a new key.
const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'atomurus-sdf-'));
for (const [from, to] of [['water.sdf', 'fixture-water.sdf'], ['water.2d.sdf', 'fixture-water.2d.sdf'], ['water.json', 'fixture-water.json']]) fs.copyFileSync(path.join(FIX, from), path.join(tmp, to));
const run = spawnSync(process.execPath, [path.join(ROOT, 'tools/build-molecule-from-sdf.mjs'), '--dir', tmp], { encoding: 'utf8' });
assert.equal(run.status, 0, run.stderr);
assert.match(run.stdout, /\+ fixture-water: 3 atoms, 2 bonds, draw2d from the 2D record/);
assert.match(run.stdout, /dry run — nothing written/);
assert.equal(fs.readFileSync(COORDS_FILE_PATH, 'utf8'), coordsText, 'the dry run writes nothing');
assert.equal(readRaw(tmp).length, 1);
fs.rmSync(tmp, { recursive: true, force: true });

// ── No molecule without the owner's source files ────────────────────────────
for (const key of ['caffeine', 'aspirin', 'glucose', 'ibuprofen']) {
  if (!fs.existsSync(path.join(RAW_DIR, key + '.sdf'))) {
    assert.ok(!VIEWER_MOLECULE_KEYS.includes(key), `${key} is not in the viewer until its SDF is in tools/data/raw/molecules`);
  }
}
assert.equal(VIEWER_MOLECULE_KEYS.length, 42, 'the 42 existing molecules');

console.log(`test-molecule-measure: ok (${checks} bonds/angles cross-checked)`);
