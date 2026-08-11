#!/usr/bin/env node
/**
 * Point isomerism viewer pages at atomurus-lab-console.css (canonical, same as
 * molecules/allotropes) and load it as a blocking stylesheet so the layout
 * base we restored is applied before first paint.
 */
const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const VIEWER = path.join(ROOT, 'viewer');

function walk(dir, out) {
  for (const ent of fs.readdirSync(dir, { withFileTypes: true })) {
    if (ent.name.startsWith('.')) continue;
    const full = path.join(dir, ent.name);
    if (ent.isDirectory()) walk(full, out);
    else if (ent.isFile() && ent.name.toLowerCase().endsWith('.html')) out.push(full);
  }
  return out;
}

const files = walk(path.join(VIEWER, 'isomerism'), []);
for (const name of ['isomerism.html', 'isomerism.pt.html']) {
  const hub = path.join(VIEWER, name);
  if (fs.existsSync(hub)) files.push(hub);
}

let changed = 0;
for (const f of files) {
  let src = fs.readFileSync(f, 'utf8');
  const orig = src;

  src = src.split('atomurus-lab.css').join('atomurus-lab-console.css');

  src = src.replace(
    /[ \t]*<link rel="preload" href="([^"]*atomurus-lab-console\.css[^"]*)" as="style">\r?\n/g,
    ''
  );

  src = src.replace(
    /<link rel="stylesheet" href="([^"]*atomurus-lab-console\.css[^"]*)" media="print" onload="this\.media='all';document\.documentElement\.classList\.remove\('lc-loading'\)">/g,
    '<link rel="stylesheet" href="$1" onload="document.documentElement.classList.remove(\'lc-loading\')">'
  );

  src = src.replace(
    /\r?\n?[ \t]*<noscript><link rel="stylesheet" href="[^"]*atomurus-lab-console\.css[^"]*"><\/noscript>/g,
    ''
  );

  if (src !== orig) {
    fs.writeFileSync(f, src, 'utf8');
    changed++;
    console.log('fixed', path.relative(ROOT, f).replace(/\\/g, '/'));
  }
}
console.log('Files changed:', changed);
