const fs = require('fs');
const path = require('path');

const { DICT } = require('./i18n-dict-source');

const ROOT = path.resolve(__dirname, '..');
const OUT_DIR = path.join(ROOT, 'assets', 'i18n');

function ensureDir(dir) {
  fs.mkdirSync(dir, { recursive: true });
}

function getNamespaces() {
  const langs = Object.keys(DICT);
  const namespaces = new Set();
  langs.forEach((lang) => {
    Object.keys(DICT[lang] || {}).forEach((ns) => namespaces.add(ns));
  });
  return Array.from(namespaces).sort();
}

function buildChunk(ns) {
  const chunk = {};
  Object.keys(DICT).forEach((lang) => {
    chunk[lang] = (DICT[lang] && DICT[lang][ns]) || {};
  });
  return chunk;
}

function writeChunk(ns, chunk) {
  const json = JSON.stringify(chunk);
  fs.writeFileSync(path.join(OUT_DIR, `${ns}.json`), json, 'utf8');
  // Script form of the same chunk. Pages load it with <script defer> before
  // i18n.js (see tools/inject-i18n-chunks.js), so translations are already in
  // memory when i18n.js runs — no synchronous XHR freezing the page.
  fs.writeFileSync(
    path.join(OUT_DIR, `${ns}.js`),
    `(window.__ATOMURUS_I18N__=window.__ATOMURUS_I18N__||{})[${JSON.stringify(ns)}]=${json};\n`,
    'utf8'
  );
}

function main() {
  ensureDir(OUT_DIR);
  const namespaces = getNamespaces();
  namespaces.forEach((ns) => writeChunk(ns, buildChunk(ns)));
  console.log(`Generated ${namespaces.length} i18n namespace chunks in ${path.relative(ROOT, OUT_DIR)}`);
}

main();
