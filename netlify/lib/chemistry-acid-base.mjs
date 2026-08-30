/**
 * Acid–base V1: monoprotic weak acid/base, Henderson–Hasselbalch buffers, Ka/Kb conversions.
 * User-supplied constants only. Kw = 1.0e-14 at 25 °C. No unsourced Ka database.
 */

import { calcError, formatSig, KW_25C } from './chemistry-calc.mjs';
import { requireFiniteNumber, requirePositiveNumber } from './chemistry-units.mjs';
import { formatChemExp, log10Safe, nearlyEqual } from './chemistry-numerics.mjs';

export const ACID_BASE_SOLVER_VERSION = 1;
export const KW = KW_25C;
export const ACID_BASE_TEMP_C = 25;
export const KW_NOTE = 'Acid–base calculations in V1 use Kw = 1.0 × 10⁻¹⁴ at 25 °C.';

function abError(message, status = 400, code = 'invalid_request') {
  return calcError(message, status, code);
}

function requirePositiveConstant(value, field) {
  const n = typeof value === 'number' ? value : Number(value);
  if (!Number.isFinite(n) || Number.isNaN(n)) throw abError(`${field} must be a finite number`);
  if (n <= 0) throw abError(`${field} must be a positive number`);
  if (n > 1e80 || n < 1e-80) throw abError(`${field} is outside the numerical range of this solver`);
  return n;
}

export function kaFromPka(pKa) {
  const p = requireFiniteNumber(pKa, 'pKa');
  const Ka = 10 ** (-p);
  if (!Number.isFinite(Ka) || Ka <= 0) throw abError('pKa is outside the numerical range of this solver');
  return Ka;
}

export function pkaFromKa(Ka) {
  const k = requirePositiveConstant(Ka, 'Ka');
  const pKa = -Math.log10(k);
  if (!Number.isFinite(pKa)) throw abError('Ka is outside the numerical range of this solver');
  return pKa;
}

export function kbFromPkb(pKb) {
  const p = requireFiniteNumber(pKb, 'pKb');
  const Kb = 10 ** (-p);
  if (!Number.isFinite(Kb) || Kb <= 0) throw abError('pKb is outside the numerical range of this solver');
  return Kb;
}

export function pkbFromKb(Kb) {
  const k = requirePositiveConstant(Kb, 'Kb');
  const pKb = -Math.log10(k);
  if (!Number.isFinite(pKb)) throw abError('Kb is outside the numerical range of this solver');
  return pKb;
}

function resolveKa(body) {
  if (body.Ka != null && body.Ka !== '') return requirePositiveConstant(body.Ka, 'Ka');
  if (body.pKa != null && body.pKa !== '') return kaFromPka(body.pKa);
  throw abError('Ka or pKa is required');
}

function resolveKb(body) {
  if (body.Kb != null && body.Kb !== '') return requirePositiveConstant(body.Kb, 'Kb');
  if (body.pKb != null && body.pKb !== '') return kbFromPkb(body.pKb);
  throw abError('Kb or pKb is required');
}

/**
 * Exact monoprotic weak-acid root of Ka = x² / (C − x), 0 ≤ x ≤ C.
 * x = [-Ka + sqrt(Ka² + 4 Ka C)] / 2
 */
export function solveMonoproticQuadratic(C, K) {
  const c = requirePositiveNumber(C, 'concentration');
  const k = requirePositiveConstant(K, 'constant');
  const disc = k * k + 4 * k * c;
  if (!(disc >= 0) || !Number.isFinite(disc)) {
    throw abError('No physically valid root was found for these inputs.', 400, 'no_physical_root');
  }
  const x = (-k + Math.sqrt(disc)) / 2;
  if (!Number.isFinite(x) || x < -1e-15 || x - c > 1e-12) {
    throw abError('No physically valid root was found for these inputs.', 400, 'no_physical_root');
  }
  const clamped = Math.min(c, Math.max(0, x));
  return clamped;
}

function percentIonization(x, C) {
  if (!(C > 0)) return 0;
  return 100 * x / C;
}

function fivePercentCheck(C, K, xExact) {
  const approx = Math.sqrt(K * C);
  const ratio = C > 0 ? approx / C : Infinity;
  return {
    approximateX: approx,
    approximatePercent: 100 * ratio,
    withinFivePercent: ratio < 0.05,
    note: 'The 5% check is only a guideline for when the x ≈ √(Kc) shortcut is a rough estimate. The reported result is the exact quadratic root.'
  };
}

