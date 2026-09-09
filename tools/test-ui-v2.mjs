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
  'dev/ui.html',
  'templates/chrome/public-sidebar.html',
  'templates/chrome/search.html',
  'templates/chrome/brand.html',
  'tools/inject-ui-chrome.js',
  'docs/ui-v2-chrome.md',
  'docs/ui-v2-auth.md',
  'assets/layouts/auth.css'
];
for (const rel of required) {
  if (!fs.existsSync(path.join(root, rel))) fail(`missing ${rel}`);
}

const chromePages = [
  'index.html',
  'pricing.html',
  'about.html',
  'calculators.html',
  'periodic-table.html'
];
for (const rel of chromePages) {
  const html = read(rel);
  if (!html.includes('id="ps-shell"')) fail(`${rel} must contain #ps-shell in source`);
  if (!html.includes('data-ps-chrome')) fail(`${rel} must mark emitted chrome`);
  if (html.includes('assets/ui/index.css')) fail(`${rel} must not load UI V2 yet`);
}
const login = read('login.html');
if (!login.includes('id="ps-shell"')) fail('login.html must contain #ps-shell in source');
if (!login.includes('data-ps-chrome')) fail('login.html must mark emitted chrome');
if (!login.includes('assets/ui/index.css')) fail('login.html must load UI V2');
if (!login.includes('assets/layouts/auth.css')) fail('login.html must load auth layout CSS');
if (!login.includes('Open lab')) fail('login CTA must stay Open lab');
if (/<style>[\s\S]*\.auth-shell/.test(login)) fail('login.html must not keep auth layout inline');
if (/auth\.access|secure HttpOnly cookie|managed authentication|secure account flow/.test(login)) {
  fail('login.html must not keep developer-console copy');
}
if (!login.includes('id="auth-email"')) fail('login.html must keep #auth-email');
if (read('app.html').includes('id="ps-shell"') || read('app.html').includes('public-shell.css')) {
  fail('app.html must not use public chrome');
}
if (!read('assets/public-workspace.js').includes('enhanceExistingShell')) {
  fail('public-workspace.js must keep runtime enhanceExistingShell');
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
