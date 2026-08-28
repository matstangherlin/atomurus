/**
 * Shared unit allowlists and conversions for Chemistry Solver.
 * Mass base: g. Volume base: L. Amount: mol. Concentration: mol/L.
 */

import { calcError, GAS_R, solveIdealGas } from './chemistry-calc.mjs';

export const SOLVER_VERSION = 1;

export const MASS_UNITS = Object.freeze(['g', 'mg', 'kg']);
export const AMOUNT_UNITS = Object.freeze(['mol']);
export const VOLUME_UNITS = Object.freeze(['L', 'mL']);
export const PRESSURE_UNITS = Object.freeze(['atm', 'kPa', 'Pa']);
export const TEMP_UNITS = Object.freeze(['K', 'C']);
export const CONC_UNITS = Object.freeze(['mol/L', 'mmol/L']);

export const NUMBER_ABS_MAX = 1e12;
export const PERCENT_TOTAL_MIN = 99;
export const PERCENT_TOTAL_MAX = 101;

export function solverError(message, status = 400, code = 'invalid_request') {
  return calcError(message, status, code);
}

export function requireFiniteNumber(value, field) {
  const n = typeof value === 'number' ? value : Number(value);
  if (!Number.isFinite(n) || Number.isNaN(n)) {
    throw solverError(`${field} must be a finite number`);
  }
  if (Math.abs(n) > NUMBER_ABS_MAX) {
    throw solverError(`${field} is outside the allowed range`);
  }
  return n;
}

export function requirePositiveNumber(value, field) {
  const n = requireFiniteNumber(value, field);
  if (n <= 0) throw solverError(`${field} must be a positive number`);
  return n;
}

export function allowUnit(unit, allowed, field) {
  const value = String(unit || '').trim();
  if (!allowed.includes(value)) {
    throw solverError(`${field} unit is not supported`);
  }
  return value;
}

export function massToGrams(value, unit) {
  const n = requirePositiveNumber(value, 'mass');
  const u = allowUnit(unit, MASS_UNITS, 'mass');
  if (u === 'mg') return n / 1000;
  if (u === 'kg') return n * 1000;
  return n;
}

export function gramsToMass(grams, unit) {
  const u = allowUnit(unit, MASS_UNITS, 'mass');
  if (u === 'mg') return grams * 1000;
  if (u === 'kg') return grams / 1000;
  return grams;
}

export function volumeToLiters(value, unit) {
  const n = requirePositiveNumber(value, 'volume');
  const u = allowUnit(unit, VOLUME_UNITS, 'volume');
  if (u === 'mL') return n / 1000;
  return n;
}

export function litersToVolume(liters, unit) {
  const u = allowUnit(unit, VOLUME_UNITS, 'volume');
  if (u === 'mL') return liters * 1000;
  return liters;
}

export function concToMolPerL(value, unit) {
  const n = requirePositiveNumber(value, 'concentration');
  const u = allowUnit(unit, CONC_UNITS, 'concentration');
  if (u === 'mmol/L') return n / 1000;
  return n;
}

export function molPerLToConc(molPerL, unit) {
  const u = allowUnit(unit, CONC_UNITS, 'concentration');
  if (u === 'mmol/L') return molPerL * 1000;
  return molPerL;
}

export function molesFromMass(grams, molarMass) {
  const mm = requirePositiveNumber(molarMass, 'molar mass');
  return requirePositiveNumber(grams, 'mass') / mm;
}

export function molesFromSolution(concentration, concUnit, volume, volUnit) {
  return concToMolPerL(concentration, concUnit) * volumeToLiters(volume, volUnit);
}

export function molesFromGas({ amount, volume, volUnit, P, PUnit, T, TUnit }) {
  if (amount != null && amount !== '') {
    allowUnit('mol', AMOUNT_UNITS, 'amount');
    return requirePositiveNumber(amount, 'amount');
  }
  const gas = solveIdealGas({
    solve: 'n',
    P,
    V: volume,
    T,
    PUnit: PUnit || 'atm',
    VUnit: volUnit || 'L',
    TUnit: TUnit || 'K'
  });
  return requirePositiveNumber(gas.solved, 'gas amount');
}

export { GAS_R };
