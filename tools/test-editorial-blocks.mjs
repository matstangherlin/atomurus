import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { applyEditorial } from './apply-editorial-blocks.mjs';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const config = JSON.parse(readFileSync(path.join(ROOT, 'tools/editorial-config.json'), 'utf8'));

function read(rel) {
  return readFileSync(path.join(ROOT, rel), 'utf8');
}

const files = [];
for (const file of Object.keys(config.articles)) {
  files.push(file, file.replace(/\.html$/, '.pt.html'));
}
assert.equal(files.length, 22);

for (const file of files) {
  const html = read(file);
  const levels = html.match(/class="article-level-chip"/g) || [];
  const boxes = html.match(/class="article-learn"/g) || [];
  const items = html.match(/class="article-learn"[\s\S]*?<\/aside>/);
  assert.equal(levels.length, 1, file + ' level');
  assert.equal(boxes.length, 1, file + ' learn');
  const lis = items[0].match(/<li>/g) || [];
  assert.equal(lis.length, 3, file + ' items');
  assert.equal(html.includes('article-reviewer'), false, file + ' reviewer');
  assert.equal(html.includes('reviewedBy'), false, file + ' reviewedBy');
}

const sample = '<header class="art-hero"><div class="art-meta"></div></header><script type="application/ld+json">{"author": { "@type": "Organization", "name": "Atomurus" }}</script>';
const article = config.articles['explore/what-is-an-atom.html'];
const once = applyEditorial(sample, article, 'en', config);
const twice = applyEditorial(once, article, 'en', config);
assert.equal(once, twice);
assert.equal(once.includes('article-reviewer'), false);

const named = { ...config, reviewerName: 'Professor Teste' };
const withReviewer = applyEditorial(sample, article, 'pt', named);
assert.match(withReviewer, /class="article-reviewer">Revisão: Professor Teste/);
assert.match(withReviewer, /"reviewedBy": \{ "@type": "Person", "name": "Professor Teste" \}/);
const cleared = applyEditorial(withReviewer, article, 'pt', config);
assert.equal(cleared.includes('article-reviewer'), false);
assert.equal(cleared.includes('reviewedBy'), false);

const bonding = read('explore/what-is-chemical-bonding.html');
const bondingPt = read('explore/what-is-chemical-bonding.pt.html');
assert.match(bonding, /Chemical Bonding/);
assert.doesNotMatch(bonding, /Atomic Structure/);
assert.match(bondingPt, /Ligações Químicas/);
assert.doesNotMatch(bondingPt, /Estrutura Atômica/);

const dict = read('tools/i18n-dict-source.js');
const realGeometry = 'Real molecular ' + 'geometry';
const realGeometryPt = 'Geometria molecular ' + 'real';
assert.equal(dict.includes(realGeometry), false);
assert.equal(dict.includes(realGeometryPt), false);
assert.match(dict, /teachingNote:/);
assert.equal(dict.includes('completamente ' + 'inerte'), false);
assert.equal(dict.includes('completely ' + 'inert'), false);
const molecules = read('viewer/molecules.html') + read('viewer/molecules.pt.html');
assert.match(molecules, /data-i18n="molecules.teachingNote"/);
assert.equal(molecules.includes(realGeometry), false);
assert.equal(molecules.includes(realGeometryPt), false);

console.log('editorial blocks ok');
