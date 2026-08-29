/**
 * One-shot extractor: pull inline molData from viewer/molecules.html
 * into the server-authorized coords module, then strip coordinates
 * from the public HTML shells.
 */
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const HTML_FILES = [
  path.join(ROOT, 'viewer', 'molecules.html'),
  path.join(ROOT, 'viewer', 'molecules.pt.html')
];
const OUT = path.join(ROOT, 'netlify', 'lib', 'viewer-molecule-coords.mjs');

const FETCH_STUB = `  const molData = Object.create(null);
  const molFetch = Object.create(null);
  function isSafeMolKey(key) {
    return typeof key === 'string' && /^[a-z][a-z0-9-]{0,62}$/.test(key);
  }
  function fetchMolecule(key) {
    if (!isSafeMolKey(key)) return Promise.reject(new Error('invalid molecule'));
    if (molData[key] && molData[key].atoms) return Promise.resolve(molData[key]);
    if (molFetch[key]) return molFetch[key];
    molFetch[key] = fetch('/api/pro-lab/viewer/molecule?key=' + encodeURIComponent(key), {
      credentials: 'include',
      headers: { Accept: 'application/json' },
      cache: 'no-store'
    }).then(function (res) {
      return res.json().then(function (data) {
        if (!res.ok || !data || !data.ok || !data.molecule || !Array.isArray(data.molecule.atoms)) {
          throw new Error((data && data.error) || 'molecule unavailable');
        }
        molData[key] = data.molecule;
        return data.molecule;
      });
    }).catch(function (err) {
      delete molFetch[key];
      throw err;
    });
    return molFetch[key];
  }
`;

function extractObject(html, marker) {
  const start = html.indexOf(marker);
  if (start < 0) throw new Error(`marker not found: ${marker}`);
  const brace = html.indexOf('{', start);
  let depth = 0;
  for (let i = brace; i < html.length; i++) {
    const c = html[i];
    if (c === '{') depth++;
    else if (c === '}') {
      depth--;
      if (depth === 0) return { start, end: i + 1, src: html.slice(brace, i + 1) };
    }
  }
  throw new Error('unbalanced object');
}

function writeCoordsModule(molData) {
  const keys = Object.keys(molData);
  const body = `'use strict';

/**
 * Visualization coordinates for the public molecule viewer.
 * Canonical identities (id, formula, names) live in canonical-molecules.mjs.
 * Coordinates are teaching models, not measured geometry.
 */

export const MOLECULE_KEY_RE = /^[a-z][a-z0-9-]{0,62}$/;

const COORDS = Object.freeze(${JSON.stringify(molData)});

export const VIEWER_MOLECULE_KEYS = Object.freeze(Object.keys(COORDS));

export function isSafeMoleculeKey(value) {
  const key = String(value || '').trim().toLowerCase();
  if (!MOLECULE_KEY_RE.test(key)) return false;
  if (key.includes('..') || key.includes('/') || key.includes('\\\\')) return false;
  return Object.prototype.hasOwnProperty.call(COORDS, key);
}

export function publicMoleculePreview(key) {
  if (!isSafeMoleculeKey(key)) return null;
  const row = COORDS[key];
  return {
    key,
    name: row.name || key,
    desc: row.desc || ''
  };
}

export function viewerMoleculePayload(key) {
  if (!isSafeMoleculeKey(key)) return null;
  const row = COORDS[key];
  const payload = {
    key,
    name: row.name || key,
    desc: row.desc || '',
    atoms: row.atoms,
    bonds: row.bonds
  };
  if (row.draw2d) payload.draw2d = row.draw2d;
  if (row.chiral) payload.chiral = true;
  return payload;
}
`;
  fs.writeFileSync(OUT, body);
  return keys;
}

function patchHtml(file, keys) {
  let html = fs.readFileSync(file, 'utf8');
  const block = extractObject(html, '  const molData = {');
  html = html.slice(0, block.start) + FETCH_STUB + html.slice(block.end);

  html = html.replace(
    'atomurusBootViewer(document.getElementById(\'viewer3d\'), function () {',
    'atomurusBootProViewer(document.getElementById(\'viewer3d\'), \'moleculeViewer\', function () {'
  );
  html = html.replace(
    '  window.setMolecule = function(key, skipUrl){\n    if (!molData[key]) return;\n',
    `  window.setMolecule = function(key, skipUrl){
    fetchMolecule(key).then(function () {
      applyMolecule(key, skipUrl);
    }).catch(function () {
      if (typeof window.atomurusShowProViewerError === 'function') {
        window.atomurusShowProViewerError(document.getElementById('viewer3d'));
      }
    });
  };
  function applyMolecule(key, skipUrl){
    if (!molData[key] || !molData[key].atoms) return;
`
  );

  html = html.replace(
    `  setMolecule(initialMol, true);
  animate();`,
    `  fetchMolecule(initialMol).then(function () {
    window.setMolecule(initialMol, true);
    animate();
  }).catch(function () {
    if (typeof window.atomurusShowProViewerError === 'function') {
      window.atomurusShowProViewerError(document.getElementById('viewer3d'));
    }
  });`
  );

  html = html.replace(
    'src="load-three.js?v=202608041630"',
    'src="load-three.js?v=202608290330"'
  );

  fs.writeFileSync(file, html);
  console.log('patched', path.relative(ROOT, file), 'keys', keys.length);
}

const sourceHtml = fs.readFileSync(HTML_FILES[0], 'utf8');
const extracted = extractObject(sourceHtml, '  const molData = {');
const molData = vm.runInNewContext('(' + extracted.src + ')');
const keys = writeCoordsModule(molData);
console.log('wrote', path.relative(ROOT, OUT), keys.length, 'molecules');
for (const file of HTML_FILES) patchHtml(file, keys);
