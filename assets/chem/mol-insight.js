/* Atomurus — molecule insight.
   analyze({ atoms:[{el, pos:[x,y,z]}], bonds:[[i, j, order]] }) →
     formula, molar mass, bond types (Δχ, polar / apolar / ionic),
     shape at every central atom (read from the 3D angles, VSEPR names),
     angles grouped by label (H–O–H …), net bond-dipole vector and a
     polarity verdict.
   REFERENCE holds measured gas-phase values (dipole moment, bond lengths,
   bond angles, point group) for the curated molecules.
   Works in the browser (window.AtomurusMolInsight) and in Node. */
(function (root, factory) {
  var api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  else root.AtomurusMolInsight = api;
})(typeof self !== 'undefined' ? self : this, function () {
  'use strict';

  // Pauling electronegativity.
  var CHI = { H: 2.20, C: 2.55, N: 3.04, O: 3.44, F: 3.98, Na: 0.93, P: 2.19, S: 2.58, Cl: 3.16, Br: 2.96, I: 2.66, Fe: 1.83 };
  var MASS = { H: 1.008, C: 12.011, N: 14.007, O: 15.999, F: 18.998, Na: 22.990, P: 30.974, S: 32.06, Cl: 35.45, Fe: 55.845, Br: 79.904, I: 126.904 };
  var METAL = { Na: 1, Fe: 1 };
  var HILL_FIRST = { C: 0, H: 1 };

  function sub(a, b) { return [a[0] - b[0], a[1] - b[1], a[2] - b[2]]; }
  function len(v) { return Math.sqrt(v[0] * v[0] + v[1] * v[1] + v[2] * v[2]); }
  function dot(a, b) { return a[0] * b[0] + a[1] * b[1] + a[2] * b[2]; }
  function angle(c, a, b) {
    var u = sub(a, c), v = sub(b, c);
    var cos = dot(u, v) / (len(u) * len(v) || 1);
    return Math.acos(Math.max(-1, Math.min(1, cos))) * 180 / Math.PI;
  }

  var SUBS = ['₀', '₁', '₂', '₃', '₄', '₅', '₆', '₇', '₈', '₉'];
  function subNum(n) { return String(n).replace(/\d/g, function (d) { return SUBS[+d]; }); }

  function formula(atoms) {
    var counts = {};
    atoms.forEach(function (a) { if (a.el) counts[a.el] = (counts[a.el] || 0) + 1; });
    var els = Object.keys(counts);
    var hasC = !!counts.C;
    els.sort(function (a, b) {
      if (hasC) {
        var oa = HILL_FIRST[a] != null ? HILL_FIRST[a] : 9, ob = HILL_FIRST[b] != null ? HILL_FIRST[b] : 9;
        if (oa !== ob) return oa - ob;
      }
      return a < b ? -1 : 1;
    });
    var mass = 0;
    els.forEach(function (el) { mass += (MASS[el] || 0) * counts[el]; });
    return {
      text: els.map(function (el) { return el + (counts[el] > 1 ? subNum(counts[el]) : ''); }).join(''),
      counts: counts,
      mass: mass
    };
  }

  // Shape at an atom from the number of neighbours and the measured angles.
  function shapeOf(n, angles) {
    if (n < 2) return null;
    var max = Math.max.apply(null, angles), sum = angles.reduce(function (s, x) { return s + x; }, 0);
    if (n === 2) return max > 172 ? 'linear' : 'bent';
    if (n === 3) {
      if (sum > 354) return max > 172 ? 't-shaped' : 'trigonal-planar';
      return 'trigonal-pyramidal';
    }
    if (n === 4) {
      var straight = angles.filter(function (x) { return x > 165; }).length;
      if (straight >= 2) return 'square-planar';
      if (straight === 1) return 'seesaw';
      return 'tetrahedral';
    }
    if (n === 5) return 'trigonal-bipyramidal';
    if (n === 6) return 'octahedral';
    return null;
  }

  var SHAPE_NAMES = {
    linear: { en: 'linear', pt: 'linear' },
    bent: { en: 'bent', pt: 'angular' },
    'trigonal-planar': { en: 'trigonal planar', pt: 'trigonal plana' },
    'trigonal-pyramidal': { en: 'trigonal pyramidal', pt: 'piramidal' },
    't-shaped': { en: 'T-shaped', pt: 'em T' },
    tetrahedral: { en: 'tetrahedral', pt: 'tetraédrica' },
    'square-planar': { en: 'square planar', pt: 'quadrado planar' },
    seesaw: { en: 'seesaw', pt: 'gangorra' },
    'trigonal-bipyramidal': { en: 'trigonal bipyramidal', pt: 'bipirâmide trigonal' },
    octahedral: { en: 'octahedral', pt: 'octaédrica' }
  };

  var BOND_SYM = { 1: '–', 2: '=', 3: '≡' };
  function bondKind(e1, e2) {
    var d = Math.abs((CHI[e1] || 2.5) - (CHI[e2] || 2.5));
    if ((METAL[e1] || METAL[e2]) && d >= 1.2) return 'ionic';
    if (d >= 1.7) return 'ionic';
    if (d >= 0.4) return 'polar';
    return 'apolar';
  }

  function analyze(model) {
    var atoms = model.atoms || [], bonds = (model.bonds || []).map(function (b) {
      return Array.isArray(b) ? { a: b[0], b: b[1], o: b[2] || 1 } : { a: b.a, b: b.b, o: b.o || b.order || 1 };
    });
    var n = atoms.length;
    var adj = atoms.map(function () { return []; });
    bonds.forEach(function (b) { adj[b.a].push(b.b); adj[b.b].push(b.a); });
    var f = formula(atoms);

    // Bond types
    var types = {};
    bonds.forEach(function (b) {
      var e1 = atoms[b.a].el, e2 = atoms[b.b].el;
      var label = bondLabel(e1, e2, b.o);
      if (!types[label]) types[label] = { label: label, order: b.o, count: 0, dchi: Math.abs((CHI[e1] || 0) - (CHI[e2] || 0)), kind: bondKind(e1, e2), lengths: [] };
      types[label].count++;
      types[label].lengths.push(len(sub(atoms[b.a].pos, atoms[b.b].pos)));
    });
    var bondTypes = Object.keys(types).map(function (k) {
      var t = types[k];
      t.length = t.lengths.reduce(function (s, x) { return s + x; }, 0) / t.lengths.length;
      delete t.lengths;
      return t;
    }).sort(function (a, b) { return b.count - a.count; });
    var ionic = bondTypes.some(function (t) { return t.kind === 'ionic'; });

    // Centres and angles
    var centers = [], angleGroups = {};
    for (var c = 0; c < n; c++) {
      var nb = adj[c];
      if (nb.length < 2) continue;
      var list = [];
      for (var x = 0; x < nb.length; x++) for (var y = x + 1; y < nb.length; y++) {
        var ea = atoms[nb[x]].el, eb = atoms[nb[y]].el;
        var ends = [ea, eb].sort();
        var lbl = ends[0] + '–' + atoms[c].el + '–' + ends[1];
        var deg = angle(atoms[c].pos, atoms[nb[x]].pos, atoms[nb[y]].pos);
        list.push(deg);
        (angleGroups[lbl] = angleGroups[lbl] || []).push(deg);
      }
      centers.push({ index: c, el: atoms[c].el, neighbours: nb.length, shape: shapeOf(nb.length, list) });
    }
    var angles = Object.keys(angleGroups).map(function (k) {
      var v = angleGroups[k];
      var mean = v.reduce(function (s, x) { return s + x; }, 0) / v.length;
      // distinct values (e.g. 90° and 180° in SF₆, 109.5° and 120° in an alkene)
      var sorted = v.slice().sort(function (a, b) { return a - b; }), values = [];
      sorted.forEach(function (x) {
        var last = values[values.length - 1];
        if (last && x - last.max <= 3) { last.sum += x; last.count++; last.max = x; }
        else values.push({ sum: x, count: 1, max: x });
      });
      values = values.map(function (c) { return { deg: c.sum / c.count, count: c.count }; });
      return { label: k, mean: mean, min: sorted[0], max: sorted[sorted.length - 1], count: v.length, values: values };
    }).sort(function (a, b) { return b.count - a.count; });

    // Shape summary: one entry per (element, shape)
    var shapeMap = {};
    centers.forEach(function (ct) {
      if (!ct.shape) return;
      var k = ct.el + ':' + ct.shape;
      (shapeMap[k] = shapeMap[k] || { el: ct.el, shape: ct.shape, count: 0 }).count++;
    });
    var shapes = Object.keys(shapeMap).map(function (k) { return shapeMap[k]; });

    // Net bond-dipole vector (points to the more electronegative end).
    var mu = [0, 0, 0];
    bonds.forEach(function (b) {
      var A = atoms[b.a], B = atoms[b.b];
      var d = (CHI[B.el] || 2.5) - (CHI[A.el] || 2.5);
      var u = sub(B.pos, A.pos), l = len(u) || 1;
      mu[0] += d * u[0] / l; mu[1] += d * u[1] / l; mu[2] += d * u[2] / l;
    });
    var mag = len(mu);
    var sumAbs = bonds.reduce(function (s, b) { return s + Math.abs((CHI[atoms[b.a].el] || 0) - (CHI[atoms[b.b].el] || 0)); }, 0);
    var polarBonds = bondTypes.some(function (t) { return t.kind !== 'apolar'; });
    var verdict;
    if (ionic) verdict = 'ionic';
    else if (mag < 0.12) verdict = polarBonds ? 'apolar-cancel' : 'apolar';
    else verdict = mag < 0.3 && !bondTypes.some(function (t) { return t.kind === 'polar' && t.dchi > 0.5; }) ? 'weak' : 'polar';

    return {
      formula: f.text, counts: f.counts, mass: f.mass,
      bondTypes: bondTypes, ionic: ionic,
      centers: centers, shapes: shapes, angles: angles,
      dipole: { vector: mu, magnitude: mag, sumAbs: sumAbs, verdict: verdict }
    };
  }

  /* Measured values (gas phase unless noted). Sources: NIST CCCBDB
     (experimental geometries and dipoles) and CRC Handbook of Chemistry and
     Physics. Lengths in pm, angles in degrees, dipole in debye. */
  var REFERENCE = {
    water: { mu: 1.85, pg: 'C2v', len: { 'H–O': 95.8 }, ang: { 'H–O–H': 104.5 } },
    ethanol: { mu: 1.69, pg: 'Cs', len: { 'C–C': 151.2, 'C–O': 143.1, 'H–O': 97.1 }, ang: { 'C–C–O': 107.8 } },
    methanol: { mu: 1.70, pg: 'Cs', len: { 'C–O': 142.7, 'H–O': 95.6 }, ang: { 'C–O–H': 108.9 } },
    butane: { mu: 0, pg: 'C2h', len: { 'C–C': 153.1 } },
    isobutane: { mu: 0.13, pg: 'C3v', len: { 'C–C': 152.5 }, ang: { 'C–C–C': 110.8 } },
    but1ene: { mu: 0.34, pg: 'C1', len: { 'C=C': 133.7 } },
    cis2butene: { mu: 0.25, pg: 'C2v', len: { 'C=C': 134.6 } },
    trans2butene: { mu: 0, pg: 'C2h', len: { 'C=C': 134.7 } },
    dimethylether: { mu: 1.30, pg: 'C2v', len: { 'C–O': 141.0 }, ang: { 'C–O–C': 111.7 } },
    acetone: { mu: 2.88, pg: 'C2v', len: { 'C=O': 121.3, 'C–C': 152.0 }, ang: { 'C–C–C': 116.0 } },
    co2: { mu: 0, pg: 'D∞h', len: { 'C=O': 116.0 }, ang: { 'O–C–O': 180 } },
    ammonia: { mu: 1.47, pg: 'C3v', len: { 'H–N': 101.2 }, ang: { 'H–N–H': 106.7 } },
    methane: { mu: 0, pg: 'Td', len: { 'C–H': 108.7 }, ang: { 'H–C–H': 109.5 } },
    hcl: { mu: 1.11, pg: 'C∞v', len: { 'H–Cl': 127.5 } },
    nacl: { mu: 9.00, pg: 'C∞v', len: { 'Na–Cl': 236.1 }, note: 'gas' },
    h2so4: { mu: 2.73, pg: 'C2', len: { 'S=O': 142.2, 'S–O': 157.4 } },
    n2: { mu: 0, pg: 'D∞h', len: { 'N≡N': 109.8 } },
    o2: { mu: 0, pg: 'D∞h', len: { 'O=O': 120.7 } },
    benzene: { mu: 0, pg: 'D6h', len: { 'C–C': 139.7, 'C=C': 139.7, 'C–H': 108.0 }, ang: { 'C–C–C': 120 } },
    aceticacid: { mu: 1.70, pg: 'Cs', len: { 'C=O': 121.4, 'C–O': 136.4, 'C–C': 152.0 } },
    h2o2: { mu: 1.57, pg: 'C2', len: { 'O–O': 147.5, 'H–O': 95.0 }, ang: { 'H–O–O': 94.8 } },
    ethylene: { mu: 0, pg: 'D2h', len: { 'C=C': 133.9, 'C–H': 108.6 }, ang: { 'H–C–H': 117.4 } },
    acetylene: { mu: 0, pg: 'D∞h', len: { 'C≡C': 120.3, 'C–H': 106.3 }, ang: { 'C–C–H': 180 } },
    formaldehyde: { mu: 2.33, pg: 'C2v', len: { 'C=O': 120.8, 'C–H': 111.6 }, ang: { 'H–C–H': 116.5 } },
    co: { mu: 0.11, pg: 'C∞v', len: { 'C≡O': 112.8 } },
    so2: { mu: 1.63, pg: 'C2v', len: { 'S=O': 143.1 }, ang: { 'O–S–O': 119.5 } },
    hno3: { mu: 2.17, pg: 'Cs' },
    propane: { mu: 0.08, pg: 'C2v', len: { 'C–C': 152.6 }, ang: { 'C–C–C': 112.4 } },
    cyclohexane: { mu: 0, pg: 'D3d', len: { 'C–C': 153.6 }, ang: { 'C–C–C': 111.4 } },
    hcn: { mu: 2.98, pg: 'C∞v', len: { 'C≡N': 115.3, 'C–H': 106.6 }, ang: { 'H–C–N': 180 } },
    cs2: { mu: 0, pg: 'D∞h', len: { 'C=S': 155.3 }, ang: { 'S–C–S': 180 } },
    pcl3: { pg: 'C3v', len: { 'P–Cl': 204.3 }, ang: { 'Cl–P–Cl': 100.3 } },
    sf6: { mu: 0, pg: 'Oh', len: { 'S–F': 156.1 }, ang: { 'F–S–F': 90 } }
  };

  function reference(key) { return REFERENCE[key] || null; }

  // Typical measured lengths (pm) for bonds with no molecule-specific value.
  var TYPICAL_PM = {
    'C–H': 109.0, 'C–C': 153.0, 'C=C': 133.9, 'C≡C': 120.3, 'C–O': 143.0, 'C=O': 121.0, 'H–O': 96.0,
    'C–N': 147.0, 'C=N': 128.0, 'C≡N': 115.3, 'H–N': 101.0, 'C–F': 138.2, 'C–Cl': 177.6, 'C–Br': 193.4, 'C–I': 213.9
  };
  function bondLabel(e1, e2, o) {
    var pair = [e1, e2].sort(function (x, y) {
      if (x === 'C' || y === 'C') return x === 'C' ? -1 : 1;
      return (CHI[x] || 0) - (CHI[y] || 0);
    });
    return pair[0] + (BOND_SYM[o] || '–') + pair[1];
  }
  // Set every acyclic bond to its measured (or typical) length by moving the
  // fragment on one side along the bond. Angles are unchanged. Å in, Å out.
  function snapBondLengths(model, lens) {
    var atoms = model.atoms, bonds = model.bonds.map(function (b) { return Array.isArray(b) ? b : [b.a, b.b, b.o]; });
    var moved = 0;
    bonds.forEach(function (bd) {
      var a = bd[0], b = bd[1], o = bd[2] || 1;
      var lbl = bondLabel(atoms[a].el, atoms[b].el, o);
      if (model.keep && model.keep[a] && model.keep[b]) return;
      var L = (lens && lens[lbl]) != null ? lens[lbl] : TYPICAL_PM[lbl];
      if (L == null) return;
      var adj = atoms.map(function () { return []; });
      bonds.forEach(function (x) { if (x !== bd) { adj[x[0]].push(x[1]); adj[x[1]].push(x[0]); } });
      var side = {}, st = [b], ring = false; side[b] = true;
      while (st.length && !ring) {
        var v = st.pop();
        adj[v].forEach(function (w) { if (w === a) ring = true; else if (!side[w]) { side[w] = true; st.push(w); } });
      }
      if (ring) return;
      var u = sub(atoms[b].pos, atoms[a].pos), cur = len(u) || 1, k = (L / 100 - cur) / cur;
      Object.keys(side).forEach(function (i) {
        var p = atoms[i].pos;
        atoms[i].pos = [p[0] + u[0] * k, p[1] + u[1] * k, p[2] + u[2] * k];
      });
      moved++;
    });
    return moved;
  }

  // How the viewer draws atoms (scene units per Å, CPK colour keys, radii).
  var VIEW = {
    SCALE: 1.15,
    COLOR: { H: 0xdddddd, C: 0x666666, N: 0x3399ff, O: 0xee3333, F: 0xb3ff3a, Cl: 0x44dd44, Br: 0xa62929, I: 0x940094, S: 0xffcc33, P: 0xff8833, Na: 0xaaaaff, Fe: 0xcc6633 },
    RADIUS: { H: 0.2, C: 0.34, N: 0.33, O: 0.32, F: 0.28, Cl: 0.42, Br: 0.45, I: 0.5, S: 0.4, P: 0.4, Na: 0.46, Fe: 0.45 }
  };
  // {atoms:[{el,pos(Å)}], bonds:[[a,b,o]]} → viewer atoms/bonds (centred, scaled).
  function toViewer(model) {
    var n = model.atoms.length, c = [0, 0, 0];
    model.atoms.forEach(function (a) { c[0] += a.pos[0] / n; c[1] += a.pos[1] / n; c[2] += a.pos[2] / n; });
    return {
      atoms: model.atoms.map(function (a) {
        return {
          pos: [0, 1, 2].map(function (k) { return Math.round((a.pos[k] - c[k]) * VIEW.SCALE * 1000) / 1000; }),
          r: VIEW.RADIUS[a.el] || 0.4,
          color: VIEW.COLOR[a.el] || 0xaaaaaa
        };
      }),
      bonds: model.bonds.map(function (b) {
        var x = Array.isArray(b) ? b : [b.a, b.b, b.o];
        return (x[2] || 1) > 1 ? [x[0], x[1], x[2]] : [x[0], x[1]];
      })
    };
  }

  return {
    analyze: analyze, reference: reference, REFERENCE: REFERENCE,
    SHAPE_NAMES: SHAPE_NAMES, CHI: CHI, bondKind: bondKind, bondLabel: bondLabel, angle: angle,
    TYPICAL_PM: TYPICAL_PM, snapBondLengths: snapBondLengths, VIEW: VIEW, toViewer: toViewer
  };
});
