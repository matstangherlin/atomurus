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
  'docs/ui-v2-pricing.md',
  'docs/ui-v2-home.md',
  'assets/layouts/auth.css',
  'assets/layouts/pricing.css',
  'assets/layouts/docs.css',
  'assets/layouts/home.css',
  'assets/product-catalog.js',
  'tools/build-product-catalog.js'
];
for (const rel of required) {
  if (!fs.existsSync(path.join(root, rel))) fail(`missing ${rel}`);
}

const chromePages = [
  'index.html',
  'pricing.html',
  'about.html',
  'calculators.html',
  'periodic-table.html',
  'contact.html',
  'privacy.html',
  'terms.html',
  '404.html'
];
for (const rel of chromePages) {
  const html = read(rel);
  if (!html.includes('id="ps-shell"')) fail(`${rel} must contain #ps-shell in source`);
  if (!html.includes('data-ps-chrome')) fail(`${rel} must mark emitted chrome`);
}
const stillLegacy = ['calculators.html', 'periodic-table.html'];
for (const rel of stillLegacy) {
  const html = read(rel);
  if (html.includes('assets/ui/index.css')) fail(`${rel} must not load UI V2 yet`);
}
const migrated = [
  'index.html',
  'login.html',
  'pricing.html',
  'about.html',
  'contact.html',
  'privacy.html',
  'terms.html',
  '404.html'
];
for (const rel of migrated) {
  const html = read(rel);
  if (!html.includes('assets/ui/index.css')) fail(`${rel} must load UI V2`);
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

const pricing = read('pricing.html');
if (pricing.includes('app-workspace.css')) fail('pricing.html must not load app-workspace.css');
if (!pricing.includes('assets/layouts/pricing.css')) fail('pricing.html must load pricing layout CSS');
if (/<style>[\s\S]*\.price-grid/.test(pricing)) fail('pricing.html must not keep .price-grid in a page style block');
if (!pricing.includes('OPEN LAB') || !pricing.includes('FREE ACCOUNT')) {
  fail('pricing.html must keep the Open Lab / Free account ladder');
}

const docsCss = read('contact.html');
if (!docsCss.includes('assets/layouts/docs.css')) fail('contact.html must load docs layout CSS');
if (!docsCss.includes('id="cform"') || !docsCss.includes('id="cf-submit"')) {
  fail('contact.html must keep #cform and #cf-submit');
}
if (/There is no sign-up or login/.test(docsCss)) {
  fail('contact.html must not claim there is no login');
}

for (const rel of ['terms.html', 'privacy.html']) {
  const html = read(rel);
  if (!html.includes('assets/layouts/docs.css')) fail(`${rel} must load docs layout CSS`);
  if (/does not offer user accounts|there is no login|we do not run a user database/.test(html)) {
    fail(`${rel} must not claim the site has no accounts or login`);
  }
}

if (!read('build-i18n.js').includes('(<html\\b[^>]*)\\blang=')) {
  fail('build-i18n.js must match html tags that already have attributes before lang');
}
if (read('app.html').includes('id="ps-shell"') || read('app.html').includes('public-shell.css')) {
  fail('app.html must not use public chrome');
}
if (!read('assets/public-workspace.js').includes('enhanceExistingShell')) {
  fail('public-workspace.js must keep runtime enhanceExistingShell');
}

const home = read('index.html');
if (!home.includes('assets/ui/index.css')) fail('index.html must load UI V2');
if (!home.includes('assets/layouts/home.css')) fail('index.html must load home layout CSS');
if (!home.includes('assets/product-catalog.js')) fail('index.html must load the product catalog');
if (/html\.lang-pt-pending\s*\[data-i18n\]/.test(home)) {
  fail('index.html must not hide [data-i18n] behind lang-pt-pending');
}
if (/classList\.add\(['"]lang-pt-pending['"]\)/.test(home)) {
  fail('index.html must not add lang-pt-pending');
}
if (/5 instruments|5 Calculators/.test(home)) {
  fail('index.html must not keep HUD calculator counts');
}
if ((home.match(/class="lc-mod-card/g) || []).length !== 4) {
  fail('index.html must keep four pillar cards');
}
if (!/class="lc-mod-card[^"]*" href="explore\.html"/.test(home)) {
  fail('first Home pillar must be Explore');
}
if (!/class="lc-mod-card[^"]*" href="\/app"/.test(home)) {
  fail('Home Study pillar must open /app');
}
if (!home.includes('id="preview-grid"') || !home.includes('id="quick-search"') || !home.includes('id="theme-toggle"')) {
  fail('index.html must keep preview grid, #quick-search and #theme-toggle');
}

const catalogJs = read('assets/product-catalog.js');
const catalogM = catalogJs.match(/ATOMURUS_CATALOG\s*=\s*(\{[\s\S]*?\});/);
if (!catalogM) fail('product-catalog.js must assign window.ATOMURUS_CATALOG');
const catalog = JSON.parse(catalogM[1]);
const calcMarkup = read('calculators.html').replace(/<script\b[\s\S]*?<\/script>/gi, '');
const calcTargets = new Set([...calcMarkup.matchAll(/\sdata-target="([^"$]+)"/g)].map((m) => m[1]));
if (catalog.calculators !== calcTargets.size) {
  fail(`catalog calculators (${catalog.calculators}) must match calculators.html tabs (${calcTargets.size})`);
}
if (!home.includes(`data-catalog="calculators">${catalog.calculators}`)) {
  fail('Home calculator fallback must match the generated catalog');
}
if (!home.includes(`data-catalog="elements">${catalog.elements}`)) {
  fail('Home elements fallback must match the generated catalog');
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
