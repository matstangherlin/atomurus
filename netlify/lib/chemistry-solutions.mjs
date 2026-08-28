/**
 * Solution Builder: prepare from solid and mix same-solute solutions.
 * Does not emit experimental procedures or safety instructions.
 */

import { formatSig, molarMassOf } from './chemistry-calc.mjs';
import { parseFormulaStrict } from './chemistry-formula-strict.mjs';
import {
  CONC_UNITS,
  MASS_UNITS,
  SOLVER_VERSION,
  concToMolPerL,
  gramsToMass,
  molPerLToConc,
  volumeToLiters,
  solverError
} from './chemistry-units.mjs';

export const ADDITIVE_VOLUMES = 'Calculation assumes additive solution volumes.';
export const CALCULATION_ONLY =
  'Calculation only. Follow appropriate laboratory procedures and safety information for the substances involved.';
/** V1 keeps concentration strictly positive; 0 mol/L is rejected as not a useful prepare/mix input. */

function soluteMass(formula) {
  parseFormulaStrict(formula);
  return molarMassOf(formula);
}

export function prepareFromSolid(input = {}) {
  const formula = String(input.formula || input.solute || '').trim();
  if (!formula) throw solverError('solute formula is required');
  const mm = soluteMass(formula);
  const concUnit = input.concUnit == null || input.concUnit === ''
    ? 'mol/L'
    : (CONC_UNITS.includes(input.concUnit) ? input.concUnit : null);
  if (!concUnit) throw solverError('concentration unit is not supported');
  const volUnit = input.volUnit == null || input.volUnit === ''
    ? 'L'
    : (input.volUnit === 'mL' || input.volUnit === 'L' ? input.volUnit : null);
  if (!volUnit) throw solverError('volume unit is not supported');
  const massUnit = input.massUnit == null || input.massUnit === ''
    ? 'g'
    : (MASS_UNITS.includes(input.massUnit) ? input.massUnit : null);
  if (!massUnit) throw solverError('mass unit is not supported');
  const molPerL = concToMolPerL(input.concentration ?? input.M, concUnit);
  const liters = volumeToLiters(input.volume ?? input.V, volUnit);
  const moles = molPerL * liters;
  const grams = moles * mm.molarMass;
  const mass = gramsToMass(grams, massUnit);
  return {
    ok: true,
    solverVersion: SOLVER_VERSION,
    mode: 'prepare',
    formula: mm.formula,
    molarMass: mm.molarMass,
    moles,
    grams,
    mass,
    massUnit,
    massDisplay: `${formatSig(mass, 4)} ${massUnit}`,
    note: CALCULATION_ONLY,
    steps: [
      {
        title: 'Amount of solute',
        body: `${formatSig(molPerL, 4)} mol/L × ${formatSig(liters, 4)} L = ${formatSig(moles, 4)} mol`
      },
      {
        title: 'Mass',
        body: `${formatSig(moles, 4)} mol × ${formatSig(mm.molarMass, 4)} g/mol = ${formatSig(grams, 4)} g ${mm.formula}`
      }
    ]
  };
}

export function mixSolutions(input = {}) {
  const formula = String(input.formula || input.solute || '').trim();
  if (formula) parseFormulaStrict(formula);
  const parts = Array.isArray(input.solutions) ? input.solutions : [];
  if (parts.length < 2) throw solverError('at least two solutions are required');
  if (parts.length > 8) throw solverError('too many solutions');
  let moleSum = 0;
  let volSum = 0;
  const steps = [];
  parts.forEach((row, index) => {
    const concUnit = row.concUnit == null || row.concUnit === ''
      ? 'mol/L'
      : (CONC_UNITS.includes(row.concUnit) ? row.concUnit : null);
    if (!concUnit) throw solverError('concentration unit is not supported');
    const volUnit = row.volUnit == null || row.volUnit === ''
      ? 'L'
      : (row.volUnit === 'mL' || row.volUnit === 'L' ? row.volUnit : null);
    if (!volUnit) throw solverError('volume unit is not supported');
    const c = concToMolPerL(row.concentration ?? row.M, concUnit);
    const v = volumeToLiters(row.volume ?? row.V, volUnit);
    moleSum += c * v;
    volSum += v;
    steps.push({
      title: `Solution ${index + 1}`,
      body: `${formatSig(c, 4)} mol/L × ${formatSig(v, 4)} L = ${formatSig(c * v, 4)} mol`
    });
  });
  if (!(volSum > 0)) throw solverError('total volume must be positive');
  const finalMolPerL = moleSum / volSum;
  const outUnit = input.concUnit == null || input.concUnit === ''
    ? 'mol/L'
    : (CONC_UNITS.includes(input.concUnit) ? input.concUnit : null);
  if (!outUnit) throw solverError('concentration unit is not supported');
  return {
    ok: true,
    solverVersion: SOLVER_VERSION,
    mode: 'mix',
    formula: formula || null,
    moles: moleSum,
    volumeL: volSum,
    concentration: molPerLToConc(finalMolPerL, outUnit),
    concUnit: outUnit,
    concentrationDisplay: `${formatSig(molPerLToConc(finalMolPerL, outUnit), 4)} ${outUnit}`,
    assumption: ADDITIVE_VOLUMES,
    note: CALCULATION_ONLY,
    steps: steps.concat([
      {
        title: 'Final concentration',
        body: `${formatSig(moleSum, 4)} mol ÷ ${formatSig(volSum, 4)} L = ${formatSig(finalMolPerL, 4)} mol/L`
      },
      { title: 'Assumption', body: ADDITIVE_VOLUMES }
    ])
  };
}

export function solveSolution(input = {}) {
  const mode = String(input.mode || input.kind || '').trim();
  if (!mode || mode === 'prepare') return prepareFromSolid(input);
  if (mode === 'mix') return mixSolutions(input);
  throw solverError('mode is not supported', 400, 'invalid_mode');
}
