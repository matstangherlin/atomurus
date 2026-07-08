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
    const url = new URL(ns + '.json', CHUNK_BASE_URL).toString();
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
      if (val != null) el.setAttribute(attr, val);
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

  function apply(root) {
    root = root || document;
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
