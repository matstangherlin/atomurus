#!/usr/bin/env node
/**
 * Bump the static asset cache-bust version across all HTML files.
 *
 * The lab-console.css and critical-lab.css were changed (app-shell rules,
 * FOUC guard) but the `?v=202607240244` query stayed the same, so browsers
 * with the old CSS cached serve a broken layout for the isomerism pages
 * (new HTML without inline styles + old CSS without the app-shell).
 *
 * Replaces every `?v=202607240244` with the new version to force a re-fetch.
 */
const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const OLD_V = '202608041600';
const NEW_V = '202608041630';
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

const files = walk(ROOT, []);
let changed = 0;

for (const f of files) {
  const src = fs.readFileSync(f, 'utf8');
  if (!src.includes(OLD_V)) continue;
  const next = src.split(OLD_V).join(NEW_V);
  fs.writeFileSync(f, next, 'utf8');
  changed++;
}
console.log('Version bumped ' + OLD_V + ' -> ' + NEW_V + ' in', changed, 'files');
