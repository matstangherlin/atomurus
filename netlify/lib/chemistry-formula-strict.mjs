/**
 * Canonical strict formula parser.
 * Returns { ok:true, ... } or { ok:false, error } and does not throw for bad input.
 */

import { ATOMIC_WEIGHTS, calcError } from './chemistry-base.mjs';

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
const SUB_IN = {
  '₀': '0', '₁': '1', '₂': '2', '₃': '3', '₄': '4',
  '₅': '5', '₆': '6', '₇': '7', '₈': '8', '₉': '9'
};
const SUP_IN = {
  '⁰': '0', '¹': '1', '²': '2', '³': '3', '⁴': '4',
  '⁵': '5', '⁶': '6', '⁷': '7', '⁸': '8', '⁹': '9',
  '⁺': '+', '⁻': '-'
};
const SUP_OUT = {
  '0': '⁰', '1': '¹', '2': '²', '3': '³', '4': '⁴',
  '5': '⁵', '6': '⁶', '7': '⁷', '8': '⁸', '9': '⁹'
};

const ARROW = /->|→|=>|⇌|=/g;

function formulaError(message, code = 'invalid_formula') {
  return calcError(message, 400, code);
}

function weightsFor(opts) {
  if (opts && opts.allowIsotopes === false) {
    const copy = { ...ATOMIC_WEIGHTS };
    delete copy.D;
    delete copy.T;
    return copy;
  }
  return ATOMIC_WEIGHTS;
}

function normalizeFormula(raw) {
  const text = [];
  const map = [];
  const source = String(raw == null ? '' : raw);
  for (let i = 0; i < source.length; i += 1) {
    const ch = source[i];
    const next = SUB_IN[ch] || SUP_IN[ch] || ch;
    for (let k = 0; k < next.length; k += 1) {
      text.push(next[k]);
      map.push(i);
    }
  }
  return { text: text.join(''), map };
}

function fail(code, messageEn, messagePt, position) {
  return {
    ok: false,
    error: {
      code,
      message_en: messageEn,
      message_pt: messagePt,
      position: position == null ? null : position
    }
  };
}

function posOf(map, index, origin) {
  if (index == null || index < 0) return null;
  const raw = map && index < map.length ? map[index] : index;
  return raw + 1 + (origin || 0);
}

/**
 * True only when a token carries an explicit charge.
 * H2+O2=H2O is two species joined by +, not the ion H2+.
 */
export function looksIonic(raw) {
  const source = String(raw || '');
  if (/\^\s*\d*\s*[+-]/.test(source)) return true;
  if (/[A-Za-z0-9)\]]\s+\d+\s*[+-]/.test(source)) return true;
  if (/(^|[^A-Za-z])e-/.test(source)) return true;
  const normalized = source.replace(ARROW, ' | ');
  const pieces = splitSpecies(normalized);
  return pieces.some(isChargedPiece);
}

function splitSpecies(s) {
  const out = [];
  let buf = '';
  let depth = 0;
  for (let i = 0; i < s.length; i += 1) {
    const ch = s[i];
    if (ch === '(' || ch === '[') {
      depth += 1;
      buf += ch;
      continue;
    }
    if (ch === ')' || ch === ']') {
      depth = Math.max(0, depth - 1);
      buf += ch;
      continue;
    }
    if (depth === 0 && (ch === '|' || ch === '+')) {
      if (ch === '+') {
        let j = i + 1;
        while (s[j] === ' ') j += 1;
        const next = s[j];
        if (next && /[A-Z0-9(]/.test(next)) {
          if (buf.trim()) out.push(buf);
          buf = '';
          continue;
        }
        buf += ch;
        continue;
      }
      if (buf.trim()) out.push(buf);
      buf = '';
      continue;
    }
    buf += ch;
  }
  if (buf.trim()) out.push(buf);
  return out;
}

function isChargedPiece(token) {
  const t = String(token || '').trim();
  if (!t || t === '|') return false;
  if (t === 'e-') return true;
  if (/\^\s*\d+\s*[+-]$/.test(t)) return true;
  if (/[A-Za-z)\]]\d+[+-]$/.test(t)) return true;
  if (/[A-Za-z)\]][+-]$/.test(t)) return true;
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

