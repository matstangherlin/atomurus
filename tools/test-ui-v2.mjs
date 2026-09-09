#!/usr/bin/env node
/** Static contracts for Atomurus UI V2. Does not restyle production pages. */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const read = (rel) => fs.readFileSync(path.join(root, rel), 'utf8');

function fail(msg) {
  console.error(msg);
  process.exit(1);
}

const required = [
  'assets/ui/tokens.css',
  'assets/ui/index.css',
  'dev/ui.html'
];
for (const rel of required) {
  if (!fs.existsSync(path.join(root, rel))) fail(`missing ${rel}`);
}

const tokens = read('assets/ui/tokens.css');
if (!tokens.includes('--space-1: 4px') || !tokens.includes('--space-8: 64px')) {
  fail('spacing scale must be 4–64');
}

const bundle = [
  'tokens', 'base', 'typography', 'buttons', 'forms', 'cards', 'badges',
  'states', 'navigation', 'dialogs', 'tables', 'utilities', 'compat'
].map((name) => read(`assets/ui/${name}.css`)).join('\n');

const important = bundle.match(/!important/g) || [];
if (important.length > 4) {
  fail(`UI V2 should stay almost free of !important (found ${important.length})`);
}

const showcase = read('dev/ui.html');
if (/\sstyle="/.test(showcase)) fail('dev/ui.html must not use inline style attributes');
if (!showcase.includes('class="ui-root"')) fail('showcase must use .ui-root');

console.log('ui-v2 contracts passed');
