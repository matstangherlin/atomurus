// ───────────────────────────────────────────────────────────────────
// Atomurus — runtime loader for per-element rich content
// ───────────────────────────────────────────────────────────────────
// Element pages still include this single script, but it now lazy-loads
// one small chunk per atomic number instead of shipping all 118 entries
// to every element page.
// ───────────────────────────────────────────────────────────────────

(function () {
  'use strict';

  var chunkState = {
    pt: Object.create(null),
    en: Object.create(null),
    promises: Object.create(null),
  };

  function currentLang() {
    return (window.I18N && I18N.lang) || 'en';
  }

  function currentScript() {
    return document.currentScript ||
      document.querySelector('script[src*="elements-content.js"]');
  }

  function chunkBaseUrl() {
    var script = currentScript();
    if (!script || !script.src) return null;
    return new URL('./assets/element-content/', script.src);
  }

  function chunkVersion() {
    var script = currentScript();
    if (!script || !script.src) return '';
    var src = new URL(script.src, location.href);
    return src.searchParams.get('v') || '';
  }

  function chunkUrlFor(z) {
    var base = chunkBaseUrl();
    if (!base) return null;
    var file = String(z).padStart(3, '0') + '.js';
    var url = new URL(file, base);
    var version = chunkVersion();
    if (version) url.searchParams.set('v', version);
    return url.toString();
  }

  function dispatchReady(z) {
    document.dispatchEvent(new CustomEvent('atomurus:element-content-ready', {
      detail: { z: z }
    }));
  }

  function registerChunk(z, chunk) {
    if (!chunk) return;
    if (chunk.pt) chunkState.pt[z] = chunk.pt;
    if (chunk.en) chunkState.en[z] = chunk.en;
    dispatchReady(z);
  }

  function ensureChunk(z) {
    if (chunkState.pt[z] || chunkState.en[z]) {
      return Promise.resolve();
    }
    if (chunkState.promises[z]) {
      return chunkState.promises[z];
    }

    var src = chunkUrlFor(z);
    if (!src) {
      return Promise.reject(new Error('Could not resolve element content chunk URL'));
    }

    chunkState.promises[z] = new Promise(function (resolve, reject) {
      var script = document.createElement('script');
      script.src = src;
      script.defer = true;
      script.onload = function () { resolve(); };
      script.onerror = function () {
        reject(new Error('Failed to load element content chunk for Z=' + z));
      };
      document.head.appendChild(script);
    });

    return chunkState.promises[z];
  }

function elContentFor(z) {
    if (currentLang() === 'en') {
      return chunkState.en[z] || chunkState.pt[z] || null;
    }
    return chunkState.pt[z] || chunkState.en[z] || null;
  }

  window.__ELEMENT_CONTENT_CHUNKS = window.__ELEMENT_CONTENT_CHUNKS || {};
  window.__registerElementContentChunk = registerChunk;
  window.ELEMENT_CONTENT_PT = chunkState.pt;
  window.ELEMENT_CONTENT_EN = chunkState.en;
window.elContentFor = elContentFor;
  window.loadElementContentFor = ensureChunk;

  if (window.PAGE_Z) {
    ensureChunk(window.PAGE_Z).catch(function (err) {
      console.warn(err && err.message ? err.message : err);
    });
  }
})();
