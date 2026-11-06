/* Atomurus — element properties for the periodic-table colour scales.
   One place that knows each property's unit, source, how to read the raw
   element data (density mixes g/L for gases with g/cm³) and which values are
   predictions rather than measurements.
   Works in the browser (window.AtomurusElementProps) and in Node. */
(function (root, factory) {
  var api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  else root.AtomurusElementProps = api;
})(typeof self !== 'undefined' ? self : this, function () {
  'use strict';

  /* Single-bond covalent radii, pm — B. Cordero et al., "Covalent radii
     revisited", Dalton Trans. 2008, 2832–2838 (C: sp³; Mn, Fe, Co: low spin). */
  var COVALENT = [null,
    31, 28, 128, 96, 84, 76, 71, 66, 57, 58,
    166, 141, 121, 111, 107, 105, 102, 106, 203, 176,
    170, 160, 153, 139, 139, 132, 126, 124, 132, 122,
    122, 120, 119, 120, 120, 116, 220, 195, 190, 175,
    164, 154, 147, 146, 142, 139, 145, 144, 142, 139,
    139, 138, 139, 140, 244, 215, 207, 204, 203, 201,
    199, 198, 198, 196, 194, 192, 192, 189, 190, 187,
    187, 175, 170, 162, 151, 144, 141, 136, 136, 132,
    145, 146, 148, 140, 150, 150, 260, 221, 215, 206,
    200, 196, 190, 187, 180, 169];

  /* First electron affinity, kJ/mol (CRC Handbook of Chemistry and Physics,
     "Electron affinities"; rounded to 1 kJ/mol). UNBOUND: no stable anion
     (affinity ≤ 0). Elements not listed have no value here. */
  var AFFINITY = {
    1: 73, 3: 60, 5: 27, 6: 122, 8: 141, 9: 328, 11: 53, 13: 42, 14: 134, 15: 72,
    16: 200, 17: 349, 19: 48, 20: 2, 21: 18, 24: 64, 27: 64, 28: 112, 29: 118, 32: 119,
    33: 78, 34: 195, 35: 325, 37: 47, 38: 5, 39: 30, 40: 41, 42: 72, 46: 54, 47: 126,
    50: 107, 51: 101, 52: 190, 53: 295, 55: 46, 56: 14, 74: 79, 77: 151, 78: 205, 79: 223,
    82: 35, 83: 91, 85: 233
  };
  var UNBOUND = { 2: 1, 4: 1, 7: 1, 10: 1, 12: 1, 18: 1, 25: 1, 30: 1, 36: 1, 48: 1, 54: 1, 80: 1, 86: 1 };

  // Values for these elements are estimates/predictions, not measurements.
  function predicted(prop, z) {
    if (prop === 'density' || prop === 'melt' || prop === 'boil') return z >= 100 || z === 85 || z === 87;
    if (prop === 'electronegativity') return z >= 95;
    return false;
  }

  var PROPS = {
    electronegativity: {
      unit: '', decimals: 2,
      label: { en: 'Electronegativity', pt: 'Eletronegatividade' },
      source: { en: 'Pauling scale (CRC Handbook).', pt: 'Escala de Pauling (CRC Handbook).' }
    },
    mass: {
      unit: 'u', decimals: null,
      label: { en: 'Atomic mass', pt: 'Massa atômica' },
      source: { en: 'IUPAC standard atomic weights; [n] = mass number of the longest-lived isotope.', pt: 'Massas atômicas padrão da IUPAC; [n] = número de massa do isótopo mais estável.' }
    },
    covalent: {
      unit: 'pm', decimals: 0,
      label: { en: 'Covalent radius', pt: 'Raio covalente' },
      source: { en: 'Single-bond covalent radii, Cordero et al. (2008). No value after Cm (96).', pt: 'Raios covalentes de ligação simples, Cordero et al. (2008). Sem valor após o Cm (96).' }
    },
    ionization: {
      unit: 'kJ/mol', decimals: 0,
      label: { en: 'Ionization energy', pt: 'Energia de ionização' },
      source: { en: 'First ionization energy, spectroscopic values (NIST). No value after Lr (103).', pt: '1ª energia de ionização, valores espectroscópicos (NIST). Sem valor após o Lr (103).' }
    },
    affinity: {
      unit: 'kJ/mol', decimals: 0,
      label: { en: 'Electron affinity', pt: 'Afinidade eletrônica' },
      source: { en: 'CRC Handbook. ≤ 0: the anion is not stable. Blank: not listed here.', pt: 'CRC Handbook. ≤ 0: o ânion não é estável. Em branco: valor não incluído aqui.' }
    },
    density: {
      unit: 'g/cm³', decimals: 3,
      label: { en: 'Density', pt: 'Densidade' },
      source: { en: 'Solids and liquids near 20 °C; gases at 0 °C and 1 atm (converted from g/L). ≈ predicted.', pt: 'Sólidos e líquidos perto de 20 °C; gases a 0 °C e 1 atm (convertidos de g/L). ≈ previsto.' }
    },
    melt: {
      unit: '°C', decimals: 0,
      label: { en: 'Melting point', pt: 'Ponto de fusão' },
      source: { en: 'At 1 atm (As: under pressure, it sublimes at 1 atm). ≈ predicted.', pt: 'A 1 atm (As: sob pressão; a 1 atm ele sublima). ≈ previsto.' }
    },
    boil: {
      unit: '°C', decimals: 0,
      label: { en: 'Boiling point', pt: 'Ponto de ebulição' },
      source: { en: 'At 1 atm. ≈ predicted.', pt: 'A 1 atm. ≈ previsto.' }
    }
  };

  function num(s) {
    var m = /-?\d+(?:\.\d+)?/.exec(String(s == null ? '' : s).replace(/−/g, '-').replace(/,/g, '.'));
    return m ? parseFloat(m[0]) : NaN;
  }
  // Density in g/cm³ whatever unit the raw string uses.
  function density(raw) {
    var s = String(raw == null ? '' : raw);
    var v = num(s);
    if (!isFinite(v)) return null;
    if (/g\s*\/\s*L/i.test(s)) v = v / 1000;
    else if (/kg\s*\/\s*m/i.test(s)) v = v / 1000;
    return v;
  }

  /* value(prop, z, data) — data gives the raw element fields:
     { en, mass, density, melt, boil, ionization } (strings or numbers). */
  function value(prop, z, d) {
    d = d || {};
    var v = NaN;
    if (prop === 'electronegativity') v = num(d.en);
    else if (prop === 'mass') v = num(d.mass);
    else if (prop === 'covalent') v = COVALENT[z] != null ? COVALENT[z] : NaN;
    else if (prop === 'ionization') v = typeof d.ionization === 'number' ? d.ionization : NaN;
    else if (prop === 'affinity') v = AFFINITY[z] != null ? AFFINITY[z] : (UNBOUND[z] ? 0 : NaN);
    else if (prop === 'density') { var dd = density(d.density); v = dd == null ? NaN : dd; }
    else if (prop === 'melt') v = num(d.melt);
    else if (prop === 'boil') v = num(d.boil);
    return isFinite(v) ? v : null;
  }

  var SUP = { '-': '⁻', '0': '⁰', '1': '¹', '2': '²', '3': '³', '4': '⁴', '5': '⁵', '6': '⁶', '7': '⁷', '8': '⁸', '9': '⁹' };
  // Text for a card / legend: locale decimals, scientific notation for tiny densities.
  function format(prop, v, lang, z) {
    if (v == null) return '';
    var dec = lang === 'pt' ? ',' : '.';
    if (prop === 'affinity' && UNBOUND[z]) return '≤ 0';
    var p = PROPS[prop] || {};
    var s;
    if (prop === 'density' && v > 0 && v < 0.01) {
      var e = v.toExponential(1).split('e');
      s = e[0].replace('.', dec) + '·10' + String(parseInt(e[1], 10)).replace(/./g, function (c) { return SUP[c] || c; });
    } else if (prop === 'density') {
      s = (v >= 10 ? v.toFixed(1) : v.toFixed(2)).replace('.', dec);
    } else if (prop === 'mass') {
      s = String(v).replace('.', dec);
    } else {
      s = v.toFixed(p.decimals || 0).replace('.', dec);
    }
    if (lang === 'pt' && /^-?\d{4,}/.test(s)) s = s.replace(/^(-?\d+)(\d{3})/, '$1.$2');
    return (predicted(prop, z) ? '≈' : '') + s;
  }

  return {
    PROPS: PROPS, COVALENT: COVALENT, AFFINITY: AFFINITY, UNBOUND: UNBOUND,
    value: value, format: format, predicted: predicted, density: density
  };
});
