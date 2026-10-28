#!/usr/bin/env node
/**
 * Idempotent HTML patch for the periodic table pages (prompt 24): right after
 * the periodic-table.js <script>, add the page's own module(s) from
 * tools/pt-modules.json as deferred classic scripts, with the same ?v= as the
 * core (bump-version.js keeps both in step). Modules a page should no longer
 * load are removed.
 *
 *   node tools/patch-pt-modules.js            → dry run: lists what would change
 *   node tools/patch-pt-modules.js --apply    → writes the files
 */
const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const CONFIG = JSON.parse(fs.readFileSync(path.join(ROOT, 'tools', 'pt-modules.json'), 'utf8'));

function prefixFor(rel) {
  const depth = rel.split('/').length - 1;
  return depth ? '../'.repeat(depth) : '';
}

function patchPage(html, rel, config = CONFIG) {
  const prefix = prefixFor(rel);
  const coreRe = new RegExp('<script src="' + prefix.replace(/\./g, '\\.') + config.core.replace(/\./g, '\\.') + '(\\?v=[^"]*)?" defer><\\/script>');
  const core = coreRe.exec(html);
  if (!core) throw new Error(`${rel}: no <script src="${prefix}${config.core}…" defer> tag`);
  const version = core[1] || '';
  const all = Object.values(config.modules).concat(Object.values(config.onDemand || {}));
  // Drop any module tag first (re-adding keeps the order and the version right).
  let out = html;
  for (const file of all) {
    const re = new RegExp('\\n?<script src="' + (prefix + file).replace(/[./]/g, (c) => '\\' + c) + '(\\?v=[^"]*)?" defer><\\/script>', 'g');
    out = out.replace(re, '');
  }
  const wanted = (config.pages[rel] || []).map((key) => {
    if (!config.modules[key]) throw new Error(`${rel}: unknown module "${key}"`);
    return `<script src="${prefix}${config.modules[key]}${version}" defer></script>`;
  });
  if (!wanted.length) return out;
  const at = out.indexOf(core[0]) + core[0].length;
  return out.slice(0, at) + '\n' + wanted.join('\n') + out.slice(at);
}

function run(apply) {
  const changed = [];
  for (const rel of Object.keys(CONFIG.pages)) {
    const file = path.join(ROOT, rel);
    const src = fs.readFileSync(file, 'utf8');
    const out = patchPage(src, rel);
    if (out === src) continue;
    changed.push(rel);
    if (apply) fs.writeFileSync(file, out);
  }
  return changed;
}

module.exports = { patchPage, prefixFor, CONFIG };

if (require.main === module) {
  const apply = process.argv.includes('--apply');
  const changed = run(apply);
  const total = Object.keys(CONFIG.pages).length;
  console.log(`patch-pt-modules: ${apply ? 'patched' : 'would patch (dry run; pass --apply to write)'} ${changed.length} / ${total} pages`);
  changed.forEach((rel) => console.log('  ' + rel));
}
