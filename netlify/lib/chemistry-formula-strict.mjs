/**
 * Strict formula parser for Chemistry Solver.
 * Unlike public parseFormula(), unexpected characters are rejected.
 */

import { ATOMIC_WEIGHTS, calcError } from './chemistry-calc.mjs';

export const MAX_FORMULA_CHARS = 200;
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

function addCounts(target, source, mult) {
  for (const key of Object.keys(source)) {
    target[key] = (target[key] || 0) + source[key] * mult;
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
      const m = digits ? Number(digits) : 1;
      if (!Number.isInteger(m) || m < 1) throw formulaError('invalid group multiplier');
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
    const n = digits ? Number(digits) : 1;
    if (!Number.isInteger(n) || n < 1) throw formulaError('invalid atom count');
    counts[sym] = (counts[sym] || 0) + n;
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
      mult = Number(match[1]);
      piece = match[2];
      if (!Number.isInteger(mult) || mult < 1) throw formulaError('invalid hydrate multiplier');
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

export function formatFormulaDisplay(formula) {
  return String(formula || '').replace(/\d/g, (d) => SUB[d] || d);
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
