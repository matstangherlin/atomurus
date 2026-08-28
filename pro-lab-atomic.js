(function () {
  'use strict';

  function el(tag, className) {
    var node = document.createElement(tag);
    if (className) node.className = className;
    return node;
  }

  function shellSvg(shells) {
    var wrap = el('div', 'ws-lab-bohr');
    wrap.setAttribute('role', 'img');
    wrap.setAttribute('aria-label', (shells || []).join(' · '));
    var svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    svg.setAttribute('viewBox', '0 0 160 160');
    svg.setAttribute('width', '160');
    svg.setAttribute('height', '160');
    var cx = 80;
    var cy = 80;
    var nucleus = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
    nucleus.setAttribute('cx', cx);
    nucleus.setAttribute('cy', cy);
    nucleus.setAttribute('r', '8');
    nucleus.setAttribute('fill', 'currentColor');
    svg.appendChild(nucleus);
    (shells || []).forEach(function (count, index) {
      var r = 18 + index * 14;
      var orbit = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
      orbit.setAttribute('cx', cx);
      orbit.setAttribute('cy', cy);
      orbit.setAttribute('r', String(r));
      orbit.setAttribute('fill', 'none');
      orbit.setAttribute('stroke', 'currentColor');
      orbit.setAttribute('stroke-opacity', '0.35');
      svg.appendChild(orbit);
      var n = Math.max(0, Number(count) || 0);
      for (var i = 0; i < n && i < 32; i += 1) {
        var ang = (i / n) * Math.PI * 2;
        var dot = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
        dot.setAttribute('cx', String(cx + r * Math.cos(ang)));
        dot.setAttribute('cy', String(cy + r * Math.sin(ang)));
        dot.setAttribute('r', '3');
        dot.setAttribute('fill', 'currentColor');
        svg.appendChild(dot);
      }
    });
    wrap.appendChild(svg);
    return wrap;
  }

  function zSelect(value, label) {
    var select = el('select', 'ws-input');
    select.setAttribute('aria-label', label || 'Z');
    for (var z = 1; z <= 118; z += 1) {
      var o = el('option');
      o.value = String(z);
      o.textContent = String(z);
      if (z === value) o.selected = true;
      select.appendChild(o);
    }
    return select;
  }

  async function mount(node, ctx) {
    var t = ctx.t;
    var esc = ctx.escapeHtml;
    var sessionId = ctx.sessionId || '';
    var compared = null;

    node.innerHTML =
      '<p class="ws-kicker"><a href="' + esc(ctx.labHref('home')) + '">' + esc(t('proLab')) + '</a></p>' +
      '<h1 class="ws-title">' + esc(t('labAtomic')) + '</h1>' +
      '<p class="ws-lede">' + esc(t('labAtomicLede')) + '</p>';

    var a = zSelect(11, t('atomicNo'));
    var b = zSelect(17, t('atomicNo'));
    var picks = el('div', 'ws-lab-picks');
    picks.appendChild(a);
    picks.appendChild(b);
    node.appendChild(picks);

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
    toSet.textContent = t('addElementsToSet');
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

    function atomCard(item) {
      var card = el('article', 'ws-lab-mol');
      var h = el('h3');
      h.textContent = item.name + ' · ' + item.symbol;
      card.appendChild(h);
      var z = el('p', 'ws-lab-z');
      z.textContent = String(item.atomicNumber);
      card.appendChild(z);
      card.appendChild(shellSvg(item.shells));
      var p = el('p');
      p.textContent = (item.shells || []).join(' · ');
      card.appendChild(p);
      var cfg = el('p');
      cfg.textContent = item.electronConfig || '—';
      card.appendChild(cfg);
      return card;
    }

    function render(data) {
      compared = data;
      stage.textContent = '';
      (data.elements || []).forEach(function (item) {
        stage.appendChild(atomCard(item));
      });
      live.textContent = (data.elements || []).map(function (item) { return item.symbol; }).join(' · ');
    }

    compareBtn.addEventListener('click', function () {
      ctx.api.compareAtomic({
        atomicNumbers: [Number(a.value), Number(b.value)],
        lang: (document.documentElement.lang || '').indexOf('pt') === 0 ? 'pt' : 'en'
      }).then(render).catch(function (err) {
        live.textContent = err.message || t('errGenericBody');
      });
    });

    saveBtn.addEventListener('click', function () {
      var title = titleInput.value.trim() || t('labAtomic');
      var body = {
        sessionType: 'atomic_compare',
        title: title,
        state: { atomicNumbers: [Number(a.value), Number(b.value)] }
      };
      var req = sessionId ? ctx.api.updateSession(Object.assign({ id: sessionId }, body)) : ctx.api.createSession(body);
      req.then(function (data) {
        sessionId = data.session && data.session.id;
        if (ctx.ui && ctx.ui.toast) ctx.ui.toast(t('sessionSaved'));
      }).catch(function (err) {
        if (ctx.ui && ctx.ui.toast) ctx.ui.toast(ctx.t(ctx.logic.uxError(err).bodyKey), 'danger');
      });
    });

    toSet.addEventListener('click', function () {
      var items = ((compared && compared.elements) || []).map(function (item) {
        return { itemType: 'element', itemKey: item.itemKey || item.latin, title: item.name, href: item.href };
      }).filter(function (item) { return item.itemKey; });
      if (!items.length) return;
      ctx.saveItemsToSet(items, false).catch(function (err) {
        if (ctx.ui && ctx.ui.toast) ctx.ui.toast(ctx.t(ctx.logic.uxError(err).bodyKey), 'danger');
      });
    });

    if (sessionId) {
      try {
        var loaded = await ctx.api.getSession(sessionId);
        var state = (loaded.session && loaded.session.state) || {};
        titleInput.value = loaded.session.title || '';
        if (state.atomicNumbers && state.atomicNumbers[0]) a.value = String(state.atomicNumbers[0]);
        if (state.atomicNumbers && state.atomicNumbers[1]) b.value = String(state.atomicNumbers[1]);
      } catch (_err) {}
    }
    compareBtn.click();
  }

  window.AtomurusProLabAtomic = { mount: mount };
})();
