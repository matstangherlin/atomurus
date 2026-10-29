#!/usr/bin/env node
/**
 * Remove ad/measurement preconnect and dns-prefetch links from HTML.
 * Idempotent. Keeps BOM and the original line endings of untouched text.
 *
 *   node tools/patch-remove-ads-preconnect.js
 */
const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const SKIP_DIRS = new Set([
  'node_modules', '.git', 'netlify', 'tools', 'scripts', 'supabase',
  'src', 'dist'
]);
const AD_HOST = /pagead2|googlesyndication|doubleclick|acscdn|googletagmanager|google-analytics|adtrafficquality|googleadservices/i;

function isAdWarmup(tag) {
  if (!/^<link\b/i.test(tag)) return false;
  const rel = (tag.match(/\brel=["']([^"']+)["']/i) || [])[1] || '';
  if (!/preconnect|dns-prefetch/i.test(rel)) return false;
  return AD_HOST.test(tag);
}

function stripAdsPreconnect(html) {
  return html.replace(/<link\b[^>]*>/gi, (tag) => (isAdWarmup(tag) ? '' : tag));
}

function walk(dir, out) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if (entry.name.startsWith('.')) continue;
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      if (SKIP_DIRS.has(entry.name)) continue;
      walk(full, out);
    } else if (entry.name.endsWith('.html')) out.push(full);
  }
  return out;
}

function run(root) {
  const base = root || ROOT;
  let changed = 0;
  for (const file of walk(base, [])) {
    const before = fs.readFileSync(file, 'utf8');
    const after = stripAdsPreconnect(before);
    if (after !== before) {
      fs.writeFileSync(file, after);
      changed += 1;
    }
  }
  return changed;
}

module.exports = { isAdWarmup, stripAdsPreconnect, run };

if (require.main === module) {
  const changed = run(ROOT);
  console.log(`${changed} files changed`);
}
