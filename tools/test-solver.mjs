import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { molarMassOf, parseFormula } from '../netlify/lib/chemistry-calc.mjs';
import { parseFormulaStrict, formatFormulaDisplay, IONIC_UNAVAILABLE, MAX_ATOM_COUNT, MAX_HYDRATE_MULTIPLIER } from '../netlify/lib/chemistry-formula-strict.mjs';
import { balanceEquation, parseEquation, REACTION_LIMITS } from '../netlify/lib/chemistry-reactions.mjs';
import { solveStoichiometry, YIELD_OVER_100, EXCESS_ASSUMPTION, STOICHIOMETRIC_MIXTURE, allReactantsSpecified } from '../netlify/lib/chemistry-stoichiometry.mjs';
import { solveEmpiricalFormula, solveMolecularFormula, solveFormula, UNCLEAR_RATIO, BAD_MOLECULAR_MULTIPLE, RATIO_TOLERANCE, DUPLICATE_ELEMENT } from '../netlify/lib/chemistry-formula-solver.mjs';
import { prepareFromSolid, mixSolutions, solveSolution, ADDITIVE_VOLUMES } from '../netlify/lib/chemistry-solutions.mjs';
import { accessForUser } from '../netlify/lib/plan-access.mjs';
import { SOLVER_VERSION, SOLVER_EPSILON, requireNonNegativeNumber } from '../netlify/lib/chemistry-units.mjs';

function atoms(side) {
  const out = {};
  side.forEach((row) => {
    Object.keys(row.counts).forEach((el) => {
      out[el] = (out[el] || 0) + row.counts[el] * row.coefficient;
    });
  });
  return out;
}

function assertBalanced(result) {
  assert.deepEqual(atoms(result.reactants), atoms(result.products));
}

function expectBalance(input, expected) {
  const result = balanceEquation(input);
  assert.equal(result.balanced, expected);
  assertBalanced(result);
  return result;
}

assert.equal(SOLVER_VERSION, 1);

assert.deepEqual(parseFormulaStrict('H2O').counts, { H: 2, O: 1 });
assert.deepEqual(parseFormulaStrict('Ca(OH)2').counts, { Ca: 1, O: 2, H: 2 });
assert.deepEqual(parseFormulaStrict('Al2(SO4)3').counts, { Al: 2, S: 3, O: 12 });
assert.deepEqual(parseFormulaStrict('K4[Fe(CN)6]').counts, { K: 4, Fe: 1, C: 6, N: 6 });
assert.deepEqual(parseFormulaStrict('CuSO4·5H2O').counts, { Cu: 1, S: 1, O: 9, H: 10 });

assert.throws(() => parseFormulaStrict('H2O???'), /unexpected character/);
assert.throws(() => parseFormulaStrict('NaCl<script>'), /unexpected/);
assert.throws(() => parseFormulaStrict('Fe@@O'), /unexpected/);
assert.throws(() => parseFormulaStrict('Fe3+'), (err) => err.code === 'ionic_unsupported' || /Ionic/.test(err.message));
assert.throws(() => parseFormulaStrict('SO4^2-'), (err) => err.code === 'ionic_unsupported');
assert.doesNotMatch(IONIC_UNAVAILABLE, /not yet/i);

const lenient = parseFormula('H2O???');
assert.ok(lenient.H);

