#!/usr/bin/env node
/**
 * SDF / MOL (V2000) → an entry of COORDS in netlify/lib/viewer-molecule-coords.mjs
 * (prompt 31). No dependencies. Not part of the site build.
 *
 *   node tools/build-molecule-from-sdf.mjs            → print the entries and what would change
 *   node tools/build-molecule-from-sdf.mjs --add      → write them into viewer-molecule-coords.mjs
 *   node tools/build-molecule-from-sdf.mjs --dir D    → read D instead of tools/data/raw/molecules
 *
 * Input, per molecule <key> (files the owner downloads from a public source,
 * e.g. PubChem or NIST CCCBDB, with their licence checked):
 *   <key>.sdf      3D record (required; coordinates in Å)
 *   <key>.2d.sdf   2D record (optional; same atoms in the same order)
 *   <key>.json     { "name": "…", "desc": "…", "chiral": false, "source": "…" } (required)
 *
 * Colours and radii come from the molecules already in COORDS (the most used
 * pair per element); an element they do not have stops the conversion. With
 * no 2D record, draw2d is the 3D structure projected on its two main axes
 * (principal components): readable for flat or nearly flat molecules, to be
 * replaced by the source's 2D record when there is one. Both layouts are
 * scaled so the median bond matches the existing drawings.
 */
