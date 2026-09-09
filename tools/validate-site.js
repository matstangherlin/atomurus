const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');

const FORBIDDEN_ROOT_FILES = [
  /\.zip$/i,
  /\.bak/i,
  /\.log$/i,
];

const REQUIRED_VARIANTS = [
  'viewer/isomerism/constitutional/function.pt.html',
  'viewer/isomerism/constitutional/chain.pt.html',
  'viewer/isomerism/constitutional/position.pt.html',
  'viewer/isomerism/constitutional/metamerism.pt.html',
  'viewer/isomerism/constitutional/tautomerism.pt.html',
  'viewer/isomerism/spatial/geometric.pt.html',
  'viewer/isomerism/spatial/optical.pt.html',
];

function fail(message) {
  throw new Error(message);
}

function read(relPath) {
  return fs.readFileSync(path.join(ROOT, relPath), 'utf8');
}

function assertRootNoForbiddenArchives() {
  const entries = fs.readdirSync(ROOT, { withFileTypes: true });
  const offenders = entries
    .filter((entry) => entry.isFile())
    .map((entry) => entry.name)
    .filter((name) => FORBIDDEN_ROOT_FILES.some((pattern) => pattern.test(name)));

  if (offenders.length) {
    fail(`Forbidden root artifacts detected: ${offenders.join(', ')}`);
  }
}

function assertDeployGuards() {
  const ignore = read('.netlifyignore');
  const netlify = read('netlify.toml');

  ['*.md', '*.bak*', '*.zip', 'tools/', 'scripts/', 'supabase/', 'package.json'].forEach((needle) => {
    if (!ignore.includes(needle)) {
      fail(`Missing .netlifyignore guard: ${needle}`);
    }
  });

  ['/tools/*', '/*.zip', '/*.bak*', '/MELHORIAS.md', '/supabase/*', '/package.json'].forEach((needle) => {
    if (!netlify.includes(needle)) {
      fail(`Missing netlify.toml block redirect: ${needle}`);
    }
  });
  if (!netlify.includes('scrub-publish-tree.js')) {
    fail('netlify.toml build command must scrub internal files before publish');
  }
}

function assertElementContentLoader() {
  const runtime = read('elements-content.js');
  if (!runtime.includes('loadElementContentFor') || !runtime.includes('__ELEMENT_CONTENT_CHUNKS')) {
    fail('elements-content.js is not using the chunk loader runtime');
  }

  const sampleChunk = path.join(ROOT, 'assets', 'element-content', '001.js');
  if (!fs.existsSync(sampleChunk)) {
    fail('Generated element content chunk assets/element-content/001.js is missing');
  }
}

function assertIsomerismVariants() {
  REQUIRED_VARIANTS.forEach((relPath) => {
    if (!fs.existsSync(path.join(ROOT, relPath))) {
      fail(`Missing generated PT variant: ${relPath}`);
    }
    const html = read(relPath);
    if (html.includes('location.replace(')) {
      fail(`PT variant still contains redirect stub: ${relPath}`);
    }
  });
  const generator = read('tools/generate-isomerism-pt-variants.js');
  if (generator.includes('<html lang="en-US"')) {
    fail('isomerism PT generator must match <html> tags that already have data-ps-chrome');
  }
  const source = read('viewer/isomerism/constitutional/function.html');
  if (!/(<html\b[^>]*)\blang="en-US"/.test(source)) {
    fail('isomerism EN source must keep lang="en-US" for PT variant generation');
  }
}

function assertReadme() {
  if (!fs.existsSync(path.join(ROOT, 'README.md'))) {
    fail('README.md is missing');
  }
}

function assertHomePreviewPayload() {
  const payloadPath = path.join(ROOT, 'home-preview-data.js');
  if (!fs.existsSync(payloadPath)) {
    fail('home-preview-data.js is missing');
  }
  const html = read('index.html');
  if (html.includes('elements-data.js')) {
    fail('index.html still depends on elements-data.js');
  }
  if (!html.includes('home-preview-data.js')) {
    fail('index.html is not loading home-preview-data.js');
  }
}