expectBalance('H2 + O2 -> H2O', '2 H2 + O2 -> 2 H2O');
expectBalance('2 H2 + O2 -> 2 H2O', '2 H2 + O2 -> 2 H2O');
expectBalance('Fe + O2 -> Fe2O3', '4 Fe + 3 O2 -> 2 Fe2O3');
expectBalance('C2H6 + O2 -> CO2 + H2O', '2 C2H6 + 7 O2 -> 4 CO2 + 6 H2O');
expectBalance('Al + HCl -> AlCl3 + H2', '2 Al + 6 HCl -> 2 AlCl3 + 3 H2');
expectBalance('Ca(OH)2 + H3PO4 -> Ca3(PO4)2 + H2O', '3 Ca(OH)2 + 2 H3PO4 -> Ca3(PO4)2 + 6 H2O');
expectBalance('4 H2 + 2 O2 -> 4 H2O', '2 H2 + O2 -> 2 H2O');
expectBalance('C2H6 + O2 → CO2 + H2O', '2 C2H6 + 7 O2 -> 4 CO2 + 6 H2O');
expectBalance('H2 + O2 = H2O', '2 H2 + O2 -> 2 H2O');
expectBalance('CuSO4·5H2O -> CuSO4 + H2O', 'CuSO4·5H2O -> CuSO4 + 5 H2O');

assert.throws(() => balanceEquation('C + O2 -> CO + CO2'), /multiple independent/);
assert.throws(() => balanceEquation('H2 + O2'), /reactants and products|arrow/);
assert.throws(() => balanceEquation('H2 ->'), /products/);
assert.throws(() => balanceEquation('Xx + O2 -> XxO'), /unknown element/);
assert.throws(() => parseEquation('H2O??? + O2 -> H2O'), /unexpected/);
assert.throws(() => balanceEquation('Fe3+ + e- -> Fe'), /Ionic equation balancing is not available/);

const oversized = Array.from({ length: 13 }, (_, i) => `C${i + 1}`).join(' + ') + ' -> CO2';
assert.throws(() => balanceEquation(oversized), /species|unknown|equation/);
assert.equal(REACTION_LIMITS.species, 12);
assert.throws(() => balanceEquation('H2 + O2 -> H2O'.repeat(80)), /too long/);

const water = solveStoichiometry({
  equation: 'H2 + O2 -> H2O',
  quantities: [{ formula: 'H2', amount: 2, unit: 'mol' }],
  target: { formula: 'H2O', unit: 'mol' }
});
assert.equal(water.target.moles, 2);
assert.equal(water.limitingReagent, null);
assert.equal(water.limitingAnalysisComplete, false);
assert.equal(water.calculationBasis.formula, 'H2');
assert.equal(water.calculationBasis.assumption, EXCESS_ASSUMPTION);
assert.deepEqual(water.unspecifiedReactants, ['O2']);
assert.ok(water.steps.some((step) => step.title === 'Set calculation basis'));
assert.ok(!water.steps.some((step) => step.title === 'Identify limiting reagent'));
assertBalanced(balanceEquation(water.balanced));

const grams = solveStoichiometry({
  equation: 'H2 + O2 -> H2O',
  quantities: [
    { formula: 'H2', amount: 10, unit: 'g' },
    { formula: 'O2', amount: 40, unit: 'g' }
  ],
  target: { formula: 'H2O', unit: 'g' }
});
assert.equal(grams.limitingReagent, 'O2');
assert.equal(grams.limitingAnalysisComplete, true);
assert.equal(grams.calculationBasis, null);
assert.equal(grams.stoichiometricMixture, false);
assert.ok(grams.target.grams > 0);
assert.match(grams.target.amountDisplay, /g/);
assert.doesNotMatch(grams.target.amountDisplay, /\d{8}/);
assert.ok(grams.excess.some((row) => row.formula === 'H2' && row.remainingGrams > 0));
assert.ok(grams.steps.length >= 4);
assert.match(grams.steps[1].body, /mol/);

const overYield = solveStoichiometry({
  equation: 'H2 + O2 -> H2O',
  quantities: [{ formula: 'O2', amount: 32, unit: 'g' }],
  target: { formula: 'H2O', unit: 'g' },
  actualYield: { amount: 50, unit: 'g' }
});
assert.ok(overYield.percentYield > 100);
assert.equal(overYield.yieldNote, YIELD_OVER_100);
assert.equal(overYield.limitingReagent, null);

