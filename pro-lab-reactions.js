(function () {
  'use strict';

  function el(tag, className) {
    var node = document.createElement(tag);
    if (className) node.className = className;
    return node;
  }

  function field(labelText, input, hintId) {
    var wrap = el('label', 'ws-lab-field');
    var span = el('span');
    span.textContent = labelText;
    wrap.appendChild(span);
    wrap.appendChild(input);
    if (hintId) input.setAttribute('aria-describedby', hintId);
    return wrap;
  }

  function optionSelect(name, pairs, value) {
    var select = el('select', 'ws-input');
    select.name = name;
    pairs.forEach(function (pair) {
      var o = el('option');
      o.value = pair[0];
      o.textContent = pair[1];
      if (String(value || pair[0]) === pair[0]) o.selected = true;
      select.appendChild(o);
    });
    return select;
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

  function renderEquation(host, data) {
    host.textContent = '';
    var species = (data.reactants || []).concat(data.products || []);
    if (!species.length) {
      host.textContent = data.balancedDisplay || data.balanced || '';
      return;
    }
    var plain = data.balanced || '';
    host.setAttribute('role', 'img');
    host.setAttribute('aria-label', data.balancedDisplay || plain);

    function appendSide(rows) {
      rows.forEach(function (row, index) {
        if (index) {
          var plus = el('span', 'ws-eq-plus');
          plus.textContent = '+';
          plus.setAttribute('aria-hidden', 'true');
          host.appendChild(plus);
        }
        var term = el('span', 'ws-eq-term');
        var coeff = row.coefficient && row.coefficient !== 1 ? String(row.coefficient) + ' ' : '';
        var display = (data.balancedDisplay || '').split(/→|->/)[row.role === 'product' ? 1 : 0] || '';
        term.textContent = coeff + (row.formula || '');
        if (data.balancedDisplay) {
          var parts = (row.role === 'product' ? (data.balancedDisplay.split('→')[1] || '') : (data.balancedDisplay.split('→')[0] || ''))
            .split('+')
            .map(function (p) { return p.trim(); });
          if (parts[index]) term.textContent = parts[index];
        }
        host.appendChild(term);
      });
    }

    appendSide(data.reactants || []);
    var arrow = el('span', 'ws-eq-arrow');
    arrow.textContent = '→';
    arrow.setAttribute('aria-hidden', 'true');
    host.appendChild(arrow);
    appendSide(data.products || []);
  }

  function quantityRow(t, species, data) {
    data = data || {};
    var row = el('div', 'ws-lab-scenario ws-solver-qty');
    row.setAttribute('data-formula', species.formula);
    var formula = el('div', 'ws-solver-qty-formula');
    formula.textContent = species.formulaDisplay || species.formula;
    row.appendChild(formula);

    var kind = optionSelect('kind', [
      ['mass', t('kindMass')],
      ['amount', t('kindAmount')],
      ['gas', t('kindGas')],
      ['solution', t('kindSolution')]
    ], data.kind || (data.unit === 'mol' ? 'amount' : 'mass'));
    row.appendChild(field(t('qtyKind'), kind));

    var amountField = field(t('mass'), (function () {
      var amount = el('input', 'ws-input');
      amount.type = 'number';
      amount.name = 'amount';
      amount.step = 'any';
      amount.min = '0';
      amount.setAttribute('aria-label', t('givenQuantities') + ' ' + species.formula);
      if (data.amount != null) amount.value = data.amount;
      return amount;
    })());
    row.appendChild(amountField);

    var unit = optionSelect('unit', [
      ['g', 'g'], ['mg', 'mg'], ['kg', 'kg'], ['mol', 'mol']
    ], data.unit || 'g');
    var unitField = field(t('unitLabel'), unit);
    row.appendChild(unitField);

    var extras = el('div', 'ws-solver-qty-extras');
    row.appendChild(extras);

    function syncExtras() {
      extras.textContent = '';
      var mode = kind.value;
      var showMass = mode === 'mass' || mode === 'amount';
      amountField.hidden = !showMass;
      unitField.hidden = !showMass;
      if (mode === 'amount') {
        unit.value = 'mol';
        unit.disabled = true;
        return;
      }
      unit.disabled = false;
      if (mode === 'mass') {
        if (['g', 'mg', 'kg'].indexOf(unit.value) === -1) unit.value = 'g';
        Array.prototype.forEach.call(unit.options, function (opt) {
          opt.hidden = ['g', 'mg', 'kg'].indexOf(opt.value) === -1;
        });
        return;
      }
      Array.prototype.forEach.call(unit.options, function (opt) { opt.hidden = false; });
      if (mode === 'gas') {
        var vol = el('input', 'ws-input');
        vol.type = 'number';
        vol.name = 'volume';
        vol.step = 'any';
        vol.value = data.volume != null ? data.volume : (data.amount != null ? data.amount : '');
        extras.appendChild(field(t('volume'), vol));
        extras.appendChild(field(t('volume') + ' unit', optionSelect('volUnit', [['L', 'L'], ['mL', 'mL']], data.volUnit || 'L')));
        var P = el('input', 'ws-input');
        P.type = 'number';
        P.name = 'P';
        P.step = 'any';
        P.value = data.P != null ? data.P : '1';
        extras.appendChild(field(t('pressure'), P));
        extras.appendChild(field(t('pressure') + ' unit', optionSelect('PUnit', [['atm', 'atm'], ['kPa', 'kPa'], ['Pa', 'Pa']], data.PUnit || 'atm')));
        var T = el('input', 'ws-input');
        T.type = 'number';
        T.name = 'T';
        T.step = 'any';
        T.value = data.T != null ? data.T : '298.15';
        extras.appendChild(field(t('temperature'), T));
        extras.appendChild(field(t('temperature') + ' unit', optionSelect('TUnit', [['K', 'K'], ['C', '°C']], data.TUnit || 'K')));
      }
      if (mode === 'solution') {
        var C = el('input', 'ws-input');
        C.type = 'number';
        C.name = 'concentration';
        C.step = 'any';
        C.value = data.concentration != null ? data.concentration : '';
        extras.appendChild(field(t('concentration'), C));
        extras.appendChild(field(t('concentration') + ' unit', optionSelect('concUnit', [['mol/L', 'mol/L'], ['mmol/L', 'mmol/L']], data.concUnit || 'mol/L')));
        var V = el('input', 'ws-input');
        V.type = 'number';
        V.name = 'volume';
        V.step = 'any';
        V.value = data.volume != null ? data.volume : '';
        extras.appendChild(field(t('volume'), V));
        extras.appendChild(field(t('volume') + ' unit', optionSelect('volUnit', [['L', 'L'], ['mL', 'mL']], data.volUnit || 'mL')));
      }
    }
    kind.addEventListener('change', syncExtras);
    syncExtras();
    return row;
  }

  function readQuantities(list) {
    return Array.prototype.map.call(list.querySelectorAll('.ws-solver-qty'), function (row) {
      var get = function (name) {
        var input = row.querySelector('[name="' + name + '"]');
        return input ? input.value : '';
      };
      var kind = get('kind') || 'mass';
      var entry = { formula: row.getAttribute('data-formula'), kind: kind };
      if (kind === 'gas') {
        entry.volume = get('volume');
        entry.volUnit = get('volUnit') || 'L';
        entry.P = get('P');
        entry.PUnit = get('PUnit') || 'atm';
        entry.T = get('T');
        entry.TUnit = get('TUnit') || 'K';
      } else if (kind === 'solution') {
        entry.concentration = get('concentration');
        entry.concUnit = get('concUnit') || 'mol/L';
        entry.volume = get('volume');
        entry.volUnit = get('volUnit') || 'L';
      } else {
        entry.amount = get('amount');
        entry.unit = get('unit') || (kind === 'amount' ? 'mol' : 'g');
      }
      return entry;
    }).filter(function (row) {
      if (row.kind === 'gas') return row.volume !== '';
      if (row.kind === 'solution') return row.concentration !== '' && row.volume !== '';
      return row.amount !== '';
    });
  }

  function showError(box, input, message) {
    box.textContent = message || '';
    box.hidden = !message;
    if (input) {
      input.setAttribute('aria-invalid', message ? 'true' : 'false');
    }
  }

  function faultMessage(ctx, t, fault) {
    var info = ctx.logic && ctx.logic.uxError ? ctx.logic.uxError(fault) : null;
    if (info && info.kind === 'solver') return ctx.t(info.bodyKey);
    var msg = fault && ((fault.body && fault.body.error) || fault.message);
    if (msg && String(msg).indexOf('\n    at ') === -1 && String(msg) !== 'Request failed') return String(msg);
    if (info && info.bodyKey) return ctx.t(info.bodyKey);
    return t('errGenericBody');
  }

  function resultBlock(t, data) {
    var wrap = el('div', 'ws-solver-result');
    var kicker = el('p', 'ws-kicker');
    kicker.textContent = t('targetAmount');
    wrap.appendChild(kicker);
    var headline = el('p', 'ws-solver-headline');
    headline.id = 'ws-lab-target-amount';
    var target = data.target || data.theoreticalYield || {};
    headline.textContent = (target.formulaDisplay || target.formula || '') + '  ·  ' +
      (target.amountDisplay || ((target.amount != null ? target.amount : target.grams) + ' ' + (target.unit || 'g')));
    wrap.appendChild(headline);

    var unspecified = data.unspecifiedReactantsDisplay || data.unspecifiedReactants || [];
    if (data.limitingAnalysisComplete && data.stoichiometricMixture) {
      var mix = el('div', 'ws-solver-analysis');
      mix.id = 'ws-lab-mixture';
      var mixTitle = el('p', 'ws-kicker');
      mixTitle.textContent = t('stoichiometricMixture');
      var mixBody = el('p', 'ws-lede');
      mixBody.textContent = t('stoichiometricMixtureBody');
      mix.appendChild(mixTitle);
      mix.appendChild(mixBody);
      wrap.appendChild(mix);
    } else if (data.limitingAnalysisComplete && data.limitingReagent) {
      var limit = el('div', 'ws-solver-analysis');
      limit.id = 'ws-lab-limiting';
      var limitK = el('p', 'ws-kicker');
      limitK.textContent = t('limitingReagent');
      var limitV = el('p', 'ws-solver-headline');
      limitV.textContent = data.limitingReagentDisplay || data.limitingReagent;
      limit.appendChild(limitK);
      limit.appendChild(limitV);
      wrap.appendChild(limit);
    } else if (!data.limitingAnalysisComplete && data.specifiedReactantCount > 1 && data.calculationBasis) {
      var partial = el('div', 'ws-solver-analysis');
      partial.id = 'ws-lab-partial';
      var pk = el('p', 'ws-kicker');
      pk.textContent = t('partialLimitingAnalysis');
      var pb = el('p', 'ws-lede');
      pb.textContent = t('mostRestrictive', '', {
        formula: data.calculationBasis.formulaDisplay || data.calculationBasis.formula
      });
      var pc = el('p', 'ws-lede');
      pc.textContent = t('unspecifiedExcess', '', { formula: unspecified.join(', ') });
      partial.appendChild(pk);
      partial.appendChild(pb);
      partial.appendChild(pc);
      wrap.appendChild(partial);
    } else if (data.calculationBasis) {
      var basis = el('div', 'ws-solver-analysis');
      basis.id = 'ws-lab-basis';
      var bk = el('p', 'ws-kicker');
      bk.textContent = t('calculationBasis');
      var bv = el('p', 'ws-solver-headline');
      bv.textContent = data.calculationBasis.formulaDisplay || data.calculationBasis.formula;
      var bn = el('p', 'ws-lede');
      bn.id = 'ws-lab-basis-note';
      bn.textContent = data.calculationBasis.assumption || t('excessAssumption');
      basis.appendChild(bk);
      basis.appendChild(bv);
      basis.appendChild(bn);
      wrap.appendChild(basis);
    }

    var dl = el('dl', 'ws-lab-dl');
    function add(k, v, hint) {
      if (v == null || v === '') return;
      var dt = el('dt');
      dt.textContent = k;
      if (hint) dt.title = hint;
      var dd = el('dd');
      dd.textContent = v;
      dl.appendChild(dt);
      dl.appendChild(dd);
    }
    add(t('reactionExtent'), data.reactionExtentDisplay || data.reactionExtent, t('reactionExtentHint'));
    add(t('theoreticalYield'), (data.theoreticalYield && data.theoreticalYield.gramsDisplay) || (target.grams != null ? String(target.grams) + ' g' : ''));
    if (data.percentYield != null) add(t('percentYield'), data.percentYieldDisplay || (String(data.percentYield) + '%'));
    (data.excess || []).forEach(function (row) {
      add((row.formulaDisplay || row.formula) + ' ' + t('excessRemaining'), row.remainingDisplay || (String(row.remainingGrams) + ' g'));
    });
    wrap.appendChild(dl);
    if (data.yieldNote) {
      var note = el('p', 'ws-lede');
      note.textContent = data.yieldNote;
      wrap.appendChild(note);
    }
    return wrap;
  }

  function stepsList(steps) {
    var ol = el('ol', 'ws-solver-steps');
    ol.id = 'ws-lab-steps';
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
    var balanced = null;
    var lastSolve = null;

    node.innerHTML =
      '<p class="ws-kicker"><a href="' + esc(ctx.labHref('home')) + '">' + esc(t('proLab')) + '</a></p>' +
      '<h1 class="ws-title" id="ws-lab-reactions-title">' + esc(t('labReactions')) + '</h1>' +
      '<p class="ws-lede">' + esc(t('labReactionsLede')) + '</p>' +
      '<p class="ws-lede">' + esc(t('bothSides')) + '</p>' +
      '<p class="ws-lede ws-solver-trust">' + esc(t('solverTrust')) + '</p>';

    var eqLabel = el('label', 'ws-lab-field ws-solver-eq-field');
    var eqSpan = el('span');
    eqSpan.id = 'ws-lab-eq-label';
    eqSpan.textContent = t('equationLabel');
    var textarea = el('textarea', 'ws-input ws-solver-eq-input');
    textarea.id = 'ws-lab-equation';
    textarea.rows = 3;
    textarea.maxLength = 1000;
    textarea.setAttribute('aria-labelledby', 'ws-lab-eq-label');
    textarea.setAttribute('aria-describedby', 'ws-lab-eq-error');
    textarea.placeholder = 'C2H6 + O2 -> CO2 + H2O';
    eqLabel.appendChild(eqSpan);
    eqLabel.appendChild(textarea);
    node.appendChild(eqLabel);

    var err = el('p', 'ws-solver-error');
    err.id = 'ws-lab-eq-error';
    err.setAttribute('role', 'alert');
    err.hidden = true;
    node.appendChild(err);

    var balanceBtn = el('button', 'ws-btn ws-btn-primary');
    balanceBtn.type = 'button';
    balanceBtn.id = 'ws-lab-balance';
    balanceBtn.textContent = t('balanceEquation');
    node.appendChild(balanceBtn);

    var eqHead = el('h2', 'ws-h2');
    eqHead.id = 'ws-lab-balanced-heading';
    eqHead.textContent = t('balancedEquation');
    eqHead.hidden = true;
    node.appendChild(eqHead);

    var eqOut = el('div', 'ws-eq');
    eqOut.id = 'ws-lab-balanced';
    eqOut.hidden = true;
    node.appendChild(eqOut);

    var eqActions = el('div', 'ws-lab-actions');
    eqActions.hidden = true;
    var copyEq = el('button', 'ws-btn ws-btn-sm');
    copyEq.type = 'button';
    copyEq.id = 'ws-lab-copy-eq';
    copyEq.textContent = t('copy');
    eqActions.appendChild(copyEq);
    node.appendChild(eqActions);

    var stoich = el('section', 'ws-solver-stoich');
    stoich.id = 'ws-lab-stoich';
    stoich.hidden = true;
    stoich.innerHTML = '<h2 class="ws-h2" id="ws-lab-stoich-heading">' + esc(t('continueStoich')) + '</h2>';
    var qtyHost = el('div');
    qtyHost.id = 'ws-lab-quantities';
    stoich.appendChild(qtyHost);

    var targetWrap = el('div', 'ws-lab-tools');
    var targetSelect = optionSelect('target', [['', t('targetSpecies')]], '');
    targetSelect.id = 'ws-lab-target';
    var targetUnit = optionSelect('targetUnit', [['g', 'g'], ['mg', 'mg'], ['kg', 'kg'], ['mol', 'mol']], 'g');
    targetUnit.id = 'ws-lab-target-unit';
    targetWrap.appendChild(field(t('targetSpecies'), targetSelect));
    targetWrap.appendChild(field(t('theoreticalYield'), targetUnit));
    stoich.appendChild(targetWrap);

    var actualWrap = el('div', 'ws-lab-tools');
    var actual = el('input', 'ws-input');
    actual.type = 'number';
    actual.id = 'ws-lab-actual';
    actual.min = '0';
    actual.step = 'any';
    actual.setAttribute('aria-label', t('actualYield'));
    var actualUnit = optionSelect('actualUnit', [['g', 'g'], ['mg', 'mg'], ['kg', 'kg'], ['mol', 'mol']], 'g');
    actualWrap.appendChild(field(t('actualYield') + ' (' + t('optional') + ')', actual));
    actualWrap.appendChild(field(t('actualYield'), actualUnit));
    stoich.appendChild(actualWrap);

    var solveBtn = el('button', 'ws-btn ws-btn-primary');
    solveBtn.type = 'button';
    solveBtn.id = 'ws-lab-solve';
    solveBtn.textContent = t('solveStoich');
    stoich.appendChild(solveBtn);
    node.appendChild(stoich);

    var live = el('div');
    live.id = 'ws-lab-solver-live';
    live.setAttribute('aria-live', 'polite');
    node.appendChild(live);

    var resultHost = el('div');
    resultHost.id = 'ws-lab-result';
    node.appendChild(resultHost);

    var saveRow = el('div', 'ws-lab-actions');
    var titleInput = el('input', 'ws-input');
    titleInput.id = 'ws-lab-session-title';
    titleInput.maxLength = 120;
    titleInput.setAttribute('aria-label', t('sessionTitle'));
    titleInput.placeholder = t('sessionTitle');
    var saveBtn = el('button', 'ws-btn ws-btn-secondary');
    saveBtn.type = 'button';
    saveBtn.id = 'ws-lab-save';
    saveBtn.textContent = t('saveSession');
    saveRow.appendChild(field(t('sessionTitle'), titleInput));
    saveRow.appendChild(saveBtn);
    node.appendChild(saveRow);

    function applyBalance(data) {
      balanced = data;
      lastSolve = null;
      resultHost.textContent = '';
      showError(err, textarea, '');
      eqHead.hidden = false;
      eqOut.hidden = false;
      eqActions.hidden = false;
      renderEquation(eqOut, data);
      live.textContent = data.balancedDisplay || data.balanced;
      stoich.hidden = false;
      qtyHost.textContent = '';
      (data.reactants || []).forEach(function (row) {
        qtyHost.appendChild(quantityRow(t, row, {}));
      });
      targetSelect.textContent = '';
      (data.products || []).forEach(function (row) {
        var o = el('option');
        o.value = row.formula;
        o.textContent = row.formulaDisplay || row.formula;
        targetSelect.appendChild(o);
      });
      if (data.products && data.products[0]) targetSelect.value = data.products[0].formula;
    }

    function restoreQuantities(quantities) {
      (quantities || []).forEach(function (entry) {
        var row = qtyHost.querySelector('[data-formula="' + entry.formula + '"]');
        if (!row) return;
        var kind = row.querySelector('[name="kind"]');
        if (kind) {
          kind.value = entry.kind || (entry.unit === 'mol' ? 'amount' : 'mass');
          kind.dispatchEvent(new Event('change'));
        }
        Object.keys(entry).forEach(function (key) {
          var input = row.querySelector('[name="' + key + '"]');
          if (input && entry[key] != null) input.value = entry[key];
        });
      });
    }

    balanceBtn.addEventListener('click', function () {
      if (!ctx.api || typeof ctx.api.balanceReaction !== 'function') return;
      showError(err, textarea, '');
      if (ctx.ui && ctx.ui.setBusy) ctx.ui.setBusy(balanceBtn, true, t('saving'));
      ctx.api.balanceReaction({ equation: textarea.value }).then(function (data) {
        if (ctx.ui && ctx.ui.setBusy) ctx.ui.setBusy(balanceBtn, false);
        applyBalance(data);
      }).catch(function (fault) {
        if (ctx.ui && ctx.ui.setBusy) ctx.ui.setBusy(balanceBtn, false);
        showError(err, textarea, faultMessage(ctx, t, fault));
      });
    });

    copyEq.addEventListener('click', function () {
      copyText((balanced && (balanced.balancedDisplay || balanced.balanced)) || '', copyEq, t('copied'));
    });

    solveBtn.addEventListener('click', function () {
      if (!ctx.api || typeof ctx.api.solveReaction !== 'function') return;
      var quantities = readQuantities(qtyHost);
      if (!quantities.length) {
        live.textContent = t('errGenericBody');
        return;
      }
      if (ctx.ui && ctx.ui.setBusy) ctx.ui.setBusy(solveBtn, true, t('saving'));
      ctx.api.solveReaction({
        equation: textarea.value,
        quantities: quantities,
        target: { formula: targetSelect.value, unit: targetUnit.value },
        actualYield: actual.value !== '' ? { amount: actual.value, unit: actualUnit.value } : undefined
      }).then(function (data) {
        if (ctx.ui && ctx.ui.setBusy) ctx.ui.setBusy(solveBtn, false);
        lastSolve = data;
        resultHost.textContent = '';
        resultHost.appendChild(resultBlock(t, data));
        var copyRes = el('button', 'ws-btn ws-btn-sm');
        copyRes.type = 'button';
        copyRes.id = 'ws-lab-copy-result';
        copyRes.textContent = t('copy');
        copyRes.addEventListener('click', function () {
          var bits = [data.balancedDisplay || data.balanced || ''];
          if (data.limitingReagent) bits.push(t('limitingReagent') + ': ' + (data.limitingReagentDisplay || data.limitingReagent));
          else if (data.stoichiometricMixture) bits.push(t('stoichiometricMixture'));
          else if (data.calculationBasis) bits.push(t('calculationBasis') + ': ' + (data.calculationBasis.formulaDisplay || data.calculationBasis.formula));
          bits.push(t('theoreticalYield') + ': ' + ((data.theoreticalYield && data.theoreticalYield.gramsDisplay) || ''));
          copyText(bits.join('\n'), copyRes, t('copied'));
        });
        resultHost.appendChild(copyRes);
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
        live.textContent = t('calculated');
      }).catch(function (fault) {
        if (ctx.ui && ctx.ui.setBusy) ctx.ui.setBusy(solveBtn, false);
        live.textContent = faultMessage(ctx, t, fault);
      });
    });

    function persist(method) {
      var payload = {
        sessionType: 'reaction',
        title: titleInput.value.trim() || t('labReactions'),
        state: {
          solverVersion: 1,
          equation: textarea.value,
          quantities: readQuantities(qtyHost),
          target: targetSelect.value ? { formula: targetSelect.value, unit: targetUnit.value } : undefined,
          actualYield: actual.value !== '' ? { amount: actual.value, unit: actualUnit.value } : undefined
        }
      };
      if (sessionId) payload.id = sessionId;
      var req = sessionId && method !== 'create'
        ? ctx.api.updateSession(payload)
        : ctx.api.createSession(payload);
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
        if (state.equation) textarea.value = state.equation;
        if (state.equation) {
          var data = await ctx.api.balanceReaction({ equation: state.equation });
          applyBalance(data);
          restoreQuantities(state.quantities);
          if (state.target && state.target.formula) targetSelect.value = state.target.formula;
          if (state.target && state.target.unit) targetUnit.value = state.target.unit;
          if (state.actualYield && state.actualYield.amount != null) {
            actual.value = state.actualYield.amount;
            if (state.actualYield.unit) actualUnit.value = state.actualYield.unit;
          }
          if ((state.quantities || []).length) solveBtn.click();
        }
      } catch (_err) {
        var unsupported = el('p', 'ws-lede');
        unsupported.id = 'ws-lab-session-unsupported';
        unsupported.setAttribute('role', 'status');
        unsupported.textContent = t('sessionUnsupported');
        if (err.parentNode) node.insertBefore(unsupported, err);
        else node.appendChild(unsupported);
      }
    }
  }

  window.AtomurusProLabReactions = { mount: mount };
})();
