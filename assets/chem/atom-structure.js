/* Atomurus — structure of any atom or ion for the atomic-model viewers:
   ground-state electron configuration (Madelung order + the measured
   exceptions), ions (cations lose the highest-n electrons first: 4s before
   3d), Bohr shell counts, the most abundant isotope, and hydrogen-like
   orbital sampling (radial |R_nl|² and the real s, p, d, f angular shapes)
   for the quantum cloud. Browser: window.AtomurusAtom. Node: module.exports. */
(function (root) {
  'use strict';

  var L_LETTER = ['s', 'p', 'd', 'f'];
  var SUP = { 0: '⁰', 1: '¹', 2: '²', 3: '³', 4: '⁴', 5: '⁵', 6: '⁶', 7: '⁷', 8: '⁸', 9: '⁹' };
  function sup(n) { return String(n).split('').map(function (c) { return SUP[c] || c; }).join(''); }

  /* Subshells in filling order (n + l, then n). */
  var MADELUNG = (function () {
    var list = [];
    for (var n = 1; n <= 7; n++) for (var l = 0; l < Math.min(n, 4); l++) list.push([n, l]);
    return list.sort(function (a, b) { return (a[0] + a[1]) - (b[0] + b[1]) || a[0] - b[0]; });
  })();
  function cap(l) { return 2 * (2 * l + 1); }

  /* Ground states that differ from the Madelung filling (NIST ASD):
     subshell → electrons, applied on top of the Madelung result. */
  var EXCEPTIONS = {
    24: { '3d': 5, '4s': 1 }, 29: { '3d': 10, '4s': 1 },
    41: { '4d': 4, '5s': 1 }, 42: { '4d': 5, '5s': 1 }, 44: { '4d': 7, '5s': 1 },
    45: { '4d': 8, '5s': 1 }, 46: { '4d': 10, '5s': 0 }, 47: { '4d': 10, '5s': 1 },
    57: { '4f': 0, '5d': 1 }, 58: { '4f': 1, '5d': 1 }, 64: { '4f': 7, '5d': 1 },
    78: { '5d': 9, '6s': 1 }, 79: { '5d': 10, '6s': 1 },
    89: { '5f': 0, '6d': 1 }, 90: { '5f': 0, '6d': 2 }, 91: { '5f': 2, '6d': 1 },
    92: { '5f': 3, '6d': 1 }, 93: { '5f': 4, '6d': 1 }, 96: { '5f': 7, '6d': 1 },
    103: { '6d': 0, '7p': 1 }
  };

  /* Mass number of the most abundant isotope (longest-lived / standard mass
     for elements without stable isotopes), Z = 1…118. Generated from
     isotopes-data.js and the element masses. */
  var MOST_ABUNDANT_A = [1,4,7,9,11,12,14,16,19,20,23,24,27,28,31,32,35,40,39,40,45,48,51,52,55,56,59,58,63,64,69,74,75,80,79,84,85,88,89,90,93,98,97,102,103,106,107,114,115,120,121,130,127,132,133,138,139,140,141,142,145,152,153,158,159,164,165,166,169,174,175,180,181,184,187,192,193,195,197,202,205,208,209,209,210,222,223,226,227,232,231,238,237,244,243,247,247,251,252,257,258,259,266,267,268,269,270,271,278,281,282,285,286,289,290,293,294,294];

  function key(n, l) { return n + L_LETTER[l]; }

  /* Neutral ground state: [{ n, l, e }] in Madelung order. */
  function groundState(z) {
    z = Math.max(0, Math.min(118, z | 0));
    var occ = {};
    var left = z;
    MADELUNG.forEach(function (s) {
      var e = Math.min(cap(s[1]), left);
      occ[key(s[0], s[1])] = e;
      left -= e;
    });
    var ex = EXCEPTIONS[z];
    if (ex) Object.keys(ex).forEach(function (k) { occ[k] = ex[k]; });
    return MADELUNG.map(function (s) { return { n: s[0], l: s[1], e: occ[key(s[0], s[1])] || 0 }; })
      .filter(function (s) { return s.e > 0; });
  }

  /* Ion of charge q (positive = cation). Cations lose electrons from the
     highest n first (then the highest l); anions gain them in filling order. */
  function configuration(z, q) {
    var subs = groundState(z).map(function (s) { return { n: s.n, l: s.l, e: s.e }; });
    q = q | 0;
    if (q > 0) {
      for (var i = 0; i < q; i++) {
        var best = null;
        subs.forEach(function (s) {
          if (s.e > 0 && (!best || s.n > best.n || (s.n === best.n && s.l > best.l))) best = s;
        });
        if (!best) break;
        best.e--;
      }
    } else if (q < 0) {
      for (var j = 0; j < -q; j++) {
        var placed = false;
        for (var m = 0; m < MADELUNG.length && !placed; m++) {
          var n = MADELUNG[m][0], l = MADELUNG[m][1];
          var s = subs.filter(function (x) { return x.n === n && x.l === l; })[0];
          if (!s) { s = { n: n, l: l, e: 0 }; subs.push(s); }
          if (s.e < cap(l)) { s.e++; placed = true; }
        }
      }
    }
    return subs.filter(function (s) { return s.e > 0; })
      .sort(function (a, b) { return a.n - b.n || a.l - b.l; });
  }

  /* Electrons per shell K, L, M… */
  function shells(subs) {
    var out = [];
    subs.forEach(function (s) { out[s.n - 1] = (out[s.n - 1] || 0) + s.e; });
    for (var i = 0; i < out.length; i++) out[i] = out[i] || 0;
    return out;
  }

  /* "1s² 2s² 2p⁶ 3s¹", optionally with the noble-gas core: "[Ne] 3s¹". */
  var NOBLE = [[2, 'He'], [10, 'Ne'], [18, 'Ar'], [36, 'Kr'], [54, 'Xe'], [86, 'Rn']];
  function notation(subs, short) {
    subs = subs.slice().sort(function (a, b) { return a.n - b.n || a.l - b.l; });
    var parts = subs.map(function (s) { return s.n + L_LETTER[s.l] + sup(s.e); });
    if (!short) return parts.join(' ');
    var total = subs.reduce(function (a, s) { return a + s.e; }, 0);
    for (var i = NOBLE.length - 1; i >= 0; i--) {
      var core = groundState(NOBLE[i][0]);
      if (NOBLE[i][0] >= total) continue;
      var rest = subs.map(function (s) { return { n: s.n, l: s.l, e: s.e }; });
      var ok = core.every(function (c) {
        var r = rest.filter(function (s) { return s.n === c.n && s.l === c.l; })[0];
        if (!r || r.e < c.e) return false;
        r.e -= c.e;
        return true;
      });
      if (ok) {
        var tail = rest.filter(function (s) { return s.e > 0; }).map(function (s) { return s.n + L_LETTER[s.l] + sup(s.e); });
        return '[' + NOBLE[i][1] + ']' + (tail.length ? ' ' + tail.join(' ') : '');
      }
    }
    return parts.join(' ');
  }

  /* Electrons in each orbital of a subshell: one per orbital first, then pairs (Hund). */
  function orbitals(l, e) {
    var k = 2 * l + 1, out = [];
    for (var i = 0; i < k; i++) out.push(0);
    for (var j = 0; j < e; j++) out[j % k]++;
    return out;
  }

  function neutrons(z) {
    var a = MOST_ABUNDANT_A[(z | 0) - 1];
    return a ? a - z : 0;
  }

  /* ── hydrogen-like orbital sampling (visual scale) ──────────────────
     Radial density P(r) = r²·R_nl(r)², R_nl ∝ ρ^l e^(−ρ/2) L_(n−l−1)^(2l+1)(ρ),
     ρ = 2r/(n·a_n). a_n shrinks with n so that heavy atoms stay a readable
     size; the radial nodes and the order of the shells are exact. */
  var A_N = [1.1, 0.75, 0.45, 0.315, 0.24, 0.19, 0.16];

  function laguerre(k, alpha, x) {
    if (k === 0) return 1;
    var l0 = 1, l1 = 1 + alpha - x;
    for (var i = 1; i < k; i++) {
      var l2 = ((2 * i + 1 + alpha - x) * l1 - (i + alpha) * l0) / (i + 1);
      l0 = l1; l1 = l2;
    }
    return l1;
  }
  function radialPdf(n, l) {
    var a = A_N[n - 1];
    return function (r) {
      var rho = 2 * r / (n * a);
      var R = Math.pow(rho, l) * Math.exp(-rho / 2) * laguerre(n - l - 1, 2 * l + 1, rho);
      return r * r * R * R;
    };
  }
  function radialMax(n) { return 3.6 * n * n * A_N[n - 1] + 1.5 * A_N[n - 1]; }

  /* Inverse-CDF sampler over a tabulated pdf: stable, no rejection loop. */
  function radialSampler(n, l, rand) {
    var pdf = radialPdf(n, l), rMax = radialMax(n), bins = 240;
    var cdf = new Float64Array(bins), acc = 0;
    for (var i = 0; i < bins; i++) { acc += pdf((i + 0.5) * rMax / bins); cdf[i] = acc; }
    // the last 1.5 % of the tail is left out: a few far points would read as noise
    var sampler = function () {
      var u = rand() * acc * 0.985, lo = 0, hi = bins - 1;
      while (lo < hi) { var mid = (lo + hi) >> 1; if (cdf[mid] < u) lo = mid + 1; else hi = mid; }
      return (lo + rand()) * rMax / bins;
    };
    sampler.quantile = function (p) {
      var target = p * acc;
      for (var j = 0; j < bins; j++) if (cdf[j] >= target) return (j + 1) * rMax / bins;
      return rMax;
    };
    return sampler;
  }

  /* Real angular functions (unnormalized) for l = 0…3, one per orbital. */
  var ANGULAR = [
    [function () { return 1; }],
    [function (x) { return x; }, function (x, y) { return y; }, function (x, y, z) { return z; }],
    [function (x, y, z) { return 3 * z * z - 1; }, function (x, y, z) { return x * z; }, function (x, y, z) { return y * z; },
     function (x, y) { return x * y; }, function (x, y) { return x * x - y * y; }],
    [function (x, y, z) { return z * (5 * z * z - 3); }, function (x, y, z) { return x * (5 * z * z - 1); },
     function (x, y, z) { return y * (5 * z * z - 1); }, function (x, y, z) { return x * y * z; },
     function (x, y, z) { return z * (x * x - y * y); }, function (x, y) { return x * (x * x - 3 * y * y); },
     function (x, y) { return y * (3 * x * x - y * y); }]
  ];
  var ANG_NAMES = [['s'], ['pₓ', 'p_y', 'p_z'], ['d_z²', 'd_xz', 'd_yz', 'd_xy', 'd_x²−y²'], ['f_z³', 'f_xz²', 'f_yz²', 'f_xyz', 'f_z(x²−y²)', 'f_x(x²−3y²)', 'f_y(3x²−y²)']];
  var angMax = {};
  function maxOf(l, m) {
    var k = l + ':' + m;
    if (angMax[k]) return angMax[k];
    var f = ANGULAR[l][m], best = 0, N = 4000, g = Math.PI * (3 - Math.sqrt(5));
    for (var i = 0; i < N; i++) {
      var z = 1 - 2 * (i + 0.5) / N, r = Math.sqrt(1 - z * z), t = g * i;
      var v = f(r * Math.cos(t), r * Math.sin(t), z);
      if (v * v > best) best = v * v;
    }
    return (angMax[k] = best * 1.02);
  }
  function direction(l, m, rand) {
    var f = ANGULAR[l][m], mx = maxOf(l, m);
    for (var guard = 0; guard < 400; guard++) {
      var z = 2 * rand() - 1, r = Math.sqrt(1 - z * z), t = 2 * Math.PI * rand();
      var x = r * Math.cos(t), y = r * Math.sin(t);
      var v = f(x, y, z);
      if (rand() * mx <= v * v) return [x, y, z];
    }
    return [0, 0, 1];
  }

  /* Points of the electron cloud: for each subshell, `perElectron` points per
     electron spread over its orbitals (Hund). Returns
     [{ n, l, e, points: Float32Array(x,y,z…), r95 }]. */
  function cloud(subs, perElectron, rand) {
    rand = rand || Math.random;
    return subs.map(function (s) {
      var occ = orbitals(s.l, s.e);
      var radial = radialSampler(s.n, s.l, rand);
      var total = s.e * perElectron;
      var pts = new Float32Array(total * 3), w = 0;
      occ.forEach(function (count, m) {
        for (var i = 0; i < count * perElectron; i++) {
          var r = radial(), d = direction(s.l, m, rand);
          pts[w++] = d[0] * r; pts[w++] = d[1] * r; pts[w++] = d[2] * r;
        }
      });
      return { n: s.n, l: s.l, e: s.e, points: pts, r95: radial.quantile(0.95) };
    });
  }

  var API = {
    L_LETTER: L_LETTER,
    MADELUNG: MADELUNG,
    groundState: groundState,
    configuration: configuration,
    shells: shells,
    notation: notation,
    orbitals: orbitals,
    neutrons: neutrons,
    massNumber: function (z) { return MOST_ABUNDANT_A[(z | 0) - 1] || 0; },
    radialPdf: radialPdf,
    radialSampler: radialSampler,
    direction: direction,
    angularNames: ANG_NAMES,
    cloud: cloud,
    sup: sup
  };
  if (typeof module !== 'undefined' && module.exports) module.exports = API;
  else root.AtomurusAtom = API;
})(typeof window !== 'undefined' ? window : this);