const gasQty = solveStoichiometry({
  equation: 'H2 + O2 -> H2O',
  quantities: [{ formula: 'O2', kind: 'gas', volume: 24.464, unit: 'L', P: 1, PUnit: 'atm', T: 298.15, TUnit: 'K' }],
  target: { formula: 'H2O', unit: 'mol' }
});
assert.ok(Math.abs(gasQty.target.moles - 2) < 0.05);

const solQty = solveStoichiometry({
  equation: 'HCl + NaOH -> NaCl + H2O',
  quantities: [{ formula: 'HCl', kind: 'solution', concentration: 0.5, concUnit: 'mol/L', volume: 0.25, volUnit: 'L' }],
  target: { formula: 'NaCl', unit: 'mol' }
});
assert.ok(Math.abs(solQty.target.moles - 0.125) < 1e-9);

const emp = solveEmpiricalFormula({
  composition: [
    { symbol: 'C', value: 40.00, unit: 'percent' },
    { symbol: 'H', value: 6.71, unit: 'percent' },
    { symbol: 'O', value: 53.29, unit: 'percent' }
  ]
});
assert.equal(emp.empiricalFormula, 'CH2O');
assert.equal(emp.empiricalFormulaDisplay, 'CH₂O');

const empMass = solveEmpiricalFormula({
  composition: [
    { symbol: 'C', value: 12.0, unit: 'g' },
    { symbol: 'H', value: 2.0, unit: 'g' },
    { symbol: 'O', value: 16.0, unit: 'g' }
  ]
});
assert.equal(empMass.empiricalFormula, 'CH2O');

const mol = solveMolecularFormula({ empiricalFormula: 'CH2O', molarMass: 180.16 });
assert.equal(mol.molecularFormula, 'C6H12O6');
assert.equal(mol.molecularFormulaDisplay, 'C₆H₁₂O₆');
assert.equal(mol.multiple, 6);

assert.throws(() => solveMolecularFormula({ empiricalFormula: 'CH2O', molarMass: 163 }), (err) => {
  return err.message === BAD_MOLECULAR_MULTIPLE;
});
assert.throws(() => solveEmpiricalFormula({
  composition: [
    { symbol: 'C', value: 10, unit: 'percent' },
    { symbol: 'H', value: 10, unit: 'percent' }
  ]
}), /100/);

const nacl = prepareFromSolid({
  formula: 'NaCl',
  concentration: 0.5,
  concUnit: 'mol/L',
  volume: 1,
  volUnit: 'L'
});
assert.ok(Math.abs(nacl.grams - 29.22) < 0.02);
assert.match(nacl.note, /Calculation only/);

const mixed = mixSolutions({
  formula: 'NaCl',
  solutions: [
    { concentration: 0.5, volume: 0.1, volUnit: 'L' },
    { concentration: 1.0, volume: 0.05, volUnit: 'L' }
  ]
});
assert.equal(mixed.assumption, ADDITIVE_VOLUMES);
assert.ok(Math.abs(mixed.concentration - (0.5 * 0.1 + 1 * 0.05) / 0.15) < 1e-9);

const free = accessForUser({ createdAt: '2020-01-01T00:00:00.000Z', email: 'a@b.com' });
assert.equal(free.features.chemistrySolver, false);
assert.equal(free.features.reactionWorkbench, false);
assert.equal(free.features.reactionBalancer, false);
assert.equal(free.features.stoichiometrySolver, false);
assert.equal(free.features.limitingReagentSolver, false);
assert.equal(free.features.yieldSolver, false);
assert.equal(free.features.formulaSolver, false);
assert.equal(free.features.solutionBuilder, false);
assert.equal(free.features.equilibriumWorkbench, false);
assert.equal(free.features.acidBaseWorkbench, false);
assert.equal(free.features.iceTableSolver, false);

const trial = accessForUser({ createdAt: new Date().toISOString(), email: 't@b.com' });
assert.equal(trial.features.chemistrySolver, true);
assert.equal(trial.features.reactionWorkbench, true);
assert.equal(trial.features.formulaSolver, true);
assert.equal(trial.features.solutionBuilder, true);
assert.equal(trial.features.equilibriumSolver, true);
assert.equal(trial.features.weakAcidSolver, true);

