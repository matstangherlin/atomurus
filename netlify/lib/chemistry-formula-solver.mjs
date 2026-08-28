/**
 * Empirical and molecular formula solver from composition or formula mass.
 */

import { ATOMIC_WEIGHTS, formatSig, molarMassOf } from './chemistry-calc.mjs';
import { formatFormulaDisplay, parseFormulaStrict } from './chemistry-formula-strict.mjs';
import {
  PERCENT_TOTAL_MAX,
  PERCENT_TOTAL_MIN,
  SOLVER_VERSION,
  requirePositiveNumber,
  solverError
} from './chemistry-units.mjs';

export const EMPIRICAL_MAX_DENOMINATOR = 12;
export const RATIO_TOLERANCE = 0.08;
export const MOLECULAR_INTEGER_TOLERANCE = 0.08;

export const UNCLEAR_RATIO =
  'The composition does not produce a clear small-integer ratio. Check the input values.';
export const BAD_PERCENT_TOTAL = 'Percentages must add up to about 100%.';
export const BAD_MOLECULAR_MULTIPLE =
  'The supplied molar mass is not close to an integer multiple of the empirical formula mass.';
export const DUPLICATE_ELEMENT = 'Each element can only be entered once.';

const FORMULA_KINDS = new Set(['empirical', 'molecular', 'percent', 'mass']);

function symbolOf(entry) {
  const sym = String(entry.symbol || entry.element || '').trim();
  if (!Object.prototype.hasOwnProperty.call(ATOMIC_WEIGHTS, sym)) {
    throw solverError(`unknown element: ${sym || '(empty)'}`, 400, 'unknown_element');
  }
  return sym;
}

function nearestInteger(n) {
  return Math.round(n);
}

function isNearInteger(n, tol = RATIO_TOLERANCE) {
  return Math.abs(n - nearestInteger(n)) <= tol && nearestInteger(n) >= 1;
}

function fitIntegerRatio(ratios) {
  for (let k = 1; k <= EMPIRICAL_MAX_DENOMINATOR; k += 1) {
    const scaled = ratios.map((r) => r * k);
    if (scaled.every((n) => isNearInteger(n))) {
      return {
        multiplier: k,
        counts: scaled.map((n) => nearestInteger(n))
      };
    }
  }
  return null;
}

function formulaFromCounts(symbols, counts) {
  return symbols.map((sym, i) => (counts[i] === 1 ? sym : `${sym}${counts[i]}`)).join('');
}

function resolveCompositionMode(input, rows) {
  const requestedMode = String(input.mode || '').trim();
  if (requestedMode === 'percent' || requestedMode === 'mass') return requestedMode;
  if (requestedMode && requestedMode !== 'empirical') {
    throw solverError('mode is not supported', 400, 'invalid_mode');
  }
  const unit = String(rows[0]?.unit || '');
  return unit === 'percent' || unit === '%' ? 'percent' : 'mass';
}

