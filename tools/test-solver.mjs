import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { molarMassOf, parseFormula } from '../netlify/lib/chemistry-calc.mjs';
import { parseFormulaStrict, IONIC_UNAVAILABLE } from '../netlify/lib/chemistry-formula-strict.mjs';
import { balanceEquation, parseEquation, REACTION_LIMITS } from '../netlify/lib/chemistry-reactions.mjs';
import { solveStoichiometry, YIELD_OVER_100 } from '../netlify/lib/chemistry-stoichiometry.mjs';
import { solveEmpiricalFormula, solveMolecularFormula, UNCLEAR_RATIO, BAD_MOLECULAR_MULTIPLE } from '../netlify/lib/chemistry-formula-solver.mjs';
import { prepareFromSolid, mixSolutions, ADDITIVE_VOLUMES } from '../netlify/lib/chemistry-solutions.mjs';
import { accessForUser } from '../netlify/lib/plan-access.mjs';
import { SOLVER_VERSION } from '../netlify/lib/chemistry-units.mjs';

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

const trial = accessForUser({ createdAt: new Date().toISOString(), email: 't@b.com' });
assert.equal(trial.features.chemistrySolver, true);
assert.equal(trial.features.reactionWorkbench, true);
assert.equal(trial.features.formulaSolver, true);
assert.equal(trial.features.solutionBuilder, true);

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
  'netlify/lib/chemistry-solutions.mjs'
];
for (const rel of files) {
  const src = readFileSync(new URL('../' + rel, import.meta.url), 'utf8');
  assert.doesNotMatch(src, /(?:^|[^/\w* ])eval\s*\(/);
  assert.doesNotMatch(src, /new Function\s*\(/);
}

assert.ok(molarMassOf('NaCl').molarMass);

console.log('solver tests passed');
