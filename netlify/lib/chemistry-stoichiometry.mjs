/**
 * Stoichiometry, limiting reagent, excess and yield on a balanced equation.
 * Server authority: never trusts client coefficients or molar masses.
 */

import { formatSig, molarMassOf } from './chemistry-calc.mjs';
import { balanceEquation } from './chemistry-reactions.mjs';
import { parseFormulaStrict } from './chemistry-formula-strict.mjs';
import {
  MASS_UNITS,
  SOLVER_VERSION,
  gramsToMass,
  massToGrams,
  molesFromGas,
  molesFromMass,
  molesFromSolution,
  requirePositiveNumber,
  solverError
} from './chemistry-units.mjs';

export const YIELD_OVER_100 =
  'Yield is above 100%. Check experimental inputs, sample purity or measurement values.';

function formulaKey(raw) {
  return parseFormulaStrict(raw).formula;
}

function findSpecies(species, raw) {
  const key = formulaKey(raw);
  const found = species.find((row) => row.formula === key);
  if (!found) throw solverError('target species is not in the balanced equation');
  return found;
}

function molarMassCached(cache, formula) {
  if (!cache[formula]) cache[formula] = molarMassOf(formula).molarMass;
  return cache[formula];
}

function quantityToMoles(entry, formula, mm) {
  const kind = String(entry.kind || entry.mode || '').trim() || inferKind(entry);
  if (kind === 'amount' || entry.unit === 'mol') {
    return {
      moles: requirePositiveNumber(entry.amount ?? entry.moles, 'amount'),
      kind: 'amount',
      unit: 'mol',
      amount: requirePositiveNumber(entry.amount ?? entry.moles, 'amount')
    };
  }
  if (kind === 'gas') {
    const moles = molesFromGas({
      volume: entry.volume ?? entry.amount,
      volUnit: entry.volUnit || entry.unit || 'L',
      P: entry.P,
      PUnit: entry.PUnit || 'atm',
      T: entry.T,
      TUnit: entry.TUnit || 'K'
    });
    return { moles, kind: 'gas', unit: entry.volUnit || entry.unit || 'L', amount: entry.volume ?? entry.amount };
  }
  if (kind === 'solution') {
    const moles = molesFromSolution(
      entry.concentration,
      entry.concUnit || 'mol/L',
      entry.volume ?? entry.amount,
      entry.volUnit || 'L'
    );
    return { moles, kind: 'solution', unit: entry.volUnit || 'L', amount: entry.volume ?? entry.amount };
  }
  const grams = massToGrams(entry.amount, entry.unit || 'g');
  return {
    moles: molesFromMass(grams, mm),
    kind: 'mass',
    unit: MASS_UNITS.includes(entry.unit) ? entry.unit : 'g',
    amount: requirePositiveNumber(entry.amount, 'amount'),
    grams
  };
}

function inferKind(entry) {
  if (entry.concentration != null) return 'solution';
  if (entry.P != null || entry.T != null) return 'gas';
  if (entry.unit === 'mol') return 'amount';
  if (entry.unit === 'L' || entry.unit === 'mL') return 'gas';
  return 'mass';
}

function pushStep(steps, title, body) {
  steps.push({ title, body });
}