function stripCharge(s) {
  let match = s.match(/^(.*?)(?:\s*\^\s*(\d+)\s*([+-])|\s+(\d+)\s*([+-]))$/);
  if (match && match[1]) {
    const mag = Number(match[2] || match[4]);
    const sign = (match[3] || match[5]) === '+' ? 1 : -1;
    if (mag >= 1 && mag <= 20) return { body: match[1].trimEnd(), charge: sign * mag };
  }
  match = s.match(/^([A-Z][a-z]?)(\d+)([+-])$/);
  if (match) {
    const mag = Number(match[2]);
    if (mag >= 1 && mag <= 20) {
      return { body: match[1], charge: (match[3] === '+' ? 1 : -1) * mag };
    }
  }
  match = s.match(/^(.*[A-Za-z)\]])([+-])$/);
  if (match) return { body: match[1], charge: match[2] === '+' ? 1 : -1 };
  return { body: s, charge: 0 };
}

function splitHydrate(s) {
  const parts = [];
  let buf = '';
  let start = 0;
  for (let i = 0; i < s.length; i += 1) {
    const ch = s[i];
    if (ch === '·' || ch === '•' || ch === '*') {
      parts.push({ text: buf, index: start });
      buf = '';
      start = i + 1;
      continue;
    }
    if (ch === '.') {
      const rest = s.slice(i + 1);
      if (/^\d*[A-Z(\[]/.test(rest)) {
        parts.push({ text: buf, index: start });
        buf = '';
        start = i + 1;
        continue;
      }
      return { errorAt: i };
    }
    buf += ch;
  }
  parts.push({ text: buf, index: start });
  return { parts };
}

function knownSymbol(weights, one, two) {
  if (two && Object.prototype.hasOwnProperty.call(weights, two)) return two;
  if (Object.prototype.hasOwnProperty.call(weights, one)) return one;
  return null;
}

function parseBody(s, start, stop, weights, map, origin) {
  const counts = {};
  const opens = [];
  let i = start;
  while (i < s.length) {
    const ch = s[i];
    if (stop && stop(ch, i) && !opens.length) break;
    if (ch === '(' || ch === '[') {
      opens.push({ ch, at: i });
      i += 1;
      const close = ch === '(' ? ')' : ']';
      const inner = parseBody(s, i, (c) => c === ')' || c === ']', weights, map, origin);
      if (inner.error) return inner;
      i = inner.i;
      if (s[i] !== close) {
        const at = s[i] === ')' || s[i] === ']' ? i : opens[opens.length - 1].at;
        return { error: 'unbalanced', at };
      }
      if (!Object.keys(inner.counts).length) return { error: 'unbalanced', at: opens[opens.length - 1].at };
      i += 1;
      opens.pop();
      let digits = '';
      const digitAt = i;
      while (i < s.length && /\d/.test(s[i])) {
        digits += s[i];
        i += 1;
      }
      if (digits.length >= 3 && digits.length <= 15 && Number(digits) <= MAX_GROUP_MULTIPLIER) {
        return { error: 'mass', at: digitAt };
      }
      let mult = 1;
      if (digits) {
        if (digits === '0' || Number(digits) < 1) return { error: 'subscript', at: digitAt };
        try {
          mult = parseBoundedInt(digits, MAX_GROUP_MULTIPLIER, 'invalid group multiplier');
        } catch (err) {
          return { error: 'count', at: digitAt, message: err.message };
        }
      }
      try {
        addCounts(counts, inner.counts, mult);
      } catch (err) {
        return { error: 'count', at: digitAt, message: err.message };
      }
      continue;
    }
    if (ch === ')' || ch === ']') {
      if (stop && stop(ch, i)) break;
      return { error: 'unbalanced', at: i };
    }
    if (/[A-Z]/.test(ch)) {
      const two = i + 1 < s.length && /[a-z]/.test(s[i + 1]) ? ch + s[i + 1] : '';
      const sym = knownSymbol(weights, ch, two);
      if (!sym) return { error: 'unknown', at: i, symbol: two || ch };
      i += sym.length;
      let digits = '';
      const digitAt = i;
      while (i < s.length && /\d/.test(s[i])) {
        digits += s[i];
        i += 1;
      }
      if (digits.length >= 3 && digits.length <= 15 && Number(digits) <= MAX_ATOM_COUNT) {
        return { error: 'mass', at: digitAt };
      }
      let n = 1;
      if (digits) {
        if (digits === '0') return { error: 'subscript', at: digitAt };
        try {
          n = parseBoundedInt(digits, MAX_ATOM_COUNT, 'invalid atom count');
        } catch (err) {
          return { error: 'count', at: digitAt, message: err.message };
        }
      }
      counts[sym] = (counts[sym] || 0) + n;
      if (!Number.isSafeInteger(counts[sym]) || counts[sym] > MAX_ATOM_COUNT * MAX_GROUP_MULTIPLIER) {
        return { error: 'count', at: digitAt, message: 'atom count is too large' };
      }
      continue;
    }
    if (/\d/.test(ch) && i === start) {
      return { error: 'coeff', at: i };
    }
    return { error: 'char', at: i, ch };
  }
  if (opens.length) return { error: 'unbalanced', at: opens[opens.length - 1].at };
  return { counts, i };
}

function describe(kind, at, extra, map, origin) {
  const position = posOf(map, at, origin);
  const whereEn = position == null ? '' : ` at position ${position}`;
  const wherePt = position == null ? '' : ` na posição ${position}`;
  if (kind === 'unbalanced') {
    return fail('unbalanced_parentheses', `Unbalanced parentheses${whereEn}`, `Parênteses não balanceados${wherePt}`, position);
  }
  if (kind === 'char') {
    const ch = extra || '?';
    return fail('invalid_character', `invalid character '${ch}'${whereEn}`, `Caractere inválido '${ch}'${wherePt}`, position);
  }
  if (kind === 'subscript') {
    return fail('integer_subscript', `Subscript must be an integer${whereEn}`, `Subscrito deve ser inteiro${wherePt}`, position);
  }
  if (kind === 'mass') {
    return fail('mass_number', `Mass number is not supported; use the formula without the isotope${whereEn}`, `Número de massa não é suportado; use a fórmula sem isótopo${wherePt}`, position);
  }
  if (kind === 'coeff') {
    return fail('leading_coefficient', 'Coefficients are not part of the formula; use H2O', 'Coeficientes não são parte da fórmula; use H2O', position);
  }
  if (kind === 'hydrate0') {
    return fail('hydrate_count', `Hydration number must be at least 1${whereEn}`, `Número de hidratação deve ser ≥ 1${wherePt}`, position);
  }
  if (kind === 'hydrate') {
    return fail('invalid_hydrate', `Invalid hydrate formula${whereEn}`, `Fórmula de hidrato inválida${wherePt}`, position);
  }
  if (kind === 'unknown') {
    return fail('unknown_element', `unknown element: ${extra}`, `Elemento desconhecido: ${extra}`, position);
  }
  if (kind === 'count') {
    return fail('atom_count', extra || 'Atom count is too large', 'Contagem de átomos grande demais', position);
  }
  if (kind === 'one') {
    return fail('one_formula', 'One formula at a time', 'Uma fórmula por vez', position);
  }
  if (kind === 'empty') return fail('required', 'Formula is required', 'A fórmula é obrigatória', null);
  if (kind === 'long') return fail('too_long', 'Formula is too long', 'Fórmula longa demais', null);
  return fail('invalid_formula', 'Could not parse formula', 'Não foi possível ler a fórmula', position);
}

function superscriptCharge(charge) {
  const mag = Math.abs(charge);
  const sign = charge > 0 ? '⁺' : '⁻';
  const digits = mag === 1 ? '' : String(mag).replace(/\d/g, (d) => SUP_OUT[d] || d);
  return digits + sign;
}

function parseFormulaStrictInner(raw, opts) {
  const originText = String(raw == null ? '' : raw);
  if (originText.includes(',')) return describe('one', originText.indexOf(','), null, null, 0);
  const norm = normalizeFormula(originText);
  const trimmedLeft = norm.text.length - norm.text.trimStart().length;
  const compact = norm.text.trim();
  if (!compact) return describe('empty');
  if (compact.length > MAX_FORMULA_CHARS) return describe('long');
  const origin = trimmedLeft;
  const map = norm.map.slice(origin, origin + compact.length);
  const charged = stripCharge(compact);
  const bodySpaced = charged.body;
  const charge = charged.charge;
  if (/[+=]/.test(bodySpaced)) return describe('one', bodySpaced.search(/[+=]/), null, map, 0);
  const collapsed = [];
  const collapsedMap = [];
  for (let i = 0; i < bodySpaced.length; i += 1) {
    if (bodySpaced[i] === ' ' || bodySpaced[i] === '\t') continue;
    collapsed.push(bodySpaced[i]);
    collapsedMap.push(map[i]);
  }
  const s = collapsed.join('');
  if (!s) return describe('empty');
  const weights = weightsFor(opts);
  const split = splitHydrate(s);
  if (split.errorAt != null) return describe('subscript', split.errorAt, null, collapsedMap, 0);
  if (!split.parts.length || split.parts.some((part) => part.text === '')) {
    return describe('hydrate', 0, null, collapsedMap, 0);
  }
  const total = {};
  const formulaParts = [];
  for (let p = 0; p < split.parts.length; p += 1) {
    let piece = split.parts[p].text;
    const pieceAt = split.parts[p].index;
    let mult = 1;
    if (p > 0 && /^\d+/.test(piece)) {
      const digits = piece.match(/^(\d+)/)[1];
      if (digits === '0') return describe('hydrate0', pieceAt, null, collapsedMap, 0);
      if (digits.length >= 3 && Number(digits) <= MAX_HYDRATE_MULTIPLIER) {
        return describe('mass', pieceAt, null, collapsedMap, 0);
      }
      try {
        mult = parseBoundedInt(digits, MAX_HYDRATE_MULTIPLIER, 'invalid hydrate multiplier');
      } catch (err) {
        return describe('count', pieceAt, err.message, collapsedMap, 0);
      }
      piece = piece.slice(digits.length);
      if (!piece) return describe('hydrate', pieceAt, null, collapsedMap, 0);
    } else if (p === 0 && /^\d/.test(piece)) {
      const digits = piece.match(/^(\d+)/)[1];
      if (digits.length >= 2) return describe('mass', pieceAt, null, collapsedMap, 0);
      return describe('coeff', pieceAt, null, collapsedMap, 0);
    }
    const parsed = parseBody(piece, 0, null, weights, collapsedMap, pieceAt);
    if (parsed.error) {
      const at = pieceAt + (parsed.at || 0);
      if (parsed.error === 'char') return describe('char', at, piece[parsed.at] || parsed.ch, collapsedMap, 0);
      if (parsed.error === 'unknown') return describe('unknown', at, parsed.symbol, collapsedMap, 0);
      if (parsed.error === 'mass') return describe('mass', at, null, collapsedMap, 0);
      if (parsed.error === 'coeff') return describe('coeff', at, null, collapsedMap, 0);
      if (parsed.error === 'subscript') return describe('subscript', at, null, collapsedMap, 0);
      if (parsed.error === 'count') return describe('count', at, parsed.message, collapsedMap, 0);
      return describe('unbalanced', at, null, collapsedMap, 0);
    }
    if (parsed.i !== piece.length) return describe('char', pieceAt + parsed.i, piece[parsed.i], collapsedMap, 0);
    if (!Object.keys(parsed.counts).length) return describe('hydrate', pieceAt, null, collapsedMap, 0);
    try {
      addCounts(total, parsed.counts, mult);
    } catch (err) {
      return describe('count', pieceAt, err.message, collapsedMap, 0);
    }
    formulaParts.push((p > 0 && mult !== 1 ? String(mult) : '') + piece);
  }
  if (!Object.keys(total).length) return describe('empty');
  const formula = formulaParts.join('·');
  const warnings = [];
  if (total.Ac) {
    warnings.push({
      code: 'actinium_acoh',
      message_en: 'Ac = actinium; for acetyl use CH₃CO',
      message_pt: 'Ac = actínio; para acetil use CH₃CO'
    });
  }
  let ionLabel = null;
  if (charge) {
    const mark = superscriptCharge(charge);
    const shown = formatFormulaDisplay(formula) + mark;
    ionLabel = { pt: `Íon ${shown}`, en: `${shown} ion` };
    warnings.push({
      code: 'ion',
      message_en: ionLabel.en,
      message_pt: ionLabel.pt
    });
  }
  return {
    ok: true,
    formula,
    counts: total,
    charge,
    hydrate: split.parts.length > 1,
    warnings,
    ionLabel
  };
}

export function parseFormulaStrict(raw, opts) {
  try {
    return parseFormulaStrictInner(raw, opts || {});
  } catch (err) {
    return {
      ok: false,
      error: {
        code: (err && err.code) || 'invalid_formula',
        message_en: (err && err.message) || 'Could not parse formula',
        message_pt: (err && err.message_pt) || 'Não foi possível ler a fórmula',
        position: err && err.position != null ? err.position : null
      }
    };
  }
}

export function readFormulaStrict(raw, opts) {
  const parsed = parseFormulaStrict(raw, opts);
  if (!parsed.ok) {
    const err = calcError(parsed.error.message_en, 400, parsed.error.code);
    err.message_pt = parsed.error.message_pt;
    err.position = parsed.error.position;
    throw err;
  }
  return parsed;
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
