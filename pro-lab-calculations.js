(function () {
  'use strict';

  function el(tag, className) {
    var node = document.createElement(tag);
    if (className) node.className = className;
    return node;
  }

  function field(labelText, input) {
    var wrap = el('label', 'ws-lab-field');
    var span = el('span');
    span.textContent = labelText;
    wrap.appendChild(span);
    wrap.appendChild(input);
    return wrap;
  }

  function numberInput(name, value, step) {
    var input = el('input', 'ws-input');
    input.type = 'number';
    input.name = name;
    input.step = step || 'any';
    if (value != null) input.value = value;
    return input;
  }

  function textInput(name, value) {
    var input = el('input', 'ws-input');
    input.type = 'text';
    input.name = name;
    if (value != null) input.value = value;
    return input;
  }

  function scenarioRow(kind, t, data) {
    data = data || {};
    var row = el('div', 'ws-lab-scenario');
    var label = textInput('label', data.label || '');
    label.setAttribute('aria-label', t('scenarioName'));
    label.placeholder = t('scenarioName');
    row.appendChild(field(t('scenarioName'), label));
    if (kind === 'molar_mass') {
      var formula = textInput('formula', data.formula || '');
      formula.setAttribute('aria-label', t('formula'));
      formula.placeholder = 'H2SO4';
      row.appendChild(field(t('formula'), formula));
    } else if (kind === 'dilution') {
      ['C1', 'V1', 'C2', 'V2'].forEach(function (key) {
        row.appendChild(field(key, numberInput(key, data[key], 'any')));
      });
      var solve = el('select', 'ws-input');
      solve.name = 'solve';
      ['C1', 'V1', 'C2', 'V2'].forEach(function (opt) {
        var o = el('option');
        o.value = opt;
        o.textContent = opt;
        if ((data.solve || 'V2') === opt) o.selected = true;
        solve.appendChild(o);
      });
      row.appendChild(field(t('solveFor'), solve));
    } else if (kind === 'ideal_gas') {
      ['P', 'V', 'n', 'T'].forEach(function (key) {
        row.appendChild(field(key, numberInput(key, data[key], 'any')));
      });
      var igSolve = el('select', 'ws-input');
      igSolve.name = 'solve';
      ['P', 'V', 'n', 'T'].forEach(function (opt) {
        var o = el('option');
        o.value = opt;
        o.textContent = opt;
        if ((data.solve || 'V') === opt) o.selected = true;
        igSolve.appendChild(o);
      });
      row.appendChild(field(t('solveFor'), igSolve));
    } else {
      var mode = el('select', 'ws-input');
      mode.name = 'mode';
      [['pH', 'pH'], ['pOH', 'pOH'], ['H', '[H+]'], ['OH', '[OH-]']].forEach(function (pair) {
        var o = el('option');
        o.value = pair[0];
        o.textContent = pair[1];
        if ((data.mode || 'pH') === pair[0]) o.selected = true;
        mode.appendChild(o);
      });
      row.appendChild(field(t('mode'), mode));
      row.appendChild(field('pH', numberInput('pH', data.pH, 'any')));
      row.appendChild(field('pOH', numberInput('pOH', data.pOH, 'any')));
      row.appendChild(field('[H+]', numberInput('H', data.H, 'any')));
      row.appendChild(field('[OH-]', numberInput('OH', data.OH, 'any')));
    }
    var remove = el('button', 'ws-btn ws-btn-sm');
    remove.type = 'button';
    remove.textContent = t('remove');
    remove.addEventListener('click', function () {
      if (row.parentNode && row.parentNode.children.length > 1) row.parentNode.removeChild(row);
    });
    row.appendChild(remove);
    return row;
  }

  function readScenarios(list, kind) {
    return Array.prototype.map.call(list.children, function (row) {
      var get = function (name) {
        var input = row.querySelector('[name="' + name + '"]');
        return input ? input.value : '';
      };
      if (kind === 'molar_mass') return { label: get('label'), formula: get('formula') };
      if (kind === 'dilution') {
        return { label: get('label'), C1: get('C1'), V1: get('V1'), C2: get('C2'), V2: get('V2'), solve: get('solve') || 'V2' };
      }
      if (kind === 'ideal_gas') {
        return { label: get('label'), P: get('P'), V: get('V'), n: get('n'), T: get('T'), solve: get('solve') || 'V', PUnit: 'atm', VUnit: 'L', TUnit: 'K' };
      }
      return { label: get('label'), mode: get('mode') || 'pH', pH: get('pH'), pOH: get('pOH'), H: get('H'), OH: get('OH') };
    });
  }

  function resultCard(ctx, item, kind) {
    var card = el('article', 'ws-lab-result');
    var title = el('h3');
    title.textContent = item.label || ctx.t('scenarioName');
    card.appendChild(title);
    var dl = el('dl', 'ws-lab-dl');
    function add(k, v) {
      if (v == null || v === '') return;
      var dt = el('dt');
      dt.textContent = k;
      var dd = el('dd');
      dd.textContent = v;
      dl.appendChild(dt);
      dl.appendChild(dd);
    }
    if (kind === 'molar_mass') {
      add(ctx.t('formula'), item.formula);
      add(ctx.t('labMolarMass'), (item.molarMassDisplay || item.molarMass) + ' g/mol');
      add(ctx.t('atomCount'), String(item.atomCount));
      (item.composition || []).forEach(function (row) {
        add(row.symbol, row.massPercent + '%');
      });
    } else if (kind === 'dilution') {
      add('C1', item.C1 != null ? String(item.C1) : '');
      add('V1', item.V1 != null ? String(item.V1) : '');
      add('C2', item.C2 != null ? String(item.C2) : '');
      add('V2', item.V2 != null ? String(item.V2) : '');
      add(ctx.t('solved'), item.solved != null ? String(item.solved) + ' ' + (item.unit || '') : '');
    } else if (kind === 'ideal_gas') {
      add(ctx.t('solved'), item.solved != null ? String(item.solved) + ' ' + (item.unit || '') : '');
      add('P', item.P != null ? String(item.P) : '');
      add('V', item.V != null ? String(item.V) : '');
      add('n', item.n != null ? String(item.n) : '');
      add('T', item.T != null ? String(item.T) : '');
    } else {
      add('pH', item.pH != null ? Number(item.pH).toFixed(2) : '');
      add('pOH', item.pOH != null ? Number(item.pOH).toFixed(2) : '');
      add('[H+]', item.H != null ? String(item.H) : '');
      add('[OH-]', item.OH != null ? String(item.OH) : '');
      add(ctx.t('nature'), item.nature || '');
    }
    card.appendChild(dl);
    var pin = el('button', 'ws-btn ws-btn-sm');
    pin.type = 'button';
    pin.textContent = ctx.t('pinResult');
    pin.addEventListener('click', function () {
      var value = kind === 'molar_mass'
        ? ((item.molarMassDisplay || item.molarMass) + ' g/mol')
        : (kind === 'ph' ? ('pH ' + Number(item.pH).toFixed(2)) : String(item.solved != null ? item.solved : ''));
      ctx.pin({
        kind: kind,
        label: item.label || item.formula || kind,
        value: value,
        unit: item.unit || ''
      });
    });
    card.appendChild(pin);
    return card;
  }

  async function mount(node, ctx) {
    var t = ctx.t;
    var esc = ctx.escapeHtml;
    var kind = 'molar_mass';
    var pinned = [];
    var sessionId = ctx.sessionId || '';
    var lastResults = [];
    var lastPayload = null;

    node.innerHTML =
      '<p class="ws-kicker"><a href="' + esc(ctx.labHref('home')) + '">' + esc(t('proLab')) + '</a></p>' +
      '<h1 class="ws-title">' + esc(t('labCalc')) + '</h1>' +
      '<p class="ws-lede">' + esc(t('labCalcLede')) + '</p>';

    var tools = el('div', 'ws-lab-tools');
    [['molar_mass', t('labMolarMass')], ['dilution', t('labDilution')], ['ideal_gas', t('labIdealGas')], ['ph', t('labPh')]].forEach(function (pair) {
      var btn = el('button', 'ws-btn ws-btn-sm');
      btn.type = 'button';
      btn.id = 'ws-lab-kind-' + pair[0].replace('_', '-');
      btn.textContent = pair[1];
      btn.setAttribute('aria-pressed', pair[0] === kind ? 'true' : 'false');
      btn.addEventListener('click', function () {
        kind = pair[0];
        Array.prototype.forEach.call(tools.querySelectorAll('button'), function (b) {
          b.setAttribute('aria-pressed', 'false');
        });
        btn.setAttribute('aria-pressed', 'true');
        rebuildScenarios();
      });
      tools.appendChild(btn);
    });
    node.appendChild(tools);

    var list = el('div', 'ws-lab-scenarios');
    list.id = 'ws-lab-scenarios';
    node.appendChild(list);

    function rebuildScenarios(preset) {
      list.textContent = '';
      var rows = preset && preset.length ? preset : [{}];
      rows.forEach(function (row) { list.appendChild(scenarioRow(kind, t, row)); });
    }
    rebuildScenarios();

    var actions = el('div', 'ws-lab-actions');
    var add = el('button', 'ws-btn');
    add.type = 'button';
    add.textContent = t('addScenario');
    add.id = 'ws-lab-add-scenario';
    add.addEventListener('click', function () {
      var max = kind === 'molar_mass' ? 25 : 8;
      if (list.children.length >= max) return;
      list.appendChild(scenarioRow(kind, t, {}));
    });
    var calc = el('button', 'ws-btn ws-btn-primary');
    calc.type = 'button';
    calc.id = 'ws-lab-calculate';
    calc.textContent = t('calculateAll');
    var save = el('button', 'ws-btn ws-btn-secondary');
    save.type = 'button';
    save.id = 'ws-lab-save';
    save.textContent = t('saveSession');
    var titleInput = textInput('title', '');
    titleInput.id = 'ws-lab-session-title';
    titleInput.maxLength = 120;
    titleInput.setAttribute('aria-label', t('sessionTitle'));
    titleInput.placeholder = t('sessionTitle');
    actions.appendChild(add);
    actions.appendChild(calc);
    actions.appendChild(field(t('sessionTitle'), titleInput));
    actions.appendChild(save);
    node.appendChild(actions);

    var live = el('div');
    live.setAttribute('aria-live', 'polite');
    live.id = 'ws-lab-calc-live';
    node.appendChild(live);

    var pinnedBox = el('section', 'ws-lab-pinned');
    pinnedBox.innerHTML = '<h2 class="ws-h2"></h2><ul></ul>';
    pinnedBox.querySelector('h2').textContent = t('pinned');
    node.appendChild(pinnedBox);

    var results = el('div', 'ws-lab-results');
    node.appendChild(results);

    ctx.pin = function (item) {
      if (pinned.length >= 12) pinned.shift();
      pinned.push(item);
      renderPinned();
      if (ctx.ui && ctx.ui.toast) ctx.ui.toast(t('pinned'), 'success');
    };

    function renderPinned() {
      var ul = pinnedBox.querySelector('ul');
      ul.textContent = '';
      pinned.forEach(function (item) {
        var li = el('li');
        var strong = el('strong');
        strong.textContent = item.label;
        var span = el('span');
        span.textContent = item.value;
        li.appendChild(strong);
        li.appendChild(document.createTextNode(' '));
        li.appendChild(span);
        ul.appendChild(li);
      });
    }

    calc.addEventListener('click', function () {
      var payload = { calculator: kind };
      if (kind === 'molar_mass') payload.formulas = readScenarios(list, kind);
      else payload.scenarios = readScenarios(list, kind);
      lastPayload = payload;
      ctx.ui && ctx.ui.setBusy && ctx.ui.setBusy(calc, true, t('saving'));
      ctx.api.calculate(payload).then(function (data) {
        if (ctx.ui && ctx.ui.setBusy) ctx.ui.setBusy(calc, false);
        lastResults = data.results || [];
        results.textContent = '';
        lastResults.forEach(function (item) {
          results.appendChild(resultCard(ctx, item, kind));
        });
        live.textContent = t('calculated');
      }).catch(function (err) {
        if (ctx.ui && ctx.ui.setBusy) ctx.ui.setBusy(calc, false);
        live.textContent = err.message || t('errGenericBody');
      });
    });

    save.addEventListener('click', function () {
      var title = titleInput.value.trim() || t('labCalc');
      var state = Object.assign({}, lastPayload || { calculator: kind }, {
        formulas: kind === 'molar_mass' ? readScenarios(list, kind) : undefined,
        scenarios: kind === 'molar_mass' ? undefined : readScenarios(list, kind),
        results: lastResults,
        pinned: pinned
      });
      var body = { sessionType: 'calculation', title: title, state: state };
      var req = sessionId
        ? ctx.api.updateSession(Object.assign({ id: sessionId }, body))
        : ctx.api.createSession(body);
      req.then(function (data) {
        sessionId = data.session && data.session.id;
        if (ctx.ui && ctx.ui.toast) ctx.ui.toast(t('sessionSaved'));
        if (sessionId) history.replaceState(null, '', ctx.labHref('calculations') + '&session=' + encodeURIComponent(sessionId));
      }).catch(function (err) {
        if (ctx.ui && ctx.ui.toast) ctx.ui.toast(ctx.t(ctx.logic.uxError(err).bodyKey), 'danger');
      });
    });

    if (sessionId) {
      try {
        var loaded = await ctx.api.getSession(sessionId);
        var session = loaded.session || {};
        titleInput.value = session.title || '';
        var state = session.state || {};
        kind = state.calculator || 'molar_mass';
        Array.prototype.forEach.call(tools.querySelectorAll('button'), function (btn, i) {
          var keys = ['molar_mass', 'dilution', 'ideal_gas', 'ph'];
          btn.setAttribute('aria-pressed', keys[i] === kind ? 'true' : 'false');
        });
        rebuildScenarios(state.formulas || state.scenarios);
        pinned = Array.isArray(state.pinned) ? state.pinned : [];
        lastResults = Array.isArray(state.results) ? state.results : [];
        lastPayload = { calculator: kind, formulas: state.formulas, scenarios: state.scenarios };
        renderPinned();
        results.textContent = '';
        lastResults.forEach(function (item) {
          results.appendChild(resultCard(ctx, item, kind));
        });
      } catch (_err) {}
    }
  }

  window.AtomurusProLabCalculations = { mount: mount };
})();
