/* Atomurus — isomer engine.
   Pure functions, no DOM. Works in the browser (window.AtomurusIsomers) and
   in Node (module.exports) so it can be tested against textbook counts.

   A molecule here is the heavy-atom graph with implicit hydrogens:
     { atoms: [{ el: 'C' }], bonds: [{ a: 0, b: 1, o: 1 }] }
   Hydrogen counts follow from standard valences (C 4, N 3, O 2, halogens 1).

   Main entry points
     parseFormula('C4H10O')          → { C: 4, H: 10, O: 1, ... } or error
     enumerate('C4H10O')             → { isomers: [mol...], dou, ... }
     classify(mol)                   → function class, chain type, flags
     pairType(molA, molB)            → 'cadeia' | 'posicao' | 'funcao' | 'metameria' | 'tautomeria'
     stereo(mol)                     → chiral centres, cis/trans, stereoisomer count
     condensed(mol)                  → 'CH3–CH(OH)–CH3'
     parseStructure('CH3CH(OH)CH3')  → mol (condensed formula or simple SMILES)
     layout2d(mol), embed3d(mol)     → coordinates for drawing */
(function (root, factory) {
  var api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  else root.AtomurusIsomers = api;
})(typeof self !== 'undefined' ? self : this, function () {
  'use strict';

  var VALENCE = { C: 4, N: 3, O: 2, F: 1, Cl: 1, Br: 1, I: 1, H: 1 };
  var Z = { H: 1, C: 6, N: 7, O: 8, F: 9, Cl: 17, Br: 35, I: 53 };
  var HALOGEN = { F: 1, Cl: 1, Br: 1, I: 1 };
  var HEAVY_ORDER = ['C', 'N', 'O', 'F', 'Cl', 'Br', 'I'];
  var LIMITS = { heavy: 9, carbon: 8, dou: 3, maxIsomers: 600 };

  /* ── formula ─────────────────────────────────────────────────────── */
  var SUB = { '₀': '0', '₁': '1', '₂': '2', '₃': '3', '₄': '4', '₅': '5', '₆': '6', '₇': '7', '₈': '8', '₉': '9' };
  function normDigits(s) { return String(s || '').replace(/[₀-₉]/g, function (d) { return SUB[d]; }); }

  function parseFormula(input) {
    var s = normDigits(input).replace(/\s+/g, '');
    if (!s) return { error: 'empty' };
    var counts = { C: 0, H: 0, N: 0, O: 0, F: 0, Cl: 0, Br: 0, I: 0 };
    var re = /(Cl|Br|C|H|N|O|F|I)(\d*)/g, m, used = 0;
    while ((m = re.exec(s))) {
      if (m.index !== used) return { error: 'syntax', at: used };
      counts[m[1]] += m[2] ? parseInt(m[2], 10) : 1;
      used = re.lastIndex;
    }
    if (used !== s.length) return { error: 'syntax', at: used };
    if (!counts.C) return { error: 'no-carbon' };
    var x = counts.F + counts.Cl + counts.Br + counts.I;
    var twice = 2 * counts.C + 2 + counts.N - counts.H - x;
    if (twice < 0 || twice % 2) return { error: 'impossible', counts: counts };
    var heavy = counts.C + counts.N + counts.O + x;
    var res = { counts: counts, dou: twice / 2, heavy: heavy };
    if (heavy > LIMITS.heavy || counts.C > LIMITS.carbon) res.error = 'too-big';
    else if (res.dou > LIMITS.dou) res.error = 'too-unsaturated';
    return res;
  }

  function formulaOf(mol) {
    var c = { C: 0, H: 0, N: 0, O: 0, F: 0, Cl: 0, Br: 0, I: 0 };
    var hs = hydrogens(mol);
    mol.atoms.forEach(function (a, i) { c[a.el] += 1; c.H += hs[i]; });
    var out = '';
    ['C', 'H', 'N', 'O', 'F', 'Cl', 'Br', 'I'].forEach(function (el) {
      if (c[el]) out += el + (c[el] > 1 ? c[el] : '');
    });
    return out;
  }

  /* ── graph helpers ───────────────────────────────────────────────── */
  function adjacency(mol) {
    var adj = mol.atoms.map(function () { return []; });
    mol.bonds.forEach(function (b) { adj[b.a].push([b.b, b.o]); adj[b.b].push([b.a, b.o]); });
    return adj;
  }
  function hydrogens(mol) {
    var used = mol.atoms.map(function () { return 0; });
    mol.bonds.forEach(function (b) { used[b.a] += b.o; used[b.b] += b.o; });
    return mol.atoms.map(function (a, i) { return VALENCE[a.el] - used[i]; });
  }
  function bondOrder(mol, i, j) {
    for (var k = 0; k < mol.bonds.length; k++) {
      var b = mol.bonds[k];
      if ((b.a === i && b.b === j) || (b.a === j && b.b === i)) return b.o;
    }
    return 0;
  }
  // Bonds that lie on a ring (removing them keeps the graph connected).
  function ringBonds(mol) {
    var n = mol.atoms.length, out = {};
    mol.bonds.forEach(function (b, idx) {
      var seen = new Array(n), stack = [b.a];
      seen[b.a] = true;
      while (stack.length) {
        var v = stack.pop();
        mol.bonds.forEach(function (c, k) {
          if (k === idx) return;
          var w = c.a === v ? c.b : (c.b === v ? c.a : -1);
          if (w >= 0 && !seen[w]) { seen[w] = true; stack.push(w); }
        });
      }
      if (seen[b.b]) out[idx] = true;
    });
    return out;
  }
  function ringAtoms(mol) {
    var rb = ringBonds(mol), set = {};
    mol.bonds.forEach(function (b, i) { if (rb[i]) { set[b.a] = true; set[b.b] = true; } });
    return set;
  }

  // Carbon six-rings with alternating single/double bonds (benzene rings).
  function aromaticAtoms(mol) {
    var adj = adjacency(mol), out = {};
    var n = mol.atoms.length;
    function dfs(path) {
      var last = path[path.length - 1];
      if (path.length === 6) {
        var first = path[0];
        var closeOrder = 0;
        adj[last].forEach(function (x) { if (x[0] === first) closeOrder = x[1]; });
        if (!closeOrder) return;
        var orders = [];
        for (var i = 0; i < 6; i++) orders.push(bondOrder(mol, path[i], path[(i + 1) % 6]));
        var alt = orders.every(function (o, i) { return o === (i % 2 ? orders[1] : orders[0]); }) && orders[0] + orders[1] === 3;
        if (alt) path.forEach(function (v) { out[v] = true; });
        return;
      }
      adj[last].forEach(function (x) {
        var w = x[0];
        if (mol.atoms[w].el !== 'C' || path.indexOf(w) >= 0 || w < path[0]) return;
        path.push(w); dfs(path); path.pop();
      });
    }
    for (var i = 0; i < n; i++) if (mol.atoms[i].el === 'C') dfs([i]);
    return out;
  }

  /* ── canonical form (colour refinement + individualisation) ──────── */
  function canonical(mol, withH) {
    var n = mol.atoms.length;
    var adj = adjacency(mol);
    var hs = withH === false ? null : hydrogens(mol);
    var init = mol.atoms.map(function (a, i) {
      return a.el + (hs ? 'h' + hs[i] : '') + 'd' + adj[i].length + 'o' + adj[i].map(function (x) { return x[1]; }).sort().join('');
    });
    function rank(keys) {
      var uniq = keys.slice().sort().filter(function (k, i, arr) { return i === 0 || arr[i - 1] !== k; });
      var map = {};
      uniq.forEach(function (k, i) { map[k] = i; });
      return keys.map(function (k) { return map[k]; });
    }
    function refine(col) {
      var classes = -1;
      for (;;) {
        var cnt = col.reduce(function (m, c) { return Math.max(m, c); }, -1) + 1;
        if (cnt === classes || cnt === n) return col;
        classes = cnt;
        var keys = col.map(function (c, i) {
          var nb = adj[i].map(function (x) { return x[1] + ':' + col[x[0]]; }).sort().join(',');
          return (c < 10 ? '0' : '') + c + '|' + nb;
        });
        col = rank(keys);
      }
    }
    function encode(col) {
      var order = col.map(function (c, i) { return [c, i]; }).sort(function (a, b) { return a[0] - b[0]; }).map(function (x) { return x[1]; });
      var pos = []; order.forEach(function (v, k) { pos[v] = k; });
      var head = order.map(function (v) { return mol.atoms[v].el + (hs ? hs[v] : ''); }).join('.');
      var edges = mol.bonds.map(function (b) {
        var x = pos[b.a], y = pos[b.b];
        if (x > y) { var t = x; x = y; y = t; }
        return (x < 10 ? '0' : '') + x + (y < 10 ? '0' : '') + y + b.o;
      }).sort().join(',');
      return { key: head + '/' + edges, order: order };
    }
    var best = null;
    function search(col) {
      col = refine(col);
      var cnt = col.reduce(function (m, c) { return Math.max(m, c); }, -1) + 1;
      if (cnt === n) {
        var e = encode(col);
        if (!best || e.key < best.key) best = e;
        return;
      }
      // first non-singleton class
      var sizes = {};
      col.forEach(function (c) { sizes[c] = (sizes[c] || 0) + 1; });
      var target = -1;
      for (var c = 0; c < cnt; c++) if (sizes[c] > 1) { target = c; break; }
      for (var v = 0; v < n; v++) {
        if (col[v] !== target) continue;
        var next = col.map(function (x, i) {
          if (x > target) return x + 1;
          if (x === target) return i === v ? target : target + 1;
          return x;
        });
        search(next);
      }
    }
    search(rank(init));
    return best;
  }
  function keyOf(mol) { return canonical(mol).key; }

  /* ── enumeration ─────────────────────────────────────────────────── */
  function isHetero(el) { return el !== 'C'; }

  function enumerate(input) {
    var f = typeof input === 'string' ? parseFormula(input) : input;
    if (f.error) return { error: f.error, formula: f };
    var counts = f.counts, dou = f.dou;
    var pool = [];
    HEAVY_ORDER.forEach(function (el) { for (var i = 0; i < counts[el]; i++) pool.push(el); });
    var n = pool.length;
    var B = n - 1 + dou;
    var need = {};
    pool.forEach(function (el) { need[el] = (need[el] || 0) + 1; });

    // Step A — connected simple graphs, grown one atom at a time, deduplicated.
    var level = {};
    Object.keys(need).forEach(function (el) {
      var m = { atoms: [{ el: el }], bonds: [] };
      level[keyOf(m)] = m;
    });
    for (var size = 1; size < n; size++) {
      var next = {};
      Object.keys(level).forEach(function (k) {
        var g = level[k];
        var have = {};
        g.atoms.forEach(function (a) { have[a.el] = (have[a.el] || 0) + 1; });
        var deg = g.atoms.map(function () { return 0; });
        g.bonds.forEach(function (b) { deg[b.a]++; deg[b.b]++; });
        Object.keys(need).forEach(function (el) {
          if ((have[el] || 0) >= need[el]) return;
          var cand = [];
          for (var i = 0; i < g.atoms.length; i++) {
            if (deg[i] >= VALENCE[g.atoms[i].el]) continue;
            if (isHetero(el) && isHetero(g.atoms[i].el)) continue;   // no hetero–hetero bonds
            cand.push(i);
          }
          var maxK = Math.min(VALENCE[el], cand.length);
          subsets(cand, maxK, function (S) {
            var edges = g.bonds.length + S.length;
            var verts = g.atoms.length + 1;
            if (edges - verts + 1 > dou) return;                     // too many rings
            if (edges > B) return;
            var m = { atoms: g.atoms.concat([{ el: el }]), bonds: g.bonds.slice() };
            S.forEach(function (i) { m.bonds.push({ a: i, b: verts - 1, o: 1 }); });
            next[canonical(m, false).key] = m;
          });
        });
      });
      level = next;
    }

    // Step B — distribute the remaining unsaturation as multiple bonds.
    var out = {};
    Object.keys(level).forEach(function (k) {
      var g = level[k];
      var extra = B - g.bonds.length;
      if (extra < 0) return;
      var rings = ringBonds(g);
      var used = g.atoms.map(function () { return 0; });
      g.bonds.forEach(function (b) { used[b.a] += 1; used[b.b] += 1; });
      var bonds = g.bonds.map(function (b) { return { a: b.a, b: b.b, o: 1 }; });
      (function place(from, left) {
        if (left === 0) {
          var m = { atoms: g.atoms, bonds: bonds.map(function (b) { return { a: b.a, b: b.b, o: b.o }; }) };
          if (acceptable(m)) out[keyOf(m)] = m;
          return;
        }
        for (var e = from; e < bonds.length; e++) {
          var b = bonds[e];
          var ea = g.atoms[b.a].el, eb = g.atoms[b.b].el;
          if (HALOGEN[ea] || HALOGEN[eb]) continue;
          if (b.o >= 3) continue;
          if (used[b.a] >= VALENCE[ea] || used[b.b] >= VALENCE[eb]) continue;
          if (b.o === 2 && rings[e]) continue;                          // no triple bonds in rings
          if (rings[e] && (ea !== 'C' || eb !== 'C')) continue;         // ring multiple bonds only C=C
          b.o++; used[b.a]++; used[b.b]++;
          place(e, left - 1);
          b.o--; used[b.a]--; used[b.b]--;
        }
      })(0, extra);
    });
    var list = Object.keys(out).sort().map(function (k) { var m = out[k]; m.key = k; return m; });
    return { formula: f, isomers: list.slice(0, LIMITS.maxIsomers), total: list.length, capped: list.length > LIMITS.maxIsomers };
  }

  function subsets(arr, maxK, fn) {
    var cur = [];
    (function rec(start) {
      if (cur.length) fn(cur.slice());
      if (cur.length === maxK) return;
      for (var i = start; i < arr.length; i++) { cur.push(arr[i]); rec(i + 1); cur.pop(); }
    })(0);
  }

  // Chemistry filters: keep structures a chemistry course would list.
  function acceptable(mol) {
    var adj = adjacency(mol), hs = hydrogens(mol);
    for (var i = 0; i < mol.atoms.length; i++) {
      var el = mol.atoms[i].el;
      var doubles = 0, triples = 0, oSingle = 0, ohSingle = 0;
      for (var k = 0; k < adj[i].length; k++) {
        var j = adj[i][k][0], o = adj[i][k][1], ej = mol.atoms[j].el;
        if (o === 2) doubles++;
        if (o === 3) triples++;
        if (o === 1 && ej === 'O') { oSingle++; if (hs[j] === 1) ohSingle++; }
        // cumulated double bonds: only C=C=C (allenes)
        if (o === 2 && el === 'C' && ej !== 'C' && doubles + triples > 0 && adj[i].some(function (x) { return x[1] >= 2 && x[0] !== j; })) return false;
      }
      if (doubles >= 2 && el === 'C') {
        if (adj[i].some(function (x) { return x[1] === 2 && mol.atoms[x[0]].el !== 'C'; })) return false;
      }
      if (doubles + triples >= 2 && triples) return false;           // C=C≡ … not on one atom
      if (el === 'C' && oSingle >= 2 && ohSingle >= 1) return false;  // gem-diol / hemiacetal
      if (el === 'C' && triples && ohSingle) return false;            // ynol
      if (el === 'N' && triples && adj[i].length > 1) return false;
    }
    return true;
  }

  /* ── classification ──────────────────────────────────────────────── */
  // Functional groups, highest priority first (IUPAC-like order used in class).
  var CLASS_ORDER = ['acid', 'ester', 'amide', 'nitrile', 'aldehyde', 'ketone', 'phenol', 'enol', 'alcohol', 'amine', 'ether', 'halide', 'aromatic', 'alkyne', 'alkene', 'alkane'];
  var CLASS_NAMES = {
    acid: { pt: 'Ácido carboxílico', en: 'Carboxylic acid' },
    ester: { pt: 'Éster', en: 'Ester' },
    amide: { pt: 'Amida', en: 'Amide' },
    nitrile: { pt: 'Nitrila', en: 'Nitrile' },
    aldehyde: { pt: 'Aldeído', en: 'Aldehyde' },
    ketone: { pt: 'Cetona', en: 'Ketone' },
    enol: { pt: 'Enol', en: 'Enol' },
    phenol: { pt: 'Fenol', en: 'Phenol' },
    aromatic: { pt: 'Hidrocarboneto aromático', en: 'Aromatic hydrocarbon' },
    alcohol: { pt: 'Álcool', en: 'Alcohol' },
    amine: { pt: 'Amina', en: 'Amine' },
    ether: { pt: 'Éter', en: 'Ether' },
    halide: { pt: 'Haleto orgânico', en: 'Organic halide' },
    alkyne: { pt: 'Alcino', en: 'Alkyne' },
    alkene: { pt: 'Alceno', en: 'Alkene' },
    alkane: { pt: 'Alcano', en: 'Alkane' },
    cycloalkane: { pt: 'Cicloalcano', en: 'Cycloalkane' },
    cycloalkene: { pt: 'Cicloalceno', en: 'Cycloalkene' },
    diene: { pt: 'Dieno', en: 'Diene' }
  };

  function groups(mol) {
    var adj = adjacency(mol), hs = hydrogens(mol), found = {};
    var arom = aromaticAtoms(mol);
    function add(g, atoms) { (found[g] = found[g] || []).push(atoms); }
    mol.atoms.forEach(function (a, i) {
      if (a.el === 'C') {
        var dO = -1, sO = [], sN = [], cn = 0;
        adj[i].forEach(function (x) {
          var el = mol.atoms[x[0]].el;
          if (el === 'O' && x[1] === 2) dO = x[0];
          if (el === 'O' && x[1] === 1) sO.push(x[0]);
          if (el === 'N' && x[1] === 1) sN.push(x[0]);
          if (el === 'N' && x[1] === 3) add('nitrile', [i, x[0]]);
          if (el === 'C') cn++;
        });
        if (dO >= 0) {
          var oh = sO.filter(function (o) { return hs[o] === 1; });
          var or = sO.filter(function (o) { return hs[o] === 0; });
          if (oh.length) add('acid', [i, dO, oh[0]]);
          else if (or.length) add('ester', [i, dO, or[0]]);
          else if (sN.length) add('amide', [i, dO, sN[0]]);
          else if (hs[i] >= 1) add('aldehyde', [i, dO]);
          else add('ketone', [i, dO]);
        }
      }
      if (a.el === 'O' && hs[i] === 1 && adj[i].length === 1) {
        var c = adj[i][0][0];
        var cAdj = adj[c];
        var carbonyl = cAdj.some(function (x) { return mol.atoms[x[0]].el === 'O' && x[1] === 2; });
        if (!carbonyl) {
          var vinyl = cAdj.some(function (x) { return x[1] === 2 && mol.atoms[x[0]].el === 'C'; });
          add(arom[c] ? 'phenol' : (vinyl ? 'enol' : 'alcohol'), [i, c]);
        }
      }
      if (a.el === 'O' && adj[i].length === 2) {
        var carbonylNb = adj[i].some(function (x) {
          return adj[x[0]].some(function (y) { return mol.atoms[y[0]].el === 'O' && y[1] === 2; });
        });
        if (!carbonylNb) add('ether', [i]);
      }
      if (a.el === 'N' && adj[i].every(function (x) { return x[1] === 1; })) {
        var amide = adj[i].some(function (x) {
          return adj[x[0]].some(function (y) { return mol.atoms[y[0]].el === 'O' && y[1] === 2; });
        });
        if (!amide) add('amine', [i]);
      }
      if (HALOGEN[a.el]) add('halide', [i]);
    });
    if (Object.keys(arom).length) add('aromatic', Object.keys(arom).map(Number));
    mol.bonds.forEach(function (b) {
      if (mol.atoms[b.a].el === 'C' && mol.atoms[b.b].el === 'C') {
        if (b.o === 2 && !(arom[b.a] && arom[b.b])) add('alkene', [b.a, b.b]);
        if (b.o === 3) add('alkyne', [b.a, b.b]);
      }
    });
    return found;
  }

  // Skeleton used for chain classification: carbons plus heteroatoms that sit
  // between two carbons (O of ethers/esters, N of sec/tert amines).
  function chainInfo(mol) {
    var adj = adjacency(mol);
    var inChain = mol.atoms.map(function (a, i) {
      if (a.el === 'C') return true;
      var cNb = adj[i].filter(function (x) { return mol.atoms[x[0]].el === 'C'; }).length;
      return (a.el === 'O' || a.el === 'N') && cNb >= 2;
    });
    var rings = ringAtoms(mol);
    var closed = Object.keys(rings).length > 0;
    var hetero = mol.atoms.some(function (a, i) { return inChain[i] && a.el !== 'C'; });
    var heteroInRing = mol.atoms.some(function (a, i) { return inChain[i] && a.el !== 'C' && rings[i]; });
    var branched = false;
    mol.atoms.forEach(function (a, i) {
      if (!inChain[i]) return;
      var deg = adj[i].filter(function (x) { return inChain[x[0]]; }).length;
      if (!rings[i] && deg >= 3) branched = true;
      if (rings[i] && adj[i].some(function (x) { return inChain[x[0]] && !rings[x[0]]; })) branched = true;
      if (rings[i] && deg >= 4) branched = true;
    });
    var aromSet = aromaticAtoms(mol);
    var aromatic = Object.keys(aromSet).length > 0;
    var unsat = mol.bonds.some(function (b) { return b.o > 1 && mol.atoms[b.a].el === 'C' && mol.atoms[b.b].el === 'C' && !(aromSet[b.a] && aromSet[b.b]); });
    var heteroPos = '';
    if (hetero) {
      // partition of carbons around each in-chain heteroatom (for metameria)
      heteroPos = mol.atoms.map(function (a, i) {
        if (!inChain[i] || a.el === 'C') return null;
        return adj[i].map(function (x) { return branchSize(mol, adj, x[0], i); }).sort().join('+');
      }).filter(Boolean).sort().join(';');
    }
    return { closed: closed, aromatic: aromatic, branched: branched, hetero: hetero, heteroInRing: heteroInRing, unsaturated: unsat, heteroPos: heteroPos };
  }
  function branchSize(mol, adj, start, from) {
    var seen = {}, stack = [start], count = 0;
    seen[from] = true; seen[start] = true;
    while (stack.length) {
      var v = stack.pop();
      if (mol.atoms[v].el === 'C') count++;
      adj[v].forEach(function (x) { if (!seen[x[0]]) { seen[x[0]] = true; stack.push(x[0]); } });
    }
    return count;
  }

  function classify(mol) {
    var g = groups(mol);
    var main = 'alkane';
    for (var i = 0; i < CLASS_ORDER.length; i++) if (g[CLASS_ORDER[i]]) { main = CLASS_ORDER[i]; break; }
    var chain = chainInfo(mol);
    var label = main;
    if (main === 'alkane' && chain.closed) label = 'cycloalkane';
    if (main === 'alkene' && g.alkene.length >= 2) label = 'diene';
    else if (main === 'alkene' && chain.closed && !g.alkyne) {
      var rb = ringBonds(mol);
      var inRing = mol.bonds.some(function (b, k) { return rb[k] && b.o === 2; });
      if (inRing) label = 'cycloalkene';
    }
    var amineType = null;
    if (main === 'amine') {
      var adj = adjacency(mol);
      var n = g.amine[0][0];
      amineType = adj[n].filter(function (x) { return mol.atoms[x[0]].el === 'C'; }).length;
    }
    return { main: main, label: label, names: CLASS_NAMES[label], groups: g, chain: chain, amineType: amineType, unstable: main === 'enol' };
  }

  /* ── type of isomerism between two constitutional isomers ─────────── */
  function skeletonKey(mol) {
    return canonical({ atoms: mol.atoms, bonds: mol.bonds.map(function (b) { return { a: b.a, b: b.b, o: 1 }; }) }, false).key;
  }
  function pairType(A, B) {
    if (formulaOf(A) !== formulaOf(B)) return 'not-isomers';
    if (keyOf(A) === keyOf(B)) return 'same';
    var ca = classify(A), cb = classify(B);
    var keto = { aldehyde: 1, ketone: 1 };
    if ((keto[ca.main] && cb.main === 'enol') || (keto[cb.main] && ca.main === 'enol')) {
      if (skeletonKey(A) === skeletonKey(B)) return 'tautomeria';
    }
    if (ca.main !== cb.main) return 'funcao';
    var x = ca.chain, y = cb.chain;
    if (x.closed !== y.closed || x.aromatic !== y.aromatic || x.branched !== y.branched || x.hetero !== y.hetero) return 'cadeia';
    if (x.hetero && y.hetero && x.heteroPos !== y.heteroPos) return 'metameria';
    // Same kind of chain: if the main chain or the sizes of the branches change
    // it is still chain isomerism (isopentane × neopentane); if only where the
    // same branch / group / double bond sits changes, it is position isomerism.
    if (!x.closed && carbonSignature(A) !== carbonSignature(B)) return 'cadeia';
    return 'posicao';
  }
  function carbonSignature(mol) {
    var adj = adjacency(mol);
    var C = mol.atoms.map(function (a, i) { return a.el === 'C' ? i : -1; }).filter(function (i) { return i >= 0; });
    function far(start) {
      var dist = {}, prev = {}, q = [start], best = start; dist[start] = 0;
      while (q.length) {
        var v = q.shift();
        adj[v].forEach(function (x) {
          var w = x[0];
          if (mol.atoms[w].el !== 'C' || dist[w] != null) return;
          dist[w] = dist[v] + 1; prev[w] = v; q.push(w);
          if (dist[w] > dist[best]) best = w;
        });
      }
      return { best: best, prev: prev };
    }
    var a = far(C[0]).best, r = far(a), path = [], v = r.best;
    while (v !== undefined) { path.unshift(v); v = r.prev[v]; }
    var on = {}; path.forEach(function (p) { on[p] = true; });
    var branches = [];
    path.forEach(function (p) {
      adj[p].forEach(function (x) {
        if (on[x[0]] || mol.atoms[x[0]].el !== 'C') return;
        var seen = {}, st = [x[0]], n = 0; seen[p] = true; seen[x[0]] = true;
        while (st.length) { var u = st.pop(); n++; adj[u].forEach(function (y) { if (!seen[y[0]] && mol.atoms[y[0]].el === 'C') { seen[y[0]] = true; st.push(y[0]); } }); }
        branches.push(n);
      });
    });
    return path.length + ':' + branches.sort().join(',');
  }
  var PAIR_NAMES = {
    cadeia: { pt: 'Isomeria de cadeia', en: 'Chain isomerism' },
    posicao: { pt: 'Isomeria de posição', en: 'Position isomerism' },
    funcao: { pt: 'Isomeria de função', en: 'Functional isomerism' },
    metameria: { pt: 'Metameria (compensação)', en: 'Metamerism' },
    tautomeria: { pt: 'Tautomeria', en: 'Tautomerism' },
    same: { pt: 'Mesma substância', en: 'Same compound' },
    'not-isomers': { pt: 'Não são isômeros (fórmulas diferentes)', en: 'Not isomers (different formulas)' }
  };

  /* ── stereochemistry ─────────────────────────────────────────────── */
  // Explicit-H graph: atoms with H as real vertices (needed for CIP and 3D).
  function withHydrogens(mol) {
    var hs = hydrogens(mol);
    var atoms = mol.atoms.map(function (a) { return { el: a.el }; });
    var bonds = mol.bonds.map(function (b) { return { a: b.a, b: b.b, o: b.o }; });
    hs.forEach(function (h, i) {
      for (var k = 0; k < h; k++) { atoms.push({ el: 'H', parent: i }); bonds.push({ a: i, b: atoms.length - 1, o: 1 }); }
    });
    return { atoms: atoms, bonds: bonds, heavy: mol.atoms.length };
  }
  // Hierarchical digraph string rooted at `start` coming from `from` (CIP-like,
  // multiple bonds duplicated, rings unfolded to a depth limit).
  function branchTree(full, adj, start, from, depth) {
    var el = full.atoms[start].el;
    if (depth <= 0) return el;
    var kids = [];
    adj[start].forEach(function (x) {
      if (x[0] === from) return;
      kids.push(branchTree(full, adj, x[0], start, depth - 1));
    });
    // duplicate atoms for multiple bonds (both directions)
    adj[start].forEach(function (x) {
      for (var k = 1; k < x[1]; k++) kids.push(full.atoms[x[0]].el + '*');
    });
    var back = adj[start].filter(function (x) { return x[0] === from; })[0];
    if (back) for (var k2 = 1; k2 < back[1]; k2++) kids.push(full.atoms[from].el + '*');
    kids.sort();
    return el + '(' + kids.join(',') + ')';
  }

  function stereo(mol) {
    var full = withHydrogens(mol);
    var adj = full.atoms.map(function () { return []; });
    full.bonds.forEach(function (b) { adj[b.a].push([b.b, b.o]); adj[b.b].push([b.a, b.o]); });
    var depth = mol.atoms.length + 2;
    var rings = ringBonds(mol);
    var centers = [];
    for (var i = 0; i < mol.atoms.length; i++) {
      if (mol.atoms[i].el !== 'C' || adj[i].length !== 4) continue;
      if (adj[i].some(function (x) { return x[1] !== 1; })) continue;
      var subs = adj[i].map(function (x) { return branchTree(full, adj, x[0], i, depth); });
      var uniq = subs.filter(function (s, k) { return subs.indexOf(s) === k; });
      if (uniq.length === 4) centers.push(i);
    }
    var dbl = [];
    mol.bonds.forEach(function (b, k) {
      if (b.o !== 2 || rings[k]) return;
      if (mol.atoms[b.a].el !== 'C' || mol.atoms[b.b].el !== 'C') return;
      var ok = [b.a, b.b].every(function (end) {
        var other = end === b.a ? b.b : b.a;
        var subs = adj[end].filter(function (x) { return x[0] !== other; }).map(function (x) { return branchTree(full, adj, x[0], end, depth); });
        return subs.length === 2 && subs[0] !== subs[1];
      });
      if (ok) dbl.push([b.a, b.b]);
    });
    // cis/trans in rings: ≥2 ring atoms that each carry two different substituents
    var ringCisTrans = false;
    var ra = ringAtoms(mol);
    var aromS = aromaticAtoms(mol);
    var stereoRing = Object.keys(ra).map(Number).filter(function (i) {
      if (mol.atoms[i].el !== 'C' || aromS[i]) return false;
      var out = adj[i].filter(function (x) { return !(x[0] < mol.atoms.length && ra[x[0]] && bondOrder(mol, i, x[0])); });
      if (out.length !== 2) return false;
      return branchTree(full, adj, out[0][0], i, depth) !== branchTree(full, adj, out[1][0], i, depth);
    });
    if (stereoRing.length >= 2) ringCisTrans = true;
    var n = centers.length;
    var count = Math.pow(2, n);
    var meso = false;
    if (n >= 2) {
      // symmetric molecule whose chiral centres map onto each other → meso forms
      var sym = symmetricCenters(mol, centers);
      if (sym) {
        meso = true;
        count = n % 2 === 0 ? Math.pow(2, n - 1) + Math.pow(2, n / 2 - 1) : Math.pow(2, n - 1);
      }
    }
    return {
      chiralCenters: centers,
      optical: n > 0,
      opticallyActive: n === 0 ? 0 : (meso ? (n % 2 === 0 ? Math.pow(2, n - 1) : Math.pow(2, n - 1) - Math.pow(2, (n - 1) / 2)) : count),
      meso: meso,
      cisTrans: dbl.length > 0 || ringCisTrans,
      cisTransBonds: dbl,
      ringCisTrans: ringCisTrans,
      stereoisomers: Math.max(1, n > 0 ? count : 1) * (dbl.length ? Math.pow(2, dbl.length) : 1)
    };
  }
  // True when an automorphism swaps chiral centres (e.g. 2,3-dibromobutane).
  function symmetricCenters(mol, centers) {
    var c = canonical(mol);
    var adj = adjacency(mol);
    // colour refinement classes: equivalent atoms share a class
    var n = mol.atoms.length, hs = hydrogens(mol);
    var col = mol.atoms.map(function (a, i) { return a.el + hs[i] + 'd' + adj[i].length; });
    for (var it = 0; it < n; it++) {
      col = col.map(function (k, i) { return k + '[' + adj[i].map(function (x) { return x[1] + col[x[0]]; }).sort().join(',') + ']'; });
      col = col.map(function (k) { return k.length > 4000 ? k.slice(0, 4000) : k; });
    }
    var cls = {};
    centers.forEach(function (i) { cls[col[i]] = (cls[col[i]] || 0) + 1; });
    return Object.keys(cls).some(function (k) { return cls[k] >= 2; }) && !!c;
  }

  // CIP rank of the four substituents of a centre (0 = highest).
  function cipRank(full, adj, center) {
    var subs = adj[center].map(function (x) { return x[0]; });
    function sphere(start, from, depth) {
      // list of atomic-number multisets, sphere by sphere
      var levels = [], frontier = [[start, from]];
      for (var d = 0; d < depth && frontier.length; d++) {
        var zs = [], next = [];
        frontier.forEach(function (p) {
          var v = p[0], f = p[1];
          if (d === 0) { zs.push(v === -1 ? 0 : Z[full.atoms[v].el]); }
          if (v === -1) return;
          adj[v].forEach(function (x) {
            if (x[0] === f) { for (var k = 1; k < x[1]; k++) next.push([-1, -1, Z[full.atoms[x[0]].el]]); return; }
            next.push([x[0], v]);
            for (var k2 = 1; k2 < x[1]; k2++) next.push([-1, -1, Z[full.atoms[x[0]].el]]);
          });
        });
        if (d > 0) frontier.forEach(function (p) { zs.push(p[0] === -1 ? (p[2] || 0) : Z[full.atoms[p[0]].el]); });
        zs.sort(function (a, b) { return b - a; });
        levels.push(zs);
        frontier = next;
      }
      return levels;
    }
    var data = subs.map(function (s) { return { s: s, lv: sphere(s, center, 10) }; });
    data.sort(function (A, B) {
      for (var d = 0; d < Math.max(A.lv.length, B.lv.length); d++) {
        var a = A.lv[d] || [], b = B.lv[d] || [];
        for (var k = 0; k < Math.max(a.length, b.length); k++) {
          var x = a[k] || 0, y = b[k] || 0;
          if (x !== y) return y - x;
        }
      }
      return 0;
    });
    return data.map(function (d) { return d.s; });
  }
  // R/S for each chiral centre, given 3D coordinates of the explicit-H graph.
  function assignRS(full, coords, centers) {
    var adj = full.atoms.map(function () { return []; });
    full.bonds.forEach(function (b) { adj[b.a].push([b.b, b.o]); adj[b.b].push([b.a, b.o]); });
    var out = {};
    centers.forEach(function (c) {
      var r = cipRank(full, adj, c);
      var p = coords[c];
      var v = r.map(function (i) { return [coords[i][0] - p[0], coords[i][1] - p[1], coords[i][2] - p[2]]; });
      // looking from opposite the lowest priority (v[3]): sign of triple product
      var a = v[0], b = v[1], cc = v[2];
      var cross = [b[1] * cc[2] - b[2] * cc[1], b[2] * cc[0] - b[0] * cc[2], b[0] * cc[1] - b[1] * cc[0]];
      var dot = a[0] * cross[0] + a[1] * cross[1] + a[2] * cross[2];
      out[c] = dot > 0 ? 'S' : 'R';
    });
    return out;
  }

  /* ── condensed structural formula ────────────────────────────────── */
  var SUBS = ['', '', '₂', '₃', '₄'];
  function atomText(mol, hs, i, sub) {
    var el = mol.atoms[i].el, h = hs[i];
    var H = h ? 'H' + (h > 1 ? (sub ? SUBS[h] : String(h)) : '') : '';
    if (el === 'C') return 'C' + H;
    if (el === 'O') return h ? 'OH' : 'O';
    if (el === 'N') return h === 2 ? 'NH' + (sub ? '₂' : '2') : (h === 1 ? 'NH' : 'N');
    return el + H;
  }
  var BOND_TXT = { 1: '–', 2: '=', 3: '≡' };
  // Textbook shorthands: C(=O)OH → COOH, CH(=O) → CHO, C(=O) → CO, C(=O)O → COO
  function prettify(txt) {
    return txt
      .replace(/^CH\((?:OH\)\(=O|=O\)\(OH)\)$/, 'HCOOH')
      .replace(/C\(OH\)\(=O\)|C\(=O\)\(OH\)/g, 'COOH')
      .replace(/CH\(=O\)/g, 'CHO')
      .replace(/C\(=O\)–O–/g, 'COO–')
      .replace(/–O–C\(=O\)/g, '–OOC')
      .replace(/–O–CH\(=O\)$/, '–OOCH')
      .replace(/C\(=O\)/g, 'CO')
      .replace(/\(C≡N\)/g, '(CN)')
      // a single group hanging on the last / first carbon reads as part of the chain
      .replace(/^(C(?:H[₂₃]?)?)\((OH|Cl|Br|F|I|NH₂|NH2|CN)\)–/, function (m, c, g) { return (g === 'OH' ? 'HO' : (g === 'NH₂' || g === 'NH2' ? 'H₂N' : g)) + '–' + c + '–'; })
      .replace(/–(C(?:H[₂₃]?)?)\((OH|Cl|Br|F|I|NH₂|NH2|CN)\)$/, '–$1–$2')
      .replace(/^NH₂–/, 'H₂N–').replace(/^NH2–/, 'H2N–');
  }
  function condensed(mol, opts) {
    var raw = condensedRaw(mol, opts);
    return raw == null ? null : prettify(raw);
  }
  function condensedRaw(mol, opts) {
    opts = opts || {};
    var sub = opts.subscripts !== false;
    var n = mol.atoms.length, adj = adjacency(mol), hs = hydrogens(mol);
    if (n === 1) return atomText(mol, hs, 0, sub);
    var rings = ringAtoms(mol);
    if (Object.keys(rings).length) return null;   // rings are shown as a drawing
    // main path: longest path between two atoms through non-halogen heavy atoms
    function carriesGroup(i) {
      return mol.atoms[i].el !== 'C' || adj[i].some(function (x) { return mol.atoms[x[0]].el !== 'C' || x[1] > 1; });
    }
    function farthest(start, block) {
      var dist = {}, prev = {}, q = [start], far = start;
      dist[start] = 0;
      while (q.length) {
        var v = q.shift();
        adj[v].forEach(function (x) {
          var w = x[0];
          if (dist[w] != null || block(w)) return;
          dist[w] = dist[v] + 1; prev[w] = v; q.push(w);
          if (dist[w] > dist[far] || (dist[w] === dist[far] && carriesGroup(w) && !carriesGroup(far))) far = w;
        });
      }
      return { far: far, prev: prev };
    }
    var skip = function (i) { return !!HALOGEN[mol.atoms[i].el] || (mol.atoms[i].el === 'O' && adj[i].length === 1); };
    var seed = 0; while (seed < n && skip(seed)) seed++;
    if (seed >= n) seed = 0;
    var a = farthest(seed, skip).far;
    var res = farthest(a, skip);
    var path = [], v = res.far;
    while (v !== undefined) { path.unshift(v); v = res.prev[v]; }
    // textbook order: the functional group at the end of the chain
    if (path.length > 1 && carriesGroup(path[0]) && !carriesGroup(path[path.length - 1])) path.reverse();
    var onPath = {}; path.forEach(function (p) { onPath[p] = true; });
    var visited = {}; path.forEach(function (p) { visited[p] = true; });
    var ringMark = 0, ringLabel = {};
    function branch(i, from) {
      visited[i] = true;
      var txt = atomText(mol, hs, i, sub);
      var kids = adj[i].filter(function (x) { return x[0] !== from; });
      var parts = [];
      kids.forEach(function (x) {
        if (visited[x[0]]) {
          // ring closure
          var key = Math.min(i, x[0]) + '-' + Math.max(i, x[0]);
          if (!ringLabel[key]) ringLabel[key] = ++ringMark;
          parts.push('·' + ringLabel[key]);
          return;
        }
        parts.push(BOND_TXT[x[1]] === '–' ? branch(x[0], i) : BOND_TXT[x[1]] + branch(x[0], i));
      });
      return txt + parts.map(function (p) { return '(' + p + ')'; }).join('');
    }
    var out = '';
    path.forEach(function (p, k) {
      var txt = atomText(mol, hs, p, sub);
      adj[p].forEach(function (x) {
        if (onPath[x[0]]) {
          var other = x[0];
          var idx = path.indexOf(other);
          if (Math.abs(idx - k) === 1) return;
          var key = Math.min(p, other) + '-' + Math.max(p, other);
          if (!ringLabel[key]) ringLabel[key] = ++ringMark;
          txt += '(·' + ringLabel[key] + ')';
          return;
        }
        if (visited[x[0]]) {
          var key2 = Math.min(p, x[0]) + '-' + Math.max(p, x[0]);
          if (!ringLabel[key2]) ringLabel[key2] = ++ringMark;
          txt += '(·' + ringLabel[key2] + ')';
          return;
        }
        var t = branch(x[0], p);
        txt += '(' + (x[1] > 1 ? BOND_TXT[x[1]] : '') + t + ')';
      });
      if (k > 0) out += BOND_TXT[bondOrder(mol, path[k - 1], p)];
      out += txt;
    });
    return out;
  }

  /* ── parse a structure typed by the user ─────────────────────────── */
  // Accepts condensed formulas the way they are written in class
  // (CH3-CH(OH)-CH3, CH3CH2COOH, CH3-CO-CH3, CH2=CH-CH3, CH3OCH3, HCOOH …)
  // and simple SMILES (CC(O)C, C=CC, C1CC1, CC(=O)O). Hydrogens are implicit.
  function parseStructure(input) {
    var s = normDigits(String(input || '')).trim().replace(/[—–−-]/g, '-').replace(/≡/g, '#').replace(/\s+/g, '');
    if (!s) return { error: 'empty' };
    if (/[a-z]/.test(s.replace(/Cl|Br/g, '')) || /[\[\]%]|[A-Z]\d/.test(s) && !/H\d/.test(s)) {
      var sm = parseSmiles(s);
      if (!sm.error) return sm;
    }
    var cf = parseCondensed(s);
    if (!cf.error) return cf;
    var sm2 = parseSmiles(s);
    return sm2.error ? cf : sm2;
  }

  function parseSmiles(s) {
    var mol = { atoms: [], bonds: [] }, stack = [], prev = -1, order = 1, ringOpen = {}, aromatic = [];
    var re = /(Cl|Br|[CNOFI]|c|n|o)|(\()|(\))|([=#-])|(\d)/g, m, used = 0;
    while ((m = re.exec(s))) {
      if (m.index !== used) return { error: 'syntax' };
      used = re.lastIndex;
      if (m[1]) {
        var el = m[1].length === 1 ? m[1].toUpperCase() : m[1];
        mol.atoms.push({ el: el });
        var idx = mol.atoms.length - 1;
        if (/^[cno]$/.test(m[1])) aromatic.push(idx);
        if (prev >= 0) mol.bonds.push({ a: prev, b: idx, o: order });
        prev = idx; order = 1;
      } else if (m[2]) stack.push(prev);
      else if (m[3]) prev = stack.pop();
      else if (m[4]) order = m[4] === '=' ? 2 : (m[4] === '#' ? 3 : 1);
      else if (m[5]) {
        var d = m[5];
        if (ringOpen[d] != null) { mol.bonds.push({ a: ringOpen[d].at, b: prev, o: Math.max(order, ringOpen[d].o) }); delete ringOpen[d]; }
        else ringOpen[d] = { at: prev, o: order };
        order = 1;
      }
    }
    if (used !== s.length || Object.keys(ringOpen).length || stack.length) return { error: 'syntax' };
    if (aromatic.length && !kekulize(mol, aromatic)) return { error: 'aromatic' };
    return validate(mol);
  }
  // Alternate single/double bonds over aromatic atoms (benzene rings).
  function kekulize(mol, arom) {
    var isA = {}; arom.forEach(function (i) { isA[i] = true; });
    var bonds = mol.bonds.filter(function (b) { return isA[b.a] && isA[b.b]; });
    var done = {};
    // atoms that already have an exocyclic double bond, or are N/O with no room
    arom.forEach(function (i) {
      var used = mol.bonds.reduce(function (m, b) { return m + ((b.a === i || b.b === i) ? b.o : 0); }, 0);
      if (mol.atoms[i].el !== 'C' || VALENCE[mol.atoms[i].el] - used < 1) done[i] = true;
    });
    var need = arom.filter(function (i) { return !done[i]; });
    function solve(k) {
      while (k < need.length && done[need[k]]) k++;
      if (k === need.length) return true;
      var i = need[k];
      for (var j = 0; j < bonds.length; j++) {
        var b = bonds[j];
        if (b.o !== 1 || (b.a !== i && b.b !== i)) continue;
        var o = b.a === i ? b.b : b.a;
        if (done[o]) continue;
        b.o = 2; done[i] = done[o] = true;
        if (solve(k + 1)) return true;
        b.o = 1; done[i] = done[o] = false;
      }
      return false;
    }
    return solve(0);
  }

  // Condensed: tokens are groups (CH3, CH2, CH, C, COOH, CHO, CO, COO, OH, O,
  // NH2, NH, N, CN, halogens), bonds (-, =, #) and parentheses for branches.
  function parseCondensed(s) {
    var mol = { atoms: [], bonds: [] }, declH = [], pending = [];
    var re = /(C6H5|HOOC|COOH|COO|CHO|OHC|CONH2|Cl|Br|CN|CO(?!H)|H3C|H2C|C(?:H(\d?))?|OH|O|NH2|NH|N|F|I|HO|H)(\d*)|(\()|(\))|([=#-])/g;
    var MONO = { OH: 1, HO: 1, NH2: 1, F: 1, Cl: 1, Br: 1, I: 1 };
    var m, used = 0, prev = -1, order = 1, stack = [], groupStart = [];
    function addAtom(el, h) { mol.atoms.push({ el: el }); declH.push(h == null ? -1 : h); return mol.atoms.length - 1; }
    function link(a, b, o) { mol.bonds.push({ a: a, b: b, o: o || 1 }); }
    while ((m = re.exec(s))) {
      if (m.index !== used) return { error: 'syntax' };
      used = re.lastIndex;
      if (m[4]) { stack.push(prev); groupStart.push(mol.atoms.length); continue; }
      if (m[5]) {
        var start = groupStart.pop(), anchor = stack.pop();
        var times = 1, mm = /^\d+/.exec(s.slice(used));
        if (mm) { times = parseInt(mm[0], 10); used += mm[0].length; re.lastIndex = used; }
        var branchAtoms = mol.atoms.slice(start);
        var internal = mol.bonds.filter(function (b) { return b.a >= start && b.b >= start; });
        // (CH2)4 — a single divalent unit repeats inside the chain
        if (branchAtoms.length === 1 && declH[start] === 2 && branchAtoms[0].el === 'C') {
          prev = start;
          for (var t0 = 1; t0 < times; t0++) { var c2 = addAtom('C', 2); link(prev, c2, 1); prev = c2; }
          continue;
        }
        // (CH3)3, (CH3)2 — repeated branches on the anchor (or on the next atom)
        var heads = [start];
        for (var t = 1; t < times; t++) {
          var off = mol.atoms.length - start;
          branchAtoms.forEach(function (a, k) { mol.atoms.push({ el: a.el }); declH.push(declH[start + k]); });
          internal.forEach(function (b) { mol.bonds.push({ a: b.a + off, b: b.b + off, o: b.o }); });
          if (anchor >= 0) mol.bonds.push({ a: anchor, b: start + off, o: 1 });
          heads.push(start + off);
        }
        if (anchor < 0) pending = pending.concat(heads);
        prev = anchor;
        continue;
      }
      if (m[6]) { order = m[6] === '=' ? 2 : (m[6] === '#' ? 3 : 1); continue; }
      var tok = m[1], rep = m[3] ? parseInt(m[3], 10) : 1;
      for (var r = 0; r < rep; r++) {
        var head = -1, tail = -1;
        if (tok === 'C6H5') {
          // phenyl ring (Kekulé form), bonded through its first carbon
          head = addAtom('C');
          var ring = [head];
          for (var q = 1; q < 6; q++) { ring.push(addAtom('C')); link(ring[q - 1], ring[q], q % 2 ? 2 : 1); }
          link(ring[5], head, 1);
          tail = head;
        }
        else if (tok === 'COOH' || tok === 'HOOC') { head = addAtom('C'); var o1 = addAtom('O'), o2 = addAtom('O'); link(head, o1, 2); link(head, o2, 1); tail = head; }
        else if (tok === 'COO') { head = addAtom('C'); var o3 = addAtom('O'), o4 = addAtom('O'); link(head, o3, 2); link(head, o4, 1); tail = o4; }
        else if (tok === 'CHO' || tok === 'OHC') { head = addAtom('C'); link(head, addAtom('O'), 2); tail = head; }
        else if (tok === 'CO') { head = addAtom('C'); link(head, addAtom('O'), 2); tail = head; }
        else if (tok === 'CONH2') { head = addAtom('C'); link(head, addAtom('O'), 2); link(head, addAtom('N'), 1); tail = head; }
        else if (tok === 'CN') { head = addAtom('C'); link(head, addAtom('N'), 3); tail = head; }
        else if (tok === 'Cl' || tok === 'Br') { head = tail = addAtom(tok); }
        else if (tok === 'H3C' || tok === 'H2C') { head = tail = addAtom('C', tok === 'H3C' ? 3 : 2); }
        else if (/^C/.test(tok)) { head = tail = addAtom('C', m[2] ? parseInt(m[2], 10) : (/H/.test(tok) ? 1 : 0)); }
        else if (tok === 'OH' || tok === 'HO') { head = tail = addAtom('O'); }
        else if (tok === 'O') { head = tail = addAtom('O'); }
        else if (/^N/.test(tok)) { head = tail = addAtom('N'); }
        else if (tok === 'H') { continue; }
        else { head = tail = addAtom(tok); }
        if (prev >= 0) link(prev, head, order);
        if (pending.length && head >= 0) { pending.forEach(function (p) { link(p, head, 1); }); pending = []; }
        order = 1;
        // monovalent groups written after a carbon are substituents (CH3CHBrCH3)
        if (MONO[tok] && prev >= 0) continue;
        prev = tail;
      }
    }
    if (used !== s.length || stack.length) return { error: 'syntax' };
    return validate(mol);
  }

  function validate(mol) {
    if (!mol.atoms.length) return { error: 'empty' };
    if (!mol.atoms.some(function (a) { return a.el === 'C'; })) return { error: 'no-carbon' };
    var hs = hydrogens(mol);
    for (var i = 0; i < hs.length; i++) if (hs[i] < 0) return { error: 'valence', atom: i };
    // connected?
    var adj = adjacency(mol), seen = {}, stack = [0]; seen[0] = true;
    while (stack.length) { var v = stack.pop(); adj[v].forEach(function (x) { if (!seen[x[0]]) { seen[x[0]] = true; stack.push(x[0]); } }); }
    if (Object.keys(seen).length !== mol.atoms.length) return { error: 'disconnected' };
    if (mol.atoms.length > 14) return { error: 'too-big' };
    mol.key = keyOf(mol);
    return mol;
  }

  /* ── 2D layout (Kamada–Kawai on graph distances) ─────────────────── */
  function layout2d(mol) {
    var n = mol.atoms.length, adj = adjacency(mol);
    if (n === 1) return [[0, 0]];
    var D = [];
    for (var i = 0; i < n; i++) {
      D[i] = []; var q = [i]; D[i][i] = 0;
      while (q.length) { var v = q.shift(); adj[v].forEach(function (x) { if (D[i][x[0]] == null) { D[i][x[0]] = D[i][v] + 1; q.push(x[0]); } }); }
    }
    var P = [];
    for (var k = 0; k < n; k++) { var ang = 2 * Math.PI * k / n; P.push([Math.cos(ang) * n * 0.3 + (k % 2) * 0.01, Math.sin(ang) * n * 0.3]); }
    // trees: zig-zag friendly distances (1–3 neighbours at sqrt(3))
    function target(d) { return d === 1 ? 1 : (d === 2 ? 1.732 : 1.732 * (d / 2) + (d % 2 ? 0.5 : 0)); }
    for (var it = 0; it < 900; it++) {
      var lr = 0.06 * (1 - it / 1000);
      for (var a = 0; a < n; a++) {
        var gx = 0, gy = 0;
        for (var b = 0; b < n; b++) {
          if (a === b) continue;
          var dx = P[a][0] - P[b][0], dy = P[a][1] - P[b][1];
          var dist = Math.sqrt(dx * dx + dy * dy) || 1e-6;
          var t = target(D[a][b]);
          var w = 1 / (t * t);
          var f = w * (dist - t) / dist;
          gx += f * dx; gy += f * dy;
        }
        P[a][0] -= lr * gx; P[a][1] -= lr * gy;
      }
    }
    // orient: longest extent horizontal
    var cx = 0, cy = 0; P.forEach(function (p) { cx += p[0]; cy += p[1]; }); cx /= n; cy /= n;
    var sxx = 0, sxy = 0, syy = 0;
    P.forEach(function (p) { var x = p[0] - cx, y = p[1] - cy; sxx += x * x; sxy += x * y; syy += y * y; });
    var th = 0.5 * Math.atan2(2 * sxy, sxx - syy);
    var co = Math.cos(-th), si = Math.sin(-th);
    return P.map(function (p) { var x = p[0] - cx, y = p[1] - cy; return [x * co - y * si, x * si + y * co]; });
  }

  /* ── 3D embedding with ideal bond lengths and angles ─────────────── */
  var R_COV = { H: 0.31, C: 0.76, N: 0.71, O: 0.66, F: 0.57, Cl: 1.02, Br: 1.20, I: 1.39 };
  function bondLength(e1, e2, o) {
    var base = R_COV[e1] + R_COV[e2];
    if (o === 2) base *= 0.87;
    if (o === 3) base *= 0.78;
    if (e1 === 'H' || e2 === 'H') base = R_COV[e1] + R_COV[e2] + (e1 === 'C' || e2 === 'C' ? 0.02 : -0.02);
    return base;
  }
  function seeded(seed) { var x = seed || 7; return function () { x = (x * 16807) % 2147483647; return (x - 1) / 2147483646; }; }
  function embed3d(mol, opts) {
    opts = opts || {};
    var full = withHydrogens(mol);
    var n = full.atoms.length;
    var adj = full.atoms.map(function () { return []; });
    full.bonds.forEach(function (b) { adj[b.a].push([b.b, b.o]); adj[b.b].push([b.a, b.o]); });
    function hyb(i) {
      var t = adj[i].reduce(function (m, x) { return m + (x[1] - 1); }, 0);
      if (adj[i].some(function (x) { return x[1] === 3; }) || t >= 2) return 180;
      if (t === 1) return 120;
      return full.atoms[i].el === 'O' ? 108 : 109.47;
    }
    // aromatic rings: every ring bond 1.397 Å (benzene), not Kekulé lengths
    var arom = aromaticAtoms(mol);
    function BL(i, j, o) {
      if (i < full.heavy && j < full.heavy && arom[i] && arom[j]) return 1.397;
      return bondLength(full.atoms[i].el, full.atoms[j].el, o);
    }
    var T = {}, W = {};
    function setT(i, j, d, w) { var k = i < j ? i + ',' + j : j + ',' + i; T[k] = d; W[k] = w; }
    full.bonds.forEach(function (b) { setT(b.a, b.b, BL(b.a, b.b, b.o), 4); });
    for (var c = 0; c < n; c++) {
      var nb = adj[c];
      for (var x = 0; x < nb.length; x++) for (var y = x + 1; y < nb.length; y++) {
        var i = nb[x][0], j = nb[y][0];
        var di = BL(c, i, nb[x][1]);
        var dj = BL(c, j, nb[y][1]);
        var th = hyb(c) * Math.PI / 180;
        setT(i, j, Math.sqrt(di * di + dj * dj - 2 * di * dj * Math.cos(th)), hyb(c) === 180 ? 6 : (hyb(c) === 120 ? 3 : 2));
      }
    }
    // planar double bonds: 1–4 distances (first substituents trans, unless
    // opts.cis; inside a ring the two ring neighbours are always cis)
    var ringB = ringBonds(mol), ringA = ringAtoms(mol);
    full.bonds.forEach(function (b, bk) {
      if (b.o !== 2) return;
      var inRing = bk < mol.bonds.length && ringB[bk];
      var sa = adj[b.a].filter(function (x) { return x[0] !== b.b; }).map(function (x) { return x[0]; });
      var sb = adj[b.b].filter(function (x) { return x[0] !== b.a; }).map(function (x) { return x[0]; });
      if (!sa.length || !sb.length) return;
      sa.sort(function (p, q) { return (Z[full.atoms[q].el] - Z[full.atoms[p].el]) || (adj[q].length - adj[p].length); });
      sb.sort(function (p, q) { return (Z[full.atoms[q].el] - Z[full.atoms[p].el]) || (adj[q].length - adj[p].length); });
      var cis = opts.cis && opts.cis.indexOf(b.a) >= 0;
      // exact 1–4 distances of a planar sp2–sp2 unit with 120° angles
      var d0 = BL(b.a, b.b, 2);
      var s3 = Math.sqrt(3) / 2;
      sa.forEach(function (p, ia) {
        sb.forEach(function (q, ib) {
          var trans = inRing ? (!!ringA[p] !== !!ringA[q]) : ((ia === ib) !== !!cis);
          var d1 = BL(b.a, p, 1);
          var d2 = BL(b.b, q, 1);
          var dx = d0 + d2 / 2 + d1 / 2, dy = trans ? (d1 + d2) * s3 : (d1 - d2) * s3;
          setT(p, q, Math.sqrt(dx * dx + dy * dy), 2);
        });
      });
    });
    // Start from the 2D drawing (untangled), lift it into 3D, relax; keep the
    // best of a few seeds (lowest stress).
    // graph distances (for the non-bonded minimum distances)
    var G = [];
    for (var g0 = 0; g0 < n; g0++) {
      G[g0] = []; G[g0][g0] = 0; var gq = [g0];
      while (gq.length) { var gv = gq.shift(); adj[gv].forEach(function (x) { if (G[g0][x[0]] == null) { G[g0][x[0]] = G[g0][gv] + 1; gq.push(x[0]); } }); }
    }
    var flat = layout2d(mol);
    function relax(seed) {
      var rnd = seeded(seed);
      var P = [];
      for (var k = 0; k < n; k++) {
        if (k < full.heavy) P.push([flat[k][0] * 1.45, flat[k][1] * 1.45, (rnd() - 0.5) * 0.6]);
        else {
          var par = full.atoms[k].parent, th = rnd() * Math.PI * 2, ph = Math.acos(2 * rnd() - 1);
          P.push([flat[par][0] * 1.45 + Math.sin(ph) * Math.cos(th), flat[par][1] * 1.45 + Math.sin(ph) * Math.sin(th), Math.cos(ph)]);
        }
      }
      var stress = 0;
      for (var it = 0; it < 2200; it++) {
        var lr = 0.045 * (1 - it / 2400);
        var G = P.map(function () { return [0, 0, 0]; });
        stress = 0;
        for (var a = 0; a < n; a++) for (var bb = a + 1; bb < n; bb++) {
          var key = a + ',' + bb;
          var dx = P[a][0] - P[bb][0], dy = P[a][1] - P[bb][1], dz = P[a][2] - P[bb][2];
          var dist = Math.sqrt(dx * dx + dy * dy + dz * dz) || 1e-6;
          var t, w;
          if (T[key] != null) { t = T[key]; w = W[key]; }
          else {
            var nH = (full.atoms[a].el === 'H' ? 1 : 0) + (full.atoms[bb].el === 'H' ? 1 : 0);
            var near = G[a][bb] === 3; // 1–4 pairs (gauche, ring para) sit closer
            var minD = nH === 2 ? 2.2 : (nH === 1 ? (near ? 2.4 : 2.5) : (near ? 2.45 : 2.9));
            if (dist >= minD) continue;
            t = minD; w = 0.6;
          }
          var f = w * (dist - t) / dist;
          stress += w * (dist - t) * (dist - t);
          G[a][0] += f * dx; G[a][1] += f * dy; G[a][2] += f * dz;
          G[bb][0] -= f * dx; G[bb][1] -= f * dy; G[bb][2] -= f * dz;
        }
        for (var q = 0; q < n; q++) { P[q][0] -= lr * G[q][0]; P[q][1] -= lr * G[q][1]; P[q][2] -= lr * G[q][2]; }
      }
      return { P: P, stress: stress };
    }
    var best = null;
    [opts.seed || 11, 29, 47, 83].forEach(function (sd) {
      var r = relax(sd);
      if (!best || r.stress < best.stress) best = r;
    });
    var P = best.P;
    // sp centres (triple or cumulated bonds) exactly linear: rotate the far
    // fragment about the centre until the three atoms are collinear
    for (var c3 = 0; c3 < n; c3++) {
      if (hyb(c3) !== 180 || adj[c3].length !== 2) continue;
      var ia = adj[c3][0][0], ja = adj[c3][1][0];
      var side = {}, stk = [ja], cyc = false; side[ja] = true;
      while (stk.length) {
        var sv = stk.pop();
        adj[sv].forEach(function (x) { if (x[0] === c3) { if (sv !== ja) cyc = true; return; } if (!side[x[0]]) { side[x[0]] = true; stk.push(x[0]); } });
      }
      if (cyc || side[ia]) continue;
      var pc = P[c3];
      var want = [pc[0] - P[ia][0], pc[1] - P[ia][1], pc[2] - P[ia][2]];
      var have = [P[ja][0] - pc[0], P[ja][1] - pc[1], P[ja][2] - pc[2]];
      var lw = Math.sqrt(want[0] * want[0] + want[1] * want[1] + want[2] * want[2]) || 1;
      var lh = Math.sqrt(have[0] * have[0] + have[1] * have[1] + have[2] * have[2]) || 1;
      want = want.map(function (v) { return v / lw; }); have = have.map(function (v) { return v / lh; });
      var ax = [have[1] * want[2] - have[2] * want[1], have[2] * want[0] - have[0] * want[2], have[0] * want[1] - have[1] * want[0]];
      var sn = Math.sqrt(ax[0] * ax[0] + ax[1] * ax[1] + ax[2] * ax[2]);
      var cs = have[0] * want[0] + have[1] * want[1] + have[2] * want[2];
      if (sn < 1e-9) continue;
      ax = ax.map(function (v) { return v / sn; });
      var ang = Math.atan2(sn, cs), co = Math.cos(ang), si = Math.sin(ang);
      Object.keys(side).forEach(function (k) {
        var v = [P[k][0] - pc[0], P[k][1] - pc[1], P[k][2] - pc[2]];
        var kd = ax[0] * v[0] + ax[1] * v[1] + ax[2] * v[2];
        var cr = [ax[1] * v[2] - ax[2] * v[1], ax[2] * v[0] - ax[0] * v[2], ax[0] * v[1] - ax[1] * v[0]];
        P[k] = [0, 1, 2].map(function (q) { return pc[q] + v[q] * co + cr[q] * si + ax[q] * kd * (1 - co); });
      });
    }
    var cx = 0, cy = 0, cz = 0;
    P.forEach(function (p) { cx += p[0]; cy += p[1]; cz += p[2]; });
    cx /= n; cy /= n; cz /= n;
    P = P.map(function (p) { return [p[0] - cx, p[1] - cy, p[2] - cz]; });
    if (opts.mirror) P = P.map(function (p) { return [-p[0], p[1], p[2]]; });
    return { atoms: full.atoms, bonds: full.bonds, coords: P, heavy: full.heavy };
  }

  // Geometry report from 3D coordinates (bond lengths and angles at heavy atoms).
  function geometry(model) {
    function d(i, j) { var a = model.coords[i], b = model.coords[j]; return Math.sqrt(Math.pow(a[0] - b[0], 2) + Math.pow(a[1] - b[1], 2) + Math.pow(a[2] - b[2], 2)); }
    var lengths = model.bonds.map(function (b) { return { a: b.a, b: b.b, o: b.o, d: d(b.a, b.b) }; });
    return { lengths: lengths };
  }

  return {
    LIMITS: LIMITS,
    VALENCE: VALENCE,
    Z: Z,
    parseFormula: parseFormula,
    formulaOf: formulaOf,
    enumerate: enumerate,
    canonical: canonical,
    keyOf: keyOf,
    adjacency: adjacency,
    hydrogens: hydrogens,
    ringBonds: ringBonds,
    ringAtoms: ringAtoms,
    bondOrder: bondOrder,
    groups: groups,
    aromaticAtoms: aromaticAtoms,
    classify: classify,
    chainInfo: chainInfo,
    pairType: pairType,
    PAIR_NAMES: PAIR_NAMES,
    CLASS_NAMES: CLASS_NAMES,
    stereo: stereo,
    withHydrogens: withHydrogens,
    assignRS: assignRS,
    condensed: condensed,
    parseStructure: parseStructure,
    parseSmiles: parseSmiles,
    parseCondensed: parseCondensed,
    layout2d: layout2d,
    embed3d: embed3d,
    geometry: geometry
  };
});
