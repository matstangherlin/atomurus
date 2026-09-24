#!/usr/bin/env node
// Compact element index for the app shell's periodic table:
//   elements-data.js (single source of truth) → assets/app/elements.json
// Small, cacheable (CacheStorage), no DOM or i18n runtime needed.
// `--check` fails when the committed file is stale.
import { createContext, runInContext } from 'node:vm';
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const OUT = path.join(ROOT, 'assets/app/elements.json');

const STATE = { 'Sólido': 'solid', 'Líquido': 'liquid', 'Gasoso': 'gas', 'Sintético': 'synthetic', 'Desconhecido': 'unknown' };

export function buildElementIndex() {
  const src = readFileSync(path.join(ROOT, 'elements-data.js'), 'utf8');
  const sandbox = createContext({ console, window: {}, localStorage: { getItem: () => null } });
  runInContext(`${src}\nthis.__B = { ELEMENTS, _elNamesEN };`, sandbox);
  const { ELEMENTS, _elNamesEN } = sandbox.__B;
  const elements = ELEMENTS.map((el) => ({
    z: el.z,
    sym: el.sym,
    en: _elNamesEN[el.z - 1] || el.name,
    pt: el.name,
    mass: Number.parseFloat(el.mass) || null,
    cat: el.cat,
    col: el.col,
    row: el.row,
    group: el.group ?? null,
    period: el.period ?? null,
    state: STATE[el.state] || 'unknown',
    chi: typeof el.en === 'number' ? el.en : null
  }));
  return `${JSON.stringify({ version: 1, source: 'elements-data.js', elements })}\n`;
}

const isMain = process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url);
if (isMain) {
  const text = buildElementIndex();
  if (process.argv.includes('--check')) {
    if (!existsSync(OUT) || readFileSync(OUT, 'utf8') !== text) {
      console.error('assets/app/elements.json is stale — run `npm run build:app-data`');
      process.exit(1);
    }
    console.log('app data up to date');
  } else {
    mkdirSync(path.dirname(OUT), { recursive: true });
    writeFileSync(OUT, text);
    console.log(`wrote assets/app/elements.json (${text.length} bytes)`);
  }
}
