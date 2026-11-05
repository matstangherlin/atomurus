#!/usr/bin/env node
// Adds <script defer src="/assets/i18n/<ns>.js"> tags before i18n.js on every
// page, one per translation namespace the page uses (data-i18n,
// data-i18n-html, data-i18n-attr, plus `common`). The chunks download in
// parallel with the rest of the page and are in memory before i18n.js runs,
// so i18n.js never needs its synchronous XHR fallback on these pages.
// Idempotent: previous injected tags (data-i18n-chunk) are replaced.
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const ROOT = path.resolve(__dirname, '..');
const CHUNK_DIR = path.join(ROOT, 'assets', 'i18n');
const available = new Set(fs.readdirSync(CHUNK_DIR).filter((f) => f.endsWith('.json')).map((f) => f.replace(/\.json$/, '')));

function listHtml() {
  const out = execSync('git ls-files -co --exclude-standard "*.html"', { cwd: ROOT, encoding: 'utf8' });
  return out.split('\n').filter(Boolean).filter((f) => !/^(node_modules|dist|e2e|test-results|fixtures|dev|propostas|hanzi-logic|templates|docs|tools|scripts)\//.test(f));
}

// Namespaces that a page's own scripts ask for with I18N.t('<ns>.key'), e.g.
// share-button.js uses `el.share*` on every page. Found by scanning each local
// script for '<ns>.' string literals; cached per script.
const scriptCache = new Map();
function scriptNamespaces(rel, src) {
  if (/^(https?:)?\/\//.test(src)) return [];
  const clean = src.split('?')[0];
  const file = clean.startsWith('/') ? path.join(ROOT, clean) : path.join(ROOT, path.dirname(rel), clean);
  if (scriptCache.has(file)) return scriptCache.get(file);
  let found = [];
  try {
    const code = fs.readFileSync(file, 'utf8');
    const set = new Set();
    const re = /['"`]([a-zA-Z]+)\.(?!(?:html|js|css|json|png|svg|jpg|webp|pt|en|com)\b)[a-zA-Z]/g;
    let m;
    while ((m = re.exec(code))) if (available.has(m[1]) && /I18N|\bt\(|i18n/.test(code)) set.add(m[1]);
    found = Array.from(set);
  } catch (e) { found = []; }
  scriptCache.set(file, found);
  return found;
}

function namespacesOf(html, rel) {
  const set = new Set(['common']);
  html.replace(/<script\b[^>]*\bsrc="([^"]+)"/g, (m, src) => {
    if (!/\/assets\/i18n\/|i18n\.js/.test(src)) scriptNamespaces(rel, src).forEach((ns) => set.add(ns));
    return m;
  });
  const add = (key) => { const ns = String(key || '').trim().split('.')[0]; if (ns && available.has(ns)) set.add(ns); };
  html.replace(/\bdata-i18n(?:-html)?="([^"]+)"/g, (m, k) => { add(k); return m; });
  html.replace(/\bdata-i18n-attr="([^"]+)"/g, (m, spec) => {
    spec.split(';').forEach((pair) => { const i = pair.indexOf(':'); if (i >= 0) add(pair.slice(i + 1)); });
    return m;
  });
  return Array.from(set).sort((a, b) => (a === 'common' ? -1 : b === 'common' ? 1 : a.localeCompare(b)));
}

let changed = 0;
for (const rel of listHtml()) {
  const file = path.join(ROOT, rel);
  let html = fs.readFileSync(file, 'utf8');
  html = html.replace(/<script src="\/assets\/i18n\/[\w-]+\.js(?:\?v=[^"]*)?" defer data-i18n-chunk><\/script>\n?/g, '');
  const tag = html.match(/<script src="([^"]*?)i18n\.js(\?v=[^"]*)?"[^>]*><\/script>/);
  if (!tag || /<script[^>]*src="[^"]*i18n\.js[^"]*"[^>]*>/.test(html) === false) continue;
  const ver = tag[2] || '';
  const tags = namespacesOf(html, rel).map((ns) => `<script src="/assets/i18n/${ns}.js${ver}" defer data-i18n-chunk></script>\n`).join('');
  const next = html.replace(tag[0], tags + tag[0]);
  if (next !== fs.readFileSync(file, 'utf8')) { fs.writeFileSync(file, next); changed++; }
}
console.log(`i18n chunk tags: ${changed} pages updated`);