function assertPricingSurface() {
  if (!fs.existsSync(path.join(ROOT, 'pricing.html'))) {
    fail('pricing.html is missing');
  }
  if (!fs.existsSync(path.join(ROOT, 'ads-gate.js'))) {
    fail('ads-gate.js is missing');
  }
  if (!fs.existsSync(path.join(ROOT, 'netlify', 'lib', 'plan-access.mjs'))) {
    fail('netlify/lib/plan-access.mjs is missing');
  }
  if (!fs.existsSync(path.join(ROOT, 'netlify', 'lib', 'lab-tool-access.mjs'))) {
    fail('netlify/lib/lab-tool-access.mjs is missing');
  }
  if (!fs.existsSync(path.join(ROOT, 'assets', 'lab-tool-gate.js'))) {
    fail('assets/lab-tool-gate.js is missing');
  }
  const workspace = read('assets/public-workspace.js');
  if (!workspace.includes('lab-tool-gate.js')) {
    fail('public-workspace.js must inject lab-tool-gate.js');
  }
  const netlify = read('netlify.toml');
  if (!netlify.includes('/api/ads-config') || !netlify.includes('/pricing')) {
    fail('netlify.toml missing pricing/ads-config routes');
  }
}

function assertI18nNamespaceAssets() {
  const runtime = read('i18n.js');
  if (!runtime.includes('assets/i18n/')) {
    fail('i18n.js is not loading namespace chunks from assets/i18n/');
  }
  if (!runtime.includes('.json') || !runtime.includes('JSON.parse')) {
    fail('i18n.js is not loading JSON namespace chunks');
  }
  if (!runtime.includes('ensureNamespace(') || !runtime.includes('collectNamespaces(')) {
    fail('i18n.js is not using the namespace-loading runtime');
  }
  ['common', 'home', 'el'].forEach((ns) => {
    const relPath = path.join('assets', 'i18n', `${ns}.json`);
    if (!fs.existsSync(path.join(ROOT, relPath))) {
      fail(`Missing i18n namespace chunk: ${relPath}`);
    }
  });
}

