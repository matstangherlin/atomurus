#!/usr/bin/env node
/**
 * Read-only baseline of the viewer coordinates.
 *   node tools/measure-molecule-geometry.mjs
 */
import { mkdirSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  analyze, bondAngle, dihedral, distance, loadMoleculeTable, planeDeviation
} from './molecule-geometry.mjs';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const OUT = path.join(ROOT, 'docs/viewer/geometria-antes.md');

const DIHEDRAL = {
  butane: [0, 1, 2, 3],
  h2o2: [2, 0, 1, 3],
  cyclohexane: [0, 1, 2, 3]
};
const PLANAR = {
  benzene: [0, 1, 2, 3, 4, 5],
  ethylene: [0, 1, 2, 3, 4, 5],
  formaldehyde: [0, 1, 2, 3],
  hno3: [0, 1, 2, 3, 4]
};

function fmt(n, digits = 2) {
  return Number.isFinite(n) ? n.toFixed(digits) : '—';
}

function main() {
  const table = loadMoleculeTable();
  const keys = Object.keys(table);
  const water = analyze(table.water);
  const oh = water.bonds.find((bond) => bond.labels === 'O-H' || bond.labels === 'H-O');
  const lines = [];
  lines.push('# Geometria 3D — antes');
  lines.push('');
  lines.push('Medido em 26/10/2026 a partir de `netlify/lib/viewer-molecule-coords.mjs`, sem alterar coordenadas.');
  lines.push(`Moléculas: ${keys.length}.`);
  lines.push(`Escala observada na água: distância O–H = ${fmt(oh ? oh.length : NaN, 3)} (o ângulo já é 104,5°). As correções posteriores usam 1 unidade = 1 Å; a água não é reescalada.`);
  lines.push('O elemento de cada átomo 3D vem da cor quando o rótulo do `draw2d` não está na mesma ordem (caso do ácido fosfórico).');
  lines.push('');
  for (const key of keys) {
    const row = table[key];
    const geo = analyze(row);
    lines.push(`## ${key}`);
    lines.push('');
    lines.push(row.desc || '');
    lines.push('');
    lines.push(`Átomos: ${geo.labels.join(' ')}`);
    lines.push('');
    lines.push('| Ligação | Comprimento |');
    lines.push('|---|---:|');
    for (const bond of geo.bonds) lines.push(`| ${bond.labels} (${bond.i}–${bond.j}) | ${fmt(bond.length, 3)} |`);
    lines.push('');
    lines.push('| Ângulo | Graus |');
    lines.push('|---|---:|');
    for (const angle of geo.angles) {
      lines.push(`| ${angle.labels} (${angle.atoms.join('–')}) | ${fmt(angle.deg, 1)} |`);
    }
    if (DIHEDRAL[key]) {
      const [a, b, c, d] = DIHEDRAL[key];
      lines.push('');
      lines.push(`Diedro ${a}–${b}–${c}–${d}: ${fmt(dihedral(geo.points, a, b, c, d), 1)}°`);
    }
    if (PLANAR[key]) {
      const pts = PLANAR[key].map((index) => geo.points[index]);
      lines.push('');
      lines.push(`Desvio do plano (${PLANAR[key].join(',')}): ${fmt(planeDeviation(pts), 3)}`);
    }
    if (key === 'water') {
      lines.push('');
      lines.push(`Ângulo H–O–H conferido: ${fmt(bondAngle(geo.points, 1, 0, 2), 2)}°`);
    }
    lines.push('');
  }
  mkdirSync(path.dirname(OUT), { recursive: true });
  writeFileSync(OUT, lines.join('\n'));
  console.log(`wrote ${path.relative(ROOT, OUT)} (${keys.length} molecules, water O–H ${fmt(oh ? oh.length : NaN, 3)})`);
}

main();
