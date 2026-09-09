/* Atomurus global navigation — one sidebar, one config, desktop + mobile.
   Markup lives in templates/chrome/public-sidebar.html and app.html.
   This file paints active state, auth foot, and the mobile drawer. */
(function (root) {
  'use strict';

  var LAB_NAV = [
    ['/', 'homeNav', 'home'],
    ['/periodic-table.html', 'periodicNav', 'periodic'],
    ['/viewer/atomic-models.html', 'viewerNav', 'viewer'],
    ['/calculators.html', 'calculatorsNav', 'calculators'],
    ['/explore.html', 'exploreNav', 'explore'],
    ['/app', 'workspaceNav', 'progress']
  ];
  var WORKSPACE_NAV = [['/app', 'workspaceNav', 'progress']];
  var SITE_NAV = LAB_NAV;

  var ICONS = {
    account: '<svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true"><g stroke="currentColor" stroke-width="1.3" stroke-linecap="round" stroke-linejoin="round" fill="none"><path d="M8 8a2.5 2.5 0 1 0 0-5 2.5 2.5 0 0 0 0 5zM3.5 13.5c.6-2.2 2.3-3.5 4.5-3.5s3.9 1.3 4.5 3.5"/></g></svg>',
    plan: '<svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true"><g stroke="currentColor" stroke-width="1.3" stroke-linecap="round" stroke-linejoin="round" fill="none"><path d="M4 5h8v8H4zM6 3v2M10 3v2"/></g></svg>',
    logout: '<svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true"><g stroke="currentColor" stroke-width="1.3" stroke-linecap="round" stroke-linejoin="round" fill="none"><path d="M6 3H3.5A1.5 1.5 0 0 0 2 4.5v7A1.5 1.5 0 0 0 3.5 13H6M10 11l3-3-3-3M13 8H6"/></g></svg>'
  };

  function sidebar() {
    return document.querySelector('[data-atomurus-sidebar], #ws-sidebar');
  }

  function t(key, fallback) {
    try {
      if (root.I18N && typeof root.I18N.t === 'function') {
        var v = root.I18N.t(key);
        if (v != null && v !== '') return v;
      }
    } catch (e) {}
    return fallback;
  }

  function applyI18n(node) {
    try {
      if (root.I18N && typeof root.I18N.apply === 'function') root.I18N.apply(node);
    } catch (e) {}
  }

  function authState() {
    if (root.__ATOMURUS_AUTH__ && root.__ATOMURUS_AUTH__.ready) return root.__ATOMURUS_AUTH__;
    if (root.AtomurusAuth && typeof root.AtomurusAuth.getState === 'function') {
      var managed = root.AtomurusAuth.getState();
      if (managed && managed.ready) return managed;
    }
    return root.__ATOMURUS_ADS__ || null;
  }

  function guestLoginHref() {
    var path = location.pathname || '/';
    if (/\/(login|signup)(?:\.html)?$/i.test(path)) return '/login';
    return '/login?next=' + encodeURIComponent((location.pathname || '/') + (location.search || ''));
  }

  function pathname() {
    return (location.pathname || '/').replace(/\/+$/, '') || '/';
  }

  function isHtml(path, name) {
    return path === '/' + name || path === '/' + name + '.html';
  }

  function matchNav(path) {
    var here = (path || pathname()).toLowerCase();
    if (here === '' || here === '/' || isHtml(here, 'index')) return 'home';
    if (here.indexOf('/periodic-table') !== -1) return 'periodic';
    if (here.indexOf('/viewer/') !== -1 || here.indexOf('/viewer') !== -1) return 'viewer';
    if (here.indexOf('/calculators') !== -1) return 'calculators';
    if (here.indexOf('/explore') !== -1) return 'explore';
    if (here === '/app' || /\/app(?:\.html)?$/.test(here)) return 'workspace';
    if (here.indexOf('/pricing') !== -1) return '';
    if (here.indexOf('/config') !== -1) return '';
    if (here.indexOf('/login') !== -1 || here.indexOf('/signup') !== -1) return '';
    if (here.indexOf('/about') !== -1 || here.indexOf('/contact') !== -1) return '';
    return '';
  }

  function matchLocalViewer(path) {
    var here = (path || pathname()).toLowerCase();
    if (here.indexOf('isomerism') !== -1) return 'isomerism';
    if (here.indexOf('allotropes') !== -1) return 'allotropes';
    if (here.indexOf('molecules') !== -1) return 'molecules';
    if (here.indexOf('atomic-models') !== -1) return 'atomic-models';
    return '';
  }

  function markActive(rootEl) {
    var host = rootEl || sidebar();
    if (!host) return;
    var id = matchNav();
    var links = host.querySelectorAll('[data-atomurus-lab-nav] a[data-nav], #ws-nav-main a[data-nav]');
    if (!links.length) links = host.querySelectorAll('#ws-nav-main a[href], .ws-nav-site a[href]');
    Array.prototype.forEach.call(links, function (a) {
      var nav = a.getAttribute('data-nav');
      var on = nav ? nav === id : false;
      a.classList.toggle('is-active', on);
      a.classList.toggle('active', on);
      if (on) a.setAttribute('aria-current', 'page');
      else a.removeAttribute('aria-current');
    });
    var local = matchLocalViewer();
    document.querySelectorAll('[data-atomurus-local-nav="viewer"] a[data-local-nav], .vz-tabs a[href]').forEach(function (a) {
      var key = a.getAttribute('data-local-nav');
      if (!key) {
        var href = (a.getAttribute('href') || '').toLowerCase();
        if (href.indexOf('isomerism') !== -1) key = 'isomerism';
        else if (href.indexOf('allotropes') !== -1) key = 'allotropes';
        else if (href.indexOf('molecules') !== -1) key = 'molecules';
        else if (href.indexOf('atomic-models') !== -1) key = 'atomic-models';
      }
      var on = Boolean(local && key === local);
      a.classList.toggle('active', on);
      a.classList.toggle('is-active', on);
      if (on) a.setAttribute('aria-current', 'page');
      else a.removeAttribute('aria-current');
    });
  }

  function planKind(user) {
    if (!user) return 'guest';
    if (user.plan === 'admin' || user.role === 'admin') return 'admin';
    if (user.planSource === 'trial' || user.planSource === 'billing_trial') return 'trial';
    if (user.isPro) return 'pro';
    return 'free';
  }

  function item(nav, href, i18nKey, fallback, extraClass, icon, attrs) {
    return '<a class="ws-nav-item' + (extraClass ? ' ' + extraClass : '') + '" href="' + href + '" data-nav="' + nav + '"' + (attrs || '') + '>' +
      (icon || ICONS.account) +
      '<span class="ws-nav-label" data-i18n="' + i18nKey + '">' + fallback + '</span></a>';
  }

  function paintFoot(opts) {
    var foot = document.getElementById('ws-nav-foot') || document.querySelector('[data-atomurus-nav-foot]');
    if (!foot) return;
    opts = opts || {};
    var state = opts.state || authState();
    var pending = !(state && state.ready);
    if (typeof opts.pending === 'boolean') pending = opts.pending;
    var signedIn = Boolean(!pending && state && state.signedIn && state.user);
    var user = signedIn ? (state.user || opts.user) : null;
    if (opts.user && opts.user !== undefined && !pending) {
      user = opts.user;
      signedIn = Boolean(user);
    }
    var kind = planKind(user);
    var accountActive = Boolean(opts.accountActive);
    if (!accountActive) {
      try {
        accountActive = new URLSearchParams(location.search).get('section') === 'account' && matchNav() === 'workspace';
      } catch (e) {}
    }

    if (pending || !signedIn) {
      foot.innerHTML =
        item('account', guestLoginHref(), 'common.nav.login', 'Account', '', ICONS.account, ' data-auth-nav-link="common.nav.login"') +
        item('plans', '/pricing', 'common.nav.plans', 'Plans', '', ICONS.plan, '');
      applyI18n(foot);
      return;
    }

    var html =
      item('account', '/app?section=account', 'common.nav.login', 'Account', accountActive ? 'is-active' : '', ICONS.account, ' data-auth-nav-link="common.nav.login"') +
      item('plan', '/pricing', 'common.nav.plan', 'Plan', '', ICONS.plan, '') +
      '<button type="button" class="ws-nav-item" data-nav="signout" data-atomurus-signout>' +
        ICONS.logout +
        '<span class="ws-nav-label" data-i18n="common.nav.signOut">Sign out</span></button>';
    if (kind === 'free') {
      html += item('upgrade', '/pricing', 'common.nav.upgrade', 'Upgrade to Pro', 'is-upgrade', ICONS.plan, '');
    }
    foot.innerHTML = html;
    var accountLink = foot.querySelector('[data-nav="account"]');
    if (accountLink && accountActive) accountLink.setAttribute('aria-current', 'page');
    var sign = foot.querySelector('[data-atomurus-signout]');
    if (sign && !(document.body && document.body.classList.contains('ws-body'))) {
      sign.addEventListener('click', function (event) {
        event.preventDefault();
        signOut();
      });
    }
    applyI18n(foot);
  }

  function signOut() {
    if (root.AtomurusAuth && typeof root.AtomurusAuth.logout === 'function') {
      root.AtomurusAuth.logout();
      return;
    }
    fetch('/api/auth/logout', { method: 'POST', credentials: 'include' }).finally(function () {
      var onApp = /\/app(?:\.html)?$/.test(pathname());
      location.replace(onApp ? '/app' : location.pathname);
    });
  }

  function sync(opts) {
    markActive();
    paintFoot(opts || {});
  }

  function shell() {
    return document.querySelector('.ws-shell, .ps-shell');
  }

  function menuButtons() {
    return document.querySelectorAll('#ws-menu-btn, .mobile-menu-btn, .lc-mobile-hamb');
  }

  function overlay() {
    return document.getElementById('ws-drawer-backdrop') ||
      document.getElementById('mobile-overlay') ||
      document.getElementById('lc-mobile-menu-overlay');
  }

  function ensureOverlay() {
    var el = overlay();
    if (el) return el;
    var host = shell();
    if (!host) return null;
    el = document.createElement('div');
    el.id = 'ws-drawer-backdrop';
    el.className = 'ws-drawer-backdrop atomurus-nav-backdrop';
    el.hidden = true;
    host.insertBefore(el, host.firstChild);
    return el;
  }

  function setDrawer(open) {
    var host = shell();
    var aside = sidebar();
    var ov = ensureOverlay();
    if (host) host.classList.toggle('is-nav-open', open);
    if (aside) {
      aside.classList.toggle('mobile-open', open);
      if (open) {
        aside.setAttribute('aria-modal', 'true');
        aside.setAttribute('role', 'dialog');
      } else {
        aside.removeAttribute('aria-modal');
        aside.removeAttribute('role');
      }
    }
    menuButtons().forEach(function (btn) {
      btn.setAttribute('aria-expanded', open ? 'true' : 'false');
    });
    if (ov) {
      ov.hidden = !open;
      ov.classList.toggle('show', open);
    }
    document.documentElement.style.overflow = open ? 'hidden' : '';
  }

  function toggleDrawer() {
    var host = shell();
    var open = !(host && host.classList.contains('is-nav-open'));
    setDrawer(open);
  }

  function bindDrawer() {
    if (document.documentElement.dataset.atomurusDrawer === '1') return;
    document.documentElement.dataset.atomurusDrawer = '1';
    ensureOverlay();
    document.addEventListener('click', function (event) {
      var btn = event.target && event.target.closest && event.target.closest('#ws-menu-btn, .mobile-menu-btn, .lc-mobile-hamb');
      if (!btn) return;
      if (document.body && document.body.classList.contains('ws-body') && btn.id === 'ws-menu-btn') return;
      if (btn.classList.contains('mobile-menu-btn')) return;
      event.preventDefault();
      toggleDrawer();
    });
    document.addEventListener('click', function (event) {
      var ov = event.target && event.target.closest && event.target.closest('#ws-drawer-backdrop, #mobile-overlay, #lc-mobile-menu-overlay');
      if (!ov) return;
      setDrawer(false);
    });
    document.addEventListener('keydown', function (event) {
      if (event.key !== 'Escape') return;
      setDrawer(false);
    });
    var aside = sidebar();
    if (aside) {
      aside.addEventListener('click', function (event) {
        var link = event.target && event.target.closest && event.target.closest('a[href]');
        if (!link) return;
        setDrawer(false);
      });
    }
    root.toggleMobileSidebar = function () {
      toggleDrawer();
    };
  }

  function enhance() {
    bindDrawer();
    sync();
  }

  var api = {
    LAB_NAV: LAB_NAV,
    WORKSPACE_NAV: WORKSPACE_NAV,
    SITE_NAV: SITE_NAV,
    matchNav: matchNav,
    markActive: markActive,
    paintFoot: paintFoot,
    sync: sync,
    enhance: enhance,
    bindDrawer: bindDrawer,
    toggleDrawer: toggleDrawer,
    setDrawer: setDrawer,
    signOut: signOut,
    guestLoginHref: guestLoginHref,
    authState: authState,
    planKind: planKind
  };

  root.AtomurusNav = api;

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', function () {
      bindDrawer();
      markActive();
      if (!(document.body && document.body.classList.contains('ws-body'))) {
        paintFoot();
      }
    });
  } else {
    bindDrawer();
    markActive();
    if (!(document.body && document.body.classList.contains('ws-body'))) paintFoot();
  }

  document.addEventListener('atomurus-ads-ready', function () {
    if (document.body && document.body.classList.contains('ws-body')) return;
    sync();
  });
  document.addEventListener('atomurus-auth-change', function () {
    if (document.body && document.body.classList.contains('ws-body')) return;
    sync();
  });
})(typeof window !== 'undefined' ? window : this);
