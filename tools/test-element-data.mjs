// Element-data regression checks for the chemistry audit (C04, part A).
// Loads elements-data.js in a vm, the same way tools/build-app-data.mjs does.
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createContext, runInContext } from 'node:vm';
import { ATOMIC_WEIGHTS } from '../netlify/lib/chemistry-calc.mjs';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

function loadElementData() {
  const src = readFileSync(path.join(ROOT, 'elements-data.js'), 'utf8');
  const sandbox = createContext({ console, window: {}, localStorage: { getItem: () => null } });
  runInContext(`${src}\nthis.__E = { ELEMENTS, EXTRA, EXTRA2, getExtra, getExtra2 };`, sandbox);
  return sandbox.__E;
}

function leadingNumber(value) {
  const n = parseFloat(value);
  return Number.isFinite(n) ? n : null;
}

// Table 1.1 — most common oxidation state. Order of the stored list is not
// asserted; exactly one c:true must equal this value.
const COMMON_OXIDATION = {
  8: '-2',
  17: '-1',
  35: '-1',
  53: '-1',
  85: '-1',
  82: '+2',
  83: '+3',
  81: '+1',
  28: '+2',
  24: '+3',
  25: '+2',
  58: '+3',
  65: '+3',
  94: '+4',
  93: '+5',
  95: '+3',
  44: '+3'
};

// Suspects left unchanged for a teacher review (do not flip these).
const SUSPECT_OXIDATION = {
  51: '+5',
  52: '+6',
  34: '+6',
  78: '+4',
  79: '+3',
  27: '+3'
};

test('electron shells sum to Z for all 118 elements', () => {
  const { ELEMENTS, getExtra } = loadElementData();
  assert.equal(ELEMENTS.length, 118);
  for (const el of ELEMENTS) {
    const shells = getExtra(el.z).shells;
    assert.ok(Array.isArray(shells) && shells.length > 0, `Z=${el.z} shells`);
    const sum = shells.reduce((total, n) => total + n, 0);
    assert.equal(sum, el.z, `${el.sym} shells ${JSON.stringify(shells)} sum ${sum}`);
  }
});

test('Ds and Rg shells match the predicted NIST configurations', () => {
  const { getExtra } = loadElementData();
  assert.equal(JSON.stringify(getExtra(110).shells), JSON.stringify([2, 8, 18, 32, 32, 16, 2]));
  assert.equal(JSON.stringify(getExtra(111).shells), JSON.stringify([2, 8, 18, 32, 32, 17, 2]));
});

test('each oxidation list has exactly one common state, and the 17 corrections match', () => {
  const { EXTRA2 } = loadElementData();
  for (let z = 1; z <= 118; z += 1) {
    const states = (EXTRA2[z] && EXTRA2[z].oxidation) || [];
    if (states.length === 0) continue;
    const common = states.filter((state) => state.c === true);
    assert.equal(common.length, 1, `Z=${z} common flags: ${JSON.stringify(states)}`);
    if (COMMON_OXIDATION[z]) assert.equal(common[0].v, COMMON_OXIDATION[z], `Z=${z}`);
    if (SUSPECT_OXIDATION[z]) assert.equal(common[0].v, SUSPECT_OXIDATION[z], `Z=${z} suspect`);
  }
  assert.equal(Object.keys(COMMON_OXIDATION).length, 17);
});

test('Zr standard atomic weight is 91.222 in the four live copies', () => {
  const { ELEMENTS } = loadElementData();
  const zr = ELEMENTS.find((el) => el.sym === 'Zr');
  assert.equal(zr.mass, '91.222');
  assert.equal(ATOMIC_WEIGHTS.Zr, 91.222);

  const calcSrc = readFileSync(path.join(ROOT, 'netlify/lib/chemistry-base.mjs'), 'utf8');
  assert.match(calcSrc, /Zr:\s*91\.222\b/);
  assert.doesNotMatch(calcSrc, /91\.224/);

  for (const file of ['calculators.html', 'calculators.pt.html']) {
    const text = readFileSync(path.join(ROOT, file), 'utf8');
    assert.match(text, /Zr:91\.222\b/);
    assert.doesNotMatch(text, /91\.224/);
  }

  for (const file of ['periodic-table/zirconium.html', 'periodic-table/zirconium.en.html']) {
    const text = readFileSync(path.join(ROOT, file), 'utf8');
    assert.match(text, /91\.222/);
    assert.doesNotMatch(text, /91\.224/);
  }
});

test('no element has a numeric boiling point below its numeric melting point', () => {
  const { ELEMENTS, getExtra } = loadElementData();
  const arsenic = getExtra(33);
  assert.match(String(arsenic.boil).toLowerCase(), /sublima/);
  assert.equal(leadingNumber(arsenic.boil), null, 'As sublimation text must not rank as a boiling point');
  for (const el of ELEMENTS) {
    const extra = getExtra(el.z);
    const melt = leadingNumber(extra.melt);
    const boil = leadingNumber(extra.boil);
    if (melt == null || boil == null) continue;
    assert.ok(boil >= melt, `${el.sym} boil ${extra.boil} < melt ${extra.melt}`);
  }
});

test('Kr and Xe electronegativity are numeric Pauling values', () => {
  const { ELEMENTS } = loadElementData();
  const kr = ELEMENTS.find((el) => el.sym === 'Kr');
  const xe = ELEMENTS.find((el) => el.sym === 'Xe');
  assert.equal(typeof kr.en, 'number');
  assert.equal(kr.en, 3);
  assert.equal(typeof xe.en, 'number');
  assert.equal(xe.en, 2.6);
});

test('discovery years that contradicted the element page are aligned', () => {
  const { ELEMENTS } = loadElementData();
  const bySym = Object.fromEntries(ELEMENTS.map((el) => [el.sym, el]));
  assert.equal(bySym.O.year, 1774);
  assert.equal(bySym.Cr.year, 1797);
  assert.equal(bySym.Br.year, 1826);
  assert.equal(bySym.Er.year, 1842);
  assert.equal(bySym.Th.year, 1828);
  assert.equal(bySym.Pa.year, 1913);
  assert.equal(bySym.Pa.disc, 'Fajans / Göhring');
  assert.equal(bySym.Nh.year, 2004);
  assert.equal(bySym.Bi.year, 1753);
});
