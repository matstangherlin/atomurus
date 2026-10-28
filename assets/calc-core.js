/* Pure calculator checks. No DOM. */
(function (root, factory) {
  // Physical constants come from assets/data/physical-constants.js, loaded
  // first by the page (window.AtomurusConstants) or required here in Node.
  var phys = root.AtomurusConstants ||
    (typeof module === 'object' && module.exports ? require('./data/physical-constants.js') : null);
  var api = factory(phys);
  if (typeof module === 'object' && module.exports) module.exports = api;
  root.AtomurusCalcCore = api;
})(typeof globalThis !== 'undefined' ? globalThis : this, function (PHYS) {
  var KW = PHYS.Kw25;
  var NEUTRAL_EPS = 0.005;
  var NUMBER_ABS_MAX = 1e12;
  var ABS_ZERO_K = 0;
  var ABS_ZERO_C = -PHYS.T0;
  var ABS_ZERO_F = -459.67;
  var DH_SUSPECT_J_THRESHOLD = 5000;
  var DILUTION_STRICT = true;
  var R_IDEAL = PHYS.R;

  var UNITS = {
    pressure: ['Pa', 'kPa', 'atm', 'mmHg'],
    volume: ['L', 'mL', 'm3'],
    temperature: ['K', 'C', 'F']
  };

  var UNIT_CATEGORIES = {
    mass: { linear: true, units: { ng: 1e-9, 'µg': 1e-6, mg: 1e-3, g: 1, kg: 1e3, t: 1e6, lb: 453.59237, oz: 28.349523125 } },
    volume: { linear: true, units: { 'µL': 1e-6, mL: 1e-3, 'cm³': 1e-3, L: 1, 'm³': 1e3, 'fl oz': 0.0295735295625, pt: 0.473176473, qt: 0.946352946, 'gal (US)': 3.785411784, 'in³': 0.016387064 } },
    pressure: { linear: true, units: { Pa: 1, hPa: 1e2, kPa: 1e3, MPa: 1e6, bar: PHYS.bar, atm: PHYS.atm, mmHg: PHYS.mmHg, Torr: PHYS.torr, psi: 6894.757293168 } },
    temperature: { linear: false },
    energy: { linear: true, units: { J: 1, kJ: 1e3, MJ: 1e6, cal: 4.184, kcal: 4184, Wh: 3600, kWh: 3.6e6, eV: 1.602176634e-19 } },
    amount: { linear: true, units: { 'µmol': 1e-6, mmol: 1e-3, mol: 1, kmol: 1e3 } },
    concentration: { linear: true, units: { 'µM': 1e-6, mM: 1e-3, M: 1, 'mol/L': 1 } }
  };
  var UNIT_TEMP = ['K', '°C', '°F'];
  var NON_NEGATIVE = { mass: 1, volume: 1, pressure: 1, amount: 1, concentration: 1 };

  function ok(warnings) {
    return { ok: true, warnings: warnings || [] };
  }
  function bad(code, field) {
    return { ok: false, code: code, field: field };
  }
  function listed(list, unit) {
    return list.indexOf(unit) !== -1;
  }
  function positiveBounded(n) {
    return typeof n === 'number' && Number.isFinite(n) && n > 0 && n <= NUMBER_ABS_MAX;
  }

  function toPascals(v, u) {
    if (u === 'Pa') return v;
    if (u === 'kPa') return v * 1000;
    if (u === 'atm') return v * PHYS.atm;
    if (u === 'mmHg') return v * PHYS.mmHg;
    return null;
  }
  function fromPascals(v, u) {
    if (u === 'Pa') return v;
    if (u === 'kPa') return v / 1000;
    if (u === 'atm') return v / PHYS.atm;
    if (u === 'mmHg') return v / PHYS.mmHg;
    return null;
  }
  function toM3(v, u) {
    if (u === 'L') return v / 1000;
    if (u === 'mL') return v / 1e6;
    if (u === 'm3') return v;
    return null;
  }
  function fromM3(v, u) {
    if (u === 'L') return v * 1000;
    if (u === 'mL') return v * 1e6;
    if (u === 'm3') return v;
    return null;
  }
  function toK(v, u) {
    if (u === 'K') return v;
    if (u === 'C') return v + PHYS.T0;
    if (u === 'F') return (v - 32) * 5 / 9 + PHYS.T0;
    return null;
  }
  function fromK(v, u) {
    if (u === 'K') return v;
    if (u === 'C') return v - PHYS.T0;
    if (u === 'F') return (v - PHYS.T0) * 9 / 5 + 32;
    return null;
  }

  function validateIdeal(input) {
    input = input || {};
    var solve = input.solve;
    if (!listed(['P', 'V', 'n', 'T'], solve)) return bad('igUnknownUnit', 'ig-solve');
    if (!listed(UNITS.pressure, input.Pu)) return bad('igUnknownUnit', 'ig-P-u');
    if (!listed(UNITS.volume, input.Vu)) return bad('igUnknownUnit', 'ig-V-u');
    if (!listed(UNITS.temperature, input.Tu)) return bad('igUnknownUnit', 'ig-T-u');
    var fields = [
      ['P', 'ig-P', input.P],
      ['V', 'ig-V', input.V],
      ['n', 'ig-n', input.n],
      ['T', 'ig-T', input.T]
    ];
    for (var i = 0; i < fields.length; i += 1) {
      if (fields[i][0] === solve) continue;
      if (!positiveBounded(fields[i][2])) return bad('igInvalidPositive', fields[i][1]);
    }
    if (solve === 'T' && input.resultK != null && !(input.resultK > ABS_ZERO_K)) {
      return bad('igInvalidPositive', 'ig-T');
    }
    return ok();
  }

  function validateDilution(input) {
    input = input || {};
    var solve = input.solve;
    var names = ['C1', 'V1', 'C2', 'V2'];
    var ids = { C1: 'dl-C1', V1: 'dl-V1', C2: 'dl-C2', V2: 'dl-V2' };
    if (!listed(names, solve)) return bad('dlInvalidPositive', 'dl-solve');
    for (var i = 0; i < names.length; i += 1) {
      var key = names[i];
      if (key === solve && input.phase !== 'result') continue;
      if (!positiveBounded(input[key])) return bad('dlInvalidPositive', ids[key]);
    }
    if (input.phase === 'result' && (input.C2 > input.C1 || input.V2 < input.V1)) {
      if (DILUTION_STRICT) return bad('dilutionNotDilution', 'dl-C2');
      return ok(['dilutionNotDilution']);
    }
    return ok();
  }

  function tempToKelvin(value, unit) {
    if (unit === 'K') return value;
    if (unit === '°C') return value + PHYS.T0;
    if (unit === '°F') return (value + 459.67) * 5 / 9;
    return null;
  }
  function kelvinTo(kelvin, unit) {
    if (unit === 'K') return kelvin;
    if (unit === '°C') return kelvin - PHYS.T0;
    if (unit === '°F') return kelvin * 9 / 5 - 459.67;
    return null;
  }

  function validateUnitConversion(input) {
    input = input || {};
    var cat = input.cat;
    var def = UNIT_CATEGORIES[cat];
    if (!def) return bad('ucInvalid', 'uc-cat');
    var value = input.value;
    if (typeof value !== 'number' || !Number.isFinite(value)) return bad('ucInvalid', 'uc-value');
    if (Math.abs(value) > NUMBER_ABS_MAX) return bad('ucInvalid', 'uc-value');
    if (def.linear) {
      if (!Object.prototype.hasOwnProperty.call(def.units, input.from)) return bad('ucInvalid', 'uc-from');
      if (!Object.prototype.hasOwnProperty.call(def.units, input.to)) return bad('ucInvalid', 'uc-to');
      if (NON_NEGATIVE[cat] && value < 0) return bad('ucNegativeNotAllowed', 'uc-value');
      return ok();
    }
    if (UNIT_TEMP.indexOf(input.from) === -1) return bad('ucInvalid', 'uc-from');
    if (UNIT_TEMP.indexOf(input.to) === -1) return bad('ucInvalid', 'uc-to');
    var kelvin = tempToKelvin(value, input.from);
    if (kelvin == null || kelvin < -1e-9) return bad('ucBelowAbsZero', 'uc-value');
    return ok();
  }

  function convertUnit(input) {
    var check = validateUnitConversion(input);
    if (!check.ok) return check;
    var def = UNIT_CATEGORIES[input.cat];
    var out;
    if (def.linear) out = input.value * def.units[input.from] / def.units[input.to];
    else out = kelvinTo(tempToKelvin(input.value, input.from), input.to);
    if (typeof out !== 'number' || !Number.isFinite(out)) return bad('ucInvalid', 'uc-value');
    return { ok: true, warnings: [], value: out };
  }

  function formatUnit(n) {
    if (!Number.isFinite(n)) return '';
    if (n === 0) return '0';
    var abs = Math.abs(n);
    if (abs >= 1e-4 && abs < 1e9) return Number(n.toPrecision(6)).toString();
    return n.toExponential(5);
  }

  function validateThermo(input) {
    input = input || {};
    var unit = input.TUnit;
    if (unit !== 'C' && unit !== 'K') return bad('tmInvalid', 'tm-t-unit');
    if (typeof input.dh !== 'number' || !Number.isFinite(input.dh)) return bad('tmInvalid', 'tm-dh');
    if (typeof input.ds !== 'number' || !Number.isFinite(input.ds)) return bad('tmInvalid', 'tm-ds');
    if (typeof input.T !== 'number' || !Number.isFinite(input.T)) return bad('tmInvalid', 'tm-t');
    if (Math.abs(input.dh) > NUMBER_ABS_MAX || Math.abs(input.ds) > NUMBER_ABS_MAX || Math.abs(input.T) > NUMBER_ABS_MAX) {
      return bad('tmInvalid', 'tm-t');
    }
    if (unit === 'K' && !(input.T > ABS_ZERO_K)) return bad('ucBelowAbsZero', 'tm-t');
    if (unit === 'C' && !(input.T > ABS_ZERO_C)) return bad('ucBelowAbsZero', 'tm-t');
    var warnings = [];
    if (Math.abs(input.dh) >= DH_SUSPECT_J_THRESHOLD) warnings.push('tmDhLooksLikeJoules');
    return ok(warnings);
  }

  function computePH(input) {
    input = input || {};
    var mode = input.mode;
    var value = input.value;
    if (typeof value !== 'number' || !Number.isFinite(value)) return { ok: false, code: 'positiveNum' };
    var H;
    var OH;
    var pH;
    var pOH;
    var autoion = false;
    if (mode === 'H' || mode === 'OH') {
      if (!(value > 0) || value > NUMBER_ABS_MAX) return { ok: false, code: 'positiveNum' };
      var strong = (value + Math.sqrt(value * value + 4 * KW)) / 2;
      autoion = value < 1e-6;
      if (mode === 'H') {
        H = strong;
        OH = KW / H;
      } else {
        OH = strong;
        H = KW / OH;
      }
      pH = -Math.log10(H);
      pOH = -Math.log10(OH);
    } else if (mode === 'pH' || mode === 'pOH') {
      if (mode === 'pH') {
        pH = value;
        pOH = 14 - pH;
      } else {
        pOH = value;
        pH = 14 - pOH;
      }
      H = Math.pow(10, -pH);
      OH = Math.pow(10, -pOH);
    } else {
      return { ok: false, code: 'positiveNum' };
    }
    if (![pH, pOH, H, OH].every(Number.isFinite)) return { ok: false, code: 'positiveNum' };
    return { ok: true, pH: pH, pOH: pOH, H: H, OH: OH, autoion: autoion };
  }

  /* Acid–base constants at 25 °C for the weak-acid, weak-base and buffer modes.
     Only values checked against a source are listed: CRC Handbook of Chemistry
     and Physics, 84th ed. (2004), as tabulated in OpenStax «Introductory
     Chemistry», Appendix B (acids) and the matching table of weak bases;
     the bases also agree with McQuarrie, Appendix E (CRC, 87th ed.). Left out
     until a teacher confirms them: lactic acid (3.85 or 3.86 by edition),
     hypochlorous acid (7.40 or 7.53 by edition), phosphoric pKa3. */
  var ACID_BASE_SOURCE = 'CRC Handbook of Chemistry and Physics, 84th ed. (2004), via OpenStax Introductory Chemistry, Appendix B';
  var ACID_BASE_CONSTANTS = [
    { id: 'acetic', kind: 'acid', name: { pt: 'Ácido acético', en: 'Acetic acid' }, formula: 'CH₃COOH', pKa: [4.756], T: 25, conjugate: { pt: 'acetato', en: 'acetate' }, source: ACID_BASE_SOURCE },
    { id: 'formic', kind: 'acid', name: { pt: 'Ácido fórmico', en: 'Formic acid' }, formula: 'HCOOH', pKa: [3.75], T: 25, conjugate: { pt: 'formiato', en: 'formate' }, source: ACID_BASE_SOURCE },
    { id: 'benzoic', kind: 'acid', name: { pt: 'Ácido benzoico', en: 'Benzoic acid' }, formula: 'C₆H₅COOH', pKa: [4.204], T: 25, conjugate: { pt: 'benzoato', en: 'benzoate' }, source: ACID_BASE_SOURCE },
    { id: 'hydrofluoric', kind: 'acid', name: { pt: 'Ácido fluorídrico', en: 'Hydrofluoric acid' }, formula: 'HF', pKa: [3.20], T: 25, conjugate: { pt: 'fluoreto', en: 'fluoride' }, source: ACID_BASE_SOURCE },
    { id: 'carbonic', kind: 'acid', name: { pt: 'Ácido carbônico', en: 'Carbonic acid' }, formula: 'H₂CO₃', pKa: [6.35, 10.33], T: 25, conjugate: { pt: 'bicarbonato', en: 'bicarbonate' }, source: ACID_BASE_SOURCE },
    { id: 'phosphoric', kind: 'acid', name: { pt: 'Ácido fosfórico', en: 'Phosphoric acid' }, formula: 'H₃PO₄', pKa: [2.16, 7.21], T: 25, conjugate: { pt: 'di-hidrogenofosfato', en: 'dihydrogen phosphate' }, source: ACID_BASE_SOURCE },
    { id: 'ammonia', kind: 'base', name: { pt: 'Amônia', en: 'Ammonia' }, formula: 'NH₃', pKb: 4.75, T: 25, conjugate: { pt: 'amônio', en: 'ammonium' }, source: 'CRC Handbook, 84th ed. (2004), via OpenStax; McQuarrie, Appendix E (CRC, 87th ed.)' },
    { id: 'methylamine', kind: 'base', name: { pt: 'Metilamina', en: 'Methylamine' }, formula: 'CH₃NH₂', pKb: 3.34, T: 25, conjugate: { pt: 'metilamônio', en: 'methylammonium' }, source: 'CRC Handbook, 84th ed. (2004), via OpenStax; McQuarrie, Appendix E (CRC, 87th ed.)' },
    { id: 'pyridine', kind: 'base', name: { pt: 'Piridina', en: 'Pyridine' }, formula: 'C₅H₅N', pKb: 8.77, T: 25, conjugate: { pt: 'piridínio', en: 'pyridinium' }, source: 'McQuarrie, Appendix E (CRC, 87th ed.)' }
  ];
  var WEAK_C_MAX = 20;
  var BUFFER_RATIO_MIN = 0.1;
  var BUFFER_RATIO_MAX = 10;
  var BUFFER_C_MIN = 1e-3;

  /* f(h) is increasing in h; solve it on a log scale by bisection. */
  function solveLog(f) {
    var lo = -20;
    var hi = 2;
    for (var i = 0; i < 200; i += 1) {
      var mid = (lo + hi) / 2;
      if (f(Math.pow(10, mid)) > 0) hi = mid;
      else lo = mid;
    }
    return Math.pow(10, (lo + hi) / 2);
  }

  function constantFrom(input, name) {
    var K = input[name];
    var pK = input['p' + name];
    if (typeof K === 'number' && Number.isFinite(K) && K > 0) return K;
    if (typeof pK === 'number' && Number.isFinite(pK) && pK > -2 && pK < 16) return Math.pow(10, -pK);
    return null;
  }

  function phResult(H, extra) {
    var OH = KW / H;
    var out = { ok: true, pH: -Math.log10(H), pOH: -Math.log10(OH), H: H, OH: OH };
    Object.keys(extra || {}).forEach(function (k) { out[k] = extra[k]; });
    return out;
  }

  /* Weak monoprotic acid HA at C mol/L, from the full charge balance
     [H⁺] = [A⁻] + [OH⁻] with [A⁻] = C·Ka/(Ka + [H⁺]): water's autoionization
     is included, nothing is approximated. The textbook shortcut √(Ka·C) is
     reported next to it, with how far it is off. */
  function computeWeakAcidPH(input) {
    input = input || {};
    var C = input.C;
    var Ka = constantFrom(input, 'Ka');
    if (!positiveBounded(C) || C > WEAK_C_MAX) return { ok: false, code: 'positiveNum', field: 'C' };
    if (Ka == null) return { ok: false, code: 'positiveNum', field: 'Ka' };
    var H = solveLog(function (h) { return h - C * Ka / (Ka + h) - KW / h; });
    var shortcut = Math.sqrt(Ka * C);
    var warnings = [];
    if (C < 1e-5) warnings.push('autoion');
    if (input.polyprotic) warnings.push('polyproticApprox');
    return phResult(H, {
      Ka: Ka,
      pKa: -Math.log10(Ka),
      C: C,
      alpha: (C * Ka / (Ka + H)) / C,
      shortcutPH: -Math.log10(shortcut),
      shortcutOff: Math.abs(-Math.log10(shortcut) + Math.log10(H)),
      warnings: warnings
    });
  }

  /* Weak base B at C mol/L: [OH⁻] = [BH⁺] + [H⁺], [BH⁺] = C·Kb/(Kb + [OH⁻]). */
  function computeWeakBasePH(input) {
    input = input || {};
    var C = input.C;
    var Kb = constantFrom(input, 'Kb');
    if (!positiveBounded(C) || C > WEAK_C_MAX) return { ok: false, code: 'positiveNum', field: 'C' };
    if (Kb == null) return { ok: false, code: 'positiveNum', field: 'Kb' };
    var OH = solveLog(function (oh) { return oh - C * Kb / (Kb + oh) - KW / oh; });
    var shortcut = Math.sqrt(Kb * C);
    var warnings = [];
    if (C < 1e-5) warnings.push('autoion');
    return phResult(KW / OH, {
      Kb: Kb,
      pKb: -Math.log10(Kb),
      C: C,
      alpha: (C * Kb / (Kb + OH)) / C,
      shortcutPH: 14 + Math.log10(shortcut),
      shortcutOff: Math.abs(14 + Math.log10(shortcut) - (14 + Math.log10(OH))),
      warnings: warnings
    });
  }

  /* Buffer of a weak acid (Ca) and its conjugate base as the sodium salt (Cb).
     Henderson–Hasselbalch, pH = pKa + log(Cb/Ca), is the answer shown; the
     exact charge balance [H⁺] + [Na⁺] = [A⁻] + [OH⁻] is solved too, and a
     warning appears when they part (ratio outside 0.1–10, very dilute). */
  function computeBufferPH(input) {
    input = input || {};
    var Ca = input.acid;
    var Cb = input.base;
    var Ka = constantFrom(input, 'Ka');
    if (!positiveBounded(Ca) || Ca > WEAK_C_MAX) return { ok: false, code: 'positiveNum', field: 'acid' };
    if (!positiveBounded(Cb) || Cb > WEAK_C_MAX) return { ok: false, code: 'positiveNum', field: 'base' };
    if (Ka == null) return { ok: false, code: 'positiveNum', field: 'Ka' };
    var pKa = -Math.log10(Ka);
    var ratio = Cb / Ca;
    var hh = pKa + Math.log10(ratio);
    var total = Ca + Cb;
    var H = solveLog(function (h) { return h + Cb - total * Ka / (Ka + h) - KW / h; });
    var exact = -Math.log10(H);
    var warnings = [];
    if (ratio < BUFFER_RATIO_MIN || ratio > BUFFER_RATIO_MAX) warnings.push('bufferRange');
    if (Ca < BUFFER_C_MIN || Cb < BUFFER_C_MIN) warnings.push('bufferDilute');
    if (Math.abs(hh - exact) > 0.02) warnings.push('bufferApprox');
    if (input.polyprotic) warnings.push('polyproticApprox');
    /* Buffer capacity β = 2.303 (Kw/[H⁺] + [H⁺] + C·Ka·[H⁺]/(Ka + [H⁺])²), mol/(L·pH). */
    var beta = 2.303 * (KW / H + H + total * Ka * H / Math.pow(Ka + H, 2));
    var out = phResult(Math.pow(10, -hh), {
      Ka: Ka,
      pKa: pKa,
      ratio: ratio,
      exactPH: exact,
      beta: beta,
      warnings: warnings
    });
    return out;
  }

  function classifyPH(pH) {
    var acidic = '#B96B0C';
    var basic = '#2A4878';
    var neutral = '#1E6A50';
    if (typeof pH !== 'number' || !Number.isFinite(pH)) {
      return { key: 'neutral', tone: 'neutral', color: neutral };
    }
    if (Math.abs(pH - 7) <= NEUTRAL_EPS + 1e-9) return { key: 'neutral', tone: 'neutral', color: neutral };
    if (pH < 7) {
      if (pH >= 6) return { key: 'slightlyAcidic', tone: 'acidic', color: acidic };
      return { key: 'acidic', tone: 'acidic', color: acidic };
    }
    if (pH <= 8) return { key: 'slightlyBasic', tone: 'basic', color: basic };
    return { key: 'basic', tone: 'basic', color: basic };
  }

  return {
    KW: KW,
    NEUTRAL_EPS: NEUTRAL_EPS,
    NUMBER_ABS_MAX: NUMBER_ABS_MAX,
    ABS_ZERO_K: ABS_ZERO_K,
    ABS_ZERO_C: ABS_ZERO_C,
    ABS_ZERO_F: ABS_ZERO_F,
    DH_SUSPECT_J_THRESHOLD: DH_SUSPECT_J_THRESHOLD,
    DILUTION_STRICT: DILUTION_STRICT,
    R_IDEAL: R_IDEAL,
    UNITS: UNITS,
    UNIT_CATEGORIES: UNIT_CATEGORIES,
    UNIT_TEMP: UNIT_TEMP,
    toPascals: toPascals,
    fromPascals: fromPascals,
    toM3: toM3,
    fromM3: fromM3,
    toK: toK,
    fromK: fromK,
    validateIdeal: validateIdeal,
    validateDilution: validateDilution,
    validateUnitConversion: validateUnitConversion,
    convertUnit: convertUnit,
    formatUnit: formatUnit,
    validateThermo: validateThermo,
    computePH: computePH,
    ACID_BASE_CONSTANTS: ACID_BASE_CONSTANTS,
    ACID_BASE_SOURCE: ACID_BASE_SOURCE,
    BUFFER_RATIO_MIN: BUFFER_RATIO_MIN,
    BUFFER_RATIO_MAX: BUFFER_RATIO_MAX,
    computeWeakAcidPH: computeWeakAcidPH,
    computeWeakBasePH: computeWeakBasePH,
    computeBufferPH: computeBufferPH,
    classifyPH: classifyPH
  };
});
