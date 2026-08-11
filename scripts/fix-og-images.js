// Fix: replace og:image references to files that don't exist (og-atom, og-isotopes,
// og-radioactivity, og-chemical-bonding, og-chernobyl-disaster) with the valid
// og-explore.png across all HTML files (meta og:image, twitter:image, JSON-LD image).
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
const MISSING = [
  'og-atom.png',
  'og-isotopes.png',
  'og-radioactivity.png',
  'og-chemical-bonding.png',
  'og-chernobyl-disaster.png'
];
const REPLACE_WITH = 'og-explore.png';
let total = 0;
const changed = [];
for (const f of files) {
  const txt = fs.readFileSync(f, 'utf8');
  let updated = txt;
  let count = 0;
  MISSING.forEach((name) => {
    const re = new RegExp(name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g');
    const m = (updated.match(re) || []).length;
    if (m) {
      updated = updated.replace(re, REPLACE_WITH);
      count += m;
    }
  });
  if (updated !== txt) {
    fs.writeFileSync(f, updated, 'utf8');
    changed.push(f + ' (' + count + ')');
    total += count;
  }
}
console.log('FILES changed:', changed.length);
changed.forEach((c) => console.log('  ' + c));
console.log('TOTAL og references fixed:', total);
