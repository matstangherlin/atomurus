(function () {
  'use strict';

  function $(id) {
    return document.getElementById(id);
  }

  function auth() {
    return window.AtomurusAuth;
  }

  function escapeHtml(value) {
    return String(value == null ? '' : value)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  async function fetchJson(url, options) {
    var res = await fetch(url, Object.assign({
      credentials: 'include',
      headers: { Accept: 'application/json' }
    }, options || {}));
    var data = await res.json().catch(function () { return {}; });
    if (!res.ok || data.ok === false) {
      var err = new Error(data.error || 'Request failed');
      err.status = res.status;
      err.code = data.code;
      throw err;
    }
    return data;
  }

  function card(label, value) {
    return '<div class="lc-doc-card"><div class="lbl">' +
      escapeHtml(label) +
      '</div><div class="v">' +
      escapeHtml(value) +
      '</div></div>';
  }

  function formatDate(iso) {
    if (!iso) return '—';
    try {
      return new Date(iso).toLocaleDateString(undefined, {
        year: 'numeric', month: 'short', day: 'numeric'
      });
    } catch (_err) {
      return String(iso);
    }
  }

  function planLabel(user) {
    if (!user) return 'free';
    if (user.planSource === 'trial' || user.planSource === 'billing_trial') return 'pro trial';
    if (user.plan === 'admin') return 'admin';
    if (user.isPro) return 'pro';
    return user.plan || 'free';
  }

  function markReady() {
    document.documentElement.classList.remove('auth-pending');
    document.documentElement.classList.add('auth-ready');
  }

  function renderAccount(data) {
    var node = $('app-account');
    var user = data.user || {};
    if ($('aside-plan')) $('aside-plan').textContent = planLabel(user);
    if ($('aside-role')) $('aside-role').textContent = user.role || 'member';
    if (!node) return;
    var displayName = user.displayName || user.fullName || user.username || user.email || 'member';
    var billingLabel = user.billingPeriod && user.billingCurrency
      ? (user.billingPeriod + ' / ' + String(user.billingCurrency).toUpperCase())
      : 'trial or free';
    node.innerHTML = [
      card('name', displayName),
      card('email', user.email || 'unknown'),
      card('plan', planLabel(user)),
      card('billing', billingLabel),
      card('ads', user.adsFree ? 'off (pro)' : 'on'),
      card('trial ends', formatDate(user.trialEndsAt)),
      card('role', user.role || 'member'),
      card('email status', user.emailConfirmed ? 'confirmed' : 'pending')
    ].join('');
  }

  function renderUpgrade(data) {
    var box = $('app-upgrade');
    if (!box) return;
    var user = data.user || {};
    if (user.isPro) {
      box.innerHTML = '<strong>Pro active.</strong> Ads are off on this account' +
        (user.planSource === 'trial' && user.trialEndsAt
          ? ' until ' + escapeHtml(formatDate(user.trialEndsAt)) + '.'
          : '.') +
        ' <a href="/pricing">Manage plans</a>';
      box.classList.remove('warn');
      box.classList.add('ok');
      box.style.display = 'block';
      return;
    }
    box.innerHTML = '<strong>Free account.</strong> Start the included 30-day Pro trial path from Pricing, then keep studying without ads. <a href="/pricing">Compare Free vs Pro</a> · <a href="/login">Create account</a>';
    box.classList.add('warn');
    box.classList.remove('ok');
    box.style.display = 'block';
  }

  function renderDashboard(data) {
    var status = $('app-status');
    if (status && data.access) {
      status.textContent = (data.dashboard && data.dashboard.status) || (data.access.plan + ' / ' + data.access.role);
    }
    renderUpgrade(data);

    var next = $('app-next-steps');
    if (next && data.dashboard && Array.isArray(data.dashboard.nextSteps)) {
      next.innerHTML = data.dashboard.nextSteps.map(function (step) {
        return '<li>' + escapeHtml(step) + '</li>';
      }).join('');
    }

    var modules = $('app-modules');
    if (!modules || !data.dashboard || !Array.isArray(data.dashboard.modules)) return;
    modules.innerHTML = data.dashboard.modules
      .filter(function (item) { return item.state !== 'hidden'; })
      .map(function (item) {
        var state = String(item.state || '');
        var href = item.href || '/pricing';
        return '<a class="lc-doc-card app-module-row" href="' + escapeHtml(href) + '">' +
          '<div>' +
          '<div class="lbl">' + escapeHtml(item.label || item.id) + '</div>' +
          '<div class="v">' + escapeHtml(item.description || item.id) + '</div>' +
          '</div><span class="app-pill ' + escapeHtml(state) + '">' + escapeHtml(state) + '</span></a>';
      })
      .join('');
  }

  function showError() {
    var loading = $('app-loading');
    var error = $('app-error');
    if (loading) loading.style.display = 'none';
    if (error) error.classList.add('show');
    document.documentElement.classList.remove('auth-pending');
    document.documentElement.classList.add('auth-error');
  }

  function initLogout() {
    async function doLogout(event) {
      if (event) event.preventDefault();
      var client = auth();
      if (client) {
        try { await client.logout(); } catch (_err) {}
        client.redirectToLogin(location.pathname + location.search);
        return;
      }
      window.location.replace('/login?next=' + encodeURIComponent('/app'));
    }
    var btn = $('app-logout');
    var aside = $('app-logout-aside');
    if (btn) btn.addEventListener('click', doLogout);
    if (aside) aside.addEventListener('click', doLogout);
  }

  function workspaceNext() {
    return location.pathname + location.search;
  }

  function studySection() {
    try {
      var section = new URLSearchParams(location.search).get('section') || 'overview';
      if (['overview', 'library', 'history', 'notes', 'progress'].indexOf(section) === -1) return 'overview';
      return section;
    } catch (_err) {
      return 'overview';
    }
  }

  function renderStudyNav() {
    var nav = $('app-study-nav');
    if (!nav) return;
    var current = studySection();
    var links = [
      ['overview', 'Overview'],
      ['library', 'Library'],
      ['history', 'History'],
      ['notes', 'Notes'],
      ['progress', 'Continue studying']
    ];
    nav.innerHTML = links.map(function (pair) {
      var cls = pair[0] === current ? 'active' : '';
      return '<a class="' + cls + '" href="/app?section=' + pair[0] + '">' + escapeHtml(pair[1]) + '</a>';
    }).join('');
  }

  function itemCard(item) {
    var href = item.href || '/app';
    var title = item.title || item.itemKey || 'item';
    var note = item.note ? '<div class="v">' + escapeHtml(item.note) + '</div>' : '';
    var tags = Array.isArray(item.tags) && item.tags.length
      ? '<div class="v">' + escapeHtml(item.tags.join(', ')) + '</div>'
      : '';
    return '<a class="lc-doc-card app-module-row" href="' + escapeHtml(href) + '"><div>' +
      '<div class="lbl">' + escapeHtml(title) + '</div>' +
      '<div class="v">' + escapeHtml(item.itemType || '') + '</div>' +
      note + tags +
      '</div></a>';
  }

  function progressCard(row) {
    var href = row.lastPosition || '/app';
    return '<a class="lc-doc-card app-module-row" href="' + escapeHtml(href) + '"><div>' +
      '<div class="lbl">' + escapeHtml(row.contentKey || row.contentType || 'progress') + '</div>' +
      '<div class="v">' + escapeHtml(String(row.progress || 0) + '% · ' + (row.status || '')) + '</div>' +
      '</div></a>';
  }

  function showStudyLocked(node, err) {
    node.innerHTML = '<div class="app-study-empty">' +
      escapeHtml('Study Cloud is included with Atomurus Pro.') +
      ' <a href="' + escapeHtml((err && err.upgradeUrl) || '/pricing') + '">See plans</a></div>';
  }

  async function loadStudyCloud(user) {
    renderStudyNav();
    var node = $('app-study');
    if (!node) return;
    if (!user || !user.isPro) {
      showStudyLocked(node, { upgradeUrl: '/pricing' });
      return;
    }
    var api = window.AtomurusStudy;
    if (!api) {
      node.innerHTML = '<div class="app-study-empty">Study Cloud client is unavailable.</div>';
      return;
    }
    var section = studySection();
    try {
      if (section === 'overview') {
        var overview = await api.overview();
        var counts = overview.counts || {};
        node.innerHTML =
          '<div class="lc-doc-cards">' +
          card('saved items', String(counts.items || 0)) +
          card('notes', String(counts.notes || 0)) +
          card('in progress', String(counts.inProgress || 0)) +
          card('calculator runs', String(counts.calculator || 0)) +
          '</div>' +
          '<p class="lbl">Continue studying</p>' +
          (overview.continueStudying && overview.continueStudying.length
            ? overview.continueStudying.map(progressCard).join('')
            : '<div class="app-study-empty">Nothing in progress yet.</div>') +
          '<p class="lbl">Recent library</p>' +
          (overview.recentItems && overview.recentItems.length
            ? overview.recentItems.map(itemCard).join('')
            : '<div class="app-study-empty">Save an element, molecule or article to fill this shelf.</div>');
        return;
      }
      if (section === 'library') {
        var library = await api.items({ exclude: 'calculator', limit: 40 });
        node.innerHTML = library.items && library.items.length
          ? library.items.map(itemCard).join('')
          : '<div class="app-study-empty">Your library is empty.</div>';
        return;
      }
      if (section === 'history') {
        var history = await api.items({ type: 'calculator', limit: 40 });
        node.innerHTML = history.items && history.items.length
          ? history.items.map(itemCard).join('')
          : '<div class="app-study-empty">No calculator runs saved yet.</div>';
        return;
      }
      if (section === 'notes') {
        var notes = await api.items({ hasNote: '1', limit: 40 });
        node.innerHTML = notes.items && notes.items.length
          ? notes.items.map(itemCard).join('')
          : '<div class="app-study-empty">No notes yet.</div>';
        return;
      }
      var progress = await api.progressList({ limit: 40 });
      node.innerHTML = progress.items && progress.items.length
        ? progress.items.map(progressCard).join('')
        : '<div class="app-study-empty">No study progress yet.</div>';
    } catch (err) {
      if (err && (err.status === 401 || err.code === 'session_expired')) throw err;
      if (err && (err.status === 403 || err.code === 'feature_locked')) {
        showStudyLocked(node, err);
        return;
      }
      node.innerHTML = '<div class="app-study-empty">' + escapeHtml((err && err.message) || 'Could not load Study Cloud.') + '</div>';
    }
  }

  async function loadWorkspace() {
    var client = auth();
    if (!client) {
      window.location.replace('/login?next=' + encodeURIComponent('/app'));
      return;
    }
    try {
      await client.requireSession({ next: workspaceNext() });
      var me = { user: client.getCurrentUser() };
      renderAccount(me);
      var dash = await fetchJson('/api/private/dashboard');
      renderDashboard(dash);
      await loadStudyCloud(me.user);
      var loading = $('app-loading');
      if (loading) loading.style.display = 'none';
      markReady();
    } catch (err) {
        if (err && (err.status === 401 || err.status === 404 || err.code === 'session_expired')) {
        client.redirectToLogin(workspaceNext());
        return;
      }
      showError();
    }
  }

  function boot() {
    initLogout();
    void loadWorkspace();
  }

  window.addEventListener('pageshow', function (event) {
    if (!event.persisted) return;
    var client = auth();
    if (!client) return;
    client.getSession({ force: true }).then(function (session) {
      if (!session.signedIn) client.redirectToLogin(workspaceNext());
    }).catch(function (err) {
      if (err && (err.status === 0 || err.code === 'network' || err.status >= 500)) return;
      client.redirectToLogin(workspaceNext());
    });
  });

  document.addEventListener('DOMContentLoaded', boot);
})();
