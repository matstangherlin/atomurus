// Consent state for measurement and advertising. Loaded before ads-gate.js
// and lazy-ads.js. No third-party requests happen in this file.
(function () {
  'use strict';

  var LEGACY_KEY = 'atomurus-cookie-consent';
  var KEY = 'atomurus-cookie-consent-v2';

  window.ATOMURUS_CONSENT_CONFIG = window.ATOMURUS_CONSENT_CONFIG || {
    enforce: true,
    adcashDisabledPathPrefixes: [],
    adcashDisabledForMinors: false
  };

  var listeners = [];

  function readLegacy() {
    try {
      return localStorage.getItem(LEGACY_KEY);
    } catch (_err) {
      return null;
    }
  }

  function readV2() {
    try {
      var raw = localStorage.getItem(KEY);
      if (!raw) return null;
      var data = JSON.parse(raw);
      if (!data || data.v !== 2) return null;
      if (typeof data.analytics !== 'boolean' || typeof data.ads !== 'boolean') return null;
      return data;
    } catch (_err) {
      return null;
    }
  }

  function snapshot(decided, analytics, ads, ts) {
    return {
      decided: !!decided,
      analytics: !!analytics,
      ads: !!ads,
      ts: ts || 0
    };
  }

  function get() {
    var stored = readV2();
    if (stored) return snapshot(true, stored.analytics, stored.ads, stored.ts);
    var legacy = readLegacy();
    if (legacy === 'accepted') return snapshot(true, true, true, 0);
    if (legacy === 'rejected') return snapshot(true, false, false, 0);
    return snapshot(false, false, false, 0);
  }

  function emit(detail) {
    listeners.slice().forEach(function (cb) {
      try { cb(detail); } catch (_err) {}
    });
    try {
      window.dispatchEvent(new CustomEvent('atomurus:consent', { detail: detail }));
    } catch (_err) {}
  }

  function set(partial) {
    var prev = get();
    var nextPartial = partial || {};
    var analytics = Object.prototype.hasOwnProperty.call(nextPartial, 'analytics')
      ? !!nextPartial.analytics
      : (prev.decided ? prev.analytics : false);
    var ads = Object.prototype.hasOwnProperty.call(nextPartial, 'ads')
      ? !!nextPartial.ads
      : (prev.decided ? prev.ads : false);
    var record = { v: 2, analytics: analytics, ads: ads, ts: Date.now() };
    try {
      localStorage.setItem(KEY, JSON.stringify(record));
      localStorage.setItem(LEGACY_KEY, analytics && ads ? 'accepted' : 'rejected');
    } catch (_err) {}
    var detail = snapshot(true, analytics, ads, record.ts);
    emit(detail);
    return detail;
  }

  window.atomurusConsent = {
    get: get,
    set: set,
    open: function () {
      try {
        window.dispatchEvent(new CustomEvent('atomurus:consent-open'));
      } catch (_err) {}
    },
    onChange: function (cb) {
      if (typeof cb === 'function') listeners.push(cb);
    }
  };
})();
