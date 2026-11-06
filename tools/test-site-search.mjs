// Site search: every destination exists, every article is indexed, and the
// matcher finds elements, tools and formulas the way a reader types them.
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
function load(lang) {
  const ctx = { window: {}, document: { documentElement: { lang } } };
  ctx.window.document = ctx.document;
  vm.createContext(ctx);
  vm.runInContext(fs.readFileSync(path.join(ROOT, 'assets/remake/elements-lite.js'), 'utf8'), ctx);
  vm.runInContext(fs.readFileSync(path.join(ROOT, 'assets/remake/site-search.js'), 'utf8').replace('})(window);', '})(this.window);'), ctx);
  return ctx.window.AtomurusSearch;
}
const pt = load('pt-BR');
const en = load('en');

// destinations exist
const file = (url) => path.join(ROOT, url.split(/[?#]/)[0].replace(/^\//, '') || 'index.html');
for (const [url] of [...pt._tools, ...pt._articles]) {
  if (url.startsWith('/app')) continue;
  assert.ok(fs.existsSync(file(url)), `search destination missing: ${url}`);
}
// every article in explore/ is searchable
const articles = fs.readdirSync(path.join(ROOT, 'explore')).filter((f) => f.endsWith('.html') && !f.endsWith('.pt.html'));
for (const a of articles) assert.ok(pt._articles.some(([u]) => u === `/explore/${a}`), `article not in the search index: ${a}`);
// calculator anchors are real tabs
const calc = fs.readFileSync(path.join(ROOT, 'calculators.html'), 'utf8');
for (const [url] of pt._tools.filter(([u]) => u.startsWith('/calculators.html#'))) {
  assert.match(calc, new RegExp(`data-target="${url.split('#')[1]}"`), `calculator tab for ${url}`);
}

// elements: symbol, number, names in both languages, accents optional
const first = (S, q) => (S._elements(q)[0] || [])[1];
assert.equal(first(pt, 'Fe'), 'Fe');
assert.equal(first(pt, '26'), 'Fe');
assert.equal(first(pt, 'ferro'), 'Fe');
assert.equal(first(pt, 'sodio'), 'Na');
assert.equal(first(pt, 'Sódio'), 'Na');
assert.equal(first(en, 'gold'), 'Au');
assert.equal(first(pt, 'ouro'), 'Au');
assert.equal(first(pt, 'aurum'), 'Au', 'latin name');
assert.equal(first(pt, 'Co'), 'Co', 'symbol beats a name that starts the same');
assert.ok(pt._elements('ph').best < 85, 'in Portuguese "ph" ranks below the pH tool (whole word)');

// formulas get the calculator / builder shortcuts; words and symbols do not
assert.equal(pt._formula('H2SO4'), 'H2SO4');
assert.equal(pt._formula('CuSO4·5H2O'), 'CuSO4·5H2O');
assert.equal(pt._formula('CH3CH2OH'), 'CH3CH2OH');
assert.equal(pt._formula('Fe'), null);
assert.equal(pt._formula('ferro'), null);
assert.equal(pt._formula('Xx2'), null, 'unknown symbol');

// the header carries the button on every page that has the site header
const header = fs.readFileSync(path.join(ROOT, 'templates/chrome/site-header.html'), 'utf8');
assert.match(header, /data-rm-search-open/);
const nav = fs.readFileSync(path.join(ROOT, 'assets/remake/site-nav.js'), 'utf8');
assert.match(nav, /site-search\.js/, 'site-nav loads the palette on demand');

console.log('site search: ok');
