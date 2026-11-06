/* Atomurus — isomer explorer (UI for assets/chem/isomer-engine.js).
   Two tools in one panel:
     1. Any molecular formula → every constitutional isomer, drawn, classified,
        with a "compare two" readout of the type of isomerism.
     2. Analyse one structure (condensed formula or SMILES) → chain type,
        chiral centres, cis/trans, number of stereoisomers, and a 3D model with
        ideal bond lengths/angles, R/S labels and a mirror (enantiomer) toggle.
   Mounts on the isomerism pages in place of the old fixed explorer. */
(function () {
  'use strict';

  var E = window.AtomurusIsomers;
  if (!E) return;

  var COPY = {
    pt: {
      kicker: 'Laboratório de isomeria',
      title: 'Explorador de isômeros',
      lede: 'Digite uma fórmula molecular para ver todos os isômeros constitucionais, ou uma estrutura para analisar cadeia, quiralidade e cis/trans.',
      tabAll: 'Todos os isômeros de uma fórmula',
      tabOne: 'Analisar uma molécula',
      formulaLabel: 'Fórmula molecular',
      formulaPh: 'Ex.: C4H10O',
      generate: 'Gerar isômeros',
      structLabel: 'Estrutura (fórmula condensada ou SMILES)',
      structPh: 'Ex.: CH3-CH(OH)-CH2-CH3',
      analyse: 'Analisar',
      examples: 'Exemplos',
      isomers: function (n) { return n === 1 ? '1 isômero constitucional' : n + ' isômeros constitucionais'; },
      plusStereo: function (n) { return n === 1 ? 'mais 1 com estereoisomeria' : 'mais ' + n + ' com estereoisomeria'; },
      all: 'Todos',
      unstable: 'enol (instável)',
      chiral: 'C quiral',
      cisTrans: 'cis/trans',
      cyclic: 'cadeia fechada',
      pick: 'Toque em dois cartões para comparar.',
      pickOne: 'Escolha mais um cartão para comparar.',
      analyseThis: 'Analisar',
      compareWith: 'Comparar',
      why: {
        cadeia: function (a, b) { return 'Mesma função, cadeias diferentes (' + a + ' × ' + b + ').'; },
        posicao: 'Mesma função e mesma cadeia; muda a posição do grupo funcional, da insaturação ou do substituinte.',
        funcao: function (a, b) { return 'Funções orgânicas diferentes: ' + a + ' × ' + b + '.'; },
        metameria: 'Mesma função e cadeia heterogênea; o heteroátomo muda de posição.',
        tautomeria: 'Aldeído/cetona e enol em equilíbrio: um H migra entre o carbono e o oxigênio.',
        same: 'As duas estruturas são a mesma substância.',
        'not-isomers': 'Para serem isômeros, as fórmulas moleculares precisam ser iguais.'
      },
      chain: { open: 'aberta', closed: 'fechada', aromatic: 'aromática', normal: 'normal', branched: 'ramificada', homo: 'homogênea', hetero: 'heterogênea', sat: 'saturada', unsat: 'insaturada' },
      facts: { formula: 'Fórmula molecular', func: 'Função', chain: 'Cadeia', optical: 'Isomeria óptica', geometric: 'Isomeria geométrica', stereo: 'Estereoisômeros', config: 'Configuração no modelo' },
      noChiral: 'Não: nenhum carbono com quatro ligantes diferentes.',
      chiralN: function (n) { return 'Sim: ' + n + (n === 1 ? ' carbono quiral (C*)' : ' carbonos quirais (C*)'); },
      vantHoff: function (n, c, a, meso) { return '2' + sup(n) + ' = ' + Math.pow(2, n) + ' pela regra de Van ’t Hoff' + (meso ? '; como a molécula é simétrica, há forma meso: ' + c + ' no total, ' + a + ' opticamente ativos' : '') + '.'; },
      geoYes: 'Sim: os dois carbonos da dupla têm ligantes diferentes (cis/trans, Z/E).',
      geoRing: 'Sim: dois carbonos do anel têm ligantes diferentes (cis/trans no anel).',
      geoNo: 'Não: falta uma dupla C=C (ou anel) com dois ligantes diferentes em cada carbono.',
      mirror: 'Espelhar (enantiômero)',
      flip: 'Trocar cis/trans',
      spin: 'Girar',
      stop: 'Parar',
      model: 'Modelo 3D com comprimentos e ângulos de ligação ideais. Arraste para girar.',
      bondsTitle: 'Ligações no modelo',
      err: {
        empty: 'Digite uma fórmula.',
        syntax: 'Não entendi a fórmula. Use símbolos como C, H, O, N, Cl e números: C4H10O.',
        'no-carbon': 'A fórmula precisa ter carbono.',
        impossible: 'Essa fórmula não forma uma molécula neutra estável (confira o número de H).',
        'too-big': 'Fórmula grande demais para listar aqui (até 8 carbonos e 9 átomos além do H).',
        'too-unsaturated': 'Insaturações demais para listar (até 3 ligações π ou anéis).',
        valence: 'Algum átomo ficou com ligações demais. Confira a estrutura.',
        disconnected: 'A estrutura ficou separada em partes. Confira parênteses e ligações.',
        aromatic: 'Não consegui montar o anel aromático.',
        structSyntax: 'Não entendi a estrutura. Exemplos: CH3-CH(OH)-CH3, CH2=CH-CH3, CH3COOH ou SMILES como CC(O)C.'
      },
      capped: function (n) { return 'Mostrando os primeiros 600 de ' + n + '.'; }
    },
    en: {
      kicker: 'Isomerism lab',
      title: 'Isomer explorer',
      lede: 'Type a molecular formula to see every constitutional isomer, or a structure to analyse its chain, chirality and cis/trans isomerism.',
      tabAll: 'All isomers of a formula',
      tabOne: 'Analyse one molecule',
      formulaLabel: 'Molecular formula',
      formulaPh: 'e.g. C4H10O',
      generate: 'Find isomers',
      structLabel: 'Structure (condensed formula or SMILES)',
      structPh: 'e.g. CH3-CH(OH)-CH2-CH3',
      analyse: 'Analyse',
      examples: 'Examples',
      isomers: function (n) { return n === 1 ? '1 constitutional isomer' : n + ' constitutional isomers'; },
      plusStereo: function (n) { return n === 1 ? 'plus 1 with stereoisomerism' : 'plus ' + n + ' with stereoisomerism'; },
      all: 'All',
      unstable: 'enol (unstable)',
      chiral: 'chiral C',
      cisTrans: 'cis/trans',
      cyclic: 'ring',
      pick: 'Tap two cards to compare them.',
      pickOne: 'Pick one more card to compare.',
      analyseThis: 'Analyse',
      compareWith: 'Compare',
      why: {
        cadeia: function (a, b) { return 'Same functional group, different chains (' + a + ' × ' + b + ').'; },
        posicao: 'Same functional group and same chain; the position of the group, double bond or substituent changes.',
        funcao: function (a, b) { return 'Different functional groups: ' + a + ' × ' + b + '.'; },
        metameria: 'Same functional group in a heterogeneous chain; the heteroatom moves along the chain.',
        tautomeria: 'Aldehyde/ketone and enol in equilibrium: one H moves between carbon and oxygen.',
        same: 'Both structures are the same compound.',
        'not-isomers': 'Isomers must have the same molecular formula.'
      },
      chain: { open: 'open', closed: 'closed', aromatic: 'aromatic', normal: 'straight', branched: 'branched', homo: 'homogeneous', hetero: 'heterogeneous', sat: 'saturated', unsat: 'unsaturated' },
      facts: { formula: 'Molecular formula', func: 'Functional group', chain: 'Chain', optical: 'Optical isomerism', geometric: 'Geometric isomerism', stereo: 'Stereoisomers', config: 'Configuration in the model' },
      noChiral: 'No: no carbon has four different substituents.',
      chiralN: function (n) { return 'Yes: ' + n + (n === 1 ? ' chiral carbon (C*)' : ' chiral carbons (C*)'); },
      vantHoff: function (n, c, a, meso) { return '2' + sup(n) + ' = ' + Math.pow(2, n) + ' by Van ’t Hoff’s rule' + (meso ? '; the molecule is symmetric, so there is a meso form: ' + c + ' in total, ' + a + ' optically active' : '') + '.'; },
      geoYes: 'Yes: both carbons of the double bond carry two different groups (cis/trans, Z/E).',
      geoRing: 'Yes: two ring carbons carry two different groups (cis/trans on the ring).',
      geoNo: 'No: there is no C=C (or ring) with two different groups on each carbon.',
      mirror: 'Mirror (enantiomer)',
      flip: 'Swap cis/trans',
      spin: 'Spin',
      stop: 'Stop',
      model: '3D model with ideal bond lengths and angles. Drag to rotate.',
      bondsTitle: 'Bonds in the model',
      err: {
        empty: 'Type a formula.',
        syntax: 'I could not read that formula. Use symbols like C, H, O, N, Cl and numbers: C4H10O.',
        'no-carbon': 'The formula needs carbon.',
        impossible: 'That formula does not give a stable neutral molecule (check the H count).',
        'too-big': 'Formula too large to list here (up to 8 carbons and 9 non-H atoms).',
        'too-unsaturated': 'Too many unsaturations to list (up to 3 π bonds or rings).',
        valence: 'An atom ended up with too many bonds. Check the structure.',
        disconnected: 'The structure is split into pieces. Check brackets and bonds.',
        aromatic: 'I could not build the aromatic ring.',
        structSyntax: 'I could not read that structure. Examples: CH3-CH(OH)-CH3, CH2=CH-CH3, CH3COOH or SMILES like CC(O)C.'
      },
      capped: function (n) { return 'Showing the first 600 of ' + n + '.'; }
    }
  };
  var FORMULA_EXAMPLES = ['C4H10', 'C5H12', 'C4H8', 'C3H6O', 'C4H10O', 'C3H7Cl', 'C4H8O2', 'C5H10'];
  var STRUCT_EXAMPLES = ['CH3-CH(OH)-CH2-CH3', 'CH3-CH=CH-CH3', 'CH3-CH(OH)-COOH', 'HOOC-CH(OH)-CH(OH)-COOH', 'CH3-CHBr-CHBr-CH3', 'CC1CC1C', 'Cc1ccc(O)cc1'];
  var PAGE_DEFAULT = {
    'function': { formula: 'C2H6O' }, chain: { formula: 'C4H10' }, position: { formula: 'C4H8' },
    metamerism: { formula: 'C4H10O' }, tautomerism: { formula: 'C3H6O' },
    geometric: { struct: 'CH3-CH=CH-CH3' }, optical: { struct: 'CH3-CH(OH)-COOH' }
  };

  function lang() { return (document.documentElement.lang || '').toLowerCase().indexOf('pt') === 0 ? 'pt' : 'en'; }
  function t() { return COPY[lang()] || COPY.en; }
  function esc(s) { return String(s == null ? '' : s).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); }
  function sup(n) { return String(n).replace(/\d/g, function (d) { return '⁰¹²³⁴⁵⁶⁷⁸⁹'[d]; }); }
  function subs(s) { return String(s).replace(/(\d+)/g, function (d) { return d.replace(/\d/g, function (x) { return '₀₁₂₃₄₅₆₇₈₉'[x]; }); }); }
  function className(c) { return (E.CLASS_NAMES[c.label] || E.CLASS_NAMES[c.main])[lang()]; }
  function chainText(ch) {
    var C = t().chain;
    return [ch.aromatic ? C.aromatic : (ch.closed ? C.closed : C.open), ch.branched ? C.branched : C.normal, ch.hetero ? C.hetero : C.homo, ch.unsaturated ? C.unsat : C.sat].join(' · ');
  }
  function chainDiff(a, b) {
    var C = t().chain;
    if (a.closed !== b.closed) return [a.closed ? C.closed : C.open, b.closed ? C.closed : C.open];
    if (a.aromatic !== b.aromatic) return [a.aromatic ? C.aromatic : C.closed, b.aromatic ? C.aromatic : C.closed];
    if (a.branched !== b.branched) return [a.branched ? C.branched : C.normal, b.branched ? C.branched : C.normal];
    return [a.hetero ? C.hetero : C.homo, b.hetero ? C.hetero : C.homo];
  }

  /* ── 2D drawing ──────────────────────────────────────────────────── */
  function label(mol, hs, i) {
    var el = mol.atoms[i].el, h = hs[i];
    var H = h ? 'H' + (h > 1 ? '₀₁₂₃₄'[h] : '') : '';
    if (el === 'C') return 'C' + H;
    if (el === 'O') return h ? 'OH' : 'O';
    if (el === 'N') return h === 2 ? 'NH₂' : (h ? 'NH' : 'N');
    return el;
  }
  function drawSvg(mol, opts) {
    opts = opts || {};
    var P = E.layout2d(mol), hs = E.hydrogens(mol);
    var arom = E.aromaticAtoms(mol);
    var chiral = {};
    (opts.chiral || []).forEach(function (i) { chiral[i] = true; });
    var xs = P.map(function (p) { return p[0]; }), ys = P.map(function (p) { return p[1]; });
    var minX = Math.min.apply(null, xs), maxX = Math.max.apply(null, xs), minY = Math.min.apply(null, ys), maxY = Math.max.apply(null, ys);
    var unit = 46, pad = 26;
    var W = (maxX - minX) * unit + pad * 2, H = (maxY - minY) * unit + pad * 2;
    function X(i) { return (P[i][0] - minX) * unit + pad; }
    function Y(i) { return (P[i][1] - minY) * unit + pad; }
    var out = '<svg class="iso-x-svg" viewBox="0 0 ' + Math.max(W, 60).toFixed(0) + ' ' + Math.max(H, 52).toFixed(0) + '" role="img" aria-label="' + esc(E.condensed(mol) || E.formulaOf(mol)) + '">';
    mol.bonds.forEach(function (b) {
      var x1 = X(b.a), y1 = Y(b.a), x2 = X(b.b), y2 = Y(b.b);
      var dx = x2 - x1, dy = y2 - y1, L = Math.sqrt(dx * dx + dy * dy) || 1;
      var ox = -dy / L * 3.2, oy = dx / L * 3.2;
      // shorten towards labels
      var s = 13 / L;
      var ax = x1 + dx * s, ay = y1 + dy * s, bx = x2 - dx * s, by = y2 - dy * s;
      function line(o) { out += '<line x1="' + (ax + ox * o).toFixed(1) + '" y1="' + (ay + oy * o).toFixed(1) + '" x2="' + (bx + ox * o).toFixed(1) + '" y2="' + (by + oy * o).toFixed(1) + '"/>'; }
      if (b.o === 1) line(0);
      else if (b.o === 2) { line(-1); line(1); }
      else { line(0); line(-1.6); line(1.6); }
    });
    mol.atoms.forEach(function (a, i) {
      var txt = label(mol, hs, i);
      var cls = 'iso-x-at el-' + a.el + (chiral[i] ? ' is-chiral' : '') + (arom[i] ? ' is-arom' : '');
      out += '<text class="' + cls + '" x="' + X(i).toFixed(1) + '" y="' + (Y(i) + 4.5).toFixed(1) + '" text-anchor="middle">' + esc(txt) + (chiral[i] ? '<tspan class="iso-x-star" dy="-6">*</tspan>' : '') + '</text>';
    });
    return out + '</svg>';
  }

  /* ── 3D model ────────────────────────────────────────────────────── */
  var CPK = { C: 0x55524c, H: 0xf1eee6, O: 0xd9473a, N: 0x3e6fd6, F: 0x8fcf58, Cl: 0x3fae54, Br: 0x9b3b2e, I: 0x7b3aa0 };
  var RADIUS = { H: 0.22, C: 0.36, N: 0.35, O: 0.34, F: 0.32, Cl: 0.42, Br: 0.46, I: 0.5 };
  function Stage(canvas) {
    this.canvas = canvas;
    this.ready = (window.atomurusLoadThree ? window.atomurusLoadThree() : Promise.resolve(window.THREE)).then(function (THREE) {
      if (!THREE) throw new Error('three');
      this.T = THREE;
      this.renderer = new THREE.WebGLRenderer({ canvas: canvas, antialias: true, alpha: true });
      this.renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
      this.scene = new THREE.Scene();
      this.camera = new THREE.PerspectiveCamera(40, 1, 0.1, 100);
      this.camera.position.set(0, 0, 9);
      this.scene.add(new THREE.AmbientLight(0xffffff, 0.62));
      var d1 = new THREE.DirectionalLight(0xffffff, 0.9); d1.position.set(4, 6, 8); this.scene.add(d1);
      var d2 = new THREE.DirectionalLight(0xffffff, 0.35); d2.position.set(-5, -3, -4); this.scene.add(d2);
      this.group = new THREE.Group(); this.scene.add(this.group);
      this.labels = new THREE.Group(); this.scene.add(this.labels);
      this.rx = 0.35; this.ry = 0.6; this.spin = true;
      this.bindDrag();
      var self = this;
      (function loop() {
        if (!self.canvas.isConnected) return;
        requestAnimationFrame(loop);
        if (self.spin && !self.dragging) self.ry += 0.006;
        self.frame();
      })();
      return this;
    }.bind(this));
  }
  Stage.prototype.bindDrag = function () {
    var self = this, lx = 0, ly = 0;
    this.canvas.addEventListener('pointerdown', function (e) { self.dragging = true; lx = e.clientX; ly = e.clientY; self.canvas.setPointerCapture(e.pointerId); });
    this.canvas.addEventListener('pointermove', function (e) {
      if (!self.dragging) return;
      self.ry += (e.clientX - lx) * 0.01; self.rx += (e.clientY - ly) * 0.01;
      lx = e.clientX; ly = e.clientY;
    });
    ['pointerup', 'pointercancel', 'pointerleave'].forEach(function (ev) { self.canvas.addEventListener(ev, function () { self.dragging = false; }); });
  };
  Stage.prototype.resize = function () {
    var w = this.canvas.clientWidth || 400, h = this.canvas.clientHeight || 300;
    if (this._w === w && this._h === h) return;
    this._w = w; this._h = h;
    this.renderer.setSize(w, h, false);
    this.camera.aspect = w / h; this.camera.updateProjectionMatrix();
  };
  Stage.prototype.letter = function (text, color, size) {
    var T = this.T, c = document.createElement('canvas');
    c.width = c.height = 128;
    var ctx = c.getContext('2d');
    ctx.font = '700 ' + (text.length > 1 ? 60 : 72) + 'px Figtree, system-ui, sans-serif';
    ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillStyle = color;
    ctx.fillText(text, 64, 68);
    var sp = new T.Sprite(new T.SpriteMaterial({ map: new T.CanvasTexture(c), transparent: true, depthWrite: false }));
    sp.scale.set(size, size, 1);
    return sp;
  };
  Stage.prototype.tag = function (text) {
    var T = this.T, c = document.createElement('canvas');
    c.width = 128; c.height = 64;
    var ctx = c.getContext('2d');
    ctx.fillStyle = '#1E6A50';
    ctx.beginPath(); if (ctx.roundRect) ctx.roundRect(8, 8, 112, 48, 14); else ctx.rect(8, 8, 112, 48); ctx.fill();
    ctx.font = '700 34px Figtree, system-ui, sans-serif'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillStyle = '#F8F5EC';
    ctx.fillText(text, 64, 34);
    var sp = new T.Sprite(new T.SpriteMaterial({ map: new T.CanvasTexture(c), transparent: true, depthTest: false, depthWrite: false }));
    sp.scale.set(0.7, 0.35, 1); sp.renderOrder = 20;
    return sp;
  };
  Stage.prototype.show = function (model, rs) {
    var T = this.T, g = this.group;
    while (g.children.length) { var o = g.children.pop(); if (o.geometry) o.geometry.dispose(); if (o.material) o.material.dispose(); }
    while (this.labels.children.length) { var l = this.labels.children.pop(); if (l.material) { if (l.material.map) l.material.map.dispose(); l.material.dispose(); } }
    var sphere = new T.SphereGeometry(1, 28, 20);
    var V = model.coords.map(function (p) { return new T.Vector3(p[0], p[1], p[2]); });
    this.atomsMeta = [];
    var self = this;
    model.atoms.forEach(function (a, i) {
      var r = RADIUS[a.el] || 0.36;
      var m = new T.Mesh(sphere, new T.MeshStandardMaterial({ color: CPK[a.el] || 0x888888, roughness: 0.45, metalness: 0.05 }));
      m.scale.set(r, r, r); m.position.copy(V[i]); g.add(m);
      var light = a.el === 'H' || a.el === 'F';
      var sp = self.letter(a.el, light ? '#14120E' : '#F8F5EC', Math.max(0.22, r * 1.15));
      self.labels.add(sp);
      self.atomsMeta.push({ pos: V[i], r: r, sprite: sp, tag: null });
      if (rs && rs[i]) { var tg = self.tag(rs[i]); self.labels.add(tg); self.atomsMeta[i].tag = tg; }
    });
    var cyl = new T.CylinderGeometry(1, 1, 1, 14);
    var bondMat = new T.MeshStandardMaterial({ color: 0x9a958a, roughness: 0.6 });
    model.bonds.forEach(function (b) {
      var a = V[b.a], c = V[b.b];
      var dir = new T.Vector3().subVectors(c, a), len = dir.length();
      var mid = new T.Vector3().addVectors(a, c).multiplyScalar(0.5);
      var q = new T.Quaternion().setFromUnitVectors(new T.Vector3(0, 1, 0), dir.clone().normalize());
      var perp = new T.Vector3(1, 0, 0).applyQuaternion(q).multiplyScalar(0.11);
      var offs = b.o === 1 ? [0] : (b.o === 2 ? [-1, 1] : [-1.6, 0, 1.6]);
      offs.forEach(function (k) {
        var m = new T.Mesh(cyl, bondMat);
        m.scale.set(0.06, len, 0.06);
        m.quaternion.copy(q);
        m.position.copy(mid).addScaledVector(perp, k);
        g.add(m);
      });
    });
    var ext = 1;
    model.coords.forEach(function (p) { ext = Math.max(ext, Math.hypot(p[0], p[1], p[2])); });
    this.camera.position.set(0, 0, Math.max(5, ext * 3.3));
  };
  Stage.prototype.frame = function () {
    if (!this.renderer) return;
    this.resize();
    this.group.rotation.set(this.rx, this.ry, 0);
    this.group.updateMatrixWorld(true);
    var cam = this.camera.position, T = this.T, w = new T.Vector3(), dir = new T.Vector3();
    var self = this;
    (this.atomsMeta || []).forEach(function (m) {
      w.copy(m.pos).applyMatrix4(self.group.matrixWorld);
      dir.copy(cam).sub(w).normalize();
      m.sprite.position.copy(w).addScaledVector(dir, m.r * 1.02);
      if (m.tag) { m.tag.position.copy(w).add(new T.Vector3(0, m.r + 0.32, 0)); }
    });
    this.renderer.render(this.scene, this.camera);
  };

  /* ── explorer UI ─────────────────────────────────────────────────── */
  function mount(host, before) {
    if (document.getElementById('iso-explorer')) return;
    var root = document.createElement('section');
    root.className = 'iso-lab iso-x';
    root.id = 'iso-explorer';
    if (before) host.insertBefore(root, before); else host.appendChild(root);
    var state = { tab: 'all', formula: 'C4H10O', struct: 'CH3-CH(OH)-CH2-CH3', filter: 'all', picked: [], result: null, one: null, mirror: false, cis: false };
    var slug = (location.pathname.match(/\/(\w+)(?:\.pt)?(?:\.html)?$/) || [])[1];
    var def = PAGE_DEFAULT[slug];
    if (def && def.formula) state.formula = def.formula;
    if (def && def.struct) { state.struct = def.struct; state.tab = 'one'; }
    var stage = null;

    function render() {
      var c = t();
      root.innerHTML =
        '<header class="iso-x-head"><p class="iso-x-kicker">' + esc(c.kicker) + '</p><h2 class="iso-x-title">' + esc(c.title) + '</h2><p class="iso-x-lede">' + esc(c.lede) + '</p></header>' +
        '<div class="iso-x-tabs" role="tablist">' +
        '<button type="button" role="tab" data-tab="all" aria-selected="' + (state.tab === 'all') + '">' + esc(c.tabAll) + '</button>' +
        '<button type="button" role="tab" data-tab="one" aria-selected="' + (state.tab === 'one') + '">' + esc(c.tabOne) + '</button></div>' +
        (state.tab === 'all' ? renderAll() : renderOne());
      bind();
      if (state.tab === 'one') mountStage();
    }

    function renderAll() {
      var c = t();
      var html = '<form class="iso-x-form" data-form="formula"><label for="iso-x-formula">' + esc(c.formulaLabel) + '</label>' +
        '<div class="iso-x-row"><input id="iso-x-formula" name="f" autocomplete="off" spellcheck="false" value="' + esc(state.formula) + '" placeholder="' + esc(c.formulaPh) + '"><button type="submit">' + esc(c.generate) + '</button></div></form>' +
        '<div class="iso-x-chips"><span>' + esc(c.examples) + '</span>' + FORMULA_EXAMPLES.map(function (f) { return '<button type="button" data-formula="' + f + '">' + subs(f) + '</button>'; }).join('') + '</div>';
      var r = state.result || (state.result = E.enumerate(state.formula));
      if (r.error) return html + '<p class="iso-x-error" role="alert">' + esc(c.err[r.error] || c.err.syntax) + '</p>';
      var list = r.isomers.map(function (m, i) {
        var cl = E.classify(m), st = E.stereo(m);
        return { i: i, mol: m, cls: cl, st: st };
      });
      var stereoN = list.filter(function (x) { return x.st.chiralCenters.length || x.st.cisTrans; }).length;
      var byClass = {};
      list.forEach(function (x) { byClass[x.cls.label] = (byClass[x.cls.label] || 0) + 1; });
      html += '<div class="iso-x-summary"><p><strong>' + subs(E.formulaOf(r.isomers[0])) + '</strong> · ' + esc(c.isomers(r.total)) + (stereoN ? ' · ' + esc(c.plusStereo(stereoN)) : '') + '</p>' +
        (r.capped ? '<p class="iso-x-note">' + esc(c.capped(r.total)) + '</p>' : '') +
        '<div class="iso-x-filter"><button type="button" data-filter="all" class="' + (state.filter === 'all' ? 'is-on' : '') + '">' + esc(c.all) + ' <span>' + list.length + '</span></button>' +
        Object.keys(byClass).map(function (k) { return '<button type="button" data-filter="' + k + '" class="' + (state.filter === k ? 'is-on' : '') + '">' + esc(E.CLASS_NAMES[k][lang()]) + ' <span>' + byClass[k] + '</span></button>'; }).join('') + '</div></div>';
      html += '<div class="iso-x-compare" aria-live="polite">' + compareText(list) + '</div>';
      html += '<div class="iso-x-grid">' + list.filter(function (x) { return state.filter === 'all' || x.cls.label === state.filter; }).map(function (x) {
        var picked = state.picked.indexOf(x.i) >= 0;
        var cond = E.condensed(x.mol);
        var badges = [];
        if (x.st.chiralCenters.length) badges.push('<span class="b-chiral">' + esc(c.chiral) + (x.st.chiralCenters.length > 1 ? ' ×' + x.st.chiralCenters.length : '') + '</span>');
        if (x.st.cisTrans) badges.push('<span class="b-ct">' + esc(c.cisTrans) + '</span>');
        if (x.cls.unstable) badges.push('<span class="b-unst">' + esc(c.unstable) + '</span>');
        return '<article class="iso-x-card' + (picked ? ' is-picked' : '') + '" data-pick="' + x.i + '" tabindex="0" aria-pressed="' + picked + '">' +
          '<div class="iso-x-draw">' + drawSvg(x.mol, { chiral: x.st.chiralCenters }) + '</div>' +
          '<p class="iso-x-cls">' + esc(className(x.cls)) + '</p>' +
          '<p class="iso-x-cond">' + esc(cond || c.cyclic) + '</p>' +
          (badges.length ? '<p class="iso-x-badges">' + badges.join('') + '</p>' : '') +
          '<button type="button" class="iso-x-go" data-analyse="' + x.i + '">' + esc(c.analyseThis) + ' →</button>' +
          '</article>';
      }).join('') + '</div>';
      state.list = list;
      return html;
    }

    function compareText(list) {
      var c = t();
      if (state.picked.length === 0) return '<p class="iso-x-hint">' + esc(c.pick) + '</p>';
      if (state.picked.length === 1) return '<p class="iso-x-hint">' + esc(c.pickOne) + '</p>';
      var A = list[state.picked[0]], B = list[state.picked[1]];
      var type = E.pairType(A.mol, B.mol);
      var why = c.why[type];
      if (typeof why === 'function') {
        if (type === 'funcao') why = why(className(A.cls), className(B.cls));
        else { var d = chainDiff(A.cls.chain, B.cls.chain); why = why(d[0], d[1]); }
      }
      return '<div class="iso-x-verdict"><p class="iso-x-type">' + esc(E.PAIR_NAMES[type][lang()]) + '</p><p>' + esc(why) + '</p>' +
        '<p class="iso-x-pair">' + esc(E.condensed(A.mol) || className(A.cls)) + ' &nbsp;×&nbsp; ' + esc(E.condensed(B.mol) || className(B.cls)) + '</p></div>';
    }

    function renderOne() {
      var c = t();
      var html = '<form class="iso-x-form" data-form="struct"><label for="iso-x-struct">' + esc(c.structLabel) + '</label>' +
        '<div class="iso-x-row"><input id="iso-x-struct" name="s" autocomplete="off" spellcheck="false" value="' + esc(state.struct) + '" placeholder="' + esc(c.structPh) + '"><button type="submit">' + esc(c.analyse) + '</button></div></form>' +
        '<div class="iso-x-chips"><span>' + esc(c.examples) + '</span>' + STRUCT_EXAMPLES.map(function (s) { return '<button type="button" data-struct="' + esc(s) + '">' + esc(s) + '</button>'; }).join('') + '</div>';
      var mol = state.one || E.parseStructure(state.struct);
      if (mol.error) return html + '<p class="iso-x-error" role="alert">' + esc(c.err[mol.error] && mol.error !== 'syntax' ? c.err[mol.error] : c.err.structSyntax) + '</p>';
      state.one = mol;
      var cl = E.classify(mol), st = E.stereo(mol);
      var n = st.chiralCenters.length;
      var optical = n ? c.chiralN(n) + '. ' + c.vantHoff(n, st.stereoisomers, st.opticallyActive, st.meso) : c.noChiral;
      var geo = st.cisTrans ? (st.cisTransBonds.length ? c.geoYes : c.geoRing) : c.geoNo;
      html += '<div class="iso-x-one">' +
        '<div class="iso-x-facts">' +
        '<div class="iso-x-draw is-big">' + drawSvg(mol, { chiral: st.chiralCenters }) + '</div>' +
        '<dl>' +
        '<div><dt>' + esc(c.facts.formula) + '</dt><dd>' + subs(E.formulaOf(mol)) + '</dd></div>' +
        '<div><dt>' + esc(c.facts.func) + '</dt><dd>' + esc(className(cl)) + (cl.unstable ? ' · ' + esc(c.unstable) : '') + '</dd></div>' +
        '<div><dt>' + esc(c.facts.chain) + '</dt><dd>' + esc(chainText(cl.chain)) + '</dd></div>' +
        '<div><dt>' + esc(c.facts.optical) + '</dt><dd>' + esc(optical) + '</dd></div>' +
        '<div><dt>' + esc(c.facts.geometric) + '</dt><dd>' + esc(geo) + '</dd></div>' +
        '<div><dt>' + esc(c.facts.stereo) + '</dt><dd>' + st.stereoisomers + '</dd></div>' +
        (n ? '<div><dt>' + esc(c.facts.config) + '</dt><dd data-rs></dd></div>' : '') +
        '</dl></div>' +
        '<div class="iso-x-3d"><canvas aria-label="3D"></canvas>' +
        '<div class="iso-x-3d-bar">' +
        (n ? '<button type="button" data-act="mirror" aria-pressed="' + state.mirror + '">' + esc(c.mirror) + '</button>' : '') +
        (st.cisTransBonds.length ? '<button type="button" data-act="cis" aria-pressed="' + state.cis + '">' + esc(c.flip) + '</button>' : '') +
        '<button type="button" data-act="spin">' + esc(c.stop) + '</button></div>' +
        '<p class="iso-x-note">' + esc(c.model) + '</p><div class="iso-x-bonds" data-bonds></div></div>' +
        '</div>';
      return html;
    }

    function mountStage() {
      var canvas = root.querySelector('.iso-x-3d canvas');
      if (!canvas || !state.one || state.one.error) return;
      stage = new Stage(canvas);
      var mol = state.one;
      var st = E.stereo(mol);
      var cisAtoms = state.cis && st.cisTransBonds.length ? [st.cisTransBonds[0][0]] : null;
      var model = E.embed3d(mol, { mirror: state.mirror, cis: cisAtoms, seed: 11 });
      var rs = E.assignRS(model, model.coords, st.chiralCenters);
      var rsCell = root.querySelector('[data-rs]');
      if (rsCell) rsCell.textContent = st.chiralCenters.map(function (i, k) { return 'C*' + (st.chiralCenters.length > 1 ? '₁₂₃₄₅₆₇₈₉'[k] : '') + ' = ' + rs[i]; }).join(' · ');
      var bondsCell = root.querySelector('[data-bonds]');
      if (bondsCell) bondsCell.innerHTML = bondSummary(model);
      stage.ready.then(function (s) { s.show(model, rs); }).catch(function () {
        canvas.parentNode.classList.add('is-off');
      });
    }

    function bondSummary(model) {
      var groups = {};
      model.bonds.forEach(function (b) {
        var a = model.atoms[b.a].el, c = model.atoms[b.b].el;
        var key = [a, c].sort(function (x, y) { return (x === 'C' ? -1 : 0) - (y === 'C' ? -1 : 0) || x.localeCompare(y); }).join(['', '–', '=', '≡'][b.o]);
        var p = model.coords[b.a], q = model.coords[b.b];
        var d = Math.hypot(p[0] - q[0], p[1] - q[1], p[2] - q[2]);
        (groups[key] = groups[key] || []).push(d);
      });
      var dec = lang() === 'pt' ? ',' : '.';
      return '<p class="iso-x-bonds-t">' + esc(t().bondsTitle) + '</p><p>' + Object.keys(groups).map(function (k) {
        var arr = groups[k], avg = arr.reduce(function (s, x) { return s + x; }, 0) / arr.length;
        return '<span>' + esc(k) + ' ' + avg.toFixed(2).replace('.', dec) + ' Å</span>';
      }).join('') + '</p>';
    }

    function bind() {
      root.querySelectorAll('[data-tab]').forEach(function (b) {
        b.addEventListener('click', function () { state.tab = b.getAttribute('data-tab'); render(); });
      });
      var ff = root.querySelector('[data-form="formula"]');
      if (ff) ff.addEventListener('submit', function (e) {
        e.preventDefault();
        state.formula = ff.querySelector('input').value.trim();
        state.result = null; state.picked = []; state.filter = 'all';
        render();
      });
      var sf = root.querySelector('[data-form="struct"]');
      if (sf) sf.addEventListener('submit', function (e) {
        e.preventDefault();
        state.struct = sf.querySelector('input').value.trim();
        state.one = null; state.mirror = false; state.cis = false;
        render();
      });
      root.querySelectorAll('[data-formula]').forEach(function (b) {
        b.addEventListener('click', function () { state.formula = b.getAttribute('data-formula'); state.result = null; state.picked = []; state.filter = 'all'; render(); });
      });
      root.querySelectorAll('[data-struct]').forEach(function (b) {
        b.addEventListener('click', function () { state.struct = b.getAttribute('data-struct'); state.one = null; state.mirror = false; state.cis = false; render(); });
      });
      root.querySelectorAll('[data-filter]').forEach(function (b) {
        b.addEventListener('click', function () { state.filter = b.getAttribute('data-filter'); render(); });
      });
      root.querySelectorAll('[data-pick]').forEach(function (card) {
        function toggle() {
          var i = +card.getAttribute('data-pick');
          var at = state.picked.indexOf(i);
          if (at >= 0) state.picked.splice(at, 1);
          else { state.picked.push(i); if (state.picked.length > 2) state.picked.shift(); }
          render();
          var cmp = root.querySelector('.iso-x-compare');
          if (cmp && state.picked.length === 2 && cmp.getBoundingClientRect().top < 0) cmp.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
        }
        card.addEventListener('click', function (e) { if (!e.target.closest('[data-analyse]')) toggle(); });
        card.addEventListener('keydown', function (e) { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); toggle(); } });
      });
      root.querySelectorAll('[data-analyse]').forEach(function (b) {
        b.addEventListener('click', function () {
          var x = state.list[+b.getAttribute('data-analyse')];
          state.one = x.mol;
          state.struct = (E.condensed(x.mol) || '').replace(/[–]/g, '-').replace(/[₀-₉]/g, function (d) { return '0123456789'['₀₁₂₃₄₅₆₇₈₉'.indexOf(d)]; }) || state.struct;
          state.tab = 'one'; state.mirror = false; state.cis = false;
          render();
          root.scrollIntoView({ block: 'start', behavior: 'smooth' });
        });
      });
      root.querySelectorAll('[data-act]').forEach(function (b) {
        b.addEventListener('click', function () {
          var act = b.getAttribute('data-act');
          if (act === 'spin') { if (stage) { stage.spin = !stage.spin; b.textContent = stage.spin ? t().stop : t().spin; } return; }
          if (act === 'mirror') state.mirror = !state.mirror;
          if (act === 'cis') state.cis = !state.cis;
          render();
        });
      });
    }

    render();
    if (window.I18N && typeof window.I18N.onChange === 'function') window.I18N.onChange(function () { render(); });
  }

  function boot() {
    var overview = document.querySelector('.iso-overview');
    if (overview) { mount(overview.parentNode, overview.nextSibling); return; }
    var strip = document.querySelector('.av-substrip');
    if (strip) mount(strip.parentNode, strip.nextSibling);
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot);
  else boot();

  window.AtomurusIsoExplorer = { mount: mount, drawSvg: drawSvg };
})();
