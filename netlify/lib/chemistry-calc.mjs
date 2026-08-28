/**
 * Canonical calculation logic shared by the public calculators and Pro Lab.
 * Formulas match calculators.html (IUPAC 2024 atomic weights, C1V1=C2V2,
 * PV=nRT with R=8.314 J·mol⁻¹·K⁻¹, Kw=1e-14 at 25 °C).
 * Never uses eval or new Function.
 */

export const ATOMIC_WEIGHTS = Object.freeze({
  H: 1.008, He: 4.0026, Li: 6.94, Be: 9.0122, B: 10.81, C: 12.011, N: 14.007, O: 15.999, F: 18.998, Ne: 20.180,
  Na: 22.990, Mg: 24.305, Al: 26.982, Si: 28.085, P: 30.974, S: 32.06, Cl: 35.45, Ar: 39.95,
  K: 39.098, Ca: 40.078, Sc: 44.956, Ti: 47.867, V: 50.942, Cr: 51.996, Mn: 54.938, Fe: 55.845, Co: 58.933, Ni: 58.693,
  Cu: 63.546, Zn: 65.38, Ga: 69.723, Ge: 72.630, As: 74.922, Se: 78.971, Br: 79.904, Kr: 83.798,
  Rb: 85.468, Sr: 87.62, Y: 88.906, Zr: 91.224, Nb: 92.906, Mo: 95.95, Tc: 98, Ru: 101.07, Rh: 102.91, Pd: 106.42,
  Ag: 107.87, Cd: 112.41, In: 114.82, Sn: 118.71, Sb: 121.76, Te: 127.60, I: 126.90, Xe: 131.29,
  Cs: 132.91, Ba: 137.33, La: 138.91, Ce: 140.12, Pr: 140.91, Nd: 144.24, Pm: 145, Sm: 150.36, Eu: 151.96, Gd: 157.25,
  Tb: 158.93, Dy: 162.50, Ho: 164.93, Er: 167.26, Tm: 168.93, Yb: 173.05, Lu: 174.97, Hf: 178.49, Ta: 180.95, W: 183.84,
  Re: 186.21, Os: 190.23, Ir: 192.22, Pt: 195.08, Au: 196.97, Hg: 200.59, Tl: 204.38, Pb: 207.2, Bi: 208.98, Po: 209,
  At: 210, Rn: 222, Fr: 223, Ra: 226, Ac: 227, Th: 232.04, Pa: 231.04, U: 238.03, Np: 237, Pu: 244,
  Am: 243, Cm: 247, Bk: 247, Cf: 251, Es: 252, Fm: 257, Md: 258, No: 259, Lr: 262,
  Rf: 267, Db: 268, Sg: 269, Bh: 270, Hs: 270, Mt: 278, Ds: 281, Rg: 281, Cn: 285,
  Nh: 286, Fl: 289, Mc: 289, Lv: 293, Ts: 294, Og: 294
});

export const GAS_R = 8.314;
export const KW_25C = 1e-14;

export function calcError(message, status = 400, code = 'invalid_request') {
  const err = new Error(message);
  err.status = status;
  err.code = code;
  return err;
}

export function formatSig(n, sig = 4) {
  if (!Number.isFinite(n)) return null;
  if (n === 0) return '0';
  const abs = Math.abs(n);
  if (abs >= 1e5 || abs < 1e-3) return n.toExponential(sig - 1);
  return Number(n.toPrecision(sig)).toString();
}

