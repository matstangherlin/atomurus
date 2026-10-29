import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

const ROOT = path.resolve(import.meta.dirname, '..');

const REMOVED = [
  'dev',
  'e2e',
  'src',
  'playwright.config.js',
  'build-i18n.js',
  'bump-version.js',
  'bump-version.ps1',
  'add-content-script.js',
  'add-share-script.js',
  'enrich-element-schema.js',
  'fix-adsense-head.js',
  'fix-element-i18n.js',
  'fix-mobile-scroll.js',
  'migrate-element-seo.js',
  'patch.js',
  'sync-en-meta.js',
  'assets/concepts',
  'docs',
  'propostas',
  'supabase'
];

const KEPT = [
  'elements-data.js',
  'assets/i18n/molecules.json',
  'netlify/functions/contact-send.js',
  'manifest.json',
  'index.html'
];

function scrubSource() {
  return fs.readFileSync(path.join(ROOT, 'tools', 'scrub-publish-tree.js'), 'utf8');
}

export function assertScrubSource(text) {
  if (/'elements-data\.js'/.test(text) || /"elements-data\.js"/.test(text)) {
    throw new Error('REMOVE_PATHS must not include elements-data.js');
  }
  if (/molecules\.json/.test(text)) {
    throw new Error('REMOVE_PATHS must not include assets/i18n/molecules.json');
  }
}

function copyTracked(dest) {
  const listed = spawnSync('git', ['ls-files', '-z'], { cwd: ROOT, encoding: 'buffer' });
  if (listed.status !== 0) throw new Error('git ls-files failed');
  const files = listed.stdout.toString('utf8').split('\0').filter(Boolean);
  for (const rel of files) {
    const from = path.join(ROOT, rel);
    const to = path.join(dest, rel);
    if (!fs.existsSync(from) || !fs.statSync(from).isFile()) continue;
    fs.mkdirSync(path.dirname(to), { recursive: true });
    fs.copyFileSync(from, to);
  }
}

function localRef(fromRel, raw) {
  const cut = String(raw || '').trim().split('#')[0].split('?')[0];
  if (!cut || /^(?:[a-z]+:|\/\/|#|mailto:|tel:|data:)/i.test(cut)) return null;
  const posix = cut.replace(/\\/g, '/');
  if (posix.startsWith('/')) return path.posix.normalize(posix.slice(1));
  const dir = path.posix.dirname(fromRel.replace(/\\/g, '/'));
  return path.posix.normalize(path.posix.join(dir === '.' ? '' : dir, posix));
}

function dropped(rel) {
  if (rel.endsWith('.md')) return true;
  return REMOVED.some((prefix) => rel === prefix || rel.startsWith(`${prefix}/`));
}

function collectRefs(rootDir) {
  const refs = [];
  const skip = new Set(['node_modules', '.git']);
  function walk(dir) {
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
      if (skip.has(entry.name)) continue;
      const full = path.join(dir, entry.name);
      const rel = path.relative(rootDir, full).replace(/\\/g, '/');
      if (dropped(rel)) continue;
      if (entry.isDirectory()) walk(full);
      else if (/\.(html|css|json)$/i.test(entry.name)) {
        const text = fs.readFileSync(full, 'utf8');
        const re = /(?:\b(?:src|href)\s*=\s*|url\(\s*)['"]?([^'")\s>]+)/gi;
        let match;
        while ((match = re.exec(text))) {
          const target = localRef(rel, match[1]);
          if (target && !target.startsWith('..') && !dropped(target)) refs.push(target);
        }
      }
    }
  }
  walk(rootDir);
  return refs;
}

function exists(rootDir, rel) {
  return fs.existsSync(path.join(rootDir, rel));
}

function runScrub(dir) {
  const result = spawnSync(process.execPath, ['tools/scrub-publish-tree.js'], {
    cwd: dir,
    encoding: 'utf8'
  });
  if (result.status !== 0) {
    throw new Error(result.stderr || result.stdout || 'scrub failed');
  }
}

const source = scrubSource();
assertScrubSource(source);
assert.throws(
  () => assertScrubSource(source.replace("'docs'", "'docs',\n  'elements-data.js'")),
  /elements-data\.js/
);

const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'atomurus-publish-'));
try {
  copyTracked(tmp);
  const before = new Set(collectRefs(tmp).filter((rel) => exists(tmp, rel)));
  runScrub(tmp);
  for (const rel of REMOVED) assert.equal(exists(tmp, rel), false, `${rel} still published`);
  for (const rel of KEPT) assert.equal(exists(tmp, rel), true, `${rel} was removed`);
  const functionsDir = path.join(tmp, 'netlify', 'functions');
  assert.equal(fs.existsSync(functionsDir), true);
  assert.ok(fs.readdirSync(functionsDir).some((name) => name.endsWith('.js') || name.endsWith('.mjs')));
  const missing = [];
  for (const rel of before) {
    if (!exists(tmp, rel)) missing.push(rel);
  }
  assert.deepEqual(missing, []);
  const netlify = fs.readFileSync(path.join(tmp, 'netlify.toml'), 'utf8');
  const included = netlify.match(/included_files\s*=\s*\[([^\]]+)\]/);
  assert.ok(included, 'included_files');
  for (const name of included[1].match(/"([^"]+)"/g).map((item) => item.slice(1, -1))) {
    assert.equal(exists(tmp, name), true, `included file missing: ${name}`);
  }
} finally {
  fs.rmSync(tmp, { recursive: true, force: true });
}

console.log('test-publish-tree: ok');
