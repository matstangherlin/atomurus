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
const re = /href="([^"]*isomerism\/(?:constitutional|spatial)[^"]*)"/g;
let found = 0;
for (const f of files) {
  const txt = fs.readFileSync(f, 'utf8');
  let m;
  const hits = [];
  while ((m = re.exec(txt))) hits.push(m[1]);
  if (hits.length) {
    found++;
    console.log(f + ' :: ' + [...new Set(hits)].join(' | '));
  }
}
console.log('FILES with isomerism/constitutional|spatial links:', found);
// Also check which pages link to top-level isomerism.html (not viewer/)
const re2 = /href="([^"]*[^v]\/isomerism\.html[^"]*)"/g;
for (const f of files) {
  const txt = fs.readFileSync(f, 'utf8');
  let m;
  const hits = [];
  while ((m = re2.exec(txt))) hits.push(m[1]);
  if (hits.length) {
    console.log('TOP-LEVEL isomerism.html links in ' + f + ' :: ' + [...new Set(hits)].join(' | '));
  }
}