export function parseFormula(raw) {
  const source = String(raw == null ? '' : raw).trim();
  if (!source) throw calcError('formula is required');
  if (source.length > 200) throw calcError('formula is too long');
  const s = source.replace(/\s+/g, '').replace(/[·•*]/g, '+');
  const stack = [{}];
  let i = 0;
  while (i < s.length) {
    const ch = s[i];
    if (ch === '(' || ch === '[') {
      stack.push({});
      i += 1;
    } else if (ch === ')' || ch === ']') {
      i += 1;
      let mult = '';
      while (i < s.length && /\d/.test(s[i])) {
        mult += s[i];
        i += 1;
      }
      const m = parseInt(mult || '1', 10);
      if (!Number.isFinite(m) || m < 1) throw calcError('invalid formula multiplier');
      if (stack.length < 2) throw calcError('unbalanced parentheses');
      const top = stack.pop();
      const parent = stack[stack.length - 1];
      for (const key of Object.keys(top)) {
        parent[key] = (parent[key] || 0) + top[key] * m;
      }
    } else if (ch === '+') {
      i += 1;
      let pre = '';
      while (i < s.length && /\d/.test(s[i])) {
        pre += s[i];
        i += 1;
      }
      const mult = parseInt(pre || '1', 10);
      let depth = 0;
      let j = i;
      while (j < s.length && !(s[j] === '+' && depth === 0)) {
        if (s[j] === '(' || s[j] === '[') depth += 1;
        else if (s[j] === ')' || s[j] === ']') depth -= 1;
        j += 1;
      }
      const sub = parseFormula(s.slice(i, j));
      const parent = stack[stack.length - 1];
      for (const key of Object.keys(sub)) {
        parent[key] = (parent[key] || 0) + sub[key] * mult;
      }
      i = j;
    } else if (/[A-Z]/.test(ch)) {
      let sym = ch;
      i += 1;
      while (i < s.length && /[a-z]/.test(s[i])) {
        sym += s[i];
        i += 1;
      }
      let count = '';
      while (i < s.length && /\d/.test(s[i])) {
        count += s[i];
        i += 1;
      }
      const c = parseInt(count || '1', 10);
      if (!Number.isFinite(c) || c < 1) throw calcError('invalid atom count');
      const top = stack[stack.length - 1];
      top[sym] = (top[sym] || 0) + c;
    } else {
      i += 1;
    }
  }
  if (stack.length !== 1) throw calcError('unbalanced parentheses');
  const counts = stack[0];
  if (!Object.keys(counts).length) throw calcError('could not parse formula');
  return counts;
}

export function molarMassFromCounts(counts) {
  const rows = [];
  const unknown = [];
  let total = 0;
  let atomCount = 0;
  for (const sym of Object.keys(counts)) {
    const n = counts[sym];
    atomCount += n;
    const mass = ATOMIC_WEIGHTS[sym];
    if (mass == null) {
      unknown.push(sym);
      continue;
    }
    const contribution = mass * n;
    total += contribution;
    rows.push({ symbol: sym, count: n, atomicMass: mass, contribution, massPercent: null });
  }
  rows.sort((a, b) => b.contribution - a.contribution);
  for (const row of rows) {
    row.massPercent = total > 0 ? (row.contribution / total) * 100 : 0;
  }
  return { molarMass: total, atomCount, composition: rows, unknown };
}

export function molarMassOf(formula) {
  const counts = parseFormula(formula);
  const result = molarMassFromCounts(counts);
  if (result.unknown.length) {
    throw calcError(`unknown symbols: ${result.unknown.join(', ')}`);
  }
  return { formula: String(formula).trim(), counts, ...result };
}

function requirePositive(value, field) {
  const n = Number(value);
  if (!Number.isFinite(n) || n <= 0) throw calcError(`${field} must be a positive number`);
  return n;
}

function optionalNumber(value) {
  if (value == null || value === '') return null;
  const n = Number(value);
  return Number.isFinite(n) ? n : null;
}

export function solveDilution(input = {}) {
  const solve = String(input.solve || 'V2').trim();
  const C1 = optionalNumber(input.C1);
  const V1 = optionalNumber(input.V1);
  const C2 = optionalNumber(input.C2);
  const V2 = optionalNumber(input.V2);
  let value;
  if (solve === 'C1') {
    if (![V1, C2, V2].every(Number.isFinite)) throw calcError('V1, C2 and V2 are required');
    value = (C2 * V2) / V1;
  } else if (solve === 'V1') {
    if (![C1, C2, V2].every(Number.isFinite)) throw calcError('C1, C2 and V2 are required');
    value = (C2 * V2) / C1;
  } else if (solve === 'C2') {
    if (![C1, V1, V2].every(Number.isFinite)) throw calcError('C1, V1 and V2 are required');
    value = (C1 * V1) / V2;
  } else if (solve === 'V2') {
    if (![C1, V1, C2].every(Number.isFinite)) throw calcError('C1, V1 and C2 are required');
    value = (C1 * V1) / C2;
  } else {
    throw calcError('invalid dilution unknown');
  }
  if (!Number.isFinite(value)) throw calcError('dilution could not be solved');
  const out = {
    solve,
    C1: solve === 'C1' ? value : C1,
    V1: solve === 'V1' ? value : V1,
    C2: solve === 'C2' ? value : C2,
    V2: solve === 'V2' ? value : V2,
    solved: value,
    unit: solve === 'C1' || solve === 'C2' ? 'mol/L' : 'mL',
    equation: 'C1V1 = C2V2'
  };
  if (Number.isFinite(out.C1) && Number.isFinite(out.C2) && out.C2 !== 0) {
    out.dilutionFactor = out.C1 / out.C2;
  }
  return out;
}

