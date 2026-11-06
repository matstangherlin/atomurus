/* Atomurus — atomic models page: which element is on stage. Element picker
   (all 118, with previous / next), the URL (?el=Na&model=bohr), and the
   per-element lines of the model card: Bohr shells or the subshells of the
   quantum cloud, and the reference note. The 3D runtime listens for
   "atomurus:atom-element" and reports back with "atomurus:atom-state". */
(function () {
  'use strict';
  var AS = window.AtomurusAtom;
  var EL = window.RM_ELEMENTS;   // [z, sym, namePt, nameEn, mass, slug, group, period]
  if (!AS || !EL) return;

  var COPY = {
    en: {
      shells: 'Bohr shells', config: 'Configuration', noElectrons: 'no electrons left (bare nucleus)',
      core: 'inner shells', open: 'd / f being filled', val: 'valence shell',
      ref: function (name, a, z) { return '<b>' + name + '-' + a + ' (Z = ' + z + ').</b> Same atom in every model. Sizes are illustrative.'; },
      option: function (e) { return e[0] + ' · ' + e[1] + ' · ' + e[3]; }
    },
    pt: {
      shells: 'Camadas (Bohr)', config: 'Configuração', noElectrons: 'sem elétrons (só o núcleo)',
      core: 'camadas internas', open: 'd / f em preenchimento', val: 'camada de valência',
      ref: function (name, a, z) { return '<b>' + name + '-' + a + ' (Z = ' + z + ').</b> O mesmo átomo em todos os modelos. Tamanhos ilustrativos.'; },
      option: function (e) { return e[0] + ' · ' + e[1] + ' · ' + e[2]; }
    }
  };
  var SHELL_LETTERS = ['K', 'L', 'M', 'N', 'O', 'P', 'Q'];

  function lang() { return (document.documentElement.lang || '').toLowerCase().indexOf('pt') === 0 ? 'pt' : 'en'; }
  function T() { return COPY[lang()]; }
  function el(z) { return EL[z - 1]; }
  function name(z) { var e = el(z); return e ? e[lang() === 'pt' ? 2 : 3] : ''; }
  function $(id) { return document.getElementById(id); }

  /* ── state ───────────────────────────────────────────────────────── */
  function zFrom(v) {
    if (!v) return 0;
    var s = String(v).trim();
    if (/^\d+$/.test(s)) { var n = +s; return n >= 1 && n <= 118 ? n : 0; }
    var low = s.toLowerCase();
    for (var i = 0; i < EL.length; i++) {
      var e = EL[i];
      if (e[1].toLowerCase() === low || e[5] === low || e[2].toLowerCase() === low || e[3].toLowerCase() === low) return e[0];
    }
    return 0;
  }
  var state = { z: 6, model: null, charge: 0 };
  try {
    var q = new URLSearchParams(location.search);
    state.z = zFrom(q.get('el')) || zFrom(q.get('z')) || 6;
  } catch (_) {}

  function writeUrl() {
    if (document.documentElement.classList.contains('embed-mode')) return;
    try {
      var q = new URLSearchParams(location.search);
      q.set('el', el(state.z)[1]);
      if (state.model) q.set('model', state.model);
      q.delete('z');
      history.replaceState(history.state, '', location.pathname + '?' + q.toString() + location.hash);
    } catch (_) {}
  }

  function select(z) {
    z = Math.max(1, Math.min(118, z | 0));
    if (z === state.z) return;
    state.z = z;
    renderPicker();
    writeUrl();
    try { window.dispatchEvent(new CustomEvent('atomurus:atom-element', { detail: { z: z } })); } catch (_) {}
  }

  window.AtomurusAtomLab = {
    z: function () { return state.z; },
    select: select,
    symbol: function (z) { var e = el(z); return e ? e[1] : ''; }
  };

  /* ── picker ──────────────────────────────────────────────────────── */
  function renderPicker() {
    var sel = $('atom-el');
    if (!sel) return;
    var t = T();
    if (sel.options.length !== 118 || sel.getAttribute('data-lang') !== lang()) {
      sel.innerHTML = EL.map(function (e) { return '<option value="' + e[0] + '">' + t.option(e) + '</option>'; }).join('');
      sel.setAttribute('data-lang', lang());
    }
    sel.value = String(state.z);
    document.querySelectorAll('[data-atom-step]').forEach(function (b) {
      var d = +b.getAttribute('data-atom-step');
      b.disabled = (d < 0 && state.z <= 1) || (d > 0 && state.z >= 118);
    });
  }

  /* ── model card lines ───────────────────────────────────────────── */
  function role(sub, subs) {
    var top = 0;
    subs.forEach(function (x) { if (x.n > top) top = x.n; });
    if (sub.n === top) return 'val';
    if (sub.l >= 2 && sub.e < 2 * (2 * sub.l + 1)) return 'open';
    return 'core';
  }
  function subLabel(s) { return s.n + AS.L_LETTER[s.l] + AS.sup(s.e); }

  function renderCard() {
    var t = T();
    var subs = AS.configuration(state.z, Math.min(state.charge, state.z));
    var box = $('md-shells');
    if (box) {
      if (state.model === 'bohr') {
        var sh = AS.shells(subs);
        box.innerHTML = '<span class="md-shell-k">' + t.shells + '</span>' +
          (sh.length ? sh.map(function (n, i) { return '<span class="md-shell"><b>' + SHELL_LETTERS[i] + '</b> ' + n + '</span>'; }).join('')
                     : '<span class="md-shell">' + t.noElectrons + '</span>');
      } else if (state.model === 'quantum') {
        var groups = { core: [], open: [], val: [] };
        subs.forEach(function (s) { groups[role(s, subs)].push(subLabel(s)); });
        var html = '<span class="md-shell-k">' + t.config + ' <span class="md-conf">' + (subs.length ? AS.notation(subs, true) : '—') + '</span></span>';
        ['core', 'open', 'val'].forEach(function (k) {
          if (groups[k].length) html += '<span class="md-shell"><span class="legend-dot md-dot-' + k + '"></span> ' + groups[k].join(' ') + ' <span class="md-shell-note">· ' + t[k] + '</span></span>';
        });
        if (!subs.length) html += '<span class="md-shell">' + t.noElectrons + '</span>';
        box.innerHTML = html;
      } else {
        box.innerHTML = '';
      }
      box.classList.toggle('on', state.model === 'bohr' || state.model === 'quantum');
    }
    var ref = document.querySelector('.model-detail-ref');
    if (ref) {
      ref.removeAttribute('data-i18n-html');
      ref.innerHTML = t.ref(name(state.z), AS.massNumber(state.z), state.z);
    }
  }

  /* ── wiring ─────────────────────────────────────────────────────── */
  document.addEventListener('change', function (e) {
    if (e.target && e.target.id === 'atom-el') select(+e.target.value);
  });
  document.addEventListener('click', function (e) {
    var b = e.target.closest && e.target.closest('[data-atom-step]');
    if (b) select(state.z + (+b.getAttribute('data-atom-step')));
  });
  window.addEventListener('atomurus:atom-state', function (e) {
    var d = e.detail || {};
    var prev = state.model;
    state.model = d.model || state.model;
    state.charge = d.charge || 0;
    renderCard();
    // keep a shareable URL once the reader switches model (not on first paint)
    if (prev && d.model && d.model !== prev) writeUrl();
  });
  (function wireI18n() {
    if (window.I18N && window.I18N.onChange) window.I18N.onChange(function () { renderPicker(); renderCard(); });
    else setTimeout(wireI18n, 80);
  })();

  function boot() {
    renderPicker();
    // a runtime that started before this script still learns the element
    if (state.z !== 6) {
      try { window.dispatchEvent(new CustomEvent('atomurus:atom-element', { detail: { z: state.z } })); } catch (_) {}
    }
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot);
  else boot();
})();
