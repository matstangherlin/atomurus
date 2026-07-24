#!/usr/bin/env node
/**
 * Atomurus — one-shot HTML patch for deferred ads.
 *
 * - Removes eager AdCash <script id="aclib" src="//acscdn.com/...">
 * - Removes eager AdSense adsbygoogle.js (ads-gate loads it when allowed)
 * - Ensures ads-gate.js is present early in <head> (sync, small)
 * - Rewrites aclib.runAutoTag(...) → atomurusRunAutoTag(...)
 * - Skips hanzi-logic (separate app; only strips AdCash there)
 *
 * Safe to re-run (idempotent).
 */

const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const VERSION = '202607081927';

const ACLIB_RE =
  /<script\b[^>]*\bid=["']aclib["'][^>]*>\s*<\/script>\s*/gi;
const ACLIB_SRC_RE =
  /<script\b[^>]*\bsrc=["'][^"']*acscdn\.com\/script\/aclib\.js[^"']*["'][^>]*>\s*<\/script>\s*/gi;
const ADSENSE_RE =
  /<script\b[^>]*\bsrc=["']https:\/\/pagead2\.googlesyndication\.com\/pagead\/js\/adsbygoogle\.js\?client=ca-pub-9495821870733084["'][^>]*>\s*<\/script>\s*/gi;
const AUTOTAG_RE = /\baclib\.runAutoTag\s*\(/g;

const SKIP_DIRS = new Set(['node_modules', '.git', 'netlify', 'tools', 'scripts', 'supabase']);

function walk(dir, out) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if (entry.name.startsWith('.')) continue;
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      if (SKIP_DIRS.has(entry.name)) continue;
      walk(full, out);
    } else if (entry.name.endsWith('.html')) {
      out.push(full);
    }
  }
  return out;
}

function relToAdsGate(filePath) {
  const relDir = path.relative(ROOT, path.dirname(filePath));
  if (!relDir || relDir === '.') return `ads-gate.js?v=${VERSION}`;
  const depth = relDir.split(path.sep).filter(Boolean).length;
  return `${'../'.repeat(depth)}ads-gate.js?v=${VERSION}`;
}

function isHanzi(filePath) {
  return filePath.split(path.sep).includes('hanzi-logic');
}

function ensureAdsGate(html, adsGateSrc) {
  if (/ads-gate\.js/.test(html)) {
    // Prefer sync load so atomurusRunAutoTag exists before footer inline calls.
    return html.replace(
      /<script([^>]*\bsrc=["'][^"']*ads-gate\.js[^"']*["'][^>]*)><\/script>/i,
      (full, attrs) => {
        const cleaned = attrs.replace(/\sdefer\b/gi, '').replace(/\sasync\b/gi, '');
        return `<script${cleaned}></script>`;
      }
    );
  }

  const tag = `<script src="${adsGateSrc}"></script>\n`;
  if (/<meta\s+name=["']google-adsense-account["'][^>]*>/i.test(html)) {
    return html.replace(
      /(<meta\s+name=["']google-adsense-account["'][^>]*>)/i,
      `$1\n${tag}`
    );
  }
  if (/<meta\s+charset=/i.test(html)) {
    return html.replace(/(<meta\s+charset=[^>]*>)/i, `$1\n${tag}`);
  }
  if (/<head[^>]*>/i.test(html)) {
    return html.replace(/(<head[^>]*>)/i, `$1\n${tag}`);
  }
  return tag + html;
}

function patchFile(filePath) {
  const original = fs.readFileSync(filePath, 'utf8');
  let html = original;
  const hanzi = isHanzi(filePath);

  html = html.replace(ACLIB_RE, '');
  html = html.replace(ACLIB_SRC_RE, '');

  if (!hanzi) {
    html = html.replace(ADSENSE_RE, '');
    html = ensureAdsGate(html, relToAdsGate(filePath));
    html = html.replace(AUTOTAG_RE, 'atomurusRunAutoTag(');
  }

  if (html === original) return false;
  fs.writeFileSync(filePath, html, 'utf8');
  return true;
}

const files = walk(ROOT, []);
let changed = 0;
for (const file of files) {
  if (patchFile(file)) changed += 1;
}

console.log(`Patched ${changed} / ${files.length} HTML files for deferred ads.`);
