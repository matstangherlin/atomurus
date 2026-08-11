#!/usr/bin/env node
/**
 * Remove the legacy inline viewer design from the isomerism pages so the
 * site-wide lab design (atomurus-lab-console.css) fully controls them.
 *
 * The isomerism pages shipped with a big inline <style> block (DM Sans,
 * --bg-gradient, old sidebar/topbar/component styles) that OVERRODE the lab
 * design, making the isomerism tab look different from the rest of the site.
 * The lab-console stylesheet already contains the complete new design, so we:
 *
 *   1. Delete that inline <style> block (from the `*,*::before,*::after`
 *      reset marker to its closing </style>).
 *   2. Mark <body> with the `iso-page` class so the app-shell rules in
 *      atomurus-lab-console.css (body.iso-page …) apply at parse time.
 *
 * Idempotent: files already converted are skipped.
 */
const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const VIEWER_ISO = path.join(ROOT, 'viewer', 'isomerism');

// The legacy block: <style> ... *,*::before,*::after{box-sizing:border-box;margin:0;padding:0} ... </style>
const OLD_BLOCK = /<style>\s*\*,\*::before,\*::after\{box-sizing:border-box;margin:0;padding:0\}[\s\S]*?<\/style>/;

function walk(dir, out) {
  for (const ent of fs.readdirSync(dir, { withFileTypes: true })) {
    if (ent.name.startsWith('.')) continue;
    const full = path.join(dir, ent.name);
    if (ent.isDirectory()) walk(full, out);
    else if (ent.isFile() && ent.name.toLowerCase().endsWith('.html')) out.push(full);
  }
  return out;
}

const files = walk(VIEWER_ISO, []);
// The isomerism hub pages live directly in viewer/ (viewer/isomerism.html)
for (const name of ['isomerism.html', 'isomerism.pt.html']) {
  const hub = path.join(ROOT, 'viewer', name);
  if (fs.existsSync(hub)) files.push(hub);
}
let changed = 0;

for (const f of files) {
  let src = fs.readFileSync(f, 'utf8');
  const orig = src;

  if (OLD_BLOCK.test(src)) {
    src = src.replace(OLD_BLOCK, '');
  }

  // Mark the body as an app-shell page (unless it already has a class)
  if (/<body(?![^>]*class=)[^>]*>/.test(src)) {
    src = src.replace(/<body(?![^>]*class=)/, '<body class="iso-page"');
  }

  if (src !== orig) {
    fs.writeFileSync(f, src, 'utf8');
    changed++;
    console.log('fixed', path.relative(ROOT, f).replace(/\\/g, '/'));
  }
}
console.log('Files changed:', changed);
