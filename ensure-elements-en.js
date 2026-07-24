// ───────────────────────────────────────────────────────────────────
// Atomurus — lazy English overlay for elements-data.js
// ───────────────────────────────────────────────────────────────────
// elements-data.js is PT-first. elements-data-en.js only adds EN strings
// (elDesc / elApps / …). Load it eagerly on EN pages; on PT pages defer
// until the user switches language (saves ~44KB on the critical path).
// ───────────────────────────────────────────────────────────────────

(function () {
  'use strict';

  var SRC = '/elements-data-en.js';
  var pending = null;

  function isEn() {
    if (window.I18N && I18N.lang) return I18N.lang === 'en';
    try {
      var stored = localStorage.getItem('atomurus-lang');
      if (stored === 'en' || stored === 'pt') return stored === 'en';
    } catch (_err) {}
    var lang = (document.documentElement.lang || '').toLowerCase();
    return lang.indexOf('pt') !== 0;
  }

  function versionedSrc() {
    var probe = document.querySelector('script[src*="elements-data.js"]');
    if (probe && probe.src) {
      var m = probe.src.match(/\?v=(\d+)/);
      if (m) return SRC + '?v=' + m[1];
    }
    var gate = document.querySelector('script[src*="ads-gate.js"]');
    if (gate && gate.src) {
      var m2 = gate.src.match(/\?v=(\d+)/);
      if (m2) return SRC + '?v=' + m2[1];
    }
    return SRC;
  }

  function ensureElementsEn() {
    if (typeof elDesc === 'function') return Promise.resolve();
    if (pending) return pending;

    pending = new Promise(function (resolve, reject) {
      var s = document.createElement('script');
      s.src = versionedSrc();
      s.async = true;
      s.onload = function () { resolve(); };
      s.onerror = function () {
        pending = null;
        reject(new Error('Failed to load elements-data-en.js'));
      };
      document.head.appendChild(s);
    });

    return pending;
  }

  window.__ATOMURUS_ENSURE_ELEMENTS_EN = ensureElementsEn;

  function boot() {
    function wire() {
      if (!(window.I18N && I18N.onChange)) {
        setTimeout(wire, 50);
        return;
      }
      I18N.onChange(function (lang) {
        if (lang === 'en') ensureElementsEn().catch(function () {});
      });
    }
    wire();
  }

  // Start EN overlay ASAP on English sessions (do not wait for DOMContentLoaded).
  if (isEn()) {
    ensureElementsEn().catch(function () {});
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', boot);
  } else {
    boot();
  }
})();
