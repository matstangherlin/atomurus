#!/usr/bin/env node
import { createRequire } from 'node:module';
import { readFileSync, existsSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const lab = readFileSync(join(root, 'viewer/runtime/paper-lab.js'), 'utf8');
const allotrope = readFileSync(join(root, 'viewer/runtime/allotrope-viewer.js'), 'utf8');
const molecule = readFileSync(join(root, 'viewer/runtime/molecule-viewer.js'), 'utf8');
const atomic = readFileSync(join(root, 'viewer/runtime/atomic-viewer.js'), 'utf8');
const iso3d = readFileSync(join(root, 'viewer/isomerism/isomerism-3d.js'), 'utf8');
const mol = readFileSync(join(root, 'explore/viewer/mol-viewer.js'), 'utf8');
const load = readFileSync(join(root, 'viewer/load-three.js'), 'utf8');
const audit = join(root, 'docs/3d-performance-audit.md');

function assert(c, m) { if (!c) throw new Error(m); }

assert(lab.includes('function disposeObject3D'), 'disposeObject3D');
assert(lab.includes('function markShared'), 'shared resource mark');
assert(lab.includes('function isShared'), 'skip dispose of shared geo/mat');
assert(lab.includes('function addInstancedSpheres'), 'instanced spheres');
assert(lab.includes('function addInstancedBonds'), 'instanced bonds');
assert(lab.includes('function capDpr'), 'adaptive DPR');
assert(/cores\s*<=\s*2/.test(lab), 'weak-device DPR cap is ≤2 cores, not typical laptops');
assert(lab.includes('function introSpin'), 'intro spin then idle');
assert(lab.includes('document.hidden'), 'hidden tab pause');
assert(lab.includes('IntersectionObserver'), 'offscreen pause');
assert(lab.includes('bindStats'), 'dev renderer.info hook');
assert(allotrope.includes('addInstancedSpheres'), 'allotrope instanced atoms');
assert(allotrope.includes('addInstancedBonds'), 'allotrope instanced bonds');
assert(allotrope.includes('addBondList'), 'sequential bond helper for S8 / P red');
{
  // S8 (and red P) bonds come from explicit lists in the data module: the ring
  // is bonded in sequence, never by "nearby" distance, which would add chords
  const A = createRequire(import.meta.url)(join(root, 'assets/chem/allotrope-data.js'));
  const s8 = A.model('s_rhombic');
  assert(s8.bonds.length === 8 && s8.bonds.every((b, i) => b[0] === i && b[1] === (i + 1) % 8), 'S8 keeps sequential ring bonds, not nearby chords');
  assert(allotrope.includes('m.bonds.forEach'), 'allotrope runtime draws the listed bonds');
}
assert(allotrope.includes('replaceChild'), 'allotrope dispose on rebuild');
assert(allotrope.includes('liveLoop.wake'), 'allotrope wakes render loop on rebuild');
assert(molecule.includes('replaceChild'), 'molecule dispose on rebuild');
assert(molecule.includes('liveLoop.wake'), 'molecule wakes render loop on rebuild');
assert(molecule.includes('sphereMesh'), 'molecule shared spheres');
assert(atomic.includes('replaceChild'), 'atomic dispose on rebuild');
assert(atomic.includes('liveLoop.wake'), 'atomic wakes render loop on rebuild');
assert(iso3d.includes('disposeObject3D'), 'isomerism dispose');
assert(iso3d.includes('introSpin'), 'isomerism intro spin');
assert(iso3d.includes('liveLoop.wake'), 'isomerism wakes render loop on paint');
assert(mol.includes('replaceChild'), 'explore mol dispose');
assert(mol.includes('liveLoop.wake'), 'explore mol wakes render loop on rebuild');
assert(load.includes('requestIdleCallback') || load.includes('prefetch'), 'Three.js idle prefetch');
assert(existsSync(audit), 'docs/3d-performance-audit.md');
const md = readFileSync(audit, 'utf8');
assert(md.includes('BEFORE') && md.includes('AFTER'), 'audit has before/after');
assert(md.includes('InstancedMesh'), 'audit mentions instancing');

console.log('test-viewer-perf: ok');
