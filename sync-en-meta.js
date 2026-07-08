// ───────────────────────────────────────────────────────────────────
// Atomurus — sync EN inline meta fallbacks from i18n.js DICT
// ───────────────────────────────────────────────────────────────────
// build-i18n.js reads `data-i18n` keys and generates per-language
// variants (.pt.html). But the EN-default source files (.html) carry
// the English text hardcoded inline as fallback for crawlers that do
// not execute JS. When DICT['en'].*.metaTitle / metaDesc is updated,
// those inline strings need to be re-written too — otherwise the EN
// title/description in the served HTML stays stale until next manual
// edit.
//
// This script walks the same PAGES list as build-i18n.js, looks up the
// data-i18n key on title/description, resolves DICT['en'][key], and
// updates the inline text plus og/twitter title/description.
//
// Run: `node sync-en-meta.js` (idempotent — safe to re-run).
// ───────────────────────────────────────────────────────────────────

'use strict';

const fs   = require('fs');
const path = require('path');

const ROOT = __dirname;
const I18N_SOURCE_PATH = path.join(ROOT, 'tools', 'i18n-dict-source.js');

// Same set as build-i18n.js — pages with data-i18n on title/meta-desc.
const PAGES = [
  'index.html',
  'periodic-table.html',
  'calculators.html',
  'about.html',
  'contact.html',
  'privacy.html',
  'terms.html',
  'config.html',
  'pricing.html',
  'viewer/allotropes.html',
  'viewer/molecules.html',
  'viewer/atomic-models.html',
  'viewer/atomic-models/bohr.html',
  'viewer/atomic-models/dalton.html',
  'viewer/atomic-models/quantum.html',
  'viewer/atomic-models/rutherford.html',
  'viewer/atomic-models/thomson.html',
  'periodic-table/heatmap.html',
  'periodic-table/trends.html',
  'periodic-table/compare.html',
  'periodic-table/isotopes.html',
];

function loadDict() {
  delete require.cache[require.resolve(I18N_SOURCE_PATH)];
  return require(I18N_SOURCE_PATH).DICT;
}

function resolveKey(dict, lang, key) {
  const parts = key.split('.');
  let cur = dict[lang];
  for (const p of parts) {
    if (cur == null) return undefined;
    cur = cur[p];
  }
  return cur;
}

function escAttr(s) {
  return String(s)
    .replace(/&/g, '&amp;')
    .replace(/"/g, '&quot;')
    .replace(/</g, '&lt;');
}
function escText(s) {
  return String(s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

function syncFile(absPath, dict) {
  const src = fs.readFileSync(absPath, 'utf8');

  const titleM = src.match(/<title\s+data-i18n="([^"]+)">[^<]*<\/title>/);
  const descM =
    src.match(/<meta\s+name="description"\s+data-i18n-attr="content:([^"]+)"\s+content="[^"]*">/) ||
    src.match(/<meta\s+name="description"\s+content="[^"]*"\s+data-i18n-attr="content:([^"]+)">/);
  if (!titleM || !descM) {
    console.warn(`  skip (no data-i18n title/desc): ${path.relative(ROOT, absPath)}`);
    return false;
  }

  const titleKey = titleM[1];
  const descKey  = descM[1];
  const title    = resolveKey(dict, 'en', titleKey);
  const desc     = resolveKey(dict, 'en', descKey);
  if (title == null || desc == null) {
    console.warn(`  skip (missing en for ${titleKey}/${descKey}): ${path.relative(ROOT, absPath)}`);
    return false;
  }

  let out = src;

  // <title>
  out = out.replace(
    /<title\s+data-i18n="[^"]+">[^<]*<\/title>/,
    `<title data-i18n="${titleKey}">${escText(title)}</title>`
  );

  // <meta name="description" ...> — either attribute order
  out = out.replace(
    /<meta\s+name="description"\s+data-i18n-attr="content:[^"]+"\s+content="[^"]*">/,
    `<meta name="description" data-i18n-attr="content:${descKey}" content="${escAttr(desc)}">`
  );
  out = out.replace(
    /<meta\s+name="description"\s+content="[^"]*"\s+data-i18n-attr="content:[^"]+">/,
    `<meta name="description" content="${escAttr(desc)}" data-i18n-attr="content:${descKey}">`
  );

  // OG / Twitter title + description (no data-i18n on these; mirror title/desc)
  out = out.replace(
    /<meta\s+property="og:title"\s+content="[^"]*">/,
    `<meta property="og:title" content="${escAttr(title)}">`
  );
  out = out.replace(
    /<meta\s+property="og:description"\s+content="[^"]*">/,
    `<meta property="og:description" content="${escAttr(desc)}">`
  );
  out = out.replace(
    /<meta\s+name="twitter:title"\s+content="[^"]*">/,
    `<meta name="twitter:title" content="${escAttr(title)}">`
  );
  out = out.replace(
    /<meta\s+name="twitter:description"\s+content="[^"]*">/,
    `<meta name="twitter:description" content="${escAttr(desc)}">`
  );

  if (out === src) return false;
  fs.writeFileSync(absPath, out, 'utf8');
  return true;
}

function main() {
  const dict = loadDict();
  let updated = 0, skipped = 0, missing = 0;

  for (const rel of PAGES) {
    const abs = path.join(ROOT, rel);
    if (!fs.existsSync(abs)) {
      console.warn(`  source missing: ${rel}`);
      missing++;
      continue;
    }
    const ok = syncFile(abs, dict);
    if (ok) { updated++; console.log(`  synced ${rel}`); }
    else { skipped++; }
  }

  console.log(`Updated=${updated}  Skipped=${skipped}  Missing=${missing}`);
}

main();
