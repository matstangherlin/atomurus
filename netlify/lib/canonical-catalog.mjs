import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

let cachedElements = null;
let cachedMolecules = null;

function readFirstExisting(relatives) {
  const here = dirname(fileURLToPath(import.meta.url));
  const bases = [process.cwd(), join(here, '../..'), join(here, '..'), '/var/task'];
  for (const base of bases) {
    for (const rel of relatives) {
      try {
        return readFileSync(join(base, rel), 'utf8');
      } catch (_err) {
        // try next candidate
      }
    }
  }
  return '';
}

function loadElements() {
  if (cachedElements) return cachedElements;
  const source = readFirstExisting(['elements-data.js']);
  const byZ = new Map();
  const byLatin = new Map();
  const bySymbol = new Map();

  const namesMatch = source.match(/const _elNamesEN = \[([^\]]*)\]/);
  const enNames = [];
  if (namesMatch) {
    const nameRe = /'([^']*)'/g;
    let nameHit;
    while ((nameHit = nameRe.exec(namesMatch[1]))) enNames.push(nameHit[1]);
  }

  const latinMatch = source.match(/const ELEMENT_LATIN = \{([\s\S]*?)\};/);
  const latinByZ = new Map();
  if (latinMatch) {
    const pairRe = /(\d+)\s*:\s*'([^']+)'/g;
    let pair;
    while ((pair = pairRe.exec(latinMatch[1]))) {
      latinByZ.set(Number(pair[1]), pair[2]);
    }
  }

  const elRe = /\{z:(\d+),\s*sym:"([^"]+)"[\s\S]*?period:(\d+),\s*group:(\d+)/g;
  let hit;
  while ((hit = elRe.exec(source))) {
    const z = Number(hit[1]);
    const sym = hit[2];
    const period = Number(hit[3]);
    const group = Number(hit[4]);
    if (!Number.isFinite(z) || !sym) continue;
    const latin = latinByZ.get(z) || '';
    const enName = enNames[z - 1] || '';
    const record = {
      z,
      sym,
      period: Number.isFinite(period) ? period : null,
      group: Number.isFinite(group) ? group : null,
      latin,
      enName
    };
    byZ.set(z, record);
    if (latin) byLatin.set(latin.toLowerCase(), record);
    bySymbol.set(sym.toLowerCase(), record);
  }

  cachedElements = { byZ, byLatin, bySymbol };
  return cachedElements;
}

function parseMoleculeName(raw) {
  const text = String(raw || '').trim();
  if (!text) return null;
  const parts = text.split(/\s+[—–-]\s+/);
  if (parts.length < 2) return null;
  const formula = parts[0].trim();
  const name = parts.slice(1).join(' — ').trim();
  if (!formula || !name) return null;
  return { formula, name };
}

function loadMolecules() {
  if (cachedMolecules) return cachedMolecules;
  const byKey = new Map();
  const source = readFirstExisting(['assets/i18n/molecules.json']);
  if (!source) {
    cachedMolecules = byKey;
    return byKey;
  }
  try {
    const data = JSON.parse(source);
    const mols = data?.en?.mol && typeof data.en.mol === 'object' ? data.en.mol : {};
    for (const [key, value] of Object.entries(mols)) {
      const parsed = parseMoleculeName(value?.name);
      if (!parsed) continue;
      byKey.set(String(key).toLowerCase(), parsed);
    }
  } catch (_err) {
    cachedMolecules = byKey;
    return byKey;
  }
  cachedMolecules = byKey;
  return byKey;
}

export function lookupElement(itemKey) {
  const key = String(itemKey || '').trim();
  if (!key) return null;
  const catalog = loadElements();
  const asZ = Number(key);
  if (/^\d+$/.test(key) && catalog.byZ.has(asZ)) return catalog.byZ.get(asZ);
  const lower = key.toLowerCase();
  return catalog.byLatin.get(lower) || catalog.bySymbol.get(lower) || null;
}

export function lookupMolecule(itemKey) {
  const key = String(itemKey || '').trim().toLowerCase();
  if (!key) return null;
  return loadMolecules().get(key) || null;
}

function card(templateKey, front, back) {
  return {
    templateKey,
    front,
    back,
    cardType: 'generated'
  };
}

function elementCards(itemKey) {
  const el = lookupElement(itemKey);
  if (!el || !el.enName || !el.sym || !Number.isFinite(el.z)) return [];
  const cards = [
    card('element_symbol', `What is the symbol of ${el.enName}?`, el.sym),
    card('element_from_number', `Which element has atomic number ${el.z}?`, el.enName),
    card('element_atomic_number', `What is the atomic number of ${el.enName}?`, String(el.z))
  ];
  if (Number.isFinite(el.period)) {
    cards.push(card('element_period', `Which period does ${el.enName} belong to?`, String(el.period)));
  }
  if (Number.isFinite(el.group)) {
    cards.push(card('element_group', `Which group does ${el.enName} belong to?`, String(el.group)));
  }
  return cards;
}

function moleculeCards(itemKey) {
  const mol = lookupMolecule(itemKey);
  if (!mol) return [];
  return [
    card('molecule_formula', `What is the formula of ${mol.name}?`, mol.formula),
    card('molecule_name', `Which molecule has the formula ${mol.formula}?`, mol.name)
  ];
}

export function generateCanonicalCards(itemType, itemKey) {
  const type = String(itemType || '').trim().toLowerCase();
  const key = String(itemKey || '').trim();
  if (!key) return [];
  if (type === 'element') return elementCards(key);
  if (type === 'molecule') return moleculeCards(key);
  return [];
}

export function resetCanonicalCatalogForTests() {
  cachedElements = null;
  cachedMolecules = null;
}
