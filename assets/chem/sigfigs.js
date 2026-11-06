/* Atomurus — significant figures.
   countSig('0.00250') → { sig: 3, decimals: 5, ambiguous: false }
   countSig('1200')    → { sig: 2, decimals: 0, ambiguous: true }  (trailing zeros, no point)
   product([...])      → fewest significant figures among the inputs (× ÷)
   sum([...])          → fewest decimal places among the inputs (+ −)
   round(x, sig), format(x, sig, lang) → number / string with that many sig figs.
   Works in the browser (window.AtomurusSigFigs) and in Node. */
(function (root, factory) {
  var api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  else root.AtomurusSigFigs = api;
})(typeof self !== 'undefined' ? self : this, function () {
  'use strict';

  function clean(s) {
    return String(s == null ? '' : s).trim().replace(/\s+/g, '').replace(/×10\^?/i, 'e').replace(/·10\^?/i, 'e');
  }

  function countSig(input) {
    var s = clean(input);
    // Brazilian decimal comma when there is no point: "0,0250" → "0.0250"
    if (s.indexOf(',') >= 0 && s.indexOf('.') < 0) s = s.replace(',', '.');
    var m = /^[+-]?(\d*)(?:\.(\d*))?(?:[eE]([+-]?\d+))?$/.exec(s);
    if (!m || (!m[1] && !m[2])) return null;
    var intPart = m[1] || '', frac = m[2], hasPoint = frac !== undefined;
    frac = frac || '';
    var exp = m[3] ? parseInt(m[3], 10) : 0;
    var digits = (intPart + frac).replace(/^0+/, '');
    var sig, ambiguous = false;
    if (!digits) {
      // zero: count zeros after the point ("0.00" → 1 sig figure by convention)
      sig = Math.max(1, frac.length);
    } else if (hasPoint) {
      sig = digits.length;
    } else {
      var trimmed = digits.replace(/0+$/, '');
      sig = trimmed.length;
      if (trimmed.length < digits.length && !m[3]) ambiguous = true;
      if (m[3]) sig = digits.length;
    }
    var decimals = Math.max(0, frac.length - exp);
    return { sig: sig, decimals: decimals, ambiguous: ambiguous, value: parseFloat(s) };
  }

  function product(inputs) {
    var counts = inputs.map(countSig).filter(Boolean);
    if (!counts.length) return null;
    return Math.min.apply(null, counts.map(function (c) { return c.sig; }));
  }
  function sum(inputs) {
    var counts = inputs.map(countSig).filter(Boolean);
    if (!counts.length) return null;
    return Math.min.apply(null, counts.map(function (c) { return c.decimals; }));
  }

  function round(x, sig) {
    if (!isFinite(x) || x === 0 || !sig) return x;
    return Number(x.toPrecision(Math.max(1, Math.min(15, sig))));
  }

  var SUP = { '-': '⁻', '0': '⁰', '1': '¹', '2': '²', '3': '³', '4': '⁴', '5': '⁵', '6': '⁶', '7': '⁷', '8': '⁸', '9': '⁹' };
  // String with exactly `sig` significant figures; scientific notation when the
  // magnitude needs it (or when plain digits would hide the precision).
  function format(x, sig, lang) {
    if (!isFinite(x)) return '—';
    var dec = lang === 'pt' ? ',' : '.';
    sig = Math.max(1, Math.min(15, sig || 4));
    if (x === 0) return '0' + (sig > 1 ? dec + new Array(sig).join('0') : '');
    var exp = Math.floor(Math.log10(Math.abs(Number(x.toPrecision(sig)))));
    var plain = exp >= -3 && exp < 6 && (exp < sig || exp === 0);
    var out;
    if (plain) {
      var decimals = Math.max(0, sig - 1 - exp);
      out = x.toFixed(decimals);
      out = out.replace('.', dec);
      if (lang === 'pt') out = out.replace(/^(-?\d+)(\d{3})(?=,|$)/, '$1.$2');
    } else {
      var mant = x.toExponential(sig - 1).split('e');
      out = mant[0].replace('.', dec) + ' × 10' + String(parseInt(mant[1], 10)).replace(/./g, function (c) { return SUP[c] || c; });
    }
    return out;
  }

  // Decimal places to show for a logarithm (pH, pOH, pKa): equal to the
  // significant figures of the concentration.
  function logDecimals(concInput) {
    var c = countSig(concInput);
    return c ? c.sig : 2;
  }

  return { countSig: countSig, product: product, sum: sum, round: round, format: format, logDecimals: logDecimals };
});
