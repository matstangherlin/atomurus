/**
 * Strict formula parser for Chemistry Solver.
 * Unlike public parseFormula(), unexpected characters are rejected.
 */

import { ATOMIC_WEIGHTS, calcError } from './chemistry-calc.mjs';

export const MAX_FORMULA_CHARS = 200;
export const MAX_ATOM_COUNT = 100000;
export const MAX_GROUP_MULTIPLIER = 100000;
export const MAX_HYDRATE_MULTIPLIER = 100000;
export const MAX_INPUT_COEFFICIENT = 100000;

export const IONIC_UNAVAILABLE =
  'Ionic equation balancing is not available in this version.';

const SUB = {
  '0': '₀', '1': '₁', '2': '₂', '3': '₃', '4': '₄',
  '5': '₅', '6': '₆', '7': '₇', '8': '₈', '9': '₉'
};

function formulaError(message, code = 'invalid_formula') {
  return calcError(message, 400, code);
}

export function looksIonic(raw) {
  const s = String(raw || '');
  if (s.includes('^')) return true;
  if (/[A-Za-z0-9)\]]\s*[+-](?:\d+)?\s*$/.test(s.trim())) return true;
  if (/\d\s*[+-]/.test(s) && /[+-]\s*$/.test(s.trim())) return true;
  if (/[A-Z][a-z]?\d*[+-]/.test(s)) return true;
  return false;
}

export function parseBoundedInt(digits, max, message) {
  const text = String(digits == null ? '' : digits);
  if (!text) return 1;
  if (text.length > 15) throw formulaError(message);
  const n = Number(text);
  if (!Number.isSafeInteger(n) || n < 1 || n > max) throw formulaError(message);
  return n;
}

function addCounts(target, source, mult) {
  for (const key of Object.keys(source)) {
    const next = (target[key] || 0) + source[key] * mult;
    if (!Number.isSafeInteger(next) || next > MAX_ATOM_COUNT * MAX_HYDRATE_MULTIPLIER) {
      throw formulaError('atom count is too large');
    }
    target[key] = next;
  }
}

function parseBody(s, i, stop) {
  const counts = {};
  while (i < s.length) {
    const ch = s[i];
    if (stop && stop(ch, i)) break;
    if (ch === '(' || ch === '[') {
      const open = ch;
      const close = open === '(' ? ')' : ']';
      i += 1;
      const inner = parseBody(s, i, (c) => c === close);
      i = inner.i;
      if (s[i] !== close) throw formulaError('unbalanced parentheses');
      i += 1;
      let digits = '';
      while (i < s.length && /\d/.test(s[i])) {
        digits += s[i];
        i += 1;
      }
      const m = digits ? parseBoundedInt(digits, MAX_GROUP_MULTIPLIER, 'invalid group multiplier') : 1;
      addCounts(counts, inner.counts, m);
      continue;
    }
    if (ch === ')' || ch === ']') {
      throw formulaError('unbalanced parentheses');
    }
    if (!/[A-Z]/.test(ch)) {
      throw formulaError('unexpected character in formula');
    }
    let sym = ch;
    i += 1;
    while (i < s.length && /[a-z]/.test(s[i])) {
      sym += s[i];
      i += 1;
    }
    if (!Object.prototype.hasOwnProperty.call(ATOMIC_WEIGHTS, sym)) {
      throw formulaError(`unknown element: ${sym}`, 'unknown_element');
    }
    let digits = '';
    while (i < s.length && /\d/.test(s[i])) {
      digits += s[i];
      i += 1;
    }
    const n = digits ? parseBoundedInt(digits, MAX_ATOM_COUNT, 'invalid atom count') : 1;
    counts[sym] = (counts[sym] || 0) + n;
    if (!Number.isSafeInteger(counts[sym]) || counts[sym] > MAX_ATOM_COUNT * MAX_GROUP_MULTIPLIER) {
      throw formulaError('atom count is too large');
    }
  }
  return { counts, i };
}

export function parseFormulaStrict(raw) {
  const source = String(raw == null ? '' : raw).trim();
  if (!source) throw formulaError('formula is required');
  if (source.length > MAX_FORMULA_CHARS) throw formulaError('formula is too long');
  if (looksIonic(source)) {
    throw formulaError(IONIC_UNAVAILABLE, 'ionic_unsupported');
  }
  const compact = source.replace(/\s+/g, '');
  if (/[<>&;$'"`\\]/.test(compact)) throw formulaError('unexpected character in formula');

  const hydrateParts = compact.split(/[·•*]/);
  if (hydrateParts.some((part) => part === '')) {
    throw formulaError('invalid hydrate formula');
  }

  const total = {};
  hydrateParts.forEach((part, index) => {
    let piece = part;
    let mult = 1;
    if (index > 0 && /^\d+/.test(piece)) {
      const match = piece.match(/^(\d+)(.*)$/);
      mult = parseBoundedInt(match[1], MAX_HYDRATE_MULTIPLIER, 'invalid hydrate multiplier');
      piece = match[2];
      if (!piece) throw formulaError('invalid hydrate formula');
    }
    const parsed = parseBody(piece, 0, null);
    if (parsed.i !== piece.length) throw formulaError('unexpected character in formula');
    if (!Object.keys(parsed.counts).length) throw formulaError('could not parse formula');
    addCounts(total, parsed.counts, mult);
  });

  if (!Object.keys(total).length) throw formulaError('could not parse formula');
  return {
    formula: compact.replace(/[•*]/g, '·'),
    counts: total
  };
}

function subscriptDigits(text) {
  return String(text || '').replace(/\d/g, (d) => SUB[d] || d);
}

/**
 * Chemical subscripts only. A digit immediately after · / • / * is a hydrate
 * coefficient and stays on the baseline: CuSO4·5H2O → CuSO₄·5H₂O.
 */
export function formatFormulaDisplay(formula) {
  const source = String(formula || '');
  return source.split(/([·•*])/).map((part, i, parts) => {
    if (part === '•' || part === '*') return '·';
    if (part === '·') return '·';
    if (i > 0 && /[·•*]/.test(parts[i - 1])) {
      const match = part.match(/^(\d+)(.*)$/);
      if (match) return match[1] + subscriptDigits(match[2]);
    }
    return subscriptDigits(part);
  }).join('');
}

export function countsEqual(a, b) {
  const keys = new Set([...Object.keys(a || {}), ...Object.keys(b || {})]);
  for (const key of keys) {
    if ((a[key] || 0) !== (b[key] || 0)) return false;
  }
  return true;
}

export function mergeCounts(list) {
  const out = {};
  for (const item of list) {
    addCounts(out, item.counts, item.coefficient || 1);
  }
  return out;
}
