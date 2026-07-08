// Remove duplicate iso-group-toggle fragment left by shell patch.
const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..', 'viewer', 'isomerism');

// Stray fragment from an old shell patch: duplicate Espacial toggle between sub-tabs and panel.
const ORPHAN = /(<\/nav>)\s*<\/a>\s*<a class="iso-group-btn grp-esp[\s\S]*?<\/div>\s*(?=\s*\n\s*<div class="iso-section-header")/g;

function walk(dir) {
  for (const ent of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, ent.name);
    if (ent.isDirectory()) walk(p);
    else if (ent.name.endsWith('.html')) {
      let html = fs.readFileSync(p, 'utf8');
      const before = html;
      html = html.replace(ORPHAN, '$1\n');
      if (html !== before) {
        fs.writeFileSync(p, html, 'utf8');
        console.log('Cleaned', path.relative(ROOT, p));
      }
    }
  }
}

walk(ROOT);
