import assert from 'node:assert/strict';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const E = require('../assets/chem/isomer-engine.js');

// Constitutional isomer counts from the textbooks (no stereoisomers).
const counts = {
  C4H10: 2, C5H12: 3, C6H14: 5, C7H16: 9, C8H18: 18,
  C3H8O: 3, C4H10O: 7, C5H12O: 14,
  C4H8: 5, C5H10: 10, C6H12: 25, C7H14: 56,
  C3H4: 3, C2H6O: 2, C2H7N: 2, C3H9N: 4,
  C3H7Cl: 2, C2H4Cl2: 2, C4H9Cl: 4
};
for (const [formula, n] of Object.entries(counts)) {
  assert.equal(E.enumerate(formula).total, n, formula);
}
// C3H6O: 7 stable isomers + 2 enols (tautomers), flagged as unstable.
const c3h6o = E.enumerate('C3H6O').isomers;
assert.equal(c3h6o.length, 9);
assert.equal(c3h6o.filter((m) => E.classify(m).unstable).length, 2);

// Formula validation
assert.equal(E.parseFormula('C₄H₁₀O').counts.H, 10);
assert.equal(E.parseFormula('C4H11').error, 'impossible');
assert.equal(E.parseFormula('H2O').error, 'no-carbon');
assert.equal(E.parseFormula('C12H26').error, 'too-big');

// Condensed formulas read the way they are written in class.
const P = (s) => { const m = E.parseStructure(s); assert.ok(!m.error, s + ' → ' + m.error); return m; };
const formulaOf = (s) => E.formulaOf(P(s));
assert.equal(formulaOf('CH3CH2OH'), 'C2H6O');
assert.equal(formulaOf('(CH3)3COH'), 'C4H10O');
assert.equal(formulaOf('CH3(CH2)4CH3'), 'C6H14');
assert.equal(formulaOf('HOOC-CH(OH)-CH(OH)-COOH'), 'C4H6O6');
assert.equal(formulaOf('CH3CHBrCHBrCH3'), 'C4H8Br2');
assert.equal(formulaOf('CH3COOCH2CH3'), 'C4H8O2');
assert.equal(formulaOf('c1ccccc1'), 'C6H6');
assert.equal(E.condensed(P('CH3CH(OH)CH3')), 'CH₃–CH(OH)–CH₃');
assert.equal(E.condensed(P('CH3CH2CHO')), 'CH₃–CH₂–CHO');
assert.equal(E.condensed(P('CH3COOH')), 'CH₃–COOH');

// Type of isomerism between two compounds
const pair = (a, b) => E.pairType(P(a), P(b));
assert.equal(pair('CH3CH2CH2CH3', 'CH3CH(CH3)CH3'), 'cadeia');
assert.equal(pair('CH3CH2CH2OH', 'CH3CH(OH)CH3'), 'posicao');
assert.equal(pair('CH3CH2OH', 'CH3OCH3'), 'funcao');
assert.equal(pair('CH3OCH2CH2CH3', 'CH3CH2OCH2CH3'), 'metameria');
assert.equal(pair('CH3COCH3', 'CH2=C(OH)CH3'), 'tautomeria');
assert.equal(pair('CH2=CHCH2CH3', 'CH3CH=CHCH3'), 'posicao');
assert.equal(pair('CH2=CHCH3', 'C1CC1'), 'funcao');
assert.equal(pair('Cc1ccccc1O', 'Cc1ccc(O)cc1'), 'posicao');
assert.equal(pair('Cc1ccccc1O', 'OCc1ccccc1'), 'funcao');
assert.equal(pair('CH3CH2OH', 'CH3CH2CH2OH'), 'not-isomers');
assert.equal(pair('CH3CH(CH3)CH2CH3', 'C(CH3)4'), 'cadeia');                 // isopentane × neopentane
assert.equal(pair('CH3CH(CH3)CH2CH2CH3', 'CH3CH2CH(CH3)CH2CH3'), 'posicao'); // 2- × 3-methylpentane
assert.equal(pair('CH3CH(OH)CH(CH3)CH3', 'CH3C(OH)(CH3)CH2CH3'), 'posicao');

// Stereochemistry
const st = (s) => E.stereo(P(s));
assert.equal(st('CH3CH(OH)CH2CH3').chiralCenters.length, 1);
assert.equal(st('CH3CH(OH)CH2CH3').stereoisomers, 2);
assert.equal(st('CH3CH(OH)COOH').opticallyActive, 2);                 // lactic acid
const tartaric = st('HOOC-CH(OH)-CH(OH)-COOH');
assert.equal(tartaric.chiralCenters.length, 2);
assert.equal(tartaric.meso, true);
assert.equal(tartaric.stereoisomers, 3);                                // d, l, meso
assert.equal(tartaric.opticallyActive, 2);
assert.equal(st('CH3CH=CHCH3').cisTrans, true);
assert.equal(st('CH2=CHCH3').cisTrans, false);
assert.equal(st('CH3C(CH3)=CHCH3').cisTrans, false);
assert.equal(st('CC1CC1C').ringCisTrans, true);                         // 1,2-dimethylcyclopropane
assert.equal(st('CC1CCCCC1').chiralCenters.length, 0);                  // methylcyclohexane
assert.equal(st('c1ccccc1C').cisTrans, false);

// R/S follows the model: the mirror image flips every centre.
const lactic = P('CH3CH(OH)COOH');
const centres = E.stereo(lactic).chiralCenters;
const a = E.embed3d(lactic), b = E.embed3d(lactic, { mirror: true });
assert.notEqual(E.assignRS(a, a.coords, centres)[centres[0]], E.assignRS(b, b.coords, centres)[centres[0]]);