function assertPerfGuards() {
  const index = read('index.html');
  if (/acscdn\.com\/script\/aclib\.js/.test(index)) {
    fail('index.html still loads AdCash eagerly in <head>');
  }
  if (!index.includes('ads-gate.js')) {
    fail('index.html is missing ads-gate.js');
  }
  if (!fs.existsSync(path.join(ROOT, 'viewer', 'load-three.js'))) {
    fail('viewer/load-three.js is missing');
  }
  if (!fs.existsSync(path.join(ROOT, 'ensure-elements-en.js'))) {
    fail('ensure-elements-en.js is missing');
  }
  if (!fs.existsSync(path.join(ROOT, 'assets', 'critical-lab.css'))) {
    fail('assets/critical-lab.css is missing — run npm run build:critical-css');
  }
  if (!index.includes('critical-lab.css')) {
    fail('index.html is not loading critical-lab.css');
  }
  if (!fs.existsSync(path.join(ROOT, 'assets', 'public-shell.css'))) {
    fail('assets/public-shell.css is missing');
  }
  if (!index.includes('public-shell.css')) {
    fail('index.html is not loading public-shell.css');
  }
  const app = read('app.html');
  if (app.includes('public-shell.css')) {
    fail('app.html must keep the workspace stylesheet, not public-shell.css');
  }
  if (index.includes('class="ws-body"')) {
    fail('index.html must stay a public landing page');
  }
  if (!/atomurus-lab-console\.css[^>]*media=["']print["']/.test(index) &&
      !/media=["']print["'][^>]*atomurus-lab-console\.css/.test(index)) {
    fail('index.html is not loading atomurus-lab-console.css asynchronously');
  }

  const molecules = read('viewer/molecules.html');
  if (/cdnjs\.cloudflare\.com\/ajax\/libs\/three\.js/.test(molecules)) {
    fail('viewer/molecules.html still loads three.min.js eagerly');
  }
  if (!molecules.includes('atomurusBootProViewer') || !molecules.includes('load-three.js')) {
    fail('viewer/molecules.html is not using entitlement-gated Three.js boot');
  }
  if (!molecules.includes('atomurusLoadViewerRuntime') || molecules.includes('WebGLRenderer')) {
    fail('viewer/molecules.html still embeds the interactive molecule runtime');
  }
  if (molecules.includes('const molData = {')) {
    fail('viewer/molecules.html still embeds molecule coordinates');
  }
  const gate = read('assets/lab-tool-gate.js');
  if (!gate.includes('conversion UI only') || !gate.includes('authorized server-side')) {
    fail('lab-tool-gate.js is still described as a security boundary');
  }
  const atomic = read('viewer/atomic-models.html');
  if (!atomic.includes('atomurusBootProViewer')) {
    fail('viewer/atomic-models.html is not using entitlement-gated Three.js boot');
  }
  if (!atomic.includes('atomurusLoadViewerRuntime') || atomic.includes('WebGLRenderer')) {
    fail('viewer/atomic-models.html still embeds the interactive atomic runtime');
  }
  const isomerism = read('viewer/isomerism/constitutional/function.html');
  if (!isomerism.includes('atomurusBootProViewer') || !isomerism.includes('atomurusLoadViewerRuntime')) {
    fail('isomerism viewer pages are not using entitlement-gated runtime loading');
  }
  if (/<script defer>\s*atomurusBootProViewer/.test(isomerism) || /load-three\.js[^"']*["']\s+defer/.test(isomerism)) {
    fail('isomerism viewer boot still uses defer on an inline script (runs before load-three.js)');
  }
  if (isomerism.includes('WebGLRenderer') || /src="\.\.\/isomerism-3d\.js/.test(isomerism)) {
    fail('isomerism viewer HTML still embeds the interactive 3D runtime');
  }
  const netlify = read('netlify.toml');
  if (!netlify.includes('/api/pro-lab/thermodynamics/solve') || !netlify.includes('/api/pro-lab/viewer/molecule')) {
    fail('netlify.toml missing Pro viewer/thermo routes');
  }

  const ptable = read('periodic-table.html');
  if (/elements-data-en\.js/.test(ptable) && !/ensure-elements-en\.js/.test(ptable)) {
    fail('periodic-table.html still loads elements-data-en.js eagerly');
  }
}

function assertStudyCloud() {
  const files = [
    'netlify/lib/require-feature.mjs',
    'netlify/lib/study-cloud.mjs',
    'netlify/lib/supabase-user-db.mjs',
    'netlify/functions/study-overview.mjs',
    'netlify/functions/study-items.mjs',
    'netlify/functions/study-item.mjs',
    'netlify/functions/study-calculator-history.mjs',
    'netlify/functions/study-progress.mjs',
    'netlify/functions/study-sets.mjs',
    'netlify/functions/study-set.mjs',
    'netlify/functions/study-card.mjs',
    'netlify/functions/study-cards-generate.mjs',
    'netlify/functions/study-review.mjs',
    'netlify/functions/study-review-overview.mjs',
    'netlify/functions/study-review-queue.mjs',
    'netlify/functions/study-insights.mjs',
    'netlify/lib/study-insights.mjs',
    'netlify/lib/review-scheduler.mjs',
    'study-client.js',
    'study-save.js',
    'study-progress.js',
    'study-boot.js',
    'supabase/migrations/005_study_cloud.sql',
    'supabase/migrations/008_study_sets_smart_review.sql',
    'supabase/migrations/009_pro_lab_sessions.sql',
    'supabase/migrations/010_chemistry_solver_sessions.sql',
    'netlify/lib/chemistry-calc.mjs',
    'netlify/lib/chemistry-units.mjs',
    'netlify/lib/chemistry-formula-strict.mjs',
    'netlify/lib/chemistry-reactions.mjs',
    'netlify/lib/chemistry-stoichiometry.mjs',
    'netlify/lib/chemistry-formula-solver.mjs',
    'netlify/lib/chemistry-solutions.mjs',
    'netlify/lib/canonical-elements.mjs',
    'netlify/lib/canonical-molecules.mjs',
    'netlify/lib/pro-lab.mjs',
    'netlify/functions/pro-lab-sessions.mjs',
    'netlify/functions/pro-lab-session.mjs',
    'netlify/functions/pro-lab-calculate.mjs',
    'netlify/functions/pro-lab-elements-compare.mjs',
    'netlify/functions/pro-lab-molecules-compare.mjs',
    'netlify/functions/pro-lab-atomic-compare.mjs',
    'netlify/functions/pro-lab-reaction-balance.mjs',
    'netlify/functions/pro-lab-reaction-solve.mjs',
    'netlify/functions/pro-lab-formula-solve.mjs',
    'netlify/functions/pro-lab-solutions-solve.mjs',
    'pro-lab.js',
    'pro-lab-reactions.js',
    'pro-lab-formula.js',
    'pro-lab-solutions.js',
    'assets/workspace-foundation.css'
  ];
  files.forEach((rel) => {
    if (!fs.existsSync(path.join(ROOT, rel))) fail(`${rel} is missing`);
  });
  const netlify = read('netlify.toml');
  ['/api/study/overview', '/api/study/items', '/api/study/item', '/api/study/calculator-history', '/api/study/progress', '/api/study/sets', '/api/study/review/queue', '/api/study/insights', '/api/study/cards/generate', '/api/pro-lab/sessions', '/api/pro-lab/calculate', '/api/pro-lab/elements/compare', '/api/pro-lab/reaction/balance', '/api/pro-lab/reaction/solve', '/api/pro-lab/formula/solve', '/api/pro-lab/solutions/solve'].forEach((route) => {
    if (!netlify.includes(route)) fail(`netlify.toml missing ${route}`);
  });
  const client = read('study-client.js');
  if (client.includes('localStorage') || client.includes('/api/auth/me')) {
    fail('study-client.js must not use localStorage or /api/auth/me');
  }
  const calc = read('netlify/lib/chemistry-calc.mjs');
  if (/(?:^|[^/\w])eval\s*\(/.test(calc) || /new Function\s*\(/.test(calc)) {
    fail('chemistry-calc.mjs must not use eval or new Function');
  }
  ['chemistry-reactions.mjs', 'chemistry-stoichiometry.mjs', 'chemistry-formula-solver.mjs', 'chemistry-solutions.mjs'].forEach((name) => {
    const src = read('netlify/lib/' + name);
    if (/(?:^|[^/\w])eval\s*\(/.test(src) || /new Function\s*\(/.test(src)) {
      fail(`${name} must not use eval or new Function`);
    }
  });
  ['calculators.html', 'periodic-table.html', 'explore.html'].forEach((rel) => {
    const html = read(rel);
    if (html.includes('requireFeature')) fail(`${rel} must not call requireFeature`);
  });
  const heatmap = read('periodic-table/heatmap.html');
  if ((heatmap.match(/id="cmp-slot-/g) || []).length !== 2) {
    fail('Free element compare must keep exactly two slots');
  }
}

function assertUiV2() {
  const files = [
    'assets/ui/tokens.css',
    'assets/ui/base.css',
    'assets/ui/typography.css',
    'assets/ui/buttons.css',
    'assets/ui/forms.css',
    'assets/ui/cards.css',
    'assets/ui/badges.css',
    'assets/ui/states.css',
    'assets/ui/navigation.css',
    'assets/ui/dialogs.css',
    'assets/ui/tables.css',
    'assets/ui/utilities.css',
    'assets/ui/compat.css',
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
    'docs/ui-v2-explore.md',
    'docs/ui-v2-calculators.md',
    'docs/ui-v2-config.md',
    'docs/ui-v2-periodic-table.md',
    'docs/ui-v2-viewer.md',
    'docs/ui-v2-workspace.md',
    'docs/ui-v2-hoist.md',
    'docs/ui-v2-i18n.md',
    'assets/layouts/auth.css',
    'assets/layouts/pricing.css',
    'assets/layouts/docs.css',
    'assets/layouts/home.css',
    'assets/layouts/explore.css',
    'assets/layouts/article.css',
    'assets/layouts/calculators.css',
    'assets/layouts/config.css',
    'assets/layouts/periodic-table.css',
    'assets/layouts/viewer.css',
    'assets/layouts/workspace.css',
    'assets/product-catalog.js',
    'tools/build-product-catalog.js'
  ];
  files.forEach((rel) => {
    if (!fs.existsSync(path.join(ROOT, rel))) fail(`${rel} is missing`);
  });
  const tokens = read('assets/ui/tokens.css');
  ['#F2EFE7', '#F8F5EC', '#14120E', '#1E6A50', '--radius-sm', '--radius-md', '--radius-lg', '--radius-pill'].forEach((needle) => {
    if (!tokens.includes(needle)) fail(`assets/ui/tokens.css missing ${needle}`);
  });
  const buttons = read('assets/ui/buttons.css');
  ['.ui-btn-primary', '.ui-btn-secondary', '.ui-btn-accent', '.ui-btn-danger'].forEach((cls) => {
    if (!buttons.includes(cls)) fail(`assets/ui/buttons.css missing ${cls}`);
  });
  const forms = read('assets/ui/forms.css');
  ['.ui-input', '.ui-select', '.ui-textarea', '.ui-field', '.ui-field-error'].forEach((cls) => {
    if (!forms.includes(cls)) fail(`assets/ui/forms.css missing ${cls}`);
  });
  const states = read('assets/ui/states.css');
  ['.ui-alert', '.ui-empty-state', '.ui-spinner'].forEach((cls) => {
    if (!states.includes(cls)) fail(`assets/ui/states.css missing ${cls}`);
  });
  const showcase = read('dev/ui.html');
  if (!showcase.includes('noindex')) fail('dev/ui.html must be noindex');
  if (!showcase.includes('assets/ui/index.css')) fail('dev/ui.html must load UI V2');
  if (showcase.includes('atomurus-lab-console.css') || showcase.includes('public-workspace.js')) {
    fail('dev/ui.html must not load lab-console or public-workspace');
  }
  if (!read('index.html').includes('assets/ui/index.css')) {
    fail('index.html must load UI V2 after the Home migration');
  }
  if (!read('index.html').includes('assets/layouts/home.css')) {
    fail('index.html must load assets/layouts/home.css');
  }
  if (!read('app.html').includes('assets/ui/index.css')) {
    fail('app.html must load UI V2 after the workspace alignment step');
  }
  const inject = read('tools/inject-public-shell.js');
  if (!inject.includes("'dev'")) fail('inject-public-shell.js must skip the dev/ gallery');
  if (!inject.includes("'templates'")) fail('inject-public-shell.js must skip templates/chrome');
  const workspace = read('assets/public-workspace.js');
  if (!workspace.includes('enhanceExistingShell')) {
    fail('public-workspace.js must enhance pre-emitted #ps-shell instead of skipping runtime');
  }
  if (/hoistToolShell|hoistLandingShell|buildPublicSidebar|ps-boot/.test(workspace)) {
    fail('public-workspace.js must not hoist or hide the body behind ps-boot');
  }
  if (!workspace.includes('lab-tool-gate.js')) {
    fail('public-workspace.js must keep lab-tool-gate.js');
  }
  const shellCss = read('assets/public-shell.css');
  if (!shellCss.includes("content: none") || /logo-tag::after \{[\s\S]*content: 'chemistry lab'/.test(shellCss)) {
    fail('public-shell.css must not paint the brand only via logo-tag::after');
  }
  if (shellCss.includes('ps-boot')) {
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
  for (const file of walkHtml(ROOT)) {
    const rel = path.relative(ROOT, file).replace(/\\/g, '/');
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
  for (const file of walkHtml(ROOT)) {
    const rel = path.relative(ROOT, file).replace(/\\/g, '/');
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
  const i18nDir = path.join(ROOT, 'assets', 'i18n');
  for (const name of fs.readdirSync(i18nDir)) {
    if (name.endsWith('.js')) fail('assets/i18n must publish JSON only; stale JS chunks lag the dictionary');
    if (!name.endsWith('.json')) continue;
    const chunk = read(`assets/i18n/${name}`);
    if (/does not offer user accounts|we do not run a user database|completely open, no accounts required/.test(chunk)) {
      fail(`assets/i18n/${name} must not deny that accounts exist`);
    }
  }
  [
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
  ].forEach((rel) => {
    const html = read(rel);
    if (!html.includes('id="ps-shell"')) fail(`${rel} must emit #ps-shell in source HTML`);
    if (!html.includes('data-ps-chrome')) fail(`${rel} must mark emitted chrome with data-ps-chrome`);
  });
  ['periodic-table/hydrogenium.html'].forEach((rel) => {
    if (read(rel).includes('assets/ui/index.css')) fail(`${rel} must not load UI V2 yet`);
  });
  [
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
  ].forEach((rel) => {
    if (!read(rel).includes('assets/ui/index.css')) fail(`${rel} must load UI V2`);
  });
  const pricingHtml = read('pricing.html');
  if (pricingHtml.includes('app-workspace.css')) fail('pricing.html must not load app-workspace.css');
  if (!pricingHtml.includes('assets/layouts/pricing.css')) fail('pricing.html must load assets/layouts/pricing.css');
  if (/<style>[\s\S]*\.price-grid/.test(pricingHtml)) {
    fail('pricing.html must not keep .price-grid in a page style block');
  }
  for (const rel of ['terms.html', 'privacy.html']) {
    if (/does not offer user accounts|there is no login|we do not run a user database/.test(read(rel))) {
      fail(`${rel} must not claim the site has no accounts or login`);
    }
  }
  if (!read('build-i18n.js').includes('(<html\\b[^>]*)\\blang=')) {
    fail('build-i18n.js must match html tags that already have attributes before lang');
  }
  const loginHtml = read('login.html');
  if (!loginHtml.includes('id="ps-shell"')) fail('login.html must emit #ps-shell in source HTML');
  if (!loginHtml.includes('data-ps-chrome')) fail('login.html must mark emitted chrome with data-ps-chrome');
  if (!loginHtml.includes('assets/ui/index.css')) fail('login.html must load UI V2');
  if (!loginHtml.includes('assets/layouts/auth.css')) fail('login.html must load assets/layouts/auth.css');
  if (/<style>[\s\S]*\.auth-shell/.test(loginHtml)) {
    fail('login.html must not keep auth layout in an inline style block');
  }
  if (/auth\.access|secure HttpOnly cookie|managed authentication|secure account flow/.test(loginHtml)) {
    fail('login.html must not keep developer-console copy in the primary UI');
  }
  if (!read('periodic-table.html').includes('data-i18n="common.brandTag">chemistry lab')) {
    fail('periodic-table.html must put chemistry lab in the DOM');
  }
  const login = read('login.html');
  if (!/lc-topnav-cta"[^>]*periodic-table/.test(login) || !/Open lab/.test(login)) {
    fail('login.html must keep Open lab → periodic-table');
  }
  const app = read('app.html');
  if (app.includes('id="ps-shell"') || app.includes('public-shell.css')) {
    fail('app.html must stay on workspace chrome, not public-shell');
  }
  if (!app.includes('assets/layouts/workspace.css')) {
    fail('app.html must load assets/layouts/workspace.css');
  }
  if (!app.includes('id="ws-search-q"') || !app.includes('id="ws-userchip"')) {
    fail('app.html must keep workspace search and user chip ids');
  }
  if (!/<html\b[^>]*data-theme="light"/.test(app)) {
    fail('app.html must default to light theme like public pages');
  }
  const workspaceLayout = read('assets/layouts/workspace.css').replace(/\/\*[\s\S]*?\*\//g, '');
  if (/\.ws-chart\b|\.ws-spark|\.ws-lab-z\b/.test(workspaceLayout)) {
    fail('workspace layout CSS must not restyle study charts or Pro Lab science');
  }
  const home = read('index.html');
  if (!home.includes('assets/layouts/home.css') || !home.includes('assets/product-catalog.js')) {
    fail('index.html must load home layout CSS and the product catalog');
  }
  if (/html\.lang-pt-pending\s*\[data-i18n\]/.test(home) || /classList\.add\(['"]lang-pt-pending['"]\)/.test(home)) {
    fail('index.html must not use lang-pt-pending to hide copy');
  }
  if (/5 instruments|5 Calculators/.test(home)) {
    fail('index.html must not keep HUD calculator counts');
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
  const explore = read('explore.html');
  if (!explore.includes('assets/layouts/explore.css')) {
    fail('explore.html must load assets/layouts/explore.css');
  }
  if ([...explore.matchAll(/<style>[\s\S]*?<\/style>/g)].some((m) => m[0].includes('.ex-card'))) {
    fail('explore.html must not keep .ex-card in a page style block');
  }
  if (!explore.includes('id="ex-search-input"') || !explore.includes('id="ex-articles"')) {
    fail('explore.html must keep #ex-search-input and #ex-articles');
  }
  const exploreScript = [...explore.matchAll(/<script>([\s\S]*?)<\/script>/g)]
    .map((m) => m[1])
    .find((s) => s.includes("getElementById('ex-search-input')"));
  if (!exploreScript) fail('explore.html must keep the article search script');
  try {
    new Function(exploreScript);
  } catch (err) {
    fail(`explore.html article search script must parse: ${err.message}`);
  }
  const calc = read('calculators.html');
  if (!calc.includes('assets/layouts/calculators.css')) {
    fail('calculators.html must load assets/layouts/calculators.css');
  }
  if (!calc.includes('data-target="molar"') || !calc.includes('id="mm-result-body"')) {
    fail('calculators.html must keep molar mass DOM');
  }
  const config = read('config.html');
  if (!config.includes('assets/layouts/config.css')) {
    fail('config.html must load assets/layouts/config.css');
  }
  if (!config.includes('id="lang-select"') || !config.includes('settings-toggle')) {
    fail('config.html must keep #lang-select and .settings-toggle');
  }
  if ([...config.matchAll(/<style>[\s\S]*?<\/style>/g)].some((m) => m[0].includes('.settings-section-title'))) {
    fail('config.html must not keep .settings-section-title in a page style block');
  }
  const tableLayout = read('assets/layouts/periodic-table.css').replace(/\/\*[\s\S]*?\*\//g, '');
  if (/\.el\b/.test(tableLayout) || /\.ptable\b/.test(tableLayout)) {
    fail('periodic-table layout CSS must not restyle .el cells or .ptable');
  }
  const table = read('periodic-table.html');
  if (!table.includes('assets/layouts/periodic-table.css')) {
    fail('periodic-table.html must load assets/layouts/periodic-table.css');
  }
  if (!table.includes('id="ptable"') || !table.includes('id="dl-action-btn"')) {
    fail('periodic-table.html must keep table DOM');
  }
  const viewerLayout = read('assets/layouts/viewer.css').replace(/\/\*[\s\S]*?\*\//g, '');
  if (/canvas|#viewer3d|#viewer2d|WebGL/i.test(viewerLayout)) {
    fail('viewer layout CSS must not mention canvases or WebGL');
  }
  const atomic = read('viewer/atomic-models.html');
  if (!atomic.includes('assets/layouts/viewer.css')) {
    fail('viewer/atomic-models.html must load assets/layouts/viewer.css');
  }
  if (!atomic.includes('data-pro-lab-tool="atomic"') || !atomic.includes('id="viewer3d"')) {
    fail('viewer/atomic-models.html must keep data-pro-lab-tool="atomic" and #viewer3d');
  }
  const molecules = read('viewer/molecules.html');
  if (!molecules.includes('assets/layouts/viewer.css') || !molecules.includes('id="viewer3d"')) {
    fail('viewer/molecules.html must load viewer layout CSS and keep #viewer3d');
  }
  if (read('explore/viewer/methyl-isocyanate.html').includes('assets/layouts/viewer.css')) {
    fail('explore/viewer articles must not load viewer layout CSS');
  }
  const atom = read('explore/what-is-an-atom.html');
  if (!atom.includes('assets/ui/index.css') || !atom.includes('assets/layouts/article.css')) {
    fail('explore articles must load UI V2 and article layout CSS');
  }
}

function main() {
  assertRootNoForbiddenArchives();
  assertDeployGuards();
  assertElementContentLoader();
  assertIsomerismVariants();
  assertReadme();
  assertHomePreviewPayload();
  assertI18nNamespaceAssets();
  assertPricingSurface();
  assertPerfGuards();
  assertStudyCloud();
  assertUiV2();
  console.log('Site validation passed');
}

main();
