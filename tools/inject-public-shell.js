#!/usr/bin/env node
/**
 * Inject assets/public-shell.css after lab-console on public HTML pages.
 * Skips /app and propostas/. Idempotent.
 */
const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const SKIP_DIRS = new Set(['node_modules', '.git', 'netlify', 'tools', 'scripts', 'supabase', 'hanzi-logic', 'propostas']);
const SKIP_FILES = new Set(['app.html']);

function walkDir(dir, out) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if (entry.name.startsWith('.')) continue;
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      if (SKIP_DIRS.has(entry.name)) continue;
      walkDir(full, out);
    } else if (entry.name.endsWith('.html')) out.push(full);
  }
  return out;
}

function retagBrand(html) {
  return html.replace(
    /(data-i18n=["']common\.brandTag["']>)build v1\.11/g,
    '$1chemistry lab'
  );
}

const PUBLIC_SHELL_V = '202608281200';

function ensurePublicShell(html) {
  html = retagBrand(html);
  if (!/atomurus-lab-console\.css/.test(html)) return html;

  const href = `/assets/public-shell.css?v=${PUBLIC_SHELL_V}`;
  if (/public-shell\.css/.test(html)) {
    return html.replace(
      /href=["'][^"']*public-shell\.css[^"']*["']/g,
      `href="${href}"`
    );
  }

  const tag = `<link rel="stylesheet" href="${href}">`;

  const noscriptRe = /<noscript>\s*<link rel=["']stylesheet["'] href=["'][^"']*atomurus-lab-console\.css[^"']*["']\s*>\s*<\/noscript>/i;
  if (noscriptRe.test(html)) {
    return html.replace(noscriptRe, (m) => `${m}\n${tag}`);
  }

  const links = [];
  const linkRe = /<link\b[^>]*atomurus-lab-console\.css[^>]*>/gi;
  let m;
  while ((m = linkRe.exec(html))) links.push(m);
  if (!links.length) return html;
  const last = links[links.length - 1];
  const idx = last.index + last[0].length;
  return html.slice(0, idx) + '\n' + tag + html.slice(idx);
}

module.exports = { ensurePublicShell, SKIP_FILES, SKIP_DIRS };

if (require.main === module) {
  const files = walkDir(ROOT, []);
  let changed = 0;
  for (const file of files) {
    if (SKIP_FILES.has(path.basename(file))) continue;
    const original = fs.readFileSync(file, 'utf8');
    const next = ensurePublicShell(original);
    if (next !== original) {
      fs.writeFileSync(file, next);
      changed += 1;
    }
  }
  console.log(`public-shell.css injected on ${changed} / ${files.length} HTML files.`);
}
