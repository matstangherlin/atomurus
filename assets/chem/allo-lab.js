/* Atomurus — allotropes page: element chips, the list of forms, the notes
   column, the stage caption and the "measured structure" card. The 3D
   runtime (viewer/runtime/allotrope-viewer.js) loads on demand and only
   draws; this script owns the state and the URL (?elem=carbon&form=diamond). */
(function () {
  'use strict';
  var D = window.AtomurusAllotropes;
  if (!D) return;

  var COPY = {
    en: {
      elements: 'Element',
      forms: 'Allotrope',
      structure: 'Structure', looks: 'What it is like', where: 'Where you find it',
      elLink: function (n) { return 'Open the ' + n.toLowerCase() + ' page →'; },
      count: function (n) { return n + ' atoms · drag to rotate'; },
      facts: 'Measured structure',
      bond: 'Bond', angle: 'Angle', cn: 'Neighbours per atom', density: 'Density',
      measured: 'measured', model: 'model', noRef: 'no reference value',
      linear: 'two atoms: no angle',
      amorphous: 'amorphous: no single value',
      torsion: 'Torsion',
      compare: function (n) { return 'Compare the forms of ' + n.toLowerCase(); },
      th: { form: 'Form', bond: 'Bond', angle: 'Angle', cn: 'Neighbours', density: 'Density', conducts: 'Electricity' },
      note: 'Measured values from the sources below. The 3D model is generated from these bond lengths, angles and lattice constants; the “model” figures are measured on the model itself.',
      noteDidactic: 'Red phosphorus is amorphous: it has no measured atomic positions. This model is a teaching model built with a typical P–P bond.',
      sources: 'Sources',
      stageAria: function (n, el) { return '3D model: ' + n + ', allotrope of ' + el.toLowerCase() + '. Drag to rotate.'; }
    },
    pt: {
      elements: 'Elemento',
      forms: 'Alótropo',
      structure: 'Estrutura', looks: 'Como é', where: 'Onde aparece',
      elLink: function (n) { return 'Ver a página do ' + n.toLowerCase() + ' →'; },
      count: function (n) { return n + ' átomos · arraste para girar'; },
      facts: 'Estrutura medida',
      bond: 'Ligação', angle: 'Ângulo', cn: 'Vizinhos por átomo', density: 'Densidade',
      measured: 'medido', model: 'modelo', noRef: 'sem valor de referência',
      linear: 'dois átomos: sem ângulo',
      amorphous: 'amorfo: não há um valor único',
      torsion: 'Torção',
      compare: function (n) { return 'Compare as formas do ' + n.toLowerCase(); },
      th: { form: 'Forma', bond: 'Ligação', angle: 'Ângulo', cn: 'Vizinhos', density: 'Densidade', conducts: 'Eletricidade' },
      note: 'Valores medidos, das fontes abaixo. O modelo 3D é gerado com esses comprimentos de ligação, ângulos e constantes de rede; os números de “modelo” são medidos no próprio modelo.',
      noteDidactic: 'O fósforo vermelho é amorfo: não tem posições atômicas medidas. Este é um modelo didático, montado com uma ligação P–P típica.',
      sources: 'Fontes',
      stageAria: function (n, el) { return 'Modelo 3D: ' + n + ', alótropo do ' + el.toLowerCase() + '. Arraste para girar.'; }
    }
  };

  function lang() { return (document.documentElement.lang || '').toLowerCase().indexOf('pt') === 0 ? 'pt' : 'en'; }
  function T() { return COPY[lang()]; }
  function L(o) { if (o == null) return ''; if (typeof o === 'string') return o; return o[lang()] || o.en || ''; }
  function esc(s) { return String(s == null ? '' : s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;'); }
  function num(n, digits) { return D.fmt(n, lang(), digits); }
  function digitsOf(n) { var s = String(n); var i = s.indexOf('.'); return i < 0 ? 0 : s.length - i - 1; }
  function $(id) { return document.getElementById(id); }

  /* ── state ───────────────────────────────────────────────────────── */
  var state = { el: 'carbon', form: 'graphite' };
  (function fromUrl() {
    var q;
    try { q = new URLSearchParams(location.search); } catch (_) { return; }
    var form = q.get('form') || q.get('allo');
    var el = q.get('elem') || q.get('el');
    if (form && D.FORMS[form]) { state.form = form; state.el = D.FORMS[form].el; }
    else if (el && D.ORDER[el]) { state.el = el; state.form = D.ORDER[el][0]; }
  })();

  function writeUrl() {
    try {
      var q = new URLSearchParams(location.search);
      q.set('elem', state.el);
      q.set('form', state.form);
      history.replaceState(history.state, '', location.pathname + '?' + q.toString() + location.hash);
    } catch (_) {}
  }

  function select(form, fromUser) {
    if (!D.FORMS[form]) return;
    state.form = form;
    state.el = D.FORMS[form].el;
    render();
    if (fromUser) writeUrl();
    if (window.AtomurusAlloViewer) window.AtomurusAlloViewer.show(form);
  }
  function selectElement(el) {
    if (!D.ORDER[el]) return;
    select(el === state.el ? state.form : D.ORDER[el][0], true);
  }

  window.AtomurusAlloLab = {
    select: function (form) { select(form, true); },
    form: function () { return state.form; }
  };

  /* ── renderers ──────────────────────────────────────────────────── */
  function renderChips() {
    var box = $('allo-elems');
    if (!box) return;
    box.setAttribute('aria-label', T().elements);
    box.innerHTML = D.ELEMENTS.map(function (e) {
      var on = e.id === state.el;
      return '<button type="button" class="allo-chip" data-elem="' + e.id + '" aria-pressed="' + on + '">' +
        '<span class="allo-dot" style="background:' + e.css + '" aria-hidden="true"></span>' + esc(L(e.name)) + '</button>';
    }).join('');
  }

  function renderList() {
    var box = $('allo-variants');
    if (!box) return;
    var label = document.querySelector('[data-allo-forms-label]');
    if (label) label.textContent = T().forms;
    box.innerHTML = D.ORDER[state.el].map(function (k) {
      var f = D.FORMS[k], on = k === state.form;
      return '<button type="button" class="pill purple allo-btn' + (on ? ' active' : '') + '" data-allo="' + k + '" aria-pressed="' + on + '">' +
        '<span class="allo-n">' + esc(L(f.name)) + '</span><span class="allo-d">' + esc(L(f.short)) + '</span></button>';
    }).join('');
  }

  function renderSide() {
    var f = D.FORMS[state.form], e = D.element(f.el), t = T();
    var kicker = $('allo-kicker');
    if (kicker) { kicker.removeAttribute('data-i18n'); kicker.textContent = L(e.of); }
    var name = $('model-name');
    if (name) { name.removeAttribute('data-i18n'); name.textContent = L(f.name); }
    var desc = $('model-desc');
    if (desc) { desc.removeAttribute('data-i18n'); desc.textContent = L(f.note); }
    var facts = $('allo-side-facts');
    if (facts) {
      facts.innerHTML =
        '<div><dt>' + esc(t.structure) + '</dt><dd>' + esc(L(f.structure)) + '</dd></div>' +
        '<div><dt>' + esc(t.looks) + '</dt><dd>' + esc(L(f.props)) + '</dd></div>' +
        '<div><dt>' + esc(t.where) + '</dt><dd>' + esc(L(f.use)) + '</dd></div>';
    }
    var link = $('allo-el-link');
    if (link) { link.removeAttribute('data-i18n'); link.href = e.page; link.textContent = t.elLink(L(e.name)); }
  }

  function renderStage() {
    var f = D.FORMS[state.form], e = D.element(f.el), m = D.model(state.form), t = T();
    var label = $('allo-stage-label');
    if (label) { label.removeAttribute('data-i18n'); label.textContent = L(f.label); }
    var count = $('allo-stage-count');
    if (count) count.textContent = t.count(m.analysis.atoms);
    var canvas = $('viewer3d');
    if (canvas) canvas.setAttribute('aria-label', t.stageAria(L(f.name), L(e.name)));
  }

  /* distinct values of a list, rounded */
  function distinct(list, digits) {
    var seen = {};
    list.forEach(function (v) { seen[v.toFixed(digits)] = 1; });
    return Object.keys(seen).map(Number).sort(function (a, b) { return b - a; });
  }

  function pairList(ref) {
    if (!ref) return [];
    return Array.isArray(ref[0]) ? ref : [ref];
  }
  function refLabel(item) { return lang() === 'en' && item[2] ? item[2] : item[0]; }

  function bondValue(f) {
    var list = pairList(f.ref.bond);
    if (!list.length) return null;
    return list.map(function (b) { return num(b[1], digitsOf(b[1])); }).join(' · ') + ' pm';
  }
  function angleValue(f) {
    var list = pairList(f.ref.angle);
    if (!list.length) return null;
    return list.map(function (a) { return num(a[1], digitsOf(a[1])) + '°'; }).join(' · ');
  }
  function densityValue(f) {
    var d = f.ref.density;
    if (!d) return null;
    return (d.approx ? '≈ ' : '') + num(d.v, digitsOf(d.v)) + ' ' + d.unit;
  }
  function cnValue(f) {
    var cn = f.ref.cn;
    return typeof cn === 'number' ? String(cn) : L(cn);
  }
  function extraValue(v, x) {
    if (Array.isArray(v)) return num(v[0], digitsOf(v[0])) + (v[1] === '°C' ? ' °C' : ' ' + v[1]);
    if (typeof v === 'string') return lang() === 'en' && x.vEn ? x.vEn : v;
    return L(v);
  }

  var factsEl = null;
  function mountFacts() {
    if (factsEl || $('allo-facts')) { factsEl = factsEl || $('allo-facts'); return; }
    var viewer = document.querySelector('.content-inner > .viewer') || document.querySelector('.viewer');
    if (!viewer) return;
    factsEl = document.createElement('section');
    factsEl.id = 'allo-facts';
    factsEl.className = 'mol-facts allo-facts';
    factsEl.setAttribute('aria-live', 'polite');
    viewer.parentNode.insertBefore(factsEl, viewer.nextSibling);
  }

  function tile(k, v, sub) {
    return '<div class="mol-tile"><span class="mol-tile-k">' + esc(k) + '</span><span class="mol-tile-v">' + v + '</span>' +
      (sub ? '<span class="mol-tile-s">' + sub + '</span>' : '') + '</div>';
  }

  function renderFacts() {
    mountFacts();
    if (!factsEl) return;
    var f = D.FORMS[state.form], e = D.element(f.el), m = D.model(state.form), a = m.analysis, t = T();

    // bond tile: measured value(s) + the same lengths measured on the model
    var bonds = pairList(f.ref.bond);
    var modelLens = distinct(a.lengths.map(function (x) { return x * 100; }), 1);
    var bondSub;
    if (!bonds.length) bondSub = esc(t.amorphous) + ' · ' + t.model + ' ' + modelLens.map(function (x) { return num(x, 1); }).join(' · ') + ' pm';
    else bondSub = bonds.map(refLabel).map(esc).join(' · ') + ' · ' + t.model + ' ' + modelLens.map(function (x) { return num(x, 1); }).join(' · ') + ' pm';

    var angles = pairList(f.ref.angle);
    var modelAngles = distinct(a.angles, 1).sort(function (x, y) { return x - y; });
    var angleSub = !a.angles.length ? esc(t.linear)
      : (angles.length ? angles.map(refLabel).filter(function (x, i, arr) { return arr.indexOf(x) === i; }).map(esc).join(' · ') + ' · ' : '') +
        t.model + ' ' + modelAngles.slice(0, 3).map(function (x) { return num(x, 1) + '°'; }).join(' · ');

    var dens = f.ref.density;
    var tiles =
      tile(t.bond, '<b>' + esc(bondValue(f) || '—') + '</b>', bondSub) +
      tile(t.angle, '<b>' + esc(angleValue(f) || '—') + '</b>', angleSub) +
      tile(t.cn, '<b>' + esc(cnValue(f)) + '</b>', esc(L(f.ref.hyb))) +
      tile(t.density, '<b>' + esc(densityValue(f) || '—') + '</b>', dens ? esc(L(dens.note) || t.measured) : esc(t.noRef));

    var extras = (f.ref.extra || []).map(function (x) {
      return '<div><dt>' + esc(L(x.k)) + '</dt><dd>' + esc(extraValue(x.v, x)) + '</dd></div>';
    });
    if (f.ref.torsion) {
      var s = m.atoms;
      var modelTorsion = Math.abs(D.torsion(s[0], s[1], s[2], s[3]));
      extras.unshift('<div><dt>' + esc(t.torsion) + ' S–S–S–S</dt><dd>' + num(f.ref.torsion, 1) + '° <span class="allo-muted">· ' + t.model + ' ' + num(modelTorsion, 1) + '°</span></dd></div>');
    }

    var rows = D.ORDER[f.el].map(function (k) {
      var g = D.FORMS[k], on = k === state.form;
      return '<tr' + (on ? ' class="is-on" aria-current="true"' : '') + '>' +
        '<td><button type="button" class="allo-row-btn" data-allo="' + k + '">' + esc(L(g.name)) + '</button></td>' +
        '<td>' + esc(bondValue(g) || '—') + '</td>' +
        '<td>' + esc(angleValue(g) || '—') + '</td>' +
        '<td>' + esc(cnValue(g)) + '</td>' +
        '<td>' + esc(densityValue(g) || '—') + '</td>' +
        '<td>' + esc(L(g.conducts)) + '</td></tr>';
    }).join('');

    var srcs = f.src.map(function (k) { return '<li>' + esc(L(D.SOURCES[k])) + '</li>'; }).join('');

    factsEl.innerHTML =
      '<div class="mol-facts-head"><h2>' + esc(t.facts) + ' · ' + esc(L(f.name)) + '</h2></div>' +
      '<div class="mol-facts-tiles">' + tiles + '</div>' +
      (extras.length ? '<dl class="allo-extra">' + extras.join('') + '</dl>' : '') +
      '<div class="mol-facts-t allo-compare"><h3>' + esc(t.compare(L(e.name))) + '</h3>' +
      '<div class="mol-scroll"><table><thead><tr><th>' + t.th.form + '</th><th>' + t.th.bond + '</th><th>' + t.th.angle + '</th><th>' + t.th.cn + '</th><th>' + t.th.density + '</th><th>' + t.th.conducts + '</th></tr></thead>' +
      '<tbody>' + rows + '</tbody></table></div></div>' +
      '<p class="mol-facts-note">' + esc(f.didactic ? t.noteDidactic : t.note) + '</p>' +
      '<div class="allo-sources"><span>' + esc(t.sources) + '</span><ul>' + srcs + '</ul></div>';
  }

  function render() {
    renderChips();
    renderList();
    renderSide();
    renderStage();
    renderFacts();
  }

  /* ── wiring ─────────────────────────────────────────────────────── */
  document.addEventListener('click', function (e) {
    var chip = e.target.closest && e.target.closest('.allo-chip[data-elem]');
    if (chip) { selectElement(chip.getAttribute('data-elem')); return; }
    var btn = e.target.closest && e.target.closest('[data-allo]');
    if (btn && (btn.closest('#allo-variants') || btn.closest('#allo-facts'))) select(btn.getAttribute('data-allo'), true);
  });
  window.addEventListener('atomurus:alloviewer-ready', function () {
    if (window.AtomurusAlloViewer) window.AtomurusAlloViewer.show(state.form);
  });
  (function wireI18n() {
    if (window.I18N && window.I18N.onChange) window.I18N.onChange(render);
    else setTimeout(wireI18n, 80);
  })();

  function boot() { render(); }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot);
  else boot();
})();
