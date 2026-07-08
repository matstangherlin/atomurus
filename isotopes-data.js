/* ─────────────────────────────────────────────────────────────
 * Atomurus — Isotope dataset (curated for vestibular/ensino médio)
 * ─────────────────────────────────────────────────────────────
 *
 * SCOPE
 *   • All 254 naturally-occurring stable isotopes (Z=1-92).
 *   • Famous radioactive isotopes cited in Brazilian chemistry curriculum
 *     (C-14, K-40, Co-60, Sr-90, Tc-99m, I-131, Cs-137, Po-210, Pu-239 etc.)
 *
 * SCHEMA (per isotope)
 *   a    — mass number (A = protons + neutrons)
 *   ab   — natural abundance as a fraction (0–1), or null if synthetic / cosmogenic-only
 *   hl   — half-life in seconds, or null for stable
 *   hlf  — display-formatted half-life ('stable', '5,730 y', '12.32 y', '8.02 d' …)
 *   dec  — array of decay modes (ISO codes: 'β-', 'β+', 'α', 'EC', 'γ', '2β-', 'SF', 'IT')
 *   prim — primordial flag (occurred at Earth's formation, still present)
 *
 * SOURCE & ACCURACY
 *   Values populated from training-data memory (mix of NUBASE-2020 / AME-2020 / IUPAC-2021).
 *   Adequate for vestibular/ensino-médio precision (no 5+ decimal demands).
 *   NOT to be cited in scientific publications — use IAEA NUBASE evaluations for that.
 *
 * UNITS HELPER — half-life seconds (for memory):
 *   1 year   ≈ 3.156e7  s
 *   1 day    =  86400   s
 *   1 hour   =  3600    s
 *   1 minute =  60      s
 *
 * ─────────────────────────────────────────────────────────── */

