/* Pure calculator checks. No DOM. */
(function (root, factory) {
  var api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  root.AtomurusCalcCore = api;
})(typeof globalThis !== 'undefined' ? globalThis : this, function () {
  var KW = 1e-14;
  var NEUTRAL_EPS = 0.005;
  var NUMBER_ABS_MAX = 1e12;
  var ABS_ZERO_K = 0;
  var ABS_ZERO_C = -273.15;
  var ABS_ZERO_F = -459.67;
  var DH_SUSPECT_J_THRESHOLD = 5000;
  var DILUTION_STRICT = true;
  var R_IDEAL = 8.314;

  var UNITS = {
    pressure: ['Pa', 'kPa', 'atm', 'mmHg'],
    volume: ['L', 'mL', 'm3'],
    temperature: ['K', 'C', 'F']
  };

  var UNIT_CATEGORIES = {
    mass: { linear: true, units: { ng: 1e-9, 'µg': 1e-6, mg: 1e-3, g: 1, kg: 1e3, t: 1e6, lb: 453.59237, oz: 28.349523125 } },
    volume: { linear: true, units: { 'µL': 1e-6, mL: 1e-3, 'cm³': 1e-3, L: 1, 'm³': 1e3, 'fl oz': 0.0295735295625, pt: 0.473176473, qt: 0.946352946, 'gal (US)': 3.785411784, 'in³': 0.016387064 } },
    pressure: { linear: true, units: { Pa: 1, hPa: 1e2, kPa: 1e3, MPa: 1e6, bar: 1e5, atm: 101325, mmHg: 133.322387415, Torr: 133.322387415, psi: 6894.757293168 } },
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
    if (u === 'atm') return v * 101325;
    if (u === 'mmHg') return v * 133.322;
    return null;
  }
  function fromPascals(v, u) {
    if (u === 'Pa') return v;
    if (u === 'kPa') return v / 1000;
    if (u === 'atm') return v / 101325;
    if (u === 'mmHg') return v / 133.322;
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
    if (u === 'C') return v + 273.15;
    if (u === 'F') return (v - 32) * 5 / 9 + 273.15;
    return null;
  }
  function fromK(v, u) {
    if (u === 'K') return v;
    if (u === 'C') return v - 273.15;
    if (u === 'F') return (v - 273.15) * 9 / 5 + 32;
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
    if (unit === '°C') return value + 273.15;
    if (unit === '°F') return (value + 459.67) * 5 / 9;
    return null;
  }
  function kelvinTo(kelvin, unit) {
    if (unit === 'K') return kelvin;
    if (unit === '°C') return kelvin - 273.15;
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
    classifyPH: classifyPH
  };
});
