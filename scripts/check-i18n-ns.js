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
const nsSet = new Set();
const usage = {};
const re = /data-i18n(?:-html|-attr)?="([^"]+)"/g;
for (const f of files) {
  const txt = fs.readFileSync(f, 'utf8');
  let m;
  while ((m = re.exec(txt))) {
    const val = m[1];
    const parts = val.split(';');
    for (const p of parts) {
      const idx = p.indexOf(':');
      const key = p.slice(idx + 1).trim();
      const ns = key.split('.')[0];
      if (!ns || ns === 'attr' || ns === 'textContent') continue;
      nsSet.add(ns);
      usage[ns] = usage[ns] || { files: new Set(), count: 0 };
      usage[ns].files.add(f);
      usage[ns].count++;
    }
  }
}
const jsons = fs.readdirSync('assets/i18n').map((x) => x.replace(/\.json$/, ''));
const missing = [...nsSet].filter((ns) => !jsons.includes(ns));
console.log('Referenced namespaces:', [...nsSet].sort().join(', '));
console.log('Existing JSONs:', jsons.sort().join(', '));
console.log('MISSING namespaces:', missing.length ? missing.join(', ') : '(none)');
if (missing.length) {
  for (const ns of missing) {
    console.log('  ' + ns + ' used in:', [...usage[ns].files].join(' | '));
  }
}
