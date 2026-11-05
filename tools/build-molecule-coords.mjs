#!/usr/bin/env node
/**
 * Rewrite only the 3D positions of molecules that fail the geometry test.
 * Preserves names, descriptions, draw2d, radii, colors, bonds and atom order.
 * Not part of the site build.
 *
 *   node tools/build-molecule-coords.mjs --check
 *   node tools/build-molecule-coords.mjs
 */
import { readFileSync, writeFileSync } from 'node:fs';
import {
  COORDS_FILE_PATH, add, bondAngle, cross, dihedral, distance, dot, loadMoleculeTable,
  normalize, planeDeviation, positionsFromInternal, scale, sub, zmatrixToCartesian
} from './molecule-geometry.mjs';

const T = Math.acos(-1 / 3) * 180 / Math.PI;
const CC = 1.531;
const CCC = 113.8;
const CH = 1.1;

function deg(rad) {
  return rad * 180 / Math.PI;
}
function rad(value) {
  return value * Math.PI / 180;
}

/** Azimuth that makes two substituents, both at `theta` from a third bond, meet at `theta`. */
function equalAngleAzimuth(thetaDeg) {
  const c = Math.cos(rad(thetaDeg));
  return deg(Math.acos(c / (1 + c)));
}

/** Azimuth of a bond that must make `alpha2` with a second reference `beta` from the first. */
function azimuthBetween(alphaDeg, betaDeg, alpha2Deg) {
  const a = rad(alphaDeg);
  const b = rad(betaDeg);
  const a2 = rad(alpha2Deg);
  const c = (Math.cos(a2) - Math.cos(a) * Math.cos(b)) / (Math.sin(a) * Math.sin(b));
  return deg(Math.acos(Math.min(1, Math.max(-1, c))));
}

function methyl(bond, angle, dihedralAtom, r = CH, ang = 110) {
  return [60, 180, -60].map((dih) => ({ r, bond, ang, angle, dih, dihedral: dihedralAtom }));
}

function zEntryToward(points, bond, angleAtom, dihedralAtom, r, target) {
  const A = points[bond];
  const B = points[angleAtom];
  const C = points[dihedralAtom];
  const ab = normalize(sub(A, B));
  const bc = normalize(sub(B, C));
  const n = normalize(cross(ab, bc));
  const n2 = cross(n, ab);
  const x = dot(target, ab);
  const y = dot(target, n2);
  const z = dot(target, n);
  const theta = Math.acos(Math.min(1, Math.max(-1, -x)));
  const sinTheta = Math.sin(theta) || 1e-8;
  const phi = Math.atan2(z / sinTheta, -y / sinTheta);
  return {
    r, bond, ang: deg(theta), angle: angleAtom, dih: deg(phi), dihedral: dihedralAtom
  };
}

function ethanol() {
  return {
    order: [0, 1, 2, 3, 4, 5, 6, 7, 8],
    z: [
      {},
      { r: 1.512, bond: 0 },
      { r: 1.431, bond: 1, ang: 107.8, angle: 0 },
      { r: 0.971, bond: 2, ang: 105.4, angle: 1, dih: 180, dihedral: 0 },
      ...methyl(0, 1, 2, 1.09, 109),
      { r: 1.09, bond: 1, ang: 112, angle: 0, dih: 120, dihedral: 2 },
      { r: 1.09, bond: 1, ang: 112, angle: 0, dih: -120, dihedral: 2 }
    ]
  };
}

function methanol() {
  return {
    order: [0, 1, 2, 3, 4, 5],
    z: [
      {},
      { r: 1.427, bond: 0 },
      { r: 0.956, bond: 1, ang: 108.87, angle: 0 },
      ...methyl(0, 1, 2, 1.096, 109.9)
    ]
  };
}

function dimethylether() {
  return {
    order: [0, 1, 2, 3, 4, 5, 6, 7, 8],
    z: [
      {},
      { r: 1.411, bond: 0 },
      { r: 1.411, bond: 1, ang: 111.2, angle: 0 },
      ...methyl(0, 1, 2, 1.09, 110),
      ...methyl(2, 1, 0, 1.09, 110)
    ]
  };
}

