import assert from 'node:assert/strict';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const lab = require('../assets/lab/virtual-lab.js');

const CITRIC = { kind: 'weak-acid', molarMass: 192.12, pKa: [3.13, 4.76, 6.40], nH: 3 };
const BICARB = { kind: 'bicarbonate', molarMass: 84.007, pKa: [6.35, 10.33] };
const NACL = { kind: 'neutral', molarMass: 58.44 };

function beaker(session) {
  return session.containers.find((row) => row.id === 'beaker-a');
}

function mix(waterMl, parts) {
  const session = lab.emptySession({ title: 'pH', mode: 'bench' });
  if (waterMl) assert.equal(lab.addToContainer(session, 'beaker-a', 'water', waterMl).ok, true);
  Object.keys(parts || {}).forEach((id) => {
    assert.equal(lab.addToContainer(session, 'beaker-a', id, parts[id]).ok, true);
  });
  return beaker(session);
}

const citric = lab.assessPH({
  volumeL: 0.05,
  species: [{ ...CITRIC, grams: 6 }]
});
assert.ok(citric.ph > 1.6 && citric.ph < 2.1, '6 g citric acid in 50 mL is a strong-ish weak acid, got ' + citric.ph);
assert.equal(citric.estimated, false);

const inLab = mix(50, { citric_acid: 6 });
assert.ok(inLab.ph > 1.6 && inLab.ph < 2.1, 'the beaker shows the same acid reading, got ' + inLab.ph);

const water = lab.computePH({ volumeL: 0.05, species: [] });
assert.ok(Math.abs(water - 7) <= 0.01, 'pure water is 7.00, got ' + water);
const brine = lab.computePH({
  volumeL: 0.04,
  species: [{ ...NACL, grams: 0.36 }]
});
assert.ok(Math.abs(brine - 7) <= 0.05, '0.9% NaCl stays neutral, got ' + brine);

const hcl = lab.computePH({
  volumeL: 0.1,
  species: [{ kind: 'strong-acid', moles: 1e-9, nH: 1 }]
});
assert.ok(Math.abs(hcl - 6.98) <= 0.02, '10⁻⁸ M HCl includes water, got ' + hcl);

const acetic = lab.computePH({
  volumeL: 0.1,
  species: [{ kind: 'weak-acid', moles: 0.01, pKa: [4.76], nH: 1 }]
});
assert.ok(Math.abs(acetic - 2.87) <= 0.05, '0.1 M acetic acid, got ' + acetic);

function curve(grams) {
  return lab.computePH({
    volumeL: 0.05,
    species: [{ ...CITRIC, grams: 6 }, { ...BICARB, grams: grams }]
  });
}

const six = curve(6);
assert.ok(six < 6.9 || six > 7.1, '6 g + 6 g is not pH 7, got ' + six);
assert.ok(six < 6.5, '6 g of bicarbonate is still short of the guide window, got ' + six);

const guideMass = lab.PH_CHALLENGE.bicarbonateG;
const guidePh = curve(guideMass);
assert.ok(guidePh >= 6.8 && guidePh <= 7.2, 'guide mass lands near 7, got ' + guidePh + ' at ' + guideMass + ' g');
assert.ok(guideMass > 6.5 && guideMass < 7.87, 'the guide mass is before the equivalence point');

const endpoint = curve(7.87);
assert.ok(endpoint >= 7.5 && endpoint <= 10, 'equivalence is alkaline citrate, got ' + endpoint);
const excess = curve(10);
assert.ok(excess <= 11, 'extra bicarbonate is not a strong base, got ' + excess);
assert.ok(excess < endpoint, 'past equivalence the pH falls toward the NaHCO₃ ampholyte');

let prev = -1;
let rose = true;
for (let g = 0; g <= guideMass + 1e-9; g += 0.05) {
  const ph = curve(g);
  if (ph + 1e-4 < prev) rose = false;
  prev = ph;
}
assert.equal(rose, true, 'pH rises while citric acid is still in excess');

let acidPrev = 99;
let fell = true;
for (let g = 0; g <= 20.0001; g += 0.5) {
  const ph = lab.computePH({ volumeL: 0.05, species: [{ ...CITRIC, grams: g }] });
  if (ph > acidPrev + 1e-6) fell = false;
  acidPrev = ph;
  assert.equal(Number.isFinite(ph), true);
}
assert.equal(fell, true, 'more citric acid lowers the pH');

assert.equal(Number.isFinite(lab.computePH({ volumeL: 0, species: [{ ...CITRIC, grams: -4 }] })), true);
assert.equal(Number.isFinite(lab.computePH({ volumeL: -1, species: [] })), true);
assert.equal(lab.computePH({ volumeL: 0.05, species: [{ kind: 'weak-acid', grams: 0, molarMass: 192.12, pKa: [3.13], nH: 1 }] }), 7);

