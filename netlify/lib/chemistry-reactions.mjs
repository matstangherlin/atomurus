/**
 * Exact chemical equation balancer.
 * Builds an element×species matrix and solves A x = 0 over rationals,
 * then scales to the smallest positive integers.
 */

import { calcError } from './chemistry-calc.mjs';
import { SOLVER_VERSION } from './chemistry-units.mjs';
import {
  IONIC_UNAVAILABLE,
  MAX_INPUT_COEFFICIENT,
  countsEqual,
  formatFormulaDisplay,
  looksIonic,
  mergeCounts,
  parseBoundedInt,
  parseFormulaStrict
} from './chemistry-formula-strict.mjs';

export const REACTION_LIMITS = Object.freeze({
  chars: 1000,
  species: 12,
  elements: 30,
  coefficient: 2000
});

function gcdBig(a, b) {
  let x = a < 0n ? -a : a;
  let y = b < 0n ? -b : b;
  while (y) {
    const t = x % y;
    x = y;
    y = t;
  }
  return x || 1n;
}

function lcmBig(a, b) {
  return (a / gcdBig(a, b)) * b;
}

function frac(n, d = 1n) {
  if (typeof n === 'number') n = BigInt(n);
  if (typeof d === 'number') d = BigInt(d);
  if (d === 0n) throw calcError('internal division by zero', 500, 'solver_error');
  if (d < 0n) {
    n = -n;
    d = -d;
  }
  const g = gcdBig(n, d);
  return { n: n / g, d: d / g };
}

function fAdd(a, b) {
  return frac(a.n * b.d + b.n * a.d, a.d * b.d);
}

function fSub(a, b) {
  return frac(a.n * b.d - b.n * a.d, a.d * b.d);
}

function fMul(a, b) {
  return frac(a.n * b.n, a.d * b.d);
}

function fDiv(a, b) {
  if (b.n === 0n) throw calcError('internal division by zero', 500, 'solver_error');
  return frac(a.n * b.d, a.d * b.n);
}

function fIsZero(a) {
  return a.n === 0n;
}

function fNeg(a) {
  return frac(-a.n, a.d);
}

function cloneMatrix(A) {
  return A.map((row) => row.map((cell) => ({ n: cell.n, d: cell.d })));
}

function parseSpeciesToken(token) {
  const text = String(token || '').trim();
  if (!text) throw calcError('empty species in equation');
  const match = text.match(/^(\d+)\s*(.+)$/);
  let formulaText = text;
  let inputCoefficient = 1;
  if (match) {
    try {
      inputCoefficient = parseBoundedInt(match[1], MAX_INPUT_COEFFICIENT, 'invalid stoichiometric coefficient');
    } catch (err) {
      throw calcError(err.message || 'invalid stoichiometric coefficient', 400, err.code || 'invalid_request');
    }
    formulaText = match[2].trim();
  }
  if (!formulaText || /^\d+$/.test(formulaText)) throw calcError('species is missing a formula');
  const parsed = parseFormulaStrict(formulaText);
  return {
    formula: parsed.formula,
    counts: parsed.counts,
    inputCoefficient
  };
}

function assertUniqueSide(rows, side) {
  const seen = new Set();
  for (const row of rows) {
    if (seen.has(row.formula)) {
      throw calcError(
        side === 'reactant'
          ? 'The same species appears more than once on the reactant side.'
          : 'The same species appears more than once on the product side.',
        400,
        'duplicate_species'
      );
    }
    seen.add(row.formula);
  }
}

function splitSide(side) {
  const parts = [];
  let buf = '';
  let depth = 0;
  for (const ch of side) {
    if (ch === '(' || ch === '[') depth += 1;
    else if (ch === ')' || ch === ']') depth -= 1;
    if (ch === '+' && depth === 0) {
      parts.push(buf);
      buf = '';
    } else {
      buf += ch;
    }
  }
  parts.push(buf);
  return parts.map((part) => part.trim()).filter(Boolean);
}

export function parseEquation(raw) {
  const source = String(raw == null ? '' : raw).trim();
  if (!source) throw calcError('equation is required');
  if (source.length > REACTION_LIMITS.chars) throw calcError('equation is too long');
  if (looksIonic(source)) throw calcError(IONIC_UNAVAILABLE, 400, 'ionic_unsupported');

  const arrows = source.match(/->|→|=>|=/g) || [];
  if (!arrows.length) throw calcError('equation must include reactants and products');
  if (arrows.length > 1) throw calcError('equation must contain a single arrow');

  const split = source.split(/->|→|=>|=/);
  const left = split[0] || '';
  const right = split[1] || '';
  const reactants = splitSide(left).map(parseSpeciesToken);
  const products = splitSide(right).map(parseSpeciesToken);
  if (!reactants.length) throw calcError('reactants are required');
  if (!products.length) throw calcError('products are required');
  assertUniqueSide(reactants, 'reactant');
  assertUniqueSide(products, 'product');
  const species = [...reactants.map((row) => ({ ...row, role: 'reactant' })), ...products.map((row) => ({ ...row, role: 'product' }))];
  if (species.length > REACTION_LIMITS.species) {
    throw calcError(`at most ${REACTION_LIMITS.species} species`);
  }
  return { input: source, reactants, products, species };
}

