// Fix 1: Convert the hidden `.wrap h1` mirror in periodic-table element pages to
// a <div class="el-mirror-name"> so pages have a single H1 (SEO).
const fs = require('fs');
const path = require('path');
const files = [];
function walk(d) {
  for (const e of fs.readdirSync(d, { withFileTypes: true })) {
    const f = path.join(d, e.name);
    if (e.isDirectory()) {
      if (e.name === 'node_modules' || e.name.startsWith('.')) continue;
      walk(f);
    } else if (e.name.endsWith('.html')) files.push(f);
  }
}
walk('.');
let total = 0;
const changed = [];
for (const f of files) {
  const norm = f.replace(/\//g, '\\');
  if (!/^periodic-table\\/.test(norm)) continue;
  const txt = fs.readFileSync(f, 'utf8');
  let updated = txt;
  const p1 = /(<div class="wrap"[^>]*>\s*)<h1>/g;
  const p2 = /<\/h1>(\s*<div class="lat">)/g;
  const m1 = (updated.match(p1) || []).length;
  const m2 = (updated.match(p2) || []).length;
  updated = updated.replace(p1, '$1<div class="el-mirror-name">');
  updated = updated.replace(p2, '</div>$1');
  if (updated !== txt) {
    fs.writeFileSync(f, updated, 'utf8');
    changed.push(f + ' (h1-open:' + m1 + ', h1-close:' + m2 + ')');
    total += m1;
  }
}
console.log('FILES changed:', changed.length);
changed.forEach((c) => console.log('  ' + c));
console.log('TOTAL wrap h1 -> div:', total);
