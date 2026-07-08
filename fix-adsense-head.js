// ───────────────────────────────────────────────────────────────────
// Atomurus — install AdSense snippet in every page's <head>
// ───────────────────────────────────────────────────────────────────
// Google AdSense's "Auto ads" setup requires the adsbygoogle.js script
// directly in the <head> of every page. The reviewer/crawler detects
// the snippet to verify ownership and to scan pages for ad placement.
//
// Our previous approach (lazy-ads.js loading AdSense after 5s) saved
// performance but failed the snippet-detection step, so Google kept
// showing "Receber código" on every page.
//
// This script:
//   1. Adds the standard `<script async src="...adsbygoogle.js?..."
//      crossorigin="anonymous"></script>` snippet right after <head>,
//      tagged with fetchpriority="low" so it does NOT compete with
//      critical CSS/hero images for the LCP. async + low priority =
//      Google verifies the snippet AND Lighthouse stays happy.
//   2. Adds <meta name="google-adsense-account" content="..."> as a
//      belt-and-suspenders ownership signal.
//   3. Idempotent — re-running is a no-op once installed.
//
// Run AFTER bump-version.js so the existing ?v= placeholders are fresh,
// or just run independently — the AdSense snippet doesn't include ?v=.
// ───────────────────────────────────────────────────────────────────

'use strict';

const fs   = require('fs');
const path = require('path');

const ROOT = __dirname;
const ADSENSE_CLIENT = 'ca-pub-9495821870733084';

// Marker used to detect prior installation.
const ADSENSE_MARKER = 'adsbygoogle.js?client=' + ADSENSE_CLIENT;
const META_MARKER    = 'name="google-adsense-account"';

// What we insert. fetchpriority="low" is the key bit — it tells the
// browser "download this AFTER my critical CSS and fonts", so Lighthouse
// LCP/TBT scores barely move while Google still detects the tag.
const ADSENSE_SNIPPET =
  '<meta name="google-adsense-account" content="' + ADSENSE_CLIENT + '">\n' +
  '<script async src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=' +
  ADSENSE_CLIENT + '" crossorigin="anonymous" fetchpriority="low"></script>';

function walk(dir, out) {
  out = out || [];
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if (entry.isDirectory()) {
      if (entry.name === 'node_modules' || entry.name.startsWith('.')) continue;
      walk(path.join(dir, entry.name), out);
    } else if (entry.isFile() && entry.name.endsWith('.html')) {
      out.push(path.join(dir, entry.name));
    }
  }
  return out;
}

let installed = 0, skipped = 0, missing = 0;
const files = walk(ROOT);

for (const file of files) {
  let html = fs.readFileSync(file, 'utf8');

  // Skip if both meta + script already present (idempotent).
  const hasScript = html.indexOf(ADSENSE_MARKER) !== -1;
  const hasMeta   = html.indexOf(META_MARKER)    !== -1;
  if (hasScript && hasMeta) {
    skipped++;
    continue;
  }

  // Locate the <head> tag (case-insensitive, with optional attrs).
  const headMatch = html.match(/<head[^>]*>/i);
  if (!headMatch) {
    console.warn(`  no <head> in: ${path.relative(ROOT, file).replace(/\\/g, '/')}`);
    missing++;
    continue;
  }

  // Insert AFTER the existing FOUC <style> + theme <script> if present,
  // otherwise right after <head>. We anchor on the cookie-consent script
  // which is the first deferred src=… script common to every page —
  // putting AdSense right above it keeps the snippet near the top of
  // <head> without disturbing the FOUC-mask machinery.
  const cookieConsentRe = /(<script src="cookie-consent\.js[^"]*"[^>]*><\/script>)/;
  let updated;
  if (cookieConsentRe.test(html)) {
    updated = html.replace(cookieConsentRe, ADSENSE_SNIPPET + '\n$1');
  } else {
    // Fallback: insert right after <head>
    const idx = headMatch.index + headMatch[0].length;
    updated = html.slice(0, idx) + '\n' + ADSENSE_SNIPPET + html.slice(idx);
  }

  if (updated === html) {
    console.warn(`  unchanged (anchor not matched cleanly): ${path.relative(ROOT, file).replace(/\\/g, '/')}`);
    skipped++;
    continue;
  }

  fs.writeFileSync(file, updated, 'utf8');
  installed++;
}

console.log(`AdSense snippet installed in ${installed} files.`);
console.log(`Skipped (already present): ${skipped}`);
console.log(`Missing <head>: ${missing}`);
console.log(`Total HTML files scanned: ${files.length}`);
