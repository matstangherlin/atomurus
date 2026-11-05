#!/usr/bin/env node
// The remake pages below no longer use atomurus-lab-console.css (the legacy
// "lab console" stylesheet, ~195 KB). It still loads asynchronously on every
// other page, but here it only cost bandwidth and a full restyle when it
// arrived. Remove its <link>, preload and <noscript> tags. Idempotent; runs at
// the end of the build so the generated .pt.html variants are covered too.
const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const PAGES = ['index.html', 'index.pt.html', 'explore.html', 'explore.pt.html', 'login.html', 'pricing.html', 'pricing.pt.html', 'account.html'];
const RE = /^[ \t]*(?:<link rel="preload" href="[^"]*atomurus-lab-console\.css[^"]*" as="style">|<link rel="stylesheet" href="[^"]*atomurus-lab-console\.css[^"]*"[^>]*>|<noscript><link rel="stylesheet" href="[^"]*atomurus-lab-console\.css[^"]*"><\/noscript>)\r?\n/gm;

let changed = 0;
for (const rel of PAGES) {
  const file = path.join(ROOT, rel);
  if (!fs.existsSync(file)) continue;
  const html = fs.readFileSync(file, 'utf8');
  const next = html.replace(RE, '');
  if (next !== html) { fs.writeFileSync(file, next); changed++; }
}
console.log(`legacy lab-console CSS removed from ${changed} pages`);