function propane() {
  return {
    order: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10],
    z: [
      {},
      { r: CC, bond: 0 },
      { r: CC, bond: 1, ang: CCC, angle: 0 },
      ...methyl(0, 1, 2, 1.1, 111),
      { r: CH, bond: 1, ang: 111, angle: 0, dih: 120, dihedral: 2 },
      { r: CH, bond: 1, ang: 111, angle: 0, dih: -120, dihedral: 2 },
      ...methyl(2, 1, 0, 1.1, 111)
    ]
  };
}

function butane() {
  return {
    order: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13],
    z: [
      {},
      { r: CC, bond: 0 },
      { r: CC, bond: 1, ang: CCC, angle: 0 },
      { r: CC, bond: 2, ang: CCC, angle: 1, dih: 180, dihedral: 0 },
      ...methyl(0, 1, 2, 1.117, 111),
      { r: 1.117, bond: 1, ang: 111, angle: 0, dih: 120, dihedral: 2 },
      { r: 1.117, bond: 1, ang: 111, angle: 0, dih: -120, dihedral: 2 },
      { r: 1.117, bond: 2, ang: 111, angle: 1, dih: 120, dihedral: 3 },
      { r: 1.117, bond: 2, ang: 111, angle: 1, dih: -120, dihedral: 3 },
      ...methyl(3, 2, 1, 1.117, 111)
    ]
  };
}

function alkeneChain(sp2, chainDih) {
  return {
    order: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11],
    z: [
      {},
      { r: 1.34, bond: 0 },
      { r: 1.508, bond: 1, ang: sp2, angle: 0 },
      { r: 1.508, bond: 2, ang: CCC, angle: 1, dih: chainDih, dihedral: 0 },
      { r: 1.08, bond: 0, ang: 121, angle: 1, dih: 0, dihedral: 2 },
      { r: 1.08, bond: 0, ang: 121, angle: 1, dih: 180, dihedral: 2 },
      { r: 1.08, bond: 1, ang: 117, angle: 0, dih: 180, dihedral: 2 },
      { r: CH, bond: 2, ang: T, angle: 1, dih: 120, dihedral: 3 },
      { r: CH, bond: 2, ang: T, angle: 1, dih: -120, dihedral: 3 },
      ...methyl(3, 2, 1)
    ]
  };
}

function internalAlkene(dih) {
  return {
    order: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11],
    z: [
      {},
      { r: 1.508, bond: 0 },
      { r: 1.34, bond: 1, ang: 125, angle: 0 },
      { r: 1.508, bond: 2, ang: 125, angle: 1, dih, dihedral: 0 },
      ...methyl(0, 1, 2),
      { r: 1.08, bond: 1, ang: 118, angle: 0, dih: 180, dihedral: 2 },
      { r: 1.08, bond: 2, ang: 118, angle: 1, dih: 180, dihedral: 3 },
      ...methyl(3, 2, 1)
    ]
  };
}

function bromobutane() {
  const chain = 112;
  return {
    order: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13],
    z: [
      {},
      { r: CC, bond: 0 },
      { r: CC, bond: 1, ang: chain, angle: 0 },
      { r: CC, bond: 2, ang: CCC, angle: 1, dih: 180, dihedral: 0 },
      { r: 1.94, bond: 1, ang: T, angle: 0, dih: 120, dihedral: 2 },
      ...methyl(0, 1, 2),
      { r: CH, bond: 1, ang: T, angle: 0, dih: -120, dihedral: 2 },
      { r: CH, bond: 2, ang: T, angle: 1, dih: 120, dihedral: 3 },
      { r: CH, bond: 2, ang: T, angle: 1, dih: -120, dihedral: 3 },
      ...methyl(3, 2, 1)
    ]
  };
}

function isobutane() {
  const theta = 111.15;
  const heavy = [
    {},
    { r: 1.535, bond: 0 },
    { r: 1.535, bond: 0, ang: theta, angle: 1 },
    { r: 1.535, bond: 0, ang: theta, angle: 1, dih: equalAngleAzimuth(theta), dihedral: 2 }
  ];
  const pts = zmatrixToCartesian(heavy);
  const u1 = normalize(sub(pts[1], pts[0]));
  const u2 = normalize(sub(pts[2], pts[0]));
  const u3 = normalize(sub(pts[3], pts[0]));
  const hdir = normalize(scale(add(add(u1, u2), u3), -1));
  return {
    order: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13],
    z: [
      ...heavy,
      zEntryToward(pts, 0, 1, 2, CH, hdir),
      ...methyl(1, 0, 2),
      ...methyl(2, 0, 1),
      ...methyl(3, 0, 1)
    ]
  };
}

