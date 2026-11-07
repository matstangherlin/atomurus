// Real-appearance colour dataset (assets/chem/element-appearance.js):
// 118 contiguous entries whose symbols match elements-data.js, valid hex,
// bilingual descriptions, honest `known` flags and a working textOn().
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createContext, runInContext } from 'node:vm';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const require = createRequire(import.meta.url);
const A = require(path.join(ROOT, 'assets', 'chem', 'element-appearance.js'));

function loadElements() {
  const src = readFileSync(path.join(ROOT, 'elements-data.js'), 'utf8');
  const sandbox = createContext({ console, window: {}, localStorage: { getItem: () => null } });
  runInContext(`${src}\nthis.__E = ELEMENTS;`, sandbox);
  return sandbox.__E;
}

const ELEMENTS = loadElements();
const bySym = Object.fromEntries(ELEMENTS.map((e) => [e.sym, e]));

// Shape: 118 entries, Z contiguous from 1, symbols as in the shared data layer.
assert.equal(A.ELEMENTS.length, 118, '118 entries');
A.ELEMENTS.forEach((x, i) => {
  assert.equal(x.z, i + 1, `Z contiguous at index ${i}`);
  const ref = ELEMENTS.find((e) => e.z === x.z);
  assert.ok(ref, `elements-data.js has Z=${x.z}`);
  assert.equal(x.symbol, ref.sym, `symbol for Z=${x.z}`);
  assert.match(x.hex, /^#[0-9A-F]{6}$/, `hex for ${x.symbol}: ${x.hex}`);
  assert.ok(['solid', 'liquid', 'gas'].includes(x.state), `state for ${x.symbol}`);
  assert.ok(typeof x.en === 'string' && x.en.trim().length > 3, `en for ${x.symbol}`);
  assert.ok(typeof x.pt === 'string' && x.pt.trim().length > 3, `pt for ${x.symbol}`);
  assert.equal(typeof x.known, 'boolean', `known for ${x.symbol}`);
  assert.equal(A.byZ(x.z), x);
  assert.equal(A.bySymbol(x.symbol), x);
});

// Physical state agrees with elements-data.js (Sólido / Líquido / Gasoso).
const STATE = { 'Sólido': 'solid', 'Líquido': 'liquid', 'Gasoso': 'gas' };
A.ELEMENTS.forEach((x) => {
  const ref = STATE[bySym[x.symbol].state];
  if (ref) assert.equal(x.state, ref, `state of ${x.symbol} matches elements-data.js`);
});

// Unknown colours: neutral grey, flagged, and worded as predictions.
const unknown = A.ELEMENTS.filter((x) => !x.known);
assert.ok(unknown.length >= 20 && unknown.length <= 30, `unknown count ${unknown.length}`);
unknown.forEach((x) => {
  assert.equal(x.hex, A.UNKNOWN_HEX, `${x.symbol} unknown uses the neutral grey`);
  assert.match(x.pt, /^cor desconhecida/, `${x.symbol} pt says unknown`);
  assert.match(x.en, /^unknown/, `${x.symbol} en says unknown`);
});
['Tc', 'Pm', 'Po', 'Ra', 'Ac', 'Am', 'Cm', 'Bk', 'Cf', 'Es'].forEach((s) => assert.equal(A.bySymbol(s).known, true, `${s} colour is known`));
['At', 'Fr'].forEach((s) => assert.equal(A.bySymbol(s).known, false, `${s} colour is not known`));
for (let z = 100; z <= 118; z++) assert.equal(A.byZ(z).known, false, `Z=${z} colour is not known`);
A.ELEMENTS.filter((x) => x.known).forEach((x) => {
  assert.doesNotMatch(x.pt, /desconhecida|prevista/, `${x.symbol} known entry is not worded as a prediction`);
});

// Spot checks against textbook descriptions.
assert.equal(A.bySymbol('Cu').hex, '#B87333');
assert.equal(A.bySymbol('Au').hex, '#E6B422');
assert.match(A.bySymbol('S').pt, /amarelo/);
assert.match(A.bySymbol('Br').pt, /líquido/);
assert.match(A.bySymbol('Hg').en, /liquid/);
assert.match(A.bySymbol('Cl').pt, /amarelo-esverdeado/);
assert.match(A.bySymbol('I').pt, /violeta/);
assert.match(A.bySymbol('C').pt, /grafite/);
assert.match(A.bySymbol('P').pt, /fósforo branco/);
['H', 'He', 'N', 'O', 'Ne', 'Ar', 'Kr', 'Xe', 'Rn'].forEach((s) => {
  const x = A.bySymbol(s);
  assert.equal(x.state, 'gas');
  assert.ok(A.isColourless(x), `${s} is colourless`);
  assert.match(x.pt, /incolor/);
});
assert.equal(A.isColourless(A.bySymbol('Cl')), false);
assert.equal(A.isColourless(A.bySymbol('F')), false);

// Colourless gases render pale: luminance well above the mid grey.
['H', 'He', 'N'].forEach((s) => assert.ok(A.luminance(A.bySymbol(s).hex) > 0.85, `${s} tint is pale`));

// textOn: readable text for every tile, dark on silvery/pale, white on dark.
A.ELEMENTS.forEach((x) => assert.ok(['#111', '#fff'].includes(A.textOn(x.hex)), `textOn ${x.symbol}`));
assert.equal(A.textOn('#FFFFFF'), '#111');
assert.equal(A.textOn('#000000'), '#fff');
assert.equal(A.textOn(A.bySymbol('Fe').hex), '#111');
assert.equal(A.textOn(A.bySymbol('Ag').hex), '#111');
assert.equal(A.textOn(A.bySymbol('C').hex), '#fff');
assert.equal(A.textOn(A.bySymbol('Br').hex), '#fff');
assert.equal(A.textOn(A.bySymbol('I').hex), '#fff');
assert.equal(A.textOn('not-a-colour'), '#111');

// label(): language switch.
assert.equal(A.label(26, 'pt-BR'), A.bySymbol('Fe').pt);
assert.equal(A.label(26, 'en'), A.bySymbol('Fe').en);
assert.equal(A.label(999, 'en'), '');

console.log(`element appearance tests passed (118 elements, ${unknown.length} with unobserved colour)`);
