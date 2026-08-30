/**
 * Chemical equilibrium V1: Kc/Kp, reaction quotient, ICE solver.
 * Reuses the Chemistry Solver parser after stripping phase/charge suffixes.
 * Coefficients always come from the balanced equation — never from the client.
 */

import { calcError, formatSig } from './chemistry-calc.mjs';
import { formatFormulaDisplay, parseFormulaStrict } from './chemistry-formula-strict.mjs';
import { balanceEquation } from './chemistry-reactions.mjs';
import {
  allowUnit,
  requireFiniteNumber,
  requireNonNegativeNumber
} from './chemistry-units.mjs';
import {
  bisectRoot,
  compareLogRatio,
  findSignChangeBrackets,
  formatChemExp,
  nearlyEqual,
  relativeDifference,
  toSuperscript
} from './chemistry-numerics.mjs';

export const EQUILIBRIUM_SOLVER_VERSION = 1;

/** IUPAC: Kp from partial pressures in bar; Kc in mol/L. */
export const R_L_BAR = 0.0831446261815324;
export const KP_PRESSURE_STANDARD = 'bar';
export const KP_CONVENTION =
  'Kp uses partial pressures in bar (IUPAC standard-state convention). Kc uses mol/L. Conversion uses Kp = Kc (RT)^Δn with R = 0.08314462618 L·bar·mol⁻¹·K⁻¹.';

const CONC_UNITS = Object.freeze(['mol/L', 'mmol/L']);
const PRESSURE_UNITS = Object.freeze(['atm', 'kPa', 'Pa', 'bar']);
const TEMP_UNITS = Object.freeze(['K', 'C']);
const PHASES = new Set(['g', 'aq', 'l', 's']);
const K_MIN = 1e-80;
const K_MAX = 1e80;
const ICE_PAD = 1e-12;

function eqError(message, status = 400, code = 'invalid_request') {
  return calcError(message, status, code);
}

function requirePositiveK(value, field = 'K') {
  const n = typeof value === 'number' ? value : Number(value);
  if (!Number.isFinite(n) || Number.isNaN(n)) throw eqError(`${field} must be a finite number`);
  if (n <= 0) throw eqError(`${field} must be a positive number`, 400, 'invalid_k');
  if (n < K_MIN || n > K_MAX) {
    throw eqError(`${field} is outside the numerical range of this solver`);
  }
  return n;
}

function concToMolPerL(value, unit, { allowZero = false } = {}) {
  const n = allowZero
    ? requireNonNegativeNumber(value, 'concentration')
    : requireFiniteNumber(value, 'concentration');
  if (!allowZero && n <= 0) throw eqError('concentration must be a positive number');
  const u = allowUnit(unit, CONC_UNITS, 'concentration', 'mol/L');
  return u === 'mmol/L' ? n / 1000 : n;
}

function pressureToBar(value, unit) {
  const n = requireFiniteNumber(value, 'pressure');
  if (n <= 0) throw eqError('pressure must be a positive number');
  const u = allowUnit(unit, PRESSURE_UNITS, 'pressure', 'bar');
  if (u === 'bar') return n;
  if (u === 'atm') return n * 1.01325;
  if (u === 'kPa') return n / 100;
  if (u === 'Pa') return n / 1e5;
  throw eqError('pressure unit is not supported');
}

function toKelvin(value, unit) {
  const n = requireFiniteNumber(value, 'temperature');
  const u = allowUnit(unit, TEMP_UNITS, 'temperature', 'K');
  const T = u === 'C' ? n + 273.15 : n;
  if (!(T > 0)) throw eqError('temperature must be above 0 K');
  return T;
}

function normalizeArrow(source) {
  return String(source || '').replace(/⇌|⇄|↔|<->|<=>/g, '->');
}

function extractPhase(formulaText) {
  const text = String(formulaText || '').trim();
  const match = text.match(/^(.*?)(?:\(\s*(g|aq|l|s|gas|aqueous|liquid|solid)\s*\))$/i);
  if (!match) return { body: text, phase: null };
  const raw = match[2].toLowerCase();
  const phase = raw === 'gas' ? 'g'
    : raw === 'aqueous' ? 'aq'
      : raw === 'liquid' ? 'l'
        : raw === 'solid' ? 's'
          : raw;
  return { body: match[1].trim(), phase: PHASES.has(phase) ? phase : null };
}

