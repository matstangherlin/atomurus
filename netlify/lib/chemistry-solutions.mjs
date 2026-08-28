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

function soluteMass(formula) {
  parseFormulaStrict(formula);
  return molarMassOf(formula);
}

export function prepareFromSolid(input = {}) {
  const formula = String(input.formula || input.solute || '').trim();
  if (!formula) throw solverError('solute formula is required');
  const mm = soluteMass(formula);
  const concUnit = CONC_UNITS.includes(input.concUnit) ? input.concUnit : 'mol/L';
  const volUnit = input.volUnit === 'mL' ? 'mL' : 'L';
  const massUnit = MASS_UNITS.includes(input.massUnit) ? input.massUnit : 'g';
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
    const concUnit = CONC_UNITS.includes(row.concUnit) ? row.concUnit : 'mol/L';
    const volUnit = row.volUnit === 'mL' ? 'mL' : 'L';
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
  const outUnit = CONC_UNITS.includes(input.concUnit) ? input.concUnit : 'mol/L';
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
  const mode = String(input.mode || input.kind || 'prepare').trim();
  if (mode === 'mix') return mixSolutions(input);
  return prepareFromSolid(input);
}
