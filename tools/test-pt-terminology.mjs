// PT dictionary must not show the pre-glossary lab terms.
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const src = readFileSync(path.join(ROOT, 'tools/i18n-dict-source.js'), 'utf8');
const ptStart = src.indexOf('\n    pt: {');
assert.ok(ptStart > 0, 'PT dictionary block');
const pt = src.slice(ptStart);

const BANNED = [
  { name: 'becker', re: /becker/i },
  { name: 'board', re: /\bboard\b/i },
  { name: 'peso atômico', re: /peso at[oô]mico/i },
  { name: 'na fila', re: /na fila/i },
  { name: 'razões de reação', re: /razões de reação/i },
  { name: 'preset', re: /\bpresets?\b/i },
  { name: 'suíte compacta', re: /suíte compacta/i }
];

// Identifiers and scientific "em fila" (carbons in a row) are not UI leftovers.
const ALLOW = new Set([
  'cadeia linear · 4 carbonos em fila'
]);

function stringLiterals(text) {
  const out = [];
  const re = /'(?:\\'|[^'])*'|"(?:\\"|[^"])*"/g;
  let match;
  while ((match = re.exec(text))) {
    out.push(match[0].slice(1, -1).replace(/\\'/g, "'").replace(/\\"/g, '"'));
  }
  return out;
}

const values = stringLiterals(pt).filter((value) => !ALLOW.has(value));
for (const value of values) {
  for (const ban of BANNED) {
    assert.equal(ban.re.test(value), false, `PT dict still shows ${ban.name}: ${value}`);
  }
}

const glossary = readFileSync(path.join(ROOT, 'docs/glossario-pt-br.md'), 'utf8');
const rows = glossary.split('\n').filter((line) => line.startsWith('|') && !line.includes('---') && !/termo en/i.test(line));
assert.ok(rows.length >= 7, `glossary rows ${rows.length}`);

const lab = readFileSync(path.join(ROOT, 'assets/lab/virtual-lab.js'), 'utf8');
const ptLab = [];
for (const match of lab.matchAll(/\bpt:\s*'([^']*)'/g)) ptLab.push(match[1]);
for (const match of lab.matchAll(/copy\(\s*'[^']*',\s*'([^']*)'/g)) ptLab.push(match[1]);
for (const value of ptLab) {
  for (const ban of BANNED) {
    assert.equal(ban.re.test(value), false, `virtual-lab PT still shows ${ban.name}: ${value}`);
  }
}
assert.match(lab, /'Béquer'/);
assert.doesNotMatch(lab, /'Becker'/);

console.log(`pt terminology ok (${values.length} dict strings, ${rows.length} glossary rows)`);
