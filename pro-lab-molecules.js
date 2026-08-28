(function () {
  'use strict';

  function el(tag, className) {
    var node = document.createElement(tag);
    if (className) node.className = className;
    return node;
  }

  async function mount(node, ctx) {
    var t = ctx.t;
    var esc = ctx.escapeHtml;
    var sessionId = ctx.sessionId || '';
    var compared = null;
    var highlight = '';

    node.innerHTML =
      '<p class="ws-kicker"><a href="' + esc(ctx.labHref('home')) + '">' + esc(t('proLab')) + '</a></p>' +
      '<h1 class="ws-title">' + esc(t('labMolecules')) + '</h1>' +
      '<p class="ws-lede">' + esc(t('labMoleculesLede')) + '</p>' +
      '<p class="ws-lede">' + esc(t('noBondMeasure')) + '</p>';

    var catalog = { catalog: [] };
    try {
      catalog = await ctx.api.moleculeCatalog((document.documentElement.lang || '').indexOf('pt') === 0 ? 'pt' : 'en');
    } catch (_err) {}

    function molSelect(id) {
      var select = el('select', 'ws-input');
      select.setAttribute('aria-label', t('molecule'));
      var blank = el('option');
      blank.value = '';
      blank.textContent = t('selectMolecule');
      select.appendChild(blank);
      (catalog.catalog || []).forEach(function (row) {
        var o = el('option');
        o.value = row.id;
        o.textContent = row.formula + ' — ' + row.name;
        if (row.id === id) o.selected = true;
        select.appendChild(o);
      });
      return select;
    }

    var a = molSelect('water');
    var b = molSelect('co2');
    var picks = el('div', 'ws-lab-picks');
    picks.appendChild(a);
    picks.appendChild(b);
    node.appendChild(picks);

    var highlightLabel = el('label', 'ws-lab-field');
    var hs = el('span');
    hs.textContent = t('highlightElement');
    var highlightInput = el('input', 'ws-input');
    highlightInput.maxLength = 2;
    highlightInput.setAttribute('aria-label', t('highlightElement'));
    highlightInput.placeholder = 'O';
    highlightLabel.appendChild(hs);
    highlightLabel.appendChild(highlightInput);
    node.appendChild(highlightLabel);

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
    toSet.textContent = t('addBothToSet');
    var titleInput = el('input', 'ws-input');
    titleInput.maxLength = 120;
    titleInput.setAttribute('aria-label', t('sessionTitle'));
    titleInput.placeholder = t('sessionTitle');
    actions.appendChild(compareBtn);
    actions.appendChild(titleInput);
    actions.appendChild(saveBtn);
    actions.appendChild(toSet);
    node.appendChild(actions);

    var live = el('div');
    live.setAttribute('aria-live', 'polite');
    node.appendChild(live);
    var stage = el('div', 'ws-lab-split');
    node.appendChild(stage);

    function molCard(mol) {
      var card = el('article', 'ws-lab-mol');
      var h = el('h3');
      h.textContent = mol.name + ' · ' + mol.formula;
      card.appendChild(h);
      var iframe = el('iframe', 'ws-lab-frame');
      iframe.title = mol.name;
      iframe.loading = 'lazy';
      iframe.src = '/viewer/molecules.html?mol=' + encodeURIComponent(mol.id);
      card.appendChild(iframe);
      var dl = el('dl', 'ws-lab-dl');
      function add(k, v) {
        var dt = el('dt');
        dt.textContent = k;
        var dd = el('dd');
        dd.textContent = v;
        if (highlight && String(k).toLowerCase() === highlight.toLowerCase()) dd.className = 'is-highlight';
        dl.appendChild(dt);
        dl.appendChild(dd);
      }
      add(t('formula'), mol.formula);
      add(t('labMolarMass'), mol.molarMassDisplay + ' g/mol');
      add(t('atomCount'), String(mol.atomCount));
      (mol.composition || []).forEach(function (row) {
        add(row.symbol, row.count + ' · ' + row.massPercent + '%');
      });
      card.appendChild(dl);
      return card;
    }

    function render(data) {
      compared = data;
      stage.textContent = '';
      (data.molecules || []).forEach(function (mol) {
        stage.appendChild(molCard(mol));
      });
      live.textContent = (data.molecules || []).map(function (m) { return m.formula; }).join(' · ');
    }

    compareBtn.addEventListener('click', function () {
      var ids = [a.value, b.value].filter(Boolean);
      if (!ids.length) return;
      highlight = highlightInput.value.trim();
      ctx.api.compareMolecules({
        moleculeIds: ids,
        lang: (document.documentElement.lang || '').indexOf('pt') === 0 ? 'pt' : 'en'
      }).then(render).catch(function (err) {
        live.textContent = err.message || t('errGenericBody');
      });
    });

    saveBtn.addEventListener('click', function () {
      var ids = [a.value, b.value].filter(Boolean);
      var title = titleInput.value.trim() || t('labMolecules');
      var body = { sessionType: 'molecule_compare', title: title, state: { moleculeIds: ids, highlight: highlightInput.value.trim() } };
      var req = sessionId ? ctx.api.updateSession(Object.assign({ id: sessionId }, body)) : ctx.api.createSession(body);
      req.then(function (data) {
        sessionId = data.session && data.session.id;
        if (ctx.ui && ctx.ui.toast) ctx.ui.toast(t('sessionSaved'));
      }).catch(function (err) {
        if (ctx.ui && ctx.ui.toast) ctx.ui.toast(ctx.t(ctx.logic.uxError(err).bodyKey), { tone: 'danger' });
      });
    });

    toSet.addEventListener('click', function () {
      var mols = (compared && compared.molecules) || [];
      var items = mols.map(function (mol) {
        return { itemType: 'molecule', itemKey: mol.itemKey || mol.id, title: mol.name, href: mol.href };
      });
      if (!items.length) return;
      ctx.saveItemsToSet(items, false).catch(function (err) {
        if (ctx.ui && ctx.ui.toast) ctx.ui.toast(ctx.t(ctx.logic.uxError(err).bodyKey), { tone: 'danger' });
      });
    });

    if (sessionId) {
      try {
        var loaded = await ctx.api.getSession(sessionId);
        var state = (loaded.session && loaded.session.state) || {};
        titleInput.value = loaded.session.title || '';
        if (state.moleculeIds && state.moleculeIds[0]) a.value = state.moleculeIds[0];
        if (state.moleculeIds && state.moleculeIds[1]) b.value = state.moleculeIds[1];
        highlightInput.value = state.highlight || '';
        compareBtn.click();
      } catch (_err) {}
    } else {
      compareBtn.click();
    }
  }

  window.AtomurusProLabMolecules = { mount: mount };
})();
