#!/usr/bin/env node
const fs = require('fs');
const path = require('path');

const VIEWER = path.resolve(__dirname, '..', 'viewer');

function walk(dir, out) {
  for (const ent of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, ent.name);
    if (ent.isDirectory()) walk(full, out);
    else if (ent.isFile() && /\.html$/i.test(ent.name)) out.push(full);
  }
  return out;
}

const files = walk(path.join(VIEWER, 'isomerism'), []);
for (const name of ['isomerism.html', 'isomerism.pt.html']) {
  const p = path.join(VIEWER, name);
  if (fs.existsSync(p)) files.push(p);
}

const re = /<link rel="stylesheet" href="([^"]*atomurus-lab-console\.css[^"]*)" onload="document\.documentElement\.classList\.remove\('lc-loading'\)">/;
let c = 0;
for (const f of files) {
  let s = fs.readFileSync(f, 'utf8');
  const m = s.match(re);
  if (!m) continue;
  if (s.includes('<noscript><link rel="stylesheet" href="' + m[1])) continue;
  const next = s.replace(m[0], m[0] + '\n<noscript><link rel="stylesheet" href="' + m[1] + '"></noscript>');
  fs.writeFileSync(f, next);
  c++;
  console.log(path.relative(path.resolve(__dirname, '..'), f).replace(/\\/g, '/'));
}
console.log('added noscript', c);
