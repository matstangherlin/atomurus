// Atomurus — make atomurus-lab-console.css load as a blocking stylesheet.
// The lab-console layer overrides the core design tokens, so loading it
// asynchronously (media="print" → all) caused a visible design flash on every
// page navigation. This converts it to a normal blocking <link> and drops the
// now-redundant <noscript> fallback.
const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const SKIP = new Set(['node_modules', '.git', '.netlify', 'dist', 'build', 'propostas', 'hanzi-logic']);

function walk(dir, out) {
  for (const ent of fs.readdirSync(dir, { withFileTypes: true })) {
    if (ent.name.startsWith('.') || SKIP.has(ent.name)) continue;
    const full = path.join(dir, ent.name);
    if (ent.isDirectory()) walk(full, out);
    else if (ent.isFile() && ent.name.toLowerCase().endsWith('.html')) out.push(full);
  }
  return out;
}

// <link rel="stylesheet" href="…atomurus-lab-console.css?v=…" media="print" onload="this.media='all'">
const asyncRe = /<link rel="stylesheet" href="([^"]*atomurus-lab-console\.css[^"]*)" media="print" onload="this\.media='all'">/g;
// The redundant <noscript> fallback (same href) that used to sit right after.
const noscriptRe = /\n?\s*<noscript><link rel="stylesheet" href="[^"]*atomurus-lab-console\.css[^"]*"><\/noscript>/g;

const files = walk(ROOT, []);
let changed = 0;
for (const f of files) {
  let src = fs.readFileSync(f, 'utf8');
  const orig = src;
  src = src.replace(asyncRe, '<link rel="stylesheet" href="$1">');
  src = src.replace(noscriptRe, '');
  if (src !== orig) {
    fs.writeFileSync(f, src, 'utf8');
    changed++;
    console.log('fixed', path.relative(ROOT, f));
  }
}
console.log('Total files changed:', changed);
