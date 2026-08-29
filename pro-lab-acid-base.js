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

  function numInput(id, aria, placeholder) {
    var input = el('input', 'ws-input');
    input.type = 'number';
    input.step = 'any';
    input.id = id;
    input.setAttribute('aria-label', aria);
    if (placeholder) input.placeholder = placeholder;
    return input;
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

  function assumptionsBlock(items, note, t) {
    var details = el('details', 'ws-assumptions');
    var summary = el('summary');
    summary.textContent = t('modelAssumptions');
    details.appendChild(summary);
    if (note) {
      var p = el('p', 'ws-lede');
      p.textContent = note;
      details.appendChild(p);
    }
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
    var mode = 'weak-acid';

    node.innerHTML =
      '<p class="ws-kicker"><a href="' + esc(ctx.labHref('home')) + '">' + esc(t('proLab')) + '</a></p>' +
      '<h1 class="ws-title">' + esc(t('labAcidBase')) + '</h1>' +
      '<p class="ws-lede">' + esc(t('labAcidBaseLede')) + '</p>' +
      '<p class="ws-lede">' + esc(t('kwNote')) + '</p>';

    var tools = el('div', 'ws-lab-tools');
    [
      ['weak-acid', t('weakAcid')],
      ['weak-base', t('weakBase')],
      ['buffer', t('bufferSolution')],
      ['constants', t('acidBaseConstants')]
    ].forEach(function (pair) {
      var btn = el('button', 'ws-btn ws-btn-sm');
      btn.type = 'button';
      btn.id = 'ws-lab-ab-mode-' + pair[0];
      btn.textContent = pair[1];
      btn.setAttribute('aria-pressed', pair[0] === mode ? 'true' : 'false');
      btn.addEventListener('click', function () {
        mode = pair[0];
        Array.prototype.forEach.call(tools.querySelectorAll('button'), function (b) {
          b.setAttribute('aria-pressed', 'false');
        });
        btn.setAttribute('aria-pressed', 'true');
        syncMode();
        clearOutput();
      });
      tools.appendChild(btn);
    });
    node.appendChild(tools);

    var acidBox = el('div');
    acidBox.id = 'ws-lab-ab-acid';
    var cAcid = numInput('ws-lab-ab-C', t('analyticalConcentration'), '0.10');
    var ka = numInput('ws-lab-ab-Ka', 'Ka', '1.8e-5');
    var pka = numInput('ws-lab-ab-pKa', 'pKa', '4.74');
    acidBox.appendChild(field(t('analyticalConcentration') + ' (mol/L)', cAcid));
    acidBox.appendChild(field('Ka', ka));
    acidBox.appendChild(field('pKa', pka));
    node.appendChild(acidBox);

    var baseBox = el('div');
    baseBox.id = 'ws-lab-ab-base';
    var cBase = numInput('ws-lab-ab-Cb', t('analyticalConcentration'), '0.10');
    var kb = numInput('ws-lab-ab-Kb', 'Kb', '1.8e-5');
    var pkb = numInput('ws-lab-ab-pKb', 'pKb');
    baseBox.appendChild(field(t('analyticalConcentration') + ' (mol/L)', cBase));
    baseBox.appendChild(field('Kb', kb));
    baseBox.appendChild(field('pKb', pkb));
    node.appendChild(baseBox);

    var bufferBox = el('div');
    bufferBox.id = 'ws-lab-ab-buffer';
    var bufType = el('select', 'ws-input');
    bufType.id = 'ws-lab-ab-buffer-type';
    [['acid', t('acidBuffer')], ['base', t('baseBuffer')]].forEach(function (pair) {
      var o = el('option');
      o.value = pair[0];
      o.textContent = pair[1];
      bufType.appendChild(o);
    });
    var inputMode = el('select', 'ws-input');
    inputMode.id = 'ws-lab-ab-input-mode';
    [['concentration', t('concentrations')], ['moles', t('molesAndVolume')]].forEach(function (pair) {
      var o = el('option');
      o.value = pair[0];
      o.textContent = pair[1];
      inputMode.appendChild(o);
    });
    var ha = numInput('ws-lab-ab-HA', t('acidSpecies'));
    var aMinus = numInput('ws-lab-ab-A', t('baseSpecies'));
    var bufKa = numInput('ws-lab-ab-buf-Ka', 'Ka');
    var bufPka = numInput('ws-lab-ab-buf-pKa', 'pKa');
    var bufKb = numInput('ws-lab-ab-buf-Kb', 'Kb');
    var nHA = numInput('ws-lab-ab-nHA', t('acidAmount'));
    var nA = numInput('ws-lab-ab-nA', t('baseAmount'));
    var vol = numInput('ws-lab-ab-V', t('volume'));
    bufferBox.appendChild(field(t('bufferType'), bufType));
    bufferBox.appendChild(field(t('inputMode'), inputMode));
    var concFields = el('div');
    concFields.id = 'ws-lab-ab-conc-fields';
    concFields.appendChild(field(t('acidSpecies') + ' (mol/L)', ha));
    concFields.appendChild(field(t('baseSpecies') + ' (mol/L)', aMinus));
    bufferBox.appendChild(concFields);
    var moleFields = el('div');
    moleFields.id = 'ws-lab-ab-mole-fields';
    moleFields.appendChild(field(t('acidAmount') + ' (mol)', nHA));
    moleFields.appendChild(field(t('baseAmount') + ' (mol)', nA));
    moleFields.appendChild(field(t('volume') + ' (L)', vol));
    bufferBox.appendChild(moleFields);
    var acidConst = el('div');
    acidConst.id = 'ws-lab-ab-buf-acid-k';
    acidConst.appendChild(field('Ka', bufKa));
    acidConst.appendChild(field('pKa', bufPka));
    bufferBox.appendChild(acidConst);
    var baseConst = el('div');
    baseConst.id = 'ws-lab-ab-buf-base-k';
    baseConst.appendChild(field('Kb', bufKb));
    bufferBox.appendChild(baseConst);
    node.appendChild(bufferBox);

    var constBox = el('div');
    constBox.id = 'ws-lab-ab-constants';
    var action = el('select', 'ws-input');
    action.id = 'ws-lab-ab-action';
    [
      ['ka_to_pka', 'Ka → pKa'],
      ['pka_to_ka', 'pKa → Ka'],
      ['kb_to_pkb', 'Kb → pKb'],
      ['pkb_to_kb', 'pKb → Kb'],
      ['conjugate', t('conjugatePair')]
    ].forEach(function (pair) {
      var o = el('option');
      o.value = pair[0];
      o.textContent = pair[1];
      action.appendChild(o);
    });
    var cKa = numInput('ws-lab-ab-cKa', 'Ka');
    var cPka = numInput('ws-lab-ab-cPka', 'pKa');
    var cKb = numInput('ws-lab-ab-cKb', 'Kb');
    var cPkb = numInput('ws-lab-ab-cPkb', 'pKb');
    constBox.appendChild(field(t('conversion'), action));
    constBox.appendChild(field('Ka', cKa));
    constBox.appendChild(field('pKa', cPka));
    constBox.appendChild(field('Kb', cKb));
    constBox.appendChild(field('pKb', cPkb));
    node.appendChild(constBox);

    function syncBufferInputs() {
      var moles = inputMode.value === 'moles';
      concFields.hidden = moles;
      moleFields.hidden = !moles;
      var isBase = bufType.value === 'base';
      acidConst.hidden = isBase;
      baseConst.hidden = !isBase;
    }
    bufType.addEventListener('change', syncBufferInputs);
    inputMode.addEventListener('change', syncBufferInputs);

    function syncMode() {
      acidBox.hidden = mode !== 'weak-acid';
      baseBox.hidden = mode !== 'weak-base';
      bufferBox.hidden = mode !== 'buffer';
      constBox.hidden = mode !== 'constants';
      if (mode === 'buffer') syncBufferInputs();
    }

    var err = el('p', 'ws-solver-error');
    err.id = 'ws-lab-ab-error';
    err.setAttribute('role', 'alert');
    err.hidden = true;
    node.appendChild(err);

    var solve = el('button', 'ws-btn ws-btn-primary');
    solve.type = 'button';
    solve.id = 'ws-lab-ab-solve';
    solve.textContent = t('solveAcidBase');
    node.appendChild(solve);

    var live = el('div');
    live.id = 'ws-lab-ab-live';
    live.setAttribute('aria-live', 'polite');
    node.appendChild(live);

    var resultHost = el('div');
    resultHost.id = 'ws-lab-ab-result';
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

    function solverError(fault) {
      var info = ctx.logic && ctx.logic.uxError ? ctx.logic.uxError(fault) : null;
      if (info && info.kind === 'solver') return ctx.t(info.bodyKey);
      return (fault && fault.body && fault.body.error) || t('errGenericBody');
    }

    function clearOutput() {
      err.hidden = true;
      err.textContent = '';
      live.textContent = '';
      resultHost.textContent = '';
    }

    function payload() {
      if (mode === 'weak-acid') {
        return { mode: mode, C: cAcid.value, Ka: ka.value || undefined, pKa: pka.value || undefined };
      }
      if (mode === 'weak-base') {
        return { mode: mode, C: cBase.value, Kb: kb.value || undefined, pKb: pkb.value || undefined };
      }
      if (mode === 'buffer') {
        var body = {
          mode: 'buffer',
          type: bufType.value,
          inputMode: inputMode.value
        };
        if (bufType.value === 'base') body.Kb = bufKb.value || undefined;
        else {
          body.Ka = bufKa.value || undefined;
          body.pKa = bufPka.value || undefined;
        }
        if (inputMode.value === 'moles') {
          body.acidMoles = nHA.value;
          body.baseMoles = nA.value;
          body.volume = vol.value;
        } else {
          body.acid = ha.value;
          body.base = aMinus.value;
        }
        return body;
      }
      var conv = { mode: 'constants', action: action.value };
      if (cKa.value) conv.Ka = cKa.value;
      if (cPka.value) conv.pKa = cPka.value;
      if (cKb.value) conv.Kb = cKb.value;
      if (cPkb.value) conv.pKb = cPkb.value;
      return conv;
    }

    function persistState() {
      var state = {
        solverVersion: 1,
        mode: mode,
        type: bufType.value,
        inputMode: inputMode.value,
        action: action.value
      };
      if (mode === 'weak-acid') {
        state.C = cAcid.value;
        if (ka.value) state.Ka = ka.value;
        if (pka.value) state.pKa = pka.value;
      } else if (mode === 'weak-base') {
        state.C = cBase.value;
        if (kb.value) state.Kb = kb.value;
        if (pkb.value) state.pKb = pkb.value;
      } else if (mode === 'buffer') {
        state.acid = ha.value;
        state.base = aMinus.value;
        state.acidMoles = nHA.value;
        state.baseMoles = nA.value;
        state.volume = vol.value;
        if (bufType.value === 'base') {
          if (bufKb.value) state.Kb = bufKb.value;
        } else {
          if (bufKa.value) state.Ka = bufKa.value;
          if (bufPka.value) state.pKa = bufPka.value;
        }
      } else {
        if (cKa.value) state.Ka = cKa.value;
        if (cPka.value) state.pKa = cPka.value;
        if (cKb.value) state.Kb = cKb.value;
        if (cPkb.value) state.pKb = cPkb.value;
      }
      return state;
    }

    function applyState(state) {
      if (!state) return;
      if (state.C != null) {
        cAcid.value = state.C;
        cBase.value = state.C;
      }
      if (state.Ka != null) { ka.value = state.Ka; bufKa.value = state.Ka; cKa.value = state.Ka; }
      if (state.pKa != null) { pka.value = state.pKa; bufPka.value = state.pKa; cPka.value = state.pKa; }
      if (state.Kb != null) { kb.value = state.Kb; bufKb.value = state.Kb; cKb.value = state.Kb; }
      if (state.pKb != null) { pkb.value = state.pKb; cPkb.value = state.pKb; }
      if (state.acid != null) ha.value = state.acid;
      if (state.base != null) aMinus.value = state.base;
      if (state.acidMoles != null) nHA.value = state.acidMoles;
      if (state.baseMoles != null) nA.value = state.baseMoles;
      if (state.volume != null) vol.value = state.volume;
      if (state.type) bufType.value = state.type;
      if (state.inputMode) inputMode.value = state.inputMode;
      if (state.action) action.value = state.action;
    }

    function showResult(data) {
      resultHost.textContent = '';
      var headline = el('p', 'ws-solver-headline');
      headline.id = 'ws-lab-ab-answer';
      if (data.mode === 'constants') {
        var bits = [];
        if (data.KaDisplay) bits.push('Ka = ' + data.KaDisplay);
        if (data.pKaDisplay || data.pKa != null) bits.push('pKa = ' + (data.pKaDisplay || data.pKa));
        if (data.KbDisplay) bits.push('Kb = ' + data.KbDisplay);
        if (data.pKbDisplay || data.pKb != null) bits.push('pKb = ' + (data.pKbDisplay || data.pKb));
        headline.textContent = bits.join(' · ') || t('acidBaseConstants');
      } else {
        headline.textContent = 'pH = ' + (data.pHDisplay || data.pH);
      }
      resultHost.appendChild(headline);

      if (data.percentIonization != null) {
        var ion = el('p', 'ws-lede');
        ion.textContent = t('percentIonization') + ': ' + (Math.round(data.percentIonization * 100) / 100) + '%';
        resultHost.appendChild(ion);
      }
      if (data.warnings && data.warnings.length) {
        data.warnings.forEach(function (w) {
          var p = el('p', 'ws-lede');
          p.textContent = w;
          resultHost.appendChild(p);
        });
      }
      if (data.fivePercent && data.fivePercent.note) {
        var five = el('p', 'ws-lede');
        five.textContent = data.fivePercent.note;
        resultHost.appendChild(five);
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
      steps.id = 'ws-lab-ab-steps';
      steps.hidden = true;
      toggle.addEventListener('click', function () {
        var open = !steps.hidden;
        steps.hidden = open;
        toggle.textContent = open ? t('showCalculation') : t('hideCalculation');
      });
      resultHost.appendChild(toggle);
      resultHost.appendChild(steps);
      resultHost.appendChild(assumptionsBlock(data.assumptions, data.kwNote, t));
      live.textContent = headline.textContent;
    }

    solve.addEventListener('click', function () {
      err.hidden = true;
      err.textContent = '';
      if (!ctx.api) return;
      if (ctx.ui && ctx.ui.setBusy) ctx.ui.setBusy(solve, true, t('saving'));
      ctx.api.solveAcidBase(payload()).then(function (data) {
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
        sessionType: 'acid_base',
        title: titleInput.value.trim() || t('labAcidBase'),
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
        applyState(state);
        if (state.mode && state.mode !== 'weak-acid') {
          var modeBtn = tools.querySelector('#ws-lab-ab-mode-' + state.mode);
          if (modeBtn) modeBtn.click();
        } else {
          syncMode();
        }
        solve.click();
      } catch (_err) {
        err.hidden = false;
        err.textContent = t('sessionUnsupported');
      }
    }
  }

  window.AtomurusProLabAcidBase = { mount: mount };
})();
