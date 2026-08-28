import { clampText, studyError } from './study-cloud.mjs';
import { CALCULATORS, runProCalculation } from './chemistry-calc.mjs';
import { SOLVER_VERSION } from './chemistry-units.mjs';
import {
  ELEMENT_CHART_KEYS,
  ELEMENT_PROPERTY_KEYS,
  MAX_COMPARE_ELEMENTS,
  normalizeAtomicNumbers,
  normalizePropertyKeys
} from './canonical-elements.mjs';
import { MAX_COMPARE_MOLECULES, normalizeMoleculeIds } from './canonical-molecules.mjs';

export const SESSION_TYPES = Object.freeze([
  'calculation',
  'element_compare',
  'molecule_compare',
  'atomic_compare',
  'reaction',
  'formula_solver',
  'solution_builder'
]);

export const SOLVER_SESSION_TYPES = Object.freeze([
  'reaction',
  'formula_solver',
  'solution_builder'
]);

export const PRO_LAB_LIMITS = Object.freeze({
  title: 120,
  maxSessions: 200,
  stateBytes: 24576,
  bodyBytes: 32768,
  pinned: 12,
  scenarios: 8,
  formulas: 25
});

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export function isSessionUuid(value) {
  return UUID_RE.test(String(value || '').trim());
}

export function requireSessionId(value) {
  const id = String(value || '').trim();
  if (!isSessionUuid(id)) throw studyError('session id is invalid', 400, 'invalid_request');
  return id;
}

export function normalizeSessionTitle(raw) {
  return clampText(raw, PRO_LAB_LIMITS.title, 'title', true).trim();
}

export function normalizeSessionType(raw) {
  const value = String(raw || '').trim();
  if (!SESSION_TYPES.includes(value)) throw studyError('sessionType is invalid', 400);
  return value;
}

function assertPlainObject(value, field = 'state') {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    throw studyError(`${field} must be a JSON object`, 400);
  }
}

function assertStateSize(state) {
  const encoded = JSON.stringify(state);
  if (Buffer.byteLength(encoded, 'utf8') > PRO_LAB_LIMITS.stateBytes) {
    throw studyError('session state is too large', 413, 'payload_too_large');
  }
}