function acetone() {
  return {
    order: [1, 0, 2, 3, 4, 5, 6, 7, 8, 9],
    z: [
      {},
      { r: 1.52, bond: 0 },
      { r: 1.52, bond: 0, ang: 116, angle: 1 },
      { r: 1.214, bond: 0, ang: 122, angle: 1, dih: 180, dihedral: 2 },
      ...methyl(1, 0, 3, 1.103, 110.5),
      ...methyl(2, 0, 3, 1.103, 110.5)
    ]
  };
}

function aceticacid() {
  return {
    order: [0, 1, 2, 3, 4, 5, 6, 7],
    z: [
      {},
      { r: 1.517, bond: 0 },
      { r: 1.212, bond: 1, ang: 126.6, angle: 0 },
      { r: 1.361, bond: 1, ang: 110.6, angle: 0, dih: 180, dihedral: 2 },
      { r: 0.97, bond: 3, ang: 106, angle: 1, dih: 180, dihedral: 0 },
      ...methyl(0, 1, 2, 1.1, 110)
    ]
  };
}

function h2o2() {
  return {
    order: [0, 1, 2, 3],
    z: [
      {},
      { r: 1.475, bond: 0 },
      { r: 0.95, bond: 0, ang: 94.8, angle: 1 },
      { r: 0.95, bond: 1, ang: 94.8, angle: 0, dih: 119.8, dihedral: 2 }
    ]
  };
}

function so2() {
  return {
    order: [0, 1, 2],
    z: [
      {},
      { r: 1.431, bond: 0 },
      { r: 1.431, bond: 0, ang: 119.5, angle: 1 }
    ]
  };
}

function pcl3() {
  const theta = 100.3;
  return {
    order: [0, 1, 2, 3],
    z: [
      {},
      { r: 2.04, bond: 0 },
      { r: 2.04, bond: 0, ang: theta, angle: 1 },
      { r: 2.04, bond: 0, ang: theta, angle: 1, dih: equalAngleAzimuth(theta), dihedral: 2 }
    ]
  };
}

function hno3() {
  return {
    order: [0, 1, 2, 3, 4],
    z: [
      {},
      { r: 1.21, bond: 0 },
      { r: 1.2, bond: 0, ang: 130, angle: 1 },
      { r: 1.41, bond: 0, ang: 115, angle: 1, dih: 180, dihedral: 2 },
      { r: 0.96, bond: 3, ang: 102, angle: 0, dih: 180, dihedral: 1 }
    ]
  };
}

function h2so4() {
  const oh = azimuthBetween(106, 123, 106);
  return {
    order: [0, 1, 2, 3, 4, 5, 6],
    z: [
      {},
      { r: 1.43, bond: 0 },
      { r: 1.43, bond: 0, ang: 123, angle: 1 },
      { r: 1.57, bond: 0, ang: 106, angle: 1, dih: oh, dihedral: 2 },
      { r: 1.57, bond: 0, ang: 106, angle: 1, dih: -oh, dihedral: 2 },
      { r: 0.96, bond: 3, ang: 108, angle: 0, dih: 60, dihedral: 1 },
      { r: 0.96, bond: 4, ang: 108, angle: 0, dih: -60, dihedral: 1 }
    ]
  };
}

function h3po4() {
  return {
    order: [0, 1, 2, 3, 4, 5, 6, 7],
    z: [
      {},
      { r: 1.48, bond: 0 },
      { r: 1.55, bond: 0, ang: T, angle: 1 },
      { r: 1.55, bond: 0, ang: T, angle: 1, dih: 120, dihedral: 2 },
      { r: 1.55, bond: 0, ang: T, angle: 1, dih: -120, dihedral: 2 },
      { r: 0.96, bond: 2, ang: 110, angle: 0, dih: 180, dihedral: 1 },
      { r: 0.96, bond: 3, ang: 110, angle: 0, dih: 180, dihedral: 1 },
      { r: 0.96, bond: 4, ang: 110, angle: 0, dih: 180, dihedral: 1 }
    ]
  };
}