// 3D geometry: C–C bonds near 1.5 Å, C=C near 1.34 Å
const butene = E.embed3d(P('CH3CH=CHCH3'));
const dist = (i, j) => Math.hypot(...[0, 1, 2].map((k) => butene.coords[i][k] - butene.coords[j][k]));
butene.bonds.filter((x) => x.a < butene.heavy && x.b < butene.heavy).forEach((x) => {
  const d = dist(x.a, x.b);
  if (x.o === 1) assert.ok(d > 1.4 && d < 1.62, 'C–C ' + d);
  if (x.o === 2) assert.ok(d > 1.26 && d < 1.42, 'C=C ' + d);
});

// IUPAC-style names (PT and EN), null when the engine is not sure.
const name = (s, lang) => E.nameOf(P(s), lang);
const NAMES = [
  ['CH3CH2CH2CH3', 'butano', 'butane'],
  ['CH3CH(CH3)CH3', '2-metilpropano', '2-methylpropane'],
  ['C(CH3)4', '2,2-dimetilpropano', '2,2-dimethylpropane'],
  ['CH3CH(CH3)CH2CH(CH3)CH3', '2,4-dimetilpentano', '2,4-dimethylpentane'],
  ['CH3CH2CH(CH3)CH2CH2CH3', '3-metilhexano', '3-methylhexane'],
  ['CH3CH(OH)CH2CH3', 'butan-2-ol', 'butan-2-ol'],
  ['(CH3)3COH', '2-metilpropan-2-ol', '2-methylpropan-2-ol'],
  ['CH3CH2OH', 'etanol', 'ethanol'],
  ['CH3CH2CH2OH', 'propan-1-ol', 'propan-1-ol'],
  ['CH2=CHCH2OH', 'prop-2-en-1-ol', 'prop-2-en-1-ol'],
  ['CH3OCH2CH3', 'metoxietano', 'methoxyethane'],
  ['CH3OCH3', 'metoximetano', 'methoxymethane'],
  ['CH3CH2OCH2CH3', 'etoxietano', 'ethoxyethane'],
  ['CH3CH2CH2CHO', 'butanal', 'butanal'],
  ['HCHO', 'metanal', 'methanal'],
  ['CH3COCH2CH3', 'butanona', 'butanone'],
  ['CH3COCH3', 'propanona', 'propanone'],
  ['CH3CH2COCH2CH3', 'pentan-3-ona', 'pentan-3-one'],
  ['CH3CH2CH2COOH', 'ácido butanoico', 'butanoic acid'],
  ['HCOOH', 'ácido metanoico', 'methanoic acid'],
  ['CH3COOCH3', 'etanoato de metila', 'methyl ethanoate'],
  ['HCOOCH2CH3', 'metanoato de etila', 'ethyl methanoate'],
  ['CH2=CHCH2CH3', 'but-1-eno', 'but-1-ene'],
  ['CH3CH=CHCH3', 'but-2-eno', 'but-2-ene'],
  ['CH2=C(CH3)CH3', '2-metilpropeno', '2-methylpropene'],
  ['CH2=CH-CH=CH2', 'buta-1,3-dieno', 'buta-1,3-diene'],
  ['CH3CH2C#CH', 'but-1-ino', 'but-1-yne'],
  ['C1CCC1', 'ciclobutano', 'cyclobutane'],
  ['C1CCCCC1', 'ciclo-hexano', 'cyclohexane'],
  ['CC1CC1', 'metilciclopropano', 'methylcyclopropane'],
  ['C1CCCCC1O', 'ciclo-hexanol', 'cyclohexanol'],
  ['c1ccccc1', 'benzeno', 'benzene'],
  ['Cc1ccccc1', 'tolueno', 'toluene'],
  ['Oc1ccccc1', 'fenol', 'phenol'],
  ['CH3CH2CH2Cl', '1-cloropropano', '1-chloropropane'],
  ['CH3CHClCH3', '2-cloropropano', '2-chloropropane'],
  ['CH3CHCl2', '1,1-dicloroetano', '1,1-dichloroethane'],
  ['CH3CHClCH2OH', '2-cloropropan-1-ol', '2-chloropropan-1-ol'],
  ['CH3CH2CH2NH2', 'propan-1-amina', 'propan-1-amine'],
  ['CH3NH2', 'metanamina', 'methanamine'],
  // outside the confident set → null (diol, secondary amine, enol, acyl chloride, disubstituted ring)
  ['CH3CH(OH)CH(OH)CH3', null, null],
  ['CH3NHCH3', null, null],
  ['CH2=C(OH)CH3', null, null],
  ['CH3COCl', null, null],
  ['CC1CC1C', null, null]
];
for (const [s, pt, en] of NAMES) {
  assert.equal(name(s, 'pt'), pt, s + ' (pt)');
  assert.equal(name(s, 'en'), en, s + ' (en)');
}
// Different isomers never share a name.
for (const f of ['C4H10O', 'C5H12', 'C6H14', 'C4H8', 'C5H10', 'C3H6O', 'C4H8O2', 'C3H7Cl', 'C4H9Cl', 'C3H9N', 'C5H10O']) {
  for (const lang of ['pt', 'en']) {
    const names = E.enumerate(f).isomers.map((m) => E.nameOf(m, lang)).filter(Boolean);
    assert.equal(new Set(names).size, names.length, f + ' ' + lang + ' duplicate names: ' + names.join(', '));
  }
}
assert.equal(E.enumerate('C4H10O').isomers.filter((m) => E.nameOf(m, 'pt')).length, 7);

console.log('isomer engine ok');
