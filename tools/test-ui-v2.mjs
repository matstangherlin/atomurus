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
  'templates/chrome/viewer-local-nav.html',
  'assets/global-nav.js',
  'templates/chrome/search.html',
  'templates/chrome/brand.html',
  'tools/inject-ui-chrome.js',
  'docs/ui-v2-chrome.md',
  'docs/ui-v2-auth.md',
  'docs/ui-v2-pricing.md',
  'docs/ui-v2-home.md',
  'docs/ui-v2-explore.md',
  'assets/layouts/auth.css',
  'assets/layouts/pricing.css',
  'assets/layouts/docs.css',
  'assets/layouts/home.css',
  'assets/layouts/explore.css',
  'assets/layouts/article.css',
  'assets/layouts/calculators.css',
  'docs/ui-v2-calculators.md',
  'docs/ui-v2-config.md',
  'docs/ui-v2-periodic-table.md',
  'docs/ui-v2-viewer.md',
  'docs/ui-v2-workspace.md',
  'docs/ui-v2-hoist.md',
  'docs/ui-v2-i18n.md',
  'docs/ui-v2-report.md',
  'docs/ui-v2-global-shell.md',
  'docs/ui-v2-product-shell-final.md',
  'tools/capture-ui-v2.mjs',
  'assets/layouts/config.css',
  'assets/layouts/periodic-table.css',
  'assets/layouts/viewer.css',
  'assets/layouts/workspace.css',
  'assets/layouts/shell.css',
  'assets/product-catalog.js',
  'assets/pro-features.js',
  'templates/chrome/account-control.html',
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
  'config.html',
  'periodic-table.html',
  'viewer/atomic-models.html',
  'contact.html',
  'privacy.html',
  'terms.html',
  '404.html'
];
for (const rel of chromePages) {
  const html = read(rel);
  if (!html.includes('id="ps-shell"')) fail(`${rel} must contain #ps-shell in source`);
  if (!html.includes('data-ps-chrome')) fail(`${rel} must mark emitted chrome`);
  if (!html.includes('data-atomurus-sidebar')) fail(`${rel} must emit the official sidebar`);
  if (!html.includes('assets/global-nav.js')) fail(`${rel} must load global-nav.js`);
}
if (!read('app.html').includes('data-atomurus-sidebar')) {
  fail('app.html must use the official sidebar markup');
}
if (!read('app.html').includes('assets/global-nav.js')) {
  fail('app.html must load global-nav.js');
}
const stillLegacy = ['periodic-table/hydrogenium.html'];
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
  '404.html',
  'explore.html',
  'calculators.html',
  'config.html',
  'periodic-table.html',
  'viewer/atomic-models.html',
  'viewer/molecules.html',
  'viewer/allotropes.html',
  'viewer/isomerism.html',
  'app.html'
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
if (!read('login.html').includes('Open lab')) fail('login CTA must stay Open lab');
if (read('login.html').includes('data-atomurus-account')) {
  fail('login.html must not replace Open lab with the Account chip');
}
if (!read('index.html').includes('data-atomurus-account')) {
  fail('index.html must emit the Account chip');
}
if (!read('periodic-table.html').includes('data-atomurus-account')) {
  fail('periodic-table.html must emit the Account chip');
}
if (!read('calculators.html').includes('data-atomurus-account')) {
  fail('calculators.html must emit the Account chip');
}
if (!read('calculators.html').includes('data-atomurus-sidebar')) {
  fail('calculators.html must emit the official sidebar');
}
{
  const calc = read('calculators.html');
  const start = calc.indexOf('data-atomurus-sidebar');
  const end = calc.indexOf('</aside>', start);
  const aside = start >= 0 && end > start ? calc.slice(start, end) : '';
  if (aside.includes('nav-expandable') || aside.includes('data-target="molar"')) {
    fail('calculators global sidebar must not include calculator instruments');
  }
}
if (!read('app.html').includes('data-atomurus-account')) {
  fail('app.html must keep the Account chip slot');
}
if (!read('assets/public-workspace.js').includes('ensureAccountControl')) {
  fail('public-workspace.js must keep an Account chip fallback');
}
const dictSource = read('tools/i18n-dict-source.js');
if (!/login:\s+'Account'/.test(dictSource)) fail('common.nav.login must be Account');
if (!read('atomurus-mobile-nav.js').includes('ws-sidebar')) {
  fail('mobile drawer must reuse #ws-sidebar');
}
if (/label: 'Study'/.test(read('atomurus-mobile-nav.js'))) {
  fail('mobile drawer must not keep Study as the /app label');
}
if (!read('i18n.js').includes('guestLoginHref')) {
  fail('i18n.js must encode next= on the Account chip');
}
if (!read('templates/chrome/public-sidebar.html').includes('common.nav.workspace')) {
  fail('public sidebar must expose Workspace');
}
if (!read('templates/chrome/public-sidebar.html').includes('data-atomurus-sidebar')) {
  fail('public sidebar must be the official Atomurus sidebar');
}
if (!read('templates/chrome/public-sidebar.html').includes('data-nav="viewer"')) {
  fail('global sidebar Viewer must be a single item');
}
if (/nav-expandable|common.nav.settings/.test(read('templates/chrome/public-sidebar.html'))) {
  fail('global sidebar must not expand Viewer or list Settings');
}
if (!read('assets/global-nav.js').includes('LAB_NAV')) {
  fail('global-nav.js must own LAB_NAV');
}
if (!read('atomurus-mobile-nav.js').includes('ws-sidebar')) {
  fail('mobile drawer must reuse #ws-sidebar');
}
if (/label: 'Study'/.test(read('atomurus-mobile-nav.js'))) {
  fail('mobile drawer must not keep Study as the /app label');
}
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
const app = read('app.html');
if (!app.includes('assets/ui/index.css')) fail('app.html must load UI V2');
if (!app.includes('assets/layouts/workspace.css')) fail('app.html must load workspace layout CSS');
if (!app.includes('id="ws-search-q"') || !app.includes('id="ws-userchip"') || !app.includes('id="app-study"')) {
  fail('app.html must keep #ws-search-q, #ws-userchip and #app-study');
}
if (!/<html\b[^>]*data-theme="light"/.test(app)) {
  fail('app.html must default to light theme like public pages');
}
if (/requireSession\(/.test(app)) fail('app.html must stay a public guest workspace');
if (!read('workspace-ui.js').includes('ui-btn-accent')) {
  fail('workspace dialog primary must dual-class ui-btn-accent (green), not ui-btn-primary');
}
if (!read('assets/public-workspace.js').includes('enhanceExistingShell')) {
  fail('public-workspace.js must keep runtime enhanceExistingShell');
}
const publicWorkspace = read('assets/public-workspace.js');
if (/hoistToolShell|hoistLandingShell|buildPublicSidebar|ps-boot/.test(publicWorkspace)) {
  fail('public-workspace.js must not hoist or hide the body behind ps-boot');
}
if (!publicWorkspace.includes('lab-tool-gate.js')) {
  fail('public-workspace.js must still inject lab-tool-gate.js');
}
if (read('assets/public-shell.css').includes('ps-boot')) {
  fail('public-shell.css must not hide the body behind ps-boot');
}

const SKIP_HTML_DIRS = new Set([
  'node_modules', '.git', 'netlify', 'tools', 'scripts', 'supabase',
  'hanzi-logic', 'propostas', 'dev', 'docs', 'templates'
]);
const HOIST_EXCEPTIONS = new Set([
  'explore/viewer/methyl-isocyanate.html',
  'explore/viewer/methyl-isocyanate.pt.html'
]);

function walkHtml(dir, out = []) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if (entry.name.startsWith('.')) continue;
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      if (SKIP_HTML_DIRS.has(entry.name)) continue;
      walkHtml(full, out);
    } else if (entry.name.endsWith('.html')) out.push(full);
  }
  return out;
}