function cyclohexane() {
  const R = 1.53;
  const A = 111.28;
  const d = 55.26;
  const z = [
    {},
    { r: R, bond: 0 },
    { r: R, bond: 1, ang: A, angle: 0 },
    { r: R, bond: 2, ang: A, angle: 1, dih: d, dihedral: 0 },
    { r: R, bond: 3, ang: A, angle: 2, dih: -d, dihedral: 1 },
    { r: R, bond: 4, ang: A, angle: 3, dih: d, dihedral: 2 }
  ];
  const hyd = [[0, 1, 5], [1, 0, 2], [2, 1, 3], [3, 2, 4], [4, 3, 5], [5, 4, 0]];
  for (const [carbon, left, right] of hyd) {
    z.push({ r: 1.097, bond: carbon, ang: 109.7, angle: left, dih: 120, dihedral: right });
    z.push({ r: 1.097, bond: carbon, ang: 109.7, angle: left, dih: -120, dihedral: right });
  }
  return { order: [...Array(18).keys()], z };
}

function hydroxyAcid(amino) {
  const heteroR = amino ? 1.47 : 1.43;
  const z = [
    {},
    { r: 1.52, bond: 0 },
    { r: 1.52, bond: 1, ang: T, angle: 0 },
    amino
      ? { r: heteroR, bond: 1, ang: T, angle: 0, dih: 120, dihedral: 2 }
      : { r: heteroR, bond: 1, ang: T, angle: 0, dih: 120, dihedral: 2 },
    { r: CH, bond: 1, ang: T, angle: 0, dih: -120, dihedral: 2 }
  ];
  if (amino) {
    z.push({ r: 1.01, bond: 3, ang: 110, angle: 1, dih: 60, dihedral: 0 });
    z.push({ r: 1.01, bond: 3, ang: 110, angle: 1, dih: -60, dihedral: 0 });
  } else {
    z.push({ r: 0.96, bond: 3, ang: 108, angle: 1, dih: 180, dihedral: 0 });
  }
  z.push({ r: 1.21, bond: 2, ang: 125, angle: 1, dih: 0, dihedral: 0 });
  const hydroxyl = z.length;
  z.push({ r: 1.36, bond: 2, ang: 111, angle: 1, dih: 180, dihedral: 0 });
  z.push({ r: 0.97, bond: hydroxyl, ang: 106, angle: 2, dih: 180, dihedral: 1 });
  z.push(...methyl(0, 1, 2));
  const order = amino
    ? [0, 1, 2, 3, 9, 4, 5, 6, 7, 8, 10, 11, 12]
    : [0, 1, 2, 3, 8, 4, 5, 6, 7, 9, 10, 11];
  return { order, z };
}

function glyceraldehyde() {
  return {
    order: [0, 1, 3, 2, 4, 5, 6, 7, 8, 9, 10, 11],
    z: [
      {},
      { r: 1.21, bond: 0 },
      { r: 1.51, bond: 0, ang: 120, angle: 1 },
      { r: 1.11, bond: 0, ang: 120, angle: 1, dih: 180, dihedral: 2 },
      { r: CH, bond: 2, ang: T, angle: 0, dih: 120, dihedral: 1 },
      { r: 1.43, bond: 2, ang: T, angle: 0, dih: -120, dihedral: 1 },
      { r: 0.96, bond: 5, ang: 108, angle: 2, dih: 180, dihedral: 0 },
      { r: 1.51, bond: 2, ang: T, angle: 0, dih: 0, dihedral: 1 },
      { r: CH, bond: 7, ang: T, angle: 2, dih: 60, dihedral: 4 },
      { r: CH, bond: 7, ang: T, angle: 2, dih: 180, dihedral: 4 },
      { r: 1.43, bond: 7, ang: T, angle: 2, dih: -60, dihedral: 4 },
      { r: 0.96, bond: 10, ang: 108, angle: 7, dih: 180, dihedral: 2 }
    ]
  };
}

