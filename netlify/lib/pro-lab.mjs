import { clampText, studyError } from './study-cloud.mjs';
import { CALCULATORS, runProCalculation } from './chemistry-calc.mjs';
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
  'atomic_compare'
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
    updatedAt: row.updated_at,
    createdAt: row.created_at
  };
}

export { runProCalculation, ELEMENT_PROPERTY_KEYS, ELEMENT_CHART_KEYS };
