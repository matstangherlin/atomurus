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
  console.log('Site validation passed');
}

main();
