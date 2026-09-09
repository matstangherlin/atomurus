// ───────────────────────────────────────────────────────────────────
// Atomurus — i18n runtime loader
// ───────────────────────────────────────────────────────────────────
// Loads only the namespaces referenced by the current page from the
// generated assets in /assets/i18n/, while preserving the previous API.
// ───────────────────────────────────────────────────────────────────

(function () {
  'use strict';

  const STORAGE_KEY = 'atomurus-lang';
  const DEFAULT = 'en';
  const SUPPORTED = ['en', 'pt'];
  const HTML_LANG = { en: 'en-US', pt: 'pt-BR' };
  const CHUNK_BASE_URL = new URL(
    'assets/i18n/',
    new URL((document.currentScript && document.currentScript.src) || 'i18n.js', location.href)
  );

  const listeners = new Set();
  const loadedNamespaces = new Set();
  const DICT = { en: {}, pt: {} };

  function resolve(dict, key) {
    return key.split('.').reduce(function (o, k) {
      return (o == null) ? undefined : o[k];
    }, dict);
  }

  function normalizeLang(raw) {
    if (!raw) return null;
    const s = String(raw).toLowerCase();
    if (s.indexOf('pt') === 0) return 'pt';
    if (s.indexOf('en') === 0) return 'en';
    return null;
  }

  function pickLang() {
    try {
      const urlLang = new URLSearchParams(location.search).get('lang');
      const n = normalizeLang(urlLang);
      if (n) return n;
    } catch (_) {}
    let l;
    try { l = localStorage.getItem(STORAGE_KEY); } catch (_) {}
    if (SUPPORTED.indexOf(l) !== -1) return l;
    try {
      const nav = (navigator.language || navigator.userLanguage || '').toLowerCase();
      if (nav.indexOf('pt') === 0) return 'pt';
    } catch (_) {}
    return DEFAULT;
  }

  function addNamespaceFromKey(set, key) {
    if (!key) return;
    const ns = String(key).trim().split('.')[0];
    if (ns) set.add(ns);
  }

  function collectNamespaces(root) {
    const namespaces = new Set(['common']);
    (root || document).querySelectorAll('[data-i18n], [data-i18n-html], [data-i18n-attr]').forEach(function (el) {
      addNamespaceFromKey(namespaces, el.getAttribute('data-i18n'));
      addNamespaceFromKey(namespaces, el.getAttribute('data-i18n-html'));
      const attrSpec = el.getAttribute('data-i18n-attr');
      if (!attrSpec) return;
      attrSpec.split(';').forEach(function (pair) {
        const idx = pair.indexOf(':');
        if (idx < 0) return;
        addNamespaceFromKey(namespaces, pair.slice(idx + 1).trim());
      });
    });
    return namespaces;
  }

  function mergeNamespace(ns, chunk) {
    SUPPORTED.forEach(function (lang) {
      if (!DICT[lang]) DICT[lang] = {};
      DICT[lang][ns] = (chunk && chunk[lang]) || {};
    });
    loadedNamespaces.add(ns);
  }

  function loadChunkData(ns) {
    // Cache-bust the JSON chunk with the same ?v= used on the i18n.js script tag,
    // so translation updates never get stuck in the browser cache.
    var ver = '';
    try {
      var tag = document.querySelector('script[src*="i18n.js"]');
      var src = tag ? tag.getAttribute('src') : '';
      var m = src.match(/[?&]v=([^&]+)/);
      if (m) ver = m[1];
    } catch (e) {}
    const url = new URL(ns + '.json' + (ver ? '?v=' + ver : ''), CHUNK_BASE_URL).toString();
    const xhr = new XMLHttpRequest();
    xhr.open('GET', url, false);
    xhr.send(null);
    if (!((xhr.status >= 200 && xhr.status < 300) || xhr.status === 0)) {
      throw new Error('Failed to load i18n namespace ' + ns + ' from ' + url + ' (' + xhr.status + ')');
    }
    return JSON.parse(xhr.responseText);
  }

  function ensureNamespace(ns) {
    if (!ns || loadedNamespaces.has(ns)) return;
    mergeNamespace(ns, loadChunkData(ns));
  }

  function ensureNamespaces(namespaces) {
    namespaces.forEach(function (ns) { ensureNamespace(ns); });
  }

  function translate(key) {
    if (!key) return undefined;
    ensureNamespace(String(key).split('.')[0]);
    const cur = I18N.lang;
    const en = DICT[DEFAULT];
    const here = DICT[cur] || en;
    let val = resolve(here, key);
    if (val == null) val = resolve(en, key);
    return val;
  }

  function applyAttrSpec(el, spec) {
    spec.split(';').forEach(function (pair) {
      const idx = pair.indexOf(':');
      if (idx < 0) return;
      const attr = pair.slice(0, idx).trim();
      const key = pair.slice(idx + 1).trim();
      if (!attr || !key) return;
      const val = translate(key);
      if (val == null) return;
      if (attr === 'textContent') {
        el.textContent = val;
      } else {
        el.setAttribute(attr, val);
      }
    });
  }

  function shouldLocalizeHref(raw, url) {
    if (!raw) return false;
    const s = String(raw).trim();
    if (!s || s[0] === '#') return false;
    if (/^(?:mailto:|tel:|sms:|javascript:|data:|blob:)/i.test(s)) return false;
    if (url.origin !== location.origin) return false;
    if (/\.(?:png|jpe?g|webp|gif|svg|ico|pdf|zip|css|js|json|xml|txt|webmanifest)$/i.test(url.pathname)) return false;
    return true;
  }

  function localizeLinks(root) {
    root = root || document;
    const langParam = I18N.lang === 'pt' ? 'pt-BR' : 'en';
    root.querySelectorAll('a[href]').forEach(function (a) {
      const raw = a.getAttribute('href');
      let url;
      try { url = new URL(raw, location.href); } catch (_) { return; }
      if (!shouldLocalizeHref(raw, url)) return;
      url.searchParams.set('lang', langParam);
      const next = location.protocol === 'file:' ? url.href : url.pathname + url.search + url.hash;
      a.setAttribute('href', next);
    });
  }

  function ensureAuthNav() {
    ensureTopnavAuthLinks();
    ensureSidebarAuthLinks();
    ensureMobileMenuAuthLinks();
  }

  function makeLink(className, href, key, fallback, prefixNo) {
    const a = document.createElement('a');
    a.className = className;
    a.href = href;
    a.setAttribute('data-auth-nav-link', key);
    if (prefixNo) {
      const no = document.createElement('span');
      no.className = 'lc-tn-no';
      no.textContent = prefixNo;
      a.appendChild(no);
      a.appendChild(document.createTextNode(' '));
    }
    const span = document.createElement('span');
    span.setAttribute('data-i18n', key);
    span.textContent = fallback;
    a.appendChild(span);
    return a;
  }

  function makeSidebarLink(href, key, fallback, icon) {
    const a = document.createElement('a');
    a.className = 'nav-item';
    a.href = href;
    a.setAttribute('data-auth-nav-link', key);
    a.innerHTML = icon + '<span data-i18n="' + key + '">' + fallback + '</span>';
    return a;
  }

  function ensureTopnavAuthLinks() {
    const wrap = document.querySelector('.lc-topnav-links');
    if (!wrap) return;
    if (!wrap.querySelector('[data-auth-nav-link="common.nav.login"]')) {
      wrap.appendChild(makeLink('lc-topnav-link lc-topnav-auth', '/login', 'common.nav.login', 'Account', '06'));
    }
  }

  function ensureSidebarAuthLinks() {
    if (document.querySelector('[data-atomurus-nav-foot], #ws-nav-foot')) return;
    const foot = document.querySelector('.sidebar-foot');
    if (!foot) return;
    const loginIcon = '<svg class="nav-icon" viewBox="0 0 16 16" fill="none"><path d="M6 3.5H4.8A1.8 1.8 0 0 0 3 5.3v5.4a1.8 1.8 0 0 0 1.8 1.8H6" stroke="currentColor" stroke-width="1.2" stroke-linecap="round"/><path d="M8 11.5 12 8 8 4.5" stroke="currentColor" stroke-width="1.2" stroke-linecap="round" stroke-linejoin="round"/><path d="M12 8H6.5" stroke="currentColor" stroke-width="1.2" stroke-linecap="round"/></svg>';
    if (!foot.querySelector('[data-auth-nav-link="common.nav.login"]')) {
      foot.insertBefore(makeSidebarLink('/login', 'common.nav.login', 'Account', loginIcon), foot.firstChild);
    }
  }

  function ensureMobileMenuAuthLinks() {
    const list = document.querySelector('.lc-mobile-menu-list');
    if (!list) return;
    if (!list.querySelector('[data-auth-nav-link="common.nav.login"]')) {
      list.appendChild(makeLink('lc-mobile-menu-item lc-mobile-menu-auth', '/login', 'common.nav.login', 'Account', '11'));
    }
  }

  function authState() {
    if (window.__ATOMURUS_AUTH__ && window.__ATOMURUS_AUTH__.ready) return window.__ATOMURUS_AUTH__;
    if (window.AtomurusAuth && typeof window.AtomurusAuth.getState === 'function') {
      var managed = window.AtomurusAuth.getState();
      if (managed && managed.ready) return managed;
    }
    return window.__ATOMURUS_ADS__ || null;
  }

  function authDisplayName(user) {
    if (!user) return 'Workspace';
    return user.displayName || user.fullName || user.username || user.email || 'Workspace';
  }

  function isPricingActionLink(link) {
    if (!link) return false;
    return Boolean(
      link.closest('.price-card') ||
      link.id === 'pricing-workspace-link' ||
      link.id === 'pricing-create-account-link' ||
      link.id === 'pricing-login-link' ||
      link.id === 'pricing-trial-cta' ||
      link.id === 'pricing-pro-cta'
    );
  }

  function guestLoginHref() {
    var path = location.pathname || '/';
    if (/\/(login|signup)(?:\.html)?$/i.test(path)) return '/login';
    return '/login?next=' + encodeURIComponent((location.pathname || '/') + (location.search || ''));
  }

  function setAuthLabel(node, text, i18nKey) {
    if (!node) return;
    if (node.dataset.authGuestLabel == null) node.dataset.authGuestLabel = node.textContent || '';
    if (i18nKey && node.dataset.authGuestI18n == null) node.dataset.authGuestI18n = i18nKey;
    if (i18nKey) node.setAttribute('data-i18n', i18nKey);
    else node.removeAttribute('data-i18n');
    node.textContent = text;
  }

  function planBadgeInfo(user) {
    if (!user) return { kind: 'guest', label: '' };
    if (user.plan === 'admin' || user.role === 'admin') return { kind: 'admin', label: 'ADMIN' };
    if (user.planSource === 'trial' || user.planSource === 'billing_trial') return { kind: 'trial', label: 'PRO TRIAL' };
    if (user.isPro) return { kind: 'pro', label: 'PRO' };
    return { kind: 'free', label: 'FREE' };
  }

  function syncPlanBadge(host, user, signedIn) {
    if (!host) return;
    var info = planBadgeInfo(user);
    var show = signedIn && info.label;
    var badge = host.querySelector('[data-atomurus-plan-badge], .ps-plan-badge, .lc-plan-badge, #ws-plan-badge');
    if (!show) {
      if (badge) {
        badge.hidden = true;
        badge.textContent = '';
      }
      return;
    }
    if (!badge) {
      badge = document.createElement('span');
      badge.className = 'ps-plan-badge';
      badge.setAttribute('data-atomurus-plan-badge', '');
      host.insertBefore(badge, host.firstChild);
    }
    badge.hidden = false;
    badge.textContent = info.label;
  }

  function syncAuthNav() {
    const state = authState();
    const pending = !(state && state.ready);
    const signedIn = Boolean(state && state.ready && state.signedIn);
    const user = state && state.user ? state.user : null;
    const display = authDisplayName(user);
    if (!(document.body && document.body.classList.contains('ws-body'))) {
      document.documentElement.classList.toggle('auth-pending', pending);
    }

    document.querySelectorAll('[data-auth-nav-link="common.nav.login"]').forEach(function (link) {
      if (link.closest('[data-atomurus-nav-foot], #ws-nav-foot')) {
        link.setAttribute('href', signedIn ? '/app?section=account' : guestLoginHref());
        return;
      }
      link.setAttribute('href', signedIn ? '/app?section=account' : guestLoginHref());
      const label = link.querySelector('[data-i18n], span') || link;
      setAuthLabel(label, signedIn ? display : (label.dataset.authGuestLabel || 'Account'), signedIn ? null : 'common.nav.login');
    });

    var chips = document.querySelectorAll('[data-atomurus-account-chip]');
    if (!chips.length) chips = document.querySelectorAll('.lc-topnav-cta[href]');
    chips.forEach(function (link) {
      if (isPricingActionLink(link)) return;
      if (link.dataset.authGuestHref == null) link.dataset.authGuestHref = link.getAttribute('href') || '/login';
      var guestHref = String(link.dataset.authGuestHref || '').toLowerCase();
      if (!/login|signup|account/.test(guestHref)) return;
      link.setAttribute('href', signedIn ? '/app?section=account' : guestLoginHref());
      const label = link.querySelector('span[data-i18n], span:not(.ps-plan-badge)') || link.querySelector('span') || link;
      setAuthLabel(
        label,
        signedIn ? display : (label.dataset.authGuestLabel || 'Account'),
        signedIn ? null : (label.dataset.authGuestI18n || 'pricing.ctaAccount')
      );
      link.setAttribute('aria-label', signedIn ? ('Open account for ' + display) : (label.dataset.authGuestLabel || 'Account'));
      link.setAttribute('title', signedIn ? ('Signed in as ' + display) : (label.dataset.authGuestLabel || 'Account'));
      syncPlanBadge(link.closest('[data-atomurus-account]') || link.parentElement || link, user, signedIn);
    });
    bindAccountMenu(signedIn, user, display);
    if (window.AtomurusNav && typeof window.AtomurusNav.sync === 'function') {
      if (!(document.body && document.body.classList.contains('ws-body'))) {
        window.AtomurusNav.sync({ state: { ready: !pending, signedIn: signedIn, user: user } });
      }
    }
  }

  function accountMenuCopy() {
    var pt = (document.documentElement.lang || '').toLowerCase().indexOf('pt') === 0;
    return {
      account: pt ? 'Conta' : 'Account',
      plan: pt ? 'Plano e cobrança' : 'Plan & Billing',
      prefs: pt ? 'Preferências' : 'Preferences',
      labSettings: pt ? 'Ajustes do laboratório' : 'Lab settings',
      signOut: pt ? 'Sair' : 'Sign out'
    };
  }

  function fillAccountMenu(menu, signedIn) {
    if (!menu) return;
    var copy = accountMenuCopy();
    menu.innerHTML =
      '<a href="/app?section=account">' + copy.account + '</a>' +
      '<a href="/app?section=account&tab=plan">' + copy.plan + '</a>' +
      '<a href="/app?section=account&tab=preferences">' + copy.prefs + '</a>' +
      '<a href="/config">' + copy.labSettings + '</a>' +
      '<div class="ps-account-menu-sep"></div>' +
      '<button type="button" data-atomurus-signout>' + copy.signOut + '</button>';
  }

  function publicSignOut() {
    if (window.AtomurusNav && typeof window.AtomurusNav.signOut === 'function') {
      window.AtomurusNav.signOut();
      return;
    }
    if (window.AtomurusAuth && typeof window.AtomurusAuth.logout === 'function') {
      window.AtomurusAuth.logout();
      return;
    }
    fetch('/api/auth/logout', { method: 'POST', credentials: 'include' }).finally(function () {
      location.reload();
    });
  }

  function bindAccountMenu(signedIn, user, display) {
    document.querySelectorAll('[data-atomurus-account]').forEach(function (host) {
      var chip = host.querySelector('[data-atomurus-account-chip], #ws-userchip');
      if (!chip) return;
      var wrap = host.querySelector('.ps-account-wrap') || host;
      if (!wrap.classList.contains('ps-account-wrap')) {
        wrap.classList.add('ps-account-wrap');
      }
      var menu = host.querySelector('.ps-account-menu');
      if (!menu) {
        menu = document.createElement('div');
        menu.className = 'ps-account-menu';
        menu.hidden = true;
        wrap.appendChild(menu);
      }
      fillAccountMenu(menu, signedIn);
      menu.hidden = true;
      chip.setAttribute('aria-haspopup', signedIn ? 'menu' : 'false');
      chip.setAttribute('aria-expanded', 'false');
      if (chip.dataset.accountMenuBound === '1') return;
      chip.dataset.accountMenuBound = '1';
      chip.addEventListener('click', function (event) {
        var state = authState();
        if (!(state && state.ready && state.signedIn)) return;
        event.preventDefault();
        var open = menu.hidden;
        document.querySelectorAll('.ps-account-menu').forEach(function (el) { el.hidden = true; });
        menu.hidden = !open;
        chip.setAttribute('aria-expanded', menu.hidden ? 'false' : 'true');
      });
      menu.addEventListener('click', function (event) {
        var btn = event.target && event.target.closest && event.target.closest('[data-atomurus-signout]');
        if (!btn) return;
        event.preventDefault();
        publicSignOut();
      });
    });
    if (!document.documentElement.dataset.accountMenuDismiss) {
      document.documentElement.dataset.accountMenuDismiss = '1';
      document.addEventListener('click', function (event) {
        if (event.target && event.target.closest && event.target.closest('[data-atomurus-account]')) return;
        document.querySelectorAll('.ps-account-menu').forEach(function (el) { el.hidden = true; });
      });
      document.addEventListener('keydown', function (event) {
        if (event.key !== 'Escape') return;
        document.querySelectorAll('.ps-account-menu').forEach(function (el) { el.hidden = true; });
      });
    }
  }

  function apply(root) {
    root = root || document;
    if (root === document) ensureAuthNav();
    ensureNamespaces(collectNamespaces(root));
    root.querySelectorAll('[data-i18n]').forEach(function (el) {
      const v = translate(el.getAttribute('data-i18n'));
      if (v != null) el.textContent = v;
    });
    root.querySelectorAll('[data-i18n-html]').forEach(function (el) {
      const v = translate(el.getAttribute('data-i18n-html'));
      if (v != null) el.innerHTML = v;
    });
    root.querySelectorAll('[data-i18n-attr]').forEach(function (el) {
      applyAttrSpec(el, el.getAttribute('data-i18n-attr'));
    });
    document.documentElement.lang = HTML_LANG[I18N.lang] || I18N.lang;
    localizeLinks(root);
    if (root === document) syncAuthNav();
  }

  function setLang(lang) {
    if (SUPPORTED.indexOf(lang) === -1) return;
    if (lang === I18N.lang) return;
    I18N.lang = lang;
    try { localStorage.setItem(STORAGE_KEY, lang); } catch (_) {}
    try {
      const u = new URL(location.href);
      u.searchParams.set('lang', lang === 'pt' ? 'pt-BR' : 'en');
      history.replaceState(null, '', u.toString());
    } catch (_) {}
    apply();
    if (lang === 'pt') document.documentElement.classList.remove('lang-pt-pending');
    listeners.forEach(function (cb) {
      try { cb(lang); } catch (_) {}
    });
  }

  function nextLang() {
    const i = SUPPORTED.indexOf(I18N.lang);
    return SUPPORTED[(i + 1) % SUPPORTED.length];
  }

  const I18N = {
    lang: pickLang(),
    supported: SUPPORTED.slice(),
    t: translate,
    apply: apply,
    setLang: setLang,
    toggle: function () { setLang(nextLang()); },
    next: nextLang,
    onChange: function (cb) {
      listeners.add(cb);
      return function () { listeners.delete(cb); };
    },
    otherLabel: function () { return nextLang().toUpperCase(); },
    ready: Promise.resolve()
  };

  window.I18N = I18N;

  function init() {
    try { localStorage.setItem(STORAGE_KEY, I18N.lang); } catch (_) {}
    apply();
    document.documentElement.classList.remove('lang-pt-pending');
    document.addEventListener('atomurus-ads-ready', function () {
      syncAuthNav();
    });
    document.addEventListener('atomurus-auth-change', function () {
      syncAuthNav();
    });
    window.addEventListener('storage', function (e) {
      if (e.key === STORAGE_KEY && e.newValue && e.newValue !== I18N.lang) {
        if (SUPPORTED.indexOf(e.newValue) !== -1) setLang(e.newValue);
      }
    });
    document.querySelectorAll('[data-i18n-toggle]').forEach(function (btn) {
      const refresh = function () {
        const label = btn.querySelector('[data-i18n-toggle-label]') || btn;
        label.textContent = I18N.otherLabel();
      };
      refresh();
      btn.addEventListener('click', function (e) {
        e.preventDefault();
        I18N.toggle();
      });
      I18N.onChange(refresh);
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
