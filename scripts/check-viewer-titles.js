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
// Only viewer + top-level pages, skip explore/periodic-table/propostas
for (const f of files) {
  const norm = f.replace(/\//g, '\\');
  if (!/^viewer\\/.test(norm)) continue;
  const t = fs.readFileSync(f, 'utf8');
  const title = (t.match(/<title[^>]*>([^<]*)<\/title>/) || [])[1] || '';
  const descM = t.match(/<meta name="description"[^>]*content="([^"]+)"/);
  const desc = descM ? descM[1].slice(0, 50) : '';
  console.log(f + '\n  TITLE: ' + title + '\n  DESC: ' + desc);
}