function extractCharge(formulaText) {
  const text = String(formulaText || '').trim();
  const match = text.match(/^(.*?)([+-]\d*)$/);
  if (!match || !match[1]) return { body: text, chargeLabel: '' };
  return { body: match[1].trim(), chargeLabel: match[2] };
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
    } else buf += ch;
  }
  parts.push(buf);
  return parts.map((part) => part.trim()).filter(Boolean);
}

function parseTokenMeta(token) {
  const text = String(token || '').trim();
  if (!text) throw eqError('empty species in equation');
  const coeffMatch = text.match(/^(\d+)\s*(.+)$/);
  let formulaText = text;
  let inputCoefficient = 1;
  if (coeffMatch) {
    inputCoefficient = Number(coeffMatch[1]);
    if (!Number.isInteger(inputCoefficient) || inputCoefficient < 1) {
      throw eqError('invalid stoichiometric coefficient');
    }
    formulaText = coeffMatch[2].trim();
  }
  const phased = extractPhase(formulaText);
  const charged = extractCharge(phased.body);
  if (!charged.body) throw eqError('species is missing a formula');
  let placeholder = false;
  try {
    parseFormulaStrict(charged.body);
  } catch (err) {
    if (err?.code === 'unknown_element' && /^[A-Z][A-Za-z0-9]*$/.test(charged.body)) {
      placeholder = true;
    } else {
      throw err;
    }
  }
  return {
    formula: charged.body,
    phase: phased.phase,
    chargeLabel: charged.chargeLabel,
    inputCoefficient,
    placeholder,
    stripped: (coeffMatch ? `${coeffMatch[1]} ` : '') + charged.body
  };
}

function chargeDisplay(label) {
  if (!label) return '';
  if (label === '+') return '⁺';
  if (label === '-') return '⁻';
  return toSuperscript(label);
}

function speciesLabel(row, { pretty = true } = {}) {
  const formula = pretty ? formatFormulaDisplay(row.formula) : row.formula;
  const charge = pretty ? chargeDisplay(row.chargeLabel) : (row.chargeLabel || '');
  const phase = row.phase ? `(${row.phase})` : '';
  return `${formula}${charge}${phase}`;
}

function formatBalanced(species, { pretty = false, reversible = true } = {}) {
  function piece(row) {
    const label = speciesLabel(row, { pretty });
    return row.coefficient === 1 ? label : `${row.coefficient} ${label}`;
  }
  const left = species.filter((row) => row.role === 'reactant').map(piece).join(' + ');
  const right = species.filter((row) => row.role === 'product').map(piece).join(' + ');
  const arrow = pretty
    ? (reversible ? ' ⇌ ' : ' → ')
    : (reversible ? ' <-> ' : ' -> ');
  return `${left}${arrow}${right}`;
}

