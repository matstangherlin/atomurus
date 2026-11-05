#!/usr/bin/env node
/**
 * Geometry regression for the 42 viewer molecules, plus z-matrix unit checks.
 *   node tools/test-molecule-geometry.mjs
 */
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import {
  bondAngle, dihedral, distance, loadMoleculeTable, planeDeviation, zmatrixToCartesian
} from './molecule-geometry.mjs';

const refPath = fileURLToPath(new URL('./data/molecule-geometry-reference.json', import.meta.url));
const reference = JSON.parse(readFileSync(refPath, 'utf8'));
const failures = [];

function fail(message) {
  failures.push(message);
}

function angDelta(actual, expected) {
  if (!Number.isFinite(actual) || !Number.isFinite(expected)) return Infinity;
  const wrapped = Math.abs(actual - expected) % 360;
  return wrapped > 180 ? 360 - wrapped : wrapped;
}

function expandAngles(spec) {
  const angles = [...(spec.angles || [])];
  if (spec.tetrahedral) {
    const { center, ligands, deg, tol } = spec.tetrahedral;
    for (let i = 0; i < ligands.length; i += 1) {
      for (let j = i + 1; j < ligands.length; j += 1) {
        angles.push({ atoms: [ligands[i], center, ligands[j]], deg, tol });
      }
    }
  }
  if (spec.octahedral) {
    const { center, axes, tol } = spec.octahedral;
    const opposite = new Set(axes.flatMap(([a, b]) => [`${a}-${b}`, `${b}-${a}`]));
    const ligands = axes.flat();
    for (let i = 0; i < ligands.length; i += 1) {
      for (let j = i + 1; j < ligands.length; j += 1) {
        const opp = opposite.has(`${ligands[i]}-${ligands[j]}`);
        angles.push({ atoms: [ligands[i], center, ligands[j]], deg: opp ? 180 : 90, tol });
      }
    }
  }
  return angles;
}

function unitChecks() {
  const water = zmatrixToCartesian([
    {},
    { r: 0.9578, bond: 0 },
    { r: 0.9578, bond: 0, ang: 104.478, angle: 1 }
  ]);
  if (Math.abs(distance(water[0], water[1]) - 0.9578) > 1e-6) fail('unit water bond');
  if (Math.abs(bondAngle(water, 1, 0, 2) - 104.478) > 0.02) fail('unit water angle');

  const tet = Math.acos(-1 / 3) * 180 / Math.PI;
  const methane = zmatrixToCartesian([
    {},
    { r: 1.087, bond: 0 },
    { r: 1.087, bond: 0, ang: tet, angle: 1 },
    { r: 1.087, bond: 0, ang: tet, angle: 1, dih: 120, dihedral: 2 },
    { r: 1.087, bond: 0, ang: tet, angle: 1, dih: -120, dihedral: 2 }
  ]);
  for (let i = 1; i <= 4; i += 1) {
    for (let j = i + 1; j <= 4; j += 1) {
      const angle = bondAngle(methane, i, 0, j);
      if (Math.abs(angle - tet) > 0.05) fail(`unit methane ${i}-${j} ${angle.toFixed(3)}`);
    }
  }

  const ethane = zmatrixToCartesian([
    {},
    { r: 1.54, bond: 0 },
    { r: 1.09, bond: 0, ang: tet, angle: 1 },
    { r: 1.09, bond: 1, ang: tet, angle: 0, dih: 60, dihedral: 2 }
  ]);
  const torsion = dihedral(ethane, 3, 1, 0, 2);
  if (angDelta(torsion, 60) > 0.05) fail(`unit ethane dihedral ${torsion}`);
}

function checkMolecules() {
  const table = loadMoleculeTable();
  const keys = Object.keys(table);
  const spec = reference.molecules || {};
  for (const key of keys) {
    if (!spec[key]) fail(`${key} missing from molecule-geometry-reference.json`);
  }
  for (const key of Object.keys(spec)) {
    if (!table[key]) fail(`${key} is in the reference but not in COORDS`);
  }
  if (keys.length !== 42) fail(`expected 42 molecules, found ${keys.length}`);

  for (const key of keys) {
    const row = spec[key];
    if (!row) continue;
    if (!row.source || typeof row.verified !== 'boolean') fail(`${key} reference needs source and verified`);
    const points = row.atoms ? null : table[key].atoms.map((atom) => atom.pos);
    for (const bond of row.bonds || []) {
      const length = distance(points[bond.atoms[0]], points[bond.atoms[1]]);
      if (Math.abs(length - bond.length) > bond.tol) {
        fail(`${key} bond ${bond.atoms.join('-')} ${length.toFixed(3)} expected ${bond.length} ±${bond.tol}`);
      }
    }
    for (const angle of expandAngles(row)) {
      const [a, b, c] = angle.atoms;
      const deg = bondAngle(points, a, b, c);
      if (Math.abs(deg - angle.deg) > angle.tol) {
        fail(`${key} angle ${angle.atoms.join('-')} ${deg.toFixed(2)} expected ${angle.deg} ±${angle.tol}`);
      }
    }
    for (const item of row.dihedrals || []) {
      const [a, b, c, d] = item.atoms;
      const value = dihedral(points, a, b, c, d);
      const actual = item.absolute ? Math.abs(value) : value;
      const delta = item.absolute ? Math.abs(actual - item.deg) : angDelta(actual, item.deg);
      if (delta > item.tol) {
        fail(`${key} dihedral ${item.atoms.join('-')} ${Number.isFinite(value) ? value.toFixed(2) : value} expected ${item.deg} ±${item.tol}`);
      }
    }
    for (const plane of row.planes || []) {
      const deviation = planeDeviation(plane.atoms.map((index) => points[index]));
      if (plane.max != null && deviation > plane.max) {
        fail(`${key} plane ${deviation.toFixed(3)} > ${plane.max}`);
      }
      if (plane.min != null && deviation < plane.min) {
        fail(`${key} plane ${deviation.toFixed(3)} < ${plane.min}`);
      }
    }
  }
}

function checkSingleLine() {
  const text = readFileSync(fileURLToPath(new URL('../netlify/lib/viewer-molecule-coords.mjs', import.meta.url)), 'utf8');
  const start = text.indexOf('const COORDS = Object.freeze(');
  const end = text.indexOf(');', start);
  if (start < 0 || end < 0 || text.slice(start, end).includes('\n')) fail('COORDS must stay on one line');
}

unitChecks();
checkMolecules();
checkSingleLine();

if (failures.length) {
  console.error(`molecule geometry: ${failures.length} failure(s)`);
  for (const message of failures) console.error(`- ${message}`);
  process.exit(1);
}
console.log('molecule geometry ok (42 molecules, z-matrix unit checks passed)');
