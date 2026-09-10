/* ═══════════════════════════════════════════════════════════
   ATOMURUS — Isomerism 3D comparator (shared widget)
   Renders interactive ball-and-stick models of the two isomers
   shown on each isomerism subpage (A/B toggle, drag, zoom).
   Molecule data mirrors /viewer/molecules.html (three.js r128).
   Usage:
     <div class="iso-3d-panel" id="iso-3d" data-mol-a="ethanol" data-mol-b="dimethylether">
       <canvas id="iso-3d-canvas"></canvas>
       ... buttons with [data-3d="a"] / [data-3d="b"]
     </div>
     <script src="../isomerism-3d.js?v=…" defer></script>
   Requires load-three.js (window.atomurusBootViewer).
   ═══════════════════════════════════════════════════════════ */
(function () {
  'use strict';

  function ensureModeStyles() {
    if (document.getElementById('iso-3d-mode-css')) return;
    var s = document.createElement('style');
    s.id = 'iso-3d-mode-css';
    s.textContent =
      '.iso-3d-stage{overflow:hidden;position:relative;width:100%;height:300px;background:#F2EFE7}' +
      '.iso-3d-stage canvas{display:block;width:100%;height:100%;visibility:visible}' +
      '.iso-3d-stage2d{position:absolute!important;top:0!important;right:0!important;bottom:0!important;left:0!important;' +
      'width:100%!important;height:100%!important;max-height:none!important;z-index:2;display:flex!important;' +
      'align-items:center;justify-content:center;padding:12px;box-sizing:border-box;margin:0!important;' +
      'background:#F2EFE7;visibility:hidden;pointer-events:none}' +
      '.iso-3d-stage2d svg{width:auto!important;height:auto!important;max-width:100%!important;max-height:100%!important;display:block}' +
      '.iso-3d-panel.is-2d .iso-3d-stage2d{visibility:visible!important;pointer-events:auto!important}' +
      '.iso-3d-panel.is-2d .iso-3d-stage canvas{pointer-events:none}' +
      '.iso-3d-panel.is-2d .iso-3d-hint{visibility:hidden}' +
      '[data-theme="dark"] .iso-3d-stage,[data-theme="dark"] .iso-3d-stage2d{background:#0E0D0C}' +
      '@media (max-width:640px){.iso-3d-stage{height:240px}}';
    document.head.appendChild(s);
  }

  function pinIsoStage(stage) {
    if (!stage) return;
    stage.style.position = 'relative';
    stage.style.overflow = 'hidden';
  }

  function pinIsoOverlay(el) {
    if (!el) return;
    el.style.position = 'absolute';
    el.style.top = '0';
    el.style.right = '0';
    el.style.bottom = '0';
    el.style.left = '0';
    el.style.width = '100%';
    el.style.height = '100%';
    el.style.maxHeight = 'none';
    el.style.margin = '0';
    el.style.zIndex = '2';
    el.style.display = 'flex';
    el.style.alignItems = 'center';
    el.style.justifyContent = 'center';
    el.style.boxSizing = 'border-box';
    el.style.padding = el.style.padding || '12px';
  }

  function sizeClonedIsoSvg(svg, host) {
    if (!svg || !host) return;
    svg.removeAttribute('width');
    svg.removeAttribute('height');
    var box = host.getBoundingClientRect();
    var maxW = Math.max(40, box.width - 24);
    var maxH = Math.max(40, box.height - 24);
    var vb = svg.viewBox && svg.viewBox.baseVal;
    var aspect = (vb && vb.width > 0 && vb.height > 0) ? (vb.width / vb.height) : (260 / 120);
    var w = maxW;
    var h = w / aspect;
    if (h > maxH) {
      h = maxH;
      w = h * aspect;
    }
    svg.style.width = Math.round(w) + 'px';
    svg.style.height = Math.round(h) + 'px';
    svg.style.maxWidth = '100%';
    svg.style.maxHeight = '100%';
    svg.style.display = 'block';
  }

  var MOL = {
    // C2H6O — functional
    ethanol: { hl: [2,3], atoms: [
      { pos: [-1.2,0,0], r:0.35, color:0x666666 }, { pos: [1.2,0,0], r:0.35, color:0x666666 },
      { pos: [1.7,1.3,0], r:0.30, color:0xee3333 }, { pos: [2.7,1.3,0], r:0.20, color:0xdddddd },
      { pos: [-1.56,1.03,0], r:0.20, color:0xdddddd }, { pos: [-1.56,-0.51,0.89], r:0.20, color:0xdddddd },
      { pos: [-1.56,-0.51,-0.89], r:0.20, color:0xdddddd }, { pos: [1.56,-0.52,0.89], r:0.20, color:0xdddddd },
      { pos: [1.56,-0.52,-0.89], r:0.20, color:0xdddddd } ],
      bonds: [[0,1],[1,2],[2,3],[0,4],[0,5],[0,6],[1,7],[1,8]] },
    dimethylether: { hl: [1], atoms: [
      { pos: [-1.4,0,0], r:0.35, color:0x666666 }, { pos: [0,0,0], r:0.30, color:0xee3333 },
      { pos: [1.4,0,0], r:0.35, color:0x666666 }, { pos: [-2.1,0.90,0], r:0.20, color:0xdddddd },
      { pos: [-2.1,-0.45,0.78], r:0.20, color:0xdddddd }, { pos: [-2.1,-0.45,-0.78], r:0.20, color:0xdddddd },
      { pos: [2.1,0.90,0], r:0.20, color:0xdddddd }, { pos: [2.1,-0.45,0.78], r:0.20, color:0xdddddd },
      { pos: [2.1,-0.45,-0.78], r:0.20, color:0xdddddd } ],
      bonds: [[0,1],[1,2],[0,3],[0,4],[0,5],[2,6],[2,7],[2,8]] },
    // C4H10 — chain
    butane: { hl: [0,3], atoms: [
      { pos: [-2.0,0,0], r:0.35, color:0x666666 }, { pos: [-0.7,0,0], r:0.35, color:0x666666 },
      { pos: [0.7,0,0], r:0.35, color:0x666666 }, { pos: [2.0,0,0], r:0.35, color:0x666666 },
      { pos: [-2.6,0.95,0], r:0.20, color:0xdddddd }, { pos: [-2.6,-0.48,0.82], r:0.20, color:0xdddddd },
      { pos: [-2.6,-0.48,-0.82], r:0.20, color:0xdddddd }, { pos: [-0.7,0.82,0.52], r:0.20, color:0xdddddd },
      { pos: [-0.7,-0.82,-0.52], r:0.20, color:0xdddddd }, { pos: [0.7,0.82,-0.52], r:0.20, color:0xdddddd },
      { pos: [0.7,-0.82,0.52], r:0.20, color:0xdddddd }, { pos: [2.6,0.95,0], r:0.20, color:0xdddddd },
      { pos: [2.6,-0.48,0.82], r:0.20, color:0xdddddd }, { pos: [2.6,-0.48,-0.82], r:0.20, color:0xdddddd } ],
      bonds: [[0,1],[1,2],[2,3],[0,4],[0,5],[0,6],[1,7],[1,8],[2,9],[2,10],[3,11],[3,12],[3,13]] },
    isobutane: { hl: [0], atoms: [
      { pos: [0,0,0], r:0.35, color:0x666666 }, { pos: [-1.3,0,0], r:0.35, color:0x666666 },
      { pos: [0.9,1.1,0], r:0.35, color:0x666666 }, { pos: [0.9,-1.1,0], r:0.35, color:0x666666 },
      { pos: [0,0,1.0], r:0.20, color:0xdddddd }, { pos: [-1.9,0.95,0], r:0.20, color:0xdddddd },
      { pos: [-1.9,-0.48,0.82], r:0.20, color:0xdddddd }, { pos: [-1.9,-0.48,-0.82], r:0.20, color:0xdddddd },
      { pos: [0.4,2.0,0], r:0.20, color:0xdddddd }, { pos: [1.7,1.5,0.55], r:0.20, color:0xdddddd },
      { pos: [1.7,1.5,-0.55], r:0.20, color:0xdddddd }, { pos: [0.4,-2.0,0], r:0.20, color:0xdddddd },
      { pos: [1.7,-1.5,0.55], r:0.20, color:0xdddddd }, { pos: [1.7,-1.5,-0.55], r:0.20, color:0xdddddd } ],
      bonds: [[0,1],[0,2],[0,3],[0,4],[1,5],[1,6],[1,7],[2,8],[2,9],[2,10],[3,11],[3,12],[3,13]] },
    // C4H8 — position
    but1ene: { hl: [0,1], atoms: [
      { pos: [-2.0,0,0], r:0.35, color:0x666666 }, { pos: [-0.8,0,0], r:0.35, color:0x666666 },
      { pos: [0.5,0,0], r:0.35, color:0x666666 }, { pos: [1.8,0,0], r:0.35, color:0x666666 },
      { pos: [-2.7,0.85,0], r:0.20, color:0xdddddd }, { pos: [-2.7,-0.85,0], r:0.20, color:0xdddddd },
      { pos: [-0.8,0.95,0], r:0.20, color:0xdddddd }, { pos: [0.5,0.82,0.52], r:0.20, color:0xdddddd },
      { pos: [0.5,-0.82,-0.52], r:0.20, color:0xdddddd }, { pos: [2.5,0.85,0], r:0.20, color:0xdddddd },
      { pos: [2.5,-0.42,0.74], r:0.20, color:0xdddddd }, { pos: [2.5,-0.42,-0.74], r:0.20, color:0xdddddd } ],
      bonds: [[0,1,2],[1,2],[2,3],[0,4],[0,5],[1,6],[2,7],[2,8],[3,9],[3,10],[3,11]] },
    but2ene: { hl: [1,2], atoms: [
      { pos: [-2.0,0,0], r:0.35, color:0x666666 }, { pos: [-0.7,0,0], r:0.35, color:0x666666 },
      { pos: [0.7,0,0], r:0.35, color:0x666666 }, { pos: [2.0,0,0], r:0.35, color:0x666666 },
      { pos: [-2.6,0.95,0], r:0.20, color:0xdddddd }, { pos: [-2.6,-0.48,0.82], r:0.20, color:0xdddddd },
      { pos: [-2.6,-0.48,-0.82], r:0.20, color:0xdddddd }, { pos: [-0.7,0.95,0], r:0.20, color:0xdddddd },
      { pos: [0.7,-0.95,0], r:0.20, color:0xdddddd }, { pos: [2.6,0.95,0], r:0.20, color:0xdddddd },
      { pos: [2.6,-0.48,0.82], r:0.20, color:0xdddddd }, { pos: [2.6,-0.48,-0.82], r:0.20, color:0xdddddd } ],
      bonds: [[0,1],[1,2,2],[2,3],[0,4],[0,5],[0,6],[1,7],[2,8],[3,9],[3,10],[3,11]] },
    // C4H8 — geometric
    cis2butene: { hl: [0,3], atoms: [
      { pos: [-2.0,0.8,0], r:0.35, color:0x666666 }, { pos: [-0.7,0,0], r:0.35, color:0x666666 },
      { pos: [0.7,0,0], r:0.35, color:0x666666 }, { pos: [2.0,0.8,0], r:0.35, color:0x666666 },
      { pos: [-2.75,1.45,0], r:0.20, color:0xdddddd }, { pos: [-2.60,0.25,0.74], r:0.20, color:0xdddddd },
      { pos: [-2.60,0.25,-0.74], r:0.20, color:0xdddddd }, { pos: [-0.7,-0.95,0], r:0.20, color:0xdddddd },
      { pos: [0.7,-0.95,0], r:0.20, color:0xdddddd }, { pos: [2.75,1.45,0], r:0.20, color:0xdddddd },
      { pos: [2.60,0.25,0.74], r:0.20, color:0xdddddd }, { pos: [2.60,0.25,-0.74], r:0.20, color:0xdddddd } ],
      bonds: [[0,1],[1,2,2],[2,3],[0,4],[0,5],[0,6],[1,7],[2,8],[3,9],[3,10],[3,11]] },
    trans2butene: { hl: [0,3], atoms: [
      { pos: [-2.0,0.8,0], r:0.35, color:0x666666 }, { pos: [-0.7,0,0], r:0.35, color:0x666666 },
      { pos: [0.7,0,0], r:0.35, color:0x666666 }, { pos: [2.0,-0.8,0], r:0.35, color:0x666666 },
      { pos: [-2.75,1.45,0], r:0.20, color:0xdddddd }, { pos: [-2.60,0.25,0.74], r:0.20, color:0xdddddd },
      { pos: [-2.60,0.25,-0.74], r:0.20, color:0xdddddd }, { pos: [-0.7,-0.95,0], r:0.20, color:0xdddddd },
      { pos: [0.7,0.95,0], r:0.20, color:0xdddddd }, { pos: [2.75,-1.45,0], r:0.20, color:0xdddddd },
      { pos: [2.60,-0.25,0.74], r:0.20, color:0xdddddd }, { pos: [2.60,-0.25,-0.74], r:0.20, color:0xdddddd } ],
      bonds: [[0,1],[1,2,2],[2,3],[0,4],[0,5],[0,6],[1,7],[2,8],[3,9],[3,10],[3,11]] },
    // C3H6O — tautomerism (keto + enol)
    acetone: { hl: [1,3], atoms: [
      { pos: [-1.4,0,0], r:0.35, color:0x666666 }, { pos: [0,0,0], r:0.35, color:0x666666 },
      { pos: [1.4,0,0], r:0.35, color:0x666666 }, { pos: [0,1.1,0], r:0.30, color:0xee3333 },
      { pos: [-2.1,0.90,0], r:0.20, color:0xdddddd }, { pos: [-2.1,-0.45,0.78], r:0.20, color:0xdddddd },
      { pos: [-2.1,-0.45,-0.78], r:0.20, color:0xdddddd }, { pos: [2.1,0.90,0], r:0.20, color:0xdddddd },
      { pos: [2.1,-0.45,0.78], r:0.20, color:0xdddddd }, { pos: [2.1,-0.45,-0.78], r:0.20, color:0xdddddd } ],
      bonds: [[0,1],[1,2],[1,3,2],[0,4],[0,5],[0,6],[2,7],[2,8],[2,9]] },
    enol: { hl: [1,2,3,4], atoms: [
      { pos: [-1.4,0,0], r:0.35, color:0x666666 }, { pos: [0,0,0], r:0.35, color:0x666666 },
      { pos: [1.4,0,0], r:0.35, color:0x666666 }, { pos: [1.95,1.15,0], r:0.30, color:0xee3333 },
      { pos: [2.95,1.15,0], r:0.20, color:0xdddddd }, { pos: [-2.1,0.90,0], r:0.20, color:0xdddddd },
      { pos: [-2.1,-0.45,0.78], r:0.20, color:0xdddddd }, { pos: [-2.1,-0.45,-0.78], r:0.20, color:0xdddddd },
      { pos: [0.7,-0.85,0], r:0.20, color:0xdddddd }, { pos: [2.1,-0.45,0.78], r:0.20, color:0xdddddd },
      { pos: [2.1,-0.45,-0.78], r:0.20, color:0xdddddd } ],
      bonds: [[0,1],[1,2,2],[2,3],[3,4],[0,5],[0,6],[0,7],[1,8],[2,9],[2,10]] },
    // C4H10O — metamerism
    methylpropylether: { hl: [1,2], atoms: [
      { pos: [-1.9,0,0], r:0.35, color:0x666666 }, { pos: [0,0,0], r:0.30, color:0xee3333 },
      { pos: [1.1,0,0], r:0.35, color:0x666666 }, { pos: [2.5,0,0], r:0.35, color:0x666666 },
      { pos: [-2.6,0.9,0], r:0.20, color:0xdddddd }, { pos: [-2.6,-0.45,0.78], r:0.20, color:0xdddddd },
      { pos: [-2.6,-0.45,-0.78], r:0.20, color:0xdddddd }, { pos: [0.85,0.85,0], r:0.20, color:0xdddddd },
      { pos: [0.85,-0.85,0], r:0.20, color:0xdddddd }, { pos: [1.6,0.85,0], r:0.20, color:0xdddddd },
      { pos: [1.6,-0.85,0], r:0.20, color:0xdddddd }, { pos: [3.1,0.9,0], r:0.20, color:0xdddddd },
      { pos: [3.1,-0.45,0.78], r:0.20, color:0xdddddd }, { pos: [3.1,-0.45,-0.78], r:0.20, color:0xdddddd } ],
      bonds: [[0,1],[1,2],[2,3],[0,4],[0,5],[0,6],[1,7],[1,8],[2,9],[2,10],[3,11],[3,12],[3,13]] },
    diethylether: { hl: [1], atoms: [
      { pos: [-1.6,0,0], r:0.35, color:0x666666 }, { pos: [0,0,0], r:0.30, color:0xee3333 },
      { pos: [1.6,0,0], r:0.35, color:0x666666 }, { pos: [-3.0,0,0], r:0.35, color:0x666666 },
      { pos: [3.0,0,0], r:0.35, color:0x666666 }, { pos: [-2.3,0.85,0], r:0.20, color:0xdddddd },
      { pos: [-2.3,-0.85,0], r:0.20, color:0xdddddd }, { pos: [-0.85,0.85,0], r:0.20, color:0xdddddd },
      { pos: [-0.85,-0.85,0], r:0.20, color:0xdddddd }, { pos: [0.85,0.85,0], r:0.20, color:0xdddddd },
      { pos: [0.85,-0.85,0], r:0.20, color:0xdddddd }, { pos: [2.3,0.85,0], r:0.20, color:0xdddddd },
      { pos: [2.3,-0.85,0], r:0.20, color:0xdddddd }, { pos: [-3.6,0.9,0], r:0.20, color:0xdddddd },
      { pos: [-3.6,-0.45,0.78], r:0.20, color:0xdddddd }, { pos: [-3.6,-0.45,-0.78], r:0.20, color:0xdddddd },
      { pos: [3.6,0.9,0], r:0.20, color:0xdddddd }, { pos: [3.6,-0.45,0.78], r:0.20, color:0xdddddd },
      { pos: [3.6,-0.45,-0.78], r:0.20, color:0xdddddd } ],
      bonds: [[0,1],[1,2],[0,3],[2,4],[0,5],[0,6],[1,7],[1,8],[1,9],[1,10],[2,11],[2,12],[3,13],[3,14],[3,15],[4,16],[4,17],[4,18]] },
    // CHFClBr — optical (mirrorable)
    chfclbr: { hl: [0], atoms: [
      { pos: [0,0,0], r:0.36, color:0x555555 }, { pos: [1.0,1.0,1.0], r:0.20, color:0xdddddd },
      { pos: [-1.0,-1.0,1.0], r:0.26, color:0xb3ff3a }, { pos: [-1.0,1.0,-1.0], r:0.38, color:0x44dd44 },
      { pos: [1.0,-1.0,-1.0], r:0.46, color:0xa62929 } ],
      bonds: [[0,1],[0,2],[0,3],[0,4]] },
    // H2O — bent, polar
    water: { hl: [0], atoms: [
      { pos: [0,0,0], r:0.30, color:0xee3333 },
      { pos: [0.78,0.62,0], r:0.20, color:0xdddddd },
      { pos: [-0.78,0.62,0], r:0.20, color:0xdddddd } ],
      bonds: [[0,1],[0,2]] },
    // CO2 — linear, non-polar
    carbondioxide: { hl: [1,2], atoms: [
      { pos: [0,0,0], r:0.35, color:0x666666 },
      { pos: [1.25,0,0], r:0.30, color:0xee3333 },
      { pos: [-1.25,0,0], r:0.30, color:0xee3333 } ],
      bonds: [[0,1,2],[0,2,2]] }
  };

  var COLOR_TO_ELEMENT = {
    0xdddddd: 'H', 0xe8e8e8: 'H', 0xee3333: 'O', 0x666666: 'C', 0x555555: 'C',
    0x444444: 'C', 0x333333: 'C', 0x3399ff: 'N', 0x44dd44: 'Cl', 0xb3ff3a: 'F', 0xa62929: 'Br'
  };

  // Element legend entries (deduped, stable order) shown in the panel footer.
  var ELEMENTS = [];
  (function () {
    var seen = {};
    Object.keys(COLOR_TO_ELEMENT).forEach(function (c) {
      var sym = COLOR_TO_ELEMENT[c];
      if (!seen[sym]) { seen[sym] = true; ELEMENTS.push({ symbol: sym, color: parseInt(c, 16) }); }
    });
    var order = { C: 0, H: 1, O: 2, N: 3, F: 4, Cl: 5, Br: 6 };
    ELEMENTS.sort(function (a, b) {
      var oa = order[a.symbol], ob = order[b.symbol];
      if (oa === undefined) oa = 99; if (ob === undefined) ob = 99;
      return oa - ob;
    });
  })();

  // Self-contained molecule metadata used when the hosting page has no
  // .mol-card elements to read from (e.g. the Explore "what is isomerism"
  // article). Keeps the info bar useful in any context.
  var MOL_META = {
    ethanol:           { en: 'Ethanol',              pt: 'Etanol',                formula: 'C₂H₆O', diff: { en: 'hydroxyl —OH (alcohol)', pt: 'hidroxila —OH (álcool)' } },
    dimethylether:     { en: 'Dimethyl ether',       pt: 'Éter dimetílico',       formula: 'C₂H₆O', diff: { en: 'ether —O— oxygen', pt: 'oxigênio do éter —O—' } },
    butane:            { en: 'Butane',               pt: 'Butano',                formula: 'C₄H₁₀', diff: { en: 'straight chain', pt: 'cadeia linear' } },
    isobutane:         { en: 'Isobutane',            pt: 'Isobutano',             formula: 'C₄H₁₀', diff: { en: 'branched at the central C', pt: 'ramificada no C central' } },
    but1ene:           { en: '1-Butene',             pt: '1-Buteno',              formula: 'C₄H₈', diff: { en: 'double bond at C1', pt: 'dupla ligação em C1' } },
    but2ene:           { en: '2-Butene',             pt: '2-Buteno',              formula: 'C₄H₈', diff: { en: 'double bond at C2', pt: 'dupla ligação em C2' } },
    cis2butene:        { en: 'cis-2-Butene',         pt: 'cis-2-Buteno',          formula: 'C₄H₈', diff: { en: 'CH₃ on the same side (cis)', pt: 'CH₃ do mesmo lado (cis)' } },
    trans2butene:      { en: 'trans-2-Butene',       pt: 'trans-2-Buteno',        formula: 'C₄H₈', diff: { en: 'CH₃ on opposite sides (trans)', pt: 'CH₃ em lados opostos (trans)' } },
    acetone:           { en: 'Acetone',              pt: 'Acetona',               formula: 'C₃H₆O', diff: { en: 'carbonyl C=O (keto)', pt: 'carbonila C=O (ceto)' } },
    enol:              { en: 'Enol',                 pt: 'Enol',                  formula: 'C₃H₆O', diff: { en: 'C=C–OH (enol)', pt: 'C=C–OH (enol)' } },
    methylpropylether: { en: 'Methyl propyl ether',  pt: 'Éter metil-propílico',  formula: 'C₄H₁₀O', diff: { en: 'O near the end — asymmetric', pt: 'O perto da ponta — assimétrico' } },
    diethylether:      { en: 'Diethyl ether',        pt: 'Éter dietílico',        formula: 'C₄H₁₀O', diff: { en: 'O centered — symmetric', pt: 'O central — simétrico' } },
    chfclbr:           { en: 'CHFClBr',              pt: 'CHFClBr',               formula: 'CHFClBr', diff: { en: 'chiral carbon (4 different groups)', pt: 'carbono quiral (4 grupos diferentes)' } },
    water:             { en: 'Water',                pt: 'Água',                  formula: 'H₂O', diff: { en: 'polar O–H bonds', pt: 'ligações O–H polares' } },
    carbondioxide:     { en: 'Carbon dioxide',       pt: 'Gás carbônico',         formula: 'CO₂', diff: { en: 'linear O=C=O', pt: 'linear O=C=O' } }
  };
  function currentLang() {
    var hl = (document.documentElement.getAttribute('lang') || 'en').toLowerCase();
    return hl.indexOf('pt') === 0 ? 'pt' : 'en';
  }

  var SUB_DIGITS = { '₀': '0', '₁': '1', '₂': '2', '₃': '3', '₄': '4', '₅': '5', '₆': '6', '₇': '7', '₈': '8', '₉': '9' };
  function normalizeFormula(f) {
    return String(f || '').replace(/[₀-₉]/g, function (c) { return SUB_DIGITS[c] || c; });
  }
  // True only when the whole string is a molecular formula (e.g. C₂H₆O),
  // not a descriptive label like “Bromoclorofluorometano · configuração S”.
  function isFormulaLike(s) {
    return /^([A-Z][a-z]?\d*)+$/.test(normalizeFormula(String(s || '')).trim());
  }

  // ── Isomer Explorer (formula → applicable isomerism types) ──────
  var LAB_TYPE = {
    funcao:     { tab: 'tabFunction',    page: 'constitutional/function.html',   badge: 'C1', a: 'ethanol',           b: 'dimethylether' },
    cadeia:     { tab: 'tabChain',       page: 'constitutional/chain.html',      badge: 'C2', a: 'butane',            b: 'isobutane' },
    posicao:    { tab: 'tabPosition',    page: 'constitutional/position.html',   badge: 'C3', a: 'but1ene',           b: 'but2ene' },
    metameria:  { tab: 'tabMetamerism',  page: 'constitutional/metamerism.html', badge: 'C4', a: 'methylpropylether', b: 'diethylether' },
    tautomeria: { tab: 'tabTautomerism', page: 'constitutional/tautomerism.html',badge: 'C5', a: 'acetone',           b: 'enol' },
    geometrica: { tab: 'tabGeometric',   page: 'spatial/geometric.html',         badge: 'E1', a: 'cis2butene',        b: 'trans2butene' },
    optica:     { tab: 'tabOptical',     page: 'spatial/optical.html',           badge: 'E2', a: 'chfclbr',           b: 'chfclbr' }
  };
  var LAB_FORMULAS = [
    { formula: 'C₂H₆O',  types: ['funcao'] },
    { formula: 'C₄H₁₀',  types: ['cadeia'] },
    { formula: 'C₄H₈',   types: ['posicao', 'geometrica'] },
    { formula: 'C₃H₆O',  types: ['tautomeria'] },
    { formula: 'C₄H₁₀O', types: ['metameria'] },
    { formula: 'CHClFBr', types: ['optica'] }
  ];

  function labPairName(typeKey) {
    var m = LAB_TYPE[typeKey];
    var lang = currentLang();
    var a = MOL_META[m.a], b = MOL_META[m.b];
    return (a ? a[lang] : m.a) + ' ↔ ' + (b ? b[lang] : m.b);
  }

  // Relative link from the current subpage (constitutional/ or spatial/) to
  // another isomerism subpage, e.g. page='constitutional/function.html'.
  function labHref(page) {
    var here = location.pathname;
    var isSpatial = /\/spatial\//.test(here);
    var isConst = /\/constitutional\//.test(here);
    var dir = page.split('/')[0];
    var file = page.slice(dir.length + 1);
    if (dir === 'spatial') {
      if (isSpatial) return file;
      if (isConst) return '../spatial/' + file;
      return page;
    }
    // constitutional
    if (isConst) return file;
    if (isSpatial) return '../constitutional/' + file;
    return page;
  }

  // Builds the explorer inside the page's overview section (constitutional
  // pages) or right after the metadata strip (spatial pages). Idempotent.
  function buildIsomerExplorer() {
    if (document.querySelector('.iso-lab')) return;
    var host = document.querySelector('.iso-overview');
    var after = null;
    if (!host) {
      after = document.querySelector('.av-substrip');
      if (!after) return;
    }
    var lab = document.createElement('section');
    lab.className = 'iso-lab';
    var head = document.createElement('div');
    head.className = 'iso-lab-head';
    head.innerHTML =
      '<span class="iso-3d-badge">LAB</span>' +
      '<div class="iso-lab-head-txt">' +
      '<div class="iso-lab-title">' + t('isomerism.labTitle', 'Isomer explorer') + '</div>' +
      '<div class="iso-lab-desc">' + t('isomerism.labDesc', 'Choose a molecular formula…') + '</div>' +
      '</div>';
    var pick = document.createElement('div');
    pick.className = 'iso-lab-pick';
    pick.innerHTML = '<span class="iso-lab-k">' + t('isomerism.labFormula', 'Formula') + '</span><div class="iso-lab-pills"></div>';
    var pills = pick.querySelector('.iso-lab-pills');
    LAB_FORMULAS.forEach(function (f, i) {
      var b = document.createElement('button');
      b.type = 'button';
      b.className = 'iso-lab-pill' + (i === 0 ? ' active' : '');
      b.textContent = f.formula;
      b.setAttribute('data-formula', f.formula);
      pills.appendChild(b);
    });
    var search = document.createElement('input');
    search.type = 'search';
    search.className = 'iso-lab-search';
    search.placeholder = t('isomerism.labSearch', 'Search types, molecules or formulas…');
    search.setAttribute('aria-label', t('isomerism.labSearch', 'Search types, molecules or formulas…'));
    var result = document.createElement('div');
    result.className = 'iso-lab-result';
    var none = document.createElement('div');
    none.className = 'iso-lab-none';
    none.style.display = 'none';
    lab.appendChild(head);
    lab.appendChild(search);
    lab.appendChild(pick);
    lab.appendChild(result);
    lab.appendChild(none);
    if (host) host.appendChild(lab);
    else after.parentNode.insertBefore(lab, after.nextSibling);
    function buildCard(typeKey) {
      var m = LAB_TYPE[typeKey];
      var card = document.createElement('a');
      card.className = 'iso-lab-card';
      card.href = labHref(m.page);
      card.innerHTML =
        '<span class="iso-lab-badge">' + m.badge + '</span>' +
        '<span class="iso-lab-type">' + t('isomerism.' + m.tab, typeKey) + '</span>' +
        '<span class="iso-lab-pair">' + labPairName(typeKey) + '</span>' +
        '<span class="iso-lab-link">' + t('isomerism.labOpen', 'Open in 3D') + ' →</span>';
      return card;
    }
    function currentPillFormula() {
      var act = pills.querySelector('.iso-lab-pill.active');
      return act ? act.getAttribute('data-formula') : LAB_FORMULAS[0].formula;
    }
    function render(formula) {
      var entry = null;
      for (var i = 0; i < LAB_FORMULAS.length; i++) {
        if (LAB_FORMULAS[i].formula === formula) entry = LAB_FORMULAS[i];
      }
      if (!entry) return;
      none.style.display = 'none';
      result.innerHTML = '';
      var rt = document.createElement('div');
      rt.className = 'iso-lab-result-title';
      rt.innerHTML =
        t('isomerism.labApply', 'Types of isomerism') + ' · <b>' + formula + '</b> — ' +
        entry.types.length + ' ' + (entry.types.length === 1
          ? t('isomerism.labIsomer', 'isomer')
          : t('isomerism.labIsomers', 'isomers'));
      result.appendChild(rt);
      var grid = document.createElement('div');
      grid.className = 'iso-lab-cards';
      entry.types.forEach(function (typeKey) { grid.appendChild(buildCard(typeKey)); });
      result.appendChild(grid);
    }
    function norm(s) {
      return String(s || '').toLowerCase()
        .replace(/[₀-₉]/g, function (c) { return SUB_DIGITS[c] || c; })
        .normalize('NFD').replace(/[\u0300-\u036f]/g, '');
    }
    function renderSearch(q) {
      q = norm(q);
      result.innerHTML = '';
      var hits = [];
      Object.keys(LAB_TYPE).forEach(function (typeKey) {
        var m = LAB_TYPE[typeKey];
        var label = norm(t('isomerism.' + m.tab, typeKey));
        var pair = norm(labPairName(typeKey));
        var a = MOL_META[m.a], b = MOL_META[m.b];
        var hay = label + ' ' + pair + ' ' + norm(a ? a.formula : '') + ' ' + norm(b ? b.formula : '') + ' ' + typeKey;
        if (hay.indexOf(q) !== -1) hits.push(typeKey);
      });
      if (!hits.length) {
        none.style.display = '';
        none.textContent = t('isomerism.labNone', 'No matches for') + ' “' + (search.value || '') + '”';
        return;
      }
      none.style.display = 'none';
      var rt = document.createElement('div');
      rt.className = 'iso-lab-result-title';
      rt.textContent = t('isomerism.labApply', 'Types of isomerism') + ' · ' + hits.length + ' ' +
        (hits.length === 1 ? t('isomerism.labIsomer', 'isomer') : t('isomerism.labIsomers', 'isomers'));
      result.appendChild(rt);
      var grid = document.createElement('div');
      grid.className = 'iso-lab-cards';
      hits.forEach(function (typeKey) { grid.appendChild(buildCard(typeKey)); });
      result.appendChild(grid);
    }
    pills.addEventListener('click', function (e) {
      var btn = e.target;
      if (!btn || !btn.getAttribute || !btn.getAttribute('data-formula')) return;
      pills.querySelectorAll('.iso-lab-pill').forEach(function (p) { p.classList.remove('active'); });
      btn.classList.add('active');
      if (search.value && norm(search.value)) renderSearch(search.value);
      else render(btn.getAttribute('data-formula'));
    });
    search.addEventListener('input', function () {
      if (search.value && norm(search.value)) renderSearch(search.value);
      else render(currentPillFormula());
    });
    render(LAB_FORMULAS[0].formula);
    if (window.I18N && window.I18N.onChange) {
      I18N.onChange(function () {
        search.placeholder = t('isomerism.labSearch', 'Search types, molecules or formulas…');
        search.setAttribute('aria-label', t('isomerism.labSearch', 'Search types, molecules or formulas…'));
        if (search.value && norm(search.value)) renderSearch(search.value);
        else render(currentPillFormula());
      });
    }
  }

  var ATOM_SCALE = 1.4, BOND_R = 0.10, BOND_GAP = -0.04;
  function paperLab() { return window.atomurusPaperLab; }
  function atomScale() { return paperLab() ? 1 : ATOM_SCALE; }
  function bondRadius() { return paperLab() ? 0.075 : BOND_R; }

  function makeSphere(r, color) {
    var lab = window.atomurusPaperLab;
    return new THREE.Mesh(new THREE.SphereGeometry(r, 24, 24),
      lab ? lab.mat(THREE, color) : new THREE.MeshStandardMaterial({ color: color, roughness: 0.35, metalness: 0.15 }));
  }
  function makeBond(p1, p2, r1, r2, color1, color2, order) {
    order = order || 1;
    var group = new THREE.Group();
    var dir = new THREE.Vector3().subVectors(p2, p1);
    var len = dir.length();
    if (len < 0.01) return group;
    var unit = dir.clone().normalize();
    var start = p1.clone().add(unit.clone().multiplyScalar(r1 + BOND_GAP));
    var end = p2.clone().sub(unit.clone().multiplyScalar(r2 + BOND_GAP));
    if (start.distanceTo(end) < 0.05) return group;
    var yAxis = new THREE.Vector3(0, 1, 0);
    var perp = yAxis.clone().sub(unit.clone().multiplyScalar(yAxis.dot(unit)));
    if (perp.lengthSq() < 0.01) {
      var xAxis = new THREE.Vector3(1, 0, 0);
      perp = xAxis.clone().sub(unit.clone().multiplyScalar(xAxis.dot(unit)));
    }
    perp.normalize();
    function addCyl(s, e, color, r) {
      var mid = new THREE.Vector3().addVectors(s, e).multiplyScalar(0.5);
      var labCyl = window.atomurusPaperLab;
      var cyl = new THREE.Mesh(new THREE.CylinderGeometry(r, r, s.distanceTo(e), 12),
        labCyl
          ? labCyl.mat(THREE, color, { roughness: 0.55, metalness: 0.05 })
          : new THREE.MeshStandardMaterial({ color: color, roughness: 0.48, metalness: 0.05 }));
      cyl.position.copy(mid);
      var d = new THREE.Vector3().subVectors(e, s).normalize();
      cyl.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), d);
      group.add(cyl);
    }
    function addPair(s, e, r) {
      var mid = new THREE.Vector3().addVectors(s, e).multiplyScalar(0.5);
      addCyl(s, mid, color1, r); addCyl(mid, e, color2, r);
    }
    var br = bondRadius();
    if (paperLab()) {
      color1 = paperLab().BOND;
      color2 = paperLab().BOND;
    }
    if (order === 2) {
      var off2 = perp.clone().multiplyScalar(br * 1.4), thin2 = br * 0.62;
      addPair(start.clone().add(off2), end.clone().add(off2), thin2);
      addPair(start.clone().sub(off2), end.clone().sub(off2), thin2);
    } else if (order === 3) {
      var off3 = perp.clone().multiplyScalar(br * 1.8), thin3 = br * 0.55;
      addPair(start, end, thin3);
      addPair(start.clone().add(off3), end.clone().add(off3), thin3);
      addPair(start.clone().sub(off3), end.clone().sub(off3), thin3);
    } else if (paperLab()) {
      addCyl(start, end, paperLab().BOND, br);
    } else {
      addPair(start, end, BOND_R);
    }
    return group;
  }
  function makeLabelSprite(text, atomRadius) {
    var c = document.createElement('canvas');
    c.width = 128; c.height = 64;
    var ctx = c.getContext('2d');
    ctx.font = 'bold 56px "Inter Tight", sans-serif';
    ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.lineJoin = 'round'; ctx.strokeStyle = 'rgba(0,0,0,.55)'; ctx.lineWidth = 5;
    ctx.strokeText(text, 64, 32);
    ctx.fillStyle = '#ffffff'; ctx.fillText(text, 64, 32);
    var tex = new THREE.CanvasTexture(c); tex.needsUpdate = true;
    var sp = new THREE.Sprite(new THREE.SpriteMaterial({ map: tex, transparent: true, depthTest: false, depthWrite: false }));
    var r = atomRadius || 0.5, w = Math.max(0.45, r * 1.7);
    sp.scale.set(w, w * 0.5, 1); sp.renderOrder = 999;
    return sp;
  }
  function makeHlRing(r) {
    var geo = new THREE.RingGeometry(r * 0.82, r * 1.2, 40);
    var mat = new THREE.MeshBasicMaterial({ color: 0xffa020, transparent: true, opacity: 0.85, side: THREE.DoubleSide, depthWrite: false });
    var ring = new THREE.Mesh(geo, mat);
    ring.userData.hlRing = true;
    return ring;
  }

  function buildMolecule(key, group, mirror, hlArr) {
    while (group.children.length) group.remove(group.children[0]);
    group.userData.hlRings = [];
    var mol = MOL[key];
    if (!mol) return;
    var sx = mirror ? -1 : 1;
    var hl = {};
    if (hlArr) for (var h = 0; h < hlArr.length; h++) hl[hlArr[h]] = true;
    mol.atoms.forEach(function (a, i) {
      var scale = atomScale();
      var m = makeSphere(a.r * scale, a.color);
      if (hl[i]) {
        var hlCol = paperLab() ? paperLab().atomColor(a.color) : a.color;
        m.material = new THREE.MeshStandardMaterial({ color: hlCol, emissive: 0xffa020, emissiveIntensity: 0.45, roughness: 0.4, metalness: 0.06 });
        var ring = makeHlRing(a.r * scale);
        ring.position.set(a.pos[0] * sx, a.pos[1], a.pos[2]);
        group.add(ring);
        group.userData.hlRings.push(ring);
      }
      m.position.set(a.pos[0] * sx, a.pos[1], a.pos[2]);
      group.add(m);
      var label = COLOR_TO_ELEMENT[a.color] || '';
      if (label && a.r > 0.24 && !paperLab()) {
        var sp = makeLabelSprite(label, a.r * scale);
        sp.position.set(a.pos[0] * sx, a.pos[1] + a.r * scale * 0.85, a.pos[2]);
        group.add(sp);
      }
    });
    mol.bonds.forEach(function (b) {
      var a1 = mol.atoms[b[0]], a2 = mol.atoms[b[1]];
      var order = b[2] || 1;
      var scale = atomScale();
      group.add(makeBond(
        new THREE.Vector3(a1.pos[0] * sx, a1.pos[1], a1.pos[2]),
        new THREE.Vector3(a2.pos[0] * sx, a2.pos[1], a2.pos[2]),
        a1.r * scale, a2.r * scale,
        a1.color, a2.color, order
      ));
    });
  }

  function t(key, fb) {
    if (window.I18N && I18N.t) {
      var v = I18N.t(key);
      if (v && v !== key) return v;
    }
    return fb;
  }

  // Injects the panel footer (atom legend + view controls) and the live
  // molecule info bar, keeping the visual language of the site (mono labels,
  // pill controls, lab badges). Idempotent — safe to call once per panel.
  function buildPanelUI(panel) {
    if (panel.querySelector('.iso-3d-foot')) return;
    var stage = panel.querySelector('.iso-3d-stage');
    if (!stage) return;
    ensureModeStyles();
    pinIsoStage(stage);
    var head = panel.querySelector('.iso-3d-head');
    if (head && !head.querySelector('.iso-3d-badge')) {
      var badge = document.createElement('span');
      badge.className = 'iso-3d-badge';
      badge.textContent = '3D';
      head.insertBefore(badge, head.firstChild);
    }
    // 3D / 2D mode toggle — shown only when the page has 2D structural diagrams.
    var has2D = document.querySelectorAll('.mol-card .mol-svg-wrap svg').length > 0;
    if (head && has2D && !head.querySelector('.iso-3d-mode')) {
      var modeWrap = document.createElement('div');
      modeWrap.className = 'iso-3d-mode';
      modeWrap.setAttribute('role', 'group');
      modeWrap.setAttribute('aria-label', 'View mode');
      modeWrap.innerHTML =
        '<button type="button" class="iso-3d-mode-btn active" data-3d-mode="3d" aria-pressed="true">3D</button>' +
        '<button type="button" class="iso-3d-mode-btn" data-3d-mode="2d" aria-pressed="false">2D</button>';
      head.appendChild(modeWrap);
    }
    var stage2d = panel.querySelector('.iso-3d-stage2d');
    if (has2D && !stage2d) {
      stage2d = document.createElement('div');
      stage2d.className = 'iso-3d-stage2d';
      stage2d.setAttribute('aria-hidden', 'true');
      stage.appendChild(stage2d);
    }
    if (stage2d) pinIsoOverlay(stage2d);
    var meta = document.createElement('div');
    meta.className = 'iso-3d-meta';
    meta.innerHTML = '<span class="iso-3d-meta-tag"></span>' +
      '<span class="iso-3d-meta-name"></span>' +
      '<span class="iso-3d-meta-formula"></span>';
    var diff = document.createElement('div');
    diff.className = 'iso-3d-diff';
    var fact = document.createElement('div');
    fact.className = 'iso-3d-fact';
    var foot = document.createElement('div');
    foot.className = 'iso-3d-foot';
    var legend = document.createElement('div');
    legend.className = 'iso-3d-legend';
    legend.setAttribute('aria-label', t('isomerism.iso3dLegend', 'Atom legend'));
    ELEMENTS.forEach(function (e) {
      var it = document.createElement('span');
      it.className = 'iso-3d-legend-item';
      var col = e.color;
      if (paperLab()) {
        if (e.symbol === 'O') col = paperLab().atomColor(0xee3333);
        else if (e.symbol === 'H') col = paperLab().atomColor(0xdddddd);
        else if (e.symbol === 'C') col = paperLab().atomColor(0x666666);
        else if (e.symbol === 'N') col = paperLab().atomColor(0x3399ff);
        else if (e.symbol === 'Cl') col = paperLab().atomColor(0x44dd44);
        else if (e.symbol === 'F') col = paperLab().atomColor(0xb3ff3a);
        else if (e.symbol === 'Br') col = paperLab().atomColor(0xa62929);
      }
      it.innerHTML = '<i style="background:#' + ('00000' + col.toString(16)).slice(-6) + '"></i>' + e.symbol;
      it.title = e.symbol;
      legend.appendChild(it);
    });
    var autoT = t('isomerism.iso3dAuto', 'auto');
    var resetT = t('isomerism.iso3dReset', 'reset');
    var diffT = t('isomerism.iso3dDiff', 'diff');
    var ctrls = document.createElement('div');
    ctrls.className = 'iso-3d-controls';
    ctrls.innerHTML =
      '<button type="button" class="iso-3d-ctl" data-3d-act="diff" aria-label="' + diffT + '">⟁ ' + diffT + '</button>' +
      '<button type="button" class="iso-3d-ctl active" data-3d-act="auto" aria-label="' + autoT + '">⟳ ' + autoT + '</button>' +
      '<button type="button" class="iso-3d-ctl" data-3d-act="reset" aria-label="' + resetT + '">⤾ ' + resetT + '</button>' +
      '<button type="button" class="iso-3d-ctl" data-3d-act="zin" aria-label="' + t('isomerism.iso3dZoomIn', 'zoom in') + '">+</button>' +
      '<button type="button" class="iso-3d-ctl" data-3d-act="zout" aria-label="' + t('isomerism.iso3dZoomOut', 'zoom out') + '">−</button>';
    foot.appendChild(legend);
    foot.appendChild(ctrls);
    stage.parentNode.insertBefore(meta, stage.nextSibling);
    meta.parentNode.insertBefore(diff, meta.nextSibling);
    diff.parentNode.insertBefore(fact, diff.nextSibling);
    fact.parentNode.insertBefore(foot, fact.nextSibling);
    if (window.I18N && I18N.onChange) {
      I18N.onChange(function () {
        var ld = ctrls.querySelector('[data-3d-act="diff"]');
        var la = ctrls.querySelector('[data-3d-act="auto"]');
        var lr = ctrls.querySelector('[data-3d-act="reset"]');
        var lz = ctrls.querySelector('[data-3d-act="zin"]');
        var lo = ctrls.querySelector('[data-3d-act="zout"]');
        var d2 = t('isomerism.iso3dDiff', 'diff');
        var a2 = t('isomerism.iso3dAuto', 'auto');
        var r2 = t('isomerism.iso3dReset', 'reset');
        if (ld) { ld.textContent = '⟁ ' + d2; ld.setAttribute('aria-label', d2); }
        if (la) { la.textContent = '⟳ ' + a2; la.setAttribute('aria-label', a2); }
        if (lr) { lr.textContent = '⤾ ' + r2; lr.setAttribute('aria-label', r2); }
        if (lz) lz.setAttribute('aria-label', t('isomerism.iso3dZoomIn', 'zoom in'));
        if (lo) lo.setAttribute('aria-label', t('isomerism.iso3dZoomOut', 'zoom out'));
        legend.setAttribute('aria-label', t('isomerism.iso3dLegend', 'Atom legend'));
      });
    }
  }

  // Feeds the info bar + fact line from the page's already-localized mol-cards
  // (or from MOL_META when the page has no mol-cards) and highlights the card
  // matching the displayed isomer.
  function setInfo(which, panel, mirrored) {
    panel = panel || document.querySelector('.iso-3d-panel');
    if (!panel) return;
    var meta = panel.querySelector('.iso-3d-meta');
    if (!meta) return;
    var cards = document.querySelectorAll('.mol-card');
    var idx = which === 'b' ? 1 : 0;
    if (mirrored) idx = idx === 0 ? 1 : 0;
    var card = cards[idx] || null;
    var pick = function (sel) { return card ? (card.querySelector(sel) || null) : null; };
    var tag = pick('.mol-card-tag'), name = pick('.mol-card-name'),
        formula = pick('.mol-card-formula'), fact = pick('.mol-card-fact');
    var molKey = which === 'b' ? (panel.getAttribute('data-mol-b') || '') : (panel.getAttribute('data-mol-a') || '');
    var metaInfo = MOL_META[molKey] || null;
    var tagKey = which === 'b' ? (panel.getAttribute('data-tag-b') || 'isomerism.iso3dB') : (panel.getAttribute('data-tag-a') || 'isomerism.iso3dA');
    var label = t(tagKey, which === 'b' ? 'Isomer B' : 'Isomer A');
    meta.querySelector('.iso-3d-meta-tag').textContent = tag ? tag.textContent : label;
    meta.querySelector('.iso-3d-meta-name').textContent =
      name ? name.textContent : (metaInfo ? metaInfo[currentLang()] : '');
    var formulaText = formula ? formula.textContent : (metaInfo ? metaInfo.formula : '');
    // Some pages (e.g. optical) use the card “formula” field for a descriptive
    // label — fall back to the molecule's real formula for the info bar.
    meta.querySelector('.iso-3d-meta-formula').textContent =
      isFormulaLike(formulaText) ? formulaText : (metaInfo ? metaInfo.formula : formulaText);
    var factEl = panel.querySelector('.iso-3d-fact');
    if (factEl) factEl.textContent = fact ? fact.textContent : '';
    for (var i = 0; i < cards.length; i++) {
      cards[i].classList.toggle('iso-card-focus', i === idx);
    }
  }

  function init(panel) {
    panel = panel || document.querySelector('.iso-3d-panel');
    if (!panel) return;
    var canvas = panel.querySelector('.iso-3d-stage canvas') || panel.querySelector('canvas');
    if (!canvas || typeof THREE === 'undefined') return;

    var diffOn = false;
    buildPanelUI(panel);
    var mode = '3d';
    var stage2d = panel.querySelector('.iso-3d-stage2d');
    var has2D = !!stage2d;

    var molA = panel.getAttribute('data-mol-a') || '';
    var molB = panel.getAttribute('data-mol-b') || '';
    var mirrorable = panel.getAttribute('data-mirror') === 'true';
    var current = 'a', mirrored = false;

    var lab = window.atomurusPaperLab;
    var renderer = (lab && lab.createRenderer)
      ? lab.createRenderer(THREE, canvas)
      : new THREE.WebGLRenderer({ canvas: canvas, antialias: true, alpha: false });
    if (lab) lab.capDpr(renderer);
    else renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.5));
    var camera = new THREE.PerspectiveCamera(lab ? 42 : 50, 2, 0.1, 100);
    camera.position.set(0, 0.35, lab ? 6.4 : 9);
    function resize() {
      var w = canvas.clientWidth || (canvas.parentElement && canvas.parentElement.clientWidth) || 300;
      var h = canvas.clientHeight || (canvas.parentElement && canvas.parentElement.clientHeight) || 200;
      if (w < 2 || h < 2) return;
      renderer.setSize(w, h, false);
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
    }
    resize();
    window.addEventListener('resize', resize);

    var scene = new THREE.Scene();
    var paperGround = null;
    function createGround() {
      if (paperGround) scene.remove(paperGround);
      var gLab = window.atomurusPaperLab;
      paperGround = gLab ? gLab.ground(THREE, gLab.moleculeGroundOpts(MOL[currentKey()])) : null;
      if (paperGround) scene.add(paperGround);
    }
    function updateBg() {
      var bgLab = window.atomurusPaperLab;
      if (bgLab) bgLab.applyClear(renderer);
      else {
        var dark = document.documentElement.getAttribute('data-theme') === 'dark';
        renderer.setClearColor(dark ? 0x0E0D0C : 0xF2EFE7, 1);
      }
      createGround();
    }
    if (lab) lab.lightScene(scene, THREE);
    else {
      scene.add(new THREE.AmbientLight(0xffffff, 0.7));
      var dL1 = new THREE.DirectionalLight(0xffffff, 1.0); dL1.position.set(5, 10, 7); scene.add(dL1);
      var dL2 = new THREE.DirectionalLight(0x88bbff, 0.5); dL2.position.set(-5, -3, -5); scene.add(dL2);
      var dL3 = new THREE.DirectionalLight(0xffeecc, 0.3); dL3.position.set(0, 5, -8); scene.add(dL3);
    }
    updateBg();
    window.addEventListener('atomurus:themechange', updateBg);
    new MutationObserver(updateBg).observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] });
    var group = new THREE.Group();
    group.position.y = lab ? 0 : 0.25;
    scene.add(group);

    var isDragging = false, lastX = 0, lastY = 0, rotX = lab ? 0.35 : 0.25, rotY = lab ? 0.6 : 0.5, autoRotate = true;
    var rotVelX = 0, rotVelY = 0, zoom = 1;

    function currentKey() { return current === 'b' ? molB : molA; }
    function paint() {
      buildMolecule(currentKey(), group, mirrorable && mirrored, diffOn ? (MOL[currentKey()].hl || null) : null);
      var tabs = panel.querySelectorAll('[data-3d]');
      for (var i = 0; i < tabs.length; i++) {
        var tb = tabs[i];
        var isAct;
        if (tb.hasAttribute('data-mirror')) {
          isAct = mirrorable && mirrored;
        } else {
          isAct = tb.getAttribute('data-3d') === current && !(mirrorable && mirrored);
        }
        tb.classList.toggle('active', isAct);
      }
      setInfo(current, panel, mirrorable && mirrored);
      var diffEl = panel.querySelector('.iso-3d-diff');
      if (diffEl) {
        if (diffOn) {
          var mi = MOL_META[currentKey()];
          diffEl.textContent = mi && mi.diff ? mi.diff[currentLang()] : '';
          diffEl.classList.add('show');
        } else {
          diffEl.textContent = '';
          diffEl.classList.remove('show');
        }
      }
      panel.setAttribute('data-iso-diff', diffOn ? 'on' : 'off');
      panel.setAttribute('data-iso-hl', diffOn ? String((group.userData.hlRings || []).length) : '0');
      createGround();
      if (mode === '2d') render2D();
    }
    function render2D() {
      if (!stage2d) return;
      pinIsoOverlay(stage2d);
      var idx = current === 'b' ? 1 : 0;
      if (mirrorable && mirrored) idx = idx === 0 ? 1 : 0;
      var src = document.querySelectorAll('.mol-card .mol-svg-wrap svg')[idx];
      stage2d.innerHTML = '';
      if (!src) return;
      var svg = src.cloneNode(true);
      stage2d.appendChild(svg);
      sizeClonedIsoSvg(svg, stage2d);
    }
    function setMode(m) {
      mode = m === '2d' ? '2d' : '3d';
      var is3d = mode === '3d';
      panel.classList.toggle('is-2d', !is3d);
      pinIsoStage(panel.querySelector('.iso-3d-stage'));
      if (canvas) {
        canvas.style.visibility = 'visible';
        canvas.style.pointerEvents = is3d ? 'auto' : 'none';
      }
      if (stage2d) {
        pinIsoOverlay(stage2d);
        stage2d.style.visibility = is3d ? 'hidden' : 'visible';
        stage2d.style.pointerEvents = is3d ? 'none' : 'auto';
        stage2d.setAttribute('aria-hidden', is3d ? 'true' : 'false');
      }
      var ctrls = panel.querySelector('.iso-3d-controls');
      var diffEl = panel.querySelector('.iso-3d-diff');
      var diffBtn = panel.querySelector('[data-3d-act="diff"]');
      if (ctrls) ctrls.style.display = is3d ? '' : 'none';
      resize();
      if (!is3d) {
        if (diffEl) { diffEl.classList.remove('show'); diffEl.textContent = ''; }
        if (diffBtn) diffBtn.classList.remove('diff-active');
        diffOn = false;
        render2D();
      } else {
        renderer.render(scene, camera);
      }
    }

    function updateTabsLabels() {
      var ta = panel.querySelector('[data-3d="a"]');
      var tb = panel.querySelector('[data-3d="b"]');
      if (ta && window.I18N) {
        var la = ta.getAttribute('data-label-a');
        if (la && I18N.t) ta.textContent = I18N.t(la);
      }
      if (tb && window.I18N) {
        var lb = tb.getAttribute('data-label-b');
        if (lb && I18N.t) tb.textContent = I18N.t(lb);
      }
      var title = panel.querySelector('.iso-3d-title');
      if (title && window.I18N && I18N.t) {
        var tk = panel.getAttribute('data-title-key');
        if (tk) title.textContent = I18N.t(tk);
      }
    }
    updateTabsLabels();
    if (window.I18N && window.I18N.onChange) window.I18N.onChange(updateTabsLabels);

    function tickFrame() {
      if (mode === '2d') return;
      if (autoRotate && !isDragging) {
        rotY += 0.004;
      }
      rotX += rotVelX; rotY += rotVelY;
      rotVelX *= 0.92; rotVelY *= 0.92;
      group.rotation.x = rotX;
      group.rotation.y = rotY;
      group.scale.setScalar(zoom);
      var rings = group.userData.hlRings || [];
      if (rings.length) {
        var tt = Date.now() * 0.004;
        for (var ri = 0; ri < rings.length; ri++) {
          var rs = 1 + 0.3 * Math.sin(tt + ri * 1.1);
          rings[ri].scale.setScalar(rs);
          rings[ri].material.opacity = 0.4 + 0.45 * (0.5 + 0.5 * Math.sin(tt * 1.5 + ri));
        }
      }
      renderer.render(scene, camera);
    }
    if (lab && lab.bindLiveLoop) {
      lab.bindLiveLoop(canvas, tickFrame, {
        busy: function () {
          return isDragging || autoRotate || Math.abs(rotVelX) > 1e-4 || Math.abs(rotVelY) > 1e-4 ||
            (group.userData.hlRings && group.userData.hlRings.length);
        },
        active: function () { return mode !== '2d'; }
      });
    } else {
      (function render() {
        requestAnimationFrame(render);
        tickFrame();
      })();
    }

    // Interaction
    function rect() { return canvas.getBoundingClientRect(); }
    function pointer(e) { return { x: e.clientX - rect().left, y: e.clientY - rect().top }; }
    canvas.addEventListener('pointerdown', function (e) {
      isDragging = true; autoRotate = false;
      lastX = e.clientX; lastY = e.clientY;
      canvas.setPointerCapture(e.pointerId);
    });
    window.addEventListener('pointermove', function (e) {
      if (!isDragging) return;
      var dx = e.clientX - lastX, dy = e.clientY - lastY;
      lastX = e.clientX; lastY = e.clientY;
      rotVelY += dx * 0.006;
      rotVelX += dy * 0.006;
    });
    window.addEventListener('pointerup', function () { isDragging = false; });
    if (lab && lab.bindPageScrollWheel) {
      lab.bindPageScrollWheel(canvas, function (e) {
        zoom = Math.max(0.4, Math.min(2.6, zoom * (e.deltaY > 0 ? 0.92 : 1.08)));
      });
    } else {
      canvas.addEventListener('wheel', function (e) {
        e.preventDefault();
        zoom = Math.max(0.4, Math.min(2.6, zoom * (e.deltaY > 0 ? 0.92 : 1.08)));
      }, { passive: false });
    }
    canvas.addEventListener('dblclick', function () {
      autoRotate = !autoRotate;
    });
    canvas.addEventListener('pointerenter', function () { canvas.style.cursor = 'grab'; });
    canvas.addEventListener('pointerdown', function () { canvas.style.cursor = 'grabbing'; });
    window.addEventListener('pointerup', function () { canvas.style.cursor = 'grab'; });

    // Toggle handlers
    panel.querySelectorAll('[data-3d]').forEach(function (btn) {
      btn.addEventListener('click', function () {
        var which = btn.getAttribute('data-3d');
        if (which === 'b' && mirrorable && btn.hasAttribute('data-mirror')) {
          mirrored = !mirrored;
          current = 'a';
          paint();
          return;
        }
        // Picking a plain isomer tab clears the mirror (returns to R).
        if (mirrorable) mirrored = false;
        current = which === 'b' ? 'b' : 'a';
        paint();
      });
    });

    // View controls: auto-rotate toggle, reset view, zoom in/out.
    var ctrls = panel.querySelector('.iso-3d-controls');
    if (ctrls) {
      ctrls.addEventListener('click', function (e) {
        var btn = e.target;
        if (!btn || !btn.getAttribute || !btn.getAttribute('data-3d-act')) return;
        var act = btn.getAttribute('data-3d-act');
        if (act === 'auto') {
          autoRotate = !autoRotate;
          btn.classList.toggle('active', autoRotate);
        } else if (act === 'reset') {
          rotX = lab ? 0.35 : 0.25; rotY = lab ? 0.6 : 0.5; zoom = 1; autoRotate = true;
          var ab = ctrls.querySelector('[data-3d-act="auto"]');
          if (ab) ab.classList.add('active');
        } else if (act === 'zin') {
          zoom = Math.max(0.4, Math.min(2.6, zoom * 1.15));
        } else if (act === 'zout') {
          zoom = Math.max(0.4, Math.min(2.6, zoom * 0.87));
        } else if (act === 'diff') {
          diffOn = !diffOn;
          btn.classList.toggle('diff-active', diffOn);
          paint();
        }
      });
    }
    // 3D / 2D mode toggle.
    if (has2D) {
      panel.querySelectorAll('[data-3d-mode]').forEach(function (btn) {
        btn.addEventListener('click', function () {
          panel.querySelectorAll('[data-3d-mode]').forEach(function (b) {
            var on = b === btn;
            b.classList.toggle('active', on);
            b.setAttribute('aria-pressed', on ? 'true' : 'false');
          });
          setMode(btn.getAttribute('data-3d-mode'));
        });
      });
    }

    paint();
    window.dispatchEvent(new CustomEvent('atomurus:iso3d-ready'));
  }

  function isExplorePage() {
    return /\/explore\//.test(location.pathname || '');
  }

  function loadedAsProRuntime() {
    return Boolean(document.querySelector('script[data-atomurus-runtime="isomerism-3d.js"]'));
  }

  var PAPER_LAB_SRC = '/viewer/runtime/paper-lab.js?v=202609101530';
  function loadPaperLab() {
    if (window.atomurusPaperLab) return Promise.resolve();
    if (window.__atomurusPaperLabPending) return window.__atomurusPaperLabPending;
    window.__atomurusPaperLabPending = new Promise(function (resolve) {
      var existing = document.querySelector('script[data-atomurus-dep="paper-lab"]');
      if (existing) {
        existing.addEventListener('load', function () { resolve(); });
        existing.addEventListener('error', function () { resolve(); });
        return;
      }
      var s = document.createElement('script');
      s.src = PAPER_LAB_SRC;
      s.async = true;
      s.dataset.atomurusDep = 'paper-lab';
      s.onload = function () { resolve(); };
      s.onerror = function () { resolve(); };
      document.head.appendChild(s);
    });
    return window.__atomurusPaperLabPending;
  }

  function ensureAndInit() {
    // Explore stays public. Viewer pages loaded through the allowlisted
    // runtime already passed atomurusBootLabViewer — do not re-gate here,
    // because lab-tool-gate may overwrite atomurusHasPremiumFeature.
    if (!isExplorePage() && !loadedAsProRuntime()) {
      if (typeof window.atomurusHasPremiumFeature === 'function') {
        if (!window.atomurusHasPremiumFeature('isomerismViewer')) return;
      } else {
        return;
      }
    }
    if (window.__iso3dStarted) return;
    window.__iso3dStarted = true;
    var panels = document.querySelectorAll('.iso-3d-panel');
    function run() {
      for (var i = 0; i < panels.length; i++) init(panels[i]);
    }
    if (typeof THREE !== 'undefined') { loadPaperLab().then(run); return; }
    var load = window.atomurusLoadThree || function () {
      return new Promise(function (res, rej) {
        var s = document.createElement('script');
        s.src = 'https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.min.js';
        s.async = true;
        s.onload = res; s.onerror = rej;
        document.head.appendChild(s);
      });
    };
    load().then(function () { return loadPaperLab(); }).then(run).catch(function () { window.__iso3dStarted = false; });
  }

  // Collapses the overview's quick-reference table behind its title (toggle).
  function initOverviewToggle() {
    var wrap = document.querySelector('.iso-summary-table-wrap');
    var title = document.querySelector('.iso-summary-title');
    if (!wrap || !title || wrap.getAttribute('data-iso-toggle')) return;
    wrap.setAttribute('data-iso-toggle', '1');
    var table = wrap.querySelector('.iso-summary-table');
    if (!table) return;
    var chevron = document.createElement('span');
    chevron.className = 'iso-summary-chevron';
    chevron.textContent = '▸';
    title.appendChild(chevron);
    title.classList.add('iso-summary-title-toggle');
    title.setAttribute('role', 'button');
    title.setAttribute('tabindex', '0');
    title.setAttribute('aria-expanded', 'false');
    table.classList.add('iso-collapsed');
    function toggle(open) {
      var o = open !== undefined ? open : title.getAttribute('aria-expanded') !== 'true';
      title.setAttribute('aria-expanded', o ? 'true' : 'false');
      chevron.textContent = o ? '▾' : '▸';
      table.classList.toggle('iso-collapsed', !o);
    }
    title.addEventListener('click', function () { toggle(); });
    title.addEventListener('keydown', function (e) {
      if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); toggle(); }
    });
  }

  // The static 2D structural diagrams (.mol-svg-wrap svg) are shown as a
  // “2D” mode inside the 3D panel (see buildPanelUI / setMode); the card
  // diagrams themselves stay static.

  function boot() {
    // Mark real isomerism subpages so the minimalist UI/UX styles can scope.
    if (document.body && (document.querySelector('.iso-overview') || document.querySelector('.sub-tabs') || document.querySelector('.iso-group-toggle'))) {
      document.body.classList.add('iso-page');
    }
    buildIsomerExplorer();
    initOverviewToggle();
    var panels = document.querySelectorAll('.iso-3d-panel');
    if (!panels.length) return;
    if (isExplorePage()) {
      panels.forEach(function (panel) {
        var canvas = panel.querySelector('.iso-3d-stage canvas') || panel.querySelector('canvas');
        if (!canvas) return;
        if (window.atomurusBootViewer) {
          window.atomurusBootViewer(canvas, ensureAndInit);
        }
        panel.addEventListener('pointerdown', ensureAndInit, { once: true });
        panel.addEventListener('wheel', ensureAndInit, { once: true, passive: true });
      });
      if (typeof THREE !== 'undefined') setTimeout(ensureAndInit, 0);
      var tries = 0;
      var iv = setInterval(function () {
        tries++;
        if (window.__iso3dStarted) { clearInterval(iv); return; }
        var near = false;
        panels.forEach(function (p) {
          var r = p.getBoundingClientRect();
          if (r && r.top < (window.innerHeight + 240) && r.bottom > -240) near = true;
        });
        if (near) {
          clearInterval(iv);
          ensureAndInit();
        } else if (tries > 60) {
          clearInterval(iv);
        }
      }, 500);
      return;
    }
    // Viewer pages: Three.js is already loaded by atomurusBootLabViewer
    // (lazy runtime). Init immediately — the HTML stub already waited
    // for viewport, not a Pro gate.
    if (typeof THREE !== 'undefined' || loadedAsProRuntime()) {
      ensureAndInit();
      return;
    }
    panels.forEach(function (panel) {
      var canvas = panel.querySelector('.iso-3d-stage canvas') || panel.querySelector('canvas');
      if (!canvas) return;
      var boot = window.atomurusBootLabViewer || window.atomurusBootProViewer;
      if (boot) {
        boot(canvas, 'isomerismViewer', ensureAndInit);
      }
    });
  }

  boot();
})();