export function parseEquilibriumEquation(raw) {
  const input = String(raw == null ? '' : raw).trim();
  if (!input) throw eqError('equation is required');
  if (input.length > 1000) throw eqError('equation is too long');

  const normalized = normalizeArrow(input);
  const arrows = normalized.match(/->|→|=>|=/g) || [];
  if (!arrows.length) throw eqError('equation must include a reversible arrow such as ⇌ or <->');
  if (arrows.length > 1) throw eqError('equation must contain a single arrow');

  const split = normalized.split(/->|→|=>|=/);
  const leftTokens = splitSide(split[0] || '').map(parseTokenMeta);
  const rightTokens = splitSide(split[1] || '').map(parseTokenMeta);
  if (!leftTokens.length || !rightTokens.length) throw eqError('equation must include reactants and products');

  const placeholders = [...leftTokens, ...rightTokens].some((t) => t.placeholder);
  let species;
  if (placeholders) {
    const toRow = (token, role) => ({
      formula: token.formula,
      formulaDisplay: formatFormulaDisplay(token.formula),
      chargeLabel: token.chargeLabel || '',
      phase: token.phase || null,
      role,
      coefficient: token.inputCoefficient,
      nu: role === 'product' ? token.inputCoefficient : -token.inputCoefficient,
      display: speciesLabel({
        formula: token.formula,
        chargeLabel: token.chargeLabel || '',
        phase: token.phase || null
      })
    });
    species = [
      ...leftTokens.map((t) => toRow(t, 'reactant')),
      ...rightTokens.map((t) => toRow(t, 'product'))
    ];
  } else {
    const stripped = `${leftTokens.map((t) => t.stripped).join(' + ')} -> ${rightTokens.map((t) => t.stripped).join(' + ')}`;
    const balanced = balanceEquation(stripped);
    const metaByFormula = new Map();
    for (const token of [...leftTokens, ...rightTokens]) {
      if (!metaByFormula.has(token.formula)) metaByFormula.set(token.formula, token);
    }
    species = [...balanced.reactants, ...balanced.products].map((row) => {
      const meta = metaByFormula.get(row.formula) || {};
      const nu = row.role === 'product' ? row.coefficient : -row.coefficient;
      return {
        formula: row.formula,
        formulaDisplay: formatFormulaDisplay(row.formula),
        chargeLabel: meta.chargeLabel || '',
        phase: meta.phase || null,
        role: row.role,
        coefficient: row.coefficient,
        nu,
        display: speciesLabel({ ...row, chargeLabel: meta.chargeLabel || '', phase: meta.phase || null })
      };
    });
  }

  const notes = [];
  if (species.some((row) => !row.phase)) {
    notes.push('Phase not specified — treated as a concentration term.');
  }
  if (species.some((row) => row.phase === 's' || row.phase === 'l')) {
    notes.push('Pure solids and liquids are omitted from the K expression (activity ≈ 1 in V1).');
  }

  return {
    input,
    balanced: formatBalanced(species, { pretty: false }),
    balancedDisplay: formatBalanced(species, { pretty: true }),
    species,
    notes,
    solverVersion: EQUILIBRIUM_SOLVER_VERSION
  };
}

function isSolidOrLiquid(phase) {
  return phase === 's' || phase === 'l';
}

export function activeSpecies(species, kind) {
  return species.filter((row) => {
    if (isSolidOrLiquid(row.phase)) return false;
    if (kind === 'kp') return row.phase === 'g' || row.phase == null;
    return row.phase !== 's' && row.phase !== 'l';
  });
}

export function buildKExpression(species, kind = 'kc') {
  const active = activeSpecies(species, kind);
  const numerator = active.filter((row) => row.role === 'product').map((row) => ({
    formula: row.formula,
    coefficient: row.coefficient,
    phase: row.phase,
    display: row.display
  }));
  const denominator = active.filter((row) => row.role === 'reactant').map((row) => ({
    formula: row.formula,
    coefficient: row.coefficient,
    phase: row.phase,
    display: row.display
  }));
  return { kind, numerator, denominator, active };
}

function termText(term, kind) {
  const pretty = formatFormulaDisplay(term.formula);
  const inner = kind === 'kp' ? `P(${pretty})` : `[${pretty}]`;
  if (term.coefficient === 1) return inner;
  return inner + toSuperscript(String(term.coefficient));
}

export function formatKExpression(expr, symbol) {
  const kind = expr.kind === 'kp' ? 'kp' : 'kc';
  const num = expr.numerator.length ? expr.numerator.map((t) => termText(t, kind)).join('') : '1';
  const den = expr.denominator.length ? expr.denominator.map((t) => termText(t, kind)).join('') : '';
  const label = symbol || (kind === 'kp' ? 'Kp' : 'Kc');
  const text = den ? `${label} = ${num} / (${den})` : `${label} = ${num}`;
  const html = den
    ? `<span class="eq-k">${label}</span><span class="eq-eq"> = </span><span class="eq-frac"><span class="eq-num">${num}</span><span class="eq-bar" aria-hidden="true"></span><span class="eq-den">${den}</span></span>`
    : `<span class="eq-k">${label}</span><span class="eq-eq"> = </span><span class="eq-num">${num}</span>`;
  return { text, html, numerator: expr.numerator, denominator: expr.denominator };
}