function models() {
  return {
    ethanol: ethanol(),
    methanol: methanol(),
    dimethylether: dimethylether(),
    propane: propane(),
    butane: butane(),
    but1ene: alkeneChain(125, 180),
    but2ene: internalAlkene(180),
    cis2butene: internalAlkene(0),
    trans2butene: internalAlkene(180),
    bromobutane: bromobutane(),
    isobutane: isobutane(),
    acetone: acetone(),
    aceticacid: aceticacid(),
    h2o2: h2o2(),
    so2: so2(),
    pcl3: pcl3(),
    hno3: hno3(),
    h2so4: h2so4(),
    h3po4: h3po4(),
    cyclohexane: cyclohexane(),
    lacticacid: hydroxyAcid(false),
    alanine: hydroxyAcid(true),
    glyceraldehyde: glyceraldehyde()
  };
}

function roundPos(pos) {
  return pos.map((coord) => Math.round(coord * 10000) / 10000);
}

export function builtPositions() {
  const out = {};
  for (const [key, spec] of Object.entries(models())) {
    if (spec.order.length !== spec.z.length) {
      throw new Error(`${key} order ${spec.order.length} != z ${spec.z.length}`);
    }
    let pos;
    try {
      pos = positionsFromInternal(spec);
    } catch (error) {
      throw new Error(`${key}: ${error.message}`);
    }
    if (pos.some((point) => !point)) throw new Error(`missing atom in ${key}`);
    out[key] = pos.map(roundPos);
  }
  return out;
}

function formatCoord(value) {
  const rounded = Math.round(value * 10000) / 10000;
  return String(Number(rounded.toFixed(4)));
}

function replaceEntry(text, key, positions) {
  const token = `"${key}":`;
  let depth = 0;
  let start = -1;
  for (let i = 0; i < text.length; i += 1) {
    const ch = text[i];
    if (ch === '{') depth += 1;
    else if (ch === '}') depth -= 1;
    else if (depth === 1 && text.startsWith(token, i)) {
      start = i;
      break;
    }
  }
  if (start < 0) throw new Error(`missing ${key}`);
  let end = start + token.length;
  if (text[end] !== '{') throw new Error(`bad object for ${key}`);
  depth = 0;
  for (; end < text.length; end += 1) {
    if (text[end] === '{') depth += 1;
    else if (text[end] === '}') {
      depth -= 1;
      if (depth === 0) {
        end += 1;
        break;
      }
    }
  }
  let seen = 0;
  const body = text.slice(start, end).replace(/"pos":\[[^\]]+\]/g, () => {
    const pos = positions[seen];
    seen += 1;
    if (!pos) throw new Error(`${key} has more pos arrays than atoms`);
    return `"pos":[${pos.map(formatCoord).join(',')}]`;
  });
  if (seen !== positions.length) throw new Error(`${key} replaced ${seen} positions, expected ${positions.length}`);
  return `${text.slice(0, start)}${body}${text.slice(end)}`;
}

function angDelta(actual, expected) {
  const d = Math.abs(actual - expected) % 360;
  return d > 180 ? 360 - d : d;
}