const heavy = lab.assessPH({
  volumeL: 0.05,
  species: [{ ...CITRIC, grams: 20 }]
});
assert.equal(heavy.estimated, true);
assert.equal(mix(50, { citric_acid: 20 }).phEstimated, true);

const ready = lab.READY.find((row) => row.id === 'saline_ready');
const salt = ready.parts.find((row) => row.id === 'nacl');
const waterPart = ready.parts.find((row) => row.id === 'water');
assert.equal(waterPart.amount, 40);
assert.ok(Math.abs(salt.amount - 0.36) <= 0.01);
assert.match(ready.labelEn, /0\.9%/);
assert.match(ready.labelPt, /0,9%/);
const saline = lab.emptySession({ title: 'Saline', mode: 'bench' });
assert.equal(lab.addReady(saline, 'saline_ready', 'beaker-a').ok, true);
const salineSalt = beaker(saline).contents.find((row) => row.id === 'nacl');
assert.ok(Math.abs(salineSalt.amount - 0.36) <= 0.01);
assert.ok(Math.abs(beaker(saline).ph - 7) <= 0.05);

const cu = lab.READY.find((row) => row.id === 'cu_ready');
assert.equal(cu.parts.find((row) => row.id === 'cusulfate').amount, 8);
assert.equal(cu.parts.find((row) => row.id === 'water').amount, 40);
assert.match(cu.labelEn, /20 g\/100 mL/);
assert.match(cu.labelPt, /20 g\/100 mL/);
assert.equal(lab.SUBSTANCES.cusulfate.color === '#3F8CDA', false);
assert.ok(lab.SUBSTANCES.cusulfate.solutionColor);
const dryCopper = mix(0, { cusulfate: 8 });
assert.equal(dryCopper.appearance, 'white powder');
const wetCopper = mix(40, { cusulfate: 8 });
assert.equal(wetCopper.appearance, 'blue solution');
assert.match(wetCopper.color, /63,\s*140,\s*218|3F8CDA/i);

assert.equal(lab.SUBSTANCES.fibre.category, 'biomass');
assert.equal(lab.passesFilter(lab.SUBSTANCES.fibre), false);

const guide = lab.CREATIONS.find((row) => row.slug === 'ph-challenge');
const base = guide.tutorial.find((row) => row.id === 'base');
assert.equal(base.amounts.bicarbonate, guideMass);
assert.equal(base.checkPh.min, 6.5);
assert.equal(base.checkPh.max, 7.5);
assert.match(guide.lede.en, /not the equivalence point/i);
assert.match(guide.lede.pt, /não é o ponto de equivalência/);
assert.match(base.why.en, /not the equivalence point/i);
assert.match(base.why.pt, /não é o ponto de equivalência/);
assert.doesNotMatch(base.en, /exactly 7/i);
assert.doesNotMatch(base.pt, /exatamente 7/i);

function challenge(bicarbG) {
  const session = lab.emptySession({ title: 'Challenge', mode: 'bench' });
  lab.addToContainer(session, 'beaker-a', 'water', 50);
  lab.addToContainer(session, 'beaker-a', 'citric_acid', 6);
  lab.addToContainer(session, 'beaker-a', 'bicarbonate', bicarbG);
  return lab.tutorialState(session, guide);
}

const short = challenge(6);
assert.equal(short.done[0], true, 'water and citric acid complete the first step');
assert.equal(short.done[1], false, '6 g of bicarbonate misses pH 6.5–7.5');
const aimed = challenge(guideMass);
assert.equal(aimed.done[1], true, 'the guide mass is accepted');
assert.equal(aimed.done[2], false, 'the measure step still waits for a reading');

const fizz = mix(40, { citric_acid: 10, bicarbonate: 10 });
assert.equal(fizz.fizz, true);
assert.equal(fizz.productId, 'fizz');
const past = mix(50, { citric_acid: 6, bicarbonate: 10 });
assert.equal(past.fizz, false, 'bicarbonate past 3 equivalents does not keep fizzing');
assert.equal(past.productId, 'citrate');

const listed = ['water', 'nacl', 'sucrose', 'citric_acid', 'bicarbonate', 'cusulfate'];
listed.forEach((id) => assert.ok(lab.SUBSTANCES[id].chem, id + ' carries a chem record'));
['indicator', 'limonene', 'ethanol', 'yeast', 'fibre', 'zno'].forEach((id) => {
  assert.equal(lab.SUBSTANCES[id].chem, undefined, id + ' stays neutral without an invented pKa');
});

console.log('test-lab-ph: ok');
console.log('citric', citric.ph.toFixed(3), 'guide', guideMass, guidePh.toFixed(3), 'endpoint', endpoint.toFixed(3), '10 g', excess.toFixed(3));