function lnQFromValues(expr, values) {
  let ln = 0;
  const used = [...expr.numerator, ...expr.denominator];
  if (!used.length) return { lnQ: 0, Q: 1 };
  for (const term of expr.numerator) {
    const v = values[term.formula];
    if (!(v > 0) || !Number.isFinite(v)) {
      throw eqError('every species in the K expression needs a positive value', 400, 'invalid_value');
    }
    ln += term.coefficient * Math.log(v);
  }
  for (const term of expr.denominator) {
    const v = values[term.formula];
    if (!(v > 0) || !Number.isFinite(v)) {
      throw eqError('every species in the K expression needs a positive value', 400, 'invalid_value');
    }
    ln -= term.coefficient * Math.log(v);
  }
  const Q = Math.exp(ln);
  return { lnQ: ln, Q: Number.isFinite(Q) ? Q : (ln > 0 ? Infinity : 0) };
}

function readValueMap(parsed, rawValues, kind, { allowZero = false } = {}) {
  const list = Array.isArray(rawValues)
    ? rawValues
    : Object.entries(rawValues || {}).map(([formula, value]) => ({ formula, value }));
  const byFormula = new Map();
  for (const row of list) {
    const formula = String(row.formula || row.species || '').trim();
    if (!formula) continue;
    byFormula.set(formula, row);
  }
  const values = {};
  const missing = [];
  const active = activeSpecies(parsed.species, kind);
  for (const sp of active) {
    const row = byFormula.get(sp.formula);
    if (!row || row.value == null || row.value === '') {
      missing.push(sp.formula);
      continue;
    }
    values[sp.formula] = kind === 'kp'
      ? pressureToBar(row.value, row.unit || 'bar')
      : concToMolPerL(row.value, row.unit || 'mol/L', { allowZero });
  }
  if (missing.length) {
    throw eqError(`Missing value for ${missing.join(', ')}`, 400, 'missing_value');
  }
  return values;
}

export function deltaNGas(species) {
  if (species.some((row) => row.phase == null)) return null;
  let n = 0;
  for (const row of species) {
    if (row.phase !== 'g') continue;
    n += row.nu;
  }
  return n;
}

function canConvertKcKp(species) {
  if (species.some((row) => row.phase == null)) return false;
  const activeKc = activeSpecies(species, 'kc');
  return activeKc.every((row) => row.phase === 'g');
}

function convertKcKp({ Kc, Kp, T, deltaN }) {
  const factor = (R_L_BAR * T) ** deltaN;
  if (!Number.isFinite(factor) || factor === 0) {
    throw eqError('Kc ↔ Kp conversion overflowed for these inputs', 400, 'conversion_overflow');
  }
  if (Kc != null) return { Kc, Kp: Kc * factor, factor };
  return { Kp, Kc: Kp / factor, factor };
}

function assumptionsEquilibrium() {
  return [
    'Ideal concentrations or partial pressures (activities ≈ concentration or pressure).',
    'Single equilibrium reaction.',
    'Pure solids and liquids have activity ≈ 1 and are omitted from K.',
    'This tool is educational and computational. It is not a recommendation for chemical handling.'
  ];
}

function directionCopy(relation) {
  if (relation === 'lt') {
    return {
      relation: 'Q < K',
      en: 'The composition must shift toward products to reach equilibrium.',
      pt: 'A composição deve se deslocar em direção aos produtos para atingir o equilíbrio.'
    };
  }
  if (relation === 'gt') {
    return {
      relation: 'Q > K',
      en: 'The composition must shift toward reactants to reach equilibrium.',
      pt: 'A composição deve se deslocar em direção aos reagentes para atingir o equilíbrio.'
    };
  }
  return {
    relation: 'Q ≈ K',
    en: 'The system is at or very near equilibrium.',
    pt: 'O sistema está no equilíbrio ou muito próximo dele.'
  };
}

