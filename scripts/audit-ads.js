#!/usr/bin/env node
/**
 * Precise ad audit — list exactly which pages are missing each component.
 * (AdSense is Auto Ads; no manual containers required.)
 */
const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const SKIP = new Set([
  'node_modules', '.git', '.netlify', 'dist', 'build', 'propostas',
  'hanzi-logic', 'scripts', 'tools',
]);

function walk(dir, out) {
  for (const ent of fs.readdirSync(dir, { withFileTypes: true })) {
    if (ent.name.startsWith('.') || SKIP.has(ent.name)) continue;
    const full = path.join(dir, ent.name);
    if (ent.isDirectory()) walk(full, out);
    else if (ent.isFile() && ent.name.toLowerCase().endsWith('.html')) out.push(full);
  }
  return out;
}

const files = walk(ROOT, []).sort();
const noGate = [], noAutoTag = [], noLazy = [];

for (const f of files) {
  const src = fs.readFileSync(f, 'utf8');
  const rel = path.relative(ROOT, f).replace(/\\/g, '/');
  if (!/ads-gate\.js/.test(src)) noGate.push(rel);
  if (!/atomurusRunAutoTag/.test(src)) noAutoTag.push(rel);
  if (!/lazy-ads\.js/.test(src)) noLazy.push(rel);
}

console.log('Total HTML:', files.length);
console.log('\n── Missing ads-gate.js (' + noGate.length + ') ──');
console.log(noGate.join('\n') || '(none)');
console.log('\n── Missing atomurusRunAutoTag (' + noAutoTag.length + ') ──');
console.log(noAutoTag.join('\n') || '(none)');
console.log('\n── Missing lazy-ads.js (GA) (' + noLazy.length + ') ──');
console.log(noLazy.join('\n') || '(none)');
