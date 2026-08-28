/**
 * Stoichiometry, limiting reagent, excess and yield on a balanced equation.
 * Server authority: never trusts client coefficients or molar masses.
 *
 * Limiting-reagent analysis is complete only when every reactant has a quantity.
 * A single given reactant is a calculation basis, not a limiting reagent.
 */

import { formatSig, molarMassOf } from './chemistry-calc.mjs';
import { balanceEquation } from './chemistry-reactions.mjs';
import { formatFormulaDisplay, parseFormulaStrict } from './chemistry-formula-strict.mjs';
import {
  MASS_UNITS,
  SOLVER_ABS_ZERO,
  SOLVER_EPSILON,
  SOLVER_VERSION,
  gramsToMass,
  massToGrams,
  molesFromGas,
  molesFromMass,
  molesFromSolution,
  requireNonNegativeNumber,
  requirePositiveNumber,
  solverError
} from './chemistry-units.mjs';

export const YIELD_OVER_100 =
  'Yield is above 100%. Check experimental inputs, sample purity or measurement values.';
export const EXCESS_ASSUMPTION =
  'Other reactants are assumed to be available in excess.';
export const STOICHIOMETRIC_MIXTURE =
  'The specified reactants are present in the balanced stoichiometric proportion.';

function formulaKey(raw) {
  return parseFormulaStrict(raw).formula;
}

function displayOf(formula) {
  return formatFormulaDisplay(formula);
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

function extentsNearlyEqual(a, b) {
  const scale = Math.max(Math.abs(a), Math.abs(b), 1);
  return Math.abs(a - b) <= SOLVER_EPSILON * scale;
}

export function allReactantsSpecified(reactantFormulas, specifiedFormulas) {
  const specified = new Set(specifiedFormulas);
  return reactantFormulas.every((formula) => specified.has(formula));
}

function clampNonNegative(value) {
  if (!Number.isFinite(value)) return 0;
  if (value <= SOLVER_ABS_ZERO) return 0;
  return Math.max(0, value);
}

function inferKind(entry) {
  if (entry.concentration != null && entry.concentration !== '') return 'solution';
  if (entry.P != null || entry.T != null) return 'gas';
  if (entry.unit === 'mol') return 'amount';
  if (entry.unit === 'L' || entry.unit === 'mL') return 'gas';
  return 'mass';
}

function quantityToMoles(entry, mm) {
  const kindRaw = String(entry.kind || entry.mode || '').trim();
  const kind = kindRaw || inferKind(entry);
  if (kindRaw && !['amount', 'mass', 'gas', 'solution', 'mol'].includes(kindRaw)) {
    throw solverError('mode is not supported', 400, 'invalid_mode');
  }
  if (kind === 'amount' || kind === 'mol' || entry.unit === 'mol') {
    if (entry.unit != null && String(entry.unit).trim() && entry.unit !== 'mol') {
      throw solverError('amount unit is not supported');
    }
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
      volUnit: entry.volUnit || entry.unit,
      P: entry.P,
      PUnit: entry.PUnit,
      T: entry.T,
      TUnit: entry.TUnit
    });
    return { moles, kind: 'gas', unit: entry.volUnit || entry.unit || 'L', amount: entry.volume ?? entry.amount };
  }
  if (kind === 'solution') {
    const moles = molesFromSolution(
      entry.concentration,
      entry.concUnit,
      entry.volume ?? entry.amount,
      entry.volUnit
    );
    return { moles, kind: 'solution', unit: entry.volUnit || 'L', amount: entry.volume ?? entry.amount };
  }
  const unit = entry.unit == null || entry.unit === '' ? 'g' : entry.unit;
  const grams = massToGrams(entry.amount, unit);
  return {
    moles: molesFromMass(grams, mm),
    kind: 'mass',
    unit,
    amount: requirePositiveNumber(entry.amount, 'amount'),
    grams
  };
}

function resolveTargetUnit(raw) {
  if (raw == null || raw === '') return 'g';
  const u = String(raw).trim();
  if (u === 'mol') return 'mol';
  if (MASS_UNITS.includes(u)) return u;
  throw solverError('target unit is not supported');
}

function actualToGrams(actual, targetMm) {
  const amount = requireNonNegativeNumber(actual.amount, 'actual yield');
  const unit = actual.unit == null || actual.unit === '' ? 'g' : String(actual.unit).trim();
  if (unit === 'mol') return amount * targetMm;
  return massToGrams(amount, unit, { allowZero: true });
}

