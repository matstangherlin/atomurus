/* Atomurus remake — periodic table page layout (Claude Design "Tabela periódica").
   Runs after periodic-table.js has built #ptable. Adds, without touching the
   table logic:
     · a "Colour by" segmented control (category, electronegativity, atomic
       mass, state) wired to periodic-table.js setHeatmap();
     · group numbers 1–18 above the columns and period numbers 1–7 at the left;
     · full "Lanthanides" / "Actinides" row labels;
     · the category legend under the table, and the export buttons as a compact
       group at the right of the colour-by row. */
(function () {
  'use strict';

  var table = document.getElementById('ptable');
  var tab = document.getElementById('tab-tabela');
  if (!table || !tab || tab.querySelector('.rm-pt-bar')) return;

  var COPY = {
    en: { colorBy: 'Colour by', category: 'Category', electronegativity: 'Electronegativity', mass: 'Atomic mass', state: 'State', lan: 'Lanthanides', act: 'Actinides', groups: 'Groups', periods: 'Periods', more: 'More properties', noData: 'no value', pred: '≈ predicted', source: 'Source', solid: 'Solid', liquid: 'Liquid', gas: 'Gas', stateNote: 'At 25 °C and 1 atm.' },
    pt: { colorBy: 'Colorir por', category: 'Categoria', electronegativity: 'Eletronegatividade', mass: 'Massa atômica', state: 'Estado', lan: 'Lantanídeos', act: 'Actinídeos', groups: 'Grupos', periods: 'Períodos', more: 'Mais propriedades', noData: 'sem valor', pred: '≈ previsto', source: 'Fonte', solid: 'Sólido', liquid: 'Líquido', gas: 'Gás', stateNote: 'A 25 °C e 1 atm.' }
  };
  var MODES = ['category', 'electronegativity', 'mass', 'state'];
  var MORE = ['covalent', 'ionization', 'affinity', 'density', 'melt', 'boil'];
  var P = window.AtomurusElementProps || null;
  function propLabel(mode) { return P && P.PROPS[mode] ? P.PROPS[mode].label[lang()] : t(mode); }
  function normMode(v) { return v === 'radius' || v === 'atomic_radius' ? 'covalent' : (v === 'en' ? 'electronegativity' : v); }

  function lang() { return (document.documentElement.lang || '').toLowerCase().indexOf('pt') === 0 ? 'pt' : 'en'; }
  function t(key) { return (COPY[lang()] || COPY.en)[key]; }
  function current() {
    var v = 'category';
    try { v = localStorage.getItem('atomurus-heatmap') || 'category'; } catch (e) {}
    v = normMode(v);
    return MODES.indexOf(v) >= 0 || MORE.indexOf(v) >= 0 ? v : 'category';
  }

  /* 0 · softer property palette, in the remake's colours (cream → green for
     numeric scales; muted solid / liquid / gas for state) */
  var SCALE = [[243, 238, 221], [207, 228, 213], [127, 182, 152], [30, 106, 80]];
  function scaleColor(t) {
    t = Math.max(0, Math.min(1, t));
    var seg = Math.min(SCALE.length - 2, Math.floor(t * (SCALE.length - 1)));
    var f = t * (SCALE.length - 1) - seg;
    var a = SCALE[seg], b = SCALE[seg + 1];
    return 'rgb(' + [0, 1, 2].map(function (i) { return Math.round(a[i] + (b[i] - a[i]) * f); }).join(',') + ')';
  }
  try {
    if (typeof HM_STATE_COLORS !== 'undefined') {
      HM_STATE_COLORS.solid = '#B9A27A';
      HM_STATE_COLORS.liquid = '#6F9FC2';
      HM_STATE_COLORS.gas = '#B79BC9';
    }
  } catch (e) {}
  // Raw fields of one element, as the shared data layer stores them.
  function rawData(z) {
    var el = (typeof ELEMENTS !== 'undefined') ? ELEMENTS.find(function (e) { return e.z === z; }) : null;
    if (!el) return null;
    var ex = (typeof getExtra === 'function' ? getExtra(z) : {}) || {};
    var ex2 = (typeof getExtra2 === 'function' ? getExtra2(z) : {}) || {};
    return { en: el.en, mass: el.mass, density: ex2.density, melt: ex.melt, boil: ex.boil,
      ionization: typeof getIonization === 'function' ? getIonization(z) : undefined };
  }
  if (P && typeof window.heatmapPropValue === 'function') {
    var baseValue = window.heatmapPropValue;
    // One reader for every scale: right units (density g/L → g/cm³), Cordero
    // covalent radii, electron affinity.
    window.heatmapPropValue = function (z, prop) {
      var mode = normMode(prop);
      if (!P.PROPS[mode]) return baseValue(z, prop);
      return P.value(mode, z, rawData(z));
    };
  }
  var lastRange = null;
  if (typeof window.applyHeatmap === 'function' && typeof window.heatmapPropValue === 'function') {
    var baseApply = window.applyHeatmap;
    window.applyHeatmap = function (prop) {
      prop = normMode(prop);
      baseApply(prop);
      clearValues();
      if (prop === 'state') { renderScale(prop); return; }
      var cards = table.querySelectorAll('.el[data-z]');
      var vals = [], min = Infinity, max = -Infinity;
      cards.forEach(function (card) {
        var z = +card.getAttribute('data-z');
        var v = window.heatmapPropValue(z, prop);
        vals.push(v);
        // the colour range comes from measured values only
        if (v != null && !(P && P.predicted(prop, z))) { if (v < min) min = v; if (v > max) max = v; }
      });
      lastRange = { prop: prop, min: min, max: max };
      cards.forEach(function (card, i) {
        var v = vals[i], z = +card.getAttribute('data-z');
        if (v == null) { card.classList.add('rm-pt-nodata'); return; }
        var tt = max === min ? 0.5 : (v - min) / (max - min);
        card.style.background = scaleColor(tt);
        card.style.borderColor = 'transparent';
        card.style.color = tt > 0.62 ? '#F8F5EC' : '#14120E';
        if (P && P.PROPS[prop]) {
          var span = document.createElement('span');
          span.className = 'rm-pt-val';
          var pred = P.predicted(prop, z);
          if (pred) card.classList.add('rm-pt-pred');
          var raw = rawData(z);
          span.textContent = prop === 'mass' && raw ? String(raw.mass).replace('.', lang() === 'pt' ? ',' : '.') : P.format(prop, v, lang(), z);
          card.appendChild(span);
        }
      });
      renderScale(prop);
    };
  }
  function clearValues() {
    table.querySelectorAll('.rm-pt-val').forEach(function (n) { n.remove(); });
    table.querySelectorAll('.rm-pt-pred, .rm-pt-nodata').forEach(function (n) { n.classList.remove('rm-pt-pred', 'rm-pt-nodata'); });
  }

  if (typeof window.removeHeatmap === 'function') {
    var baseRemove = window.removeHeatmap;
    window.removeHeatmap = function () { baseRemove.apply(this, arguments); clearValues(); lastRange = null; scaleBox.hidden = true; };
  }

  /* scale legend for property views: range with unit, no-data swatch, source */
  var scaleBox = document.createElement('div');
  scaleBox.className = 'rm-pt-scale';
  scaleBox.hidden = true;
  function esc(x) { return String(x).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); }
  function renderScale(prop) {
    prop = normMode(prop || current());
    if (prop === 'category') { scaleBox.hidden = true; return; }
    scaleBox.hidden = false;
    if (prop === 'state') {
      var st = (typeof HM_STATE_COLORS !== 'undefined') ? HM_STATE_COLORS : {};
      scaleBox.innerHTML = '<div class="rm-pt-scale-row">' + ['solid', 'liquid', 'gas'].map(function (k) {
        return '<span class="rm-pt-state"><i style="background:' + (st[k] || '#ccc') + '"></i>' + esc(t(k)) + '</span>';
      }).join('') + '<span class="rm-pt-state"><i class="is-none"></i>' + esc(t('noData')) + '</span></div>' +
        '<p class="rm-pt-src">' + esc(t('stateNote')) + '</p>';
      return;
    }
    var meta = P && P.PROPS[prop];
    if (!meta || !lastRange || lastRange.prop !== prop || !isFinite(lastRange.min)) { scaleBox.hidden = true; return; }
    var lo = P.format(prop, lastRange.min, lang(), 0), hi = P.format(prop, lastRange.max, lang(), 0);
    var unit = meta.unit ? ' ' + meta.unit : '';
    var grad = 'linear-gradient(90deg,' + [0, 0.33, 0.66, 1].map(function (x) { return scaleColor(x) + ' ' + Math.round(x * 100) + '%'; }).join(',') + ')';
    scaleBox.innerHTML =
      '<div class="rm-pt-scale-row"><b class="rm-pt-scale-name">' + esc(meta.label[lang()]) + (meta.unit ? ' <span>(' + esc(meta.unit) + ')</span>' : '') + '</b>' +
      '<span class="rm-pt-scale-lo">' + esc(lo + unit) + '</span><span class="rm-pt-scale-bar" style="background:' + grad + '"></span><span class="rm-pt-scale-hi">' + esc(hi + unit) + '</span>' +
      '<span class="rm-pt-state"><i class="is-none"></i>' + esc(t('noData')) + '</span>' +
      (['density', 'melt', 'boil', 'electronegativity'].indexOf(prop) >= 0 ? '<span class="rm-pt-state"><i class="is-pred"></i>' + esc(t('pred')) + '</span>' : '') +
      '</div><p class="rm-pt-src"><b>' + esc(t('source')) + ':</b> ' + esc(meta.source[lang()]) + '</p>';
  }

  /* 1 · colour-by bar (+ export buttons on the right) */
  var bar = document.createElement('div');
  bar.className = 'rm-pt-bar';
  bar.innerHTML = '<span class="rm-pt-bar-label"></span><div class="rm-pt-seg" role="radiogroup"></div>';
  var seg = bar.querySelector('.rm-pt-seg');
  MODES.forEach(function (mode) {
    var b = document.createElement('button');
    b.type = 'button';
    b.setAttribute('role', 'radio');
    b.setAttribute('data-color-by', mode);
    b.addEventListener('click', function () {
      if (activeGroup) clearGroup();
      if (typeof window.setHeatmap === 'function') window.setHeatmap(mode);
      else try { localStorage.setItem('atomurus-heatmap', mode); } catch (e) {}
      if (mode === 'category') clearValues();
      sync();
    });
    seg.appendChild(b);
  });
  var more = document.createElement('select');
  more.className = 'rm-pt-more';
  more.addEventListener('change', function () {
    var mode = more.value;
    if (!mode) return;
    if (activeGroup) clearGroup();
    if (typeof window.setHeatmap === 'function') window.setHeatmap(mode);
    else try { localStorage.setItem('atomurus-heatmap', mode); } catch (e) {}
    sync();
  });
  bar.appendChild(more);
  var dl = document.getElementById('dl-bar');
  if (dl) { dl.classList.add('rm-pt-export'); bar.appendChild(dl); }
  tab.insertBefore(bar, tab.firstChild);

  /* 2 · legend under the table, with the design's ten groups. The groups are
     the colour families of the cells (halogens get their own chip), so the
     legend matches what you see. Clicking a chip highlights that group. */
  var GROUPS = [
    { id: 'alkali', color: '#F1D6C6', z: [3, 11, 19, 37, 55, 87], en: 'Alkali metals', pt: 'Metais alcalinos' },
    { id: 'alkaline', color: '#F0E0BC', z: [4, 12, 20, 38, 56, 88], en: 'Alkaline earth', pt: 'Alcalinoterrosos' },
    { id: 'transition', color: '#E4DFD0', z: [21, 22, 23, 24, 25, 26, 27, 28, 29, 30, 39, 40, 41, 42, 43, 44, 45, 46, 47, 48, 72, 73, 74, 75, 76, 77, 78, 79, 80, 104, 105, 106, 107, 108, 109, 110, 111, 112], en: 'Transition metals', pt: 'Metais de transição' },
    { id: 'posttrans', color: '#D9E0E2', z: [13, 31, 49, 50, 81, 82, 83, 84, 113, 114, 115, 116], en: 'Other metals', pt: 'Outros metais' },
    { id: 'metalloid', color: '#E1E6C9', z: [5, 14, 32, 33, 51, 52], en: 'Metalloids', pt: 'Semimetais' },
    { id: 'nonmetal', color: '#CFE4D5', z: [1, 6, 7, 8, 15, 16, 34], en: 'Nonmetals', pt: 'Não metais' },
    { id: 'halogen', color: '#C9E0DC', z: [9, 17, 35, 53, 85, 117], en: 'Halogens', pt: 'Halogênios' },
    { id: 'noble', color: '#E0D7E8', z: [2, 10, 18, 36, 54, 86, 118], en: 'Noble gases', pt: 'Gases nobres' },
    { id: 'lanthanide', color: '#EED5CF', z: range(57, 71), en: 'Lanthanides', pt: 'Lantanídeos' },
    { id: 'actinide', color: '#E6D0C6', z: range(89, 103), en: 'Actinides', pt: 'Actinídeos' }
  ];
  function range(a, b) { var out = []; for (var i = a; i <= b; i++) out.push(i); return out; }
  var wrap = tab.querySelector('.table-wrap-outer');
  var oldLegend = document.getElementById('legend');
  var legend = document.createElement('div');
  legend.className = 'rm-pt-legend';
  legend.setAttribute('role', 'group');
  GROUPS.forEach(function (g) {
    var b = document.createElement('button');
    b.type = 'button';
    b.className = 'legend-item rm-pt-chip';
    b.setAttribute('data-cat', g.id);
    b.setAttribute('aria-pressed', 'false');
    b.innerHTML = '<span class="rm-pt-dot" style="background:' + g.color + '"></span><span class="rm-pt-chip-label"></span>';
    b.addEventListener('click', function () { toggleGroup(g, b); });
    legend.appendChild(b);
  });
  if (oldLegend) oldLegend.remove();
  if (wrap) wrap.parentNode.insertBefore(legend, wrap.nextSibling);
  legend.parentNode && legend.parentNode.insertBefore(scaleBox, legend);

  var activeGroup = null;
  function clearGroup() {
    activeGroup = null;
    table.classList.remove('rm-pt-filtering');
    table.querySelectorAll('.rm-pt-hit').forEach(function (el) { el.classList.remove('rm-pt-hit'); });
    legend.querySelectorAll('.rm-pt-chip').forEach(function (chip) { chip.classList.remove('active-filter'); chip.setAttribute('aria-pressed', 'false'); });
  }
  function toggleGroup(g, btn) {
    activeGroup = activeGroup === g.id ? null : g.id;
    var set = {};
    if (activeGroup) g.z.forEach(function (z) { set[z] = true; });
    table.classList.toggle('rm-pt-filtering', !!activeGroup);
    table.querySelectorAll('.el[data-z]').forEach(function (el) {
      el.classList.toggle('rm-pt-hit', !!activeGroup && !!set[el.getAttribute('data-z')]);
    });
    legend.querySelectorAll('.rm-pt-chip').forEach(function (chip) {
      var on = chip.getAttribute('data-cat') === activeGroup;
      chip.classList.toggle('active-filter', on);
      chip.setAttribute('aria-pressed', on ? 'true' : 'false');
    });
  }
  function labelLegend() {
    legend.setAttribute('aria-label', lang() === 'pt' ? 'Legenda das categorias' : 'Category legend');
    legend.querySelectorAll('.rm-pt-chip').forEach(function (chip, i) {
      chip.querySelector('.rm-pt-chip-label').textContent = GROUPS[i][lang()];
    });
  }

  /* 3 · group / period numbers, measured from the cards themselves */
  var axes = document.createElement('div');
  axes.className = 'rm-pt-axes';
  axes.setAttribute('aria-hidden', 'true');
  if (wrap) { wrap.classList.add('rm-pt-has-axes'); wrap.appendChild(axes); }

  function placeAxes() {
    if (!wrap) return;
    var base = wrap.getBoundingClientRect();
    if (!base.width) return;
    var cols = {}, rows = {};
    table.querySelectorAll('.el:not(.fblock-row)').forEach(function (card) {
      var c = +card.style.gridColumn, r = +card.style.gridRow;
      if (c && !cols[c]) cols[c] = card;
      if (r && r <= 7 && !rows[r]) rows[r] = card;
    });
    var html = '';
    for (var c = 1; c <= 18; c++) {
      if (!cols[c]) continue;
      var a = cols[c].getBoundingClientRect();
      var top = table.getBoundingClientRect().top - base.top;
      html += '<span class="rm-pt-g" style="left:' + (a.left - base.left) + 'px;width:' + a.width + 'px;top:' + (top - 24) + 'px">' + c + '</span>';
    }
    for (var r = 1; r <= 7; r++) {
      if (!rows[r]) continue;
      var b = rows[r].getBoundingClientRect();
      html += '<span class="rm-pt-p" style="top:' + (b.top - base.top) + 'px;height:' + b.height + 'px;left:' + (table.getBoundingClientRect().left - base.left - 30) + 'px">' + r + '</span>';
    }
    axes.innerHTML = html;
  }

  /* 4 · full f-block row labels */
  function labelFblock() {
    var labels = table.querySelectorAll('.f-label');
    if (labels[0]) labels[0].textContent = t('lan');
    if (labels[1]) labels[1].textContent = t('act');
  }

  function sync() {
    var mode = current();
    bar.querySelector('.rm-pt-bar-label').textContent = t('colorBy');
    seg.setAttribute('aria-label', t('colorBy'));
    seg.querySelectorAll('[data-color-by]').forEach(function (b) {
      var on = b.getAttribute('data-color-by') === mode;
      b.textContent = t(b.getAttribute('data-color-by'));
      b.classList.toggle('is-on', on);
      b.setAttribute('aria-checked', on ? 'true' : 'false');
    });
    more.setAttribute('aria-label', t('more'));
    more.innerHTML = '<option value="">' + esc(t('more')) + '</option>' + MORE.map(function (m) {
      return '<option value="' + m + '"' + (m === mode ? ' selected' : '') + '>' + esc(propLabel(m)) + '</option>';
    }).join('');
    more.classList.toggle('is-on', MORE.indexOf(mode) >= 0);
    tab.classList.toggle('rm-pt-heat', mode !== 'category');
    renderScale(mode);
    labelFblock();
    labelLegend();
  }

  sync();
  if (current() !== 'category' && typeof window.applyHeatmap === 'function' && table.querySelector('.el[data-z]')) window.applyHeatmap(current());
  placeAxes();
  var raf = 0;
  function schedule() { cancelAnimationFrame(raf); raf = requestAnimationFrame(placeAxes); }
  if (window.ResizeObserver) new ResizeObserver(schedule).observe(table);
  else window.addEventListener('resize', schedule);
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(schedule);
  if (window.I18N && typeof window.I18N.onChange === 'function') window.I18N.onChange(function () {
    if (current() !== 'category' && typeof window.applyHeatmap === 'function') window.applyHeatmap(current());
    sync(); schedule();
  });
})();
