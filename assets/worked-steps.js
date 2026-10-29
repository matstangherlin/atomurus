/* Worked solutions, in words (prompt 30). The engines in calc-core.js return
   steps[] as raw numbers — { id, vars, value?, unit?, answer? } — and this
   file only puts them into PT or EN text and expressions. No arithmetic
   beyond formatting happens here: what the student reads is the calculation
   the calculator really did. No DOM. */
(function (root, factory) {
  var api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  root.AtomurusWorkedSteps = api;
})(typeof globalThis !== 'undefined' ? globalThis : this, function () {
  'use strict';

  var TEXT = {
    'mm.count': { en: 'Count the atoms of each element in the formula.', pt: 'Conte os átomos de cada elemento da fórmula.' },
    'mm.weights': { en: 'Look up each atomic mass in g/mol (abridged standard atomic weights, CIAAW).', pt: 'Procure a massa atômica de cada elemento em g/mol (massas atômicas padrão abreviadas, CIAAW).' },
    'mm.terms': { en: 'Multiply each atomic mass by its number of atoms.', pt: 'Multiplique cada massa atômica pelo número de átomos.' },
    'mm.sum': { en: 'Add the contributions: the sum is the molar mass.', pt: 'Some as contribuições: a soma é a massa molar.' },
    'mm.kg': { en: 'Write the mass in grams.', pt: 'Escreva a massa em gramas.' },
    'mm.moles': { en: 'Amount of substance: n = m / M.', pt: 'Quantidade de matéria: n = m / M.' },
    'mm.mass': { en: 'Mass: m = n × M.', pt: 'Massa: m = n × M.' },
    'sp.volume': { en: 'Write the volume in litres.', pt: 'Escreva o volume em litros.' },
    'sp.amount': { en: 'Amount of solute the solution needs: n = C × V.', pt: 'Quantidade de soluto que a solução precisa: n = C × V.' },
    'bf.hh': { en: 'Henderson–Hasselbalch: pH = pKa + log₁₀([A⁻]/[HA]), so log₁₀([A⁻]/[HA]) = pH − pKa.', pt: 'Henderson–Hasselbalch: pH = pKa + log₁₀([A⁻]/[HA]), então log₁₀([A⁻]/[HA]) = pH − pKa.' },
    'bf.ratio': { en: 'Undo the logarithm to get the ratio.', pt: 'Desfaça o logaritmo para obter a razão.' },
    'bf.range': { en: 'A buffer works well while the ratio stays between {min} and {max} (pH = pKa ± 1).', pt: 'Um tampão funciona bem enquanto a razão fica entre {min} e {max} (pH = pKa ± 1).' },
    'ig.si': { en: 'Write the data in SI units (Pa, m³, mol, K).', pt: 'Escreva os dados em unidades do SI (Pa, m³, mol, K).' },
    'ig.isolate': { en: 'Isolate {q} in PV = nRT.', pt: 'Isole {q} em PV = nRT.' },
    'ig.substitute': { en: 'Substitute, with R = {R} J·K⁻¹·mol⁻¹ (CODATA 2018).', pt: 'Substitua, com R = {R} J·K⁻¹·mol⁻¹ (CODATA 2018).' },
    'ig.back': { en: 'Convert the result to the unit asked.', pt: 'Converta o resultado para a unidade pedida.' },
    'dl.identify': { en: 'Diluting does not change the amount of solute, so C₁V₁ = C₂V₂. The data:', pt: 'Diluir não muda a quantidade de soluto, então C₁V₁ = C₂V₂. Os dados:' },
    'dl.isolate': { en: 'Isolate {q}.', pt: 'Isole {q}.' },
    'dl.substitute': { en: 'Substitute (both volumes in the same unit).', pt: 'Substitua (os dois volumes na mesma unidade).' },
    'ph.strong.H': { en: 'A strong acid ionizes completely, so [H⁺] equals its concentration.', pt: 'Um ácido forte ioniza totalmente, então [H⁺] é igual à sua concentração.' },
    'ph.strong.OH': { en: 'A strong base dissociates completely, so [OH⁻] equals its concentration.', pt: 'Uma base forte se dissocia totalmente, então [OH⁻] é igual à sua concentração.' },
    'ph.autoion': { en: 'So dilute that the ions of water itself count: {ion} = (c + √(c² + 4Kw)) / 2, with Kw = {Kw} at 25 °C.', pt: 'Tão diluída que os íons da própria água contam: {ion} = (c + √(c² + 4Kw)) / 2, com Kw = {Kw} a 25 °C.' },
    'ph.log': { en: 'Take minus the base-10 logarithm.', pt: 'Calcule menos o logaritmo decimal.' },
    'ph.pow': { en: 'Undo the logarithm: {ion} = 10^(−{p}).', pt: 'Desfaça o logaritmo: {ion} = 10^(−{p}).' },
    'ph.complement': { en: 'At 25 °C, pH + pOH = 14.', pt: 'A 25 °C, pH + pOH = 14.' },
    'ph.nature': { en: 'Compare with 7 (neutral within ±{eps} at 25 °C): the solution is {nature}.', pt: 'Compare com 7 (neutra dentro de ±{eps} a 25 °C): a solução é {nature}.' }
  };
  var NATURE = {
    en: { acidic: 'acidic', slightlyAcidic: 'slightly acidic', neutral: 'neutral', slightlyBasic: 'slightly basic', basic: 'basic' },
    pt: { acidic: 'ácida', slightlyAcidic: 'levemente ácida', neutral: 'neutra', slightlyBasic: 'levemente básica', basic: 'básica' }
  };
  var SUB = { C1: 'C₁', V1: 'V₁', C2: 'C₂', V2: 'V₂' };
  var ION = { H: '[H⁺]', OH: '[OH⁻]' };
  var P_OF = { H: 'pH', OH: 'pOH' };
  var IG_ISOLATE = { P: 'P = nRT / V', V: 'V = nRT / P', n: 'n = PV / (RT)', T: 'T = PV / (nR)' };
  var DL_ISOLATE = { C1: 'C₁ = C₂V₂ / V₁', V1: 'V₁ = C₂V₂ / C₁', C2: 'C₂ = C₁V₁ / V₂', V2: 'V₂ = C₁V₁ / C₂' };
  var SUP = '⁰¹²³⁴⁵⁶⁷⁸⁹';

  function sup(e) {
    var out = e < 0 ? '⁻' : '';
    String(Math.abs(e)).split('').forEach(function (d) { out += SUP[d]; });
    return out;
  }
  function dec(text, pt) {
    text = String(text).replace(/^-/, '−');
    return pt ? text.replace('.', ',') : text;
  }
  function tiny(n) {
    var a = Math.abs(n);
    return n !== 0 && (a >= 1e5 || a < 1e-3);
  }
  function sci(n, digits, pt, strip) {
    var m = n.toExponential(digits).split('e');
    return dec(strip ? String(Number(m[0])) : m[0], pt) + ' × 10' + sup(Number(m[1]));
  }
  /* sig significant figures; scientific notation outside 0.001…100 000. */
  function formatNumber(n, sig, locale) {
    var pt = locale === 'pt';
    if (!isFinite(n)) return '∞';
    if (n === 0) return '0';
    if (tiny(n)) return sci(n, sig - 1, pt, false);
    return dec(String(Number(n.toPrecision(sig))), pt);
  }
  /* A number as given (data, table values): no rounding beyond float noise. */
  function plain(n, pt) {
    var a = Math.abs(n);
    if (n !== 0 && (a >= 1e7 || a < 1e-4)) return sci(n, 9, pt, true);
    return dec(String(Number(n.toPrecision(10))), pt);
  }
  function fixed(n, d, pt) {
    return dec(Number(n).toFixed(d), pt);
  }
  function unit(u) {
    return u === 'm3' ? 'm³' : u;
  }
  function fill(text, vars) {
    return text.replace(/\{(\w+)\}/g, function (_, k) { return vars[k] != null ? vars[k] : ''; });
  }

  function describe(steps, opts) {
    opts = opts || {};
    var locale = opts.locale === 'pt' ? 'pt' : 'en';
    var pt = locale === 'pt';
    var F = function (n, sig) { return formatNumber(n, sig || 4, locale); };
    var A = opts.fmt || F; // the answer uses the page's own formatter
    var P = function (n) { return plain(n, pt); };
    var nature = opts.nature || function (key) { return NATURE[locale][key]; };
    var answer = '';
    var out = (steps || []).map(function (step) {
      var v = step.vars || {};
      var key = step.id === 'ph.strong' ? 'ph.strong.' + v.ion : step.id;
      var words = {};
      var expr = '';
      var result = '';
      switch (step.id) {
        case 'mm.count':
          expr = v.rows.map(function (r) { return r.sym + ': ' + r.count; }).join(' · ');
          break;
        case 'mm.weights':
          expr = v.rows.map(function (r) { return 'A(' + r.sym + ') = ' + P(r.mass); }).join(' · ');
          break;
        case 'mm.terms':
          expr = v.rows.map(function (r) { return r.count + ' × ' + P(r.mass) + ' = ' + P(r.cont); }).join(' · ');
          break;
        case 'mm.sum':
          expr = 'M = ' + v.rows.map(function (r) { return P(r.cont); }).join(' + ') + ' = ' + F(v.M, 5) + ' g/mol';
          result = 'M = ' + A(v.M, 5) + ' g/mol';
          break;
        case 'mm.kg':
          expr = 'm = ' + P(v.kg) + ' kg × 1000 = ' + F(v.g) + ' g';
          break;
        case 'mm.moles':
          expr = 'n = ' + F(v.m) + ' g ÷ ' + F(v.M, 5) + ' g/mol = ' + F(v.n) + ' mol';
          result = 'n = ' + A(v.n) + ' mol';
          break;
        case 'mm.mass':
          expr = 'm = ' + F(v.n) + ' mol × ' + F(v.M, 5) + ' g/mol = ' + F(v.m) + ' g';
          result = 'm = ' + A(v.m) + ' g';
          break;
        case 'sp.volume':
          expr = 'V = ' + P(v.mL) + ' mL ÷ 1000 = ' + P(v.L) + ' L';
          break;
        case 'sp.amount':
          expr = 'n = ' + P(v.C) + ' mol/L × ' + P(v.L) + ' L = ' + F(v.n) + ' mol';
          break;
        case 'bf.hh':
          expr = 'log₁₀([A⁻]/[HA]) = ' + fixed(v.pH, 2, pt) + ' − ' + P(Math.round(v.pKa * 1e6) / 1e6) + ' = ' + fixed(v.pH - v.pKa, 3, pt);
          break;
        case 'bf.ratio':
          expr = '[A⁻]/[HA] = 10^' + fixed(v.diff, 3, pt) + ' = ' + F(v.ratio);
          result = '[A⁻]/[HA] = ' + A(v.ratio);
          break;
        case 'bf.range':
          words.min = P(v.min);
          words.max = P(v.max);
          expr = v.inRange
            ? P(v.min) + ' ≤ ' + F(v.ratio) + ' ≤ ' + P(v.max) + ' ✓'
            : F(v.ratio) + (v.ratio < v.min ? ' < ' + P(v.min) : ' > ' + P(v.max)) + ' ✗';
          break;
        case 'ig.si':
          expr = v.given.map(function (g) {
            var head = g.q + ' = ' + P(g.v) + ' ' + g.u;
            return g.u === g.siUnit ? head : head + ' = ' + P(g.si) + ' ' + unit(g.siUnit);
          }).join(' · ');
          break;
        case 'ig.isolate':
          words.q = v.solve;
          expr = IG_ISOLATE[v.solve];
          break;
        case 'ig.substitute': {
          var s = v.si;
          var R = F(v.R, 5);
          words.R = R;
          var rhs = {
            P: '(' + P(s.n) + ' mol × ' + R + ' × ' + P(s.T) + ' K) / ' + P(s.V) + ' m³',
            V: '(' + P(s.n) + ' mol × ' + R + ' × ' + P(s.T) + ' K) / ' + P(s.P) + ' Pa',
            n: '(' + P(s.P) + ' Pa × ' + P(s.V) + ' m³) / (' + R + ' × ' + P(s.T) + ' K)',
            T: '(' + P(s.P) + ' Pa × ' + P(s.V) + ' m³) / (' + P(s.n) + ' mol × ' + R + ')'
          }[v.solve];
          expr = v.solve + ' = ' + rhs + ' = ' + F(step.value) + ' ' + unit(v.unit);
          result = v.solve + ' = ' + A(step.value) + ' ' + unit(v.unit);
          break;
        }
        case 'ig.back':
          expr = v.solve + ' = ' + F(v.si) + ' ' + unit(v.siUnit) + ' = ' + F(v.value) + ' ' + unit(v.unit);
          result = v.solve + ' = ' + A(v.value) + ' ' + unit(v.unit);
          break;
        case 'dl.identify':
          expr = v.known.map(function (k) { return SUB[k.q] + ' = ' + P(k.v) + ' ' + k.u; }).join(' · ');
          break;
        case 'dl.isolate':
          words.q = SUB[v.solve];
          expr = DL_ISOLATE[v.solve];
          break;
        case 'dl.substitute': {
          var x = v.values;
          var q = function (k) { return P(x[k]) + ' ' + (k.charAt(0) === 'C' ? 'mol/L' : 'mL'); };
          var form = {
            C1: '(' + q('C2') + ' × ' + q('V2') + ') / ' + q('V1'),
            V1: '(' + q('C2') + ' × ' + q('V2') + ') / ' + q('C1'),
            C2: '(' + q('C1') + ' × ' + q('V1') + ') / ' + q('V2'),
            V2: '(' + q('C1') + ' × ' + q('V1') + ') / ' + q('C2')
          }[v.solve];
          expr = SUB[v.solve] + ' = ' + form + ' = ' + F(step.value) + ' ' + v.unit;
          result = SUB[v.solve] + ' = ' + A(step.value) + ' ' + v.unit;
          break;
        }
        case 'ph.strong':
          expr = ION[v.ion] + ' = ' + F(v.x) + ' mol/L';
          break;
        case 'ph.autoion':
          words.ion = ION[v.ion];
          words.Kw = F(v.Kw, 2);
          expr = ION[v.ion] + ' = (' + P(v.c) + ' + √((' + P(v.c) + ')² + 4 × ' + F(v.Kw, 2) + ')) / 2 = ' + F(v.x) + ' mol/L';
          break;
        case 'ph.log':
          expr = P_OF[v.ion] + ' = −log₁₀(' + F(v.x) + ') = ' + fixed(v.p, 2, pt);
          result = P_OF[v.ion] + ' = ' + fixed(v.p, 2, pt);
          break;
        case 'ph.pow':
          words.ion = ION[v.ion];
          words.p = P_OF[v.ion];
          expr = ION[v.ion] + ' = 10^(−' + P(v.p) + ') = ' + F(v.x) + ' mol/L';
          result = ION[v.ion] + ' = ' + A(v.x) + ' mol/L';
          break;
        case 'ph.complement': {
          var other = v.from === 'pH' ? 'pOH' : 'pH';
          expr = other + ' = 14 − ' + fixed(v.p, 2, pt) + ' = ' + fixed(v.q, 2, pt);
          result = other + ' = ' + fixed(v.q, 2, pt);
          break;
        }
        case 'ph.nature':
          words.eps = P(v.eps);
          words.nature = nature(v.key) || NATURE[locale][v.key];
          expr = 'pH = ' + fixed(v.pH, 2, pt) + (v.key === 'neutral' ? ' ≈ 7' : /Acidic|^acidic/.test(v.key) ? ' < 7' : ' > 7');
          break;
        default:
          return null;
      }
      var text = TEXT[key] ? fill(TEXT[key][locale], words) : '';
      // opts.answerStep picks another step's result (an exercise asking for n).
      if (opts.answerStep ? step.id === opts.answerStep : step.answer) answer = result;
      return { id: step.id, text: text, expr: expr };
    }).filter(Boolean);
    return { steps: out, answer: answer };
  }

  return {
    TEXT: TEXT,
    NATURE: NATURE,
    describe: describe,
    formatNumber: formatNumber,
    plain: function (n, locale) { return plain(n, locale === 'pt'); }
  };
});