export function solveStoichiometry(input = {}) {
  const balanced = balanceEquation(input.equation);
  const species = [...balanced.reactants, ...balanced.products];
  const masses = {};
  const given = Array.isArray(input.quantities) ? input.quantities : [];
  if (!given.length) throw solverError('at least one quantity is required');
  if (given.length > 12) throw solverError('too many quantities');

  const steps = [];
  pushStep(steps, 'Balance equation', balanced.balancedDisplay);

  const prepared = given.map((entry) => {
    const row = findSpecies(species, entry.formula);
    const mm = molarMassCached(masses, row.formula);
    const conv = quantityToMoles(entry, row.formula, mm);
    const extent = conv.moles / row.coefficient;
    if (conv.kind === 'mass') {
      pushStep(
        steps,
        'Convert given quantity to moles',
        `${formatSig(conv.amount, 4)} ${conv.unit} ${row.formula} ÷ ${formatSig(mm, 4)} g/mol = ${formatSig(conv.moles, 4)} mol ${row.formula}`
      );
    } else if (conv.kind === 'solution') {
      pushStep(
        steps,
        'Convert given quantity to moles',
        `n = C × V → ${formatSig(conv.moles, 4)} mol ${row.formula}`
      );
    } else if (conv.kind === 'gas') {
      pushStep(
        steps,
        'Convert given quantity to moles',
        `PV = nRT → ${formatSig(conv.moles, 4)} mol ${row.formula}`
      );
    } else {
      pushStep(steps, 'Convert given quantity to moles', `${formatSig(conv.moles, 4)} mol ${row.formula}`);
    }
    return { ...row, ...conv, extent, molarMass: mm };
  });

  const reactantGiven = prepared.filter((row) => row.role === 'reactant');
  if (!reactantGiven.length) throw solverError('give a quantity for at least one reactant');

  reactantGiven.forEach((row) => {
    pushStep(
      steps,
      'Apply stoichiometric ratio',
      `${formatSig(row.moles, 4)} mol ${row.formula} ÷ ${row.coefficient} = ${formatSig(row.extent, 4)} mol-equivalent`
    );
  });

  let limiting = reactantGiven[0];
  reactantGiven.forEach((row) => {
    if (row.extent < limiting.extent) limiting = row;
  });
  const extent = limiting.extent;
  const limitingReagent = reactantGiven.length > 1 ? limiting.formula : limiting.formula;
  pushStep(
    steps,
    'Identify limiting reagent',
    reactantGiven.length > 1
      ? `Smallest reaction extent is ${formatSig(extent, 4)} mol-equivalent (${limiting.formula}).`
      : `Reaction extent is ${formatSig(extent, 4)} mol-equivalent from ${limiting.formula}.`
  );

  const targetSpec = input.target && input.target.formula
    ? findSpecies(species, input.target.formula)
    : balanced.products[0];
  if (!targetSpec) throw solverError('choose a target species');
  const targetMoles = extent * targetSpec.coefficient;
  const targetMm = molarMassCached(masses, targetSpec.formula);
  const targetGrams = targetMoles * targetMm;
  const outUnit = String((input.target && input.target.unit) || 'g');
  let targetAmount = targetGrams;
  let targetUnit = 'g';
  if (outUnit === 'mol') {
    targetAmount = targetMoles;
    targetUnit = 'mol';
  } else if (MASS_UNITS.includes(outUnit)) {
    targetAmount = gramsToMass(targetGrams, outUnit);
    targetUnit = outUnit;
  }
  pushStep(
    steps,
    'Calculate target moles',
    `${formatSig(extent, 4)} × ${targetSpec.coefficient} = ${formatSig(targetMoles, 4)} mol ${targetSpec.formula}`
  );
  pushStep(
    steps,
    'Convert target moles to requested unit',
    `${formatSig(targetMoles, 4)} mol × ${formatSig(targetMm, 4)} g/mol = ${formatSig(targetGrams, 4)} g ${targetSpec.formula}`
  );

  const excess = reactantGiven
    .filter((row) => row.formula !== limiting.formula)
    .map((row) => {
      const consumed = extent * row.coefficient;
      const remainingMoles = Math.max(0, row.moles - consumed);
      const remainingGrams = remainingMoles * row.molarMass;
      return {
        formula: row.formula,
        remainingMoles,
        remainingGrams,
        remainingDisplay: `${formatSig(remainingGrams, 4)} g`,
        unit: 'g'
      };
    });

  let percentYield = null;
  let yieldNote = null;
  const actual = input.actualYield;
  if (actual && (actual.amount != null && actual.amount !== '')) {
    const actualGrams = MASS_UNITS.includes(actual.unit)
      ? massToGrams(actual.amount, actual.unit)
      : actual.unit === 'mol'
        ? requirePositiveNumber(actual.amount, 'actual yield') * targetMm
        : massToGrams(actual.amount, 'g');
    if (targetGrams > 0) {
      percentYield = (actualGrams / targetGrams) * 100;
      if (percentYield > 100) yieldNote = YIELD_OVER_100;
    }
  }

  return {
    ok: true,
    solverVersion: SOLVER_VERSION,
    equation: balanced.input,
    balanced: balanced.balanced,
    balancedDisplay: balanced.balancedDisplay,
    limitingReagent,
    reactionExtent: extent,
    reactionExtentDisplay: `${formatSig(extent, 4)} mol-equivalent`,
    target: {
      formula: targetSpec.formula,
      moles: targetMoles,
      grams: targetGrams,
      amount: targetAmount,
      unit: targetUnit,
      molarMass: targetMm
    },
    theoreticalYield: {
      formula: targetSpec.formula,
      moles: targetMoles,
      grams: targetGrams
    },
    excess,
    percentYield,
    yieldNote,
    steps
  };
}
