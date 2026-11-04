/* Atomurus remake — home: interactive mini periodic table + quick search.
   Data: assets/remake/elements-lite.js (RM_ELEMENTS, RM_CATS, rmCatOf). */
(function () {
  'use strict';

  var state = { sel: 6, hover: null, cat: null };

  function isPt() {
    return (document.documentElement.lang || '').toLowerCase().indexOf('pt') === 0;
  }
  function t(key, fallback) {
    try {
      if (window.I18N && typeof window.I18N.t === 'function') {
        var v = window.I18N.t(key);
        if (v) return v;
      }
    } catch (e) {}
    return fallback;
  }
  function num(s) {
    s = String(s);
    return isPt() ? s.replace(/\./g, ',') : s;
  }
  function massLabel(m) {
    m = String(m);
    return m.indexOf('.') === -1 ? '[' + m + ']' : num(m);
  }
  function els() { return window.RM_ELEMENTS || []; }
  function byZ(z) { return els()[z - 1]; }
  function nameOf(e) { return isPt() ? e[2] : e[3]; }
  function hrefOf(e) { return '/periodic-table/' + e[5] + '.html'; }
  function catMap() {
    var m = {};
    (window.RM_CATS || []).forEach(function (c) { m[c.id] = c; });
    return m;
  }

  function where(e) {
    var col = e[6];
    var row = e[7];
    if (row >= 9) return t('home.rm.period', isPt() ? 'Período' : 'Period') + ' ' + (row === 9 ? 6 : 7) + ' · ' + t('home.rm.fblock', isPt() ? 'bloco f' : 'f-block');
    return t('home.rm.group', isPt() ? 'Grupo' : 'Group') + ' ' + col + ' · ' + t('home.rm.period', isPt() ? 'Período' : 'Period') + ' ' + row;
  }

  function buildTiles(grid) {
    if (grid.dataset.built === '1') return;
    grid.dataset.built = '1';
    var frag = document.createDocumentFragment();
    els().forEach(function (e) {
      var a = document.createElement('a');
      a.className = 'rm-tile';
      a.href = hrefOf(e);
      a.style.gridColumn = String(e[6]);
      a.style.gridRow = String(e[7]);
      a.dataset.z = String(e[0]);
      a.dataset.cat = window.rmCatOf(e[0]);
      a.innerHTML = '<span class="rm-tile-z">' + e[0] + '</span><span class="rm-tile-sym">' + e[1] + '</span>';
      a.addEventListener('click', function (ev) {
        if (ev.metaKey || ev.ctrlKey || ev.shiftKey || ev.button === 1) return;
        if (state.sel === e[0]) return; // second tap opens the page
        ev.preventDefault();
        state.sel = e[0];
        paint();
      });
      a.addEventListener('mouseenter', function () { state.hover = e[0]; paintSel(); });
      a.addEventListener('mouseleave', function () { if (state.hover === e[0]) { state.hover = null; paintSel(); } });
      a.addEventListener('focus', function () { state.hover = e[0]; paintSel(); });
      a.addEventListener('blur', function () { if (state.hover === e[0]) { state.hover = null; paintSel(); } });
      frag.appendChild(a);
    });
    grid.insertBefore(frag, grid.firstChild);
  }

  function buildCats(host) {
    if (!host || host.dataset.built === '1') return;
    host.dataset.built = '1';
    (window.RM_CATS || []).forEach(function (c) {
      var b = document.createElement('button');
      b.type = 'button';
      b.className = 'rm-chip';
      b.dataset.cat = c.id;
      b.setAttribute('aria-pressed', 'false');
      b.innerHTML = '<span class="rm-chip-dot" style="background:' + c.fill + '" aria-hidden="true"></span><span class="rm-chip-label"></span>';
      b.addEventListener('click', function () {
        state.cat = state.cat === c.id ? null : c.id;
        paint();
      });
      host.appendChild(b);
    });
  }

  function paintSel() {
    var root = document.querySelector('[data-rm-mini]');
    if (!root) return;
    var e = byZ(state.hover || state.sel);
    if (!e) return;
    var cats = catMap();
    var c = cats[window.rmCatOf(e[0])];
    var tile = root.querySelector('[data-sel-tile]');
    if (tile) tile.style.background = c.fill;
    var set = function (sel, text) { var n = root.querySelector(sel); if (n) n.textContent = text; };
    set('[data-sel-z]', String(e[0]));
    set('[data-sel-sym]', e[1]);
    set('[data-sel-mass]', massLabel(e[4]));
    set('[data-sel-cat]', isPt() ? c.pt : c.en);
    set('[data-sel-name]', nameOf(e));
    set('[data-sel-where]', where(e) + ' · ' + t('home.rm.massWord', isPt() ? 'massa atômica' : 'atomic mass') + ' ' + massLabel(e[4]) + ' u');
    var link = root.querySelector('[data-sel-link]');
    if (link) link.href = hrefOf(byZ(state.hover || state.sel));
  }

  function paint() {
    var root = document.querySelector('[data-rm-mini]');
    if (!root) return;
    root.querySelectorAll('.rm-tile').forEach(function (a) {
      var z = Number(a.dataset.z);
      var e = byZ(z);
      var on = z === state.sel;
      a.classList.toggle('is-on', on);
      a.classList.toggle('is-dim', !!state.cat && state.cat !== a.dataset.cat);
      a.setAttribute('aria-current', on ? 'true' : 'false');
      a.setAttribute('aria-label', nameOf(e) + (isPt() ? ', número atômico ' : ', atomic number ') + z);
    });
    var cats = catMap();
    document.querySelectorAll('[data-rm-cats] .rm-chip').forEach(function (b) {
      var c = cats[b.dataset.cat];
      b.setAttribute('aria-pressed', state.cat === c.id ? 'true' : 'false');
      var label = b.querySelector('.rm-chip-label');
      if (label) label.textContent = isPt() ? c.pt : c.en;
    });
    paintSel();
  }

  function localizeNumbers() {
    document.querySelectorAll('[data-rm-num]').forEach(function (n) {
      n.textContent = num(n.getAttribute('data-rm-num'));
    });
  }

  function findElement(q) {
    var s = q.trim().toLowerCase();
    if (!s) return null;
    var list = els();
    if (/^\d{1,3}$/.test(s)) return list[Number(s) - 1] || null;
    for (var i = 0; i < list.length; i++) {
      var e = list[i];
      if (e[1].toLowerCase() === s || e[2].toLowerCase() === s || e[3].toLowerCase() === s || e[5] === s) return e;
    }
    return null;
  }

  function initSearch() {
    var form = document.querySelector('[data-rm-search]');
    if (!form) return;
    var input = form.querySelector('input[name="q"]');
    form.addEventListener('submit', function (ev) {
      var q = (input && input.value) || '';
      if (!q.trim()) { ev.preventDefault(); return; }
      var hit = findElement(q);
      if (hit) {
        ev.preventDefault();
        location.href = hrefOf(hit);
        return;
      }
      if (/^[A-Z][a-z]?\d*([A-Z(][A-Za-z0-9()·.*]*)*$/.test(q.trim()) && /\d|[A-Z].*[A-Z]/.test(q.trim())) {
        ev.preventDefault();
        location.href = '/calculators.html?formula=' + encodeURIComponent(q.trim()) + '#molar';
      }
    });
    window.addEventListener('keydown', function (e) {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k' && input) {
        e.preventDefault();
        input.focus();
        input.select();
      }
    });
  }

  function boot() {
    var grid = document.querySelector('[data-rm-mini]');
    if (grid && window.RM_ELEMENTS) {
      buildTiles(grid);
      buildCats(document.querySelector('[data-rm-cats]'));
      paint();
    }
    localizeNumbers();
    initSearch();
    try {
      if (window.I18N && typeof window.I18N.onChange === 'function') {
        window.I18N.onChange(function () { paint(); localizeNumbers(); });
      }
    } catch (e) {}
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot);
  else boot();
})();