function pushStep(steps, title, body) {
  steps.push({ title, body });
}

function analyzeLimiting(balanced, reactantGiven) {
  const reactantFormulas = balanced.reactants.map((row) => row.formula);
  const specified = reactantGiven.map((row) => row.formula);
  const unspecified = reactantFormulas.filter((formula) => !specified.includes(formula));
  const complete = allReactantsSpecified(reactantFormulas, specified);

  let minExtent = reactantGiven[0].extent;
  reactantGiven.forEach((row) => {
    if (row.extent < minExtent) minExtent = row.extent;
  });
  const tied = reactantGiven.filter((row) => extentsNearlyEqual(row.extent, minExtent));
  const constraint = tied[0];
  const allTied = tied.length === reactantGiven.length && reactantGiven.length > 1;

  const calculationBasis = complete
    ? null
    : {
      formula: constraint.formula,
      formulaDisplay: displayOf(constraint.formula),
      assumption: EXCESS_ASSUMPTION
    };

  return {
    extent: minExtent,
    constraint,
    tied,
    unspecifiedReactants: unspecified,
    limitingAnalysisComplete: complete,
    stoichiometricMixture: complete && allTied,
    limitingReagent: complete && !allTied && tied.length === 1 ? constraint.formula : null,
    calculationBasis,
    constraintAmongSpecified: complete ? null : constraint.formula,
    specifiedReactantCount: reactantGiven.length
  };
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

  const seenGiven = new Set();
  const prepared = given.map((entry) => {
    const row = findSpecies(species, entry.formula);
    if (row.role !== 'reactant') {
      throw solverError('given quantities must refer to reactants', 400, 'invalid_given_species');
    }
    if (seenGiven.has(row.formula)) {
      throw solverError('the same given species was entered more than once', 400, 'duplicate_given_species');
    }
    seenGiven.add(row.formula);
    const mm = molarMassCached(masses, row.formula);
    const conv = quantityToMoles(entry, mm);
    const extent = conv.moles / row.coefficient;
    const shown = displayOf(row.formula);
    if (conv.kind === 'mass') {
      pushStep(
        steps,
        'Convert given quantity to moles',
        `${formatSig(conv.amount, 4)} ${conv.unit} ${shown} ÷ ${formatSig(mm, 4)} g/mol = ${formatSig(conv.moles, 4)} mol ${shown}`
      );
    } else if (conv.kind === 'solution') {
      pushStep(
        steps,
        'Convert given quantity to moles',
        `n = C × V → ${formatSig(conv.moles, 4)} mol ${shown}`
      );
    } else if (conv.kind === 'gas') {
      pushStep(
        steps,
        'Convert given quantity to moles',
        `PV = nRT → ${formatSig(conv.moles, 4)} mol ${shown}`
      );
    } else {
      pushStep(steps, 'Convert given quantity to moles', `${formatSig(conv.moles, 4)} mol ${shown}`);
    }
    return { ...row, ...conv, extent, molarMass: mm };
  });

  const reactantGiven = prepared.filter((row) => row.role === 'reactant');
  if (!reactantGiven.length) throw solverError('give a quantity for at least one reactant');

  reactantGiven.forEach((row) => {
    pushStep(
      steps,
      'Apply stoichiometric ratio',
      `${formatSig(row.moles, 4)} mol ${displayOf(row.formula)} ÷ ${row.coefficient} = ${formatSig(row.extent, 4)} reaction extent`
    );
  });

  const analysis = analyzeLimiting(balanced, reactantGiven);
  const extent = analysis.extent;
  const limiting = analysis.constraint;

  if (analysis.limitingAnalysisComplete && analysis.stoichiometricMixture) {
    pushStep(steps, 'Compare stoichiometric proportions', STOICHIOMETRIC_MIXTURE);
  } else if (analysis.limitingAnalysisComplete) {
    pushStep(
      steps,
      'Identify limiting reagent',
      `Smallest reaction extent is ${formatSig(extent, 4)} (${displayOf(limiting.formula)}).`
    );
  } else if (reactantGiven.length === 1) {
    pushStep(
      steps,
      'Set calculation basis',
      `${formatSig(reactantGiven[0].moles, 4)} mol ${displayOf(reactantGiven[0].formula)} corresponds to a reaction extent of ${formatSig(extent, 4)}.\n${EXCESS_ASSUMPTION}`
    );
  } else {
    const missing = analysis.unspecifiedReactants.map(displayOf).join(', ');
    pushStep(
      steps,
      'Compare specified reactants',
      `Among the specified reactants, ${displayOf(limiting.formula)} provides the smallest reaction extent.\n${missing} was not specified and is assumed to be available in excess.`
    );
  }

  const targetSpec = input.target && input.target.formula
    ? findSpecies(species, input.target.formula)
    : balanced.products[0];
  if (!targetSpec) throw solverError('choose a target species');
  if (targetSpec.role !== 'product') {
    throw solverError('target must be a product in the reaction', 400, 'invalid_target_species');
  }
  const targetMoles = extent * targetSpec.coefficient;
  const targetMm = molarMassCached(masses, targetSpec.formula);
  const targetGrams = targetMoles * targetMm;
  const outUnit = resolveTargetUnit(input.target && input.target.unit);
  let targetAmount = targetGrams;
  let targetUnit = 'g';
  if (outUnit === 'mol') {
    targetAmount = targetMoles;
    targetUnit = 'mol';
  } else {
    targetAmount = gramsToMass(targetGrams, outUnit);
    targetUnit = outUnit;
  }
  pushStep(
    steps,
    'Calculate target moles',
    `${formatSig(extent, 4)} × ${targetSpec.coefficient} = ${formatSig(targetMoles, 4)} mol ${displayOf(targetSpec.formula)}`
  );
  pushStep(
    steps,
    'Convert target moles to requested unit',
    `${formatSig(targetMoles, 4)} mol × ${formatSig(targetMm, 4)} g/mol = ${formatSig(targetGrams, 4)} g ${displayOf(targetSpec.formula)}`
  );

  const excess = reactantGiven
    .filter((row) => !extentsNearlyEqual(row.extent, extent) || analysis.stoichiometricMixture)
    .map((row) => {
      const consumed = extent * row.coefficient;
      const remainingMoles = clampNonNegative(row.moles - consumed);
      const remainingGrams = clampNonNegative(remainingMoles * row.molarMass);
      return {
        formula: row.formula,
        formulaDisplay: displayOf(row.formula),
        remainingMoles,
        remainingGrams,
        remainingDisplay: `${formatSig(remainingGrams, 4)} g`,
        unit: 'g'
      };
    })
    .filter((row) => analysis.stoichiometricMixture || row.remainingGrams > 0 || row.remainingMoles > 0);

  if (analysis.stoichiometricMixture) {
    excess.forEach((row) => {
      row.remainingMoles = 0;
      row.remainingGrams = 0;
      row.remainingDisplay = '0 g';
    });
  }

  let percentYield = null;
  let yieldNote = null;
  const actual = input.actualYield;
  if (actual && (actual.amount != null && actual.amount !== '')) {
    const actualGrams = actualToGrams(actual, targetMm);
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
    limitingReagent: analysis.limitingReagent,
    limitingReagentDisplay: analysis.limitingReagent ? displayOf(analysis.limitingReagent) : null,
    limitingAnalysisComplete: analysis.limitingAnalysisComplete,
    stoichiometricMixture: analysis.stoichiometricMixture,
    calculationBasis: analysis.calculationBasis,
    constraintAmongSpecified: analysis.constraintAmongSpecified,
    unspecifiedReactants: analysis.unspecifiedReactants,
    unspecifiedReactantsDisplay: analysis.unspecifiedReactants.map(displayOf),
    specifiedReactantCount: analysis.specifiedReactantCount,
    reactionExtent: extent,
    reactionExtentDisplay: formatSig(extent, 4),
    target: {
      formula: targetSpec.formula,
      formulaDisplay: displayOf(targetSpec.formula),
      moles: targetMoles,
      grams: targetGrams,
      amount: targetAmount,
      unit: targetUnit,
      amountDisplay: `${formatSig(targetAmount, 4)} ${targetUnit}`,
      molarMass: targetMm
    },
    theoreticalYield: {
      formula: targetSpec.formula,
      formulaDisplay: displayOf(targetSpec.formula),
      moles: targetMoles,
      grams: targetGrams,
      molesDisplay: `${formatSig(targetMoles, 4)} mol`,
      gramsDisplay: `${formatSig(targetGrams, 4)} g`
    },
    excess,
    percentYield,
    percentYieldDisplay: percentYield == null ? null : `${formatSig(percentYield, 4)}%`,
    yieldNote,
    steps
  };
}
