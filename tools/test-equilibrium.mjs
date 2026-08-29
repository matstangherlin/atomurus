import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import {
  buildKExpression,
  parseEquilibriumEquation,
  solveEquilibrium
} from '../netlify/lib/chemistry-equilibrium.mjs';
import { relativeDifference } from '../netlify/lib/chemistry-numerics.mjs';
import { accessForUser } from '../netlify/lib/plan-access.mjs';

const eqSrc = readFileSync(new URL('../netlify/lib/chemistry-equilibrium.mjs', import.meta.url), 'utf8');
assert.doesNotMatch(eqSrc, /\beval\s*\(|new\s+Function/);

const simple = parseEquilibriumEquation('A <-> B');
assert.equal(simple.species.length, 2);
const kcSimple = solveEquilibrium({
  mode: 'constant',
  equation: 'A <-> B',
  values: [
    { formula: 'A', value: 0.2, unit: 'mol/L' },
    { formula: 'B', value: 0.8, unit: 'mol/L' }
  ]
});
assert.equal(kcSimple.K, 4);
assert.match(kcSimple.expression.text, /Kc = \[B\] \/ \(\[A\]\)|Kc = \[B\] \/ \( \[A\] \)|Kc = \[B\] \/ \(\[A\]\)/);
assert.match(kcSimple.balancedDisplay, /⇌/);

const ammonia = solveEquilibrium({
  mode: 'constant',
  equation: 'N2 + 3H2 ⇌ 2NH3',
  values: [
    { formula: 'N2', value: 1, unit: 'mol/L' },
    { formula: 'H2', value: 1, unit: 'mol/L' },
    { formula: 'NH3', value: 1, unit: 'mol/L' }
  ]
});
assert.match(ammonia.expression.text, /\[NH₃\]²|\[NH3\]²/);
assert.match(ammonia.expression.text, /\[H₂\]³|\[H2\]³/);
assert.equal(ammonia.K, 1);

const parsedNh3 = parseEquilibriumEquation('N2 + 3 H2 <-> 2 NH3');
const exprNh3 = buildKExpression(parsedNh3.species, 'kc');
const nh3Term = exprNh3.numerator.find((t) => t.formula === 'NH3');
const h2Term = exprNh3.denominator.find((t) => t.formula === 'H2');
assert.equal(nh3Term.coefficient, 2);
assert.equal(h2Term.coefficient, 3);

const carbonate = parseEquilibriumEquation('CaCO3(s) ⇌ CaO(s) + CO2(g)');
const kpExpr = buildKExpression(carbonate.species, 'kp');
assert.equal(kpExpr.active.length, 1);
assert.equal(kpExpr.active[0].formula, 'CO2');
assert.equal(kpExpr.numerator.length, 1);
assert.equal(kpExpr.denominator.length, 0);
const kp = solveEquilibrium({
  mode: 'constant',
  kind: 'kp',
  equation: 'CaCO3(s) <-> CaO(s) + CO2(g)',
  values: [{ formula: 'CO2', value: 0.5, unit: 'bar' }]
});
assert.equal(kp.K, 0.5);
assert.match(kp.convention, /bar/);

const unspecified = parseEquilibriumEquation('A <-> B');
assert.ok(unspecified.notes.some((n) => /Phase not specified/i.test(n)));

const qLt = solveEquilibrium({
  mode: 'quotient',
  equation: 'A <-> B',
  K: 10,
  values: [
    { formula: 'A', value: 1 },
    { formula: 'B', value: 1 }
  ]
});
assert.equal(qLt.comparison, 'lt');
assert.match(qLt.direction.en, /shift toward products/);
assert.match(qLt.direction.pt, /produtos/);
assert.doesNotMatch(qLt.direction.en, /definitely proceed/);

const qGt = solveEquilibrium({
  mode: 'quotient',
  equation: 'A <-> B',
  K: 0.1,
  values: [
    { formula: 'A', value: 1 },
    { formula: 'B', value: 1 }
  ]
});
assert.equal(qGt.comparison, 'gt');

const qNear = solveEquilibrium({
  mode: 'quotient',
  equation: 'A <-> B',
  K: 4,
  values: [
    { formula: 'A', value: 0.2 },
    { formula: 'B', value: 0.8 }
  ]
});
assert.equal(qNear.comparison, 'near');

assert.throws(
  () => solveEquilibrium({ mode: 'constant', equation: 'A <-> B', values: [{ formula: 'A', value: -0.1 }, { formula: 'B', value: 1 }] }),
  /non-negative|positive/
);
assert.throws(
  () => solveEquilibrium({ mode: 'quotient', equation: 'A <-> B', K: 0, values: [{ formula: 'A', value: 1 }, { formula: 'B', value: 1 }] }),
  /positive/
);
assert.throws(
  () => solveEquilibrium({ mode: 'quotient', equation: 'A <-> B', K: -2, values: [{ formula: 'A', value: 1 }, { formula: 'B', value: 1 }] }),
  /positive/
);

const tiny = solveEquilibrium({
  mode: 'constant',
  equation: 'A <-> B',
  values: [
    { formula: 'A', value: 1 },
    { formula: 'B', value: 1e-20 }
  ]
});
assert.ok(tiny.K > 0);
assert.ok(tiny.K < 1e-19);

const ice = solveEquilibrium({
  mode: 'ice',
  equation: 'H2(g) + I2(g) <-> 2 HI(g)',
  K: 50,
  initials: [
    { formula: 'H2', value: 1.0, unit: 'mol/L' },
    { formula: 'I2', value: 1.0, unit: 'mol/L' },
    { formula: 'HI', value: 0, unit: 'mol/L' }
  ]
});
assert.ok(ice.x > 0);
assert.ok(ice.table.every((row) => row.excluded || row.equilibrium >= 0));
assert.ok(relativeDifference(ice.KReconstructed, 50) < 1e-4);
for (const row of ice.table) {
  if (row.excluded) continue;
  const delta = row.equilibrium - row.initial;
  assert.ok(Math.abs(delta - row.nu * ice.x) < 1e-8);
}

const convert = solveEquilibrium({
  mode: 'constant',
  kind: 'kc',
  equation: 'N2(g) + 3 H2(g) <-> 2 NH3(g)',
  values: [
    { formula: 'N2', value: 1 },
    { formula: 'H2', value: 1 },
    { formula: 'NH3', value: 1 }
  ],
  convert: true,
  T: 298.15,
  TUnit: 'K'
});
assert.equal(convert.conversion.ok, true);
assert.equal(convert.conversion.deltaN, -2);

const noConvert = solveEquilibrium({
  mode: 'constant',
  equation: 'A <-> B',
  values: [
    { formula: 'A', value: 1 },
    { formula: 'B', value: 2 }
  ],
  convert: true,
  T: 298
});
assert.equal(noConvert.conversion.ok, false);

assert.throws(
  () => solveEquilibrium({ mode: 'ice', equation: 'A <-> B', K: 2, initials: [{ formula: 'A', value: 0 }, { formula: 'B', value: 0 }] }),
  /No physically valid|no_physical/
);

const paid = accessForUser({
  createdAt: new Date(Date.now() - 40 * 24 * 3600 * 1000).toISOString(),
  email: 'pro@atomurus.com',
  appMetadata: { atomurus_plan: 'paid', subscription_status: 'active' }
});
assert.equal(paid.features.equilibriumWorkbench, true);
assert.equal(paid.features.equilibriumSolver, true);
assert.equal(paid.features.reactionQuotient, true);
assert.equal(paid.features.iceTableSolver, true);

const free = accessForUser({
  createdAt: new Date(Date.now() - 40 * 24 * 3600 * 1000).toISOString(),
  email: 'free@atomurus.com'
});
assert.equal(free.features.equilibriumWorkbench, false);

console.log('test-equilibrium: ok');
