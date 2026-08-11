// Fix: demote the embedded Settings module's H1 (config.title) to H2 so pages
// with an embedded settings sub-view keep exactly one H1 (SEO).
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
const re = /<h1 class="ph-title" data-i18n="config\.title">([^<]*)<\/h1>/g;
let total = 0;
const changed = [];
for (const f of files) {
  const txt = fs.readFileSync(f, 'utf8');
  const m = (txt.match(re) || []).length;
  if (!m) continue;
  const updated = txt.replace(re, '<h2 class="ph-title" data-i18n="config.title">$1</h2>');
  fs.writeFileSync(f, updated, 'utf8');
  changed.push(f + ' (' + m + ')');
  total += m;
}
console.log('FILES changed:', changed.length);
changed.forEach((c) => console.log('  ' + c));
console.log('TOTAL config.title h1 -> h2:', total);