function toPascals(v, u) {
  if (u === 'Pa') return v;
  if (u === 'kPa') return v * 1000;
  if (u === 'atm') return v * 101325;
  if (u === 'mmHg') return v * 133.322;
  return v;
}

function fromPascals(v, u) {
  if (u === 'Pa') return v;
  if (u === 'kPa') return v / 1000;
  if (u === 'atm') return v / 101325;
  if (u === 'mmHg') return v / 133.322;
  return v;
}

function toM3(v, u) {
  if (u === 'L') return v / 1000;
  if (u === 'mL') return v / 1e6;
  if (u === 'm3') return v;
  return v;
}

function fromM3(v, u) {
  if (u === 'L') return v * 1000;
  if (u === 'mL') return v * 1e6;
  if (u === 'm3') return v;
  return v;
}

function toK(v, u) {
  if (u === 'K') return v;
  if (u === 'C') return v + 273.15;
  if (u === 'F') return ((v - 32) * 5) / 9 + 273.15;
  return v;
}

function fromK(v, u) {
  if (u === 'K') return v;
  if (u === 'C') return v - 273.15;
  if (u === 'F') return ((v - 273.15) * 9) / 5 + 32;
  return v;
}

export function solveIdealGas(input = {}) {
  const solve = String(input.solve || 'V').trim();
  const P = optionalNumber(input.P);
  const V = optionalNumber(input.V);
  const n = optionalNumber(input.n);
  const T = optionalNumber(input.T);
  const Pu = String(input.PUnit || 'atm');
  const Vu = String(input.VUnit || 'L');
  const Tu = String(input.TUnit || 'K');
  const Ppa = P == null ? null : toPascals(P, Pu);
  const Vm3 = V == null ? null : toM3(V, Vu);
  const Tk = T == null ? null : toK(T, Tu);
  if (Tk != null && !(Tk > 0)) throw calcError('temperature must be above absolute zero');
  let SI;
  let display;
  let displayUnit;
  if (solve === 'P') {
    if (![Vm3, n, Tk].every(Number.isFinite)) throw calcError('V, n and T are required');
    if (Vm3 === 0) throw calcError('volume must be non-zero');
    SI = (n * GAS_R * Tk) / Vm3;
    display = fromPascals(SI, Pu);
    displayUnit = Pu;
  } else if (solve === 'V') {
    if (![Ppa, n, Tk].every(Number.isFinite)) throw calcError('P, n and T are required');
    if (Ppa === 0) throw calcError('pressure must be non-zero');
    SI = (n * GAS_R * Tk) / Ppa;
    display = fromM3(SI, Vu);
    displayUnit = Vu;
  } else if (solve === 'n') {
    if (![Ppa, Vm3, Tk].every(Number.isFinite)) throw calcError('P, V and T are required');
    if (Tk === 0) throw calcError('temperature must be non-zero');
    SI = (Ppa * Vm3) / (GAS_R * Tk);
    display = SI;
    displayUnit = 'mol';
  } else if (solve === 'T') {
    if (![Ppa, Vm3, n].every(Number.isFinite)) throw calcError('P, V and n are required');
    if (n === 0) throw calcError('amount must be non-zero');
    SI = (Ppa * Vm3) / (n * GAS_R);
    display = fromK(SI, Tu);
    displayUnit = Tu;
  } else {
    throw calcError('invalid ideal-gas unknown');
  }
  if (!Number.isFinite(display)) throw calcError('ideal gas could not be solved');
  return {
    solve,
    solved: display,
    unit: displayUnit,
    P: solve === 'P' ? display : P,
    V: solve === 'V' ? display : V,
    n: solve === 'n' ? display : n,
    T: solve === 'T' ? display : T,
    PUnit: Pu,
    VUnit: Vu,
    TUnit: Tu,
    R: GAS_R,
    equation: 'PV = nRT'
  };
}