function solveConstant(body, parsed) {
  const kind = String(body.kind || body.constant || 'kc').toLowerCase() === 'kp' ? 'kp' : 'kc';
  const expr = buildKExpression(parsed.species, kind);
  if (!expr.active.length) {
    throw eqError('No concentration- or pressure-active species remain in the K expression.', 400, 'empty_k_expression');
  }
  const values = readValueMap(parsed, body.values || body.concentrations || body.pressures, kind);
  const { lnQ, Q } = lnQFromValues(expr, values);
  const formatted = formatKExpression(expr, kind === 'kp' ? 'Kp' : 'Kc');
  const steps = [
    { title: 'Balance the equation', body: parsed.balancedDisplay },
    { title: 'Build the equilibrium expression', body: formatted.text },
    { title: 'Substitute equilibrium values', body: expr.active.map((sp) => `${sp.display} = ${formatSig(values[sp.formula], 4)} ${kind === 'kp' ? 'bar' : 'mol/L'}`).join('; ') },
    { title: `Evaluate ${kind === 'kp' ? 'Kp' : 'Kc'}`, body: `${kind === 'kp' ? 'Kp' : 'Kc'} = ${formatChemExp(Q, 3)}` }
  ];

  let conversion = null;
  const wantConvert = body.convert === true || body.T != null;
  if (wantConvert) {
    if (!canConvertKcKp(parsed.species) || deltaNGas(parsed.species) == null) {
      conversion = {
        ok: false,
        code: 'delta_n_unknown',
        message: 'Kc ↔ Kp is not applied because Δn(g) cannot be determined from the given phases.'
      };
    } else if (body.T == null) {
      conversion = {
        ok: false,
        code: 'temperature_required',
        message: 'Temperature is required to convert between Kc and Kp.'
      };
    } else {
      const T = toKelvin(body.T, body.TUnit || body.tempUnit || 'K');
      const dN = deltaNGas(parsed.species);
      const converted = kind === 'kp'
        ? convertKcKp({ Kp: Q, T, deltaN: dN })
        : convertKcKp({ Kc: Q, T, deltaN: dN });
      conversion = {
        ok: true,
        T,
        deltaN: dN,
        equation: 'Kp = Kc (RT)^Δn',
        convention: KP_CONVENTION,
        Kc: converted.Kc,
        Kp: converted.Kp,
        KcDisplay: formatChemExp(converted.Kc, 3),
        KpDisplay: formatChemExp(converted.Kp, 3)
      };
    }
  }

  return {
    ok: true,
    mode: 'constant',
    kind,
    K: Q,
    KDisplay: formatChemExp(Q, 3),
    lnK: lnQ,
    expression: formatted,
    values,
    conversion,
    convention: kind === 'kp' ? KP_CONVENTION : 'Kc uses equilibrium concentrations in mol/L.',
    steps,
    notes: parsed.notes,
    assumptions: assumptionsEquilibrium()
  };
}

function solveQuotient(body, parsed) {
  const kind = String(body.kind || 'kc').toLowerCase() === 'kp' ? 'kp' : 'kc';
  const K = requirePositiveK(body.K ?? body.k, 'K');
  const expr = buildKExpression(parsed.species, kind);
  if (!expr.active.length) {
    throw eqError('No concentration- or pressure-active species remain in the Q expression.', 400, 'empty_k_expression');
  }
  const values = readValueMap(parsed, body.values || body.concentrations || body.pressures, kind);
  const { lnQ, Q } = lnQFromValues(expr, values);
  const cmp = compareLogRatio(lnQ, Math.log(K));
  const formatted = formatKExpression(expr, 'Q');
  const direction = directionCopy(cmp.relation);
  return {
    ok: true,
    mode: 'quotient',
    kind,
    Q,
    QDisplay: formatChemExp(Q, 3),
    K,
    KDisplay: formatChemExp(K, 3),
    lnQ,
    lnK: Math.log(K),
    comparison: cmp.relation,
    direction,
    tooltip: {
      en: 'Q predicts the direction required to reach equilibrium. It does not predict how fast the system will change.',
      pt: 'Q prevê a direção necessária para atingir o equilíbrio. Não prevê a rapidez da mudança.'
    },
    expression: formatted,
    values,
    steps: [
      { title: 'Balance the equation', body: parsed.balancedDisplay },
      { title: 'Build Q from current conditions', body: formatted.text },
      { title: 'Compare Q with K', body: `${direction.relation}. ${direction.en}` }
    ],
    notes: parsed.notes,
    assumptions: assumptionsEquilibrium()
  };
}