export function solveEmpiricalFormula(input = {}) {
  const rows = Array.isArray(input.composition) ? input.composition : [];
  if (rows.length < 1) throw solverError('at least one element is required');
  if (rows.length > 12) throw solverError('too many elements');

  const mode = resolveCompositionMode(input, rows);
  const parsed = rows.map((row) => ({
    symbol: symbolOf(row),
    value: requirePositiveNumber(row.value ?? row.amount ?? row.percent ?? row.mass, row.symbol || 'value'),
    unit: String(row.unit || (mode === 'percent' ? 'percent' : 'g'))
  }));

  const seen = new Set();
  parsed.forEach((row) => {
    if (seen.has(row.symbol)) {
      throw solverError(DUPLICATE_ELEMENT, 400, 'duplicate_element');
    }
    seen.add(row.symbol);
  });

  const steps = [];
  let masses;
  if (mode === 'percent') {
    const total = parsed.reduce((sum, row) => sum + row.value, 0);
    if (total < PERCENT_TOTAL_MIN || total > PERCENT_TOTAL_MAX) {
      throw solverError(BAD_PERCENT_TOTAL);
    }
    masses = parsed.map((row) => ({
      symbol: row.symbol,
      mass: (row.value / total) * 100
    }));
    steps.push({
      title: 'Normalize percentages',
      body: Math.abs(total - 100) <= 1e-9
        ? 'Percentages total 100%. Treat as mass in a 100 g sample.'
        : `Percentages total ${formatSig(total, 4)}%. Values were normalized to 100% before calculating.`
    });
  } else {
    masses = parsed.map((row) => ({ symbol: row.symbol, mass: row.value }));
  }

  const moles = masses.map((row) => {
    const aw = ATOMIC_WEIGHTS[row.symbol];
    const n = row.mass / aw;
    steps.push({
      title: 'Divide by atomic weight',
      body: `${formatSig(row.mass, 4)} g ${row.symbol} ÷ ${formatSig(aw, 4)} g/mol = ${formatSig(n, 4)} mol`
    });
    return { symbol: row.symbol, moles: n, atomicWeight: aw };
  });

  const smallest = Math.min(...moles.map((row) => row.moles));
  if (!(smallest > 0)) throw solverError(UNCLEAR_RATIO);
  const ratios = moles.map((row) => row.moles / smallest);
  steps.push({
    title: 'Divide by smallest',
    body: ratios.map((r, i) => `${moles[i].symbol} ${formatSig(r, 4)}`).join(' · ')
  });

  const fitted = fitIntegerRatio(ratios);
  if (!fitted) throw solverError(UNCLEAR_RATIO);

  const formula = formulaFromCounts(moles.map((row) => row.symbol), fitted.counts);
  const mm = molarMassOf(formula);
  steps.push({
    title: 'Smallest integer ratio',
    body: `× ${fitted.multiplier} → ${formatFormulaDisplay(formula)}`
  });

  return {
    ok: true,
    solverVersion: SOLVER_VERSION,
    empiricalFormula: formula,
    empiricalFormulaDisplay: formatFormulaDisplay(formula),
    molarMass: mm.molarMass,
    counts: Object.fromEntries(moles.map((row, i) => [row.symbol, fitted.counts[i]])),
    steps
  };
}

export function solveMolecularFormula(input = {}) {
  const empirical = String(input.empiricalFormula || input.formula || '').trim();
  if (!empirical) throw solverError('empirical formula is required');
  parseFormulaStrict(empirical);
  const targetMass = requirePositiveNumber(input.molarMass ?? input.mass, 'molar mass');
  const emp = molarMassOf(empirical);
  const n = targetMass / emp.molarMass;
  const nearest = Math.round(n);
  if (nearest < 1 || Math.abs(n - nearest) > MOLECULAR_INTEGER_TOLERANCE) {
    throw solverError(BAD_MOLECULAR_MULTIPLE);
  }
  const parsed = parseFormulaStrict(empirical);
  const counts = {};
  Object.keys(parsed.counts).forEach((el) => {
    counts[el] = parsed.counts[el] * nearest;
  });
  const formula = Object.keys(counts).map((el) => (counts[el] === 1 ? el : `${el}${counts[el]}`)).join('');
  const mol = molarMassOf(formula);
  return {
    ok: true,
    solverVersion: SOLVER_VERSION,
    empiricalFormula: parsed.formula,
    empiricalMass: emp.molarMass,
    multiple: nearest,
    multipleRaw: n,
    molecularFormula: formula,
    molecularFormulaDisplay: formatFormulaDisplay(formula),
    empiricalFormulaDisplay: formatFormulaDisplay(parsed.formula),
    molarMass: mol.molarMass,
    steps: [
      {
        title: 'Empirical formula mass',
        body: `${formatFormulaDisplay(parsed.formula)} = ${formatSig(emp.molarMass, 4)} g/mol`
      },
      {
        title: 'Find multiple',
        body: `${formatSig(targetMass, 4)} ÷ ${formatSig(emp.molarMass, 4)} = ${formatSig(n, 4)} → ${nearest}`
      },
      {
        title: 'Molecular formula',
        body: formatFormulaDisplay(formula)
      }
    ]
  };
}

export function solveFormula(input = {}) {
  const kind = String(input.kind || input.mode || '').trim();
  if (!kind) return solveEmpiricalFormula(input);
  if (!FORMULA_KINDS.has(kind)) {
    throw solverError('mode is not supported', 400, 'invalid_mode');
  }
  if (kind === 'molecular') return solveMolecularFormula(input);
  return solveEmpiricalFormula(input);
}
