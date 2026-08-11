// Harden inline atomurusRunAutoTag({...}) calls so a failed ads-gate.js load
// (ad blocker, network) never throws a ReferenceError on the page.
// Transforms:  atomurusRunAutoTag({...})  ->  (window.atomurusRunAutoTag||function(){})({...})
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
const re = /\batomurusRunAutoTag\(/g;
let total = 0;
const changed = [];
for (const f of files) {
  const txt = fs.readFileSync(f, 'utf8');
  const matches = txt.match(/\batomurusRunAutoTag\(/g);
  if (!matches) continue;
  re.lastIndex = 0;
  const updated = txt.replace(re, '(window.atomurusRunAutoTag||function(){})(');
  if (updated !== txt) {
    fs.writeFileSync(f, updated, 'utf8');
    changed.push(f + ' (' + matches.length + ')');
    total += matches.length;
  }
}
console.log('FILES changed:', changed.length);
changed.forEach((c) => console.log('  ' + c));
console.log('TOTAL calls hardened:', total);
