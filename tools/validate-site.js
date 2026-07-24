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

  ['/tools/*', '/*.zip', '/*.bak*', '/*.md', '/supabase/*', '/package.json'].forEach((needle) => {
    if (!netlify.includes(needle)) {
      fail(`Missing netlify.toml block redirect: ${needle}`);
    }
  });
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
  if (!fs.existsSync(path.join(ROOT, 'netlify', 'functions', 'ads-config.mjs'))) {
    fail('netlify/functions/ads-config.mjs is missing');
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
  if (!/atomurus-lab-console\.css[^>]*media=["']print["']/.test(index) &&
      !/media=["']print["'][^>]*atomurus-lab-console\.css/.test(index)) {
    fail('index.html is not loading atomurus-lab-console.css asynchronously');
  }

  const molecules = read('viewer/molecules.html');
  if (/cdnjs\.cloudflare\.com\/ajax\/libs\/three\.js/.test(molecules)) {
    fail('viewer/molecules.html still loads three.min.js eagerly');
  }
  if (!molecules.includes('atomurusBootViewer') || !molecules.includes('load-three.js')) {
    fail('viewer/molecules.html is not using lazy Three.js boot');
  }

  const ptable = read('periodic-table.html');
  if (/elements-data-en\.js/.test(ptable) && !/ensure-elements-en\.js/.test(ptable)) {
    fail('periodic-table.html still loads elements-data-en.js eagerly');
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
  console.log('Site validation passed');
}

main();
