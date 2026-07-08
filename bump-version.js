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
      if (entry.name === 'node_modules' || entry.name.startsWith('.')) continue;
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
console.log(`version=${version}`);
console.log(`Files touched:      ${filesTouched}`);
console.log(`Total replacements: ${totalReplaces}`);
