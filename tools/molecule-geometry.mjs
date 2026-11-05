import { readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const COORDS_FILE = path.join(ROOT, 'netlify/lib/viewer-molecule-coords.mjs');

export function sub(a, b) {
  return [a[0] - b[0], a[1] - b[1], a[2] - b[2]];
}
export function add(a, b) {
  return [a[0] + b[0], a[1] + b[1], a[2] + b[2]];
}
export function scale(a, s) {
  return [a[0] * s, a[1] * s, a[2] * s];
}
export function dot(a, b) {
  return a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
}
export function cross(a, b) {
  return [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]];
}
export function length(a) {
  return Math.hypot(a[0], a[1], a[2]);
}
export function normalize(a) {
  const l = length(a) || 1;
  return scale(a, 1 / l);
}
export function distance(a, b) {
  return length(sub(a, b));
}

export function bondAngle(points, i, j, k) {
  const u = sub(points[i], points[j]);
  const v = sub(points[k], points[j]);
  const cos = dot(u, v) / (length(u) * length(v));
  return Math.acos(Math.min(1, Math.max(-1, cos))) * 180 / Math.PI;
}

export function dihedral(points, i, j, k, l) {
  const b1 = sub(points[j], points[i]);
  const b2 = sub(points[k], points[j]);
  const b3 = sub(points[l], points[k]);
  const n1 = cross(b1, b2);
  const n2 = cross(b2, b3);
  const b2n = normalize(b2);
  const m1 = cross(n1, b2n);
  return Math.atan2(dot(m1, n2), dot(n1, n2)) * 180 / Math.PI;
}

export function planeDeviation(points) {
  if (points.length < 3) return 0;
  const c = [0, 0, 0];
  for (const p of points) {
    c[0] += p[0]; c[1] += p[1]; c[2] += p[2];
  }
  c[0] /= points.length; c[1] /= points.length; c[2] /= points.length;
  const n = [0, 0, 0];
  for (let i = 0; i < points.length; i += 1) {
    const a = sub(points[i], c);
    const b = sub(points[(i + 1) % points.length], c);
    const cr = cross(a, b);
    n[0] += cr[0]; n[1] += cr[1]; n[2] += cr[2];
  }
  const nn = normalize(n);
  let max = 0;
  for (const p of points) max = Math.max(max, Math.abs(dot(sub(p, c), nn)));
  return max;
}

/**
 * Z-matrix. Entry i:
 *   { r, bond, ang, angle, dih, dihedral }
 * bond/angle/dihedral are indices of earlier atoms.
 * ang is the angle at `bond` between this atom and `angle`, in degrees.
 * dih is the torsion this-bond-angle-dihedral, in degrees.
 */
export function zmatrixToCartesian(entries) {
  const p = [];
  for (let i = 0; i < entries.length; i += 1) {
    const e = entries[i] || {};
    if (i === 0 || e.bond == null) {
      p.push([0, 0, 0]);
      continue;
    }
    if (e.angle == null) {
      p.push(add(p[e.bond], [e.r, 0, 0]));
      continue;
    }
    const theta = (e.ang * Math.PI) / 180;
    const A = p[e.bond];
    const B = p[e.angle];
    if (!A || !B) throw new Error(`z-matrix entry ${i} references a missing atom`);
    if (e.dihedral == null) {
      const u = normalize(sub(B, A));
      const tmp = Math.abs(u[0]) < 0.9 ? [1, 0, 0] : [0, 1, 0];
      const v = normalize(cross(u, tmp));
      const dir = add(scale(u, Math.cos(theta)), scale(v, Math.sin(theta)));
      p.push(add(A, scale(normalize(dir), e.r)));
      continue;
    }
    const phi = (e.dih * Math.PI) / 180;
    const C = p[e.dihedral];
    if (!C) throw new Error(`z-matrix entry ${i} references a missing dihedral atom`);
    const ab = normalize(sub(A, B));
    const bc = normalize(sub(B, C));
    let n = cross(ab, bc);
    if (length(n) < 1e-8) n = cross(ab, Math.abs(ab[0]) < 0.9 ? [1, 0, 0] : [0, 1, 0]);
    n = normalize(n);
    const n2 = cross(n, ab);
    const dir = add(
      add(scale(ab, -Math.cos(theta)), scale(n2, -Math.sin(theta) * Math.cos(phi))),
      scale(n, Math.sin(theta) * Math.sin(phi))
    );
    p.push(add(A, scale(normalize(dir), e.r)));
  }
  return p;
}

export function positionsFromInternal(spec) {
  const built = zmatrixToCartesian(spec.z);
  const pos = new Array(spec.order.length);
  spec.order.forEach((index, builtIndex) => {
    pos[index] = built[builtIndex];
  });
  return pos;
}

export function loadMoleculeTable() {
  const text = readFileSync(COORDS_FILE, 'utf8');
  const marker = 'const COORDS = Object.freeze(';
  const start = text.indexOf(marker);
  if (start < 0) throw new Error('COORDS not found');
  const jsonStart = start + marker.length;
  const exportAt = text.indexOf('\nexport const VIEWER_MOLECULE_KEYS', jsonStart);
  const jsonEnd = text.lastIndexOf(');', exportAt);
  return JSON.parse(text.slice(jsonStart, jsonEnd));
}

export function bondPairs(bonds) {
  return (bonds || []).map((bond) => [bond[0], bond[1]]);
}

const COLOR_ELEMENT = {
  14540253: 'H',
  6710886: 'C',
  5592405: 'C',
  4473924: 'C',
  15610675: 'O',
  3381759: 'N',
  16763955: 'S',
  16746547: 'P',
  4513092: 'Cl',
  11796282: 'F',
  10889513: 'Br',
  11184895: 'Na',
  13395507: 'Fe'
};

export function elementFromAtom(atom) {
  return COLOR_ELEMENT[atom.color] || '?';
}

export function labelsOf(row) {
  const drawn = (row.draw2d && row.draw2d.atoms || []).map((atom) => atom.label);
  const colored = row.atoms.map(elementFromAtom);
  if (drawn.length === row.atoms.length && drawn.every((label, i) => label === colored[i])) return drawn;
  return colored;
}

export function analyze(row) {
  const points = row.atoms.map((atom) => atom.pos);
  const labels = labelsOf(row);
  const pairs = bondPairs(row.bonds);
  const bonds = pairs.map(([i, j]) => ({
    i, j,
    labels: `${labels[i] || '?'}-${labels[j] || '?'}`,
    length: distance(points[i], points[j])
  }));
  const neighbors = points.map(() => []);
  for (const [i, j] of pairs) {
    neighbors[i].push(j);
    neighbors[j].push(i);
  }
  const angles = [];
  neighbors.forEach((list, center) => {
    for (let a = 0; a < list.length; a += 1) {
      for (let b = a + 1; b < list.length; b += 1) {
        angles.push({
          atoms: [list[a], center, list[b]],
          labels: `${labels[list[a]] || '?'}-${labels[center] || '?'}-${labels[list[b]] || '?'}`,
          deg: bondAngle(points, list[a], center, list[b])
        });
      }
    }
  });
  return { labels, bonds, angles, points };
}

export const COORDS_FILE_PATH = COORDS_FILE;
