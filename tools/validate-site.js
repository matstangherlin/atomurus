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

  ['*.md', '*.bak*', '*.zip', 'tools/', 'scripts/'].forEach((needle) => {
    if (!ignore.includes(needle)) {
      fail(`Missing .netlifyignore guard: ${needle}`);
    }
  });

  ['/tools/*', '/*.zip', '/*.bak*'].forEach((needle) => {
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

function main() {
  assertRootNoForbiddenArchives();
  assertDeployGuards();
  assertElementContentLoader();
  assertIsomerismVariants();
  assertReadme();
  console.log('Site validation passed');
}

main();