function assumptionsAcidBase() {
  return [
    '25 °C, Kw = 1.0 × 10⁻¹⁴.',
    'Ideal dilute solution.',
    'Monoprotic weak acid or base (HA ⇌ H+ + A− or B + H2O ⇌ BH+ + OH−).',
    'Water as solvent is omitted from the simplified expressions.',
    'This tool is educational and computational. It is not a medical or industrial recommendation.'
  ];
}

function solveWeakAcid(body) {
  const C = requirePositiveNumber(body.C ?? body.concentration, 'concentration');
  const Ka = resolveKa(body);
  const x = solveMonoproticQuadratic(C, Ka);
  const h = x;
  const pH = -Math.log10(h);
  const Aeq = x;
  const HAeq = Math.max(0, C - x);
  const ionization = percentIonization(x, C);
  const approx = fivePercentCheck(C, Ka, x);
  return {
    ok: true,
    mode: 'weak-acid',
    model: 'HA ⇌ H+ + A−',
    C,
    Ka,
    KaDisplay: formatChemExp(Ka, 3),
    pKa: pkaFromKa(Ka),
    x,
    hydrogen: h,
    hydrogenDisplay: formatChemExp(h, 3),
    pH,
    pHDisplay: formatSig(pH, 4),
    acetate: Aeq,
    HA: HAeq,
    percentIonization: ionization,
    fivePercent: approx,
    massBalanceOk: nearlyEqual(HAeq + Aeq, C, 1e-8, 1e-12),
    chargeRelation: 'Under the V1 monoprotic assumptions, [H+] ≈ [A−].',
    steps: [
      { title: 'Write Ka', body: 'Ka = [H+][A−] / [HA] = x² / (C − x)' },
      { title: 'Solve the quadratic', body: `x = [H+] = ${formatChemExp(h, 3)} mol/L` },
      { title: 'pH', body: `pH = −log10([H+]) = ${formatSig(pH, 4)}` }
    ],
    kwNote: KW_NOTE,
    assumptions: assumptionsAcidBase()
  };
}

function solveWeakBase(body) {
  const C = requirePositiveNumber(body.C ?? body.concentration, 'concentration');
  const Kb = resolveKb(body);
  const x = solveMonoproticQuadratic(C, Kb);
  const oh = x;
  const pOH = -Math.log10(oh);
  const pH = 14 - pOH;
  const ionization = percentIonization(x, C);
  const approx = fivePercentCheck(C, Kb, x);
  return {
    ok: true,
    mode: 'weak-base',
    model: 'B + H2O ⇌ BH+ + OH−',
    C,
    Kb,
    KbDisplay: formatChemExp(Kb, 3),
    pKb: pkbFromKb(Kb),
    x,
    hydroxide: oh,
    hydroxideDisplay: formatChemExp(oh, 3),
    pOH,
    pOHDisplay: formatSig(pOH, 4),
    pH,
    pHDisplay: formatSig(pH, 4),
    BH: x,
    B: Math.max(0, C - x),
    percentIonization: ionization,
    fivePercent: approx,
    kwNote: KW_NOTE,
    assumptions: assumptionsAcidBase(),
    steps: [
      { title: 'Write Kb', body: 'Kb = [BH+][OH−] / [B] = x² / (C − x)' },
      { title: 'Solve the quadratic', body: `x = [OH−] = ${formatChemExp(oh, 3)} mol/L` },
      { title: 'pH at 25 °C', body: `pOH = ${formatSig(pOH, 4)}; pH = 14 − pOH = ${formatSig(pH, 4)}` }
    ]
  };
}

function bufferAmounts(body) {
  const mode = String(body.inputMode || (body.volume != null ? 'moles' : 'concentration')).toLowerCase();
  if (mode === 'moles') {
    const acidMoles = requireFiniteNumber(body.acidMoles ?? body.nHA ?? body.nAcid, 'acid amount');
    const baseMoles = requireFiniteNumber(body.baseMoles ?? body.nA ?? body.nBase, 'base amount');
    if (acidMoles < 0 || baseMoles < 0) throw abError('amounts must be non-negative');
    const volume = requirePositiveNumber(body.volume ?? body.V, 'volume');
    return { acid: acidMoles / volume, base: baseMoles / volume, inputMode: 'moles' };
  }
  const acid = requireFiniteNumber(body.acid ?? body.HA ?? body.cAcid, 'acid concentration');
  const base = requireFiniteNumber(body.base ?? body.A ?? body.cBase, 'base concentration');
  if (acid < 0 || base < 0) throw abError('concentrations must be non-negative');
  return { acid, base, inputMode: 'concentration' };
}

