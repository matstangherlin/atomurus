/**
 * Shared deterministic numerics for equilibrium and acid–base solvers.
 * No eval, no new Function, no third-party math libraries.
 */

const SUPER = {
  '0': '⁰', '1': '¹', '2': '²', '3': '³', '4': '⁴',
  '5': '⁵', '6': '⁶', '7': '⁷', '8': '⁸', '9': '⁹',
  '+': '⁺', '-': '⁻'
};

export const LOG10_NEAR = 1e-4;
export const REL_NEAR = 1e-6;

export function toSuperscript(value) {
  const text = String(value);
  let out = '';
  for (const ch of text) out += SUPER[ch] || ch;
  return out;
}

export function formatChemExp(n, sig = 3) {
  if (!Number.isFinite(n)) return null;
  if (n === 0) return '0';
  const sign = n < 0 ? '−' : '';
  const abs = Math.abs(n);
  if (abs >= 1e-3 && abs < 1e4) {
    const rounded = Number(abs.toPrecision(sig));
    return sign + String(rounded);
  }
  const exp = Math.floor(Math.log10(abs));
  let mantissa = abs / (10 ** exp);
  let shownExp = exp;
  const mRound = Number(mantissa.toPrecision(sig));
  if (mRound >= 10) {
    mantissa = mRound / 10;
    shownExp += 1;
  } else {
    mantissa = mRound;
  }
  return `${sign}${mantissa} × 10${toSuperscript(String(shownExp))}`;
}

export function relativeDifference(a, b) {
  if (!Number.isFinite(a) || !Number.isFinite(b)) return Infinity;
  const scale = Math.max(Math.abs(a), Math.abs(b), Number.EPSILON);
  return Math.abs(a - b) / scale;
}

export function nearlyEqual(a, b, rel = REL_NEAR, abs = 1e-15) {
  if (!Number.isFinite(a) || !Number.isFinite(b)) return false;
  if (a === b) return true;
  return Math.abs(a - b) <= abs + rel * Math.max(Math.abs(a), Math.abs(b));
}

export function log10Safe(n) {
  if (!(n > 0) || !Number.isFinite(n)) return null;
  return Math.log10(n);
}

export function compareLogRatio(lnLeft, lnRight, { log10Tol = LOG10_NEAR, relTol = REL_NEAR } = {}) {
  if (!Number.isFinite(lnLeft) || !Number.isFinite(lnRight)) {
    return { relation: 'unknown', log10Diff: null };
  }
  const diff = lnLeft - lnRight;
  const log10Diff = diff / Math.LN10;
  const left = Math.exp(lnLeft);
  const right = Math.exp(lnRight);
  const rel = Number.isFinite(left) && Number.isFinite(right)
    ? relativeDifference(left, right)
    : Infinity;
  if (Math.abs(log10Diff) < log10Tol || rel < relTol) {
    return { relation: 'near', log10Diff };
  }
  return { relation: diff < 0 ? 'lt' : 'gt', log10Diff };
}

/**
 * Bracketed bisection. Requires f(lo) and f(hi) to have opposite signs
 * or a root at an endpoint. Never uses unbracketed Newton.
 */
export function bisectRoot(f, lo, hi, { maxIter = 80, tol = 1e-12 } = {}) {
  let a = Number(lo);
  let b = Number(hi);
  if (!Number.isFinite(a) || !Number.isFinite(b) || a === b) {
    return { ok: false, code: 'invalid_bracket' };
  }
  if (a > b) {
    const tmp = a;
    a = b;
    b = tmp;
  }
  let fa = f(a);
  let fb = f(b);
  if (!Number.isFinite(fa) || !Number.isFinite(fb)) {
    return { ok: false, code: 'nonfinite_objective' };
  }
  if (Math.abs(fa) <= tol) return { ok: true, root: a, iterations: 0 };
  if (Math.abs(fb) <= tol) return { ok: true, root: b, iterations: 0 };
  if (fa * fb > 0) return { ok: false, code: 'no_sign_change' };

  let left = a;
  let right = b;
  let fLeft = fa;
  let mid = a;
  let i = 0;
  for (; i < maxIter; i += 1) {
    mid = left + (right - left) / 2;
    const fm = f(mid);
    if (!Number.isFinite(fm)) return { ok: false, code: 'nonfinite_objective' };
    if (Math.abs(fm) <= tol || (right - left) / 2 <= tol) {
      return { ok: true, root: mid, iterations: i + 1 };
    }
    if (fLeft * fm <= 0) {
      right = mid;
    } else {
      left = mid;
      fLeft = fm;
    }
  }
  return { ok: true, root: mid, iterations: i };
}

/**
 * Sample (lo, hi) and collect isolated sign-change brackets of f.
 */
export function findSignChangeBrackets(f, lo, hi, samples = 80) {
  const a = Number(lo);
  const b = Number(hi);
  if (!Number.isFinite(a) || !Number.isFinite(b) || !(b > a)) return [];
  const n = Math.max(8, Math.min(256, samples | 0));
  const xs = [];
  const ys = [];
  for (let i = 0; i <= n; i += 1) {
    const x = a + (b - a) * (i / n);
    const y = f(x);
    xs.push(x);
    ys.push(y);
  }
  const brackets = [];
  for (let i = 0; i < n; i += 1) {
    const y0 = ys[i];
    const y1 = ys[i + 1];
    if (!Number.isFinite(y0) || !Number.isFinite(y1)) continue;
    if (y0 === 0) {
      brackets.push({ lo: xs[i], hi: xs[i], endpoint: true });
      continue;
    }
    if (y0 * y1 < 0) brackets.push({ lo: xs[i], hi: xs[i + 1] });
    else if (y1 === 0 && i === n - 1) brackets.push({ lo: xs[i + 1], hi: xs[i + 1], endpoint: true });
  }
  return brackets;
}
