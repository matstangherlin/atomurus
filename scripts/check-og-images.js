const fs = require('fs');
const path = require('path');
// og images in assets/
const assets = fs.readdirSync('assets');
const ogFiles = assets.filter((f) => /^og-.*\.png$/.test(f));
console.log('og images in assets/:');
ogFiles.forEach((f) => console.log('  ' + f));

// references across html
const refs = {};
function walk(d) {
  for (const e of fs.readdirSync(d, { withFileTypes: true })) {
    const f = path.join(d, e.name);
    if (e.isDirectory()) {
      if (e.name === 'node_modules' || e.name.startsWith('.')) continue;
      walk(f);
    } else if (e.name.endsWith('.html')) {
      const t = fs.readFileSync(f, 'utf8');
      const re = /property="og:image"[^>]*content="([^"]+)"/g;
      let m;
      while ((m = re.exec(t))) {
        const u = m[1];
        refs[u] = (refs[u] || 0) + 1;
      }
    }
  }
}
walk('.');
console.log('\nog:image references (unique):');
Object.keys(refs)
  .sort()
  .forEach((u) => {
    const filename = u.split('/').pop();
    const exists = ogFiles.includes(filename);
    console.log('  ' + refs[u] + 'x  ' + u + (exists ? '  [OK]' : '  [MISSING FILE]'));
  });