export function solvePH(input = {}) {
  const mode = String(input.mode || 'pH').trim();
  let H;
  let OH;
  let pH;
  let pOH;
  if (mode === 'H') {
    H = requirePositive(input.H, '[H+]');
    pH = -Math.log10(H);
    pOH = 14 - pH;
    OH = 10 ** -pOH;
  } else if (mode === 'OH') {
    OH = requirePositive(input.OH, '[OH-]');
    pOH = -Math.log10(OH);
    pH = 14 - pOH;
    H = 10 ** -pH;
  } else if (mode === 'pH') {
    pH = Number(input.pH);
    if (!Number.isFinite(pH)) throw calcError('pH is required');
    pOH = 14 - pH;
    H = 10 ** -pH;
    OH = 10 ** -pOH;
  } else if (mode === 'pOH') {
    pOH = Number(input.pOH);
    if (!Number.isFinite(pOH)) throw calcError('pOH is required');
    pH = 14 - pOH;
    H = 10 ** -pH;
    OH = 10 ** -pOH;
  } else {
    throw calcError('invalid pH mode');
  }
  let nature = 'neutral';
  if (pH < 6.8) nature = 'acidic';
  else if (pH > 7.2) nature = 'basic';
  return {
    mode,
    pH,
    pOH,
    H,
    OH,
    nature,
    Kw: KW_25C,
    temperatureC: 25,
    equation: 'Kw = [H+][OH-] = 1.0e-14 · pH + pOH = 14'
  };
}

export const CALCULATORS = ['molar_mass', 'dilution', 'ideal_gas', 'ph'];
export const MAX_MOLAR_FORMULAS = 25;
export const MAX_SCENARIOS = 8;

function scenarioLabel(raw, index) {
  const text = String(raw == null ? '' : raw).trim();
  if (!text) return `Scenario ${index + 1}`;
  return text.slice(0, 40);
}

export function runProCalculation(body = {}) {
  const calculator = String(body.calculator || '').trim();
  if (!CALCULATORS.includes(calculator)) {
    throw calcError('calculator is not supported in Pro Lab batch mode');
  }
  if (calculator === 'molar_mass') {
    const formulas = Array.isArray(body.formulas) ? body.formulas : [];
    if (!formulas.length) throw calcError('at least one formula is required');
    if (formulas.length > MAX_MOLAR_FORMULAS) {
      throw calcError(`at most ${MAX_MOLAR_FORMULAS} formulas per session`);
    }
    return {
      calculator,
      results: formulas.map((entry, index) => {
        const formula = typeof entry === 'string' ? entry : entry?.formula;
        const label = scenarioLabel(typeof entry === 'object' ? entry.label : '', index);
        const computed = molarMassOf(formula);
        return {
          label,
          formula: computed.formula,
          molarMass: computed.molarMass,
          molarMassDisplay: formatSig(computed.molarMass, 5),
          unit: 'g/mol',
          atomCount: computed.atomCount,
          composition: computed.composition.map((row) => ({
            symbol: row.symbol,
            count: row.count,
            massPercent: Number(row.massPercent.toFixed(2)),
            contribution: row.contribution
          }))
        };
      })
    };
  }

  const scenarios = Array.isArray(body.scenarios) ? body.scenarios : [];
  if (!scenarios.length) throw calcError('at least one scenario is required');
  if (scenarios.length > MAX_SCENARIOS) {
    throw calcError(`at most ${MAX_SCENARIOS} scenarios per session`);
  }
  return {
    calculator,
    results: scenarios.map((scenario, index) => {
      const label = scenarioLabel(scenario?.label, index);
      if (calculator === 'dilution') {
        return { label, ...solveDilution(scenario) };
      }
      if (calculator === 'ideal_gas') {
        return { label, ...solveIdealGas(scenario) };
      }
      return { label, ...solvePH(scenario) };
    })
  };
}
