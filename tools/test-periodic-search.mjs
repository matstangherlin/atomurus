// Search ranking, f-block placement and heatmap property coverage.
// Loads elements-data.js plus the search/heatmap functions from periodic-table.js.
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createContext, runInContext } from 'node:vm';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

function sliceBetween(src, startMarker, endMarker) {
  const start = src.indexOf(startMarker);
  const end = src.indexOf(endMarker);
  if (start < 0 || end < 0 || end <= start) {
    throw new Error(`slice ${startMarker} → ${endMarker} missing`);
  }
  return src.slice(start, end);
}

function loadSearch() {
  const data = readFileSync(path.join(ROOT, 'elements-data.js'), 'utf8');
  const table = readFileSync(path.join(ROOT, 'periodic-table.js'), 'utf8');
  const search = sliceBetween(table, 'function normSearch', 'function handleSearchInput');
  const heatmap = sliceBetween(table, 'function heatmapPropValue', 'function applyHeatmap');
  const sandbox = createContext({
    console,
    window: {},
    localStorage: { getItem: () => null }
  });
  runInContext(
    `${data}\n${search}\n${heatmap}\nthis.__S = { ELEMENTS, getSearchResults, searchRank, getAliasMatcher, heatmapPropValue, heatmapStateKey, getIonization };`,
    sandbox
  );
  return sandbox.__S;
}

function syms(list) {
  return list.map(el => el.sym).sort();
}

const api = loadSearch();
const { ELEMENTS, getSearchResults, heatmapPropValue, heatmapStateKey, getIonization } = api;
const bySym = Object.fromEntries(ELEMENTS.map(el => [el.sym, el]));

function first(q) {
  const hits = getSearchResults(q, 118);
  assert.ok(hits.length > 0, `no hits for ${JSON.stringify(q)}`);
  return hits[0];
}

function setOf(q) {
  return syms(getSearchResults(q, 118)).join(',');
}

const cases = [
  ['Na', 'Na'],
  ['Fe', 'Fe'],
  ['He', 'He'],
  ['H', 'H'],
  ['Li', 'Li'],
  ['Al', 'Al'],
  ['Ga', 'Ga'],
  ['N', 'N'],
  ['No', 'No'],
  ['1', 'H'],
  ['26', 'Fe'],
  ['118', 'Og'],
  ['sodio', 'Na'],
  ['Sódio', 'Na'],
  ['oxygen', 'O'],
  ['gold', 'Au'],
  ['iron', 'Fe']
];

for (const [query, sym] of cases) {
  const hit = first(query);
  assert.equal(hit.sym, sym, `${JSON.stringify(query)} → ${hit.sym}, expected ${sym}`);
}

assert.equal(setOf('halogenio'), 'At,Br,Cl,F,I,Ts');
assert.equal(setOf('halogens'), 'At,Br,Cl,F,I,Ts');
assert.equal(setOf('grupo 17'), 'At,Br,Cl,F,I,Ts');
assert.equal(setOf('group 17'), 'At,Br,Cl,F,I,Ts');
assert.equal(setOf('grupo 3'), 'Sc,Y');
assert.equal(setOf('group 3'), 'Sc,Y');
assert.equal(getSearchResults('lantanideo', 118).length, 15);
assert.equal(getSearchResults('lanthanides', 118).length, 15);
assert.equal(getSearchResults('actinideo', 118).length, 15);
assert.equal(getSearchResults('actinides', 118).length, 15);
assert.equal(getSearchResults('gas nobre', 118).length, 7);
assert.equal(getSearchResults('noble gases', 118).length, 7);
assert.equal(getSearchResults('metal alcalino', 118).length, 6);
assert.equal(getSearchResults('alkali', 118).length, 6);

assert.equal(getSearchResults('Na', 118).length, 1, 'Na must not expand into nonmetals');
assert.equal(getSearchResults('H', 118).length, 1, 'H must not expand into halogens');
assert.equal(getSearchResults('He', 118).length, 1, 'He must not expand into other names');
assert.equal(first('Fe').sym, 'Fe');
assert.ok(getSearchResults('Fe', 118).some(el => el.sym === 'Fm'), 'férmio stays a prefix hit after ferro');
assert.ok(getSearchResults('Fe', 118).findIndex(el => el.sym === 'Fe') <
  getSearchResults('Fe', 118).findIndex(el => el.sym === 'Fm'));

let exact = 0;
for (const el of ELEMENTS) {
  assert.equal(first(el.sym).z, el.z, `symbol ${el.sym}`);
  exact += 1;
}
const ptNames = ELEMENTS.slice(0, 20);
const enNames = ELEMENTS.slice(20, 40);
for (const el of ptNames) {
  assert.equal(first(el.name).z, el.z, `PT name ${el.name}`);
  exact += 1;
}
for (const el of enNames) {
  const en = api.ELEMENTS && el;
  const name = readEnName(el.z);
  assert.equal(first(name).z, el.z, `EN name ${name}`);
  exact += 1;
}
const aliases = [
  'halogenio', 'halogens', 'gas nobre', 'noble gases', 'metal alcalino', 'alkali',
  'alcalino terroso', 'alkaline earth', 'lantanideo', 'lanthanides', 'actinideo',
  'actinides', 'metaloide', 'nao metal', 'grupo 17'
];
for (const alias of aliases) {
  const hits = getSearchResults(alias, 118);
  assert.ok(hits.length > 0, alias);
  exact += 1;
}
assert.equal(exact, 118 + 20 + 20 + 15);

