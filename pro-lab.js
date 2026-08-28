(function () {
  'use strict';

  var SCRIPT_V = '202608280700';
  var loaded = {};

  function loadScript(src) {
    if (loaded[src]) return loaded[src];
    loaded[src] = new Promise(function (resolve, reject) {
      var existing = document.querySelector('script[data-pro-lab-src="' + src + '"]');
      if (existing) {
        if (existing.getAttribute('data-ready') === '1') return resolve();
        existing.addEventListener('load', function () { resolve(); });
        existing.addEventListener('error', reject);
        return;
      }
      var s = document.createElement('script');
      s.src = src;
      s.defer = true;
      s.setAttribute('data-pro-lab-src', src);
      s.onload = function () {
        s.setAttribute('data-ready', '1');
        resolve();
      };
      s.onerror = reject;
      document.head.appendChild(s);
    });
    return loaded[src];
  }

  function hasFeature(user, key) {
    if (window.AtomurusWorkspace && window.AtomurusWorkspace.hasFeature) {
      return window.AtomurusWorkspace.hasFeature(user, key);
    }
    return Boolean(user && user.isPro);
  }

  function toolFromQuery() {
    if (window.AtomurusWorkspace && window.AtomurusWorkspace.labToolFromQuery) {
      return window.AtomurusWorkspace.labToolFromQuery(location.search);
    }
    try {
      return String(new URLSearchParams(location.search).get('tool') || 'home').toLowerCase();
    } catch (_err) {
      return 'home';
    }
  }

  function labHref(tool) {
    if (window.AtomurusWorkspace && window.AtomurusWorkspace.labHref) {
      return window.AtomurusWorkspace.labHref(tool);
    }
    if (!tool || tool === 'home') return '/app?section=pro-lab';
    return '/app?section=pro-lab&tool=' + encodeURIComponent(tool);
  }

  function sessionIdFromQuery() {
    try {
      return String(new URLSearchParams(location.search).get('session') || '').trim();
    } catch (_err) {
      return '';
    }
  }

  function card(href, title, lede, locked, t, escapeHtml, tool) {
    var lock = locked
      ? '<span class="ws-lab-badge">' + escapeHtml(t('pro')) + ' 🔒</span>'
      : '';
    var cta = locked
      ? '<span class="ws-btn ws-btn-secondary ws-btn-sm">' + escapeHtml(t('seePro')) + '</span>'
      : '<span class="ws-btn ws-btn-primary ws-btn-sm">' + escapeHtml(t('open')) + '</span>';
    return '<a class="ws-lab-card' + (locked ? ' is-locked' : '') + '" data-lab-tool="' + escapeHtml(tool || '') + '" href="' + escapeHtml(href) + '">' +
      lock +
      '<h3 class="ws-lab-card-title">' + escapeHtml(title) + '</h3>' +
      '<p class="ws-lab-card-copy">' + escapeHtml(lede) + '</p>' +
      cta +
      '</a>';
  }

  function lockedHome(node, ctx) {
    var t = ctx.t;
    var esc = ctx.escapeHtml;
    node.innerHTML =
      '<p class="ws-kicker">' + esc(t('proLabKicker')) + '</p>' +
      '<h1 class="ws-title">' + esc(t('proLab')) + '</h1>' +
      '<p class="ws-lede">' + esc(t('proLabLede')) + '</p>' +
      '<div class="ws-lab-grid" id="ws-lab-home">' +
      card(labHref('calculations'), t('labCalc'), t('labCalcLede'), true, t, esc, 'calculations') +
      card(labHref('elements'), t('labElements'), t('labElementsLede'), true, t, esc, 'elements') +
      card(labHref('molecules'), t('labMolecules'), t('labMoleculesLede'), true, t, esc, 'molecules') +
      card(labHref('atomic'), t('labAtomic'), t('labAtomicLede'), true, t, esc, 'atomic') +
      '</div>' +
      '<p class="ws-lede">' + esc(t('labLockedBody')) + '</p>' +
      '<a class="ws-btn ws-btn-primary" href="/pricing">' + esc(t('upgrade')) + '</a>';
  }

  function renderHome(node, ctx, sessions) {
    var t = ctx.t;
    var esc = ctx.escapeHtml;
    var recent = (sessions || []).slice();
    var list = recent.length
      ? '<ul class="ws-lab-session-list" id="ws-lab-session-list">' + recent.map(function (row) {
        return '<li data-session-id="' + esc(row.id) + '"><a href="' + esc(labHref(toolForType(row.sessionType)) + '&session=' + encodeURIComponent(row.id)) + '">' +
          '<strong></strong><span class="ws-item-meta"></span></a>' +
          '<button type="button" class="ws-btn ws-btn-sm" data-lab-delete="' + esc(row.id) + '">' + esc(t('delete')) + '</button></li>';
      }).join('') + '</ul>'
      : '<p class="ws-lede">' + esc(t('emptySessions')) + '</p>';
    node.innerHTML =
      '<p class="ws-kicker">' + esc(t('proLabKicker')) + '</p>' +
      '<h1 class="ws-title">' + esc(t('proLab')) + '</h1>' +
      '<p class="ws-lede">' + esc(t('proLabLede')) + '</p>' +
      '<div class="ws-lab-grid" id="ws-lab-home">' +
      card(labHref('calculations'), t('labCalc'), t('labCalcLede'), false, t, esc, 'calculations') +
      card(labHref('elements'), t('labElements'), t('labElementsLede'), false, t, esc, 'elements') +
      card(labHref('molecules'), t('labMolecules'), t('labMoleculesLede'), false, t, esc, 'molecules') +
      card(labHref('atomic'), t('labAtomic'), t('labAtomicLede'), false, t, esc, 'atomic') +
      '</div>' +
      '<h2 class="ws-h2" id="ws-lab-sessions-heading">' + esc(t('labSessions')) + '</h2>' +
      '<p class="ws-lede">' + esc(t('labSessionsLede')) + '</p>' +
      '<div id="ws-lab-sessions">' + list + '</div>';
    var items = node.querySelectorAll('#ws-lab-sessions strong');
    recent.forEach(function (row, i) {
      if (items[i]) items[i].textContent = row.title || t('labSessions');
    });
    var metas = node.querySelectorAll('#ws-lab-sessions .ws-item-meta');
    recent.forEach(function (row, i) {
      if (metas[i]) metas[i].textContent = typeLabel(row.sessionType, t);
    });
    node.querySelectorAll('[data-lab-delete]').forEach(function (btn) {
      btn.addEventListener('click', function () {
        var id = btn.getAttribute('data-lab-delete');
        if (!id || !ctx.api) return;
        ctx.api.deleteSession(id).then(function () {
          var li = btn.closest('li');
          if (li && li.parentNode) li.parentNode.removeChild(li);
          if (ctx.ui && ctx.ui.toast) ctx.ui.toast(t('toastDeleted'));
        }).catch(function (err) {
          if (ctx.ui && ctx.ui.toast) ctx.ui.toast(ctx.t(ctx.logic.uxError(err).bodyKey), 'danger');
        });
      });
    });
  }

  function toolForType(type) {
    if (type === 'element_compare') return 'elements';
    if (type === 'molecule_compare') return 'molecules';
    if (type === 'atomic_compare') return 'atomic';
    return 'calculations';
  }

  function typeLabel(type, t) {
    if (type === 'element_compare') return t('labElements');
    if (type === 'molecule_compare') return t('labMolecules');
    if (type === 'atomic_compare') return t('labAtomic');
    return t('labCalc');
  }

  function promptSet(ctx, onPick) {
    var ui = ctx.ui || window.AtomurusWorkspaceUI;
    var study = ctx.study || window.AtomurusStudy;
    if (!ui || !study) return Promise.reject(new Error('workspace'));
    return study.listSets(true).then(function (data) {
      var sets = (data && data.sets) || [];
      var body = document.createElement('div');
      var label = document.createElement('label');
      label.textContent = ctx.t('setsTitle');
      var select = document.createElement('select');
      select.className = 'ws-input';
      if (!sets.length) {
        var empty = document.createElement('p');
        empty.textContent = ctx.t('emptySetsBody');
        body.appendChild(empty);
      } else {
        sets.forEach(function (set) {
          var opt = document.createElement('option');
          opt.value = set.id;
          opt.textContent = set.title;
          select.appendChild(opt);
        });
        body.appendChild(label);
        body.appendChild(select);
      }
      var name = document.createElement('input');
      name.className = 'ws-input';
      name.maxLength = 120;
      name.setAttribute('aria-label', ctx.t('setName'));
      name.placeholder = ctx.t('setName');
      body.appendChild(name);
      ui.openDialog({
        title: ctx.t('addToSet'),
        bodyNode: body,
        actions: [
          { label: ctx.t('cancel') },
          {
            label: ctx.t('createSet'),
            kind: 'ws-btn-secondary',
            close: false,
            onClick: function () {
              var title = name.value.trim();
              if (!title) return;
              study.createSet({ title: title }).then(function (res) {
                ui.closeDialog();
                onPick(res.set.id);
              }).catch(function (err) {
                if (ui.toast) ui.toast(ctx.t(ctx.logic.uxError(err).bodyKey), 'danger');
              });
            }
          },
          {
            label: ctx.t('addToSet'),
            kind: 'ws-btn-primary',
            close: false,
            autofocus: true,
            onClick: function () {
              if (!select.value) return;
              ui.closeDialog();
              onPick(select.value);
            }
          }
        ]
      });
    });
  }

  function saveItemsToSet(ctx, items, thenGenerate) {
    var study = ctx.study || window.AtomurusStudy;
    var ui = ctx.ui || window.AtomurusWorkspaceUI;
    if (!study) return Promise.resolve();
    return Promise.all(items.map(function (item) {
      return study.saveItem(item).then(function (res) { return res.item; });
    })).then(function (saved) {
      return new Promise(function (resolve, reject) {
        promptSet(ctx, function (setId) {
          Promise.all(saved.map(function (item) {
            return study.addSetItem({ setId: setId, itemId: item.id });
          })).then(function () {
            if (ui.toast) ui.toast(ctx.t('toastAdded'));
            if (!thenGenerate) {
              resolve({ setId: setId, items: saved });
              return;
            }
            return study.generateCards({
              setId: setId,
              itemIds: saved.map(function (item) { return item.id; })
            }).then(function (data) {
              var fb = ctx.logic.generateCardsFeedback(data);
              if (fb.kind === 'created' && ui.toast) ui.toast(ctx.t('genCreated', '', { n: fb.created }));
              else if (ui.toast) ui.toast(ctx.t('genNone'), 'info');
              resolve({ setId: setId, items: saved, cards: data });
            });
          }).catch(reject);
        });
      });
    });
  }

  async function mount(node, ctx) {
    if (!node) return;
    ctx = ctx || {};
    ctx.t = ctx.t || function (k) { return k; };
    ctx.escapeHtml = ctx.escapeHtml || function (v) { return String(v == null ? '' : v); };
    ctx.logic = ctx.logic || window.AtomurusWorkspace || {};
    ctx.ui = ctx.ui || window.AtomurusWorkspaceUI;
    ctx.study = ctx.study || window.AtomurusStudy;
    ctx.saveItemsToSet = function (items, gen) { return saveItemsToSet(ctx, items, gen); };
    ctx.labHref = labHref;
    ctx.sessionId = sessionIdFromQuery();

    var locked = !hasFeature(ctx.user, 'proLab');
    var tool = toolFromQuery();
    if (tool === 'home' || !tool) tool = 'home';

    if (locked) {
      lockedHome(node, ctx);
      return;
    }

    await loadScript('/pro-lab-client.js?v=' + SCRIPT_V);
    ctx.api = window.AtomurusProLabApi;

    if (tool === 'home') {
      node.innerHTML = '<p class="ws-kicker">' + ctx.escapeHtml(ctx.t('proLabKicker')) + '</p><h1 class="ws-title">' + ctx.escapeHtml(ctx.t('proLab')) + '</h1>';
      var sessions = [];
      try {
        var data = await ctx.api.listSessions();
        sessions = data.sessions || [];
      } catch (_err) {
        sessions = [];
      }
      renderHome(node, ctx, sessions);
      return;
    }

    var map = {
      calculations: '/pro-lab-calculations.js?v=' + SCRIPT_V,
      elements: '/pro-lab-elements.js?v=' + SCRIPT_V,
      molecules: '/pro-lab-molecules.js?v=' + SCRIPT_V,
      atomic: '/pro-lab-atomic.js?v=' + SCRIPT_V,
      sessions: '/pro-lab-calculations.js?v=' + SCRIPT_V
    };
    if (tool === 'sessions') {
      try {
        var listed = await ctx.api.listSessions();
        renderHome(node, ctx, listed.sessions || []);
      } catch (err) {
        node.textContent = ctx.t('errGenericBody');
      }
      return;
    }
    var src = map[tool];
    if (!src) {
      renderHome(node, ctx, []);
      return;
    }
    await loadScript('/pro-lab-client.js?v=' + SCRIPT_V);
    ctx.api = window.AtomurusProLabApi;
    await loadScript(src);
    var runners = {
      calculations: window.AtomurusProLabCalculations,
      elements: window.AtomurusProLabElements,
      molecules: window.AtomurusProLabMolecules,
      atomic: window.AtomurusProLabAtomic
    };
    var runner = runners[tool];
    if (runner && typeof runner.mount === 'function') {
      await runner.mount(node, ctx);
    }
  }

  window.AtomurusProLab = {
    mount: mount,
    labHref: labHref,
    hasFeature: hasFeature
  };
})();