const paid = accessForUser({
  createdAt: '2020-01-01T00:00:00.000Z',
  appMetadata: { subscription_status: 'active' }
});
assert.equal(paid.features.reactionBalancer, true);
assert.equal(paid.features.stoichiometrySolver, true);

const admin = accessForUser({ role: 'admin', createdAt: '2020-01-01T00:00:00.000Z' });
assert.equal(admin.features.chemistrySolver, true);

const files = [
  'netlify/lib/chemistry-units.mjs',
  'netlify/lib/chemistry-formula-strict.mjs',
  'netlify/lib/chemistry-reactions.mjs',
  'netlify/lib/chemistry-stoichiometry.mjs',
  'netlify/lib/chemistry-formula-solver.mjs',
  'netlify/lib/chemistry-solutions.mjs',
  'netlify/lib/chemistry-equilibrium.mjs',
  'netlify/lib/chemistry-acid-base.mjs',
  'netlify/lib/chemistry-numerics.mjs'
];
for (const rel of files) {
  const src = readFileSync(new URL('../' + rel, import.meta.url), 'utf8');
  assert.doesNotMatch(src, /(?:^|[^/\w* ])eval\s*\(/);
  assert.doesNotMatch(src, /new Function\s*\(/);
}

assert.ok(molarMassOf('NaCl').molarMass);

assert.equal(formatFormulaDisplay('H2O'), 'H₂O');
assert.equal(formatFormulaDisplay('C6H12O6'), 'C₆H₁₂O₆');
assert.equal(formatFormulaDisplay('Ca(OH)2'), 'Ca(OH)₂');
assert.equal(formatFormulaDisplay('CuSO4·5H2O'), 'CuSO₄·5H₂O');
assert.equal(formatFormulaDisplay('Al2(SO4)3·18H2O'), 'Al₂(SO₄)₃·18H₂O');
assert.doesNotMatch(formatFormulaDisplay('CuSO4·5H2O'), /·₅/);

assert.deepEqual(parseFormulaStrict('Mg(OH)2').counts, { Mg: 1, O: 2, H: 2 });
assert.deepEqual(parseFormulaStrict('Fe2(SO4)3').counts, { Fe: 2, S: 3, O: 12 });
assert.deepEqual(parseFormulaStrict('Al2(SO4)3·18H2O').counts, { Al: 2, S: 3, O: 30, H: 36 });
assert.throws(() => parseFormulaStrict('Mg(OH'), /unbalanced/);
assert.throws(() => parseFormulaStrict('C999999999999999999999999999'), /atom count|too large|invalid/);
assert.throws(() => parseFormulaStrict('CuSO4·999999999999999999999H2O'), /hydrate|too large|invalid/);
assert.ok(MAX_ATOM_COUNT <= 100000);
assert.ok(MAX_HYDRATE_MULTIPLIER <= 100000);

assert.throws(() => parseEquation('0 H2 + O2 -> H2O'), /coefficient|positive|invalid/);
assert.throws(() => parseEquation('999999999999999 H2 + O2 -> H2O'), /coefficient|too large|invalid/);
assert.throws(() => parseEquation('H2 + H2 + O2 -> H2O'), (err) => err.code === 'duplicate_species' || /more than once/.test(err.message));
assert.throws(() => balanceEquation('H2 + O2 -> H2O + O2'), /multiple independent|cannot be balanced/);
assert.throws(() => parseEquation('-2 H2 + O2 -> H2O'), /unexpected|Ionic|invalid/);

const extraEq = [
  ['N2 + H2 -> NH3', 'N2 + 3 H2 -> 2 NH3'],
  ['KClO3 -> KCl + O2', '2 KClO3 -> 2 KCl + 3 O2'],
  ['Na3PO4 + MgCl2 -> NaCl + Mg3(PO4)2', '2 Na3PO4 + 3 MgCl2 -> 6 NaCl + Mg3(PO4)2'],
  ['C3H8 + O2 -> CO2 + H2O', 'C3H8 + 5 O2 -> 3 CO2 + 4 H2O'],
  ['NH3 + O2 -> NO + H2O', '4 NH3 + 5 O2 -> 4 NO + 6 H2O']
];
for (const [input, expected] of extraEq) {
  const result = expectBalance(input, expected);
  const coeffs = [...result.reactants, ...result.products].map((row) => row.coefficient);
  assert.ok(coeffs.every((n) => Number.isInteger(n) && n > 0));
  const g = coeffs.reduce((a, b) => {
    let x = a;
    let y = b;
    while (y) {
      const t = x % y;
      x = y;
      y = t;
    }
    return x;
  });
  assert.equal(g, 1);
}

const complete = solveStoichiometry({
  equation: 'H2 + O2 -> H2O',
  quantities: [
    { formula: 'H2', amount: 10, unit: 'g' },
    { formula: 'O2', amount: 40, unit: 'g' }
  ],
  target: { formula: 'H2O', unit: 'g' }
});
assert.equal(complete.limitingReagent, 'O2');
assert.equal(complete.limitingAnalysisComplete, true);

const mixture = solveStoichiometry({
  equation: 'H2 + O2 -> H2O',
  quantities: [
    { formula: 'H2', amount: 2, unit: 'mol' },
    { formula: 'O2', amount: 1, unit: 'mol' }
  ],
  target: { formula: 'H2O', unit: 'mol' }
});
assert.equal(mixture.limitingReagent, null);
assert.equal(mixture.stoichiometricMixture, true);
assert.equal(mixture.limitingAnalysisComplete, true);
assert.ok(mixture.excess.every((row) => row.remainingGrams === 0));
assert.match(mixture.steps.map((s) => s.body).join('\n'), /stoichiometric proportion/);

const partial = solveStoichiometry({
  equation: 'NH3 + CO2 + H2O -> (NH4)2CO3',
  quantities: [
    { formula: 'NH3', amount: 1, unit: 'mol' },
    { formula: 'CO2', amount: 4, unit: 'mol' }
  ],
  target: { formula: '(NH4)2CO3', unit: 'mol' }
});
assert.equal(partial.limitingReagent, null);
assert.equal(partial.limitingAnalysisComplete, false);
assert.equal(partial.constraintAmongSpecified, 'NH3');
assert.ok(partial.unspecifiedReactants.includes('H2O'));
assert.ok(partial.steps.some((step) => step.title === 'Compare specified reactants'));

assert.throws(() => solveStoichiometry({
  equation: 'H2 + O2 -> H2O',
  quantities: [{ formula: 'H2O', amount: 10, unit: 'g' }],
  target: { formula: 'H2O', unit: 'g' }
}), (err) => err.code === 'invalid_given_species');

assert.throws(() => solveStoichiometry({
  equation: 'H2 + O2 -> H2O',
  quantities: [{ formula: 'H2', amount: 2, unit: 'mol' }],
  target: { formula: 'H2', unit: 'mol' }
}), (err) => err.code === 'invalid_target_species');

assert.throws(() => solveStoichiometry({
  equation: 'H2 + O2 -> H2O',
  quantities: [
    { formula: 'H2', amount: 10, unit: 'g' },
    { formula: 'H2', amount: 5, unit: 'g' }
  ],
  target: { formula: 'H2O', unit: 'g' }
}), (err) => err.code === 'duplicate_given_species');

assert.throws(() => solveStoichiometry({
  equation: 'H2 + O2 -> H2O',
  quantities: [{ formula: 'H2', amount: 2, unit: 'gram' }],
  target: { formula: 'H2O', unit: 'g' }
}), /mass unit is not supported/);

assert.throws(() => solveStoichiometry({
  equation: 'H2 + O2 -> H2O',
  quantities: [{ formula: 'H2', amount: 2, unit: 'mol' }],
  target: { formula: 'H2O', unit: 'gram' }
}), /target unit is not supported/);

const zeroYield = solveStoichiometry({
  equation: 'H2 + O2 -> H2O',
  quantities: [{ formula: 'H2', amount: 2, unit: 'mol' }],
  target: { formula: 'H2O', unit: 'g' },
  actualYield: { amount: 0, unit: 'g' }
});
assert.equal(zeroYield.percentYield, 0);

const molYield = solveStoichiometry({
  equation: 'H2 + O2 -> H2O',
  quantities: [{ formula: 'H2', amount: 2, unit: 'mol' }],
  target: { formula: 'H2O', unit: 'mol' },
  actualYield: { amount: 1, unit: 'mol' }
});
assert.ok(Math.abs(molYield.percentYield - 50) < 1e-6);

assert.equal(requireNonNegativeNumber(0, 'actual yield'), 0);
assert.throws(() => requireNonNegativeNumber(-1, 'actual yield'), /non-negative/);

const gasC = solveStoichiometry({
  equation: 'H2 + O2 -> H2O',
  quantities: [{ formula: 'O2', kind: 'gas', volume: 24.464, volUnit: 'L', P: 1, PUnit: 'atm', T: 25, TUnit: 'C' }],
  target: { formula: 'H2O', unit: 'mol' }
});
assert.ok(Math.abs(gasC.target.moles - 2) < 0.05);

const gasCold = solveStoichiometry({
  equation: 'H2 + O2 -> H2O',
  quantities: [{ formula: 'O2', kind: 'gas', volume: 1, volUnit: 'L', P: 1, PUnit: 'atm', T: -20, TUnit: 'C' }],
  target: { formula: 'H2O', unit: 'mol' }
});
assert.ok(gasCold.target.moles > 0);

assert.throws(() => solveStoichiometry({
  equation: 'H2 + O2 -> H2O',
  quantities: [{ formula: 'O2', kind: 'gas', volume: 1, volUnit: 'L', P: 1, PUnit: 'atm', T: -300, TUnit: 'C' }],
  target: { formula: 'H2O', unit: 'mol' }
}), /absolute zero|temperature/);

assert.throws(() => solveStoichiometry({
  equation: 'H2 + O2 -> H2O',
  quantities: [{ formula: 'H2', amount: -1, unit: 'g' }],
  target: { formula: 'H2O', unit: 'g' }
}), /positive/);

assert.throws(() => solveStoichiometry({
  equation: 'H2 + O2 -> H2O',
  quantities: [{ formula: 'H2', amount: Number.NaN, unit: 'g' }],
  target: { formula: 'H2O', unit: 'g' }
}), /finite/);
assert.throws(() => solveStoichiometry({
  equation: 'H2 + O2 -> H2O',
  quantities: [{ formula: 'H2', amount: Number.POSITIVE_INFINITY, unit: 'g' }],
  target: { formula: 'H2O', unit: 'g' }
}), /finite|range/);

const empMassMode = solveEmpiricalFormula({
  mode: 'mass',
  composition: [
    { symbol: 'C', value: 12 },
    { symbol: 'H', value: 2 },
    { symbol: 'O', value: 16 }
  ]
});
assert.equal(empMassMode.empiricalFormula, 'CH2O');

const empMassWinsOverPercentUnit = solveEmpiricalFormula({
  mode: 'mass',
  composition: [
    { symbol: 'C', value: 12, unit: 'percent' },
    { symbol: 'H', value: 2, unit: 'percent' },
    { symbol: 'O', value: 16, unit: 'percent' }
  ]
});
assert.equal(empMassWinsOverPercentUnit.empiricalFormula, 'CH2O');

const empPercentMode = solveEmpiricalFormula({
  mode: 'percent',
  composition: [
    { symbol: 'C', value: 40.00 },
    { symbol: 'H', value: 6.71 },
    { symbol: 'O', value: 53.29 }
  ]
});
assert.equal(empPercentMode.empiricalFormula, 'CH2O');
assert.match(empPercentMode.steps[0].body, /normalized|100 g sample/i);

assert.throws(() => solveFormula({ mode: 'banana', composition: [{ symbol: 'C', value: 12 }] }), (err) => err.code === 'invalid_mode');
assert.throws(() => solveEmpiricalFormula({
  composition: [
    { symbol: 'C', value: 20, unit: 'percent' },
    { symbol: 'C', value: 20, unit: 'percent' },
    { symbol: 'H', value: 6, unit: 'percent' },
    { symbol: 'O', value: 54, unit: 'percent' }
  ]
}), (err) => err.code === 'duplicate_element' && err.message === DUPLICATE_ELEMENT);

assert.throws(() => solveEmpiricalFormula({
  composition: [{ symbol: 'co', value: 12, unit: 'g' }]
}), /unknown element/);

assert.throws(() => solveEmpiricalFormula({
  composition: [
    { symbol: 'C', value: 50, unit: 'percent' },
    { symbol: 'H', value: 48.9, unit: 'percent' }
  ]
}), /100/);
assert.doesNotThrow(() => solveEmpiricalFormula({
  composition: [
    { symbol: 'C', value: 40, unit: 'percent' },
    { symbol: 'O', value: 59, unit: 'percent' }
  ]
}));
assert.doesNotThrow(() => solveEmpiricalFormula({
  composition: [
    { symbol: 'C', value: 50, unit: 'percent' },
    { symbol: 'O', value: 51, unit: 'percent' }
  ]
}));
assert.doesNotThrow(() => solveEmpiricalFormula({
  composition: [
    { symbol: 'C', value: 50, unit: 'percent' },
    { symbol: 'O', value: 50, unit: 'percent' }
  ]
}));
assert.throws(() => solveEmpiricalFormula({
  composition: [
    { symbol: 'C', value: 50, unit: 'percent' },
    { symbol: 'O', value: 51.1, unit: 'percent' }
  ]
}), /100/);

function empFromRatio(ratioB) {
  return solveEmpiricalFormula({
    mode: 'mass',
    composition: [
      { symbol: 'C', value: 12.011 },
      { symbol: 'H', value: 1.008 * ratioB }
    ]
  });
}
assert.equal(empFromRatio(1.5).empiricalFormula, 'C2H3');
assert.equal(empFromRatio(4 / 3).empiricalFormula, 'C3H4');
assert.equal(empFromRatio(1.25).empiricalFormula, 'C4H5');
assert.equal(empFromRatio(1.2).empiricalFormula, 'C5H6');

assert.equal(RATIO_TOLERANCE, 0.08);
const atTolerance = solveEmpiricalFormula({
  mode: 'mass',
  composition: [
    { symbol: 'C', value: 12.011 },
    { symbol: 'H', value: 1.008 * 1.07 }
  ]
});
assert.equal(atTolerance.empiricalFormula, 'CH');

assert.throws(() => solveSolution({ mode: 'banana', formula: 'NaCl', concentration: 1, volume: 1 }), (err) => err.code === 'invalid_mode');
assert.throws(() => prepareFromSolid({ formula: 'NaCl', concentration: 0.5, concUnit: 'molar', volume: 1 }), /concentration unit/);
assert.throws(() => prepareFromSolid({ formula: 'NaCl', concentration: -1, volume: 1 }), /positive/);
assert.throws(() => prepareFromSolid({ formula: 'NaCl', concentration: 1, volume: 0 }), /positive/);

assert.ok(SOLVER_EPSILON <= 1e-9);
assert.equal(allReactantsSpecified(['H2', 'O2'], ['H2', 'O2']), true);
assert.equal(allReactantsSpecified(['H2', 'O2'], ['H2']), false);

const hydrateEq = balanceEquation('CuSO4·5H2O -> CuSO4 + H2O');
assert.match(hydrateEq.balancedDisplay, /CuSO₄·5H₂O/);
assert.doesNotMatch(hydrateEq.balancedDisplay, /·₅/);

console.log('solver tests passed');
