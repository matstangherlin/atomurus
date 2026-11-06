/* Atomurus — allotropes: structures built from measured geometry, with the
   reference values and sources shown on the page.

   Every model is generated in ångström from the measured lattice or
   molecular parameters below (bond lengths, angles, lattice constants), so
   what the viewer draws is the same thing the facts panel quotes. Runs in the
   browser (window.AtomurusAllotropes) and in Node (module.exports) for the
   tests in tools/test-allotropes.mjs. */
(function (root) {
  'use strict';

  /* ── vector helpers ─────────────────────────────────────────────── */
  function sub(a, b) { return [a[0] - b[0], a[1] - b[1], a[2] - b[2]]; }
  function add(a, b) { return [a[0] + b[0], a[1] + b[1], a[2] + b[2]]; }
  function scale(a, k) { return [a[0] * k, a[1] * k, a[2] * k]; }
  function dot(a, b) { return a[0] * b[0] + a[1] * b[1] + a[2] * b[2]; }
  function cross(a, b) { return [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]]; }
  function norm(a) { return Math.sqrt(dot(a, a)); }
  function unit(a) { var n = norm(a) || 1; return scale(a, 1 / n); }
  function dist(a, b) { return norm(sub(a, b)); }
  function deg(r) { return r * 180 / Math.PI; }
  function rad(d) { return d * Math.PI / 180; }

  function dedupe(pts, tol) {
    var out = [];
    tol = tol || 0.05;
    pts.forEach(function (p) {
      for (var i = 0; i < out.length; i++) if (dist(out[i], p) < tol) return;
      out.push(p);
    });
    return out;
  }

  /* Bonds by distance: every pair closer than max (and farther than min). */
  function bondsWithin(atoms, max, min) {
    var out = [];
    min = min || 0.5;
    for (var i = 0; i < atoms.length; i++) {
      for (var j = i + 1; j < atoms.length; j++) {
        var d = dist(atoms[i], atoms[j]);
        if (d > min && d < max) out.push([i, j]);
      }
    }
    return out;
  }

  /* Drop atoms left with fewer than `need` neighbours (loose ends at the
     edge of a cut-out flake), repeating until stable. */
  function prune(atoms, max, need) {
    var cur = atoms.slice();
    for (var pass = 0; pass < 6; pass++) {
      var keep = cur.filter(function (p) {
        var n = 0;
        for (var i = 0; i < cur.length; i++) {
          var d = dist(p, cur[i]);
          if (d > 0.5 && d < max) n++;
        }
        return n >= need;
      });
      if (keep.length === cur.length) break;
      cur = keep;
    }
    return cur;
  }

  function center(atoms) {
    var c = [0, 0, 0];
    atoms.forEach(function (p) { c = add(c, p); });
    c = scale(c, 1 / atoms.length);
    return atoms.map(function (p) { return sub(p, c); });
  }

  /* ── measured parameters ────────────────────────────────────────── */
  var P = {
    // Graphite, hexagonal 2H (AB): a, c (Å). C–C = a/√3; layers c/2 apart.
    graphite: { a: 2.464, c: 6.711 },
    // Diamond, cubic Fd-3m: a (Å). C–C = a·√3/4.
    diamond: { a: 3.5668 },
    // Graphene: same in-plane lattice as graphite.
    graphene: { a: 2.46 },
    // C60, gas-phase electron diffraction: 5:6 and 6:6 bonds (Å).
    c60: { r56: 1.458, r66: 1.401 },
    // (6,6) armchair nanotube rolled from graphene (a = 2.46 Å).
    nanotube: { n: 6, m: 6, a: 2.46, cells: 5 },
    // O2 and O3, gas phase (Å, degrees).
    o2: { r: 1.2075 },
    o3: { r: 1.272, angle: 116.8 },
    // α-S8 crown: mean S–S, S–S–S (low-temperature X-ray).
    s8: { r: 2.046, angle: 108.0 },
    // Helical (fibrous) sulfur chain: S–S, angle, torsion.
    sHelix: { r: 2.066, angle: 106.0, torsion: 85.3, atoms: 14 },
    // P4, gas-phase electron diffraction.
    p4: { r: 2.1994 },
    // Red phosphorus: amorphous; teaching model with a typical P–P.
    pRed: { r: 2.21, linkAngle: 105, units: 4 },
    // Black phosphorus, orthorhombic Cmce: a, b, c (Å) and the 8f site (0, y, z).
    pBlack: { a: 3.3136, b: 10.478, c: 4.3763, y: 0.10168, z: 0.08056 }
  };

  /* ── generators (all in Å) ──────────────────────────────────────── */
  function honeycomb(a, radius, z, shift) {
    var a1 = [a, 0], a2 = [a / 2, a * Math.sqrt(3) / 2];
    var d = [a / 2, a / (2 * Math.sqrt(3))];
    var pts = [];
    var span = Math.ceil(radius / a) + 2;
    for (var i = -span; i <= span; i++) {
      for (var j = -span; j <= span; j++) {
        var x = i * a1[0] + j * a2[0], y = i * a1[1] + j * a2[1];
        [[x, y], [x + d[0], y + d[1]]].forEach(function (q) {
          var px = q[0] + (shift ? shift[0] : 0), py = q[1] + (shift ? shift[1] : 0);
          if (Math.hypot(px, py) <= radius) pts.push([px, z, py]);
        });
      }
    }
    return pts;
  }

  function graphite() {
    var a = P.graphite.a, cc = a / Math.sqrt(3), gap = P.graphite.c / 2;
    var shift = [a / 2, a / (2 * Math.sqrt(3))];
    var atoms = [];
    var bonds = [];
    [-gap, 0, gap].forEach(function (y, li) {
      var layer = prune(honeycomb(a, 5.4, y, li === 1 ? shift : null), cc * 1.1, 2);
      var base = atoms.length;
      atoms = atoms.concat(layer);
      bondsWithin(layer, cc * 1.1).forEach(function (b) { bonds.push([b[0] + base, b[1] + base]); });
    });
    return { atoms: center(atoms), bonds: bonds };
  }

  function diamond() {
    var a = P.diamond.a, cc = a * Math.sqrt(3) / 4;
    var fcc = [[0, 0, 0], [0, 0.5, 0.5], [0.5, 0, 0.5], [0.5, 0.5, 0]];
    var pts = [];
    for (var i = -2; i <= 1; i++) for (var j = -2; j <= 1; j++) for (var k = -2; k <= 1; k++) {
      fcc.forEach(function (f) {
        [0, 0.25].forEach(function (o) {
          var p = [(i + f[0] + o) * a, (j + f[1] + o) * a, (k + f[2] + o) * a];
          // centred on a bond midpoint so the cluster is symmetric
          if (dist(p, [a / 8, a / 8, a / 8]) < 4.7) pts.push(p);
        });
      });
    }
    var atoms = prune(dedupe(pts), cc * 1.1, 2);
    return { atoms: center(atoms), bonds: bondsWithin(atoms, cc * 1.1) };
  }

  function graphene() {
    var a = P.graphene.a, cc = a / Math.sqrt(3);
    var atoms = prune(honeycomb(a, 7.2, 0, null), cc * 1.1, 2);
    return { atoms: center(atoms), bonds: bondsWithin(atoms, cc * 1.1) };
  }

  /* Truncated icosahedron with two bond lengths: cut each icosahedron edge
     (length E) at t·E from both ends. Pentagon edges = t·E (5:6 bonds),
     the rest of the edge = (1 − 2t)·E (6:6 bonds). */
  function c60() {
    var r56 = P.c60.r56, r66 = P.c60.r66;
    var E = 2 * r56 + r66, t = r56 / E;
    var f = (1 + Math.sqrt(5)) / 2;
    var ico = [];
    [[0, 1, f], [1, f, 0], [f, 0, 1]].forEach(function (v) {
      [-1, 1].forEach(function (s1) {
        [-1, 1].forEach(function (s2) {
          var p = v.slice();
          var nz = [];
          p.forEach(function (c, i) { if (c !== 0) nz.push(i); });
          p[nz[0]] *= s1; p[nz[1]] *= s2;
          ico.push(p);
        });
      });
    });
    ico = ico.map(function (p) { return scale(p, E / 2); });
    var pts = [];
    for (var i = 0; i < ico.length; i++) {
      for (var j = 0; j < ico.length; j++) {
        if (i === j) continue;
        if (Math.abs(dist(ico[i], ico[j]) - E) > 1e-6) continue;
        pts.push(add(ico[i], scale(sub(ico[j], ico[i]), t)));
      }
    }
    var atoms = dedupe(pts, 0.01);
    return { atoms: center(atoms), bonds: bondsWithin(atoms, Math.max(r56, r66) * 1.06) };
  }

  /* Roll a graphene strip along the chiral vector Ch = n·a1 + m·a2. */
  function nanotube() {
    var n = P.nanotube.n, m = P.nanotube.m, a = P.nanotube.a, cc = a / Math.sqrt(3);
    var a1 = [a, 0], a2 = [a / 2, a * Math.sqrt(3) / 2];
    var ch = [n * a1[0] + m * a2[0], n * a1[1] + m * a2[1]];
    var L = Math.hypot(ch[0], ch[1]);
    var R = L / (2 * Math.PI);
    var u = [ch[0] / L, ch[1] / L], v = [-u[1], u[0]];
    var length = P.nanotube.cells * a * (n === m ? 1 : Math.sqrt(3));
    var d = [a / 2, a / (2 * Math.sqrt(3))];
    var pts = [];
    var span = 30;
    for (var i = -span; i <= span; i++) {
      for (var j = -span; j <= span; j++) {
        var x = i * a1[0] + j * a2[0], y = i * a1[1] + j * a2[1];
        [[x, y], [x + d[0], y + d[1]]].forEach(function (q) {
          var s = q[0] * u[0] + q[1] * u[1];
          var h = q[0] * v[0] + q[1] * v[1];
          if (s < -1e-6 || s >= L - 1e-6 || h < -1e-6 || h >= length - 1e-6) return;
          var th = 2 * Math.PI * s / L;
          pts.push([R * Math.cos(th), h, R * Math.sin(th)]);
        });
      }
    }
    var atoms = prune(dedupe(pts, 0.05), cc * 1.1, 2);
    return { atoms: center(atoms), bonds: bondsWithin(atoms, cc * 1.1), diameter: 2 * R };
  }

  function o2() {
    var r = P.o2.r;
    return { atoms: [[-r / 2, 0, 0], [r / 2, 0, 0]], bonds: [[0, 1, 2]] };
  }

  function o3() {
    var r = P.o3.r, h = rad(P.o3.angle / 2);
    var atoms = [[0, 0, 0], [-r * Math.sin(h), -r * Math.cos(h), 0], [r * Math.sin(h), -r * Math.cos(h), 0]];
    return { atoms: center(atoms), bonds: [[0, 1, 1.5], [0, 2, 1.5]] };
  }

  /* S8 crown (D4d): atoms on a circle of radius R, alternately ±h. From the
     bond length d and angle θ: R² = d²(1 − cos θ) and
     4h² = d² − (2 − √2)·R². */
  function s8() {
    var d = P.s8.r, th = rad(P.s8.angle);
    var R2 = d * d * (1 - Math.cos(th));
    var h = Math.sqrt((d * d - (2 - Math.SQRT2) * R2) / 4);
    var R = Math.sqrt(R2);
    var atoms = [];
    for (var k = 0; k < 8; k++) {
      var phi = k * Math.PI / 4;
      atoms.push([R * Math.cos(phi), (k % 2 ? -h : h), R * Math.sin(phi)]);
    }
    var bonds = [];
    for (var i = 0; i < 8; i++) bonds.push([i, (i + 1) % 8]);
    return { atoms: atoms, bonds: bonds };
  }

  /* Chain from internal coordinates (bond, angle, torsion): the natural
     extension reference frame used by molecular builders. */
  function chain(r, angleDeg, torsionDeg, count) {
    var th = rad(angleDeg), tau = rad(torsionDeg);
    var atoms = [[0, 0, 0], [r, 0, 0]];
    atoms.push([r - r * Math.cos(th), r * Math.sin(th), 0]);
    while (atoms.length < count) {
      var A = atoms[atoms.length - 3], B = atoms[atoms.length - 2], C = atoms[atoms.length - 1];
      var bc = unit(sub(C, B));
      var nrm = unit(cross(sub(B, A), bc));
      var m2 = cross(nrm, bc);
      var d2 = [-r * Math.cos(th), r * Math.sin(th) * Math.cos(tau), r * Math.sin(th) * Math.sin(tau)];
      var D = add(C, add(add(scale(bc, d2[0]), scale(m2, d2[1])), scale(nrm, d2[2])));
      atoms.push(D);
    }
    var bonds = [];
    for (var i = 0; i < atoms.length - 1; i++) bonds.push([i, i + 1]);
    return { atoms: atoms, bonds: bonds };
  }

  function sHelix() {
    var s = P.sHelix;
    var c = chain(s.r, s.angle, s.torsion, s.atoms);
    // stand the helix up along y: put its axis (first → last atom) on y
    var axis = unit(sub(c.atoms[c.atoms.length - 1], c.atoms[0]));
    var y = [0, 1, 0];
    var k = cross(axis, y), sinA = norm(k), cosA = dot(axis, y);
    var atoms = c.atoms;
    if (sinA > 1e-9) {
      k = scale(k, 1 / sinA);
      atoms = atoms.map(function (p) {
        // Rodrigues rotation of p about k by the angle between axis and y
        return add(add(scale(p, cosA), scale(cross(k, p), sinA)), scale(k, dot(k, p) * (1 - cosA)));
      });
    }
    return { atoms: center(atoms), bonds: c.bonds };
  }

  function p4() {
    var r = P.p4.r, s = r / (2 * Math.SQRT2);
    return {
      atoms: [[s, s, s], [s, -s, -s], [-s, s, -s], [-s, -s, s]],
      bonds: [[0, 1], [0, 2], [0, 3], [1, 2], [1, 3], [2, 3]]
    };
  }

  /* Red phosphorus teaching model: P4 tetrahedra with one bond opened,
     linked into a zigzag chain. Every drawn bond is r; the link makes
     linkAngle with the bonds inside each unit. */
  function pRed() {
    var r = P.pRed.r, half = r / 2;
    var w = Math.sqrt(r * r - half * half);          // wing reach in the xy plane
    var gamma = rad(P.pRed.linkAngle);
    var cosRel = -r * Math.cos(gamma) / w;            // cos(β − α) for the link
    var rel = Math.acos(Math.max(-1, Math.min(1, cosRel)));
    // tan β = sin(rel) / (cos(rel) + 2w/r): the link of the flipped unit mirrors this one
    var beta = Math.atan2(Math.sin(rel), Math.cos(rel) + 2 * w / r);
    var alpha = beta - rel;
    var u = w * Math.cos(beta), y0 = w * Math.sin(beta);
    var step = 2 * u + r * Math.cos(alpha);
    var atoms = [], bonds = [];
    for (var i = 0; i < P.pRed.units; i++) {
      var X = i * step, s = i % 2 ? -1 : 1, b = atoms.length;
      atoms.push([X, 0, half], [X, 0, -half], [X - u, s * y0, 0], [X + u, s * y0, 0]);
      bonds.push([b, b + 1], [b, b + 2], [b + 1, b + 2], [b, b + 3], [b + 1, b + 3]);
      if (i > 0) bonds.push([b - 1, b + 2]);
    }
    return { atoms: center(atoms), bonds: bonds };
  }

  /* Black phosphorus: Cmce, P at 8f (0, y, z). Two puckered layers. */
  function pBlack() {
    var q = P.pBlack;
    var sites = [[0, q.y, q.z], [0, -q.y + 0.5, q.z + 0.5], [0, q.y + 0.5, -q.z + 0.5], [0, -q.y, -q.z]];
    var all = [];
    sites.forEach(function (s) { all.push(s, [s[0] + 0.5, s[1] + 0.5, s[2]]); });
    var pts = [];
    for (var i = -3; i <= 3; i++) for (var j = -1; j <= 1; j++) for (var k = -3; k <= 3; k++) {
      all.forEach(function (s) {
        var f = [s[0] + i, s[1] + j, s[2] + k];
        var p = [f[0] * q.a, f[1] * q.b, f[2] * q.c];
        // keep two layers (centred on y = 0 and y = b/2) and a patch of each
        if (p[1] > -1.6 && p[1] < q.b / 2 + 1.6 && Math.abs(p[0]) <= 5.2 && Math.abs(p[2]) <= 6.6) pts.push(p);
      });
    }
    var atoms = prune(dedupe(pts), 2.4, 2);
    // layers horizontal: swap so the stacking axis (b) is y — it already is
    return { atoms: center(atoms), bonds: bondsWithin(atoms, 2.4) };
  }

  /* ── reference data and copy ────────────────────────────────────── */
  var SOURCES = {
    cbook: { pt: 'CRC Handbook of Chemistry and Physics', en: 'CRC Handbook of Chemistry and Physics' },
    wyckoff: { pt: 'Wyckoff, Crystal Structures (constantes de rede)', en: 'Wyckoff, Crystal Structures (lattice constants)' },
    hedberg: { pt: 'Hedberg et al., Science 254, 410 (1991): difração de elétrons em gás', en: 'Hedberg et al., Science 254, 410 (1991): gas electron diffraction' },
    cccbdb: { pt: 'NIST CCCBDB (geometria em fase gasosa)', en: 'NIST CCCBDB (gas-phase geometry)' },
    steudel: { pt: 'Steudel & Eckert, Solid Sulfur Allotropes, Top. Curr. Chem. 230 (2003)', en: 'Steudel & Eckert, Solid Sulfur Allotropes, Top. Curr. Chem. 230 (2003)' },
    cossairt: { pt: 'Cossairt et al. (2010): P₄ por difração de elétrons em gás', en: 'Cossairt et al. (2010): P₄ by gas electron diffraction' },
    brown: { pt: 'Brown & Rundqvist, Acta Cryst. 19, 684 (1965)', en: 'Brown & Rundqvist, Acta Cryst. 19, 684 (1965)' }
  };

  var ELEMENTS = [
    { id: 'carbon', sym: 'C', z: 6, color: 0x8A8578, css: '#5E584E', page: '/periodic-table/carboneum.html', name: { pt: 'Carbono', en: 'Carbon' }, of: { pt: 'Alótropo do carbono', en: 'Allotrope of carbon' } },
    { id: 'oxygen', sym: 'O', z: 8, color: 0xC2574A, css: '#C2574A', page: '/periodic-table/oxygenium.html', name: { pt: 'Oxigênio', en: 'Oxygen' }, of: { pt: 'Alótropo do oxigênio', en: 'Allotrope of oxygen' } },
    { id: 'sulfur', sym: 'S', z: 16, color: 0xD4AE3E, css: '#D4AE3E', page: '/periodic-table/sulfur.html', name: { pt: 'Enxofre', en: 'Sulfur' }, of: { pt: 'Alótropo do enxofre', en: 'Allotrope of sulfur' } },
    { id: 'phosphorus', sym: 'P', z: 15, color: 0xD9843A, css: '#D9843A', page: '/periodic-table/phosphorus.html', name: { pt: 'Fósforo', en: 'Phosphorus' }, of: { pt: 'Alótropo do fósforo', en: 'Allotrope of phosphorus' } }
  ];

  /* ref: measured values quoted on the page.
       bond  [label, pm] or list of them   angle [label, degrees] or list
       cn    neighbours per atom            hyb   hybridization / bonding note
       density { v, unit, note }            extra [{ k, v }] more measured rows
     ball: atom radius as a fraction of the bond length in the model. */
  var FORMS = {
    graphite: {
      el: 'carbon', build: graphite, ball: 0.22, src: ['wyckoff', 'cbook'],
      name: { pt: 'Grafite', en: 'Graphite' },
      short: { pt: 'Camadas empilhadas', en: 'Stacked layers' },
      label: { pt: 'C · grafite', en: 'C · graphite' },
      note: {
        pt: 'Folhas de hexágonos empilhadas. Dentro da folha as ligações são fortes; entre as folhas, a atração é fraca e elas deslizam. Por isso o lápis deixa marca no papel.',
        en: 'Sheets of hexagons stacked on top of each other. Bonds inside a sheet are strong; between sheets the pull is weak, so they slide. That is why a pencil leaves a mark.'
      },
      structure: { pt: 'Camadas de hexágonos (sp²), empilhamento AB', en: 'Hexagon layers (sp²), AB stacking' },
      props: { pt: 'Macio, cinza-escuro, conduz eletricidade', en: 'Soft, dark grey, conducts electricity' },
      use: { pt: 'Lápis, lubrificantes, eletrodos de baterias', en: 'Pencils, lubricants, battery electrodes' },
      conducts: { pt: 'condutor (no plano)', en: 'conductor (in plane)' },
      ref: {
        bond: ['C–C', 142.2], angle: ['C–C–C', 120], cn: 3, hyb: 'sp²',
        density: { v: 2.26, unit: 'g/cm³' },
        extra: [
          { k: { pt: 'Distância entre camadas', en: 'Interlayer spacing' }, v: [335.5, 'pm'] },
          { k: { pt: 'Célula (hexagonal)', en: 'Cell (hexagonal)' }, v: 'a = 246,4 pm · c = 671,1 pm', vEn: 'a = 246.4 pm · c = 671.1 pm' }
        ]
      }
    },
    diamond: {
      el: 'carbon', build: diamond, ball: 0.22, src: ['wyckoff', 'cbook'],
      name: { pt: 'Diamante', en: 'Diamond' },
      short: { pt: 'Rede rígida em 3D', en: 'Rigid 3D network' },
      label: { pt: 'C · diamante', en: 'C · diamond' },
      note: {
        pt: 'Cada carbono se liga a outros quatro, nos cantos de um tetraedro, em todas as direções. Não há camada para deslizar: é o material natural mais duro.',
        en: 'Each carbon bonds to four others, at the corners of a tetrahedron, in every direction. There is no layer to slide: it is the hardest natural material.'
      },
      structure: { pt: 'Rede tetraédrica (sp³), cúbica', en: 'Tetrahedral network (sp³), cubic' },
      props: { pt: 'Duríssimo (Mohs 10), transparente, isolante', en: 'Very hard (Mohs 10), transparent, insulator' },
      use: { pt: 'Corte e polimento, joias, dissipadores de calor', en: 'Cutting and polishing, jewellery, heat sinks' },
      conducts: { pt: 'isolante', en: 'insulator' },
      ref: {
        bond: ['C–C', 154.4], angle: ['C–C–C', 109.47], cn: 4, hyb: 'sp³',
        density: { v: 3.515, unit: 'g/cm³' },
        extra: [
          { k: { pt: 'Célula (cúbica)', en: 'Cell (cubic)' }, v: 'a = 356,7 pm', vEn: 'a = 356.7 pm' },
          { k: { pt: 'Banda proibida', en: 'Band gap' }, v: [5.47, 'eV'] }
        ]
      }
    },
    graphene: {
      el: 'carbon', build: graphene, ball: 0.22, src: ['wyckoff'],
      name: { pt: 'Grafeno', en: 'Graphene' },
      short: { pt: 'Uma folha só', en: 'A single sheet' },
      label: { pt: 'C · grafeno', en: 'C · graphene' },
      note: {
        pt: 'Uma única camada do grafite, com um átomo de espessura. Foi isolada em 2004 com fita adesiva, por Geim e Novoselov (Nobel de Física de 2010).',
        en: 'A single layer of graphite, one atom thick. It was isolated in 2004 with sticky tape by Geim and Novoselov (Nobel Prize in Physics 2010).'
      },
      structure: { pt: 'Folha de hexágonos (sp²)', en: 'Sheet of hexagons (sp²)' },
      props: { pt: 'Um átomo de espessura, resistente, conduz muito bem', en: 'One atom thick, strong, conducts very well' },
      use: { pt: 'Pesquisa em eletrônica e materiais', en: 'Research in electronics and materials' },
      conducts: { pt: 'condutor (semimetal)', en: 'conductor (semimetal)' },
      ref: {
        bond: ['C–C', 142], angle: ['C–C–C', 120], cn: 3, hyb: 'sp²',
        density: { v: 0.77, unit: 'mg/m²', note: { pt: 'por área', en: 'per area' } },
        extra: [
          { k: { pt: 'Espessura', en: 'Thickness' }, v: { pt: '1 átomo (≈ 335 pm)', en: '1 atom (≈ 335 pm)' } }
        ]
      }
    },
    fullerene: {
      el: 'carbon', build: c60, ball: 0.22, src: ['hedberg', 'cbook'],
      name: { pt: 'Fulereno C₆₀', en: 'Fullerene C₆₀' },
      short: { pt: 'Molécula em bola', en: 'Ball-shaped molecule' },
      label: { pt: 'C₆₀ · fulereno', en: 'C₆₀ · fullerene' },
      note: {
        pt: 'Sessenta carbonos fechados numa bola, com o mesmo desenho de uma bola de futebol: 12 pentágonos e 20 hexágonos. Descoberto em 1985 (Nobel de Química de 1996).',
        en: 'Sixty carbons closed into a ball, with the same pattern as a football: 12 pentagons and 20 hexagons. Discovered in 1985 (Nobel Prize in Chemistry 1996).'
      },
      structure: { pt: '12 pentágonos e 20 hexágonos (icosaedro truncado)', en: '12 pentagons and 20 hexagons (truncated icosahedron)' },
      props: { pt: 'Molécula fechada e oca, sólido preto-acastanhado', en: 'Closed, hollow molecule; brownish-black solid' },
      use: { pt: 'Pesquisa em materiais e células solares orgânicas', en: 'Materials research, organic solar cells' },
      conducts: { pt: 'semicondutor', en: 'semiconductor' },
      ref: {
        bond: [['C–C (5:6)', 145.8], ['C=C (6:6)', 140.1]], angle: [['pentágono', 108, 'pentagon'], ['hexágono', 120, 'hexagon']], cn: 3, hyb: 'sp²',
        density: { v: 1.65, unit: 'g/cm³', note: { pt: 'sólido (fulerita)', en: 'solid (fullerite)' } },
        extra: [
          { k: { pt: 'Diâmetro (núcleos)', en: 'Diameter (nuclei)' }, v: [710, 'pm'] }
        ]
      }
    },
    nanotube: {
      el: 'carbon', build: nanotube, ball: 0.22, src: ['wyckoff'],
      name: { pt: 'Nanotubo', en: 'Nanotube' },
      short: { pt: 'Grafeno enrolado', en: 'Rolled-up graphene' },
      label: { pt: 'C · nanotubo (6,6)', en: 'C · nanotube (6,6)' },
      note: {
        pt: 'Uma folha de grafeno enrolada num tubo. O modelo é o nanotubo (6,6), do tipo "armchair": o jeito de enrolar decide se ele conduz como metal ou como semicondutor.',
        en: 'A graphene sheet rolled into a tube. The model is the (6,6) "armchair" nanotube: how the sheet is rolled decides whether it conducts like a metal or a semiconductor.'
      },
      structure: { pt: 'Tubo de hexágonos (sp²)', en: 'Tube of hexagons (sp²)' },
      props: { pt: 'Muito resistente e leve; metálico ou semicondutor', en: 'Very strong and light; metallic or semiconducting' },
      use: { pt: 'Compósitos, sensores, pesquisa em eletrônica', en: 'Composites, sensors, electronics research' },
      conducts: { pt: 'metálico (6,6)', en: 'metallic (6,6)' },
      ref: {
        bond: ['C–C', 142], angle: ['C–C–C', 120, null, true], cn: 3, hyb: 'sp²',
        density: null,
        extra: [
          { k: { pt: 'Diâmetro (6,6)', en: 'Diameter (6,6)' }, v: [814, 'pm'] }
        ]
      }
    },
    o2: {
      el: 'oxygen', build: o2, ball: 0.36, src: ['cccbdb', 'cbook'],
      name: { pt: 'Oxigênio (O₂)', en: 'Oxygen (O₂)' },
      short: { pt: 'O que você respira', en: 'What you breathe' },
      label: { pt: 'O₂ · dioxigênio', en: 'O₂ · dioxygen' },
      note: {
        pt: 'A forma comum do oxigênio: dois átomos com ligação dupla. Tem dois elétrons desemparelhados, por isso é atraído por um ímã (paramagnético).',
        en: 'The common form of oxygen: two atoms with a double bond. It has two unpaired electrons, so a magnet attracts it (paramagnetic).'
      },
      structure: { pt: 'Dois átomos, ligação dupla', en: 'Two atoms, double bond' },
      props: { pt: 'Gás incolor e sem cheiro; líquido azul-claro', en: 'Colourless, odourless gas; pale blue liquid' },
      use: { pt: '20,95% do ar seco; respiração e combustão', en: '20.95% of dry air; breathing and burning' },
      conducts: { pt: 'isolante (gás)', en: 'insulator (gas)' },
      ref: {
        bond: ['O=O', 120.75], angle: null, cn: 1, hyb: { pt: 'ligação dupla', en: 'double bond' },
        density: { v: 1.429, unit: 'g/L', note: { pt: 'gás, 0 °C e 1 atm', en: 'gas, 0 °C and 1 atm' } },
        extra: [
          { k: { pt: 'Ebulição', en: 'Boiling point' }, v: [-182.96, '°C'] }
        ]
      }
    },
    ozone: {
      el: 'oxygen', build: o3, ball: 0.36, src: ['cccbdb', 'cbook'],
      name: { pt: 'Ozônio (O₃)', en: 'Ozone (O₃)' },
      short: { pt: 'Filtro de UV', en: 'UV filter' },
      label: { pt: 'O₃ · ozônio', en: 'O₃ · ozone' },
      note: {
        pt: 'Três oxigênios em ângulo, com as duas ligações iguais (ressonância). Na estratosfera, absorve a maior parte da radiação ultravioleta do Sol.',
        en: 'Three oxygens at an angle, with both bonds equal (resonance). In the stratosphere it absorbs most of the Sun’s ultraviolet radiation.'
      },
      structure: { pt: 'Três átomos, angular', en: 'Three atoms, bent' },
      props: { pt: 'Gás azulado, cheiro forte, oxidante', en: 'Bluish gas, sharp smell, oxidizer' },
      use: { pt: 'Camada de ozônio; tratamento de água', en: 'Ozone layer; water treatment' },
      conducts: { pt: 'isolante (gás)', en: 'insulator (gas)' },
      ref: {
        bond: ['O–O', 127.2], angle: ['O–O–O', 116.8], cn: { pt: '1–2', en: '1–2' }, hyb: { pt: 'ressonância', en: 'resonance' },
        density: { v: 2.144, unit: 'g/L', note: { pt: 'gás, 0 °C e 1 atm', en: 'gas, 0 °C and 1 atm' } },
        extra: [
          { k: { pt: 'Momento dipolar', en: 'Dipole moment' }, v: [0.53, 'D'] },
          { k: { pt: 'Ebulição', en: 'Boiling point' }, v: [-111.9, '°C'] }
        ]
      }
    },
    s_rhombic: {
      el: 'sulfur', build: s8, ball: 0.3, src: ['steudel', 'cbook'],
      name: { pt: 'Rômbico (α-S₈)', en: 'Rhombic (α-S₈)' },
      short: { pt: 'Anel em coroa', en: 'Crown-shaped ring' },
      label: { pt: 'S₈ · rômbico', en: 'S₈ · rhombic' },
      note: {
        pt: 'Oito átomos num anel dobrado, parecido com uma coroa. Os anéis se empilham num cristal ortorrômbico: é a forma estável do enxofre à temperatura ambiente.',
        en: 'Eight atoms in a puckered ring that looks like a crown. The rings pack into an orthorhombic crystal: the stable form of sulfur at room temperature.'
      },
      structure: { pt: 'Anéis S₈ em cristal ortorrômbico', en: 'S₈ rings in an orthorhombic crystal' },
      props: { pt: 'Sólido amarelo, quebradiço', en: 'Yellow, brittle solid' },
      use: { pt: 'Forma estável até 95,3 °C', en: 'Stable form up to 95.3 °C' },
      conducts: { pt: 'isolante', en: 'insulator' },
      ref: {
        bond: ['S–S', 204.6], angle: ['S–S–S', 108.0], torsion: 98.5, cn: 2, hyb: { pt: 'ligações simples', en: 'single bonds' },
        density: { v: 2.07, unit: 'g/cm³' },
        extra: [
          { k: { pt: 'Estável', en: 'Stable' }, v: { pt: 'abaixo de 95,3 °C', en: 'below 95.3 °C' } }
        ]
      }
    },
    s_mono: {
      el: 'sulfur', build: s8, ball: 0.3, src: ['steudel', 'cbook'],
      name: { pt: 'Monoclínico (β-S₈)', en: 'Monoclinic (β-S₈)' },
      short: { pt: 'O mesmo anel, outro cristal', en: 'Same ring, other crystal' },
      label: { pt: 'S₈ · monoclínico', en: 'S₈ · monoclinic' },
      note: {
        pt: 'A molécula é o mesmo anel S₈; muda só o jeito como os anéis se empilham no cristal. Acima de 95,3 °C o rômbico vira monoclínico, em agulhas.',
        en: 'The molecule is the same S₈ ring; only the way the rings pack in the crystal changes. Above 95.3 °C rhombic sulfur turns monoclinic, in needles.'
      },
      structure: { pt: 'Anéis S₈ em cristal monoclínico', en: 'S₈ rings in a monoclinic crystal' },
      props: { pt: 'Agulhas amarelo-claras', en: 'Pale yellow needles' },
      use: { pt: 'Estável entre 95,3 °C e 119,6 °C', en: 'Stable between 95.3 °C and 119.6 °C' },
      conducts: { pt: 'isolante', en: 'insulator' },
      ref: {
        bond: ['S–S', 204.6], angle: ['S–S–S', 108.0], torsion: 98.5, cn: 2, hyb: { pt: 'ligações simples', en: 'single bonds' },
        density: { v: 1.96, unit: 'g/cm³' },
        extra: [
          { k: { pt: 'Fusão', en: 'Melting point' }, v: [119.6, '°C'] }
        ]
      }
    },
    s_plastic: {
      el: 'sulfur', build: sHelix, ball: 0.3, src: ['steudel'],
      name: { pt: 'Plástico (Sₙ)', en: 'Plastic (Sₙ)' },
      short: { pt: 'Cadeia em espiral', en: 'Spiral chain' },
      label: { pt: 'Sₙ · plástico', en: 'Sₙ · plastic' },
      note: {
        pt: 'Quando o enxofre derretido é jogado na água fria, os anéis se abrem e viram cadeias longas em hélice. Fica elástico como borracha e, em alguns dias, volta a ser rômbico.',
        en: 'When molten sulfur is poured into cold water, the rings open into long helical chains. It turns rubbery and, after a few days, goes back to rhombic.'
      },
      structure: { pt: 'Cadeias longas em hélice', en: 'Long helical chains' },
      props: { pt: 'Elástico, castanho, instável', en: 'Rubbery, brown, unstable' },
      use: { pt: 'Enxofre fundido resfriado de repente', en: 'Molten sulfur cooled suddenly' },
      conducts: { pt: 'isolante', en: 'insulator' },
      ref: {
        bond: ['S–S', 206.6], angle: ['S–S–S', 106.0], torsion: 85.3, cn: 2, hyb: { pt: 'ligações simples', en: 'single bonds' },
        density: null,
        extra: [
          { k: { pt: 'Hélice', en: 'Helix' }, v: { pt: '10 átomos a cada 3 voltas', en: '10 atoms every 3 turns' } }
        ]
      }
    },
    p_white: {
      el: 'phosphorus', build: p4, ball: 0.3, src: ['cossairt', 'cbook'],
      name: { pt: 'Branco (P₄)', en: 'White (P₄)' },
      short: { pt: 'Tetraedro', en: 'Tetrahedron' },
      label: { pt: 'P₄ · fósforo branco', en: 'P₄ · white phosphorus' },
      note: {
        pt: 'Quatro átomos nos cantos de um tetraedro. Os ângulos de 60° deixam as ligações tensas, por isso ele é tão reativo: pega fogo sozinho no ar e é guardado debaixo d’água.',
        en: 'Four atoms at the corners of a tetrahedron. The 60° angles strain the bonds, which is why it is so reactive: it catches fire in air and is stored under water.'
      },
      structure: { pt: 'Moléculas P₄ (tetraedro)', en: 'P₄ molecules (tetrahedron)' },
      props: { pt: 'Sólido branco ceroso, tóxico, brilha no escuro', en: 'Waxy white solid, toxic, glows in the dark' },
      use: { pt: 'Matéria-prima do ácido fosfórico', en: 'Feedstock for phosphoric acid' },
      conducts: { pt: 'isolante', en: 'insulator' },
      ref: {
        bond: ['P–P', 219.94], angle: ['P–P–P', 60], cn: 3, hyb: { pt: 'ligações simples tensas', en: 'strained single bonds' },
        density: { v: 1.82, unit: 'g/cm³' },
        extra: [
          { k: { pt: 'Fusão', en: 'Melting point' }, v: [44.15, '°C'] }
        ]
      }
    },
    p_red: {
      el: 'phosphorus', build: pRed, ball: 0.3, src: ['cbook'], didactic: true,
      name: { pt: 'Vermelho', en: 'Red' },
      short: { pt: 'Cadeia de tetraedros abertos', en: 'Chain of opened tetrahedra' },
      label: { pt: 'Pₙ · fósforo vermelho', en: 'Pₙ · red phosphorus' },
      note: {
        pt: 'Aquecendo o branco sem ar, cada P₄ abre uma ligação e se prende ao vizinho, formando cadeias. É amorfo, sem rede regular: o modelo mostra a ideia, não posições medidas.',
        en: 'Heating white phosphorus without air, each P₄ opens one bond and links to its neighbour, forming chains. It is amorphous, with no regular lattice: the model shows the idea, not measured positions.'
      },
      structure: { pt: 'Polímero amorfo de unidades P₄ abertas', en: 'Amorphous polymer of opened P₄ units' },
      props: { pt: 'Pó vermelho-escuro, estável ao ar, pouco tóxico', en: 'Dark red powder, stable in air, low toxicity' },
      use: { pt: 'Lixa da caixa de fósforos de segurança', en: 'Striking strip of safety matchboxes' },
      conducts: { pt: 'semicondutor', en: 'semiconductor' },
      ref: {
        bond: null, angle: null, cn: 3, hyb: { pt: 'ligações simples', en: 'single bonds' },
        density: { v: 2.2, unit: 'g/cm³', approx: true, note: { pt: 'varia com o preparo', en: 'depends on preparation' } },
        extra: []
      }
    },
    p_black: {
      el: 'phosphorus', build: pBlack, ball: 0.26, src: ['brown', 'cbook'],
      name: { pt: 'Negro', en: 'Black' },
      short: { pt: 'Camadas onduladas', en: 'Puckered layers' },
      label: { pt: 'P · fósforo negro', en: 'P · black phosphorus' },
      note: {
        pt: 'Camadas onduladas empilhadas, parecidas com o grafite. É a forma mais estável do fósforo; uma camada só, o fosforeno, é um semicondutor estudado para eletrônica.',
        en: 'Stacked puckered layers, similar to graphite. It is the most stable form of phosphorus; a single layer, phosphorene, is a semiconductor studied for electronics.'
      },
      structure: { pt: 'Camadas onduladas, cristal ortorrômbico', en: 'Puckered layers, orthorhombic crystal' },
      props: { pt: 'Preto, brilho metálico, lamelar', en: 'Black, metallic lustre, flaky' },
      use: { pt: 'Pesquisa em eletrônica (fosforeno)', en: 'Electronics research (phosphorene)' },
      conducts: { pt: 'semicondutor', en: 'semiconductor' },
      ref: {
        bond: [['P–P (na camada)', 222.4, 'P–P (in layer)'], ['P–P (entre degraus)', 224.4, 'P–P (between steps)']], angle: [['P–P–P', 96.3], ['P–P–P', 102.1]], cn: 3, hyb: { pt: 'ligações simples', en: 'single bonds' },
        density: { v: 2.69, unit: 'g/cm³' },
        extra: [
          { k: { pt: 'Distância entre camadas', en: 'Interlayer spacing' }, v: [524, 'pm'] }
        ]
      }
    }
  };

  var ORDER = {
    carbon: ['graphite', 'diamond', 'graphene', 'fullerene', 'nanotube'],
    oxygen: ['o2', 'ozone'],
    sulfur: ['s_rhombic', 's_mono', 's_plastic'],
    phosphorus: ['p_white', 'p_red', 'p_black']
  };

  /* ── analysis of a built model ──────────────────────────────────── */
  function analyse(model) {
    var atoms = model.atoms, bonds = model.bonds;
    var lengths = bonds.map(function (b) { return dist(atoms[b[0]], atoms[b[1]]); });
    var nb = atoms.map(function () { return []; });
    bonds.forEach(function (b) { nb[b[0]].push(b[1]); nb[b[1]].push(b[0]); });
    var angles = [];
    nb.forEach(function (list, i) {
      for (var p = 0; p < list.length; p++) for (var q = p + 1; q < list.length; q++) {
        var v1 = sub(atoms[list[p]], atoms[i]), v2 = sub(atoms[list[q]], atoms[i]);
        angles.push(deg(Math.acos(Math.max(-1, Math.min(1, dot(v1, v2) / (norm(v1) * norm(v2)))))));
      }
    });
    var cn = nb.map(function (l) { return l.length; });
    var reach = 0;
    atoms.forEach(function (p) { reach = Math.max(reach, norm(p)); });
    return {
      atoms: atoms.length,
      bonds: bonds.length,
      lengths: lengths,
      minLength: Math.min.apply(null, lengths),
      maxLength: Math.max.apply(null, lengths),
      angles: angles,
      maxCn: Math.max.apply(null, cn),
      reach: reach
    };
  }

  /* Dihedral angle (degrees) of four points. */
  function torsion(a, b, c, d) {
    var b0 = sub(a, b), b1 = unit(sub(c, b)), b2 = sub(d, c);
    var v = sub(b0, scale(b1, dot(b0, b1)));
    var w = sub(b2, scale(b1, dot(b2, b1)));
    var x = dot(v, w), y = dot(cross(b1, v), w);
    return deg(Math.atan2(y, x));
  }

  var cache = {};
  function model(key) {
    if (cache[key]) return cache[key];
    var f = FORMS[key];
    if (!f) return null;
    var m = f.build();
    m.analysis = analyse(m);
    cache[key] = m;
    return m;
  }

  function element(id) {
    for (var i = 0; i < ELEMENTS.length; i++) if (ELEMENTS[i].id === id) return ELEMENTS[i];
    return null;
  }

  /* Numbers in the page language: 142,2 / 142.2; thousands with . / , */
  function fmt(n, lang, digits) {
    if (n == null || !isFinite(n)) return '—';
    var s = digits == null ? String(n) : Number(n).toFixed(digits);
    var neg = s.charAt(0) === '-';
    if (neg) s = s.slice(1);
    var parts = s.split('.');
    var int = parts[0];
    if (int.length > 4) int = int.replace(/\B(?=(\d{3})+(?!\d))/g, lang === 'pt' ? '.' : ',');
    var out = int + (parts[1] ? (lang === 'pt' ? ',' : '.') + parts[1] : '');
    return (neg ? '−' : '') + out;
  }

  var API = {
    PARAMS: P,
    ELEMENTS: ELEMENTS,
    FORMS: FORMS,
    ORDER: ORDER,
    SOURCES: SOURCES,
    model: model,
    element: element,
    torsion: torsion,
    fmt: fmt
  };

  if (typeof module !== 'undefined' && module.exports) module.exports = API;
  else root.AtomurusAllotropes = API;
})(typeof window !== 'undefined' ? window : this);
