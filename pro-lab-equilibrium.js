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

  function copyText(text, btn, copiedLabel) {
    if (!text) return;
    var prev = btn ? btn.textContent : '';
    var done = function () {
      if (!btn) return;
      btn.textContent = copiedLabel;
      window.setTimeout(function () { btn.textContent = prev; }, 1400);
    };
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(text).then(done).catch(done);
    }
  }

  function langIsPt() {
    return (document.documentElement.lang || '').toLowerCase().indexOf('pt') === 0;
  }

  function speciesRow(t, data, kind) {
    data = data || {};
    var row = el('div', 'ws-lab-scenario');
    var formula = el('input', 'ws-input');
    formula.name = 'formula';
    formula.spellcheck = false;
    formula.autocomplete = 'off';
    formula.setAttribute('autocapitalize', 'off');
    formula.setAttribute('aria-label', t('speciesFormula'));
    formula.placeholder = 'H2';
    formula.value = data.formula || '';
    var value = el('input', 'ws-input');
    value.type = 'number';
    value.name = 'value';
    value.step = 'any';
    value.setAttribute('aria-label', kind === 'kp' ? t('partialPressure') : t('concentration'));
    if (data.value != null) value.value = data.value;
    var unit = el('select', 'ws-input');
    unit.name = 'unit';
    var units = kind === 'kp'
      ? [['bar', 'bar'], ['atm', 'atm'], ['kPa', 'kPa'], ['Pa', 'Pa']]
      : [['mol/L', 'mol/L'], ['mmol/L', 'mmol/L']];
    var selected = data.unit || units[0][0];
    units.forEach(function (pair) {
      var o = el('option');
      o.value = pair[0];
      o.textContent = pair[1];
      if (selected === pair[0]) o.selected = true;
      unit.appendChild(o);
    });
    row.appendChild(field(t('speciesFormula'), formula));
    row.appendChild(field(kind === 'kp' ? t('partialPressure') : t('concentration'), value));
    row.appendChild(field(t('unitLabel'), unit));
    var remove = el('button', 'ws-btn ws-btn-sm');
    remove.type = 'button';
    remove.textContent = t('remove');
    remove.addEventListener('click', function () {
      if (row.parentNode && row.parentNode.children.length > 1) row.parentNode.removeChild(row);
    });
    row.appendChild(remove);
    return row;
  }

  function readRows(list) {
    return Array.prototype.map.call(list.children, function (row) {
      var get = function (name) {
        var input = row.querySelector('[name="' + name + '"]');
        return input ? input.value : '';
      };
      return { formula: get('formula'), value: get('value'), unit: get('unit') };
    }).filter(function (row) { return row.formula; });
  }

  function fillRows(list, t, rows, kind) {
    list.textContent = '';
    (rows && rows.length ? rows : [{}]).forEach(function (row) {
      list.appendChild(speciesRow(t, row, kind));
    });
  }

  function stepsList(steps) {
    var ol = el('ol', 'ws-solver-steps');
    (steps || []).forEach(function (step, index) {
      var li = el('li', 'ws-solver-step');
      var n = el('span', 'ws-solver-step-n');
      n.textContent = String(index + 1).padStart(2, '0');
      var body = el('div');
      var h = el('h3', 'ws-solver-step-title');
      h.textContent = step.title || '';
      var p = el('p', 'ws-solver-step-body');
      p.textContent = step.body || '';
      body.appendChild(h);
      body.appendChild(p);
      li.appendChild(n);
      li.appendChild(body);
      ol.appendChild(li);
    });
    return ol;
  }

  function formatCell(value) {
    if (value == null || value === '') return '—';
    var n = Number(value);
    if (!Number.isFinite(n)) return String(value);
    var abs = Math.abs(n);
    if (n === 0) return '0';
    if (abs >= 1e4 || abs < 1e-3) return n.toExponential(3);
    return String(Math.round(n * 1e6) / 1e6);
  }

  function iceTable(data, t) {
    var wrap = el('div', 'ws-ice-scroll');
    var table = el('table', 'ws-ice-table');
    table.id = 'ws-lab-ice-table';
    table.setAttribute('aria-label', t('iceTable'));
    var thead = el('thead');
    var hr = el('tr');
    var corner = el('th');
    corner.scope = 'col';
    corner.textContent = t('iceTable');
    hr.appendChild(corner);
    (data.table || []).forEach(function (row) {
      var th = el('th');
      th.scope = 'col';
      th.textContent = row.display || row.formula;
      hr.appendChild(th);
    });
    thead.appendChild(hr);
    table.appendChild(thead);
    var tbody = el('tbody');
    var bands = [
      { key: 'initial', label: t('iceInitial') },
      { key: 'change', label: t('iceChange') },
      { key: 'equilibrium', label: t('iceEquilibrium') }
    ];
    bands.forEach(function (band) {
      var tr = el('tr');
      var th = el('th');
      th.scope = 'row';
      th.textContent = band.label;
      tr.appendChild(th);
      (data.table || []).forEach(function (row) {
        var td = el('td');
        if (row.excluded) {
          td.textContent = t('purePhase');
        } else if (band.key === 'change') {
          td.textContent = row.changeLabel || formatCell(row.change);
        } else {
          td.textContent = formatCell(row[band.key]);
        }
        tr.appendChild(td);
      });
      tbody.appendChild(tr);
    });
    table.appendChild(tbody);
    wrap.appendChild(table);
    return wrap;
  }

  function assumptionsBlock(items, t) {
    var details = el('details', 'ws-assumptions');
    var summary = el('summary');
    summary.textContent = t('modelAssumptions');
    details.appendChild(summary);
    var ul = el('ul');
    (items || []).forEach(function (item) {
      var li = el('li');
      li.textContent = item;
      ul.appendChild(li);
    });
    details.appendChild(ul);
    return details;
  }

  async function mount(node, ctx) {
    var t = ctx.t;
    var esc = ctx.escapeHtml;
    var sessionId = ctx.sessionId || '';
    var mode = 'constant';
    var kind = 'kc';

    node.innerHTML =
      '<p class="ws-kicker"><a href="' + esc(ctx.labHref('home')) + '">' + esc(t('proLab')) + '</a></p>' +
      '<h1 class="ws-title">' + esc(t('labEquilibrium')) + '</h1>' +
      '<p class="ws-lede">' + esc(t('labEquilibriumLede')) + '</p>';

    var tools = el('div', 'ws-lab-tools');
    [['constant', t('equilibriumConstant')], ['quotient', t('reactionQuotient')], ['ice', t('iceTable')]].forEach(function (pair) {
      var btn = el('button', 'ws-btn ws-btn-sm');
      btn.type = 'button';
      btn.id = 'ws-lab-eq-mode-' + pair[0];
      btn.textContent = pair[1];
      btn.setAttribute('aria-pressed', pair[0] === mode ? 'true' : 'false');
      btn.addEventListener('click', function () {
        mode = pair[0];
        Array.prototype.forEach.call(tools.querySelectorAll('button'), function (b) {
          b.setAttribute('aria-pressed', 'false');
        });
        btn.setAttribute('aria-pressed', 'true');
        syncMode();
      });
      tools.appendChild(btn);
    });
    node.appendChild(tools);

    var eqWrap = el('div', 'ws-solver-eq-field');
    var eqInput = el('textarea', 'ws-input ws-solver-eq-input');
    eqInput.id = 'ws-lab-eq-equation';
    eqInput.rows = 2;
    eqInput.spellcheck = false;
    eqInput.setAttribute('aria-label', t('equationLabel'));
    eqInput.placeholder = 'H2(g) + I2(g) ⇌ 2HI(g)';
    eqWrap.appendChild(field(t('equationLabel'), eqInput));
    node.appendChild(eqWrap);

    var kindRow = el('div', 'ws-lab-tools');
    kindRow.id = 'ws-lab-eq-kind';
    [['kc', 'Kc'], ['kp', 'Kp']].forEach(function (pair) {
      var btn = el('button', 'ws-btn ws-btn-sm');
      btn.type = 'button';
      btn.id = 'ws-lab-eq-kind-' + pair[0];
      btn.textContent = pair[1];
      btn.setAttribute('aria-pressed', pair[0] === kind ? 'true' : 'false');
      btn.addEventListener('click', function () {
        kind = pair[0];
        Array.prototype.forEach.call(kindRow.querySelectorAll('button'), function (b) {
          b.setAttribute('aria-pressed', 'false');
        });
        btn.setAttribute('aria-pressed', 'true');
        syncUnits();
      });
      kindRow.appendChild(btn);
    });
    node.appendChild(kindRow);

    var kInput = el('input', 'ws-input');
    kInput.type = 'number';
    kInput.step = 'any';
    kInput.id = 'ws-lab-eq-k';
    kInput.setAttribute('aria-label', t('equilibriumConstantK'));
    var kField = field(t('equilibriumConstantK'), kInput);
    kField.id = 'ws-lab-eq-k-field';
    node.appendChild(kField);

    var tInput = el('input', 'ws-input');
    tInput.type = 'number';
    tInput.step = 'any';
    tInput.id = 'ws-lab-eq-t';
    tInput.setAttribute('aria-label', t('temperature'));
    var tUnit = el('select', 'ws-input');
    tUnit.id = 'ws-lab-eq-tunit';
    [['K', 'K'], ['C', '°C']].forEach(function (pair) {
      var o = el('option');
      o.value = pair[0];
      o.textContent = pair[1];
      tUnit.appendChild(o);
    });
    var tempRow = el('div', 'ws-lab-scenario');
    tempRow.id = 'ws-lab-eq-temp';
    tempRow.appendChild(field(t('temperature'), tInput));
    tempRow.appendChild(field(t('unitLabel'), tUnit));
    node.appendChild(tempRow);

    var valuesBox = el('div');
    valuesBox.id = 'ws-lab-eq-values-box';
    var valuesHead = el('p', 'ws-lede');
    valuesHead.id = 'ws-lab-eq-values-label';
    valuesHead.textContent = t('equilibriumValues');
    var valuesList = el('div');
    valuesList.id = 'ws-lab-eq-values';
    valuesList.appendChild(speciesRow(t, { formula: 'H2' }, kind));
    valuesList.appendChild(speciesRow(t, { formula: 'I2' }, kind));
    valuesList.appendChild(speciesRow(t, { formula: 'HI' }, kind));
    var addValues = el('button', 'ws-btn');
    addValues.type = 'button';
    addValues.id = 'ws-lab-eq-add-value';
    addValues.textContent = t('addSpeciesRow');
    addValues.addEventListener('click', function () {
      if (valuesList.children.length >= 16) return;
      valuesList.appendChild(speciesRow(t, {}, kind));
    });
    valuesBox.appendChild(valuesHead);
    valuesBox.appendChild(valuesList);
    valuesBox.appendChild(addValues);
    node.appendChild(valuesBox);

    var initialsBox = el('div');
    initialsBox.id = 'ws-lab-eq-initials-box';
    var initialsHead = el('p', 'ws-lede');
    initialsHead.textContent = t('initialConcentration');
    var initialsList = el('div');
    initialsList.id = 'ws-lab-eq-initials';
    initialsList.appendChild(speciesRow(t, { formula: 'H2', value: 1 }, 'kc'));
    initialsList.appendChild(speciesRow(t, { formula: 'I2', value: 1 }, 'kc'));
    initialsList.appendChild(speciesRow(t, { formula: 'HI', value: 0 }, 'kc'));
    var addInit = el('button', 'ws-btn');
    addInit.type = 'button';
    addInit.id = 'ws-lab-eq-add-initial';
    addInit.textContent = t('addSpeciesRow');
    addInit.addEventListener('click', function () {
      if (initialsList.children.length >= 16) return;
      initialsList.appendChild(speciesRow(t, {}, 'kc'));
    });
    initialsBox.appendChild(initialsHead);
    initialsBox.appendChild(initialsList);
    initialsBox.appendChild(addInit);
    node.appendChild(initialsBox);

    var err = el('p', 'ws-solver-error');
    err.id = 'ws-lab-eq-error';
    err.setAttribute('role', 'alert');
    err.hidden = true;
    node.appendChild(err);

    var solve = el('button', 'ws-btn ws-btn-primary');
    solve.type = 'button';
    solve.id = 'ws-lab-eq-solve';
    solve.textContent = t('solveEquilibrium');
    node.appendChild(solve);

    var live = el('div');
    live.id = 'ws-lab-eq-live';
    live.setAttribute('aria-live', 'polite');
    node.appendChild(live);

    var resultHost = el('div');
    resultHost.id = 'ws-lab-eq-result';
    node.appendChild(resultHost);

    var saveRow = el('div', 'ws-lab-actions');
    var titleInput = el('input', 'ws-input');
    titleInput.id = 'ws-lab-session-title';
    titleInput.maxLength = 120;
    titleInput.setAttribute('aria-label', t('sessionTitle'));
    var saveBtn = el('button', 'ws-btn ws-btn-secondary');
    saveBtn.type = 'button';
    saveBtn.id = 'ws-lab-save';
    saveBtn.textContent = t('saveSession');
    saveRow.appendChild(field(t('sessionTitle'), titleInput));
    saveRow.appendChild(saveBtn);
    node.appendChild(saveRow);

    function syncUnits() {
      Array.prototype.forEach.call(valuesList.children, function (row) {
        var unit = row.querySelector('[name="unit"]');
        if (!unit) return;
        var current = unit.value;
        unit.textContent = '';
        var units = kind === 'kp'
          ? [['bar', 'bar'], ['atm', 'atm'], ['kPa', 'kPa'], ['Pa', 'Pa']]
          : [['mol/L', 'mol/L'], ['mmol/L', 'mmol/L']];
        units.forEach(function (pair) {
          var o = el('option');
          o.value = pair[0];
          o.textContent = pair[1];
          unit.appendChild(o);
        });
        unit.value = units.some(function (pair) { return pair[0] === current; }) ? current : units[0][0];
      });
    }

    function syncMode() {
      var isIce = mode === 'ice';
      var isQ = mode === 'quotient';
      kindRow.hidden = isIce;
      kField.hidden = !(isQ || isIce);
      tempRow.hidden = isIce;
      valuesBox.hidden = isIce;
      initialsBox.hidden = !isIce;
      valuesHead.textContent = isQ ? t('currentComposition') : t('equilibriumValues');
    }

    function solverError(fault) {
      var info = ctx.logic && ctx.logic.uxError ? ctx.logic.uxError(fault) : null;
      if (info && info.kind === 'solver') return ctx.t(info.bodyKey);
      return (fault && fault.body && fault.body.error) || t('errGenericBody');
    }

    function showResult(data) {
      resultHost.textContent = '';
      var headline = el('p', 'ws-solver-headline');
      headline.id = 'ws-lab-eq-answer';
      var lang = langIsPt() ? 'pt' : 'en';
      if (data.mode === 'quotient') {
        var dir = data.direction || {};
        headline.textContent = (dir.relation || '') + (dir[lang] ? ' — ' + dir[lang] : '');
        headline.title = (data.tooltip && data.tooltip[lang]) || (data.tooltip && data.tooltip.en) || '';
      } else if (data.mode === 'ice') {
        headline.textContent = 'x = ' + (data.xDisplay || data.x);
      } else {
        headline.textContent = (data.kind === 'kp' ? 'Kp' : 'Kc') + ' = ' + (data.KDisplay || data.K);
      }
      resultHost.appendChild(headline);

      if (data.expression && data.expression.html) {
        var expr = el('div', 'eq-expression');
        expr.id = 'ws-lab-eq-expression';
        expr.innerHTML = data.expression.html;
        resultHost.appendChild(expr);
      }

      var copyRow = el('div', 'ws-lab-actions');
      var copyResult = el('button', 'ws-btn ws-btn-sm');
      copyResult.type = 'button';
      copyResult.textContent = t('copy');
      copyResult.addEventListener('click', function () {
        copyText(headline.textContent, copyResult, t('copied'));
      });
      var copyExpr = el('button', 'ws-btn ws-btn-sm');
      copyExpr.type = 'button';
      copyExpr.id = 'ws-lab-eq-copy-expression';
      copyExpr.textContent = t('copyExpression');
      copyExpr.addEventListener('click', function () {
        copyText(data.expression && data.expression.text, copyExpr, t('copied'));
      });
      copyRow.appendChild(copyResult);
      copyRow.appendChild(copyExpr);
      resultHost.appendChild(copyRow);

      if (data.mode === 'ice') resultHost.appendChild(iceTable(data, t));

      var notes = (data.notes || []).concat(data.conversion && !data.conversion.ok ? [data.conversion.message] : []);
      notes.forEach(function (note) {
        var p = el('p', 'ws-lede');
        p.textContent = note;
        resultHost.appendChild(p);
      });

      var toggle = el('button', 'ws-btn ws-btn-sm');
      toggle.type = 'button';
      toggle.id = 'ws-lab-show-steps';
      toggle.textContent = t('showCalculation');
      var steps = stepsList(data.steps);
      steps.id = 'ws-lab-eq-steps';
      steps.hidden = true;
      toggle.addEventListener('click', function () {
        var open = !steps.hidden;
        steps.hidden = open;
        toggle.textContent = open ? t('showCalculation') : t('hideCalculation');
      });
      resultHost.appendChild(toggle);
      resultHost.appendChild(steps);
      resultHost.appendChild(assumptionsBlock(data.assumptions, t));
      live.textContent = headline.textContent;
    }

    function payload() {
      var body = {
        mode: mode,
        kind: mode === 'ice' ? 'kc' : kind,
        equation: eqInput.value
      };
      if (mode === 'quotient' || mode === 'ice') body.K = kInput.value;
      if (mode === 'ice') body.initials = readRows(initialsList);
      else body.values = readRows(valuesList);
      if (tInput.value !== '') {
        body.T = tInput.value;
        body.TUnit = tUnit.value;
        body.convert = true;
      }
      return body;
    }

    function persistState() {
      return {
        solverVersion: 1,
        mode: mode,
        kind: kind,
        equation: eqInput.value,
        K: kInput.value,
        T: tInput.value,
        TUnit: tUnit.value,
        convert: tInput.value !== '',
        values: readRows(valuesList),
        initials: readRows(initialsList)
      };
    }

    solve.addEventListener('click', function () {
      err.hidden = true;
      err.textContent = '';
      if (!ctx.api) return;
      if (ctx.ui && ctx.ui.setBusy) ctx.ui.setBusy(solve, true, t('saving'));
      ctx.api.solveEquilibrium(payload()).then(function (data) {
        if (ctx.ui && ctx.ui.setBusy) ctx.ui.setBusy(solve, false);
        showResult(data);
      }).catch(function (fault) {
        if (ctx.ui && ctx.ui.setBusy) ctx.ui.setBusy(solve, false);
        err.hidden = false;
        err.textContent = solverError(fault);
      });
    });

    function persist() {
      var body = {
        sessionType: 'equilibrium',
        title: titleInput.value.trim() || t('labEquilibrium'),
        state: persistState()
      };
      if (sessionId) body.id = sessionId;
      var req = sessionId ? ctx.api.updateSession(body) : ctx.api.createSession(body);
      return req.then(function (data) {
        if (data.session && data.session.id) sessionId = data.session.id;
        if (ctx.ui && ctx.ui.toast) ctx.ui.toast(t('sessionSaved'));
      });
    }

    saveBtn.addEventListener('click', function () {
      persist().catch(function (fault) {
        if (ctx.ui && ctx.ui.toast) ctx.ui.toast(ctx.t(ctx.logic.uxError(fault).bodyKey), { tone: 'danger' });
      });
    });

    syncMode();

    if (sessionId && ctx.api) {
      try {
        var loaded = await ctx.api.getSession(sessionId);
        var session = loaded.session || {};
        var state = session.state || {};
        titleInput.value = session.title || '';
        if (state.equation) eqInput.value = state.equation;
        if (state.K != null) kInput.value = state.K;
        if (state.T != null) tInput.value = state.T;
        if (state.TUnit) tUnit.value = state.TUnit;
        if (state.kind === 'kp') {
          kind = 'kp';
          var kpBtn = kindRow.querySelector('#ws-lab-eq-kind-kp');
          if (kpBtn) kpBtn.click();
        }
        if (state.mode && state.mode !== 'constant') {
          var modeBtn = tools.querySelector('#ws-lab-eq-mode-' + state.mode);
          if (modeBtn) modeBtn.click();
        }
        if (Array.isArray(state.values) && state.values.length) fillRows(valuesList, t, state.values, kind);
        if (Array.isArray(state.initials) && state.initials.length) fillRows(initialsList, t, state.initials, 'kc');
        solve.click();
      } catch (_err) {
        err.hidden = false;
        err.textContent = t('sessionUnsupported');
      }
    }
  }

  window.AtomurusProLabEquilibrium = { mount: mount };
})();
