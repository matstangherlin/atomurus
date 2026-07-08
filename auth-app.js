(function () {
  'use strict';

  function $(id) {
    return document.getElementById(id);
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
      headers: { 'Accept': 'application/json' }
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

  function refreshSession() {
    return fetchJson('/api/auth/refresh', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: '{}'
    });
  }

  // Try a request; on 401 attempt a single refresh, then retry once.
  async function withRefresh(request) {
    try {
      return await request();
    } catch (err) {
      if (err.status === 401) {
        await refreshSession();
        return request();
      }
      throw err;
    }
  }

  function card(label, value) {
    return '<div class="lc-doc-card"><div class="lbl">' +
      escapeHtml(label) +
      '</div><div class="v">' +
      escapeHtml(value) +
      '</div></div>';
  }

  function renderAccount(data) {
    var node = $('app-account');
    var user = data.user || {};
    if ($('aside-plan')) $('aside-plan').textContent = user.plan || 'free';
    if ($('aside-role')) $('aside-role').textContent = user.role || 'member';
    if (!node) return;
    node.innerHTML = [
      card('email', user.email || 'unknown'),
      card('plan', user.plan || 'free'),
      card('role', user.role || 'member'),
      card('email status', user.emailConfirmed ? 'confirmed' : 'pending')
    ].join('');
  }

  function renderDashboard(data) {
    var status = $('app-status');
    if (status && data.access) {
      status.textContent = data.access.plan + ' / ' + data.access.role;
    }
    var modules = $('app-modules');
    if (!modules || !data.dashboard || !Array.isArray(data.dashboard.modules)) return;
    modules.innerHTML = data.dashboard.modules
      .filter(function (item) { return item.state !== 'hidden'; })
      .map(function (item) {
        var state = String(item.state || '');
        return '<div class="lc-doc-card app-module-row"><div>' +
          '<div class="lbl">' + escapeHtml(item.label || item.id) + '</div>' +
          '<div class="v">' + escapeHtml(item.id) + '</div>' +
          '</div><span class="app-pill ' + escapeHtml(state) + '">' + escapeHtml(state) + '</span></div>';
      })
      .join('');
  }

  function showError() {
    var loading = $('app-loading');
    var error = $('app-error');
    if (loading) loading.style.display = 'none';
    if (error) error.classList.add('show');
  }

  function initLogout() {
    async function doLogout(event) {
      if (event) event.preventDefault();
      try {
        await fetchJson('/api/auth/logout', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: '{}'
        });
      } catch (_err) {
        // Cookies are cleared server-side when reachable; redirect regardless.
      }
      window.location.assign('/login');
    }
    var btn = $('app-logout');
    var aside = $('app-logout-aside');
    if (btn) btn.addEventListener('click', doLogout);
    if (aside) aside.addEventListener('click', doLogout);
  }

  async function boot() {
    initLogout();
    try {
      var me = await withRefresh(function () { return fetchJson('/api/auth/me'); });
      renderAccount(me);
      var dash = await withRefresh(function () { return fetchJson('/api/private/dashboard'); });
      renderDashboard(dash);
      var loading = $('app-loading');
      if (loading) loading.style.display = 'none';
    } catch (err) {
      if (err.status === 401) {
        window.location.replace('/login');
        return;
      }
      showError();
    }
  }

  document.addEventListener('DOMContentLoaded', boot);
})();
