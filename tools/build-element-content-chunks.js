const fs = require('fs');
const path = require('path');
const vm = require('vm');

const ROOT = path.resolve(__dirname, '..');
const SOURCE = path.join(ROOT, 'tools', 'element-content-source.js');
const OUT_DIR = path.join(ROOT, 'assets', 'element-content');

function loadContentMaps() {
  const code = fs.readFileSync(SOURCE, 'utf8');
  const sandbox = {
    window: {},
    console,
  };
  vm.createContext(sandbox);
  vm.runInContext(code, sandbox, { filename: 'tools/element-content-source.js' });

  const pt = sandbox.window.ELEMENT_CONTENT_PT || {};
  const en = sandbox.window.ELEMENT_CONTENT_EN || {};
  return { pt, en };
}

function writeChunk(z, pt, en) {
  const outPath = path.join(OUT_DIR, `${String(z).padStart(3, '0')}.js`);
  const chunk = {
    pt: pt || null,
    en: en || null,
  };

  const code =
    `(function(){\n` +
    `  var chunk = ${JSON.stringify(chunk, null, 2)};\n` +
    `  window.__ELEMENT_CONTENT_CHUNKS = window.__ELEMENT_CONTENT_CHUNKS || {};\n` +
    `  window.__ELEMENT_CONTENT_CHUNKS[${z}] = chunk;\n` +
    `  if (typeof window.__registerElementContentChunk === 'function') {\n` +
    `    window.__registerElementContentChunk(${z}, chunk);\n` +
    `  }\n` +
    `})();\n`;

  fs.writeFileSync(outPath, code, 'utf8');
}

function main() {
  const { pt, en } = loadContentMaps();
  fs.mkdirSync(OUT_DIR, { recursive: true });

  const zs = new Set([
    ...Object.keys(pt).map(Number),
    ...Object.keys(en).map(Number),
  ]);

  for (const z of Array.from(zs).sort((a, b) => a - b)) {
    writeChunk(z, pt[z], en[z]);
  }

  console.log(`Generated ${zs.size} element content chunks in ${path.relative(ROOT, OUT_DIR)}`);
}

main();