function physicalDomain(active, initials) {
  let xMin = -Infinity;
  let xMax = Infinity;
  for (const sp of active) {
    const C = initials[sp.formula];
    const nu = sp.nu;
    if (!Number.isFinite(C) || !Number.isFinite(nu) || nu === 0) continue;
    if (nu > 0) xMin = Math.max(xMin, -C / nu);
    else xMax = Math.min(xMax, -C / nu);
  }
  if (!Number.isFinite(xMin)) xMin = -1e6;
  if (!Number.isFinite(xMax)) xMax = 1e6;
  return { xMin, xMax };
}

function concentrationsAt(active, initials, x) {
  const eq = {};
  for (const sp of active) {
    const C = initials[sp.formula] + sp.nu * x;
    eq[sp.formula] = C;
  }
  return eq;
}

function solveIce(body, parsed) {
  const K = requirePositiveK(body.K ?? body.Kc ?? body.k, 'Kc');
  const expr = buildKExpression(parsed.species, 'kc');
  if (!expr.active.length) {
    throw eqError('ICE V1 solves concentration-based Kc only.', 400, 'empty_k_expression');
  }
  const initials = readValueMap(parsed, body.initials || body.values || body.concentrations, 'kc', { allowZero: true });
  const { xMin, xMax } = physicalDomain(expr.active, initials);
  const span = xMax - xMin;
  if (!(span > 0)) {
    throw eqError(
      'No physically valid equilibrium composition was found for these inputs. Check K and the initial concentrations.',
      400,
      'no_physical_root'
    );
  }
  const pad = Math.max(ICE_PAD, 1e-14 * span);
  const lo = xMin + pad;
  const hi = xMax - pad;
  if (!(hi > lo)) {
    throw eqError(
      'No physically valid equilibrium composition was found for these inputs. Check K and the initial concentrations.',
      400,
      'no_physical_root'
    );
  }

  const lnK = Math.log(K);
  const f = (x) => {
    const eq = concentrationsAt(expr.active, initials, x);
    for (const sp of expr.active) {
      if (!(eq[sp.formula] > 0)) return NaN;
    }
    let ln = 0;
    for (const term of expr.numerator) ln += term.coefficient * Math.log(eq[term.formula]);
    for (const term of expr.denominator) ln -= term.coefficient * Math.log(eq[term.formula]);
    return ln - lnK;
  };

  const brackets = findSignChangeBrackets(f, lo, hi, 96);
  const physicalRoots = [];
  for (const br of brackets) {
    const found = br.endpoint
      ? { ok: true, root: br.lo }
      : bisectRoot(f, br.lo, br.hi, { maxIter: 90, tol: 1e-14 });
    if (!found.ok) continue;
    const eq = concentrationsAt(expr.active, initials, found.root);
    if (expr.active.some((sp) => eq[sp.formula] < -1e-12)) continue;
    for (const sp of expr.active) eq[sp.formula] = Math.max(0, eq[sp.formula]);
    if (expr.active.some((sp) => expr.numerator.concat(expr.denominator).some((t) => t.formula === sp.formula) && !(eq[sp.formula] > 0))) {
      continue;
    }
    let ln = 0;
    let valid = true;
    for (const term of expr.numerator) {
      if (!(eq[term.formula] > 0)) { valid = false; break; }
      ln += term.coefficient * Math.log(eq[term.formula]);
    }
    for (const term of expr.denominator) {
      if (!(eq[term.formula] > 0)) { valid = false; break; }
      ln -= term.coefficient * Math.log(eq[term.formula]);
    }
    if (!valid) continue;
    const reconstructed = Math.exp(ln);
    const rel = relativeDifference(reconstructed, K);
    if (!(rel < 1e-4 || nearlyEqual(ln, lnK, 1e-8, 1e-10))) continue;
    physicalRoots.push({ x: found.root, eq, reconstructed, relativeError: rel });
  }

  const unique = [];
  for (const root of physicalRoots) {
    if (unique.some((u) => nearlyEqual(u.x, root.x, 1e-6, 1e-10))) continue;
    unique.push(root);
  }
  if (unique.length > 1) {
    throw eqError(
      'More than one physically valid equilibrium composition matches these inputs.',
      400,
      'multiple_physical_solutions'
    );
  }
  if (!unique.length) {
    throw eqError(
      'No physically valid equilibrium composition was found for these inputs. Check K and the initial concentrations.',
      400,
      'no_physical_root'
    );
  }

  const chosen = unique[0];
  const table = parsed.species.map((sp) => {
    const initial = Object.prototype.hasOwnProperty.call(initials, sp.formula)
      ? initials[sp.formula]
      : (isSolidOrLiquid(sp.phase) ? null : 0);
    const excluded = isSolidOrLiquid(sp.phase);
    const change = excluded ? null : sp.nu * chosen.x;
    const equilibrium = excluded ? null : Math.max(0, initial + change);
    return {
      formula: sp.formula,
      display: sp.display,
      role: sp.role,
      coefficient: sp.coefficient,
      nu: sp.nu,
      initial,
      change,
      changeLabel: excluded ? 'pure' : `${sp.nu < 0 ? '−' : '+'}${sp.nu === 1 || sp.nu === -1 ? '' : Math.abs(sp.nu)}x`,
      equilibrium,
      excluded
    };
  });

  for (const row of table) {
    if (row.excluded) continue;
    const predicted = row.initial + row.nu * chosen.x;
    if (!nearlyEqual(predicted, row.equilibrium, 1e-8, 1e-12) && Math.abs(predicted) > 1e-12) {
      throw eqError('ICE extent invariant failed', 500, 'solver_error');
    }
  }

  const formatted = formatKExpression(expr, 'Kc');
  return {
    ok: true,
    mode: 'ice',
    kind: 'kc',
    x: chosen.x,
    xDisplay: formatSig(chosen.x, 4),
    K,
    KDisplay: formatChemExp(K, 3),
    KReconstructed: chosen.reconstructed,
    KReconstructedDisplay: formatChemExp(chosen.reconstructed, 3),
    relativeError: chosen.relativeError,
    table,
    concentrations: chosen.eq,
    expression: formatted,
    domain: { xMin, xMax },
    steps: [
      { title: 'I — Initial', body: 'Write the initial concentrations of each concentration-active species.' },
      { title: 'C — Change', body: `Each species changes by νᵢ x, with x = ${formatSig(chosen.x, 4)}.` },
      { title: 'E — Equilibrium', body: 'Substitute Cᵢ(eq) = Cᵢ(initial) + νᵢ x into Kc and solve for x.' },
      { title: 'Verify Kc', body: `Reconstructed Kc = ${formatChemExp(chosen.reconstructed, 3)}.` }
    ],
    notes: parsed.notes,
    assumptions: [
      ...assumptionsEquilibrium(),
      'ICE V1: concentration-based Kc, single reaction, single reaction extent.'
    ]
  };
}

