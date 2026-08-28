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

  function compositionRow(t, data) {
    data = data || {};
    var row = el('div', 'ws-lab-scenario');
    var symbol = el('input', 'ws-input');
    symbol.name = 'symbol';
    symbol.maxLength = 2;
    symbol.setAttribute('aria-label', t('symbol'));
    symbol.value = data.symbol || '';
    var value = el('input', 'ws-input');
    value.type = 'number';
    value.name = 'value';
    value.step = 'any';
    value.setAttribute('aria-label', t('composition'));
    if (data.value != null) value.value = data.value;
    var unit = el('select', 'ws-input');
    unit.name = 'unit';
    [['percent', '%'], ['g', 'g']].forEach(function (pair) {
      var o = el('option');
      o.value = pair[0];
      o.textContent = pair[1];
      if ((data.unit || 'percent') === pair[0]) o.selected = true;
      unit.appendChild(o);
    });
    row.appendChild(field(t('symbol'), symbol));
    row.appendChild(field(t('composition'), value));
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

  async function mount(node, ctx) {
    var t = ctx.t;
    var esc = ctx.escapeHtml;
    var sessionId = ctx.sessionId || '';
    var mode = 'empirical';

    node.innerHTML =
      '<p class="ws-kicker"><a href="' + esc(ctx.labHref('home')) + '">' + esc(t('proLab')) + '</a></p>' +
      '<h1 class="ws-title">' + esc(t('labFormula')) + '</h1>' +
      '<p class="ws-lede">' + esc(t('labFormulaLede')) + '</p>';

    var tools = el('div', 'ws-lab-tools');
    [['empirical', t('empiricalFormula')], ['molecular', t('molecularFormula')]].forEach(function (pair) {
      var btn = el('button', 'ws-btn ws-btn-sm');
      btn.type = 'button';
      btn.id = 'ws-lab-formula-mode-' + pair[0];
      btn.textContent = pair[1];
      btn.setAttribute('aria-pressed', pair[0] === mode ? 'true' : 'false');
      btn.addEventListener('click', function () {
        mode = pair[0];
        Array.prototype.forEach.call(tools.querySelectorAll('button'), function (b) {
          b.setAttribute('aria-pressed', 'false');
        });
        btn.setAttribute('aria-pressed', 'true');
        empiricalBox.hidden = mode !== 'empirical';
        molecularBox.hidden = mode !== 'molecular';
      });
      tools.appendChild(btn);
    });
    node.appendChild(tools);

    var empiricalBox = el('div');
    empiricalBox.id = 'ws-lab-empirical';
    var list = el('div');
    list.id = 'ws-lab-composition';
    list.appendChild(compositionRow(t, { symbol: 'C', unit: 'percent' }));
    list.appendChild(compositionRow(t, { symbol: 'H', unit: 'percent' }));
    list.appendChild(compositionRow(t, { symbol: 'O', unit: 'percent' }));
    empiricalBox.appendChild(list);
    var add = el('button', 'ws-btn');
    add.type = 'button';
    add.id = 'ws-lab-add-element';
    add.textContent = t('addElementRow');
    add.addEventListener('click', function () {
      if (list.children.length >= 12) return;
      list.appendChild(compositionRow(t, {}));
    });
    empiricalBox.appendChild(add);
    node.appendChild(empiricalBox);

    var molecularBox = el('div');
    molecularBox.id = 'ws-lab-molecular';
    molecularBox.hidden = true;
    var empInput = el('input', 'ws-input');
    empInput.id = 'ws-lab-empirical-formula';
    empInput.placeholder = 'CH2O';
    empInput.setAttribute('aria-label', t('empiricalFormula'));
    var massInput = el('input', 'ws-input');
    massInput.type = 'number';
    massInput.step = 'any';
    massInput.id = 'ws-lab-molar-mass';
    massInput.setAttribute('aria-label', t('labMolarMass'));
    molecularBox.appendChild(field(t('empiricalFormula'), empInput));
    molecularBox.appendChild(field(t('labMolarMass') + ' (g/mol)', massInput));
    node.appendChild(molecularBox);

    var err = el('p', 'ws-solver-error');
    err.id = 'ws-lab-formula-error';
    err.setAttribute('role', 'alert');
    err.hidden = true;
    node.appendChild(err);

    var solve = el('button', 'ws-btn ws-btn-primary');
    solve.type = 'button';
    solve.id = 'ws-lab-formula-solve';
    solve.textContent = t('solveFormula');
    node.appendChild(solve);

    var live = el('div');
    live.id = 'ws-lab-formula-live';
    live.setAttribute('aria-live', 'polite');
    node.appendChild(live);

    var resultHost = el('div');
    resultHost.id = 'ws-lab-formula-result';
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

    function readComposition() {
      return Array.prototype.map.call(list.children, function (row) {
        var get = function (name) {
          var input = row.querySelector('[name="' + name + '"]');
          return input ? input.value : '';
        };
        return { symbol: get('symbol'), value: get('value'), unit: get('unit') || 'percent' };
      }).filter(function (row) { return row.symbol && row.value !== ''; });
    }

    function showResult(data) {
      resultHost.textContent = '';
      var headline = el('p', 'ws-solver-headline');
      headline.id = 'ws-lab-formula-answer';
      headline.textContent = data.molecularFormulaDisplay || data.molecularFormula || data.empiricalFormulaDisplay || data.empiricalFormula;
      resultHost.appendChild(headline);
      var copyBtn = el('button', 'ws-btn ws-btn-sm');
      copyBtn.type = 'button';
      copyBtn.textContent = t('copy');
      copyBtn.addEventListener('click', function () {
        copyText(data.molecularFormula || data.empiricalFormula, copyBtn, t('copied'));
      });
      resultHost.appendChild(copyBtn);
      var toggle = el('button', 'ws-btn ws-btn-sm');
      toggle.type = 'button';
      toggle.id = 'ws-lab-show-steps';
      toggle.textContent = t('showCalculation');
      var steps = stepsList(data.steps);
      steps.hidden = true;
      toggle.addEventListener('click', function () {
        var open = !steps.hidden;
        steps.hidden = open;
        toggle.textContent = open ? t('showCalculation') : t('hideCalculation');
      });
      resultHost.appendChild(toggle);
      resultHost.appendChild(steps);
      live.textContent = headline.textContent;
    }

    solve.addEventListener('click', function () {
      err.hidden = true;
      err.textContent = '';
      if (!ctx.api) return;
      var payload = mode === 'molecular'
        ? { mode: 'molecular', empiricalFormula: empInput.value, molarMass: massInput.value }
        : { mode: 'empirical', composition: readComposition() };
      if (ctx.ui && ctx.ui.setBusy) ctx.ui.setBusy(solve, true, t('saving'));
      ctx.api.solveFormula(payload).then(function (data) {
        if (ctx.ui && ctx.ui.setBusy) ctx.ui.setBusy(solve, false);
        showResult(data);
      }).catch(function (fault) {
        if (ctx.ui && ctx.ui.setBusy) ctx.ui.setBusy(solve, false);
        err.hidden = false;
        err.textContent = fault && fault.body && fault.body.error || t('errGenericBody');
      });
    });

    function persist() {
      var payload = {
        sessionType: 'formula_solver',
        title: titleInput.value.trim() || t('labFormula'),
        state: {
          solverVersion: 1,
          mode: mode,
          composition: readComposition(),
          empiricalFormula: empInput.value,
          molarMass: massInput.value
        }
      };
      if (sessionId) payload.id = sessionId;
      var req = sessionId ? ctx.api.updateSession(payload) : ctx.api.createSession(payload);
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

    if (sessionId && ctx.api) {
      try {
        var loaded = await ctx.api.getSession(sessionId);
        var session = loaded.session || {};
        var state = session.state || {};
        titleInput.value = session.title || '';
        if (state.mode === 'molecular') {
          mode = 'molecular';
          tools.querySelector('#ws-lab-formula-mode-molecular').click();
        }
        if (state.empiricalFormula) empInput.value = state.empiricalFormula;
        if (state.molarMass != null) massInput.value = state.molarMass;
        if (Array.isArray(state.composition) && state.composition.length) {
          list.textContent = '';
          state.composition.forEach(function (row) { list.appendChild(compositionRow(t, row)); });
        }
        solve.click();
      } catch (_err) {}
    }
  }

  window.AtomurusProLabFormula = { mount: mount };
})();