function rejectExecutable(value, depth = 0) {
  if (depth > 8) throw studyError('session state is too deep', 400);
  if (!value || typeof value !== 'object') return;
  const keys = Object.keys(value);
  for (const key of keys) {
    const lower = key.toLowerCase();
    if (lower === 'javascript' || lower === 'function' || lower === 'eval' || lower === 'code') {
      throw studyError('executable payloads are not allowed', 400);
    }
    const child = value[key];
    if (typeof child === 'string' && /(?:\bfunction\b|\beval\s*\(|new\s+Function)/i.test(child)) {
      throw studyError('executable payloads are not allowed', 400);
    }
    if (child && typeof child === 'object') rejectExecutable(child, depth + 1);
  }
}

function pinnedList(raw) {
  if (raw == null) return [];
  if (!Array.isArray(raw)) throw studyError('pinned must be an array', 400);
  if (raw.length > PRO_LAB_LIMITS.pinned) throw studyError(`at most ${PRO_LAB_LIMITS.pinned} pinned results`, 400);
  return raw.slice(0, PRO_LAB_LIMITS.pinned).map((item) => ({
    kind: String(item?.kind || '').slice(0, 40),
    label: String(item?.label || '').slice(0, 80),
    value: String(item?.value || '').slice(0, 80),
    unit: String(item?.unit || '').slice(0, 24)
  }));
}

export function validateSessionState(sessionType, raw) {
  assertPlainObject(raw);
  rejectExecutable(raw);
  const type = normalizeSessionType(sessionType);

  if (type === 'calculation') {
    const calculator = String(raw.calculator || '').trim();
    if (!CALCULATORS.includes(calculator)) throw studyError('calculator is invalid', 400);
    const formulas = Array.isArray(raw.formulas) ? raw.formulas.slice(0, PRO_LAB_LIMITS.formulas) : [];
    const scenarios = Array.isArray(raw.scenarios) ? raw.scenarios.slice(0, PRO_LAB_LIMITS.scenarios) : [];
    if (calculator === 'molar_mass') {
      formulas.forEach((entry) => {
        const formula = typeof entry === 'string' ? entry : entry?.formula;
        clampText(formula, 200, 'formula', true);
      });
    } else if (scenarios.length > PRO_LAB_LIMITS.scenarios) {
      throw studyError(`at most ${PRO_LAB_LIMITS.scenarios} scenarios`, 400);
    }
    const state = {
      calculator,
      formulas: calculator === 'molar_mass' ? formulas : undefined,
      scenarios: calculator === 'molar_mass' ? undefined : scenarios,
      results: Array.isArray(raw.results) ? raw.results : undefined,
      pinned: pinnedList(raw.pinned)
    };
    assertStateSize(state);
    return state;
  }

  if (type === 'element_compare') {
    const atomicNumbers = normalizeAtomicNumbers(raw.atomicNumbers || raw.elements, MAX_COMPARE_ELEMENTS);
    const properties = normalizePropertyKeys(raw.properties);
    const chartProperty = ELEMENT_CHART_KEYS.includes(raw.chartProperty) ? raw.chartProperty : 'atomicMass';
    const state = { atomicNumbers, properties, chartProperty };
    assertStateSize(state);
    return state;
  }

  if (type === 'molecule_compare') {
    const moleculeIds = normalizeMoleculeIds(raw.moleculeIds || raw.molecules, MAX_COMPARE_MOLECULES);
    const highlight = String(raw.highlight || '').trim().slice(0, 2);
    const state = { moleculeIds, highlight: highlight || undefined };
    assertStateSize(state);
    return state;
  }

  if (type === 'reaction') {
    const equation = clampText(raw.equation, 1000, 'equation', true);
    const quantities = Array.isArray(raw.quantities) ? raw.quantities.slice(0, 12) : [];
    const state = {
      solverVersion: SOLVER_VERSION,
      equation,
      quantities: quantities.map((row) => ({
        formula: clampText(row?.formula, 200, 'formula', true),
        amount: row?.amount,
        unit: String(row?.unit || 'g').slice(0, 12),
        kind: String(row?.kind || '').slice(0, 16) || undefined,
        concentration: row?.concentration,
        concUnit: row?.concUnit ? String(row.concUnit).slice(0, 12) : undefined,
        volume: row?.volume,
        volUnit: row?.volUnit ? String(row.volUnit).slice(0, 8) : undefined,
        P: row?.P,
        PUnit: row?.PUnit ? String(row.PUnit).slice(0, 8) : undefined,
        T: row?.T,
        TUnit: row?.TUnit ? String(row.TUnit).slice(0, 4) : undefined
      })),
      target: raw.target && raw.target.formula
        ? { formula: clampText(raw.target.formula, 200, 'target', true), unit: String(raw.target.unit || 'g').slice(0, 8) }
        : undefined,
      actualYield: raw.actualYield && raw.actualYield.amount != null
        ? { amount: raw.actualYield.amount, unit: String(raw.actualYield.unit || 'g').slice(0, 8) }
        : undefined
    };
    assertStateSize(state);
    return state;
  }

  if (type === 'formula_solver') {
    const composition = Array.isArray(raw.composition) ? raw.composition.slice(0, 12) : [];
    const state = {
      solverVersion: SOLVER_VERSION,
      mode: String(raw.mode || 'empirical').slice(0, 16),
      composition: composition.map((row) => ({
        symbol: String(row?.symbol || '').slice(0, 2),
        value: row?.value,
        unit: String(row?.unit || 'percent').slice(0, 12)
      })),
      empiricalFormula: raw.empiricalFormula ? clampText(raw.empiricalFormula, 200, 'formula', true) : undefined,
      molarMass: raw.molarMass
    };
    assertStateSize(state);
    return state;
  }

  if (type === 'solution_builder') {
    const solutions = Array.isArray(raw.solutions) ? raw.solutions.slice(0, 8) : [];
    const state = {
      solverVersion: SOLVER_VERSION,
      mode: String(raw.mode || 'prepare').slice(0, 16),
      formula: raw.formula ? clampText(raw.formula, 200, 'formula', true) : undefined,
      concentration: raw.concentration,
      concUnit: raw.concUnit ? String(raw.concUnit).slice(0, 12) : undefined,
      volume: raw.volume,
      volUnit: raw.volUnit ? String(raw.volUnit).slice(0, 8) : undefined,
      massUnit: raw.massUnit ? String(raw.massUnit).slice(0, 8) : undefined,
      solutions: solutions.map((row) => ({
        concentration: row?.concentration,
        concUnit: row?.concUnit ? String(row.concUnit).slice(0, 12) : undefined,
        volume: row?.volume,
        volUnit: row?.volUnit ? String(row.volUnit).slice(0, 8) : undefined
      }))
    };
    assertStateSize(state);
    return state;
  }

  const atomicNumbers = normalizeAtomicNumbers(raw.atomicNumbers || raw.elements, 2);
  const state = { atomicNumbers };
  assertStateSize(state);
  return state;
}

export function quotaExceeded() {
  return studyError('Pro Lab session quota exceeded', 409, 'quota_exceeded');
}

export function sessionSelect() {
  return 'id,session_type,title,state,created_at,updated_at';
}

export function publicLabSession(row) {
  if (!row) return null;
  return {
    id: row.id,
    sessionType: row.session_type,
    title: row.title || '',
    state: row.state && typeof row.state === 'object' ? row.state : {},
    createdAt: row.created_at,
    updatedAt: row.updated_at
  };
}

export function publicLabSessionSummary(row) {
  if (!row) return null;
  const state = row.state && typeof row.state === 'object' ? row.state : {};
  return {
    id: row.id,
    sessionType: row.session_type,
    title: row.title || '',
    calculator: state.calculator || null,
    equation: typeof state.equation === 'string' ? state.equation : null,
    solverVersion: state.solverVersion || null,
    updatedAt: row.updated_at,
    createdAt: row.created_at
  };
}

export { runProCalculation, ELEMENT_PROPERTY_KEYS, ELEMENT_CHART_KEYS };
