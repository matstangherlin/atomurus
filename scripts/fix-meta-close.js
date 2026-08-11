// Fix: ensure <meta name="description" ...> tags are properly closed with ">".
// Pre-existing bug: several viewer pages have the description meta unclosed,
// which makes the HTML parser swallow the following <meta> tags.
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
// Match a <meta name="description" ...> tag that is NOT closed before the line end.
const re = /<meta name="description"([^\n]*?)(?<!>)\n/g;
let total = 0;
const changed = [];
for (const f of files) {
  const txt = fs.readFileSync(f, 'utf8');
  const matches = txt.match(re);
  if (!matches || !matches.length) continue;
  const updated = txt.replace(re, '<meta name="description"$1>\n');
  fs.writeFileSync(f, updated, 'utf8');
  changed.push(f + ' (' + matches.length + ')');
  total += matches.length;
}
console.log('FILES fixed:', changed.length);
changed.forEach((c) => console.log('  ' + c));
console.log('TOTAL unclosed description metas closed:', total);
