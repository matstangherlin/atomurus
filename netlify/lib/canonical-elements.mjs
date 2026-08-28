import { createContext, runInContext } from 'node:vm';
import { existsSync, readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { studyError } from './study-cloud.mjs';

function resolveElementsData() {
  const here = path.dirname(fileURLToPath(import.meta.url));
  const candidates = [
    path.join(here, 'elements-data.js'),
    path.join(here, '../../elements-data.js'),
    path.join(process.cwd(), 'elements-data.js')
  ];
  for (const file of candidates) {
    if (existsSync(file)) return file;
  }
  return candidates[1];
}

let cache = null;

function loadBundle() {
  if (cache) return cache;
  const src = readFileSync(resolveElementsData(), 'utf8');
  const sandbox = createContext({ console });
  runInContext(`${src}\nthis.__ATOMURUS_ELEMENT_BUNDLE = { ELEMENTS, ELEMENT_LATIN, EXTRA, EXTRA2, IONIZATION, _elNamesEN };`, sandbox);
  cache = sandbox.__ATOMURUS_ELEMENT_BUNDLE;
  if (!cache?.ELEMENTS) {
    throw studyError('Canonical element data is unavailable', 500, 'canonical_unavailable');
  }
  return cache;
}

export const ELEMENT_PROPERTY_KEYS = Object.freeze([
  'atomicNumber',
  'symbol',
  'name',
  'latin',
  'atomicMass',
  'period',
  'group',
  'category',
  'electronegativity',
  'state',
  'electronConfig',
  'shells',
  'meltingPoint',
  'boilingPoint',
  'density',
  'atomicRadius',
  'ionizationEnergy'
]);

export const ELEMENT_CHART_KEYS = Object.freeze([
  'atomicMass',
  'electronegativity',
  'period',
  'group',
  'atomicRadius',
  'ionizationEnergy',
  'density'
]);

export const MAX_COMPARE_ELEMENTS = 4;

function dashToNull(value) {
  if (value == null) return null;
  if (typeof value === 'number' && Number.isFinite(value)) return value;
  const text = String(value).trim();
  if (!text || text === '—' || text === '-' || text === '–') return null;
  return text;
}

function parseLeadingNumber(value) {
  const text = dashToNull(value);
  if (text == null) return null;
  if (typeof text === 'number') return text;
  const match = String(text).replace(',', '.').match(/-?\d+(?:\.\d+)?/);
  if (!match) return null;
  const n = Number(match[0]);
  return Number.isFinite(n) ? n : null;
}

export function getElementBundle() {
  return loadBundle();
}

export function elementByZ(z) {
  const n = Number(z);
  if (!Number.isInteger(n) || n < 1 || n > 118) return null;
  const bundle = loadBundle();
  return bundle.ELEMENTS.find((el) => el.z === n) || null;
}

export function latinForZ(z) {
  const bundle = loadBundle();
  return bundle.ELEMENT_LATIN[Number(z)] || null;
}

export function canonicalElement(z, lang = 'en') {
  const el = elementByZ(z);
  if (!el) return null;
  const bundle = loadBundle();
  const extra = bundle.EXTRA[el.z] || {};
  const extra2 = bundle.EXTRA2[el.z] || {};
  const enName = Array.isArray(bundle._elNamesEN) ? bundle._elNamesEN[el.z - 1] : null;
  const ionization = bundle.IONIZATION[el.z];
  const mass = parseLeadingNumber(el.mass);
  const en = typeof el.en === 'number' ? el.en : parseLeadingNumber(el.en);
  const radius = parseLeadingNumber(extra2.radius);
  const density = parseLeadingNumber(extra2.density);
  const latin = latinForZ(el.z);
  return {
    atomicNumber: el.z,
    symbol: el.sym,
    name: lang === 'pt' ? el.name : (enName || el.name),
    namePt: el.name,
    nameEn: enName || el.name,
    latin,
    href: latin ? `/periodic-table/${latin}` : '/periodic-table',
    itemKey: latin,
    atomicMass: mass,
    atomicMassDisplay: dashToNull(el.mass),
    period: el.period ?? null,
    group: el.group ?? null,
    category: el.cat || null,
    electronegativity: en,
    electronegativityDisplay: dashToNull(el.en),
    state: dashToNull(el.state),
    electronConfig: dashToNull(extra.econfig),
    shells: Array.isArray(extra.shells) ? extra.shells.slice() : null,
    meltingPoint: dashToNull(extra.melt),
    boilingPoint: dashToNull(extra.boil),
    density: dashToNull(extra2.density),
    densityValue: density,
    atomicRadius: dashToNull(extra2.radius),
    atomicRadiusValue: radius,
    ionizationEnergy: Number.isFinite(ionization) ? ionization : null
  };
}

export function normalizeAtomicNumbers(raw, max = MAX_COMPARE_ELEMENTS) {
  const source = Array.isArray(raw) ? raw : [];
  if (!source.length) throw studyError('at least one atomic number is required', 400);
  if (source.length > max) throw studyError(`at most ${max} elements can be compared`, 400);
  const seen = new Set();
  const numbers = [];
  for (const entry of source) {
    const z = Number(typeof entry === 'object' ? entry.atomicNumber || entry.z : entry);
    if (!Number.isInteger(z) || z < 1 || z > 118) {
      throw studyError('atomic numbers must be integers from 1 to 118', 400);
    }
    if (seen.has(z)) continue;
    seen.add(z);
    numbers.push(z);
  }
  if (!numbers.length) throw studyError('at least one atomic number is required', 400);
  return numbers;
}

export function normalizePropertyKeys(raw) {
  const source = Array.isArray(raw) && raw.length ? raw : ELEMENT_PROPERTY_KEYS;
  const seen = new Set();
  const keys = [];
  for (const entry of source) {
    const key = String(entry || '').trim();
    if (!ELEMENT_PROPERTY_KEYS.includes(key)) continue;
    if (seen.has(key)) continue;
    seen.add(key);
    keys.push(key);
  }
  if (!keys.length) return ELEMENT_PROPERTY_KEYS.slice();
  return keys;
}

export function chartSeries(elements, propertyKey) {
  const key = String(propertyKey || '').trim();
  if (!ELEMENT_CHART_KEYS.includes(key)) return null;
  const values = elements.map((el) => {
    if (key === 'atomicRadius') return el.atomicRadiusValue;
    if (key === 'density') return el.densityValue;
    const value = el[key];
    return Number.isFinite(value) ? value : null;
  });
  if (!values.some((v) => v != null)) return null;
  const numeric = values.filter((v) => v != null);
  const max = Math.max(...numeric);
  return {
    property: key,
    max,
    bars: elements.map((el, index) => ({
      atomicNumber: el.atomicNumber,
      symbol: el.symbol,
      value: values[index],
      ratio: values[index] != null && max > 0 ? values[index] / max : null
    }))
  };
}

export function compareElements({ atomicNumbers, properties, chartProperty, lang } = {}) {
  const numbers = normalizeAtomicNumbers(atomicNumbers);
  const keys = normalizePropertyKeys(properties);
  const elements = numbers.map((z) => {
    const el = canonicalElement(z, lang);
    if (!el) throw studyError(`unknown element ${z}`, 400);
    return el;
  });
  const chartKey = ELEMENT_CHART_KEYS.includes(chartProperty) ? chartProperty : keys.find((k) => ELEMENT_CHART_KEYS.includes(k)) || 'atomicMass';
  return {
    elements,
    properties: keys,
    chart: chartSeries(elements, chartKey)
  };
}