function solveBuffer(body) {
  const type = String(body.type || body.bufferType || 'acid').toLowerCase() === 'base' ? 'base' : 'acid';
  const amounts = bufferAmounts(body);
  if (!(amounts.acid > 0) || !(amounts.base > 0)) {
    throw abError(
      'Henderson–Hasselbalch is not applied when one of the conjugate species is zero.',
      400,
      'invalid_buffer'
    );
  }
  const ratio = amounts.base / amounts.acid;
  const warnings = [];
  if (ratio > 100 || ratio < 0.01) {
    warnings.push('This composition is outside the usual effective buffer range.');
  }

  let pKa;
  let pH;
  let pOH = null;
  let Ka = null;
  let Kb = null;
  if (type === 'acid') {
    Ka = resolveKa(body);
    pKa = pkaFromKa(Ka);
    pH = pKa + Math.log10(ratio);
  } else {
    Kb = resolveKb(body);
    const pKb = pkbFromKb(Kb);
    pKa = 14 - pKb;
    pOH = pKb + Math.log10(amounts.acid / amounts.base);
    pH = 14 - pOH;
    Ka = KW / Kb;
  }

  return {
    ok: true,
    mode: 'buffer',
    type,
    pH,
    pHDisplay: formatSig(pH, 4),
    pOH,
    pKa,
    pKaDisplay: formatSig(pKa, 4),
    Ka,
    KaDisplay: Ka != null ? formatChemExp(Ka, 3) : null,
    Kb,
    KbDisplay: Kb != null ? formatChemExp(Kb, 3) : null,
    acid: amounts.acid,
    base: amounts.base,
    ratio,
    ratioDisplay: formatSig(ratio, 4),
    effectiveRange: {
      low: pKa - 1,
      high: pKa + 1,
      guideline: 'pKa ± 1 is a practical guideline, not a hard limit.'
    },
    warnings,
    assumption: 'Henderson–Hasselbalch assumes a buffer with meaningful amounts of both the weak species and its conjugate partner.',
    kwNote: KW_NOTE,
    assumptions: [
      ...assumptionsAcidBase(),
      'Buffer V1 does not compute quantitative buffer capacity or strong acid/base addition.'
    ],
    steps: type === 'acid'
      ? [
        { title: 'Henderson–Hasselbalch', body: 'pH = pKa + log10([A−]/[HA])' },
        { title: 'Evaluate', body: `pH = ${formatSig(pKa, 4)} + log10(${formatSig(ratio, 4)}) = ${formatSig(pH, 4)}` }
      ]
      : [
        { title: 'Base buffer', body: 'pOH = pKb + log10([BH+]/[B]); pH = 14 − pOH at 25 °C' },
        { title: 'Evaluate', body: `pH = ${formatSig(pH, 4)}` }
      ]
  };
}

