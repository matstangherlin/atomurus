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

  function mixRow(t, data) {
    data = data || {};
    var row = el('div', 'ws-lab-scenario');
    var C = el('input', 'ws-input');
    C.type = 'number';
    C.name = 'concentration';
    C.step = 'any';
    if (data.concentration != null) C.value = data.concentration;
    var concUnit = el('select', 'ws-input');
    concUnit.name = 'concUnit';
    [['mol/L', 'mol/L'], ['mmol/L', 'mmol/L']].forEach(function (pair) {
      var o = el('option');
      o.value = pair[0];
      o.textContent = pair[1];
      if ((data.concUnit || 'mol/L') === pair[0]) o.selected = true;
      concUnit.appendChild(o);
    });
    var V = el('input', 'ws-input');
    V.type = 'number';
    V.name = 'volume';
    V.step = 'any';
    if (data.volume != null) V.value = data.volume;
    var volUnit = el('select', 'ws-input');
    volUnit.name = 'volUnit';
    [['mL', 'mL'], ['L', 'L']].forEach(function (pair) {
      var o = el('option');
      o.value = pair[0];
      o.textContent = pair[1];
      if ((data.volUnit || 'mL') === pair[0]) o.selected = true;
      volUnit.appendChild(o);
    });
    row.appendChild(field(t('concentration'), C));
    row.appendChild(field(t('unitLabel'), concUnit));
    row.appendChild(field(t('volume'), V));
    row.appendChild(field(t('unitLabel'), volUnit));
    return row;
  }

  async function mount(node, ctx) {
    var t = ctx.t;
    var esc = ctx.escapeHtml;
    var sessionId = ctx.sessionId || '';
    var mode = 'prepare';

    node.innerHTML =
      '<p class="ws-kicker"><a href="' + esc(ctx.labHref('home')) + '">' + esc(t('proLab')) + '</a></p>' +
      '<h1 class="ws-title">' + esc(t('labSolutions')) + '</h1>' +
      '<p class="ws-lede">' + esc(t('labSolutionsLede')) + '</p>' +
      '<p class="ws-lede">' + esc(t('calcOnly')) + '</p>';

    var tools = el('div', 'ws-lab-tools');
    [['prepare', t('prepareFromSolid')], ['mix', t('mixSolutions')]].forEach(function (pair) {
      var btn = el('button', 'ws-btn ws-btn-sm');
      btn.type = 'button';
      btn.id = 'ws-lab-sol-mode-' + pair[0];
      btn.textContent = pair[1];
      btn.setAttribute('aria-pressed', pair[0] === mode ? 'true' : 'false');
      btn.addEventListener('click', function () {
        mode = pair[0];
        Array.prototype.forEach.call(tools.querySelectorAll('button'), function (b) {
          b.setAttribute('aria-pressed', 'false');
        });
        btn.setAttribute('aria-pressed', 'true');
        prepareBox.hidden = mode !== 'prepare';
        mixBox.hidden = mode !== 'mix';
      });
      tools.appendChild(btn);
    });
    node.appendChild(tools);

    var prepareBox = el('div');
    prepareBox.id = 'ws-lab-prepare';
    var formula = el('input', 'ws-input');
    formula.id = 'ws-lab-solute';
    formula.placeholder = 'NaCl';
    formula.setAttribute('aria-label', t('soluteFormula'));
    var conc = el('input', 'ws-input');
    conc.type = 'number';
    conc.step = 'any';
    conc.id = 'ws-lab-conc';
    conc.setAttribute('aria-label', t('targetConcentration'));
    var concUnit = el('select', 'ws-input');
    concUnit.id = 'ws-lab-conc-unit';
    [['mol/L', 'mol/L'], ['mmol/L', 'mmol/L']].forEach(function (pair) {
      var o = el('option');
      o.value = pair[0];
      o.textContent = pair[1];
      concUnit.appendChild(o);
    });
    var vol = el('input', 'ws-input');
    vol.type = 'number';
    vol.step = 'any';
    vol.id = 'ws-lab-vol';
    vol.setAttribute('aria-label', t('finalVolume'));
    var volUnit = el('select', 'ws-input');
    volUnit.id = 'ws-lab-vol-unit';
    [['L', 'L'], ['mL', 'mL']].forEach(function (pair) {
      var o = el('option');
      o.value = pair[0];
      o.textContent = pair[1];
      volUnit.appendChild(o);
    });
    var massUnit = el('select', 'ws-input');
    massUnit.id = 'ws-lab-mass-unit';
    [['g', 'g'], ['mg', 'mg']].forEach(function (pair) {
      var o = el('option');
      o.value = pair[0];
      o.textContent = pair[1];
      massUnit.appendChild(o);
    });
    prepareBox.appendChild(field(t('soluteFormula'), formula));
    prepareBox.appendChild(field(t('targetConcentration'), conc));
    prepareBox.appendChild(field(t('unitLabel'), concUnit));
    prepareBox.appendChild(field(t('finalVolume'), vol));
    prepareBox.appendChild(field(t('unitLabel'), volUnit));
    prepareBox.appendChild(field(t('requiredAmount'), massUnit));
    node.appendChild(prepareBox);

    var mixBox = el('div');
    mixBox.id = 'ws-lab-mix';
    mixBox.hidden = true;
    var mixFormula = el('input', 'ws-input');
    mixFormula.id = 'ws-lab-mix-formula';
    mixFormula.placeholder = 'NaCl';
    mixBox.appendChild(field(t('soluteFormula'), mixFormula));
    var mixList = el('div');
    mixList.id = 'ws-lab-mix-list';
    mixList.appendChild(mixRow(t, {}));
    mixList.appendChild(mixRow(t, {}));
    mixBox.appendChild(mixList);
    var addMix = el('button', 'ws-btn');
    addMix.type = 'button';
    addMix.textContent = t('addScenario');
    addMix.addEventListener('click', function () {
      if (mixList.children.length >= 8) return;
      mixList.appendChild(mixRow(t, {}));
    });
    mixBox.appendChild(addMix);
    var assume = el('p', 'ws-lede');
    assume.textContent = t('additiveVolumes');
    mixBox.appendChild(assume);
    node.appendChild(mixBox);

    var err = el('p', 'ws-solver-error');
    err.id = 'ws-lab-sol-error';
    err.setAttribute('role', 'alert');
    err.hidden = true;
    node.appendChild(err);

    var solve = el('button', 'ws-btn ws-btn-primary');
    solve.type = 'button';
    solve.id = 'ws-lab-sol-solve';
    solve.textContent = t('calculateAll');
    node.appendChild(solve);

    var live = el('div');
    live.id = 'ws-lab-sol-live';
    live.setAttribute('aria-live', 'polite');
    node.appendChild(live);

    var resultHost = el('div');
    resultHost.id = 'ws-lab-sol-result';
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

    function readMix() {
      return Array.prototype.map.call(mixList.children, function (row) {
        var get = function (name) {
          var input = row.querySelector('[name="' + name + '"]');
          return input ? input.value : '';
        };
        return {
          concentration: get('concentration'),
          concUnit: get('concUnit') || 'mol/L',
          volume: get('volume'),
          volUnit: get('volUnit') || 'mL'
        };
      }).filter(function (row) { return row.concentration !== '' && row.volume !== ''; });
    }

    function showResult(data) {
      resultHost.textContent = '';
      var headline = el('p', 'ws-solver-headline');
      headline.id = 'ws-lab-sol-answer';
      if (data.mode === 'mix') {
        headline.textContent = data.concentrationDisplay || (String(data.concentration) + ' ' + (data.concUnit || 'mol/L'));
      } else {
        headline.textContent = t('requiredAmount') + ': ' + (data.massDisplay || (String(data.mass != null ? data.mass : data.grams) + ' ' + (data.massUnit || 'g'))) + ' ' + (data.formula || '');
      }
      resultHost.appendChild(headline);
      if (data.assumption) {
        var assumeNote = el('p', 'ws-lede');
        assumeNote.textContent = data.assumption;
        resultHost.appendChild(assumeNote);
      }
      if (data.note) {
        var note = el('p', 'ws-lede');
        note.textContent = data.note;
        resultHost.appendChild(note);
      }
      var copyBtn = el('button', 'ws-btn ws-btn-sm');
      copyBtn.type = 'button';
      copyBtn.textContent = t('copy');
      copyBtn.addEventListener('click', function () {
        copyText(headline.textContent, copyBtn, t('copied'));
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
      var payload = mode === 'mix'
        ? { mode: 'mix', formula: mixFormula.value, solutions: readMix() }
        : {
          mode: 'prepare',
          formula: formula.value,
          concentration: conc.value,
          concUnit: concUnit.value,
          volume: vol.value,
          volUnit: volUnit.value,
          massUnit: massUnit.value
        };
      if (ctx.ui && ctx.ui.setBusy) ctx.ui.setBusy(solve, true, t('saving'));
      ctx.api.solveSolution(payload).then(function (data) {
        if (ctx.ui && ctx.ui.setBusy) ctx.ui.setBusy(solve, false);
        showResult(data);
      }).catch(function (fault) {
        if (ctx.ui && ctx.ui.setBusy) ctx.ui.setBusy(solve, false);
        err.hidden = false;
        err.textContent = (function () {
          var info = ctx.logic && ctx.logic.uxError ? ctx.logic.uxError(fault) : null;
          if (info && info.kind === 'solver') return ctx.t(info.bodyKey);
          return (fault && fault.body && fault.body.error) || t('errGenericBody');
        })();
      });
    });

    function persist() {
      var payload = {
        sessionType: 'solution_builder',
        title: titleInput.value.trim() || t('labSolutions'),
        state: {
          solverVersion: 1,
          mode: mode,
          formula: mode === 'mix' ? mixFormula.value : formula.value,
          concentration: conc.value,
          concUnit: concUnit.value,
          volume: vol.value,
          volUnit: volUnit.value,
          massUnit: massUnit.value,
          solutions: readMix()
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
        if (state.formula) {
          formula.value = state.formula;
          mixFormula.value = state.formula;
        }
        if (state.concentration != null) conc.value = state.concentration;
        if (state.concUnit) concUnit.value = state.concUnit;
        if (state.volume != null) vol.value = state.volume;
        if (state.volUnit) volUnit.value = state.volUnit;
        if (state.massUnit) massUnit.value = state.massUnit;
        if (Array.isArray(state.solutions) && state.solutions.length) {
          mixList.textContent = '';
          state.solutions.forEach(function (row) { mixList.appendChild(mixRow(t, row)); });
        }
        if (state.mode === 'mix') tools.querySelector('#ws-lab-sol-mode-mix').click();
        solve.click();
      } catch (_err) {
        err.hidden = false;
        err.textContent = t('sessionUnsupported');
      }
    }
  }

  window.AtomurusProLabSolutions = { mount: mount };
})();
