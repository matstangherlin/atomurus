#!/usr/bin/env node
/**
 * FOUC + performance fix for atomurus-lab-console.css.
 *
 * Problem:
 *  - lab-console.css is 191 KB / 6,677 lines. Loading it BLOCKING delays first
 *    paint on every page ("não carrega instantâneo").
 *  - Previous pass left DUPLICATE lab-console links in many files (double
 *    download + double parse → "carrega meio bugado").
 *
 * Fix (per HTML file, head only):
 *  - Remove duplicate lab-console <link rel="stylesheet">, <link rel="preload">
 *    and <noscript> entries. Keep exactly ONE lab-console stylesheet link.
 *  - Convert it to async: preload + media="print" onload="this.media='all'".
 *    → CSS fetches in parallel with HTML/JS, does NOT block first paint.
 *  - FOUC guard: add inline <style> + <script> that hide <body> until the
 *    design CSS is ready, then reveal. No flash, no slow blocking load.
 *    Fallbacks: 4 s timeout (if CSS never loads, page still appears) and a
 *    <noscript> blocking link (no-JS still gets full design).
 *
 * The guard rule lives both inline (order-independent) and in
 * assets/critical-lab.css via tools/build-critical-css.js.
 */
const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const SKIP = new Set([
  'node_modules', '.git', '.netlify', 'dist', 'build', 'propostas',
  'hanzi-logic', 'scripts', 'tools',
]);

function walk(dir, out) {
  for (const ent of fs.readdirSync(dir, { withFileTypes: true })) {
    if (ent.name.startsWith('.') || SKIP.has(ent.name)) continue;
    const full = path.join(dir, ent.name);
    if (ent.isDirectory()) walk(full, out);
    else if (ent.isFile() && ent.name.toLowerCase().endsWith('.html')) out.push(full);
  }
  return out;
}

const PRELOAD = /[ \t]*<link[^>]*rel="preload"[^>]*atomurus-lab-console\.css[^>]*>\r?\n/g;
const NOSCRIPT = /[ \t]*<noscript><link[^>]*atomurus-lab-console\.css[^>]*><\/noscript>\r?\n/g;
// any <link rel="stylesheet"> pointing at lab-console.css, any attributes
const STYLE = /([ \t]*)<link[^>]*rel="stylesheet"[^>]*href="([^"]*atomurus-lab-console\.css[^"]*)"[^>]*>/g;
// marker we insert; presence means this file is already converted (idempotency)
const GUARD_MARK = "classList.add('lc-loading')";
// any <link rel="stylesheet"> pointing at critical-lab.css (dedupe: keep first)
const CRITICAL = /([ \t]*)<link[^>]*rel="stylesheet"[^>]*href="([^"]*critical-lab\.css[^"]*)"[^>]*>/g;

function guardBlock(indent, href) {
  const i = indent || '';
  return (
    i + "<style>html.lc-loading body{visibility:hidden}</style>\n" +
    i + "<script>document.documentElement.classList.add('lc-loading');setTimeout(function(){document.documentElement.classList.remove('lc-loading')},4000);</script>\n" +
    i + '<link rel="preload" href="' + href + '" as="style">\n' +
    i + '<link rel="stylesheet" href="' + href + '" media="print" onload="this.media=\'all\';document.documentElement.classList.remove(\'lc-loading\')">\n' +
    i + '<noscript><link rel="stylesheet" href="' + href + '"></noscript>'
  );
}

const files = walk(ROOT, []);
let changed = 0;
let withLink = 0;

for (const f of files) {
  let src = fs.readFileSync(f, 'utf8');
  const orig = src;
  const headEnd = src.indexOf('</head>');
  const head = headEnd >= 0 ? src.slice(0, headEnd) : src;
  const rest = headEnd >= 0 ? src.slice(headEnd) : '';
  let h = head;

  const alreadyGuard = h.includes(GUARD_MARK);
  if (!alreadyGuard) {
    h = h.replace(PRELOAD, '');
    h = h.replace(NOSCRIPT, '');

    let first = true;
    h = h.replace(STYLE, function (m, indent, href) {
      if (!first) return ''; // drop duplicate lab-console links
      first = false;
      return guardBlock(indent, href);
    });
  }

  // critical-lab.css must stay BLOCKING (above-the-fold design), but never twice
  let cfirst = true;
  h = h.replace(CRITICAL, function (m) {
    if (!cfirst) return '';
    cfirst = false;
    return m;
  });

  if (h !== head) withLink++;

  src = h + rest;
  if (src !== orig) {
    fs.writeFileSync(f, src, 'utf8');
    changed++;
    console.log('fixed', path.relative(ROOT, f).replace(/\\/g, '/'));
  }
}

console.log('Pages with lab-console link:', withLink);
console.log('Files changed:', changed);
