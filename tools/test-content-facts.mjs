// Forbids the factual phrases corrected in prompt 06 from coming back.
import test from 'node:test';
import assert from 'node:assert/strict';
import { readdirSync, readFileSync, statSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

const ROOTS = [
  'tools/element-content-source.js',
  'tools/i18n-dict-source.js',
  'assets/element-content',
  'assets/i18n',
  'explore',
  'periodic-table'
];

const FORBIDDEN = [
  'alguns gramas de Cm-244',
  'few grams of Cm-244',
  '1,7 grama por ano',
  '1.7 grams per year',
  'Hannes Vagn-Bonde',
  'ex-cientista militar canadense',
  'former Canadian military scientist',
  'tratada para suspeita de envenenamento por tálio',
  'treated for suspected thallium poisoning',
  'rochas formadas pouco depois do Big Bang',
  'rocks formed shortly after the Big Bang',
  'cerca de 20% do níquel global',
  'about 20% of global nickel',
  'grama de urânio enriquecido contém a energia de uma tonelada',
  'one gram of enriched uranium contains the energy of a ton of coal',
  'bilhões de bilhões de vezes',
  'billions of billions of times',
  '1 bilhão de bilhão de vezes',
  '1 billion billion times',
  'identificado por seu espectro óptico',
  'identified by its optical spectrum',
  'núcleo mais estável conhecido',
  'most stable known nucleus',
  'Todo átomo de ferro mais pesado',
  'Every iron atom heavier',
  'no auge das sanções',
  'at the height of sanctions',
  'seis elementos (Z 113',
  'six elements (Z 113',
  '100 átomos de espessura',
  '100 atoms thick',
  'demonstrou que o diamante e o grafite eram a mesma substância',
  'showed that diamond and graphite were the same substance',
  'toxicidade só foi reconhecida cientificamente no século XX',
  'only scientifically recognized in the 20th century',
  'único vilarejo do mundo que dá nome',
  'only village in the world to give its name',
  'sete metais conhecidos pela alquimia medieval',
  'seven metals known to medieval alchemy',
  'morto cinco anos antes',
  'dead five years earlier',
  'cério-144 para satélites',
  'cerium-144 for satellites',
  'meia colher de chá',
  'half a teaspoon',
  'sob 10 presidentes',
  'under 10 presidents',
  'Stanley Watras, engenheiro nuclear',
  'Stanley Watras, a nuclear engineer',
  'ela batizou de "fissão"',
  'she named "fission"',
  'quatro novos elementos (114, 115, 116 e 118)',
  'four new elements (114, 115, 116 and 118)',
  'Em 2017, Oganessian',
  'In 2017, Oganessian',
  'avião tripulado mais rápido já construído',
  'fastest crewed aircraft ever built',
  'nos Alpes (na atual Romênia)',
  'in the Alps (in modern-day Romania)',
  'desigualdade tóxica',
  'toxic inequality',
  '01:23:58',
  'cerca de 54 segundos',
  'roughly 54 seconds',
  'mais deles do que há estrelas',
  'more of them than there are stars',
  'mais átomos que estrelas',
  '(0,758 × 35)',
  '(0.758 × 35)',
  'fissão nuclear natural por milhares de anos',
  'natural nuclear fission for thousands of years'
];

function files() {
  const out = [];
  for (const rel of ROOTS) {
    const full = path.join(ROOT, rel);
    const st = statSync(full);
    if (st.isDirectory()) walk(full, out);
    else out.push(full);
  }
  return out;
}

function walk(dir, out) {
  for (const name of readdirSync(dir)) {
    const full = path.join(dir, name);
    if (statSync(full).isDirectory()) walk(full, out);
    else if (/\.(html|js|mjs|json)$/.test(name)) out.push(full);
  }
}

test('corrected factual phrases do not reappear', () => {
  const hits = [];
  for (const file of files()) {
    const lines = readFileSync(file, 'utf8').split(/\n/);
    lines.forEach((line, index) => {
      for (const phrase of FORBIDDEN) {
        if (line.includes(phrase)) {
          hits.push(`${path.relative(ROOT, file)}:${index + 1}: ${phrase}`);
        }
      }
    });
  }
  assert.deepEqual(hits, []);
});

test('spot-check the published corrections of 2.4, 2.9, 3.1 and 3.3', () => {
  // 2.4 — 200 MeV/fission of U-235 versus 24 GJ per tonne of coal.
  const joulePerGram = (6.02214076e23 / 235) * 200e6 * 1.602176634e-19;
  const tonnesPerGram = joulePerGram / 24e9;
  console.log(`2.4 U-235 ${joulePerGram.toExponential(3)} J/g; ${tonnesPerGram.toFixed(2)} t coal/g`);
  assert.ok(Math.abs(joulePerGram - 8.2e10) / 8.2e10 < 0.02);
  assert.ok(tonnesPerGram > 3.2 && tonnesPerGram < 3.6);

  // 2.9 — Bi-209 half-life over the age of the universe.
  const ratio = 1.9e19 / 1.38e10;
  console.log(`2.9 Bi-209 / universe age = ${ratio.toExponential(2)}`);
  assert.ok(ratio > 1.3e9 && ratio < 1.5e9);

  // 2.1 and 2.2 — activity to mass, printed for the review.
  const mgLow = (0.030 / 81) * 1000;
  const mgHigh = (0.050 / 81) * 1000;
  console.log(`2.1 Cm-244 30–50 mCi = ${mgLow.toFixed(2)}–${mgHigh.toFixed(2)} mg`);
  assert.ok(mgLow > 0.3 && mgHigh < 0.7);
  const halfLifeS = 9.92 * 86400;
  const ciPerGram = (Math.LN2 / halfLifeS) * 6.02214076e23 / 225 / 3.7e10;
  const micrograms = (1.7 / ciPerGram) * 1e6;
  console.log(`2.2 Ac-225 1.7 Ci = ${micrograms.toFixed(1)} µg`);
  assert.ok(Math.abs(micrograms - 29) < 2);

  // 2.22 — 22 mg of berkelium at the density stored for Bk.
  const mm3 = (0.022 / 14.78) * 1000;
  console.log(`2.22 Bk 22 mg = ${mm3.toFixed(2)} mm³`);
  assert.ok(mm3 > 1.4 && mm3 < 1.7);

  // 3.1 — atoms in a 0.05 mL drop of water.
  const dropAtoms = (0.05 / 18.015) * 6.02214076e23 * 3;
  console.log(`3.1 drop atoms = ${dropAtoms.toExponential(2)}`);
  assert.ok(dropAtoms > 4e21 && dropAtoms < 6e21);

  // 3.3 — chlorine weighted average.
  const integerMass = 0.7576 * 35 + 0.2424 * 37;
  const isotopeMass = 0.7576 * 34.969 + 0.2424 * 36.966;
  console.log(`3.3 Cl integer masses ${integerMass.toFixed(2)}; isotope masses ${isotopeMass.toFixed(2)}`);
  assert.ok(Math.abs(integerMass - 35.48) < 0.02);
  assert.ok(Math.abs(isotopeMass - 35.45) < 0.02);
});