function checkBuilt(built) {
  const failures = [];
  const expect = (key, ok, label, actual) => {
    if (!ok) failures.push(`${key} ${label} = ${actual}`);
  };
  const angle = (points, a, b, c) => bondAngle(points, a, b, c);
  for (const [key, points] of Object.entries(built)) {
    let min = Infinity;
    for (let i = 0; i < points.length; i += 1) {
      for (let j = i + 1; j < points.length; j += 1) {
        min = Math.min(min, distance(points[i], points[j]));
      }
    }
    expect(key, min > 0.85, 'clash', min.toFixed(3));
  }
  const b = built;
  expect('ethanol', Math.abs(distance(b.ethanol[0], b.ethanol[1]) - 1.512) < 0.02, 'CC', distance(b.ethanol[0], b.ethanol[1]).toFixed(3));
  expect('ethanol', Math.abs(distance(b.ethanol[1], b.ethanol[2]) - 1.431) < 0.02, 'CO', distance(b.ethanol[1], b.ethanol[2]).toFixed(3));
  expect('ethanol', Math.abs(angle(b.ethanol, 0, 1, 2) - 107.8) < 0.3, 'CCO', angle(b.ethanol, 0, 1, 2).toFixed(2));
  expect('ethanol', Math.abs(angle(b.ethanol, 1, 2, 3) - 105.4) < 0.3, 'COH', angle(b.ethanol, 1, 2, 3).toFixed(2));
  expect('methanol', Math.abs(angle(b.methanol, 0, 1, 2) - 108.87) < 0.3, 'COH', angle(b.methanol, 0, 1, 2).toFixed(2));
  expect('dimethylether', Math.abs(angle(b.dimethylether, 0, 1, 2) - 111.2) < 0.3, 'COC', angle(b.dimethylether, 0, 1, 2).toFixed(2));
  expect('butane', Math.abs(angle(b.butane, 0, 1, 2) - 113.8) < 0.3, 'CCC', angle(b.butane, 0, 1, 2).toFixed(2));
  expect('butane', angDelta(dihedral(b.butane, 0, 1, 2, 3), 180) < 1, 'anti', dihedral(b.butane, 0, 1, 2, 3).toFixed(1));
  expect('propane', Math.abs(angle(b.propane, 0, 1, 2) - 113.8) < 0.3, 'CCC', angle(b.propane, 0, 1, 2).toFixed(2));
  expect('acetic', Math.abs(angle(b.aceticacid, 2, 1, 3) - 122.8) < 1, 'OCO', angle(b.aceticacid, 2, 1, 3).toFixed(2));
  expect('acetic', Math.abs(angle(b.aceticacid, 0, 1, 2) - 126.6) < 0.3, 'CC=O', angle(b.aceticacid, 0, 1, 2).toFixed(2));
  expect('acetone', Math.abs(angle(b.acetone, 0, 1, 2) - 116) < 0.3, 'CCC', angle(b.acetone, 0, 1, 2).toFixed(2));
  expect('acetone', Math.abs(angle(b.acetone, 0, 1, 3) - 122) < 0.3, 'CCO', angle(b.acetone, 0, 1, 3).toFixed(2));
  expect('h2o2', Math.abs(Math.abs(dihedral(b.h2o2, 2, 0, 1, 3)) - 119.8) < 0.5, 'dih', dihedral(b.h2o2, 2, 0, 1, 3).toFixed(2));
  expect('h2o2', Math.abs(distance(b.h2o2[0], b.h2o2[1]) - 1.475) < 0.01, 'OO', distance(b.h2o2[0], b.h2o2[1]).toFixed(3));
  expect('so2', Math.abs(angle(b.so2, 1, 0, 2) - 119.5) < 0.2, 'OSO', angle(b.so2, 1, 0, 2).toFixed(2));
  expect('pcl3', Math.abs(angle(b.pcl3, 1, 0, 2) - 100.3) < 0.3, 'ClPCl', angle(b.pcl3, 1, 0, 2).toFixed(2));
  expect('pcl3', Math.abs(angle(b.pcl3, 2, 0, 3) - 100.3) < 0.3, 'ClPCl3', angle(b.pcl3, 2, 0, 3).toFixed(2));
  expect('hno3', Math.abs(angle(b.hno3, 1, 0, 2) - 130) < 0.4, 'ONO', angle(b.hno3, 1, 0, 2).toFixed(2));
  expect('hno3', planeDeviation(b.hno3) < 0.02, 'plane', planeDeviation(b.hno3).toFixed(3));
  expect('h2so4', Math.abs(angle(b.h2so4, 1, 0, 2) - 123) < 0.3, 'OSO', angle(b.h2so4, 1, 0, 2).toFixed(2));
  expect('h2so4', Math.abs(angle(b.h2so4, 0, 3, 5) - 108) < 0.4, 'SOH', angle(b.h2so4, 0, 3, 5).toFixed(2));
  expect('h3po4', Math.abs(angle(b.h3po4, 0, 2, 5) - 110) < 0.4, 'POH', angle(b.h3po4, 0, 2, 5).toFixed(2));
  expect('h3po4', Math.abs(angle(b.h3po4, 1, 0, 2) - T) < 0.4, 'OPO', angle(b.h3po4, 1, 0, 2).toFixed(2));
  const ring = b.cyclohexane.slice(0, 6);
  expect('cyclohexane', Math.abs(angle(b.cyclohexane, 0, 1, 2) - 111.28) < 0.4, 'CCC', angle(b.cyclohexane, 0, 1, 2).toFixed(2));
  expect('cyclohexane', Math.abs(angle(b.cyclohexane, 1, 0, 5) - 111.28) < 1.5, 'CCC0', angle(b.cyclohexane, 1, 0, 5).toFixed(2));
  expect('cyclohexane', Math.abs(distance(b.cyclohexane[5], b.cyclohexane[0]) - 1.53) < 0.04, 'close', distance(b.cyclohexane[5], b.cyclohexane[0]).toFixed(3));
  expect('cyclohexane', planeDeviation(ring) > 0.15 && planeDeviation(ring) < 0.4, 'plane', planeDeviation(ring).toFixed(3));
  expect('cyclohexane', Math.abs(Math.abs(dihedral(b.cyclohexane, 0, 1, 2, 3)) - 55.26) < 2, 'dih', dihedral(b.cyclohexane, 0, 1, 2, 3).toFixed(2));
  expect('lactic', Math.abs(angle(b.lacticacid, 0, 1, 2) - T) < 0.4, 'CCC', angle(b.lacticacid, 0, 1, 2).toFixed(2));
  expect('lactic', Math.abs(angle(b.lacticacid, 0, 1, 3) - T) < 0.4, 'CCO', angle(b.lacticacid, 0, 1, 3).toFixed(2));
  expect('alanine', Math.abs(angle(b.alanine, 0, 1, 3) - T) < 0.4, 'CCN', angle(b.alanine, 0, 1, 3).toFixed(2));
  expect('glyceraldehyde', Math.abs(angle(b.glyceraldehyde, 0, 3, 7) - T) < 0.4, 'CCC', angle(b.glyceraldehyde, 0, 3, 7).toFixed(2));
  expect('bromobutane', Math.abs(angle(b.bromobutane, 0, 1, 2) - 112) < 0.4, 'CCC', angle(b.bromobutane, 0, 1, 2).toFixed(2));
  expect('bromobutane', Math.abs(angle(b.bromobutane, 0, 1, 4) - T) < 0.4, 'CCBr', angle(b.bromobutane, 0, 1, 4).toFixed(2));
  expect('cis', angDelta(dihedral(b.cis2butene, 0, 1, 2, 3), 0) < 2, 'dih', dihedral(b.cis2butene, 0, 1, 2, 3).toFixed(1));
  expect('trans', angDelta(dihedral(b.trans2butene, 0, 1, 2, 3), 180) < 2, 'dih', dihedral(b.trans2butene, 0, 1, 2, 3).toFixed(1));
  expect('but1ene', Math.abs(angle(b.but1ene, 0, 1, 2) - 125) < 0.4, 'sp2', angle(b.but1ene, 0, 1, 2).toFixed(2));
  expect('isobutane', Math.abs(angle(b.isobutane, 1, 0, 2) - 111.15) < 0.3, 'CCC', angle(b.isobutane, 1, 0, 2).toFixed(2));
  expect('isobutane', Math.abs(angle(b.isobutane, 2, 0, 3) - 111.15) < 0.3, 'CCC23', angle(b.isobutane, 2, 0, 3).toFixed(2));
  if (failures.length) {
    console.error(failures.join('\n'));
    process.exitCode = 1;
  } else {
    console.log(`built ${Object.keys(built).length} molecules, angles within target`);
  }
}

function main() {
  const built = builtPositions();
  if (process.argv.includes('--check')) {
    checkBuilt(built);
    return;
  }
  const table = loadMoleculeTable();
  let text = readFileSync(COORDS_FILE_PATH, 'utf8');
  for (const [key, pos] of Object.entries(built)) {
    if (table[key].atoms.length !== pos.length) throw new Error(`${key} atom count changed`);
    text = replaceEntry(text, key, pos);
  }
  const freezeStart = text.indexOf('const COORDS = Object.freeze(');
  const freezeEnd = text.indexOf(');', freezeStart);
  if (text.slice(freezeStart, freezeEnd).includes('\n')) throw new Error('COORDS would no longer be one line');
  writeFileSync(COORDS_FILE_PATH, text);
  console.log(`updated ${Object.keys(built).length} molecules`);
}

if (process.argv[1] && process.argv[1].endsWith('build-molecule-coords.mjs')) main();
