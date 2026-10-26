#!/usr/bin/env node
// Removes the hidden "coming soon" paragraph from element pages.
// The eight periodic-table HTML files without this line are left untouched.
import { readdirSync, readFileSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const DIR = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', 'periodic-table');
const STUB = '        <p class="stub" data-i18n="el.stub">Dedicated page — expanded content coming soon.</p>';

function main() {
  let files = 0;
  let removed = 0;
  for (const name of readdirSync(DIR)) {
    if (!name.endsWith('.html')) continue;
    const full = path.join(DIR, name);
    const text = readFileSync(full, 'utf8');
    const lines = text.split('\n');
    let hits = 0;
    const next = lines.filter((line) => {
      if (line !== STUB) return true;
      hits += 1;
      return false;
    });
    if (!hits) continue;
    writeFileSync(full, next.join('\n'));
    files += 1;
    removed += hits;
  }
  console.log(`removed ${removed} stub lines from ${files} files`);
}

const invokedDirectly = process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url);
if (invokedDirectly) main();
