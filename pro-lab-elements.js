(function () {
  'use strict';

  var DEFAULT_PROPS = ['atomicNumber', 'atomicMass', 'period', 'group', 'category', 'electronegativity'];
  var PROP_LABEL = {
    atomicNumber: 'atomicNo',
    symbol: 'symbol',
    name: 'name',
    latin: 'latin',
    atomicMass: 'atomicMass',
    period: 'period',
    group: 'groupEl',
    category: 'category',
    electronegativity: 'electronegativity',
    state: 'state',
    electronConfig: 'electronConfig',
    shells: 'shells',
    meltingPoint: 'meltingPoint',
    boilingPoint: 'boilingPoint',
    density: 'density',
    atomicRadius: 'atomicRadius',
    ionizationEnergy: 'ionizationEnergy'
  };

  function el(tag, className) {
    var node = document.createElement(tag);
    if (className) node.className = className;
    return node;
  }

  function displayValue(value) {
    if (value == null || value === '') return '—';
    if (Array.isArray(value)) return value.join(' · ');
    return String(value);
  }

  async function mount(node, ctx) {
    var t = ctx.t;
    var esc = ctx.escapeHtml;
    var selected = [];
    var properties = DEFAULT_PROPS.slice();
    var chartProperty = 'atomicMass';
    var compared = null;
    var sessionId = ctx.sessionId || '';

    node.innerHTML =
      '<p class="ws-kicker"><a href="' + esc(ctx.labHref('home')) + '">' + esc(t('proLab')) + '</a></p>' +
      '<h1 class="ws-title">' + esc(t('labElements')) + '</h1>' +
      '<p class="ws-lede">' + esc(t('labElementsLede')) + '</p>';

    var picker = el('div', 'ws-lab-picker');
    var zInput = el('input', 'ws-input');
    zInput.type = 'number';
    zInput.min = '1';
    zInput.max = '118';
    zInput.setAttribute('aria-label', t('atomicNo'));
    zInput.placeholder = '26';
    zInput.id = 'ws-lab-z';
    var add = el('button', 'ws-btn ws-btn-primary');
    add.type = 'button';
    add.id = 'ws-lab-add-element';
    add.textContent = t('addElement');
    var chips = el('div', 'ws-lab-chips');
    picker.appendChild(zInput);
    picker.appendChild(add);
    picker.appendChild(chips);
    node.appendChild(picker);

    var propsBox = el('fieldset', 'ws-lab-props');
    var legend = el('legend');
    legend.textContent = t('customProperties');
    propsBox.appendChild(legend);
    node.appendChild(propsBox);

    var actions = el('div', 'ws-lab-actions');
    var compareBtn = el('button', 'ws-btn ws-btn-primary');
    compareBtn.type = 'button';
    compareBtn.id = 'ws-lab-compare';
    compareBtn.textContent = t('compare');
    var saveBtn = el('button', 'ws-btn ws-btn-secondary');
    saveBtn.type = 'button';
    saveBtn.id = 'ws-lab-save';
    saveBtn.textContent = t('saveSession');
    var toSet = el('button', 'ws-btn');
    toSet.type = 'button';
    toSet.id = 'ws-lab-add-set';
    toSet.textContent = t('addElementsToSet');
    var gen = el('button', 'ws-btn');
    gen.type = 'button';
    gen.id = 'ws-lab-generate';
    gen.textContent = t('generateFlashcards');
    var titleInput = el('input', 'ws-input');
    titleInput.id = 'ws-lab-session-title';
    titleInput.maxLength = 120;
    titleInput.setAttribute('aria-label', t('sessionTitle'));
    titleInput.placeholder = t('sessionTitle');
    actions.appendChild(compareBtn);
    actions.appendChild(titleInput);
    actions.appendChild(saveBtn);
    actions.appendChild(toSet);
    actions.appendChild(gen);
    node.appendChild(actions);

    var live = el('div');
    live.setAttribute('aria-live', 'polite');
    node.appendChild(live);
    var matrix = el('div', 'ws-lab-matrix');
    node.appendChild(matrix);
    var chart = el('div', 'ws-lab-chart');
    node.appendChild(chart);

    var meta = { properties: Object.keys(PROP_LABEL), chartProperties: ['atomicMass', 'electronegativity', 'period', 'group', 'atomicRadius', 'ionizationEnergy', 'density'] };
    try {
      meta = await ctx.api.elementMeta();
    } catch (_err) {}

    (meta.properties || Object.keys(PROP_LABEL)).forEach(function (key) {
      var lab = el('label', 'ws-lab-check');
      var cb = el('input');
      cb.type = 'checkbox';
      cb.value = key;
      cb.checked = properties.indexOf(key) !== -1;
      cb.addEventListener('change', function () {
        properties = Array.prototype.map.call(propsBox.querySelectorAll('input:checked'), function (n) { return n.value; });
      });
      lab.appendChild(cb);
      lab.appendChild(document.createTextNode(' ' + t(PROP_LABEL[key] || key)));
      propsBox.appendChild(lab);
    });

    var chartLabel = el('label', 'ws-lab-field');
    var chartSpan = el('span');
    chartSpan.textContent = t('chartProperty');
    var chartSelect = el('select', 'ws-input');
    (meta.chartProperties || []).forEach(function (key) {
      var o = el('option');
      o.value = key;
      o.textContent = t(PROP_LABEL[key] || key);
      if (key === chartProperty) o.selected = true;
      chartSelect.appendChild(o);
    });
    chartSelect.addEventListener('change', function () { chartProperty = chartSelect.value; });
    chartLabel.appendChild(chartSpan);
    chartLabel.appendChild(chartSelect);
    node.insertBefore(chartLabel, actions);

    function renderChips() {
      chips.textContent = '';
      selected.forEach(function (z, index) {
        var chip = el('button', 'ws-lab-chip');
        chip.type = 'button';
        chip.textContent = String(z);
        chip.setAttribute('aria-label', t('remove') + ' Z=' + z);
        chip.addEventListener('click', function () {
          selected.splice(index, 1);
          renderChips();
        });
        chips.appendChild(chip);
      });
    }

    add.addEventListener('click', function () {
      var z = Number(zInput.value);
      if (!Number.isInteger(z) || z < 1 || z > 118) return;
      if (selected.indexOf(z) !== -1) return;
      if (selected.length >= 4) return;
      selected.push(z);
      zInput.value = '';
      renderChips();
    });

    function renderCompare(data) {
      compared = data;
      matrix.textContent = '';
      var elements = data.elements || [];
      var keys = data.properties || properties;
      var table = el('table', 'ws-lab-table');
      table.setAttribute('role', 'table');
      var thead = el('thead');
      var hr = el('tr');
      var th0 = el('th');
      th0.textContent = t('property');
      hr.appendChild(th0);
      elements.forEach(function (item) {
        var th = el('th');
        th.textContent = item.symbol + ' · ' + item.name;
        hr.appendChild(th);
      });
      thead.appendChild(hr);
      table.appendChild(thead);
      var tbody = el('tbody');
      keys.forEach(function (key) {
        var tr = el('tr');
        var th = el('th');
        th.scope = 'row';
        th.textContent = t(PROP_LABEL[key] || key);
        tr.appendChild(th);
        elements.forEach(function (item) {
          var td = el('td');
          td.textContent = displayValue(item[key] != null ? item[key] : item[key + 'Display']);
          if (key === 'atomicMass') td.textContent = displayValue(item.atomicMassDisplay || item.atomicMass);
          if (key === 'electronegativity') td.textContent = displayValue(item.electronegativityDisplay || item.electronegativity);
          if (key === 'shells') td.textContent = displayValue(item.shells);
          tr.appendChild(td);
        });
        tbody.appendChild(tr);
      });
      table.appendChild(tbody);
      matrix.appendChild(table);

      var stack = el('div', 'ws-lab-stack');
      elements.forEach(function (item) {
        var card = el('article', 'ws-lab-result');
        var h = el('h3');
        h.textContent = item.name + ' (' + item.symbol + ')';
        card.appendChild(h);
        keys.forEach(function (key) {
          var p = el('p');
          var lab = el('strong');
          lab.textContent = t(PROP_LABEL[key] || key) + ' ';
          p.appendChild(lab);
          var val = item[key];
          if (key === 'atomicMass') val = item.atomicMassDisplay || item.atomicMass;
          if (key === 'electronegativity') val = item.electronegativityDisplay || item.electronegativity;
          p.appendChild(document.createTextNode(displayValue(val)));
          card.appendChild(p);
        });
        stack.appendChild(card);
      });
      matrix.appendChild(stack);

      chart.textContent = '';
      if (data.chart && data.chart.bars) {
        var h2 = el('h2', 'ws-h2');
        h2.textContent = t(PROP_LABEL[data.chart.property] || data.chart.property);
        chart.appendChild(h2);
        data.chart.bars.forEach(function (bar) {
          var row = el('div', 'ws-lab-bar-row');
          var lab = el('span', 'ws-lab-bar-lab');
          lab.textContent = bar.symbol;
          var track = el('div', 'ws-lab-bar-track');
          var fill = el('div', 'ws-lab-bar-fill');
          fill.style.width = bar.ratio != null ? Math.round(bar.ratio * 100) + '%' : '0';
          track.appendChild(fill);
          var val = el('span', 'ws-lab-bar-val');
          val.textContent = bar.value == null ? '—' : String(bar.value);
          row.appendChild(lab);
          row.appendChild(track);
          row.appendChild(val);
          chart.appendChild(row);
        });
      }
      live.textContent = elements.map(function (item) { return item.symbol; }).join(', ');
    }

    compareBtn.addEventListener('click', function () {
      if (!selected.length) return;
      ctx.api.compareElements({
        atomicNumbers: selected,
        properties: properties,
        chartProperty: chartProperty,
        lang: (document.documentElement.lang || '').indexOf('pt') === 0 ? 'pt' : 'en'
      }).then(renderCompare).catch(function (err) {
        live.textContent = err.message || t('errGenericBody');
      });
    });

    function currentState() {
      return { atomicNumbers: selected.slice(), properties: properties.slice(), chartProperty: chartProperty };
    }

    saveBtn.addEventListener('click', function () {
      var title = titleInput.value.trim() || t('labElements');
      var body = { sessionType: 'element_compare', title: title, state: currentState() };
      var req = sessionId ? ctx.api.updateSession(Object.assign({ id: sessionId }, body)) : ctx.api.createSession(body);
      req.then(function (data) {
        sessionId = data.session && data.session.id;
        if (ctx.ui && ctx.ui.toast) ctx.ui.toast(t('sessionSaved'));
      }).catch(function (err) {
        if (ctx.ui && ctx.ui.toast) ctx.ui.toast(ctx.t(ctx.logic.uxError(err).bodyKey), 'danger');
      });
    });

    function selectedItems() {
      var elements = (compared && compared.elements) || [];
      return elements.map(function (item) {
        return {
          itemType: 'element',
          itemKey: item.itemKey || item.latin,
          title: item.name,
          href: item.href
        };
      }).filter(function (item) { return item.itemKey; });
    }

    toSet.addEventListener('click', function () {
      var items = selectedItems();
      if (!items.length) return;
      ctx.saveItemsToSet(items, false).catch(function (err) {
        if (ctx.ui && ctx.ui.toast) ctx.ui.toast(ctx.t(ctx.logic.uxError(err).bodyKey), 'danger');
      });
    });

    gen.addEventListener('click', function () {
      var items = selectedItems();
      if (!items.length) return;
      ctx.saveItemsToSet(items, true).catch(function (err) {
        if (ctx.ui && ctx.ui.toast) ctx.ui.toast(ctx.t(ctx.logic.uxError(err).bodyKey), 'danger');
      });
    });

    if (sessionId) {
      try {
        var loaded = await ctx.api.getSession(sessionId);
        var state = (loaded.session && loaded.session.state) || {};
        titleInput.value = loaded.session.title || '';
        selected = Array.isArray(state.atomicNumbers) ? state.atomicNumbers.slice() : [];
        properties = Array.isArray(state.properties) ? state.properties : properties;
        chartProperty = state.chartProperty || chartProperty;
        chartSelect.value = chartProperty;
        renderChips();
        if (selected.length) {
          var data = await ctx.api.compareElements({
            atomicNumbers: selected,
            properties: properties,
            chartProperty: chartProperty,
            lang: (document.documentElement.lang || '').indexOf('pt') === 0 ? 'pt' : 'en'
          });
          renderCompare(data);
        }
      } catch (_err) {}
    }
  }

  window.AtomurusProLabElements = { mount: mount };
})();
