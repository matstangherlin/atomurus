// ───────────────────────────────────────────────────────────────────
// Atomurus — one-time migration: load elements-content.js per element
// ───────────────────────────────────────────────────────────────────
// Adds a <script src="../elements-content.js?v=..."> tag to every
// /periodic-table/<latin>.html (excluding sub-views) so element-page.js
// can read the rich content data. Idempotent.
// ───────────────────────────────────────────────────────────────────

'use strict';

const fs   = require('fs');
const path = require('path');

const ROOT = __dirname;
const DIR  = path.join(ROOT, 'periodic-table');
const EXCLUDE = new Set([
  'heatmap.html', 'trends.html', 'compare.html', 'isotopes.html',
]);

function listElementPages() {
  if (!fs.existsSync(DIR)) return [];
  return fs.readdirSync(DIR)
    .filter(f => f.endsWith('.html') &&
                 !f.endsWith('.en.html') &&
                 !f.endsWith('.pt.html') &&
                 !EXCLUDE.has(f))
    .map(f => path.join(DIR, f));
}

function main() {
  const files = listElementPages();
  let added = 0, skipped = 0;

  for (const f of files) {
    let html = fs.readFileSync(f, 'utf8');

    // Skip if already migrated.
    if (html.includes('elements-content.js')) {
      skipped++;
      continue;
    }

    // Insert right after elements-data-en.js so it's loaded in the same
    // batch of deferred scripts.
    const pattern = /(<script src="\.\.\/elements-data-en\.js\?v=\d+" defer><\/script>)/;
    if (!pattern.test(html)) {
      console.warn(`  no anchor found: ${path.basename(f)}`);
      skipped++;
      continue;
    }
    // Use a placeholder version stamp; bump-version.js will replace ?v=
    // on the next build to match the global timestamp.
    html = html.replace(pattern,
      '$1\n<script src="../elements-content.js?v=202605221626" defer></script>'
    );
    fs.writeFileSync(f, html, 'utf8');
    added++;
  }

  console.log(`Element pages: ${files.length}`);
  console.log(`Script tag added: ${added}`);
  console.log(`Skipped (already present): ${skipped}`);
}

main();
