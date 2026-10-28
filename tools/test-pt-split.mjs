// Guards for the periodic table script split (prompt 24). No dependencies.
//   (a) every file parses (node --check)
//   (b) every page loads the core and exactly its modules, in order, as listed in
//       tools/pt-modules.json; on-demand modules are never in the HTML
//   (c) no top-level name is declared in two files (classic scripts share one scope)
//   (d) a module only uses names from the core or from itself; the core only reaches
//       module names behind `typeof name === 'function'`; on-demand entry points are
//       stubs in the core
//   (e) inline handlers on each page call names that the page actually loads
//   (f) sizes stay under docs/perf/pt-split-budget.json
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { topLevel } from './analyze-pt-split.mjs';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const read = (rel) => fs.readFileSync(path.join(ROOT, rel), 'utf8');
const CONFIG = JSON.parse(read('tools/pt-modules.json'));
const BUDGET = JSON.parse(read('docs/perf/pt-split-budget.json'));
const failures = [];
const fail = (msg) => failures.push(msg);

const files = { core: CONFIG.core, ...CONFIG.modules, ...CONFIG.onDemand };
const isOnDemand = (key) => Object.prototype.hasOwnProperty.call(CONFIG.onDemand, key);

// (a)
for (const [key, rel] of Object.entries(files)) {
  if (!fs.existsSync(path.join(ROOT, rel))) { fail(`${key}: ${rel} is missing`); continue; }
  const r = spawnSync(process.execPath, ['--check', path.join(ROOT, rel)], { encoding: 'utf8' });
  if (r.status !== 0) fail(`${rel} does not parse:\n${r.stderr}`);
}

// (c) + names per file
const decl = {};
const parsed = {};
for (const [key, rel] of Object.entries(files)) {
  const src = read(rel);
  parsed[key] = { src, ...topLevel(src) };
  for (const d of parsed[key].decls) (decl[d.name] = decl[d.name] || new Set()).add(key);
}
for (const [name, where] of Object.entries(decl)) {
  if (where.size > 1) fail(`top-level "${name}" is declared in ${[...where].join(' and ')}`);
}
const ownerOf = (name) => (decl[name] ? [...decl[name]][0] : null);

// (d)
const stubbed = new Set();
for (const m of parsed.core.src.matchAll(/window\.([A-Za-z_$][\w$]*)\s*=\s*ptExportStub\('([A-Za-z_$][\w$]*)'\)/g)) {
  if (m[1] !== m[2]) fail(`stub window.${m[1]} loads "${m[2]}"`);
  stubbed.add(m[1]);
}
for (const [key, p] of Object.entries(parsed)) {
  const seen = new Set();
  for (const t of p.ids) {
    if (t.dotted || seen.has(t.word)) continue;
    const owner = ownerOf(t.word);
    if (!owner || owner === key || owner === 'core') continue;
    seen.add(t.word);
    if (key === 'core') {
      if (isOnDemand(owner)) {
        if (!stubbed.has(t.word)) fail(`core uses on-demand "${t.word}" (${owner}) without a stub`);
      } else if (!new RegExp(`typeof\\s+${t.word.replace(/\$/g, '\\$')}\\b`).test(p.src)) {
        fail(`core uses "${t.word}" from ${owner} without a typeof guard`);
      }
    } else {
      fail(`${key} uses "${t.word}" declared in ${owner} (move it to the core)`);
    }
  }
}
for (const name of stubbed) {
  const owner = ownerOf(name);
  if (!owner || !isOnDemand(owner)) fail(`stub window.${name}: no on-demand module declares it`);
}

// (b) + (e)
const scriptRe = /<script\b[^>]*\ssrc="([^"]+)"[^>]*>/g;
const known = new Map(Object.entries(files).map(([key, rel]) => [rel, key]));
const allHtml = [];
(function walk(dir) {
  for (const entry of fs.readdirSync(path.join(ROOT, dir), { withFileTypes: true })) {
    if (entry.name.startsWith('.') || ['node_modules', 'docs', 'dev', 'propostas', 'templates', 'e2e', 'tools', 'netlify', 'supabase', 'scripts', 'src', 'dist', 'test-results'].includes(entry.name)) continue;
    const rel = dir ? `${dir}/${entry.name}` : entry.name;
    if (entry.isDirectory()) walk(rel);
    else if (entry.name.endsWith('.html')) allHtml.push(rel);
  }
})('');
for (const rel of allHtml) {
  const html = read(rel);
  const dir = path.posix.dirname(rel);
  const loaded = [];
  for (const m of html.matchAll(scriptRe)) {
    const src = m[1].split('?')[0];
    const resolved = src.startsWith('/') ? src.slice(1) : path.posix.normalize(path.posix.join(dir === '.' ? '' : dir, src));
    if (known.has(resolved)) loaded.push(known.get(resolved));
  }
  const listed = Object.prototype.hasOwnProperty.call(CONFIG.pages, rel);
  if (!loaded.length && !listed) continue;
  if (!listed) { fail(`${rel} loads ${loaded.join(', ')} but is not in tools/pt-modules.json`); continue; }
  const expected = ['core', ...CONFIG.pages[rel]];
  if (JSON.stringify(loaded) !== JSON.stringify(expected)) fail(`${rel} loads [${loaded.join(', ')}], expected [${expected.join(', ')}]`);
  // (e) inline handlers
  const available = new Set(['core', ...CONFIG.pages[rel]]);
  const inert = new Set((CONFIG.inertHandlers || {})[rel] || []);
  const html2 = html.replace(/<script\b[\s\S]*?<\/script>/gi, '');
  for (const m of html2.matchAll(/\son[a-z]+="([^"]*)"/g)) {
    for (const id of m[1].matchAll(/(?<![.\w$])([A-Za-z_$][\w$]*)\s*\(/g)) {
      const owner = ownerOf(id[1]);
      if (!owner || available.has(owner) || stubbed.has(id[1]) || inert.has(id[1])) continue;
      fail(`${rel}: onclick-style handler calls ${id[1]}() from ${owner}, which the page does not load`);
    }
  }
}
for (const rel of Object.keys(CONFIG.pages)) if (!allHtml.includes(rel)) fail(`tools/pt-modules.json lists ${rel}, which does not exist`);

// (f)
let total = 0;
for (const [key, rel] of Object.entries(files)) {
  const size = Buffer.byteLength(parsed[key].src);
  total += size;
  const max = BUDGET.files[rel];
  if (max == null) fail(`docs/perf/pt-split-budget.json has no ceiling for ${rel}`);
  else if (size > max) fail(`${rel} is ${size} bytes, over its ceiling of ${max} (raise it on purpose in docs/perf/pt-split-budget.json)`);
}
if (total > BUDGET.total) fail(`periodic-table scripts total ${total} bytes, over the ceiling of ${BUDGET.total}`);

// The table page loads only the core.
assert.deepEqual(CONFIG.pages['periodic-table.html'], []);

if (failures.length) {
  console.error('test-pt-split: FAIL\n  ' + failures.join('\n  '));
  process.exit(1);
}
console.log(`test-pt-split: ok (${Object.keys(files).length} files, ${Object.keys(CONFIG.pages).length} pages, ${Object.keys(decl).length} top-level names, ${total} bytes)`);
