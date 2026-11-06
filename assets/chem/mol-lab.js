/* Atomurus — molecules page: "build any molecule" and the geometry and
   polarity panel. Uses AtomurusIsomers (parse + 3D embedding),
   AtomurusMolInsight (analysis + measured values) and the viewer API
   (window.AtomurusMolViewer). */
(function () {
  'use strict';
  var ISO = window.AtomurusIsomers, MI = window.AtomurusMolInsight;
  if (!ISO || !MI) return;

  var COPY = {
    en: {
      buildTitle: 'Build any molecule',
      buildPh: 'e.g. CH3COOCH2CH3, C6H5OH, CC(=O)N',
      buildGo: 'Build in 3D',
      buildHint: 'Condensed formula or SMILES. Organic molecules up to 14 atoms besides hydrogen.',
      built: 'Built: ',
      err: {
        empty: 'Type a structure first.',
        syntax: 'Could not read this structure. Try a condensed formula (CH3CH2OH) or SMILES (CCO).',
        valence: 'An atom ends up with too many bonds. Check the hydrogens and the = / ≡ bonds.',
        'no-carbon': 'The builder makes organic molecules (with carbon). For H₂O, NH₃, SO₂ and others, use the list below.',
        disconnected: 'The structure has separate pieces. Write a single molecule.',
        'too-big': 'Up to 14 atoms besides hydrogen.',
        aromatic: 'Could not place the double bonds of this aromatic ring.'
      },
      isomers: function (f, n) { return f + ' is a molecular formula with ' + n + ' structures. Pick one:'; },
      isomersMore: function (n) { return '+' + n + ' more in Isomerism'; },
      ring: 'ring',
      facts: 'Geometry and polarity',
      formula: 'Formula', mass: 'molar mass',
      shape: 'Shape (VSEPR)',
      polarity: 'Polarity',
      dipole: 'Dipole moment',
      pg: 'Point group',
      measured: 'measured', noMeasure: 'no measurement here',
      showVec: 'Show the μ vector', hideVec: 'Hide the μ vector',
      bonds: 'Bonds', angles: 'Angles',
      thBond: 'Bond', thN: 'n', thDchi: 'Δχ', thKind: 'Type', thModel: 'Model', thMeasured: 'Measured', thAngle: 'Angle',
      kind: { apolar: 'nonpolar covalent', polar: 'polar covalent', ionic: 'ionic' },
      verdict: {
        polar: 'Polar', weak: 'Slightly polar', apolar: 'Nonpolar', 'apolar-cancel': 'Nonpolar', ionic: 'Ionic compound'
      },
      why: {
        polar: 'The bond dipoles do not cancel in the 3D shape.',
        weak: 'The bond dipoles almost cancel: a small net dipole is left.',
        apolar: 'The bonds are nearly nonpolar.',
        'apolar-cancel': 'The bonds are polar, but the symmetric shape cancels their dipoles.',
        ionic: 'Electrons are transferred (Δχ ≥ 1.7): ions, not a polar covalent molecule.'
      },
      at: function (shape, el, n) { return shape + ' at ' + el + (n > 1 ? ' ×' + n : ''); },
      diatomic: 'linear (diatomic)',
      ionicShape: 'ionic lattice / ion pair',
      noteMeasured: 'Measured values: gas phase, NIST CCCBDB and CRC Handbook. The 3D model uses these bond lengths; angles without a measurement follow VSEPR. Polarity: vector sum of the bond dipoles (Pauling Δχ) over the 3D shape.',
      noteBuilt: 'Built by the Atomurus engine: typical measured bond lengths and ideal VSEPR angles. No experimental dipole for this structure; the verdict comes from the vector sum of the bond dipoles (Pauling Δχ).',
      noteFe: 'Fe₂O₃ is an ionic solid (hematite). The model shows one formula unit, not a molecule, so it has no molecular shape or dipole.',
      pm: 'pm'
    },
    pt: {
      buildTitle: 'Montar qualquer molécula',
      buildPh: 'ex.: CH3COOCH2CH3, C6H5OH, CC(=O)N',
      buildGo: 'Montar em 3D',
      buildHint: 'Fórmula estrutural condensada ou SMILES. Moléculas orgânicas com até 14 átomos além do hidrogênio.',
      built: 'Montada: ',
      err: {
        empty: 'Digite uma estrutura primeiro.',
        syntax: 'Não consegui ler essa estrutura. Tente a condensada (CH3CH2OH) ou SMILES (CCO).',
        valence: 'Algum átomo ficou com ligações demais. Confira os hidrogênios e as ligações = / ≡.',
        'no-carbon': 'O montador faz moléculas orgânicas (com carbono). Para H₂O, NH₃, SO₂ e outras, use a lista abaixo.',
        disconnected: 'A estrutura tem partes separadas. Escreva uma só molécula.',
        'too-big': 'Até 14 átomos além do hidrogênio.',
        aromatic: 'Não consegui posicionar as ligações duplas desse anel aromático.'
      },
      isomers: function (f, n) { return f + ' é uma fórmula molecular com ' + n + ' estruturas. Escolha uma:'; },
      isomersMore: function (n) { return '+' + n + ' em Isomeria'; },
      ring: 'anel',
      facts: 'Geometria e polaridade',
      formula: 'Fórmula', mass: 'massa molar',
      shape: 'Geometria (TRPECV)',
      polarity: 'Polaridade',
      dipole: 'Momento dipolar',
      pg: 'Grupo de ponto',
      measured: 'medido', noMeasure: 'sem medida aqui',
      showVec: 'Mostrar o vetor μ', hideVec: 'Ocultar o vetor μ',
      bonds: 'Ligações', angles: 'Ângulos',
      thBond: 'Ligação', thN: 'nº', thDchi: 'Δχ', thKind: 'Tipo', thModel: 'Modelo', thMeasured: 'Medido', thAngle: 'Ângulo',
      kind: { apolar: 'covalente apolar', polar: 'covalente polar', ionic: 'iônica' },
      verdict: {
        polar: 'Polar', weak: 'Pouco polar', apolar: 'Apolar', 'apolar-cancel': 'Apolar', ionic: 'Composto iônico'
      },
      why: {
        polar: 'Os dipolos das ligações não se cancelam na forma 3D.',
        weak: 'Os dipolos quase se cancelam: sobra um dipolo pequeno.',
        apolar: 'As ligações são praticamente apolares.',
        'apolar-cancel': 'As ligações são polares, mas a forma simétrica cancela os dipolos.',
        ionic: 'Há transferência de elétrons (Δχ ≥ 1,7): íons, não uma molécula covalente polar.'
      },
      at: function (shape, el, n) { return shape + ' no ' + el + (n > 1 ? ' ×' + n : ''); },
      diatomic: 'linear (diatômica)',
      ionicShape: 'retículo iônico / par iônico',
      noteMeasured: 'Valores medidos: fase gasosa, NIST CCCBDB e CRC Handbook. O modelo 3D usa esses comprimentos; ângulos sem medida seguem a TRPECV. Polaridade: soma vetorial dos dipolos de ligação (Δχ de Pauling) na forma 3D.',
      noteBuilt: 'Montada pelo motor do Atomurus: comprimentos de ligação típicos medidos e ângulos ideais da TRPECV. Sem dipolo experimental para esta estrutura; o veredito vem da soma vetorial dos dipolos de ligação (Δχ de Pauling).',
      noteFe: 'Fe₂O₃ é um sólido iônico (hematita). O modelo mostra uma unidade de fórmula, não uma molécula: não há forma molecular nem dipolo.',
      pm: 'pm'
    }
  };
  var EXAMPLES = [
    { s: 'CH3COOCH2CH3', en: 'ethyl acetate', pt: 'acetato de etila' },
    { s: 'C6H5OH', en: 'phenol', pt: 'fenol' },
    { s: 'CH3CH2NH2', en: 'ethylamine', pt: 'etilamina' },
    { s: 'CH3CHO', en: 'acetaldehyde', pt: 'etanal' },
    { s: 'CHCl3', en: 'chloroform', pt: 'clorofórmio' },
    { s: 'CCl4', en: 'carbon tetrachloride', pt: 'tetracloreto de carbono' },
    { s: 'CH3CN', en: 'acetonitrile', pt: 'acetonitrila' },
    { s: 'CH2=CHCl', en: 'vinyl chloride', pt: 'cloreto de vinila' },
    { s: 'C6H5CH3', en: 'toluene', pt: 'tolueno' },
    { s: 'HCOOH', en: 'formic acid', pt: 'ácido fórmico' }
  ];

  function lang() { return (document.documentElement.lang || '').toLowerCase().indexOf('pt') === 0 ? 'pt' : 'en'; }
  function T() { return COPY[lang()]; }
  function esc(s) { return String(s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); }
  function num(x, d) { var s = Number(x).toFixed(d); return lang() === 'pt' ? s.replace('.', ',') : s; }
  var SUBS = { '0': '₀', '1': '₁', '2': '₂', '3': '₃', '4': '₄', '5': '₅', '6': '₆', '7': '₇', '8': '₈', '9': '₉' };
  function subscript(f) { return String(f).replace(/\d/g, function (d) { return SUBS[d]; }); }
  function pgHtml(pg) { return esc(pg.charAt(0)) + '<sub>' + esc(pg.slice(1)) + '</sub>'; }
  function shapeName(key) { var n = MI.SHAPE_NAMES[key]; return n ? n[lang()] : key; }

  /* ── builder ─────────────────────────────────────────────────────── */
  var buildEl = null, lastSource = '';
  function mountBuilder() {
    var panel = document.querySelector('.viewer .panel');
    if (!panel || document.getElementById('mol-build')) return;
    buildEl = document.createElement('form');
    buildEl.id = 'mol-build';
    buildEl.className = 'mol-build';
    buildEl.setAttribute('novalidate', '');
    var search = panel.querySelector('.mol-search');
    if (search && search.nextSibling) panel.insertBefore(buildEl, search.nextSibling);
    else panel.insertBefore(buildEl, panel.firstChild);
    renderBuilder();
    buildEl.addEventListener('submit', function (e) {
      e.preventDefault();
      build(buildEl.querySelector('input').value);
    });
    buildEl.addEventListener('click', function (e) {
      var iso = e.target.closest('[data-iso]');
      if (iso) {
        e.preventDefault();
        var m = pendingIsomers[+iso.getAttribute('data-iso')];
        if (m) build(iso.getAttribute('data-src') || '', false, m);
        return;
      }
      var b = e.target.closest('[data-build]');
      if (!b) return;
      e.preventDefault();
      buildEl.querySelector('input').value = b.getAttribute('data-build');
      build(b.getAttribute('data-build'));
    });
    // Enter in the search box with no match → try to build what was typed
    if (search) {
      search.addEventListener('keydown', function (e) {
        if (e.key !== 'Enter') return;
        var none = panel.querySelector('.mol-search-none');
        if (none && none.style.display !== 'none' && search.value.trim()) {
          e.preventDefault();
          buildEl.querySelector('input').value = search.value.trim();
          build(search.value.trim());
        }
      });
    }
  }
  function renderBuilder() {
    if (!buildEl) return;
    var t = T(), keep = buildEl.querySelector('input') ? buildEl.querySelector('input').value : lastSource;
    buildEl.innerHTML =
      '<div class="panel-label">' + esc(t.buildTitle) + '</div>' +
      '<div class="mol-build-row"><input type="text" id="mol-build-input" autocomplete="off" spellcheck="false" autocapitalize="off" placeholder="' + esc(t.buildPh) + '" aria-label="' + esc(t.buildTitle) + '" value="' + esc(keep || '') + '">' +
      '<button type="submit" class="mol-build-go">' + esc(t.buildGo) + '</button></div>' +
      '<p class="mol-build-hint">' + esc(t.buildHint) + '</p>' +
      '<div class="mol-build-ex">' + EXAMPLES.map(function (x) {
        return '<button type="button" class="pill sm" data-build="' + esc(x.s) + '" title="' + esc(x[lang()]) + '">' + esc(subscript(x.s)) + '</button>';
      }).join('') + '</div>' +
      '<div class="mol-build-msg" role="status" aria-live="polite"></div>';
  }
  function say(html, isError) {
    var m = buildEl && buildEl.querySelector('.mol-build-msg');
    if (!m) return;
    m.innerHTML = html || '';
    m.classList.toggle('is-error', !!isError);
  }

  var PURE_FORMULA = /^(?:[A-Z][a-z]?\d*)+$/;
  var pendingIsomers = [];
  // "C4H10O", "C2H4": every element written once → a molecular formula, which
  // can name several structures. "CH3CH2OH", "C6H5OH" repeat H → a structure.
  function isMolecularFormula(s) {
    if (!PURE_FORMULA.test(s)) return false;
    var seen = {}, re = /([A-Z][a-z]?)\d*/g, m;
    while ((m = re.exec(s))) { if (seen[m[1]]) return false; seen[m[1]] = 1; }
    return true;
  }
  function formulaCounts(mol) {
    var full = ISO.withHydrogens(mol), c = {};
    full.atoms.forEach(function (a) { c[a.el] = (c[a.el] || 0) + 1; });
    return c;
  }
  function isomerLabel(m) {
    var c = ISO.condensed(m);
    if (c) return c;
    var cls = ISO.classify(m);
    return ((ISO.CLASS_NAMES[cls.label] || ISO.CLASS_NAMES[cls.main] || {})[lang()] || '') + ' · ' + T().ring;
  }

  function build(src, quiet, given) {
    var t = T();
    src = String(src || '').trim();
    var mol = given;
    if (!mol) {
      if (!src) { say(esc(t.err.empty), true); return false; }
      var compact = src.replace(/\s+/g, '');
      if (isMolecularFormula(compact)) {
        var en = ISO.enumerate(compact);
        if (!en.error && en.isomers && en.isomers.length === 1) mol = en.isomers[0];
        else if (!en.error && en.isomers && en.isomers.length) {
          pendingIsomers = en.isomers.slice(0, 10);
          say('<p>' + esc(t.isomers(subscript(compact), en.total)) + '</p><div class="mol-build-ex">' +
            pendingIsomers.map(function (m, i) {
              return '<button type="button" class="pill sm" data-iso="' + i + '" data-src="' + esc(compact) + '">' + esc(isomerLabel(m)) + '</button>';
            }).join('') +
            (en.total > pendingIsomers.length ? '<a class="mol-build-more" href="isomerism.html">' + esc(t.isomersMore(en.total - pendingIsomers.length)) + '</a>' : '') +
            '</div>', false);
          return false;
        }
      }
      if (!mol) mol = ISO.parseStructure(src);
    }
    if (mol.error) { say(esc(t.err[mol.error] || t.err.syntax), true); return false; }

    var st = ISO.stereo(mol);
    var model = ISO.embed3d(mol, {});
    var chiral = st.chiralCenters.length === 1;
    if (chiral) {
      var rs = ISO.assignRS(model, model.coords, st.chiralCenters);
      if (rs[st.chiralCenters[0]] !== 'R') model = ISO.embed3d(mol, { mirror: true });
    }
    var m3 = { atoms: model.atoms.map(function (a, i) { return { el: a.el, pos: model.coords[i].slice() }; }), bonds: model.bonds.map(function (b) { return [b.a, b.b, b.o]; }) };
    MI.snapBondLengths(m3, null);
    var view = MI.toViewer(m3);
    var cls = ISO.classify(mol);
    var condensed = ISO.condensed(mol);
    var counts = formulaCounts(mol);
    var hill = ['C', 'H'].concat(Object.keys(counts).filter(function (k) { return k !== 'C' && k !== 'H'; }).sort())
      .filter(function (k) { return counts[k]; }).map(function (k) { return k + (counts[k] > 1 ? counts[k] : ''); }).join('');
    var name = condensed || subscript(hill);
    var data = {
      key: 'custom',
      custom: true,
      source: given ? asciiOf(condensed) || src : src,
      name: name,
      desc: (ISO.CLASS_NAMES[cls.label] || ISO.CLASS_NAMES[cls.main] || {})[lang()] || '',
      atoms: view.atoms,
      bonds: view.bonds,
      draw2d: draw2d(mol)
    };
    if (chiral) data.chiral = true;
    var V = window.AtomurusMolViewer;
    if (!V) return false;
    V.register('custom', data);
    lastSource = data.source;
    if (!quiet) say(esc(t.built) + '<b>' + esc(name) + '</b>' + (given && pendingIsomers.length > 1 ? msgList() : ''), false);
    V.show('custom');
    return true;
  }

  function asciiOf(c) {
    return c ? c.replace(/[₀-₉]/g, function (d) { return String('₀₁₂₃₄₅₆₇₈₉'.indexOf(d)); }).replace(/–/g, '') : '';
  }
  // keep the isomer chips visible after picking one
  function msgList() {
    var m = buildEl && buildEl.querySelector('.mol-build-msg .mol-build-ex');
    return m ? m.outerHTML : '';
  }

  // 2D structural drawing: engine layout for the skeleton, hydrogens fanned
  // out in the free directions.
  function draw2d(mol) {
    var P = ISO.layout2d(mol), full = ISO.withHydrogens(mol);
    var scale = 1.6;
    var atoms = P.map(function (p, i) { return { x: p[0] * scale, y: p[1] * scale, label: mol.atoms[i].el }; });
    var bonds = mol.bonds.map(function (b) { return { a: b.a, b: b.b, order: b.o }; });
    var adj = mol.atoms.map(function () { return []; });
    mol.bonds.forEach(function (b) { adj[b.a].push(b.b); adj[b.b].push(b.a); });
    var hOf = {};
    full.atoms.forEach(function (a, k) { if (a.parent != null) (hOf[a.parent] = hOf[a.parent] || []).push(k); });
    Object.keys(hOf).forEach(function (pi) {
      pi = +pi;
      var used = adj[pi].map(function (j) { return Math.atan2(atoms[j].y - atoms[pi].y, atoms[j].x - atoms[pi].x); });
      hOf[pi].forEach(function () {
        var best = 0, bestGap = -1;
        for (var k = 0; k < 24; k++) {
          var a = k * Math.PI / 12, gap = Math.PI;
          used.forEach(function (u) { var d = Math.abs(Math.atan2(Math.sin(a - u), Math.cos(a - u))); if (d < gap) gap = d; });
          if (gap > bestGap + 1e-6) { bestGap = gap; best = a; }
        }
        used.push(best);
        atoms.push({ x: atoms[pi].x + Math.cos(best) * 1.1, y: atoms[pi].y + Math.sin(best) * 1.1, label: 'H' });
        bonds.push({ a: pi, b: atoms.length - 1, order: 1 });
      });
    });
    return { atoms: atoms, bonds: bonds };
  }

  /* ── facts panel ─────────────────────────────────────────────────── */
  var factsEl = null, lastDetail = null;
  function mountFacts() {
    if (document.getElementById('mol-facts')) return;
    var viewer = document.querySelector('.content-inner > .viewer') || document.querySelector('.viewer');
    if (!viewer) return;
    factsEl = document.createElement('section');
    factsEl.id = 'mol-facts';
    factsEl.className = 'mol-facts';
    factsEl.setAttribute('aria-live', 'polite');
    viewer.parentNode.insertBefore(factsEl, viewer.nextSibling);
    factsEl.addEventListener('click', function (e) {
      if (e.target.closest('[data-mol-dipole]') && window.toggleDipole) window.toggleDipole();
    });
  }

  function formulaText(d) {
    var md = d.molecule || {};
    if (!md.custom && md.name && md.name.indexOf(' — ') > 0) return md.name.split(' — ')[0];
    return d.analysis.formula;
  }

  function shapeSummary(a, d) {
    var t = T();
    if (a.ionic) return t.ionicShape;
    if (!a.shapes.length) return d.atoms.length === 2 ? t.diatomic : '—';
    var heavy = a.shapes.filter(function (s) { return s.el !== 'H'; });
    return heavy.slice(0, 4).map(function (s) { return t.at(shapeName(s.shape), s.el, s.count); }).join(' · ');
  }

  function verdictOf(a, ref) {
    if (a.ionic) return 'ionic';
    if (ref && ref.mu != null) {
      var polarBonds = a.bondTypes.some(function (b) { return b.kind !== 'apolar'; });
      if (ref.mu === 0) return polarBonds ? 'apolar-cancel' : 'apolar';
      if (ref.mu < 0.5) return 'weak';
      return 'polar';
    }
    return a.dipole.verdict;
  }

  function renderFacts(d) {
    if (!factsEl) return;
    lastDetail = d;
    var a = d.analysis, t = T();
    if (!a) { factsEl.hidden = true; return; }
    factsEl.hidden = false;
    var md = d.molecule || {};
    var isFe = d.key === 'fe2o3';
    var ref = md.custom ? null : MI.reference(d.key);
    var verdict = verdictOf(a, ref);
    var vecOn = window.AtomurusMolViewer && window.AtomurusMolViewer.dipoleVisible();
    var canVec = !a.ionic && a.dipole.magnitude >= 0.12;
    var scale = MI.VIEW.SCALE;

    var tiles =
      tile(t.formula, '<b>' + esc(formulaText(d)) + '</b>', num(a.mass, 2) + ' g/mol · ' + t.mass) +
      tile(t.shape, '<b>' + esc(isFe ? t.ionicShape : shapeSummary(a, d)) + '</b>', ref && ref.pg ? esc(t.pg) + ' ' + pgHtml(ref.pg) : '') +
      tile(t.polarity, '<b class="mol-v-' + verdict + '">' + esc(t.verdict[verdict]) + '</b>', esc(t.why[verdict])) +
      tile(t.dipole, ref && ref.mu != null ? '<b>' + num(ref.mu, 2) + ' D</b>' : '<b>—</b>', ref && ref.mu != null ? t.measured + (ref.note === 'gas' ? ' (gas)' : '') : t.noMeasure);

    var bondRows = a.bondTypes.map(function (b) {
      var meas = ref && ref.len && ref.len[b.label];
      return '<tr><td class="mono">' + esc(b.label) + '</td><td>' + b.count + '</td><td>' + num(b.dchi, 2) + '</td><td><span class="mol-k mol-k-' + b.kind + '">' + esc(t.kind[b.kind]) + '</span></td>' +
        '<td>' + (isFe ? '—' : num(b.length / scale * 100, 1) + ' ' + t.pm) + '</td>' +
        '<td>' + (meas != null ? num(meas, 1) + ' ' + t.pm : '—') + '</td></tr>';
    }).join('');
    var angleRows = isFe ? '' : a.angles.slice(0, 10).map(function (g) {
      var meas = ref && ref.ang && ref.ang[g.label];
      var model = g.values.map(function (v) { return num(v.deg, 1) + '°' + (g.values.length > 1 || v.count > 1 ? ' <span class="mol-x">×' + v.count + '</span>' : ''); }).join(' · ');
      return '<tr><td class="mono">' + esc(g.label) + '</td><td>' + model + '</td><td>' + (meas != null ? num(meas, 1) + '°' : '—') + '</td></tr>';
    }).join('');

    factsEl.innerHTML =
      '<div class="mol-facts-head"><h2>' + esc(t.facts) + '</h2>' +
      (canVec ? '<button type="button" class="mol-facts-vec" data-mol-dipole aria-pressed="' + (vecOn ? 'true' : 'false') + '"><span aria-hidden="true">μ</span> ' + esc(vecOn ? t.hideVec : t.showVec) + '</button>' : '') +
      '</div>' +
      '<div class="mol-facts-tiles">' + tiles + '</div>' +
      '<div class="mol-facts-tables">' +
      '<div class="mol-facts-t"><h3>' + esc(t.bonds) + '</h3><div class="mol-scroll"><table><thead><tr><th>' + t.thBond + '</th><th>' + t.thN + '</th><th>' + t.thDchi + '</th><th>' + t.thKind + '</th><th>' + t.thModel + '</th><th>' + t.thMeasured + '</th></tr></thead><tbody>' + bondRows + '</tbody></table></div></div>' +
      (angleRows ? '<div class="mol-facts-t"><h3>' + esc(t.angles) + '</h3><div class="mol-scroll"><table><thead><tr><th>' + t.thAngle + '</th><th>' + t.thModel + '</th><th>' + t.thMeasured + '</th></tr></thead><tbody>' + angleRows + '</tbody></table></div></div>' : '') +
      '</div>' +
      '<p class="mol-facts-note">' + esc(isFe ? t.noteFe : (md.custom ? t.noteBuilt : t.noteMeasured)) + '</p>';
  }
  function tile(k, v, sub) {
    return '<div class="mol-tile"><span class="mol-tile-k">' + esc(k) + '</span><span class="mol-tile-v">' + v + '</span>' + (sub ? '<span class="mol-tile-s">' + sub + '</span>' : '') + '</div>';
  }

  /* ── wiring ──────────────────────────────────────────────────────── */
  function boot() {
    mountBuilder();
    mountFacts();
    if (window.AtomurusMolViewer && window.AtomurusMolViewer.snapshot) {
      var snap = window.AtomurusMolViewer.snapshot();
      if (snap && snap.analysis) renderFacts(snap);
    }
  }
  window.addEventListener('atomurus:molecule', function (e) { if (!factsEl) boot(); renderFacts(e.detail); });
  window.addEventListener('atomurus:dipole', function () { if (lastDetail) renderFacts(lastDetail); });
  window.addEventListener('atomurus:molviewer-ready', function () {
    var src = null;
    try { src = new URLSearchParams(location.search).get('build'); } catch (_) {}
    if (src) {
      if (buildEl) buildEl.querySelector('input').value = src;
      build(src, true);
    }
  });
  (function wireI18n() {
    if (window.I18N && window.I18N.onChange) {
      window.I18N.onChange(function () {
        renderBuilder();
        if (lastDetail && lastDetail.molecule && lastDetail.molecule.custom && lastSource) build(lastSource, true);
        else if (lastDetail) renderFacts(lastDetail);
      });
    } else setTimeout(wireI18n, 80);
  })();
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot);
  else boot();
})();
