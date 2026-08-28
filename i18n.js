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
      wrap.appendChild(makeLink('lc-topnav-link lc-topnav-auth', '/login', 'common.nav.login', 'Login', '06'));
    }
  }

  function ensureSidebarAuthLinks() {
    const foot = document.querySelector('.sidebar-foot');
    if (!foot) return;
    const loginIcon = '<svg class="nav-icon" viewBox="0 0 16 16" fill="none"><path d="M6 3.5H4.8A1.8 1.8 0 0 0 3 5.3v5.4a1.8 1.8 0 0 0 1.8 1.8H6" stroke="currentColor" stroke-width="1.2" stroke-linecap="round"/><path d="M8 11.5 12 8 8 4.5" stroke="currentColor" stroke-width="1.2" stroke-linecap="round" stroke-linejoin="round"/><path d="M12 8H6.5" stroke="currentColor" stroke-width="1.2" stroke-linecap="round"/></svg>';
    if (!foot.querySelector('[data-auth-nav-link="common.nav.login"]')) {
      foot.insertBefore(makeSidebarLink('/login', 'common.nav.login', 'Login', loginIcon), foot.firstChild);
    }
  }

  function ensureMobileMenuAuthLinks() {
    const list = document.querySelector('.lc-mobile-menu-list');
    if (!list) return;
    if (!list.querySelector('[data-auth-nav-link="common.nav.login"]')) {
      list.appendChild(makeLink('lc-mobile-menu-item lc-mobile-menu-auth', '/login', 'common.nav.login', 'Login', '11'));
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

  function setAuthLabel(node, text, i18nKey) {
    if (!node) return;
    if (node.dataset.authGuestLabel == null) node.dataset.authGuestLabel = node.textContent || '';
    if (i18nKey && node.dataset.authGuestI18n == null) node.dataset.authGuestI18n = i18nKey;
    if (i18nKey) node.setAttribute('data-i18n', i18nKey);
    else node.removeAttribute('data-i18n');
    node.textContent = text;
  }

  function syncAuthNav() {
    const state = authState();
    const signedIn = Boolean(state && state.ready && state.signedIn);
    const user = state && state.user ? state.user : null;
    const display = authDisplayName(user);

    document.querySelectorAll('[data-auth-nav-link="common.nav.login"]').forEach(function (link) {
      link.setAttribute('href', signedIn ? '/app' : '/login');
      const label = link.querySelector('[data-i18n], span') || link;
      setAuthLabel(label, signedIn ? display : (label.dataset.authGuestLabel || 'Login'), signedIn ? null : 'common.nav.login');
      syncPlanBadge(link, user, signedIn);
    });

    document.querySelectorAll('.lc-topnav-cta[href]').forEach(function (link) {
      if (isPricingActionLink(link)) return;
      if (link.dataset.authGuestHref == null) link.dataset.authGuestHref = link.getAttribute('href') || '/login';
      var guestHref = String(link.dataset.authGuestHref || '').toLowerCase();
      if (!/login|signup|account/.test(guestHref)) return;
      link.setAttribute('href', signedIn ? '/app' : link.dataset.authGuestHref);
      const label = link.querySelector('span') || link;
      setAuthLabel(
        label,
        signedIn ? display : (label.dataset.authGuestLabel || 'Account'),
        signedIn ? null : (label.dataset.authGuestI18n || 'pricing.ctaAccount')
      );
      link.setAttribute('aria-label', signedIn ? ('Open workspace for ' + display) : (label.dataset.authGuestLabel || 'Account'));
      link.setAttribute('title', signedIn ? ('Signed in as ' + display) : (label.dataset.authGuestLabel || 'Account'));
      syncPlanBadge(link, user, signedIn);
    });
  }

  function planBadgeLabel(user) {
    if (!user) return '';
    if (user.planSource === 'trial' || user.planSource === 'billing_trial') return 'TRIAL';
    if (user.isPro) return 'PRO';
    return '';
  }

  function syncPlanBadge(link, user, signedIn) {
    if (!link) return;
    if (!document.getElementById('atomurus-plan-badge-style')) {
      var style = document.createElement('style');
      style.id = 'atomurus-plan-badge-style';
      style.textContent = '.lc-plan-badge{display:inline-flex;margin-left:6px;vertical-align:middle;height:18px;padding:0 6px;border-radius:999px;font-family:var(--lc-mono,ui-monospace,monospace);font-size:9px;letter-spacing:.12em;border:1px solid color-mix(in oklab,var(--lc-green,#1E6A50) 40%,var(--lc-rule,#D8D2BF));color:var(--lc-green,#1E6A50)}';
      document.head.appendChild(style);
    }
    var badge = link.querySelector('.lc-plan-badge');
    var label = planBadgeLabel(user);
    if (!signedIn || !label) {
      if (badge) badge.remove();
      return;
    }
    if (!badge) {
      badge = document.createElement('span');
      badge.className = 'lc-plan-badge';
      link.appendChild(badge);
    }
    badge.textContent = label;
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
