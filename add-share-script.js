// ───────────────────────────────────────────────────────────────────
// Atomurus — one-time migration: load share-button.js + initializer
// ───────────────────────────────────────────────────────────────────
//  - Element pages: share-button.js BEFORE element-page.js
//                  (element-page.js calls injectShareButton itself).
//  - All other "page-share" targets: share-button.js + page-share-init.js.
//
// Targets for the generic init:
//   /periodic-table.html
//   /periodic-table/{heatmap,trends,compare,isotopes}.html
//   /viewer/atomic-models/*.html
//   /calculators.html
//
// Idempotent — re-running skips files already migrated.
// ───────────────────────────────────────────────────────────────────

'use strict';

const fs   = require('fs');
const path = require('path');

const ROOT = __dirname;
const VERSION = '202605250317'; // placeholder; bump-version.js refreshes ?v= later

function readWrite(file, transform) {
  const before = fs.readFileSync(file, 'utf8');
  const after  = transform(before);
  if (after === before) return false;
  fs.writeFileSync(file, after, 'utf8');
  return true;
}

let stats = { elements: 0, periodicTabs: 0, atomicModels: 0, calculators: 0, skipped: 0 };

// ── 1) Element pages — share-button.js after elements-content.js
//    (element-page.js already calls window.injectShareButton itself)
const elementDir = path.join(ROOT, 'periodic-table');
const elementFiles = fs.readdirSync(elementDir)
  .filter(f => f.endsWith('.html') && !f.endsWith('.pt.html') && !f.endsWith('.en.html'))
  .filter(f => !['heatmap.html','trends.html','compare.html','isotopes.html'].includes(f))
  .map(f => path.join(elementDir, f));

for (const file of elementFiles) {
  const changed = readWrite(file, html => {
    if (html.includes('share-button.js')) return html;
    return html.replace(
      /(<script src="\.\.\/elements-content\.js\?v=\d+" defer><\/script>)/,
      '$1\n<script src="../share-button.js?v=' + VERSION + '" defer></script>'
    );
  });
  if (changed) stats.elements++; else stats.skipped++;
}

// ── 2) Periodic-table sub-tabs (heatmap/trends/compare/isotopes)
//    Need share-button.js + page-share-init.js
const tabFiles = ['heatmap.html', 'trends.html', 'compare.html', 'isotopes.html']
  .map(f => path.join(elementDir, f))
  .filter(p => fs.existsSync(p));

for (const file of tabFiles) {
  const changed = readWrite(file, html => {
    if (html.includes('page-share-init.js')) return html;
    // Anchor after the i18n.js script — both new scripts are deferred
    // and run in order after i18n.js sets up I18N.
    return html.replace(
      /(<script src="\.\.\/i18n\.js\?v=\d+" defer><\/script>)/,
      '$1\n<script src="../share-button.js?v=' + VERSION + '" defer></script>' +
      '\n<script src="../page-share-init.js?v=' + VERSION + '" defer></script>'
    );
  });
  if (changed) stats.periodicTabs++; else stats.skipped++;
}

// ── 3) Atomic-model pages — share-button.js + page-share-init.js
//    (Replaces the older atomic-model-share-init.js loader.)
const amDir = path.join(ROOT, 'viewer', 'atomic-models');
const amFiles = fs.readdirSync(amDir)
  .filter(f => f.endsWith('.html') && !f.endsWith('.pt.html') && !f.endsWith('.en.html'))
  .map(f => path.join(amDir, f));

for (const file of amFiles) {
  const changed = readWrite(file, html => {
    // Remove legacy atomic-model-share-init.js if present so we don't
    // double-inject the share button.
    html = html.replace(
      /\s*<script src="\.\.\/\.\.\/atomic-model-share-init\.js\?v=\d+" defer><\/script>/g,
      ''
    );
    if (html.includes('page-share-init.js')) return html;
    // Insert (or re-insert) the share scripts. share-button.js may
    // already be present from the previous migration — if so, only add
    // page-share-init.js.
    if (html.includes('share-button.js')) {
      return html.replace(
        /(<script src="\.\.\/\.\.\/share-button\.js\?v=\d+" defer><\/script>)/,
        '$1\n<script src="../../page-share-init.js?v=' + VERSION + '" defer></script>'
      );
    }
    return html.replace(
      /(<script src="\.\.\/\.\.\/i18n\.js\?v=\d+" defer><\/script>)/,
      '$1\n<script src="../../share-button.js?v=' + VERSION + '" defer></script>' +
      '\n<script src="../../page-share-init.js?v=' + VERSION + '" defer></script>'
    );
  });
  if (changed) stats.atomicModels++; else stats.skipped++;
}

// ── 4) Periodic-table main page + Calculators (root-level HTMLs)
const rootTargets = ['periodic-table.html', 'calculators.html']
  .map(f => path.join(ROOT, f))
  .filter(p => fs.existsSync(p));

for (const file of rootTargets) {
  const changed = readWrite(file, html => {
    if (html.includes('page-share-init.js')) return html;
    return html.replace(
      /(<script src="i18n\.js\?v=\d+" defer><\/script>)/,
      '$1\n<script src="share-button.js?v=' + VERSION + '" defer></script>' +
      '\n<script src="page-share-init.js?v=' + VERSION + '" defer></script>'
    );
  });
  if (changed) {
    if (file.endsWith('calculators.html')) stats.calculators++;
    else stats.periodicTabs++;
  } else stats.skipped++;
}

// ── 5) Home (index.html) — root, same path depth as #4 but uses
//    .lc-topnav instead of .topbar. page-share-init.js handles both.
const homeFile = path.join(ROOT, 'index.html');
if (fs.existsSync(homeFile)) {
  const changed = readWrite(homeFile, html => {
    if (html.includes('page-share-init.js')) return html;
    return html.replace(
      /(<script src="i18n\.js\?v=\d+" defer><\/script>)/,
      '$1\n<script src="share-button.js?v=' + VERSION + '" defer></script>' +
      '\n<script src="page-share-init.js?v=' + VERSION + '" defer></script>'
    );
  });
  if (changed) stats.home = (stats.home || 0) + 1;
  else stats.skipped++;
}

// ── 6) Viewer roots (molecules, allotropes, atomic-models OVERVIEW)
//    These are one level deep (viewer/X.html), so script paths use "../".
//    Skipped: config / terms / privacy / about / contact (user request).
const viewerRoots = ['viewer/molecules.html', 'viewer/allotropes.html', 'viewer/atomic-models.html']
  .map(f => path.join(ROOT, f))
  .filter(p => fs.existsSync(p));

for (const file of viewerRoots) {
  const changed = readWrite(file, html => {
    if (html.includes('page-share-init.js')) return html;
    // Anchor right after i18n.js (one level up: ../i18n.js).
    return html.replace(
      /(<script src="\.\.\/i18n\.js\?v=\d+" defer><\/script>)/,
      '$1\n<script src="../share-button.js?v=' + VERSION + '" defer></script>' +
      '\n<script src="../page-share-init.js?v=' + VERSION + '" defer></script>'
    );
  });
  if (changed) stats.viewers = (stats.viewers || 0) + 1;
  else stats.skipped++;
}

console.log('Element pages updated:', stats.elements);
console.log('Periodic-table tabs (including main):', stats.periodicTabs);
console.log('Atomic-model pages updated:', stats.atomicModels);
console.log('Calculators page updated:', stats.calculators);
console.log('Home (index.html) updated:', stats.home || 0);
console.log('Viewer roots updated:', stats.viewers || 0);
console.log('Skipped (already migrated):', stats.skipped);
