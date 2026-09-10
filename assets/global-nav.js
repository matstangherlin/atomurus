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

  var WORKSPACE_GROUPS = [
    {
      key: 'navGroupStudy',
      fallback: 'Study',
      items: [
        { section: 'overview', labelKey: 'overview', label: 'Overview', icon: 'overview', feature: null },
        { section: 'library', labelKey: 'library', label: 'Library', icon: 'library', feature: 'studyCloud' },
        { section: 'sets', labelKey: 'sets', label: 'Study Sets', icon: 'sets', feature: 'studySets' },
        { section: 'practice', labelKey: 'practiceNav', label: 'Practice', icon: 'practice', feature: null },
        { section: 'review', labelKey: 'review', label: 'Smart Review', icon: 'review', feature: 'smartReview' },
        { section: 'insights', labelKey: 'insights', label: 'Study Insights', icon: 'insights', feature: 'studyInsights' }
      ]
    },
    {
      key: 'navGroupLab',
      fallback: 'Lab',
      items: [
        { section: 'pro-lab', labelKey: 'proLab', label: 'Pro Lab', icon: 'pro-lab', feature: 'proLab' }
      ]
    },
    {
      key: 'navGroupActivity',
      fallback: 'Activity',
      items: [
        { section: 'history', labelKey: 'history', label: 'Calculator History', icon: 'history', feature: 'calculatorHistory' },
        { section: 'notes', labelKey: 'notes', label: 'Notes', icon: 'notes', feature: 'studyNotes' },
        { section: 'progress', labelKey: 'progress', label: 'Continue Studying', icon: 'progress', feature: 'studyProgress' }
      ]
    }
  ];

  var ITEM_ICONS = {
    overview: '<path d="M3 3h4v4H3zM9 3h4v4H9zM3 9h4v4H3zM9 9h4v4H9z"/>',
    library: '<path d="M3 3h3v10H3zM7 5h3v8H7zM11 4h3v9h-3z"/>',
    sets: '<path d="M3 5h10M3 8h10M3 11h10M5 3v10"/>',
    practice: '<path d="M6 2.5h4M7 2.5v3.2L4.2 13h7.6L9 5.7V2.5M6.2 9h3.6"/>',
    review: '<path d="M8 2.5a5.5 5.5 0 1 1-4.6 2.5M8 5v3.5L10 10"/>',
    insights: '<path d="M3 12V8M6.5 12V5M10 12V7M13 12V3"/>',
    'pro-lab': '<path d="M5 2h6l1 3H4zM5 5v7h6V5M6.5 8v2.5M9.5 8v2.5"/>',
    history: '<path d="M8 3v5l3 2M3.5 8a4.5 4.5 0 1 0 1-2.8"/>',
    notes: '<path d="M4 3h6l3 3v7H4zM10 3v3h3"/>',
    progress: '<path d="M3 12l4-4 2 2 4-6"/>'
  };

  function itemIcon(name) {
    return '<svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true"><g stroke="currentColor" stroke-width="1.3" stroke-linecap="round" stroke-linejoin="round" fill="none">' +
      (ITEM_ICONS[name] || ITEM_ICONS.overview) + '</g></svg>';
  }

  function sidebar() {
    return document.querySelector('[data-atomurus-sidebar], #ws-sidebar');
  }

  function t(key, fallback, vars) {
    var value = fallback;
    try {
      if (root.I18N && typeof root.I18N.t === 'function') {
        var v = root.I18N.t(key);
        if (v != null && v !== '' && v !== key) value = v;
      }
    } catch (e) {}
    if (value == null || value === '') value = fallback || key;
    if (vars) {
      value = String(value).replace(/\{(\w+)\}/g, function (_, name) {
        return vars[name] == null ? '' : String(vars[name]);
      });
    }
    return value;
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

  function entitlements(userOverride) {
    if (userOverride) {
      return {
        signedIn: true,
        user: userOverride,
        features: userOverride.features || {},
        isPro: Boolean(userOverride.isPro)
      };
    }
    var auth = root.__ATOMURUS_AUTH__ || {};
    var ads = root.__ATOMURUS_ADS__ || {};
    var user = auth.user || ads.user || null;
    var signedIn = Boolean((auth.ready && auth.signedIn && user) || ads.signedIn);
    return {
      signedIn: signedIn,
      user: signedIn ? user : null,
      features: (user && user.features) || ads.features || {},
      isPro: Boolean((user && user.isPro) || ads.isPro)
    };
  }

  function hasFeature(name, userOverride) {
    if (!name) return true;
    if (userOverride === null) return false;
    var ent = entitlements(userOverride);
    if (!ent.signedIn) return false;
    if (Object.prototype.hasOwnProperty.call(ent.features, name)) return ent.features[name] === true;
    return ent.isPro;
  }

  function loginHrefFor(next) {
    if (root.AtomurusAuth && typeof root.AtomurusAuth.loginUrl === 'function') {
      return root.AtomurusAuth.loginUrl(next);
    }
    return '/login?next=' + encodeURIComponent(next);
  }

  function ensureNoticeStyle() {
    if (document.getElementById('atm-pro-notice-css')) return;
    var style = document.createElement('style');
    style.id = 'atm-pro-notice-css';
    style.textContent =
      '#atm-pro-notice{position:fixed;inset:0;z-index:95;display:none}' +
      '#atm-pro-notice.is-open{display:block}' +
      '#atm-pro-notice .atm-pro-notice-backdrop{position:absolute;inset:0;background:color-mix(in oklab,#14120E 40%,transparent)}' +
      '#atm-pro-notice .atm-pro-notice-panel{position:relative;z-index:1;margin:12vh auto 0;width:min(440px,calc(100% - 32px));padding:24px;background:var(--lc-paper,#F8F5EC);border:1px solid var(--lc-rule,#D8D2BF);border-radius:16px;box-shadow:0 16px 40px color-mix(in oklab,#14120E 18%,transparent)}' +
      '#atm-pro-notice h2{margin:0 0 8px;font-family:"Instrument Serif",Georgia,serif;font-size:28px;font-weight:400;color:var(--lc-ink,#14120E)}' +
      '#atm-pro-notice p{margin:0 0 18px;font-size:15px;line-height:1.45;color:var(--lc-ink-2,#58544A)}' +
      '#atm-pro-notice .atm-pro-notice-actions{display:flex;flex-wrap:wrap;gap:8px;justify-content:flex-end}' +
      '#atm-pro-notice a,#atm-pro-notice button{display:inline-flex;align-items:center;justify-content:center;min-height:40px;padding:0 14px;border-radius:8px;font-size:14px;font-weight:600;text-decoration:none;cursor:pointer}' +
      '#atm-pro-notice .atm-pro-notice-primary{background:#1E6A50;color:#F8F5EC;border:0}' +
      '#atm-pro-notice .atm-pro-notice-ghost{background:transparent;color:inherit;border:1px solid var(--lc-rule,#D8D2BF)}';
    document.head.appendChild(style);
  }

  function closeProNotice() {
    var host = document.getElementById('atm-pro-notice');
    if (!host) return;
    host.classList.remove('is-open');
    host.hidden = true;
    host.innerHTML = '';
    document.body.classList.remove('ui-dialog-open');
  }

  function openProNotice(opts) {
    opts = opts || {};
    var guest = !entitlements(opts.user).signedIn;
    var feature = opts.label || 'This feature';
    var next = '/app?section=' + encodeURIComponent(opts.section || 'overview');
    var title = t('common.ws.proNoticeTitle', 'Available with Atomurus Pro');
    var body = t(
      guest ? 'common.ws.proNoticeGuestBody' : 'common.ws.proNoticeFreeBody',
      guest
        ? '{feature} is available only with Atomurus Pro. Sign in if you already have access, or view the Pro plans.'
        : '{feature} is available only with Atomurus Pro. Upgrade your plan to unlock it.',
      { feature: feature }
    );
    if (root.AtomurusWorkspaceUI && typeof root.AtomurusWorkspaceUI.openDialog === 'function') {
      var actions = [{ label: t('common.ws.cancel', 'Cancel'), kind: 'ws-btn-ghost', onClick: function () {} }];
      if (guest) actions.push({ label: t('common.ws.login', 'Sign in'), kind: 'ws-btn-secondary', href: loginHrefFor(next) });
      actions.push({ label: t('common.ws.viewPlans', 'View plans'), kind: 'ws-btn-primary', href: '/pricing' });
      root.AtomurusWorkspaceUI.openDialog({ title: title, body: body, actions: actions });
      return;
    }
    ensureNoticeStyle();
    var host = document.getElementById('atm-pro-notice');
    if (!host) {
      host = document.createElement('div');
      host.id = 'atm-pro-notice';
      host.setAttribute('hidden', '');
      document.body.appendChild(host);
    }
    host.innerHTML =
      '<div class="atm-pro-notice-backdrop" data-atm-pro-dismiss></div>' +
      '<div class="atm-pro-notice-panel" role="dialog" aria-modal="true" aria-labelledby="atm-pro-notice-title">' +
      '<h2 id="atm-pro-notice-title"></h2><p></p><div class="atm-pro-notice-actions"></div></div>';
    host.querySelector('h2').textContent = title;
    host.querySelector('p').textContent = body;
    var actionsNode = host.querySelector('.atm-pro-notice-actions');
    var cancel = document.createElement('button');
    cancel.type = 'button';
    cancel.className = 'atm-pro-notice-ghost';
    cancel.textContent = t('common.ws.cancel', 'Cancel');
    cancel.addEventListener('click', closeProNotice);
    actionsNode.appendChild(cancel);
    if (guest) {
      var signIn = document.createElement('a');
      signIn.className = 'atm-pro-notice-ghost';
      signIn.href = loginHrefFor(next);
      signIn.textContent = t('common.ws.login', 'Sign in');
      actionsNode.appendChild(signIn);
    }
    var plans = document.createElement('a');
    plans.className = 'atm-pro-notice-primary';
    plans.href = '/pricing';
    plans.textContent = t('common.ws.viewPlans', 'View plans');
    actionsNode.appendChild(plans);
    host.querySelector('[data-atm-pro-dismiss]').addEventListener('click', closeProNotice);
    host.hidden = false;
    host.classList.add('is-open');
    document.body.classList.add('ui-dialog-open');
    window.setTimeout(function () { cancel.focus(); }, 20);
  }

  function workspaceSection() {
    try {
      if (!/\/app(?:\.html)?$/.test(pathname())) return '';
      return String(new URLSearchParams(location.search).get('section') || 'overview').toLowerCase();
    } catch (e) {
      return '';
    }
  }

  function paintWorkspaceNav(opts) {
    var nav = document.getElementById('ws-nav-main');
    if (!nav) return;
    opts = opts || {};
    var user = opts && Object.prototype.hasOwnProperty.call(opts, 'user') ? opts.user : undefined;
    var wrap = document.getElementById('ws-workspace-nav');
    if (!wrap) {
      wrap = document.createElement('div');
      wrap.id = 'ws-workspace-nav';
      wrap.setAttribute('data-atomurus-workspace-nav', '1');
      var site = nav.querySelector('.ws-nav-site');
      if (site && site.parentNode === nav) nav.insertBefore(wrap, site.nextSibling);
      else nav.appendChild(wrap);
      wrap.addEventListener('click', function (event) {
        var link = event.target && event.target.closest && event.target.closest('[data-pro-nav]');
        if (!link) return;
        if (hasFeature(link.getAttribute('data-pro-feature'))) return;
        event.preventDefault();
        openProNotice({
          section: link.getAttribute('data-pro-nav'),
          label: link.getAttribute('data-pro-label') || (link.textContent || '').replace(/\bPRO\b/g, '').trim(),
          user: entitlements().user
        });
      });
    }
    var current = workspaceSection();
    wrap.innerHTML = WORKSPACE_GROUPS.map(function (group) {
      return '<div class="ws-nav-block"><h2 class="ws-nav-group" data-i18n="common.ws.' + group.key + '">' +
        t('common.ws.' + group.key, group.fallback) + '</h2>' +
        group.items.map(function (item) {
          var locked = !hasFeature(item.feature, user);
          var active = current && current === item.section;
          var meta = locked ? '<span class="ws-nav-meta">' + t('common.ws.pro', 'PRO') + '</span>' : '';
          var gate = locked
            ? ' data-pro-nav="' + item.section + '" data-pro-feature="' + (item.feature || '') +
              '" data-pro-label="' + t('common.ws.' + item.labelKey, item.label) + '"'
            : '';
          return '<a class="ws-nav-item' + (active ? ' is-active' : '') + (locked ? ' is-locked' : '') +
            '" href="/app?section=' + item.section + '" data-ws-section="' + item.section + '"' + gate + '>' +
            itemIcon(item.icon) +
            '<span class="ws-nav-label" data-i18n="common.ws.' + item.labelKey + '">' +
            t('common.ws.' + item.labelKey, item.label) + '</span>' + meta + '</a>';
        }).join('') + '</div>';
    }).join('');
    applyI18n(wrap);
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
      '<button type="button" class="ws-nav-item" data-nav="signout" data-atomurus-signout id="app-logout-aside">' +
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
    paintWorkspaceNav(opts || {});
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
      closeProNotice();
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
    paintWorkspaceNav: paintWorkspaceNav,
    openProNotice: openProNotice,
    closeProNotice: closeProNotice,
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

  function bindI18nRepaint() {
    if (!root.I18N || typeof root.I18N.onChange !== 'function' || bindI18nRepaint.bound) return;
    bindI18nRepaint.bound = true;
    root.I18N.onChange(function () { paintWorkspaceNav(); });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', function () {
      bindDrawer();
      markActive();
      bindI18nRepaint();
      paintWorkspaceNav();
      if (!(document.body && document.body.classList.contains('ws-body'))) {
        paintFoot();
      }
    });
  } else {
    bindDrawer();
    markActive();
    bindI18nRepaint();
    paintWorkspaceNav();
    if (!(document.body && document.body.classList.contains('ws-body'))) paintFoot();
  }

  document.addEventListener('atomurus-ads-ready', function () {
    paintWorkspaceNav();
    if (document.body && document.body.classList.contains('ws-body')) return;
    sync();
  });
  document.addEventListener('atomurus-auth-change', function () {
    paintWorkspaceNav();
    if (document.body && document.body.classList.contains('ws-body')) return;
    sync();
  });
  bindI18nRepaint();
})(typeof window !== 'undefined' ? window : this);