import { existsSync, readFileSync, readdirSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { COORDS_FILE_PATH, labelsOf, loadMoleculeTable } from './molecule-geometry.mjs';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
export const RAW_DIR = path.join(ROOT, 'tools', 'data', 'raw', 'molecules');
const MARKER = 'const COORDS = Object.freeze(';

// ── MOL V2000 ───────────────────────────────────────────────────────────────
export function parseMolfile(text) {
  const record = String(text).replace(/\r\n?/g, '\n').split('\n$$$$')[0];
  const lines = record.split('\n');
  if (lines.length < 4) throw new Error('not a molfile: header missing');
  const counts = lines[3];
  if (/V3000/.test(counts)) throw new Error('V3000 molfiles are not supported; export V2000');
  if (!/V2000/.test(counts)) throw new Error('counts line without V2000');
  const nAtoms = Number(counts.slice(0, 3));
  const nBonds = Number(counts.slice(3, 6));
  if (!(nAtoms > 0) || !(nBonds >= 0)) throw new Error('bad counts line');
  const atoms = [];
  for (let i = 0; i < nAtoms; i += 1) {
    const line = lines[4 + i] || '';
    const x = Number(line.slice(0, 10));
    const y = Number(line.slice(10, 20));
    const z = Number(line.slice(20, 30));
    const el = line.slice(31, 34).trim();
    if (![x, y, z].every(Number.isFinite) || !/^[A-Z][a-z]?$/.test(el)) throw new Error(`atom line ${i + 1} is malformed`);
    atoms.push({ x, y, z, el });
  }
  const bonds = [];
  for (let i = 0; i < nBonds; i += 1) {
    const line = lines[4 + nAtoms + i] || '';
    const a = Number(line.slice(0, 3)) - 1;
    const b = Number(line.slice(3, 6)) - 1;
    const order = Number(line.slice(6, 9));
    if (!(a >= 0 && a < nAtoms && b >= 0 && b < nAtoms) || a === b) throw new Error(`bond line ${i + 1} is malformed`);
    if (order === 4) throw new Error('aromatic bond (order 4): export the Kekulé form (orders 1 and 2)');
    if (![1, 2, 3].includes(order)) throw new Error(`bond line ${i + 1}: order ${order} not supported`);
    bonds.push({ a, b, order });
  }
  return { title: lines[0].trim(), atoms, bonds };
}

export function is3D(mol) {
  return mol.atoms.some((a) => Math.abs(a.z) > 1e-4);
}

// ── Palette from the existing molecules ─────────────────────────────────────
export function elementPalette(table = loadMoleculeTable()) {
  const tally = {};
  for (const row of Object.values(table)) {
    const labels = labelsOf(row);
    row.atoms.forEach((atom, i) => {
      const el = labels[i];
      if (!/^[A-Z][a-z]?$/.test(el || '')) return;
      const key = atom.r + '|' + atom.color;
      tally[el] = tally[el] || {};
      tally[el][key] = (tally[el][key] || 0) + 1;
    });
  }
  const out = {};
  for (const [el, pairs] of Object.entries(tally)) {
    const [best] = Object.entries(pairs).sort((x, y) => y[1] - x[1] || (x[0] < y[0] ? -1 : 1));
    const [r, color] = best[0].split('|').map(Number);
    out[el] = { r, color };
  }
  return out;
}

export function medianDraw2dBond(table = loadMoleculeTable()) {
  const lengths = [];
  for (const row of Object.values(table)) {
    const d = row.draw2d;
    if (!d) continue;
    for (const b of d.bonds) lengths.push(Math.hypot(d.atoms[b.a].x - d.atoms[b.b].x, d.atoms[b.a].y - d.atoms[b.b].y));
  }
  lengths.sort((a, b) => a - b);
  return lengths.length ? lengths[lengths.length >> 1] : 1.5;
}

// ── Geometry helpers ────────────────────────────────────────────────────────
const round = (v, d = 4) => Number((Math.round(v * 10 ** d) / 10 ** d).toFixed(d));

function centroid(points) {
  const c = [0, 0, 0];
  points.forEach((p) => { c[0] += p[0]; c[1] += p[1]; c[2] += p[2]; });
  return c.map((v) => v / points.length);
}

/* The two main axes of a 3D point cloud (power iteration on the covariance). */
function principalAxes(points) {
  const c = centroid(points);
  const q = points.map((p) => [p[0] - c[0], p[1] - c[1], p[2] - c[2]]);
  const cov = [0, 1, 2].map((i) => [0, 1, 2].map((j) => q.reduce((s, p) => s + p[i] * p[j], 0)));
  const mul = (m, v) => [0, 1, 2].map((i) => m[i][0] * v[0] + m[i][1] * v[1] + m[i][2] * v[2]);
  const norm = (v) => { const l = Math.hypot(...v) || 1; return v.map((x) => x / l); };
  const axis = (m, seed) => { let v = norm(seed); for (let k = 0; k < 200; k += 1) v = norm(mul(m, v)); return v; };
  const e1 = axis(cov, [1, 0.31, 0.17]);
  const l1 = Math.hypot(...mul(cov, e1));
  const deflated = cov.map((row, i) => row.map((x, j) => x - l1 * e1[i] * e1[j]));
  let e2 = axis(deflated, [0.13, 1, 0.29]);
  const d = e2[0] * e1[0] + e2[1] * e1[1] + e2[2] * e1[2];
  e2 = norm([e2[0] - d * e1[0], e2[1] - d * e1[1], e2[2] - d * e1[2]]);
  return { c, e1, e2 };
}

export function projectTo2D(atoms) {
  const points = atoms.map((a) => [a.x, a.y, a.z]);
  const { c, e1, e2 } = principalAxes(points);
  return points.map((p) => {
    const v = [p[0] - c[0], p[1] - c[1], p[2] - c[2]];
    return { x: v[0] * e1[0] + v[1] * e1[1] + v[2] * e1[2], y: v[0] * e2[0] + v[1] * e2[1] + v[2] * e2[2] };
  });
}

function scaled2d(points, bonds, target) {
  const lengths = bonds.map((b) => Math.hypot(points[b.a].x - points[b.b].x, points[b.a].y - points[b.b].y)).sort((a, b) => a - b);
  const median = lengths.length ? lengths[lengths.length >> 1] : 1;
  const k = median > 1e-6 ? target / median : 1;
  const cx = points.reduce((s, p) => s + p.x, 0) / points.length;
  const cy = points.reduce((s, p) => s + p.y, 0) / points.length;
  return points.map((p) => ({ x: round((p.x - cx) * k, 3), y: round((p.y - cy) * k, 3) }));
}

// ── Entry ───────────────────────────────────────────────────────────────────
export function toViewerEntry({ mol3d, mol2d = null, meta, palette = elementPalette(), bond2d = medianDraw2dBond() }) {
  if (!meta || !String(meta.name || '').trim() || !String(meta.desc || '').trim()) throw new Error('meta needs name and desc');
  if (!is3D(mol3d)) throw new Error('the 3D record is flat (all z = 0): download the 3D conformer');
  const missing = [...new Set(mol3d.atoms.map((a) => a.el).filter((el) => !palette[el]))];
  if (missing.length) throw new Error(`no colour/radius in COORDS for ${missing.join(', ')}: decide them before converting`);
  if (mol2d) {
    if (mol2d.atoms.length !== mol3d.atoms.length || mol2d.atoms.some((a, i) => a.el !== mol3d.atoms[i].el)) {
      throw new Error('the 2D record does not list the same atoms in the same order as the 3D one');
    }
  }
  const c = centroid(mol3d.atoms.map((a) => [a.x, a.y, a.z]));
  const atoms = mol3d.atoms.map((a) => ({
    pos: [round(a.x - c[0]), round(a.y - c[1]), round(a.z - c[2])],
    r: palette[a.el].r,
    color: palette[a.el].color
  }));
  const bonds = mol3d.bonds.map((b) => (b.order > 1 ? [b.a, b.b, b.order] : [b.a, b.b]));
  const flat = mol2d ? mol2d.atoms.map((a) => ({ x: a.x, y: a.y })) : projectTo2D(mol3d.atoms);
  const xy = scaled2d(flat, mol3d.bonds, bond2d);
  const entry = {
    name: String(meta.name).trim(),
    desc: String(meta.desc).trim(),
    draw2d: {
      atoms: xy.map((p, i) => ({ x: p.x, y: p.y, label: mol3d.atoms[i].el })),
      bonds: mol3d.bonds.map((b) => ({ a: b.a, b: b.b, order: b.order }))
    },
    atoms,
    bonds
  };
  if (meta.chiral) entry.chiral = true;
  return entry;
}

/* COORDS stays one line of JSON; the new key goes at the end. */
export function insertEntry(fileText, key, entry) {
  if (!/^[a-z][a-z0-9-]{0,62}$/.test(key)) throw new Error('bad key ' + key);
  const start = fileText.indexOf(MARKER);
  if (start < 0) throw new Error('COORDS not found');
  const jsonStart = start + MARKER.length;
  const jsonEnd = fileText.lastIndexOf(');', fileText.indexOf('\nexport const VIEWER_MOLECULE_KEYS', jsonStart));
  const slice = fileText.slice(jsonStart, jsonEnd);
  const table = JSON.parse(slice);
  if (JSON.stringify(table) !== slice) throw new Error('COORDS is not plain one-line JSON any more: refusing to rewrite it');
  if (Object.prototype.hasOwnProperty.call(table, key)) throw new Error(`${key} is already in COORDS: existing molecules are not rewritten here`);
  table[key] = entry;
  return fileText.slice(0, jsonStart) + JSON.stringify(table) + fileText.slice(jsonEnd);
}

export function readRaw(dir = RAW_DIR) {
  if (!existsSync(dir)) return [];
  const keys = readdirSync(dir).filter((f) => /^[a-z][a-z0-9-]*\.sdf$/.test(f) && !f.endsWith('.2d.sdf')).map((f) => f.replace(/\.sdf$/, '')).sort();
  return keys.map((key) => {
    const file = (ext) => path.join(dir, key + ext);
    if (!existsSync(file('.json'))) throw new Error(`${key}: ${key}.json (name, desc, source) is missing`);
    return {
      key,
      mol3d: parseMolfile(readFileSync(file('.sdf'), 'utf8')),
      mol2d: existsSync(file('.2d.sdf')) ? parseMolfile(readFileSync(file('.2d.sdf'), 'utf8')) : null,
      meta: JSON.parse(readFileSync(file('.json'), 'utf8'))
    };
  });
}

const isMain = process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url);
if (isMain) {
  const args = process.argv.slice(2);
  const dirAt = args.indexOf('--dir');
  const dir = dirAt !== -1 ? path.resolve(args[dirAt + 1]) : RAW_DIR;
  let inputs;
  try {
    inputs = readRaw(dir);
  } catch (err) {
    console.error('build-molecule-from-sdf: ' + err.message);
    process.exit(1);
  }
  if (!inputs.length) {
    console.log(`build-molecule-from-sdf: no SDF in ${path.relative(ROOT, dir) || dir} — nothing to convert (see docs/viewer/novas-moleculas-pendencias.md)`);
    process.exit(0);
  }
  const palette = elementPalette();
  const bond2d = medianDraw2dBond();
  let text = readFileSync(COORDS_FILE_PATH, 'utf8');
  for (const input of inputs) {
    let entry;
    try {
      entry = toViewerEntry({ ...input, palette, bond2d });
      text = insertEntry(text, input.key, entry);
    } catch (err) {
      console.error(`build-molecule-from-sdf: ${input.key}: ${err.message}`);
      process.exit(1);
    }
    console.log(`+ ${input.key}: ${entry.atoms.length} atoms, ${entry.bonds.length} bonds, draw2d ${input.mol2d ? 'from the 2D record' : 'projected from 3D'}`);
    console.log(`  "${input.key}":${JSON.stringify(entry)}`);
    if (input.meta.source) console.log(`  source: ${input.meta.source}`);
  }
  if (args.includes('--add')) {
    writeFileSync(COORDS_FILE_PATH, text);
    console.log(`build-molecule-from-sdf: wrote ${inputs.length} molecule(s) into ${path.relative(ROOT, COORDS_FILE_PATH)}.`);
    console.log('Next: names/descriptions in tools/i18n-dict-source.js (molecules.mol.<key>), npm run build:i18n-assets, references in tools/data/molecule-geometry-reference.json, npm run test:molecules.');
  } else {
    console.log('build-molecule-from-sdf: dry run — nothing written (use --add).');
  }
}
