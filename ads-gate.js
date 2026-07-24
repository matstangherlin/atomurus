// ───────────────────────────────────────────────────────────────────
// Atomurus — Ad entitlement gate + deferred third-party ad loaders
// ───────────────────────────────────────────────────────────────────
// Fetches /api/ads-config (cookie session). Pro / trial / admin → ads off.
// Anonymous and free accounts keep monetization scripts.
//
// Performance:
//   • AdSense loads only after entitlement says ads are on (not in every HTML head).
//   • AdCash (aclib.js) loads after first interaction or a short idle delay —
//     it must NOT sit as the first blocking <script> in <head>.
//
// Usage:
//   <script src="ads-gate.js?v=…"></script> early in <head> (sync, small)
//   Call window.atomurusRunAutoTag({ zoneId: '…' }) anywhere (queued until ready)
// ───────────────────────────────────────────────────────────────────

(function () {
  'use strict';

  var ADCASH_SRC = 'https://acscdn.com/script/aclib.js';
  var ADSENSE_SRC =
    'https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-9495821870733084';
  var DEFAULT_ZONE = 'o42jwt5vja';
  var ADCASH_IDLE_MS = 3500;

  var state = {
    ready: false,
    adsEnabled: true,
    signedIn: false,
    isPro: false,
    plan: 'free',
    user: null,
    pricingContext: null
  };

  window.__ATOMURUS_ADS__ = state;

  var waiters = [];
  var autoTagQueue = window.__ATOMURUS_AUTOTAG_Q || [];
  window.__ATOMURUS_AUTOTAG_Q = autoTagQueue;

  var aclibPromise = null;
  var aclibLoadScheduled = false;

  function notify() {
    state.ready = true;
    document.documentElement.classList.toggle('ads-free', !state.adsEnabled);
    document.dispatchEvent(new CustomEvent('atomurus-ads-ready', { detail: state }));
    var queue = waiters.slice();
    waiters = [];
    queue.forEach(function (cb) {
      try { cb(state); } catch (_err) {}
    });
  }

  function neutralizeThirdPartyAds() {
    window.aclib = window.aclib || {};
    window.aclib.runAutoTag = function () {};

    try {
      (window.adsbygoogle = window.adsbygoogle || []).pauseAdRequests = 1;
    } catch (_err) {}

    var style = document.getElementById('atomurus-ads-free-style');
    if (!style) {
      style = document.createElement('style');
      style.id = 'atomurus-ads-free-style';
      style.textContent =
        'html.ads-free .adsbygoogle,html.ads-free [id^="google_ads_iframe"],html.ads-free iframe[src*="pagead"]{display:none!important;height:0!important;min-height:0!important;visibility:hidden!important}';
      document.head.appendChild(style);
    }

    document.querySelectorAll('script#aclib, script[src*="acscdn.com/script/aclib"]').forEach(function (el) {
      try { el.remove(); } catch (_err) {}
    });
  }

  function loadAdSenseIfNeeded() {
    if (!state.adsEnabled) return;
    if (document.querySelector('script[src*="adsbygoogle.js"]')) return;
    if (window.__ATOMURUS_ADSENSE_LOADER__) return;
    window.__ATOMURUS_ADSENSE_LOADER__ = true;
    var s = document.createElement('script');
    s.async = true;
    s.src = ADSENSE_SRC;
    s.crossOrigin = 'anonymous';
    s.setAttribute('fetchpriority', 'low');
    document.head.appendChild(s);
  }

  function ensureAclib() {
    if (!state.adsEnabled) {
      return Promise.resolve(null);
    }
    if (window.aclib && typeof window.aclib.runAutoTag === 'function' && !window.aclib.__atomurusStub) {
      return Promise.resolve(window.aclib);
    }
    if (aclibPromise) return aclibPromise;

    aclibPromise = new Promise(function (resolve, reject) {
      var existing = document.querySelector('script#aclib, script[src*="acscdn.com/script/aclib"]');
      if (existing && window.aclib && typeof window.aclib.runAutoTag === 'function' && !window.aclib.__atomurusStub) {
        resolve(window.aclib);
        return;
      }

      var s = document.createElement('script');
      s.id = 'aclib';
      s.async = true;
      s.src = ADCASH_SRC;
      s.setAttribute('fetchpriority', 'low');
      s.onload = function () {
        resolve(window.aclib || null);
      };
      s.onerror = function () {
        reject(new Error('Failed to load AdCash'));
      };
      document.head.appendChild(s);
    }).catch(function () {
      return null;
    });

    return aclibPromise;
  }

  function flushAutoTagQueue() {
    if (!state.adsEnabled || !autoTagQueue.length) return;
    ensureAclib().then(function (aclib) {
      if (!aclib || typeof aclib.runAutoTag !== 'function' || aclib.__atomurusStub) return;
      while (autoTagQueue.length) {
        var opts = autoTagQueue.shift();
        try {
          aclib.runAutoTag(opts || { zoneId: DEFAULT_ZONE });
        } catch (_err) {}
      }
    });
  }

  function scheduleAclibLoad() {
    if (!state.adsEnabled || aclibLoadScheduled) return;
    aclibLoadScheduled = true;

    var fired = false;
    function trigger() {
      if (fired) return;
      fired = true;
      events.forEach(function (evt) {
        window.removeEventListener(evt, trigger);
      });
      flushAutoTagQueue();
      // Even with an empty queue, warm AdCash after intent so late calls are fast.
      ensureAclib();
    }

    var events = ['scroll', 'click', 'touchstart', 'keydown', 'pointerdown'];
    events.forEach(function (evt) {
      window.addEventListener(evt, trigger, { once: true, passive: true });
    });
    setTimeout(trigger, ADCASH_IDLE_MS);
  }

  // Early stub so inline footer calls never throw before boot finishes.
  window.aclib = window.aclib || {
    __atomurusStub: true,
    runAutoTag: function (opts) {
      window.atomurusRunAutoTag(opts);
    }
  };

  window.atomurusWhenAdsAllowed = function (fn) {
    if (typeof fn !== 'function') return;
    if (state.ready) {
      if (state.adsEnabled) fn(state);
      return;
    }
    waiters.push(function (s) {
      if (s.adsEnabled) fn(s);
    });
  };

  window.atomurusRunAutoTag = function (opts) {
    autoTagQueue.push(opts || { zoneId: DEFAULT_ZONE });
    if (!state.ready) return;
    if (!state.adsEnabled) {
      autoTagQueue.length = 0;
      return;
    }
    scheduleAclibLoad();
    flushAutoTagQueue();
  };

  async function boot() {
    try {
      var res = await fetch('/api/ads-config', {
        credentials: 'include',
        headers: { Accept: 'application/json' }
      });
      var data = await res.json().catch(function () { return {}; });
      if (data && data.ok) {
        state.adsEnabled = data.adsEnabled !== false;
        state.signedIn = Boolean(data.signedIn);
        state.user = data.user || null;
        state.pricingContext = data.pricingContext || null;
        if (data.user) {
          state.isPro = Boolean(data.user.isPro);
          state.plan = data.user.plan || 'free';
        }
      }
    } catch (_err) {
      // Network/function failure → keep ads (don't accidentally wipe revenue).
      state.adsEnabled = true;
    }

    if (!state.adsEnabled) {
      autoTagQueue.length = 0;
      neutralizeThirdPartyAds();
    } else {
      loadAdSenseIfNeeded();
      // AdCash stays deferred until interaction / idle — never on the critical path.
      scheduleAclibLoad();
    }
    notify();
  }

  boot();
})();
