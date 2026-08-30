#!/usr/bin/env node
/**
 * Convert blocking atomurus-lab-console.css links into:
 *   1) blocking critical-lab.css (small)
 *   2) async full lab-console.css (media=print onload)
 *
 * Idempotent.
 */
const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const { ensurePublicShell } = require('./inject-public-shell');

const SKIP = new Set(['node_modules', '.git', 'netlify', 'tools', 'scripts', 'supabase', 'hanzi-logic', 'propostas']);

const LINK_RE =
  /<link\s+rel=["']stylesheet["']\s+href=["']([^"']*atomurus-lab-console\.css[^"']*)["']\s*>/gi;

function walk(dir, out) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if (entry.name.startsWith('.')) continue;
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      if (SKIP.has(entry.name)) continue;
      walk(full, out);
    } else if (entry.name.endsWith('.html')) out.push(full);
  }
  return out;
}

function patch(html) {
  if (!LINK_RE.test(html)) return html;
  LINK_RE.lastIndex = 0;

  // Already migrated?
  if (html.includes('critical-lab.css') && /media=["']print["']/.test(html) && /atomurus-lab-console\.css/.test(html)) {
    return html;
  }

  const hasCritical = html.includes('critical-lab.css');
  return html.replace(LINK_RE, (full, href) => {
    // Extract version query if present
    const vMatch = href.match(/\?v=(\d+)/);
    const v = vMatch ? `?v=${vMatch[1]}` : '';
    const asyncCss = [
      `<link rel="stylesheet" href="${href}" media="print" onload="this.media='all'">`,
      `<noscript><link rel="stylesheet" href="${href}"></noscript>`
    ];
    if (hasCritical) return asyncCss.join('\n');
    return [`<link rel="stylesheet" href="/assets/critical-lab.css${v}">`, ...asyncCss].join('\n');
  });
}

const files = walk(ROOT, []);
let changed = 0;
for (const file of files) {
  if (path.basename(file) === 'app.html') continue;
  const original = fs.readFileSync(file, 'utf8');
  const next = ensurePublicShell(patch(original));
  if (next !== original) {
    fs.writeFileSync(file, next, 'utf8');
    changed += 1;
  }
}
console.log(`Async lab-console CSS applied on ${changed} / ${files.length} HTML files.`);
