import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

const ROOT = path.resolve(import.meta.dirname, '..');
const SKIP_HTML_DIRS = new Set([
  'node_modules', '.git', 'netlify', 'tools', 'scripts', 'supabase',
  'hanzi-logic', 'propostas', 'dev', 'docs', 'templates', 'src', 'dist'
]);

function read(rel) {
  return fs.readFileSync(path.join(ROOT, rel), 'utf8');
}

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

const ignore = read('.netlifyignore');
const scrub = read('tools/scrub-publish-tree.js');
const netlify = read('netlify.toml');

assert.match(ignore, /^assets\/concepts\/$/m, '.netlifyignore must exclude assets/concepts/');
assert.match(scrub, /['"]assets\/concepts['"]/, 'scrub-publish-tree.js REMOVE_PATHS must include assets/concepts');
assert.match(
  netlify,
  /from\s*=\s*"\/assets\/concepts\/\*"[\s\S]*?status\s*=\s*404[\s\S]*?force\s*=\s*true/,
  'netlify.toml must 404 /assets/concepts/* with force'
);

const offenders = [];
for (const file of walkHtml(ROOT)) {
  const html = fs.readFileSync(file, 'utf8');
  if (html.includes('assets/concepts')) {
    offenders.push(path.relative(ROOT, file).replace(/\\/g, '/'));
  }
}
assert.deepEqual(offenders, [], 'published HTML must not reference assets/concepts');

const PNG = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);
const OG_MAX_BYTES = 200 * 1024;
const ogDir = path.join(ROOT, 'assets');
for (const name of fs.readdirSync(ogDir)) {
  if (!/^og-.*\.png$/i.test(name)) continue;
  const buf = fs.readFileSync(path.join(ogDir, name));
  assert.ok(buf.subarray(0, 8).equals(PNG), `${name} must be a PNG`);
  assert.equal(buf.toString('ascii', 12, 16), 'IHDR', `${name} must have an IHDR chunk`);
  assert.ok(buf.length <= OG_MAX_BYTES, `${name} is ${buf.length} bytes; limit is ${OG_MAX_BYTES}`);
  if (name === 'og-bhopal-disaster.png') {
    assert.equal(buf.readUInt32BE(16), 1200);
    assert.equal(buf.readUInt32BE(20), 630);
  }
}

console.log('test-image-publish-guards: ok');
