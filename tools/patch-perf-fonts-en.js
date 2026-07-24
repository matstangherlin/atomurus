#!/usr/bin/env node
/**
 * Trim font preloads to the LCP-critical pair and swap elements-data-en
 * eager tags for ensure-elements-en.js (lazy EN overlay).
 */
const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const VERSION = '202607081927';

const KEEP_FONTS = new Set([
  '/assets/fonts/inter-tight-normal-latin.woff2',
  '/assets/fonts/instrument-serif-400-italic-latin.woff2',
  // Explore article titles use the upright Instrument Serif.
  '/assets/fonts/instrument-serif-400-normal-latin.woff2',
]);

const SKIP_DIRS = new Set(['node_modules', '.git', 'netlify', 'tools', 'scripts', 'supabase', 'hanzi-logic']);

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

function relEnsure(filePath) {
  const relDir = path.relative(ROOT, path.dirname(filePath));
  if (!relDir || relDir === '.') return `ensure-elements-en.js?v=${VERSION}`;
  const depth = relDir.split(path.sep).filter(Boolean).length;
  return `${'../'.repeat(depth)}ensure-elements-en.js?v=${VERSION}`;
}

function trimFontPreloads(html) {
  return html.replace(
    /<link\s+rel=["']preload["']\s+href=["'](\/assets\/fonts\/[^"']+)["'][^>]*>\s*/gi,
    (full, href) => (KEEP_FONTS.has(href) ? full : '')
  );
}

function swapElementsEn(html, filePath) {
  if (!/elements-data-en\.js/.test(html)) return html;
  if (/ensure-elements-en\.js/.test(html)) {
    // Already migrated — drop any leftover eager EN tag.
    return html.replace(
      /<script\b[^>]*\bsrc=["'][^"']*elements-data-en\.js[^"']*["'][^>]*>\s*<\/script>\s*/gi,
      ''
    );
  }

  const ensureTag = `<script src="${relEnsure(filePath)}" defer></script>\n`;
  return html.replace(
    /<script\b[^>]*\bsrc=["'][^"']*elements-data-en\.js[^"']*["'][^>]*>\s*<\/script>\s*/gi,
    ensureTag
  );
}

const files = walk(ROOT, []);
let changed = 0;
for (const file of files) {
  const original = fs.readFileSync(file, 'utf8');
  let html = trimFontPreloads(original);
  html = swapElementsEn(html, file);
  if (html !== original) {
    fs.writeFileSync(file, html, 'utf8');
    changed += 1;
  }
}
console.log(`Patched fonts/EN lazy loader on ${changed} / ${files.length} HTML files.`);