for (const file of walkHtml(root)) {
  const rel = path.relative(root, file).replace(/\\/g, '/');
  const html = fs.readFileSync(file, 'utf8');
  if (!html.includes('public-workspace.js')) continue;
  if (HOIST_EXCEPTIONS.has(rel)) {
    if (html.includes('id="ps-shell"')) {
      fail(`${rel} must keep compact article chrome, not #ps-shell`);
    }
    continue;
  }
  if (!html.includes('id="ps-shell"')) {
    fail(`${rel} loads public-workspace.js but has no #ps-shell`);
  }
}

for (const file of walkHtml(root)) {
  const rel = path.relative(root, file).replace(/\\/g, '/');
  const html = fs.readFileSync(file, 'utf8');
  if (/html\.lang-pt-pending\s*\[data-i18n\]/.test(html) || /classList\.add\(['"]lang-pt-pending['"]\)/.test(html)) {
    fail(`${rel} must not hide copy behind lang-pt-pending`);
  }
  if (/class="ph-kicker"[^>]*>§/.test(html)) {
    fail(`${rel} ph-kicker fallback must not use Bloomberg § marks`);
  }
}

if (/No accounts/.test(read('config.html')) || /No accounts/.test(read('config.pt.html'))) {
  fail('config privacy row must not say No accounts');
}

const i18nDir = path.join(root, 'assets', 'i18n');
for (const name of fs.readdirSync(i18nDir)) {
  if (name.endsWith('.js')) fail('assets/i18n must publish JSON only; stale JS chunks lag the dictionary');
  if (!name.endsWith('.json')) continue;
  const chunk = read(`assets/i18n/${name}`);
  if (/does not offer user accounts|we do not run a user database|completely open, no accounts required/.test(chunk)) {
    fail(`assets/i18n/${name} must not deny that accounts exist`);
  }
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

function assertExploreSearchScriptParses(html, label) {
  const scripts = [...html.matchAll(/<script>([\s\S]*?)<\/script>/g)].map((m) => m[1]);
  const hub = scripts.find((s) => s.includes("getElementById('ex-search-input')"));
  if (!hub) fail(`${label} must keep the article search script`);
  if (!hub.includes('\\u0300-\\u036f')) {
    fail(`${label} search normalize must use ASCII unicode escapes`);
  }
  try {
    new Function(hub);
  } catch (err) {
    fail(`${label} article search script must parse: ${err.message}`);
  }
}

const explore = read('explore.html');
if (!explore.includes('assets/ui/index.css')) fail('explore.html must load UI V2');
if (!explore.includes('assets/layouts/explore.css')) fail('explore.html must load explore layout CSS');
if ([...explore.matchAll(/<style>[\s\S]*?<\/style>/g)].some((m) => m[0].includes('.ex-card'))) {
  fail('explore.html must not keep .ex-card in a page style block');
}
if (!explore.includes('id="ex-search-input"') || !explore.includes('id="ex-articles"')) {
  fail('explore.html must keep #ex-search-input and #ex-articles');
}
if (!explore.includes('class="ex-title"') || !explore.includes('class="ex-pill active"')) {
  fail('explore.html must keep .ex-title and .ex-pill');
}
assertExploreSearchScriptParses(explore, 'explore.html');
assertExploreSearchScriptParses(read('explore.pt.html'), 'explore.pt.html');

const calc = read('calculators.html');
if (!calc.includes('assets/ui/index.css')) fail('calculators.html must load UI V2');
if (!calc.includes('assets/layouts/calculators.css')) fail('calculators.html must load calculators layout CSS');
if (!calc.includes('data-target="molar"') || !calc.includes('data-target="scientific"')) {
  fail('calculators.html must keep molar and scientific tabs');
}
if (!calc.includes('class="calc-btn-run ui-btn ui-btn-accent"')) {
  fail('calculators.html must dual-class Compute as ui-btn-accent');
}
if (!calc.includes('id="mm-input"') || !calc.includes('id="mm-result-body"')) {
  fail('calculators.html must keep molar mass DOM ids');
}
if (!read('calculators.pt.html').includes('assets/layouts/calculators.css')) {
  fail('calculators.pt.html must load calculators layout CSS');
}

const config = read('config.html');
if (!config.includes('assets/ui/index.css')) fail('config.html must load UI V2');
if (!config.includes('assets/layouts/config.css')) fail('config.html must load config layout CSS');
if (!config.includes('id="lang-select"') || !config.includes('settings-toggle')) {
  fail('config.html must keep #lang-select and .settings-toggle');
}
if (!config.includes('id="toggle-anim"') || !config.includes('id="theme-seg"')) {
  fail('config.html must keep #toggle-anim and #theme-seg');
}
if ([...config.matchAll(/<style>[\s\S]*?<\/style>/g)].some((m) => m[0].includes('.settings-section-title'))) {
  fail('config.html must not keep .settings-section-title in a page style block');
}
if (!read('config.pt.html').includes('assets/layouts/config.css')) {
  fail('config.pt.html must load config layout CSS');
}

const tableLayout = read('assets/layouts/periodic-table.css').replace(/\/\*[\s\S]*?\*\//g, '');
if (/\.el\b/.test(tableLayout) || /\.ptable\b/.test(tableLayout)) {
  fail('periodic-table layout CSS must not restyle .el cells or .ptable');
}
const table = read('periodic-table.html');
if (!table.includes('assets/ui/index.css')) fail('periodic-table.html must load UI V2');
if (!table.includes('assets/layouts/periodic-table.css')) fail('periodic-table.html must load table layout CSS');
if (!table.includes('id="search-input"') || !table.includes('id="ptable"')) {
  fail('periodic-table.html must keep #search-input and #ptable');
}
if (!table.includes('id="dl-action-btn"') || !table.includes('class="pt-tab active"')) {
  fail('periodic-table.html must keep #dl-action-btn and .pt-tab');
}
if (!table.includes('data-i18n="common.brandTag">chemistry lab')) {
  fail('periodic-table.html must keep chemistry lab in the DOM');
}
for (const rel of [
  'periodic-table.pt.html',
  'periodic-table/heatmap.html',
  'periodic-table/trends.html',
  'periodic-table/compare.html',
  'periodic-table/isotopes.html'
]) {
  if (!read(rel).includes('assets/layouts/periodic-table.css')) {
    fail(`${rel} must load table layout CSS`);
  }
}

const viewerLayout = read('assets/layouts/viewer.css').replace(/\/\*[\s\S]*?\*\//g, '');
if (/canvas|#viewer3d|#viewer2d|WebGL/i.test(viewerLayout)) {
  fail('viewer layout CSS must not mention canvases or WebGL');
}
const atomic = read('viewer/atomic-models.html');
if (!atomic.includes('assets/ui/index.css')) fail('viewer/atomic-models.html must load UI V2');
if (!atomic.includes('assets/layouts/viewer.css')) fail('viewer/atomic-models.html must load viewer layout CSS');
if (!atomic.includes('data-pro-lab-tool="atomic"') || !atomic.includes('id="viewer3d"')) {
  fail('viewer/atomic-models.html must keep data-pro-lab-tool="atomic" and #viewer3d');
}
const molecules = read('viewer/molecules.html');
if (!molecules.includes('assets/layouts/viewer.css')) fail('viewer/molecules.html must load viewer layout CSS');
if (!molecules.includes('id="viewer3d"') || !molecules.includes('id="viewer2d-full"')) {
  fail('viewer/molecules.html must keep #viewer3d and #viewer2d-full');
}
if (!molecules.includes('data-pro-lab-tool="molecules"')) {
  fail('viewer/molecules.html must keep data-pro-lab-tool="molecules"');
}
const allotropes = read('viewer/allotropes.html');
if (!allotropes.includes('assets/layouts/viewer.css')) fail('viewer/allotropes.html must load viewer layout CSS');
if (!allotropes.includes('id="viewer3d"')) {
  fail('viewer/allotropes.html must keep #viewer3d');
}
const isomerism = read('viewer/isomerism.html');
if (!isomerism.includes('assets/layouts/viewer.css')) fail('viewer/isomerism.html must load viewer layout CSS');
if (!isomerism.includes('class="vz-tab') || !isomerism.includes('class="ph-title"')) {
  fail('viewer/isomerism.html must keep .vz-tab and .ph-title');
}
if (read('explore/viewer/methyl-isocyanate.html').includes('assets/layouts/viewer.css')) {
  fail('explore/viewer articles must not load viewer layout CSS');
}
for (const rel of [
  'viewer/atomic-models.pt.html',
  'viewer/molecules.pt.html',
  'viewer/allotropes.pt.html',
  'viewer/isomerism.pt.html',
  'viewer/atomic-models/dalton.html',
  'viewer/atomic-models/dalton.pt.html',
  'viewer/atomic-models/thomson.html',
  'viewer/atomic-models/thomson.pt.html',
  'viewer/atomic-models/rutherford.html',
  'viewer/atomic-models/rutherford.pt.html',
  'viewer/atomic-models/bohr.html',
  'viewer/atomic-models/bohr.pt.html',
  'viewer/atomic-models/quantum.html',
  'viewer/atomic-models/quantum.pt.html',
  'viewer/isomerism/constitutional/function.html',
  'viewer/isomerism/constitutional/chain.html',
  'viewer/isomerism/constitutional/position.html',
  'viewer/isomerism/constitutional/metamerism.html',
  'viewer/isomerism/constitutional/tautomerism.html',
  'viewer/isomerism/spatial/geometric.html',
  'viewer/isomerism/spatial/optical.html'
]) {
  if (!read(rel).includes('assets/layouts/viewer.css')) {
    fail(`${rel} must load viewer layout CSS`);
  }
}

const workspaceLayout = read('assets/layouts/workspace.css').replace(/\/\*[\s\S]*?\*\//g, '');
if (/\.ws-chart\b|\.ws-spark|\.ws-lab-z\b/.test(workspaceLayout)) {
  fail('workspace layout CSS must not restyle study charts or Pro Lab science');
}

const atom = read('explore/what-is-an-atom.html');
if (!atom.includes('assets/ui/index.css')) fail('explore articles must load UI V2');
if (!atom.includes('assets/layouts/article.css')) fail('explore articles must load article layout CSS');
if (!atom.includes('id="art-body"') || !atom.includes('class="art-title"')) {
  fail('articles must keep .art-title and #art-body');
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

const afterCombos = ['desktop-light', 'desktop-dark', 'mobile-light', 'mobile-dark'];
const afterRoutes = ['home', 'login', 'pricing', 'about', 'periodic-table', 'calculators', 'explore', 'viewer', 'app', 'ui-gallery'];
for (const combo of afterCombos) {
  for (const route of afterRoutes) {
    const rel = `docs/ui-v2-after/${combo}/${route}.png`;
    const full = path.join(root, rel);
    if (!fs.existsSync(full)) fail(`missing ${rel}`);
    const buf = fs.readFileSync(full);
    if (buf.length < 2000) fail(`${rel} is too small (${buf.length})`);
    if (buf[0] !== 0x89 || buf[1] !== 0x50 || buf[2] !== 0x4E || buf[3] !== 0x47) {
      fail(`${rel} is not a PNG`);
    }
  }
}

console.log('ui-v2 contracts passed');