assert.equal(ELEMENTS.length, 118);
const slots = new Set(ELEMENTS.map(el => `${el.row}-${el.col}`));
assert.equal(slots.size, 118, 'row/col must be unique');
assert.equal(ELEMENTS.filter(el => el.cat === 'lanthanide' && el.row === 9).length, 15);
assert.equal(ELEMENTS.filter(el => el.cat === 'actinide' && el.row === 10).length, 15);
assert.equal(bySym.La.row, 9);
assert.equal(bySym.La.col, 3);
assert.equal(bySym.La.period, 6);
assert.equal(bySym.La.group, null);
assert.equal(bySym.Ac.row, 10);
assert.equal(bySym.Ac.col, 3);
assert.equal(bySym.Ac.period, 7);
assert.equal(bySym.Ac.group, null);
assert.equal(bySym.Lu.col, 17);
assert.equal(bySym.Lu.row, 9);
assert.equal(bySym.Lr.col, 17);
assert.equal(bySym.Lr.row, 10);
for (const el of ELEMENTS) {
  if (el.cat === 'lanthanide' || el.cat === 'actinide') {
    assert.equal(el.group, null, `${el.sym} group`);
  }
}
assert.equal(
  [...ELEMENTS].filter(el => el.group === 17).map(el => el.sym).sort().join(','),
  'At,Br,Cl,F,I,Ts'
);
assert.equal(
  [...ELEMENTS].filter(el => el.group === 3).map(el => el.sym).sort().join(','),
  'Sc,Y'
);

assert.equal(getIonization(1), 1312);
assert.equal(getIonization(104), undefined);
assert.equal(heatmapPropValue(1, 'ionization'), 1312);
assert.equal(heatmapPropValue(118, 'ionization'), null);
assert.equal(heatmapPropValue(104, 'ionization'), null);
const naRadius = parseFloat(readExtraRadius(11));
assert.equal(heatmapPropValue(11, 'atomic_radius'), naRadius);
assert.equal(heatmapPropValue(11, 'radius'), naRadius);
assert.equal(heatmapStateKey(bySym.H), 'gas');
assert.equal(heatmapStateKey(bySym.Hg), 'liquid');
assert.equal(heatmapStateKey(bySym.Fe), 'solid');
assert.equal(heatmapStateKey(bySym.Br), 'liquid');

const tableSrc = readFileSync(path.join(ROOT, 'periodic-table.js'), 'utf8');
assert.match(tableSrc, /const laLeft\s+= colX\(3\)/);
assert.match(tableSrc, /const acLeft\s+= colX\(3\)/);
assert.doesNotMatch(tableSrc, /nq\.startsWith\(t\)/);
assert.match(tableSrc, /â€”/);
assert.match(tableSrc, /function formatElementGroup/);

for (const file of [
  'periodic-table/heatmap.html',
  'periodic-table/heatmap.pt.html'
]) {
  const html = readFileSync(path.join(ROOT, file), 'utf8');
  assert.match(html, /value="ionization"/);
  assert.match(html, /ptable\.hmOptIonization/);
}
for (const file of ['periodic-table.html', 'periodic-table.pt.html', 'config.html', 'config.pt.html']) {
  const html = readFileSync(path.join(ROOT, file), 'utf8');
  assert.match(html, /value="atomic_radius"/);
  assert.match(html, /value="ionization"/);
  assert.match(html, /value="state"/);
}

const dict = readFileSync(path.join(ROOT, 'tools/i18n-dict-source.js'), 'utf8');
assert.match(dict, /hmOptIonization: 'Ionization Energy \(kJ\/mol\)'/);
assert.match(dict, /hmOptIonization: 'Energia de ionização \(kJ\/mol\)'/);
assert.match(dict, /fBlockGroup: 'f-block'/);
assert.match(dict, /fBlockGroup: 'bloco f'/);

console.log(`periodic search tests passed (${exact} queries, 118 elements)`);

function readEnName(z) {
  const src = readFileSync(path.join(ROOT, 'elements-data.js'), 'utf8');
  const m = src.match(/const _elNamesEN = (\[[\s\S]*?\]);/);
  if (!m) throw new Error('EN names missing');
  const names = Function(`return ${m[1]}`)();
  return names[z - 1];
}

function readExtraRadius(z) {
  const el = ELEMENTS.find(e => e.z === z);
  const src = readFileSync(path.join(ROOT, 'elements-data.js'), 'utf8');
  const sandbox = createContext({});
  runInContext(`${src}\nthis.__r = getExtra2(${el.z}).radius;`, sandbox);
  return sandbox.__r;
}
