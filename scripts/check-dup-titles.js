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
const byTitle = {};
for (const f of files) {
  const norm = f.replace(/\//g, '\\');
  if (/\\propostas\\|\\hanzi-logic\\|\\netlify\\|\\tools\\|\\scripts\\/.test(norm)) continue;
  if (/^isomerism\\/.test(norm) || norm === 'isomerism.html' || norm === 'isomerism.pt.html') continue;
  const t = fs.readFileSync(f, 'utf8');
  const noindex = /<meta name="robots" content="[^"]*noindex/.test(t);
  if (noindex) continue;
  const title = ((t.match(/<title[^>]*>([^<]*)<\/title>/) || [])[1] || '').trim();
  if (!title) continue;
  (byTitle[title] = byTitle[title] || []).push(f);
}
let dup = 0;
Object.keys(byTitle).sort().forEach((title) => {
  const list = byTitle[title];
  if (list.length > 1) {
    dup++;
    console.log('DUPLICATE TITLE (' + list.length + '): ' + title);
    list.forEach((f) => console.log('    ' + f));
  }
});
console.log('Total duplicate title groups:', dup);