function elementList(species) {
  const set = new Set();
  species.forEach((row) => Object.keys(row.counts).forEach((el) => set.add(el)));
  const elements = Array.from(set).sort();
  if (elements.length > REACTION_LIMITS.elements) {
    throw calcError(`at most ${REACTION_LIMITS.elements} distinct elements`);
  }
  if (!elements.length) throw calcError('equation has no elements');
  return elements;
}

function compositionMatrix(species, elements) {
  return elements.map((el) => species.map((row) => {
    const n = row.counts[el] || 0;
    const signed = row.role === 'product' ? -n : n;
    return frac(signed, 1n);
  }));
}

function rref(matrix) {
  const A = cloneMatrix(matrix);
  const rows = A.length;
  const cols = A[0] ? A[0].length : 0;
  const pivotOfCol = Array(cols).fill(-1);
  let h = 0;
  for (let k = 0; k < cols && h < rows; k += 1) {
    let pivot = -1;
    for (let r = h; r < rows; r += 1) {
      if (!fIsZero(A[r][k])) {
        pivot = r;
        break;
      }
    }
    if (pivot < 0) continue;
    if (pivot !== h) {
      const tmp = A[h];
      A[h] = A[pivot];
      A[pivot] = tmp;
    }
    const scale = A[h][k];
    for (let c = 0; c < cols; c += 1) A[h][c] = fDiv(A[h][c], scale);
    for (let r = 0; r < rows; r += 1) {
      if (r === h) continue;
      const factor = A[r][k];
      if (fIsZero(factor)) continue;
      for (let c = 0; c < cols; c += 1) {
        A[r][c] = fSub(A[r][c], fMul(factor, A[h][c]));
      }
    }
    pivotOfCol[k] = h;
    h += 1;
  }
  return { A, pivotOfCol, rank: h };
}

function integerKernel(rrefResult, n) {
  const free = [];
  for (let c = 0; c < n; c += 1) {
    if (rrefResult.pivotOfCol[c] < 0) free.push(c);
  }
  if (free.length === 0) {
    throw calcError('This equation cannot be balanced with the given species.');
  }
  if (free.length > 1) {
    throw calcError(
      'This equation has multiple independent balancing solutions. Check the equation or provide additional species.',
      400,
      'ambiguous_equation'
    );
  }
  const freeCol = free[0];
  const values = Array.from({ length: n }, () => frac(0n));
  values[freeCol] = frac(1n);
  for (let c = 0; c < n; c += 1) {
    const row = rrefResult.pivotOfCol[c];
    if (row < 0) continue;
    values[c] = fNeg(rrefResult.A[row][freeCol]);
  }
  let den = 1n;
  values.forEach((v) => {
    den = lcmBig(den, v.d);
  });
  let ints = values.map((v) => (v.n * den) / v.d);
  const negatives = ints.filter((v) => v < 0n).length;
  if (negatives > ints.length / 2) ints = ints.map((v) => -v);
  if (ints.some((v) => v <= 0n)) {
    throw calcError('This equation cannot be balanced with positive coefficients for every species.');
  }
  let g = 0n;
  ints.forEach((v) => {
    g = g ? gcdBig(g, v) : v;
  });
  if (g > 1n) ints = ints.map((v) => v / g);
  const coeffs = ints.map((v) => Number(v));
  if (coeffs.some((n) => !Number.isInteger(n) || n > REACTION_LIMITS.coefficient)) {
    throw calcError('balanced coefficients are too large');
  }
  return coeffs;
}

export function formatEquation(species, { pretty = false } = {}) {
  function piece(row) {
    const formula = pretty ? formatFormulaDisplay(row.formula) : row.formula;
    return row.coefficient === 1 ? formula : `${row.coefficient} ${formula}`;
  }
  const left = species.filter((row) => row.role === 'reactant').map(piece).join(' + ');
  const right = species.filter((row) => row.role === 'product').map(piece).join(' + ');
  const arrow = pretty ? ' → ' : ' -> ';
  return left + arrow + right;
}

export function balanceEquation(raw) {
  const parsed = parseEquation(raw);
  const elements = elementList(parsed.species);
  const matrix = compositionMatrix(parsed.species, elements);
  const reduced = rref(matrix);
  const coeffs = integerKernel(reduced, parsed.species.length);
  const species = parsed.species.map((row, i) => ({
    formula: row.formula,
    formulaDisplay: formatFormulaDisplay(row.formula),
    role: row.role,
    coefficient: coeffs[i],
    counts: row.counts
  }));
  const reactants = species.filter((row) => row.role === 'reactant');
  const products = species.filter((row) => row.role === 'product');
  const leftAtoms = mergeCounts(reactants);
  const rightAtoms = mergeCounts(products);
  if (!countsEqual(leftAtoms, rightAtoms)) {
    throw calcError('balanced equation failed atom-count validation', 500, 'solver_error');
  }
  return {
    ok: true,
    solverVersion: SOLVER_VERSION,
    input: parsed.input,
    balanced: formatEquation(species, { pretty: false }),
    balancedDisplay: formatEquation(species, { pretty: true }),
    reactants,
    products,
    atoms: leftAtoms
  };
}

export { SOLVER_VERSION, IONIC_UNAVAILABLE };
