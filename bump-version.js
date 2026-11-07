// Atomurus — cache-bust version bumper (Node.js)
// Runs automatically on Netlify build via netlify.toml [build].command
// Also works locally: node bump-version.js

const fs   = require('fs');
const path = require('path');

const version = new Date().toISOString().replace(/[-T:]/g, '').slice(0, 12);
const root    = __dirname;
const pattern = /\?v=\d+/g;
const replace = `?v=${version}`;

let filesTouched  = 0;
let totalReplaces = 0;

function walk(dir) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      // skip node_modules and hidden dirs
      if (entry.name === 'node_modules' || entry.name === 'dist' || entry.name === 'android' || entry.name.startsWith('.')) continue;
      walk(full);
    } else if (entry.name.endsWith('.html')) {
      const original = fs.readFileSync(full, 'utf8');
      const matches  = original.match(pattern);
      if (!matches) continue;
      const updated = original.replace(pattern, replace);
      if (updated === original) continue;
      fs.writeFileSync(full, updated, 'utf8');
      filesTouched++;
      totalReplaces += matches.length;
    }
  }
}

walk(root);

// Runtime loaders that inject other scripts/styles by URL. Netlify serves
// *.js / *.css as `immutable` for a year, so a hard-coded ?v= in these files
// would pin returning visitors to an old copy of every file they load
// (study-save.js, viewer runtimes, …). Keep them on the build version too.
const RUNTIME_LOADERS = [
  'study-boot.js',
  'element-page.js',
  'page-share-init.js',
  'workspace-ui.js',
  'assets/public-workspace.js',
  'viewer/load-three.js',
  'viewer/isomerism/isomerism-3d.js'
];
for (const rel of RUNTIME_LOADERS) {
  const full = path.join(root, rel);
  if (!fs.existsSync(full)) continue;
  const original = fs.readFileSync(full, 'utf8');
  const updated = original
    .replace(pattern, replace)
    .replace(/(var version = ')\d+(')/, `$1${version}$2`);
  if (updated === original) continue;
  fs.writeFileSync(full, updated, 'utf8');
  filesTouched++;
  totalReplaces += (original.match(pattern) || []).length;
}
console.log(`version=${version}`);
console.log(`Files touched:      ${filesTouched}`);
console.log(`Total replacements: ${totalReplaces}`);