export function solveEquilibrium(body = {}) {
  if (body.result != null || body.KClient != null || body.clientEntitlements != null) {
    throw eqError('client-supplied results are not accepted', 400, 'invalid_request');
  }
  const mode = String(body.mode || 'constant').toLowerCase();
  const parsed = parseEquilibriumEquation(body.equation);
  let result;
  if (mode === 'constant' || mode === 'kc' || mode === 'kp') {
    result = solveConstant({ ...body, kind: body.kind || (mode === 'kp' ? 'kp' : 'kc') }, parsed);
  } else if (mode === 'quotient' || mode === 'q') {
    result = solveQuotient(body, parsed);
  } else if (mode === 'ice') {
    result = solveIce(body, parsed);
  } else {
    throw eqError('mode is not supported');
  }

  const unsupported = [
    'coupled equilibria',
    'precipitation networks',
    'full aqueous speciation',
    'activities beyond concentration/pressure',
    'fugacity',
    'ionic strength',
    'nonideal gases',
    'complex-formation networks'
  ];

  return {
    ...result,
    ok: true,
    equilibriumSolverVersion: EQUILIBRIUM_SOLVER_VERSION,
    solverVersion: EQUILIBRIUM_SOLVER_VERSION,
    equation: parsed.input,
    balanced: parsed.balanced,
    balancedDisplay: parsed.balancedDisplay,
    species: parsed.species,
    unsupported
  };
}

export function equilibriumFeatureForMode(mode) {
  const m = String(mode || 'constant').toLowerCase();
  if (m === 'quotient' || m === 'q') return 'reactionQuotient';
  if (m === 'ice') return 'iceTableSolver';
  return 'equilibriumSolver';
}

export { formatChemExp, formatSig };