function solveConstants(body) {
  const action = String(body.action || body.convert || '').toLowerCase();
  if (action === 'ka_to_pka' || (body.Ka != null && body.pKa == null && !action)) {
    const Ka = requirePositiveConstant(body.Ka, 'Ka');
    const pKa = pkaFromKa(Ka);
    return { ok: true, mode: 'constants', Ka, pKa, KaDisplay: formatChemExp(Ka, 3), pKaDisplay: formatSig(pKa, 4) };
  }
  if (action === 'pka_to_ka' || (body.pKa != null && body.Ka == null && !action)) {
    const pKa = requireFiniteNumber(body.pKa, 'pKa');
    const Ka = kaFromPka(pKa);
    return { ok: true, mode: 'constants', Ka, pKa, KaDisplay: formatChemExp(Ka, 3), pKaDisplay: formatSig(pKa, 4) };
  }
  if (action === 'kb_to_pkb') {
    const Kb = requirePositiveConstant(body.Kb, 'Kb');
    const pKb = pkbFromKb(Kb);
    return { ok: true, mode: 'constants', Kb, pKb, KbDisplay: formatChemExp(Kb, 3), pKbDisplay: formatSig(pKb, 4) };
  }
  if (action === 'pkb_to_kb') {
    const pKb = requireFiniteNumber(body.pKb, 'pKb');
    const Kb = kbFromPkb(pKb);
    return { ok: true, mode: 'constants', Kb, pKb, KbDisplay: formatChemExp(Kb, 3), pKbDisplay: formatSig(pKb, 4) };
  }
  if (action === 'conjugate' || body.conjugate) {
    let Ka = body.Ka != null ? requirePositiveConstant(body.Ka, 'Ka') : (body.pKa != null ? kaFromPka(body.pKa) : null);
    let Kb = body.Kb != null ? requirePositiveConstant(body.Kb, 'Kb') : (body.pKb != null ? kbFromPkb(body.pKb) : null);
    if (Ka == null && Kb == null) throw abError('Ka/pKa or Kb/pKb is required');
    if (Ka == null) Ka = KW / Kb;
    if (Kb == null) Kb = KW / Ka;
    return {
      ok: true,
      mode: 'constants',
      Ka,
      Kb,
      pKa: pkaFromKa(Ka),
      pKb: pkbFromKb(Kb),
      KaDisplay: formatChemExp(Ka, 3),
      KbDisplay: formatChemExp(Kb, 3),
      relation: 'Ka × Kb = Kw at 25 °C',
      kwNote: KW_NOTE
    };
  }
  if (body.Ka != null) {
    const Ka = requirePositiveConstant(body.Ka, 'Ka');
    return { ok: true, mode: 'constants', Ka, pKa: pkaFromKa(Ka), KaDisplay: formatChemExp(Ka, 3), pKaDisplay: formatSig(pkaFromKa(Ka), 4) };
  }
  if (body.pKa != null) {
    const pKa = requireFiniteNumber(body.pKa, 'pKa');
    const Ka = kaFromPka(pKa);
    return { ok: true, mode: 'constants', Ka, pKa, KaDisplay: formatChemExp(Ka, 3), pKaDisplay: formatSig(pKa, 4) };
  }
  if (body.Kb != null) {
    const Kb = requirePositiveConstant(body.Kb, 'Kb');
    return { ok: true, mode: 'constants', Kb, pKb: pkbFromKb(Kb), KbDisplay: formatChemExp(Kb, 3), pKbDisplay: formatSig(pkbFromKb(Kb), 4) };
  }
  if (body.pKb != null) {
    const pKb = requireFiniteNumber(body.pKb, 'pKb');
    const Kb = kbFromPkb(pKb);
    return { ok: true, mode: 'constants', Kb, pKb, KbDisplay: formatChemExp(Kb, 3), pKbDisplay: formatSig(pKb, 4) };
  }
  throw abError('Provide Ka, pKa, Kb or pKb');
}

export function solveAcidBase(body = {}) {
  if (body.result != null || body.pHClient != null || body.clientEntitlements != null) {
    throw abError('client-supplied results are not accepted', 400, 'invalid_request');
  }
  const mode = String(body.mode || 'weak-acid').toLowerCase();
  let result;
  if (mode === 'weak-acid' || mode === 'acid') result = solveWeakAcid(body);
  else if (mode === 'weak-base' || mode === 'base') result = solveWeakBase(body);
  else if (mode === 'buffer') result = solveBuffer(body);
  else if (mode === 'constants' || mode === 'constant') result = solveConstants(body);
  else throw abError('mode is not supported');

  return {
    ...result,
    ok: true,
    acidBaseSolverVersion: ACID_BASE_SOLVER_VERSION,
    solverVersion: ACID_BASE_SOLVER_VERSION,
    kw: KW,
    temperatureC: ACID_BASE_TEMP_C,
    kwNote: KW_NOTE,
    unsupported: [
      'polyprotic acids',
      'salt hydrolysis',
      'amphiprotic species',
      'titration curves',
      'strong acid/base addition to buffers',
      'quantitative buffer capacity'
    ]
  };
}

export function acidBaseFeatureForMode(mode) {
  const m = String(mode || 'weak-acid').toLowerCase();
  if (m === 'weak-base' || m === 'base') return 'weakBaseSolver';
  if (m === 'buffer') return 'bufferSolver';
  if (m === 'constants' || m === 'constant') return 'acidBaseConstants';
  return 'weakAcidSolver';
}

export { formatChemExp, formatSig, log10Safe };
