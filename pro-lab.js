(function () {
  'use strict';

  var SCRIPT_V = '202608282910';
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
      ? '<span class="ws-lab-badge">' + escapeHtml(t('pro')) + '</span>'
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

  function flagshipCard(href, title, lede, points, locked, t, escapeHtml, tool) {
    var lock = locked
      ? '<span class="ws-lab-badge">' + escapeHtml(t('pro')) + '</span>'
      : '';
    var cta = locked
      ? '<span class="ws-btn ws-btn-primary ws-btn-sm">' + escapeHtml(t('seePro')) + '</span>'
      : '<span class="ws-btn ws-btn-primary ws-btn-sm">' + escapeHtml(t('open')) + '</span>';
    return '<a class="ws-lab-card is-flagship' + (locked ? ' is-locked' : '') + '" data-lab-tool="' + escapeHtml(tool || '') + '" href="' + escapeHtml(href) + '">' +
      lock +
      '<h3 class="ws-lab-card-title">' + escapeHtml(title) + '</h3>' +
      '<p class="ws-lab-card-copy">' + escapeHtml(lede) + '</p>' +
      (points ? '<p class="ws-lab-card-copy">' + escapeHtml(points) + '</p>' : '') +
      cta +
      '</a>';
  }

  function solverHomeInner(locked, t, esc) {
    return '<div id="ws-lab-home">' +
      '<p class="ws-kicker">' + esc(t('chemistrySolverKicker')) + '</p>' +
      flagshipCard(labHref('reactions'), t('labReactions'), t('labReactionsLede'), t('labReactionsPoints'), locked, t, esc, 'reactions') +
      '<div class="ws-lab-grid">' +
      card(labHref('formula'), t('labFormula'), t('labFormulaLede'), locked, t, esc, 'formula') +
      card(labHref('solutions'), t('labSolutions'), t('labSolutionsLede'), locked, t, esc, 'solutions') +
      '</div>' +
      '<p class="ws-kicker">' + esc(t('labAnalysis')) + '</p>' +
      '<div class="ws-lab-grid">' +
      card(labHref('calculations'), t('labCalc'), t('labCalcLede'), locked, t, esc, 'calculations') +
      card(labHref('elements'), t('labElements'), t('labElementsLede'), locked, t, esc, 'elements') +
      card(labHref('molecules'), t('labMolecules'), t('labMoleculesLede'), locked, t, esc, 'molecules') +
      card(labHref('atomic'), t('labAtomic'), t('labAtomicLede'), locked, t, esc, 'atomic') +
      '</div></div>';
  }

  function lockedHome(node, ctx) {
    var t = ctx.t;
    var esc = ctx.escapeHtml;
    node.innerHTML =
      '<p class="ws-kicker">' + esc(t('proLabKicker')) + '</p>' +
      '<h1 class="ws-title">' + esc(t('proLab')) + '</h1>' +
      '<p class="ws-lede">' + esc(t('proLabLede')) + '</p>' +
      solverHomeInner(true, t, esc) +
      '<p class="ws-lede">' + esc(t('labLockedBody')) + '</p>' +
      '<a class="ws-btn ws-btn-primary" href="/pricing">' + esc(t('upgrade')) + '</a>';
  }

  function lockedTool(node, ctx, tool) {
    var t = ctx.t;
    var esc = ctx.escapeHtml;
    var title = t('labReactions');
    var body = t('labReactionsPoints');
    if (tool === 'formula') {
      title = t('labFormula');
      body = t('labFormulaLede');
    } else if (tool === 'solutions') {
      title = t('labSolutions');
      body = t('labSolutionsLede');
    }
    node.innerHTML =
      '<p class="ws-kicker"><a href="' + esc(labHref('home')) + '">' + esc(t('proLab')) + '</a></p>' +
      '<p class="ws-lab-badge">' + esc(t('pro')) + '</p>' +
      '<h1 class="ws-title">' + esc(title) + '</h1>' +
      '<p class="ws-lede">' + esc(body) + '</p>' +
      '<a class="ws-btn ws-btn-primary" href="/pricing">' + esc(t('upgrade')) + '</a>';
  }

  function labToast(ctx, message, tone) {
    if (ctx.ui && ctx.ui.toast) ctx.ui.toast(message, { tone: tone || 'success' });
  }

  function renderHome(node, ctx, sessions) {
    var t = ctx.t;
    var esc = ctx.escapeHtml;
    var recent = (sessions || []).slice();
    var list = recent.length
      ? '<ul class="ws-lab-session-list" id="ws-lab-session-list">' + recent.map(function (row) {
        return '<li class="ws-session-card" data-session-id="' + esc(row.id) + '">' +
          '<div><h3 class="ws-item-title"></h3><div class="ws-item-meta"></div></div>' +
          '<div class="ws-item-actions">' +
          '<a class="ws-btn ws-btn-primary ws-btn-sm" href="' + esc(labHref(toolForType(row.sessionType)) + '&session=' + encodeURIComponent(row.id)) + '">' + esc(t('sessionOpen')) + '</a>' +
          '<div class="ws-dropdown"><button type="button" class="ws-btn ws-btn-icon ws-btn-sm" data-session-more aria-haspopup="true" aria-label="' + esc(t('moreActions')) + '">•••</button>' +
          '<div class="ws-menu"><button type="button" data-lab-delete="' + esc(row.id) + '">' + esc(t('delete')) + '</button></div></div>' +
          '</div></li>';
      }).join('') + '</ul>'
      : '<p class="ws-lede">' + esc(t('emptySessions')) + '</p>';
    node.innerHTML =
      '<p class="ws-kicker">' + esc(t('proLabKicker')) + '</p>' +
      '<h1 class="ws-title">' + esc(t('proLab')) + '</h1>' +
      '<p class="ws-lede">' + esc(t('proLabLede')) + '</p>' +
      solverHomeInner(false, t, esc) +
      '<h2 class="ws-h2" id="ws-lab-sessions-heading">' + esc(t('labSessions')) + '</h2>' +
      '<p class="ws-lede">' + esc(t('labSessionsLede')) + '</p>' +
      '<div id="ws-lab-sessions">' + list + '</div>';
    var items = node.querySelectorAll('#ws-lab-sessions .ws-item-title');
    recent.forEach(function (row, i) {
      if (items[i]) items[i].textContent = row.title || t('labSessions');
    });
    var metas = node.querySelectorAll('#ws-lab-sessions .ws-item-meta');
    var lang = (document.documentElement.lang || '').toLowerCase().indexOf('pt') === 0 ? 'pt' : 'en';
    recent.forEach(function (row, i) {
      if (!metas[i]) return;
      var when = ctx.logic && ctx.logic.relativeTime
        ? ctx.logic.relativeTime(row.updatedAt || row.updated_at, Date.now(), lang)
        : '';
      var bits = [typeLabel(row.sessionType, t)];
      if (row.equation) bits.push(row.equation);
      if (when) bits.push(when);
      metas[i].textContent = bits.filter(Boolean).join(' · ');
    });
    node.querySelectorAll('[data-session-more]').forEach(function (btn) {
      btn.addEventListener('click', function (event) {
        event.preventDefault();
        var drop = btn.parentNode;
        drop.classList.toggle('is-open');
      });
    });
    node.querySelectorAll('[data-lab-delete]').forEach(function (btn) {
      btn.addEventListener('click', function () {
        var id = btn.getAttribute('data-lab-delete');
        if (!id || !ctx.api) return;
        var confirm = ctx.ui && ctx.ui.confirmDialog
          ? ctx.ui.confirmDialog({
            title: t('deleteSessionTitle'),
            body: t('deleteSessionBody'),
            confirmLabel: t('delete'),
            cancelLabel: t('cancel'),
            danger: true
          })
          : Promise.resolve(true);
        confirm.then(function (ok) {
          if (!ok) return;
          return ctx.api.deleteSession(id).then(function () {
            var li = btn.closest('[data-session-id]');
            if (li && li.parentNode) li.parentNode.removeChild(li);
            labToast(ctx, t('toastDeleted'));
          });
        }).catch(function (err) {
          labToast(ctx, ctx.t(ctx.logic.uxError(err).bodyKey), 'danger');
        });
      });
    });
  }

  function toolForType(type) {
    if (type === 'element_compare') return 'elements';
    if (type === 'molecule_compare') return 'molecules';
    if (type === 'atomic_compare') return 'atomic';
    if (type === 'reaction') return 'reactions';
    if (type === 'formula_solver') return 'formula';
    if (type === 'solution_builder') return 'solutions';
    return 'calculations';
  }

  function typeLabel(type, t) {
    if (type === 'element_compare') return t('labElements');
    if (type === 'molecule_compare') return t('labMolecules');
    if (type === 'atomic_compare') return t('labAtomic');
    if (type === 'reaction') return t('labReactions');
    if (type === 'formula_solver') return t('labFormula');
    if (type === 'solution_builder') return t('labSolutions');
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
                if (ui.toast) ui.toast(ctx.t(ctx.logic.uxError(err).bodyKey), { tone: 'danger' });
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
              else if (ui.toast) ui.toast(ctx.t('genNone'), { tone: 'info' });
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

    if (tool === 'reactions' && !hasFeature(ctx.user, 'reactionWorkbench')) {
      lockedTool(node, ctx, 'reactions');
      return;
    }
    if (tool === 'formula' && !hasFeature(ctx.user, 'formulaSolver')) {
      lockedTool(node, ctx, 'formula');
      return;
    }
    if (tool === 'solutions' && !hasFeature(ctx.user, 'solutionBuilder')) {
      lockedTool(node, ctx, 'solutions');
      return;
    }

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
      reactions: '/pro-lab-reactions.js?v=' + SCRIPT_V,
      formula: '/pro-lab-formula.js?v=' + SCRIPT_V,
      solutions: '/pro-lab-solutions.js?v=' + SCRIPT_V,
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
      atomic: window.AtomurusProLabAtomic,
      reactions: window.AtomurusProLabReactions,
      formula: window.AtomurusProLabFormula,
      solutions: window.AtomurusProLabSolutions
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
