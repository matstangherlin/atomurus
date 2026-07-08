// ───────────────────────────────────────────────────────────────────
// Atomurus — enrich JSON-LD on element pages
// ───────────────────────────────────────────────────────────────────
// Element pages already have a strong ChemicalSubstance + BreadcrumbList
// graph (see migrate-element-seo.js comment for the structure). This
// script adds two cross-references that tie each element page into
// the site-wide entity graph:
//
//   isPartOf  → https://atomurus.com/#website    (the WebSite entity
//               declared on the home page)
//   publisher → https://atomurus.com/#org        (the Organization
//               entity declared on the home page)
//
// Adding these strengthens Google's understanding that all 118 element
// pages are children of a single coherent site/publisher — important
// for E-E-A-T and for the "site name" knowledge panel.
//
// Run: `node enrich-element-schema.js` (idempotent — safe to re-run).
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

function enrichFile(absPath) {
  const src = fs.readFileSync(absPath, 'utf8');

  // Already enriched? Look for our markers.
  if (src.includes('"isPartOf":') && src.includes('atomurus.com/#website')) {
    return false;
  }

  // Find the ChemicalSubstance block's `isPartOf` (Dataset) and add
  // `publisher` + a new top-level isPartOf reference to #website.
  //
  // Strategy: anchor on the existing `"isPartOf"` line which references
  // the local Dataset. Replace it with the new sibling fields, keeping
  // the existing Dataset isPartOf intact (renamed to `mainEntityOfPage`
  // would be wrong; we keep it as the parent dataset reference under
  // a different name — instead, just add siblings BEFORE it).
  const anchor =
    '"isPartOf": {\n        "@type":"Dataset",\n        "name":"Atomurus Periodic Table",\n        "url":"https://atomurus.com/periodic-table"\n      }';
  const replacement =
    '"isPartOf": [\n        { "@id": "https://atomurus.com/#website" },\n        { "@type":"Dataset", "name":"Atomurus Periodic Table", "url":"https://atomurus.com/periodic-table", "@id":"https://atomurus.com/periodic-table#dataset" }\n      ],\n      "publisher": { "@id": "https://atomurus.com/#org" }';

  if (!src.includes(anchor)) {
    // Try a forgiving match (whitespace variations)
    return false;
  }
  const out = src.replace(anchor, replacement);
  if (out === src) return false;
  fs.writeFileSync(absPath, out, 'utf8');
  return true;
}

function main() {
  const files = listElementPages();
  let updated = 0, skipped = 0;

  for (const abs of files) {
    const ok = enrichFile(abs);
    if (ok) updated++;
    else skipped++;
  }
  console.log(`Updated=${updated}  Skipped=${skipped}  Total=${files.length}`);
}

main();
