#!/usr/bin/env node
/**
 * Remove internal files from the publish tree after build.
 * Used by the Netlify build command when publish = ".".
 * Do NOT run this against a local working tree you still need.
 */
const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');

const REMOVE_PATHS = [
  'BILLING.md',
  'MAILGUN-SETUP.md',
  'MELHORIAS.md',
  'NETLIFY-IDENTITY-SETUP.md',
  'PLANO-SEGURANCA-LOGIN.md',
  'README.md',
  'RECAPTCHA-SETUP.md',
  'SUPABASE-SETUP.md',
  'hanzi-logic/PROJECT.md',
  'package.json',
  'package-lock.json',
  'supabase',
  'propostas',
  '.env.example',
];

function rm(rel) {
  const full = path.join(ROOT, rel);
  if (!fs.existsSync(full)) return false;
  fs.rmSync(full, { recursive: true, force: true });
  return true;
}

let n = 0;
for (const rel of REMOVE_PATHS) {
  if (rm(rel)) {
    console.log(`scrubbed ${rel}`);
    n += 1;
  }
}

// Catch-all: any remaining markdown at repo root / one level deep
function walkMd(dir, depth) {
  if (depth > 2) return;
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if (entry.name === 'node_modules' || entry.name === '.git') continue;
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) walkMd(full, depth + 1);
    else if (entry.name.endsWith('.md')) {
      fs.rmSync(full, { force: true });
      console.log(`scrubbed ${path.relative(ROOT, full)}`);
      n += 1;
    }
  }
}
walkMd(ROOT, 0);

console.log(`Publish scrub complete (${n} paths removed)`);