(function (root) {
  'use strict';

  // ───── time constants ─────
  const YEAR = 3.15576e7;
  const DAY  = 86400;
  const HOUR = 3600;

  // ───── helpers exposed for showIsotopes() ─────
  // Unicode superscripts for scientific notation (e.g. 22 → "²²"), used for the
  // astronomically long half-lives of "observationally stable" double-beta
  // isotopes (Xe-124 ≈ 1.8×10²² y, Te-128 ≈ 2×10²⁴ y …) where "Gy" would
  // overflow into an unreadable "1.80e+13 Gy".
  const _SUP = { '0':'⁰','1':'¹','2':'²','3':'³','4':'⁴','5':'⁵','6':'⁶','7':'⁷','8':'⁸','9':'⁹','-':'⁻' };
  function _superscript(n) {
    return String(n).split('').map(function (c) { return _SUP[c] || c; }).join('');
  }
  function _sciYears(years) {
    let exp  = Math.floor(Math.log10(years));
    let mant = years / Math.pow(10, exp);
    if (mant >= 9.95) { mant = 1; exp += 1; }   // 9.95×10ⁿ rounds up to 1×10ⁿ⁺¹
    const m = (mant % 1 === 0) ? mant.toFixed(0) : mant.toFixed(1);
    return m + ' × 10' + _superscript(exp) + ' y';
  }

  function formatHalfLife(seconds, fallbackLabel) {
    if (seconds == null) return fallbackLabel || 'stable';
    const y = seconds / YEAR;
    if (y >= 1e12) return _sciYears(y);                 // ≥ 1000 Gy → scientific years
    if (y >= 1e9)  return (y / 1e9).toPrecision(3) + ' Gy';
    if (y >= 1e6)  return (y / 1e6).toPrecision(3) + ' My';
    if (y >= 1e3)  return (y / 1e3).toPrecision(3) + ' ky';
    if (y >= 1)    return y.toPrecision(3) + ' y';
    const d = seconds / DAY;
    if (d >= 1)    return d.toPrecision(3) + ' d';
    const h = seconds / HOUR;
    if (h >= 1)    return h.toPrecision(3) + ' h';
    if (seconds >= 60) return (seconds / 60).toPrecision(3) + ' min';
    if (seconds >= 1)  return seconds.toPrecision(3) + ' s';
    if (seconds >= 1e-3) return (seconds * 1e3).toPrecision(3) + ' ms';
    if (seconds >= 1e-6) return (seconds * 1e6).toPrecision(3) + ' μs';
    return seconds.toExponential(2) + ' s';
  }

  function formatAbundance(fraction) {
    if (fraction == null) return null;          // null → caller substitutes a label like "Traces"
    const pct = fraction * 100;
    // Pretty-print: choose decimal places so it stays readable from 100% down to 0.0001%
    if (pct >= 10)    return pct.toFixed(3) + '%';   // e.g. "99.989%", "92.230%"
    if (pct >= 1)     return pct.toFixed(3) + '%';   // e.g. "1.070%"
    if (pct >= 0.01)  return pct.toFixed(4) + '%';   // e.g. "0.0115%", "0.3360%"
    if (pct >= 1e-4)  return pct.toFixed(6) + '%';   // e.g. "0.000137%"
    if (pct >= 1e-6)  return pct.toExponential(2) + '%';
    return 'trace';
  }

  // ───── DATASET ─────
  // Indexed by atomic number Z. Each value is an array of isotope objects.
  const ISOTOPES = {

    // H — Hydrogen
    1: [
      { a: 1, ab: 0.999885, hl: null, hlf: 'stable',  dec: [],     prim: true,  alias: 'Protium'    },
      { a: 2, ab: 0.000115, hl: null, hlf: 'stable',  dec: [],     prim: true,  alias: 'Deuterium'  },
      { a: 3, ab: null,     hl: 3.888e8, hlf: '12.32 y', dec: ['β-'], prim: false, alias: 'Tritium' }
    ],

    // He — Helium
    2: [
      { a: 3, ab: 1.37e-6,  hl: null, hlf: 'stable', dec: [], prim: true },
      { a: 4, ab: 0.99999863, hl: null, hlf: 'stable', dec: [], prim: true }
    ],

    // Li — Lithium
    3: [
      { a: 6, ab: 0.0759, hl: null, hlf: 'stable', dec: [], prim: true },
      { a: 7, ab: 0.9241, hl: null, hlf: 'stable', dec: [], prim: true }
    ],

    // Be — Beryllium  (monoisotopic stable; 10Be cosmogenic dating tool)
    4: [
      { a: 7,  ab: null, hl: 53.22 * DAY, hlf: '53.22 d', dec: ['EC'], prim: false },
      { a: 9,  ab: 1.0,  hl: null, hlf: 'stable', dec: [], prim: true },
      { a: 10, ab: null, hl: 1.387e6 * YEAR, hlf: '1.39 My', dec: ['β-'], prim: false }
    ],

    // B — Boron
    5: [
      { a: 10, ab: 0.199, hl: null, hlf: 'stable', dec: [], prim: true },
      { a: 11, ab: 0.801, hl: null, hlf: 'stable', dec: [], prim: true }
    ],

    // C — Carbon  (C-14 → radiocarbon dating)
    6: [
      { a: 12, ab: 0.9893, hl: null, hlf: 'stable', dec: [], prim: true },
      { a: 13, ab: 0.0107, hl: null, hlf: 'stable', dec: [], prim: true },
      { a: 14, ab: null,   hl: 5730 * YEAR, hlf: '5,730 y', dec: ['β-'], prim: false }
    ],

    // N — Nitrogen
    7: [
      { a: 14, ab: 0.99636, hl: null, hlf: 'stable', dec: [], prim: true },
      { a: 15, ab: 0.00364, hl: null, hlf: 'stable', dec: [], prim: true }
    ],

    // O — Oxygen
    8: [
      { a: 16, ab: 0.99757,  hl: null, hlf: 'stable', dec: [], prim: true },
      { a: 17, ab: 0.000381, hl: null, hlf: 'stable', dec: [], prim: true },
      { a: 18, ab: 0.002005, hl: null, hlf: 'stable', dec: [], prim: true }
    ],

    // F — Fluorine (monoisotopic)
    9: [
      { a: 19, ab: 1.0, hl: null, hlf: 'stable', dec: [], prim: true }
    ],

    // Ne — Neon
    10: [
      { a: 20, ab: 0.9048, hl: null, hlf: 'stable', dec: [], prim: true },
      { a: 21, ab: 0.0027, hl: null, hlf: 'stable', dec: [], prim: true },
      { a: 22, ab: 0.0925, hl: null, hlf: 'stable', dec: [], prim: true }
    ],

    // Na — Sodium (monoisotopic; 22Na is a positron tracer)
    11: [
      { a: 22, ab: null, hl: 2.602 * YEAR, hlf: '2.60 y', dec: ['β+','EC'], prim: false },
      { a: 23, ab: 1.0,  hl: null, hlf: 'stable', dec: [], prim: true }
    ],

    // Mg — Magnesium
    12: [
      { a: 24, ab: 0.7899, hl: null, hlf: 'stable', dec: [], prim: true },
      { a: 25, ab: 0.1000, hl: null, hlf: 'stable', dec: [], prim: true },
      { a: 26, ab: 0.1101, hl: null, hlf: 'stable', dec: [], prim: true }
    ],

    // Al — Aluminum (monoisotopic; 26Al cosmogenic chronometer)
    13: [
      { a: 26, ab: null, hl: 7.17e5 * YEAR, hlf: '717 ky', dec: ['β+'], prim: false },
      { a: 27, ab: 1.0,  hl: null, hlf: 'stable', dec: [], prim: true }
    ],

    // Si — Silicon
    14: [
      { a: 28, ab: 0.92223, hl: null, hlf: 'stable', dec: [], prim: true },
      { a: 29, ab: 0.04685, hl: null, hlf: 'stable', dec: [], prim: true },
      { a: 30, ab: 0.03092, hl: null, hlf: 'stable', dec: [], prim: true }
    ],

    // P — Phosphorus (monoisotopic; 32P used in molecular biology)
    15: [
      { a: 31, ab: 1.0,  hl: null, hlf: 'stable', dec: [], prim: true },
      { a: 32, ab: null, hl: 14.28 * DAY, hlf: '14.28 d', dec: ['β-'], prim: false }
    ],

    // S — Sulfur (4 stable; 35S used in biology)
    16: [
      { a: 32, ab: 0.9499, hl: null, hlf: 'stable', dec: [], prim: true },
      { a: 33, ab: 0.0075, hl: null, hlf: 'stable', dec: [], prim: true },
      { a: 34, ab: 0.0425, hl: null, hlf: 'stable', dec: [], prim: true },
      { a: 35, ab: null,   hl: 87.37 * DAY, hlf: '87.37 d', dec: ['β-'], prim: false },
      { a: 36, ab: 0.0001, hl: null, hlf: 'stable', dec: [], prim: true }
    ],

    // Cl — Chlorine
    17: [
      { a: 35, ab: 0.7576, hl: null, hlf: 'stable', dec: [], prim: true },
      { a: 36, ab: null,   hl: 3.01e5 * YEAR, hlf: '301 ky', dec: ['β-','EC'], prim: false },
      { a: 37, ab: 0.2424, hl: null, hlf: 'stable', dec: [], prim: true }
    ],

    // Ar — Argon (40Ar dominant due to 40K decay)
    18: [
      { a: 36, ab: 0.003336, hl: null, hlf: 'stable', dec: [], prim: true },
      { a: 38, ab: 0.000629, hl: null, hlf: 'stable', dec: [], prim: true },
      { a: 39, ab: null,     hl: 269 * YEAR, hlf: '269 y', dec: ['β-'], prim: false },
      { a: 40, ab: 0.996035, hl: null, hlf: 'stable', dec: [], prim: true }
    ],

    // K — Potassium (40K = primordial radioactive, basis of K-Ar dating)
    19: [
      { a: 39, ab: 0.932581, hl: null, hlf: 'stable', dec: [], prim: true },
      { a: 40, ab: 0.000117, hl: 1.248e9 * YEAR, hlf: '1.25 Gy', dec: ['β-','EC','β+'], prim: true },
      { a: 41, ab: 0.067302, hl: null, hlf: 'stable', dec: [], prim: true }
    ],

    // Ca — Calcium (6 stable; 48Ca is observationally stable double-beta candidate)
    20: [
      { a: 40, ab: 0.96941, hl: null, hlf: 'stable', dec: [], prim: true },
      { a: 42, ab: 0.00647, hl: null, hlf: 'stable', dec: [], prim: true },
      { a: 43, ab: 0.00135, hl: null, hlf: 'stable', dec: [], prim: true },
      { a: 44, ab: 0.02086, hl: null, hlf: 'stable', dec: [], prim: true },
      { a: 46, ab: 0.00004, hl: null, hlf: 'stable', dec: [], prim: true },
      { a: 48, ab: 0.00187, hl: null, hlf: 'stable', dec: ['2β-'], prim: true }
    ],

    // Sc — Scandium (monoisotopic)
    21: [
      { a: 45, ab: 1.0, hl: null, hlf: 'stable', dec: [], prim: true }
    ],

    // Ti — Titanium (5 stable)
    22: [
      { a: 46, ab: 0.0825, hl: null, hlf: 'stable', dec: [], prim: true },
      { a: 47, ab: 0.0744, hl: null, hlf: 'stable', dec: [], prim: true },
      { a: 48, ab: 0.7372, hl: null, hlf: 'stable', dec: [], prim: true },
      { a: 49, ab: 0.0541, hl: null, hlf: 'stable', dec: [], prim: true },
      { a: 50, ab: 0.0518, hl: null, hlf: 'stable', dec: [], prim: true }
    ],

    // V — Vanadium (50V observationally stable)
    23: [
      { a: 50, ab: 0.00250,  hl: 1.5e17 * YEAR, hlf: '1.5e17 y', dec: ['EC','β-'], prim: true },
      { a: 51, ab: 0.99750,  hl: null, hlf: 'stable', dec: [], prim: true }
    ],

    // Cr — Chromium
    24: [
      { a: 50, ab: 0.04345, hl: null, hlf: 'stable', dec: [], prim: true },
      { a: 52, ab: 0.83789, hl: null, hlf: 'stable', dec: [], prim: true },
      { a: 53, ab: 0.09501, hl: null, hlf: 'stable', dec: [], prim: true },
      { a: 54, ab: 0.02365, hl: null, hlf: 'stable', dec: [], prim: true }
    ],

    // Mn — Manganese (monoisotopic; 54Mn used in research)
    25: [
      { a: 54, ab: null, hl: 312.2 * DAY, hlf: '312 d', dec: ['EC'], prim: false },
      { a: 55, ab: 1.0,  hl: null, hlf: 'stable', dec: [], prim: true }
    ],

    // Fe — Iron (most abundant in human body / Earth core)
    26: [
      { a: 54, ab: 0.05845, hl: null, hlf: 'stable', dec: [], prim: true },
      { a: 56, ab: 0.91754, hl: null, hlf: 'stable', dec: [], prim: true },
      { a: 57, ab: 0.02119, hl: null, hlf: 'stable', dec: [], prim: true },
      { a: 58, ab: 0.00282, hl: null, hlf: 'stable', dec: [], prim: true }
    ],

    // Co — Cobalt (monoisotopic; 60Co iconic γ-source for cancer therapy + sterilization)
    27: [
      { a: 59, ab: 1.0,  hl: null, hlf: 'stable', dec: [], prim: true },
      { a: 60, ab: null, hl: 5.27 * YEAR, hlf: '5.27 y', dec: ['β-','γ'], prim: false }
    ],

    // Ni — Nickel
    28: [
      { a: 58, ab: 0.68077, hl: null, hlf: 'stable', dec: [], prim: true },
      { a: 60, ab: 0.26223, hl: null, hlf: 'stable', dec: [], prim: true },
      { a: 61, ab: 0.01140, hl: null, hlf: 'stable', dec: [], prim: true },
      { a: 62, ab: 0.03635, hl: null, hlf: 'stable', dec: [], prim: true },
      { a: 64, ab: 0.00926, hl: null, hlf: 'stable', dec: [], prim: true }
    ],

    // Cu — Copper
    29: [
      { a: 63, ab: 0.6915, hl: null, hlf: 'stable', dec: [], prim: true },
      { a: 65, ab: 0.3085, hl: null, hlf: 'stable', dec: [], prim: true }
    ],

    // Zn — Zinc
    30: [
      { a: 64, ab: 0.4917, hl: null, hlf: 'stable', dec: [], prim: true },
      { a: 66, ab: 0.2773, hl: null, hlf: 'stable', dec: [], prim: true },
      { a: 67, ab: 0.0404, hl: null, hlf: 'stable', dec: [], prim: true },
      { a: 68, ab: 0.1845, hl: null, hlf: 'stable', dec: [], prim: true },
      { a: 70, ab: 0.0061, hl: null, hlf: 'stable', dec: [], prim: true }
    ],

    // Ga — Gallium
    31: [
      { a: 69, ab: 0.60108, hl: null, hlf: 'stable', dec: [], prim: true },
      { a: 71, ab: 0.39892, hl: null, hlf: 'stable', dec: [], prim: true }
    ],

    // Ge — Germanium (76Ge candidate for neutrinoless 2β decay searches)
    32: [
      { a: 70, ab: 0.2084, hl: null, hlf: 'stable', dec: [], prim: true },
      { a: 72, ab: 0.2754, hl: null, hlf: 'stable', dec: [], prim: true },
      { a: 73, ab: 0.0773, hl: null, hlf: 'stable', dec: [], prim: true },
      { a: 74, ab: 0.3628, hl: null, hlf: 'stable', dec: [], prim: true },
      { a: 76, ab: 0.0761, hl: 1.78e21 * YEAR, hlf: '1.78e21 y', dec: ['2β-'], prim: true }
    ],

    // As — Arsenic (monoisotopic)
    33: [
      { a: 75, ab: 1.0, hl: null, hlf: 'stable', dec: [], prim: true }
    ],

    // Se — Selenium
    34: [
      { a: 74, ab: 0.0086, hl: null, hlf: 'stable', dec: [], prim: true },
      { a: 76, ab: 0.0923, hl: null, hlf: 'stable', dec: [], prim: true },
      { a: 77, ab: 0.0760, hl: null, hlf: 'stable', dec: [], prim: true },
      { a: 78, ab: 0.2369, hl: null, hlf: 'stable', dec: [], prim: true },
      { a: 80, ab: 0.4980, hl: null, hlf: 'stable', dec: [], prim: true },
      { a: 82, ab: 0.0882, hl: 9.7e19 * YEAR, hlf: '9.7e19 y', dec: ['2β-'], prim: true }
    ],

    // Br — Bromine
    35: [
      { a: 79, ab: 0.5069, hl: null, hlf: 'stable', dec: [], prim: true },
      { a: 81, ab: 0.4931, hl: null, hlf: 'stable', dec: [], prim: true }
    ],

    // Kr — Krypton
    36: [
      { a: 78, ab: 0.00355, hl: null, hlf: 'stable', dec: [], prim: true },
      { a: 80, ab: 0.02286, hl: null, hlf: 'stable', dec: [], prim: true },
      { a: 82, ab: 0.11593, hl: null, hlf: 'stable', dec: [], prim: true },
      { a: 83, ab: 0.11500, hl: null, hlf: 'stable', dec: [], prim: true },
      { a: 84, ab: 0.56987, hl: null, hlf: 'stable', dec: [], prim: true },
      { a: 86, ab: 0.17279, hl: null, hlf: 'stable', dec: [], prim: true }
    ],

    // Rb — Rubidium (87Rb primordial radioactive, basis of Rb-Sr dating)
    37: [
      { a: 85, ab: 0.7217, hl: null, hlf: 'stable', dec: [], prim: true },
      { a: 87, ab: 0.2783, hl: 4.97e10 * YEAR, hlf: '49.7 Gy', dec: ['β-'], prim: true }
    ],

    // Sr — Strontium (90Sr is a major fallout contaminant from Chernobyl)
    38: [
      { a: 84, ab: 0.0056, hl: null, hlf: 'stable', dec: [], prim: true },
      { a: 86, ab: 0.0986, hl: null, hlf: 'stable', dec: [], prim: true },
      { a: 87, ab: 0.0700, hl: null, hlf: 'stable', dec: [], prim: true },
      { a: 88, ab: 0.8258, hl: null, hlf: 'stable', dec: [], prim: true },
      { a: 90, ab: null,   hl: 28.79 * YEAR, hlf: '28.8 y', dec: ['β-'], prim: false }
    ],

    // Y — Yttrium (monoisotopic; 90Y used in cancer radiotherapy)
    39: [
      { a: 89, ab: 1.0,  hl: null, hlf: 'stable', dec: [], prim: true },
      { a: 90, ab: null, hl: 64.05 * HOUR, hlf: '64.1 h', dec: ['β-'], prim: false }
    ],

    // Zr — Zirconium
    40: [
      { a: 90, ab: 0.5145, hl: null, hlf: 'stable', dec: [], prim: true },
      { a: 91, ab: 0.1122, hl: null, hlf: 'stable', dec: [], prim: true },
      { a: 92, ab: 0.1715, hl: null, hlf: 'stable', dec: [], prim: true },
      { a: 94, ab: 0.1738, hl: null, hlf: 'stable', dec: [], prim: true },
      { a: 96, ab: 0.0280, hl: 2.0e19 * YEAR, hlf: '2.0e19 y', dec: ['2β-'], prim: true }
    ],

    // Nb — Niobium (monoisotopic)
    41: [
      { a: 93, ab: 1.0, hl: null, hlf: 'stable', dec: [], prim: true }
    ],

    // Mo — Molybdenum (parent of medical Tc-99m via 99Mo)
    42: [
      { a: 92,  ab: 0.1484, hl: null, hlf: 'stable', dec: [], prim: true },
      { a: 94,  ab: 0.0925, hl: null, hlf: 'stable', dec: [], prim: true },
      { a: 95,  ab: 0.1592, hl: null, hlf: 'stable', dec: [], prim: true },
      { a: 96,  ab: 0.1668, hl: null, hlf: 'stable', dec: [], prim: true },
      { a: 97,  ab: 0.0955, hl: null, hlf: 'stable', dec: [], prim: true },
      { a: 98,  ab: 0.2413, hl: null, hlf: 'stable', dec: [], prim: true },
      { a: 99,  ab: null,   hl: 65.94 * HOUR, hlf: '65.9 h', dec: ['β-'], prim: false },
      { a: 100, ab: 0.0963, hl: 7.07e18 * YEAR, hlf: '7.1e18 y', dec: ['2β-'], prim: true }
    ],

    // Tc — Technetium (NO stable isotopes! 99mTc is the workhorse of nuclear medicine)
    43: [
      { a: 97,  ab: null, hl: 4.21e6 * YEAR, hlf: '4.21 My', dec: ['EC'],     prim: false },
      { a: 98,  ab: null, hl: 4.2e6  * YEAR, hlf: '4.2 My',  dec: ['β-'],     prim: false },
      { a: 99,  ab: null, hl: 2.111e5 * YEAR, hlf: '211 ky', dec: ['β-'],     prim: false },
      { a: 99,  m: true,  ab: null, hl: 6.0067 * HOUR, hlf: '6.01 h', dec: ['IT','γ'], prim: false }
    ],

    // Ru — Ruthenium
    44: [
      { a: 96,  ab: 0.0554, hl: null, hlf: 'stable', dec: [], prim: true },
      { a: 98,  ab: 0.0187, hl: null, hlf: 'stable', dec: [], prim: true },
      { a: 99,  ab: 0.1276, hl: null, hlf: 'stable', dec: [], prim: true },
      { a: 100, ab: 0.1260, hl: null, hlf: 'stable', dec: [], prim: true },
      { a: 101, ab: 0.1706, hl: null, hlf: 'stable', dec: [], prim: true },
      { a: 102, ab: 0.3155, hl: null, hlf: 'stable', dec: [], prim: true },
      { a: 104, ab: 0.1862, hl: null, hlf: 'stable', dec: [], prim: true }
    ],

    // Rh — Rhodium (monoisotopic)
    45: [
      { a: 103, ab: 1.0, hl: null, hlf: 'stable', dec: [], prim: true }
    ],

    // Pd — Palladium
    46: [
      { a: 102, ab: 0.0102, hl: null, hlf: 'stable', dec: [], prim: true },
      { a: 104, ab: 0.1114, hl: null, hlf: 'stable', dec: [], prim: true },
      { a: 105, ab: 0.2233, hl: null, hlf: 'stable', dec: [], prim: true },
      { a: 106, ab: 0.2733, hl: null, hlf: 'stable', dec: [], prim: true },
      { a: 108, ab: 0.2646, hl: null, hlf: 'stable', dec: [], prim: true },
      { a: 110, ab: 0.1172, hl: null, hlf: 'stable', dec: [], prim: true }
    ],

    // Ag — Silver
    47: [
      { a: 107, ab: 0.51839, hl: null, hlf: 'stable', dec: [], prim: true },
      { a: 109, ab: 0.48161, hl: null, hlf: 'stable', dec: [], prim: true }
    ],

    // Cd — Cadmium (113Cd is observationally stable, 116Cd 2β-)
    48: [
      { a: 106, ab: 0.0125, hl: null, hlf: 'stable', dec: [], prim: true },
      { a: 108, ab: 0.0089, hl: null, hlf: 'stable', dec: [], prim: true },
      { a: 110, ab: 0.1249, hl: null, hlf: 'stable', dec: [], prim: true },
      { a: 111, ab: 0.1280, hl: null, hlf: 'stable', dec: [], prim: true },
      { a: 112, ab: 0.2413, hl: null, hlf: 'stable', dec: [], prim: true },
      { a: 113, ab: 0.1222, hl: 8.04e15 * YEAR, hlf: '8.0e15 y', dec: ['β-'], prim: true },
      { a: 114, ab: 0.2873, hl: null, hlf: 'stable', dec: [], prim: true },
      { a: 116, ab: 0.0749, hl: 2.69e19 * YEAR, hlf: '2.7e19 y', dec: ['2β-'], prim: true }
    ],

    // In — Indium (115In primordial radioactive, longest known β- T½)
    49: [
      { a: 113, ab: 0.0428, hl: null, hlf: 'stable', dec: [], prim: true },
      { a: 115, ab: 0.9572, hl: 4.41e14 * YEAR, hlf: '4.4e14 y', dec: ['β-'], prim: true }
    ],

    // Sn — Tin (10 stable — most of any element)
    50: [
      { a: 112, ab: 0.0097, hl: null, hlf: 'stable', dec: [], prim: true },
      { a: 114, ab: 0.0066, hl: null, hlf: 'stable', dec: [], prim: true },
      { a: 115, ab: 0.0034, hl: null, hlf: 'stable', dec: [], prim: true },
      { a: 116, ab: 0.1454, hl: null, hlf: 'stable', dec: [], prim: true },
      { a: 117, ab: 0.0768, hl: null, hlf: 'stable', dec: [], prim: true },
      { a: 118, ab: 0.2422, hl: null, hlf: 'stable', dec: [], prim: true },
      { a: 119, ab: 0.0859, hl: null, hlf: 'stable', dec: [], prim: true },
      { a: 120, ab: 0.3258, hl: null, hlf: 'stable', dec: [], prim: true },
      { a: 122, ab: 0.0463, hl: null, hlf: 'stable', dec: [], prim: true },
      { a: 124, ab: 0.0579, hl: null, hlf: 'stable', dec: [], prim: true }
    ],

    // Sb — Antimony
    51: [
      { a: 121, ab: 0.5721, hl: null, hlf: 'stable', dec: [], prim: true },
      { a: 123, ab: 0.4279, hl: null, hlf: 'stable', dec: [], prim: true }
    ],

    // Te — Tellurium (128Te + 130Te observationally stable 2β-)
    52: [
      { a: 120, ab: 0.0009, hl: null, hlf: 'stable', dec: [], prim: true },
      { a: 122, ab: 0.0255, hl: null, hlf: 'stable', dec: [], prim: true },
      { a: 123, ab: 0.0089, hl: 9.2e16 * YEAR, hlf: '9.2e16 y', dec: ['EC'], prim: true },
      { a: 124, ab: 0.0474, hl: null, hlf: 'stable', dec: [], prim: true },
      { a: 125, ab: 0.0707, hl: null, hlf: 'stable', dec: [], prim: true },
      { a: 126, ab: 0.1884, hl: null, hlf: 'stable', dec: [], prim: true },
      { a: 128, ab: 0.3174, hl: 2.2e24 * YEAR, hlf: '2.2e24 y', dec: ['2β-'], prim: true },
      { a: 130, ab: 0.3408, hl: 8.2e20 * YEAR, hlf: '8.2e20 y', dec: ['2β-'], prim: true }
    ],

    // I — Iodine (monoisotopic; 131I thyroid imaging/therapy + Chernobyl fallout)
    53: [
      { a: 123, ab: null, hl: 13.22 * HOUR, hlf: '13.2 h', dec: ['EC'], prim: false },
      { a: 125, ab: null, hl: 59.4 * DAY,   hlf: '59.4 d', dec: ['EC'], prim: false },
      { a: 127, ab: 1.0,  hl: null, hlf: 'stable', dec: [], prim: true },
      { a: 131, ab: null, hl: 8.02 * DAY,   hlf: '8.02 d', dec: ['β-','γ'], prim: false }
    ],

    // Xe — Xenon (124Xe → 2EC observed in 2019, longest measured T½)
    54: [
      { a: 124, ab: 0.00095, hl: 1.8e22 * YEAR, hlf: '1.8e22 y', dec: ['2EC'], prim: true },
      { a: 126, ab: 0.00089, hl: null, hlf: 'stable', dec: [], prim: true },
      { a: 128, ab: 0.01910, hl: null, hlf: 'stable', dec: [], prim: true },
      { a: 129, ab: 0.26401, hl: null, hlf: 'stable', dec: [], prim: true },
      { a: 130, ab: 0.04071, hl: null, hlf: 'stable', dec: [], prim: true },
      { a: 131, ab: 0.21232, hl: null, hlf: 'stable', dec: [], prim: true },
      { a: 132, ab: 0.26909, hl: null, hlf: 'stable', dec: [], prim: true },
      { a: 134, ab: 0.10436, hl: null, hlf: 'stable', dec: [], prim: true },
      { a: 136, ab: 0.08857, hl: 2.18e21 * YEAR, hlf: '2.2e21 y', dec: ['2β-'], prim: true }
    ],

    // Cs — Caesium (monoisotopic; 137Cs main fallout marker post-Chernobyl/Fukushima)
    55: [
      { a: 133, ab: 1.0,  hl: null, hlf: 'stable', dec: [], prim: true },
      { a: 134, ab: null, hl: 2.062 * YEAR, hlf: '2.06 y', dec: ['β-'], prim: false },
      { a: 135, ab: null, hl: 2.3e6 * YEAR, hlf: '2.3 My', dec: ['β-'], prim: false },
      { a: 137, ab: null, hl: 30.05 * YEAR, hlf: '30.1 y', dec: ['β-','γ'], prim: false }
    ],

    // Ba — Barium
    56: [
      { a: 130, ab: 0.00106, hl: null, hlf: 'stable', dec: [], prim: true },
      { a: 132, ab: 0.00101, hl: null, hlf: 'stable', dec: [], prim: true },
      { a: 134, ab: 0.02417, hl: null, hlf: 'stable', dec: [], prim: true },
      { a: 135, ab: 0.06592, hl: null, hlf: 'stable', dec: [], prim: true },
      { a: 136, ab: 0.07854, hl: null, hlf: 'stable', dec: [], prim: true },
      { a: 137, ab: 0.11232, hl: null, hlf: 'stable', dec: [], prim: true },
      { a: 138, ab: 0.71698, hl: null, hlf: 'stable', dec: [], prim: true }
    ],

    // La — Lanthanum (138La is primordial radioactive)
    57: [
      { a: 138, ab: 0.00089, hl: 1.05e11 * YEAR, hlf: '105 Gy', dec: ['EC','β-'], prim: true },
      { a: 139, ab: 0.99911, hl: null, hlf: 'stable', dec: [], prim: true }
    ],

    // Ce — Cerium
    58: [
      { a: 136, ab: 0.00185, hl: null, hlf: 'stable', dec: [], prim: true },
      { a: 138, ab: 0.00251, hl: null, hlf: 'stable', dec: [], prim: true },
      { a: 140, ab: 0.88450, hl: null, hlf: 'stable', dec: [], prim: true },
      { a: 142, ab: 0.11114, hl: null, hlf: 'stable', dec: [], prim: true }
    ],

    // Pr — Praseodymium (monoisotopic)
    59: [
      { a: 141, ab: 1.0, hl: null, hlf: 'stable', dec: [], prim: true }
    ],

    // Nd — Neodymium (144Nd primordial α-emitter; basis of Sm-Nd dating)
    60: [
      { a: 142, ab: 0.27152, hl: null, hlf: 'stable', dec: [], prim: true },
      { a: 143, ab: 0.12174, hl: null, hlf: 'stable', dec: [], prim: true },
      { a: 144, ab: 0.23798, hl: 2.29e15 * YEAR, hlf: '2.3e15 y', dec: ['α'], prim: true },
      { a: 145, ab: 0.08293, hl: null, hlf: 'stable', dec: [], prim: true },
      { a: 146, ab: 0.17189, hl: null, hlf: 'stable', dec: [], prim: true },
      { a: 148, ab: 0.05756, hl: null, hlf: 'stable', dec: [], prim: true },
      { a: 150, ab: 0.05638, hl: 9.3e18 * YEAR, hlf: '9.3e18 y', dec: ['2β-'], prim: true }
    ],

    // Pm — Promethium (NO stable isotopes — unusual for a lanthanide)
    61: [
      { a: 145, ab: null, hl: 17.7 * YEAR,  hlf: '17.7 y',  dec: ['EC'], prim: false },
      { a: 147, ab: null, hl: 2.6234 * YEAR, hlf: '2.62 y', dec: ['β-'], prim: false }
    ],

    // Sm — Samarium (147Sm primordial α used in Sm-Nd dating)
    62: [
      { a: 144, ab: 0.0307, hl: null, hlf: 'stable', dec: [], prim: true },
      { a: 147, ab: 0.1499, hl: 1.066e11 * YEAR, hlf: '107 Gy', dec: ['α'], prim: true },
      { a: 148, ab: 0.1124, hl: 7e15 * YEAR, hlf: '7e15 y', dec: ['α'], prim: true },
      { a: 149, ab: 0.1382, hl: null, hlf: 'stable', dec: [], prim: true },
      { a: 150, ab: 0.0738, hl: null, hlf: 'stable', dec: [], prim: true },
      { a: 152, ab: 0.2675, hl: null, hlf: 'stable', dec: [], prim: true },
      { a: 154, ab: 0.2275, hl: null, hlf: 'stable', dec: [], prim: true }
    ],

    // Eu — Europium
    63: [
      { a: 151, ab: 0.4781, hl: null, hlf: 'stable', dec: [], prim: true },
      { a: 153, ab: 0.5219, hl: null, hlf: 'stable', dec: [], prim: true }
    ],

    // Gd — Gadolinium (152Gd primordial α)
    64: [
      { a: 152, ab: 0.0020, hl: 1.08e14 * YEAR, hlf: '108 Ty', dec: ['α'], prim: true },
      { a: 154, ab: 0.0218, hl: null, hlf: 'stable', dec: [], prim: true },
      { a: 155, ab: 0.1480, hl: null, hlf: 'stable', dec: [], prim: true },
      { a: 156, ab: 0.2047, hl: null, hlf: 'stable', dec: [], prim: true },
      { a: 157, ab: 0.1565, hl: null, hlf: 'stable', dec: [], prim: true },
      { a: 158, ab: 0.2484, hl: null, hlf: 'stable', dec: [], prim: true },
      { a: 160, ab: 0.2186, hl: null, hlf: 'stable', dec: [], prim: true }
    ],

    // Tb — Terbium (monoisotopic)
    65: [
      { a: 159, ab: 1.0, hl: null, hlf: 'stable', dec: [], prim: true }
    ],

    // Dy — Dysprosium
    66: [
      { a: 156, ab: 0.00056, hl: null, hlf: 'stable', dec: [], prim: true },
      { a: 158, ab: 0.00095, hl: null, hlf: 'stable', dec: [], prim: true },
      { a: 160, ab: 0.02329, hl: null, hlf: 'stable', dec: [], prim: true },
      { a: 161, ab: 0.18889, hl: null, hlf: 'stable', dec: [], prim: true },
      { a: 162, ab: 0.25475, hl: null, hlf: 'stable', dec: [], prim: true },
      { a: 163, ab: 0.24896, hl: null, hlf: 'stable', dec: [], prim: true },
      { a: 164, ab: 0.28260, hl: null, hlf: 'stable', dec: [], prim: true }
    ],

    // Ho — Holmium (monoisotopic)
    67: [
      { a: 165, ab: 1.0, hl: null, hlf: 'stable', dec: [], prim: true }
    ],

    // Er — Erbium
    68: [
      { a: 162, ab: 0.00139, hl: null, hlf: 'stable', dec: [], prim: true },
      { a: 164, ab: 0.01601, hl: null, hlf: 'stable', dec: [], prim: true },
      { a: 166, ab: 0.33503, hl: null, hlf: 'stable', dec: [], prim: true },
      { a: 167, ab: 0.22869, hl: null, hlf: 'stable', dec: [], prim: true },
      { a: 168, ab: 0.26978, hl: null, hlf: 'stable', dec: [], prim: true },
      { a: 170, ab: 0.14910, hl: null, hlf: 'stable', dec: [], prim: true }
    ],

    // Tm — Thulium (monoisotopic)
    69: [
      { a: 169, ab: 1.0, hl: null, hlf: 'stable', dec: [], prim: true }
    ],

    // Yb — Ytterbium
    70: [
      { a: 168, ab: 0.00123, hl: null, hlf: 'stable', dec: [], prim: true },
      { a: 170, ab: 0.02982, hl: null, hlf: 'stable', dec: [], prim: true },
      { a: 171, ab: 0.14090, hl: null, hlf: 'stable', dec: [], prim: true },
      { a: 172, ab: 0.21680, hl: null, hlf: 'stable', dec: [], prim: true },
      { a: 173, ab: 0.16103, hl: null, hlf: 'stable', dec: [], prim: true },
      { a: 174, ab: 0.32026, hl: null, hlf: 'stable', dec: [], prim: true },
      { a: 176, ab: 0.12996, hl: null, hlf: 'stable', dec: [], prim: true }
    ],

    // Lu — Lutetium (176Lu primordial β-, used in Lu-Hf dating)
    71: [
      { a: 175, ab: 0.97401, hl: null, hlf: 'stable', dec: [], prim: true },
      { a: 176, ab: 0.02599, hl: 3.78e10 * YEAR, hlf: '37.8 Gy', dec: ['β-'], prim: true }
    ],

    // Hf — Hafnium (174Hf primordial α)
    72: [
      { a: 174, ab: 0.00162, hl: 2e15 * YEAR, hlf: '2e15 y', dec: ['α'], prim: true },
      { a: 176, ab: 0.05206, hl: null, hlf: 'stable', dec: [], prim: true },
      { a: 177, ab: 0.18606, hl: null, hlf: 'stable', dec: [], prim: true },
      { a: 178, ab: 0.27297, hl: null, hlf: 'stable', dec: [], prim: true },
      { a: 179, ab: 0.13629, hl: null, hlf: 'stable', dec: [], prim: true },
      { a: 180, ab: 0.35100, hl: null, hlf: 'stable', dec: [], prim: true }
    ],

    // Ta — Tantalum (180mTa is the ONLY naturally-occurring nuclear isomer in nature)
    73: [
      { a: 180, m: true, ab: 0.00012, hl: null, hlf: 'stable (isomer)', dec: [], prim: true },
      { a: 181, ab: 0.99988, hl: null, hlf: 'stable', dec: [], prim: true }
    ],

    // W — Tungsten
    74: [
      { a: 180, ab: 0.0012, hl: 1.8e18 * YEAR, hlf: '1.8e18 y', dec: ['α'], prim: true },
      { a: 182, ab: 0.2650, hl: null, hlf: 'stable', dec: [], prim: true },
      { a: 183, ab: 0.1431, hl: null, hlf: 'stable', dec: [], prim: true },
      { a: 184, ab: 0.3064, hl: null, hlf: 'stable', dec: [], prim: true },
      { a: 186, ab: 0.2843, hl: null, hlf: 'stable', dec: [], prim: true }
    ],

    // Re — Rhenium (187Re primordial β-, used in Re-Os dating of meteorites)
    75: [
      { a: 185, ab: 0.3740, hl: null, hlf: 'stable', dec: [], prim: true },
      { a: 187, ab: 0.6260, hl: 4.12e10 * YEAR, hlf: '41.2 Gy', dec: ['β-'], prim: true }
    ],

    // Os — Osmium (186Os primordial α; 187Os is the daughter of 187Re)
    76: [
      { a: 184, ab: 0.0002, hl: null, hlf: 'stable', dec: [], prim: true },
      { a: 186, ab: 0.0159, hl: 2e15 * YEAR, hlf: '2e15 y', dec: ['α'], prim: true },
      { a: 187, ab: 0.0196, hl: null, hlf: 'stable', dec: [], prim: true },
      { a: 188, ab: 0.1324, hl: null, hlf: 'stable', dec: [], prim: true },
      { a: 189, ab: 0.1615, hl: null, hlf: 'stable', dec: [], prim: true },
      { a: 190, ab: 0.2626, hl: null, hlf: 'stable', dec: [], prim: true },
      { a: 192, ab: 0.4078, hl: null, hlf: 'stable', dec: [], prim: true }
    ],

    // Ir — Iridium (K-Pg boundary marker — iridium spike from Chicxulub impactor)
    77: [
      { a: 191, ab: 0.373, hl: null, hlf: 'stable', dec: [], prim: true },
      { a: 193, ab: 0.627, hl: null, hlf: 'stable', dec: [], prim: true }
    ],

    // Pt — Platinum
    78: [
      { a: 190, ab: 0.00012, hl: 6.5e11 * YEAR, hlf: '650 Gy', dec: ['α'], prim: true },
      { a: 192, ab: 0.00782, hl: null, hlf: 'stable', dec: [], prim: true },
      { a: 194, ab: 0.32864, hl: null, hlf: 'stable', dec: [], prim: true },
      { a: 195, ab: 0.33775, hl: null, hlf: 'stable', dec: [], prim: true },
      { a: 196, ab: 0.25211, hl: null, hlf: 'stable', dec: [], prim: true },
      { a: 198, ab: 0.07356, hl: null, hlf: 'stable', dec: [], prim: true }
    ],

    // Au — Gold (monoisotopic; 198Au used in cancer therapy)
    79: [
      { a: 197, ab: 1.0,  hl: null, hlf: 'stable', dec: [], prim: true },
      { a: 198, ab: null, hl: 2.6947 * DAY, hlf: '2.69 d', dec: ['β-'], prim: false }
    ],

    // Hg — Mercury
    80: [
      { a: 196, ab: 0.0015, hl: null, hlf: 'stable', dec: [], prim: true },
      { a: 198, ab: 0.0997, hl: null, hlf: 'stable', dec: [], prim: true },
      { a: 199, ab: 0.1687, hl: null, hlf: 'stable', dec: [], prim: true },
      { a: 200, ab: 0.2310, hl: null, hlf: 'stable', dec: [], prim: true },
      { a: 201, ab: 0.1318, hl: null, hlf: 'stable', dec: [], prim: true },
      { a: 202, ab: 0.2986, hl: null, hlf: 'stable', dec: [], prim: true },
      { a: 204, ab: 0.0687, hl: null, hlf: 'stable', dec: [], prim: true }
    ],

    // Tl — Thallium
    81: [
      { a: 203, ab: 0.29524, hl: null, hlf: 'stable', dec: [], prim: true },
      { a: 205, ab: 0.70476, hl: null, hlf: 'stable', dec: [], prim: true }
    ],

    // Pb — Lead (last element with stable isotopes; 206/207/208 end U/Th decay chains)
    82: [
      { a: 204, ab: 0.014, hl: null, hlf: 'stable', dec: [], prim: true },
      { a: 206, ab: 0.241, hl: null, hlf: 'stable', dec: [], prim: true },  // end of 238U chain
      { a: 207, ab: 0.221, hl: null, hlf: 'stable', dec: [], prim: true },  // end of 235U chain
      { a: 208, ab: 0.524, hl: null, hlf: 'stable', dec: [], prim: true }   // end of 232Th chain; doubly-magic
    ],

    // Bi — Bismuth (once thought stable, actually α-emitting with longest half-life ever measured)
    83: [
      { a: 209, ab: 1.0, hl: 2.01e19 * YEAR, hlf: '2.0e19 y', dec: ['α'], prim: true }
    ],

    // Po — Polonium (NO stable isotopes; 210Po notorious as Litvinenko poison)
    84: [
      { a: 209, ab: null, hl: 124 * YEAR, hlf: '124 y', dec: ['α'], prim: false },
      { a: 210, ab: null, hl: 138.376 * DAY, hlf: '138 d', dec: ['α'], prim: false }
    ],

    // At — Astatine (rarest naturally occurring element; ~25 g in Earth's crust)
    85: [
      { a: 210, ab: null, hl: 8.1 * HOUR, hlf: '8.10 h', dec: ['EC','α'], prim: false },
      { a: 211, ab: null, hl: 7.214 * HOUR, hlf: '7.21 h', dec: ['EC','α'], prim: false }
    ],

    // Rn — Radon (radioactive gas; 222Rn is health concern in basements + U decay product)
    86: [
      { a: 219, ab: null, hl: 3.96, hlf: '3.96 s', dec: ['α'], prim: false },
      { a: 220, ab: null, hl: 55.6, hlf: '55.6 s', dec: ['α'], prim: false },
      { a: 222, ab: null, hl: 3.8235 * DAY, hlf: '3.82 d', dec: ['α'], prim: false }
    ],

    // Fr — Francium (rarest natural element on Earth; ~30g in crust at any moment)
    87: [
      { a: 223, ab: null, hl: 22.00 * 60, hlf: '22.0 min', dec: ['β-','α'], prim: false }
    ],

    // Ra — Radium (226Ra: Marie Curie's discovery; used in early luminous paint)
    88: [
      { a: 223, ab: null, hl: 11.43 * DAY, hlf: '11.4 d', dec: ['α'], prim: false },
      { a: 224, ab: null, hl: 3.6319 * DAY, hlf: '3.63 d', dec: ['α'], prim: false },
      { a: 226, ab: null, hl: 1600 * YEAR, hlf: '1,600 y', dec: ['α'], prim: false },
      { a: 228, ab: null, hl: 5.75 * YEAR, hlf: '5.75 y', dec: ['β-'], prim: false }
    ],

    // Ac — Actinium (225Ac is the rising star of targeted alpha-particle cancer therapy)
    89: [
      { a: 225, ab: null, hl: 9.92 * DAY, hlf: '9.92 d', dec: ['α'], prim: false },
      { a: 227, ab: null, hl: 21.772 * YEAR, hlf: '21.8 y', dec: ['β-','α'], prim: false }
    ],

    // Th — Thorium (232Th is primordial; nuclear fuel of the future via Th-U breeder cycle)
    90: [
      { a: 230, ab: null,    hl: 7.54e4 * YEAR, hlf: '75.4 ky', dec: ['α'], prim: false },
      { a: 232, ab: 1.0,     hl: 1.405e10 * YEAR, hlf: '14.0 Gy', dec: ['α'], prim: true }
    ],

    // Pa — Protactinium (231Pa is in the U-235 decay chain)
    91: [
      { a: 231, ab: 1.0,  hl: 3.276e4 * YEAR, hlf: '32.8 ky', dec: ['α'], prim: true },
      { a: 233, ab: null, hl: 26.975 * DAY, hlf: '27.0 d', dec: ['β-'], prim: false }
    ],

    // U — Uranium (235U fissile → reactors/weapons; 238U fertile → 239Pu via breeding)
    92: [
      { a: 234, ab: 5.4e-5,  hl: 2.455e5 * YEAR, hlf: '246 ky', dec: ['α'], prim: true },
      { a: 235, ab: 0.007204, hl: 7.04e8 * YEAR, hlf: '704 My', dec: ['α'], prim: true },
      { a: 236, ab: null,    hl: 2.342e7 * YEAR, hlf: '23.4 My', dec: ['α'], prim: false },
      { a: 238, ab: 0.992742, hl: 4.468e9 * YEAR, hlf: '4.47 Gy', dec: ['α'], prim: true }
    ],

    // Np — Neptunium (synthetic; first transuranic discovered, 1940)
    93: [
      { a: 237, ab: null, hl: 2.144e6 * YEAR, hlf: '2.14 My', dec: ['α'], prim: false },
      { a: 239, ab: null, hl: 2.356 * DAY,    hlf: '2.36 d', dec: ['β-'], prim: false }
    ],

    // Pu — Plutonium (239Pu = nuclear weapons fuel; 238Pu = RTG power source for Voyager, Curiosity)
    94: [
      { a: 238, ab: null, hl: 87.7 * YEAR, hlf: '87.7 y', dec: ['α'], prim: false },
      { a: 239, ab: null, hl: 2.411e4 * YEAR, hlf: '24.1 ky', dec: ['α'], prim: false },
      { a: 240, ab: null, hl: 6561 * YEAR, hlf: '6,560 y', dec: ['α'], prim: false },
      { a: 241, ab: null, hl: 14.290 * YEAR, hlf: '14.3 y', dec: ['β-','α'], prim: false },
      { a: 242, ab: null, hl: 3.75e5 * YEAR, hlf: '375 ky', dec: ['α'], prim: false },
      { a: 244, ab: null, hl: 8.08e7 * YEAR, hlf: '80.8 My', dec: ['α'], prim: false }
    ],

    // Am — Americium (241Am: smoke detectors via α emission; 243Am: longest-lived common)
    95: [
      { a: 241, ab: null, hl: 432.2 * YEAR, hlf: '432 y', dec: ['α'], prim: false },
      { a: 243, ab: null, hl: 7370 * YEAR, hlf: '7,370 y', dec: ['α'], prim: false }
    ],

    // Cm — Curium
    96: [
      { a: 244, ab: null, hl: 18.10 * YEAR, hlf: '18.1 y', dec: ['α'], prim: false },
      { a: 247, ab: null, hl: 1.56e7 * YEAR, hlf: '15.6 My', dec: ['α'], prim: false },
      { a: 248, ab: null, hl: 3.48e5 * YEAR, hlf: '348 ky', dec: ['α','SF'], prim: false }
    ],

    // Bk — Berkelium (research only)
    97: [
      { a: 247, ab: null, hl: 1380 * YEAR, hlf: '1,380 y', dec: ['α'], prim: false },
      { a: 249, ab: null, hl: 330 * DAY, hlf: '330 d', dec: ['β-','α'], prim: false }
    ],

    // Cf — Californium (252Cf: only practical commercial neutron source; used in oil-well logging)
    98: [
      { a: 251, ab: null, hl: 898 * YEAR, hlf: '898 y', dec: ['α'], prim: false },
      { a: 252, ab: null, hl: 2.645 * YEAR, hlf: '2.65 y', dec: ['α','SF'], prim: false }
    ],

    // Es — Einsteinium (1952 discovery, in thermonuclear test fallout)
    99: [
      { a: 252, ab: null, hl: 471.7 * DAY, hlf: '472 d', dec: ['α'], prim: false }
    ],

    // Fm — Fermium (heaviest element produced by neutron bombardment)
    100: [
      { a: 257, ab: null, hl: 100.5 * DAY, hlf: '100 d', dec: ['α'], prim: false }
    ],

    // Md — Mendelevium
    101: [
      { a: 258, ab: null, hl: 51.5 * DAY, hlf: '51.5 d', dec: ['α'], prim: false }
    ],

    // No — Nobelium
    102: [
      { a: 259, ab: null, hl: 58 * 60, hlf: '58 min', dec: ['α','EC'], prim: false }
    ],

    // Lr — Lawrencium (last actinide)
    103: [
      { a: 266, ab: null, hl: 11 * HOUR, hlf: '11 h', dec: ['α'], prim: false }
    ],

    // Rf — Rutherfordium (first transactinide; 7th-row d-block)
    104: [
      { a: 267, ab: null, hl: 1.3 * HOUR, hlf: '1.3 h', dec: ['α','SF'], prim: false }
    ],

    // Db — Dubnium
    105: [
      { a: 268, ab: null, hl: 28 * HOUR, hlf: '28 h', dec: ['α','SF'], prim: false }
    ],

    // Sg — Seaborgium (named for Glenn Seaborg, only living person at the time of naming)
    106: [
      { a: 269, ab: null, hl: 14 * 60, hlf: '14 min', dec: ['α'], prim: false }
    ],

    // Bh — Bohrium
    107: [
      { a: 270, ab: null, hl: 60, hlf: '60 s', dec: ['α'], prim: false }
    ],

    // Hs — Hassium
    108: [
      { a: 269, ab: null, hl: 14, hlf: '14 s', dec: ['α'], prim: false }
    ],

    // Mt — Meitnerium
    109: [
      { a: 278, ab: null, hl: 8, hlf: '8 s', dec: ['α'], prim: false }
    ],

    // Ds — Darmstadtium
    110: [
      { a: 281, ab: null, hl: 14, hlf: '14 s', dec: ['α'], prim: false }
    ],

    // Rg — Roentgenium
    111: [
      { a: 282, ab: null, hl: 120, hlf: '2 min', dec: ['α'], prim: false }
    ],

    // Cn — Copernicium
    112: [
      { a: 285, ab: null, hl: 30, hlf: '30 s', dec: ['α'], prim: false }
    ],

    // Nh — Nihonium (first element discovered in Asia, RIKEN 2003)
    113: [
      { a: 286, ab: null, hl: 9.5, hlf: '9.5 s', dec: ['α'], prim: false }
    ],

    // Fl — Flerovium (target of "island of stability" predictions)
    114: [
      { a: 289, ab: null, hl: 2.7, hlf: '2.7 s', dec: ['α'], prim: false }
    ],

    // Mc — Moscovium
    115: [
      { a: 290, ab: null, hl: 0.65, hlf: '0.65 s', dec: ['α'], prim: false }
    ],

    // Lv — Livermorium
    116: [
      { a: 293, ab: null, hl: 0.080, hlf: '80 ms', dec: ['α'], prim: false }
    ],

    // Ts — Tennessine
    117: [
      { a: 294, ab: null, hl: 0.080, hlf: '80 ms', dec: ['α'], prim: false }
    ],

    // Og — Oganesson (heaviest element discovered; only a handful of atoms ever made)
    118: [
      { a: 294, ab: null, hl: 0.0007, hlf: '0.7 ms', dec: ['α'], prim: false }
    ]

  };

  // ───── EXPORT ─────
  root.ISOTOPES = ISOTOPES;
  root.formatHalfLife = formatHalfLife;
  root.formatAbundance = formatAbundance;

})(typeof window !== 'undefined' ? window : globalThis);
