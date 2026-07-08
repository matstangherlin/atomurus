// ───────────────────────────────────────────────────────────────────
// Atomurus — Ad entitlement gate
// ───────────────────────────────────────────────────────────────────
// Fetches /api/ads-config (cookie session). Pro / trial / admin → ads off.
// Anonymous and free accounts keep monetization scripts.
//
// Usage:
//   <script src="ads-gate.js" defer></script> early in <head>
//   Replace bare aclib.runAutoTag(...) with atomurusRunAutoTag(...)
//   Or call window.atomurusWhenAdsAllowed(fn)
// ───────────────────────────────────────────────────────────────────

(function () {
  'use strict';

  var state = {
    ready: false,
    adsEnabled: true,
    signedIn: false,
    isPro: false,
    plan: 'free',
    user: null
  };

  window.__ATOMURUS_ADS__ = state;

  var waiters = [];

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
    // Stop AdCash if the script tag already ran.
    window.aclib = window.aclib || {};
    window.aclib.runAutoTag = function () {};

    // Soft-stop AdSense auto ads where possible.
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

    document.querySelectorAll('script#aclib').forEach(function (el) {
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
    s.src = 'https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-9495821870733084';
    s.crossOrigin = 'anonymous';
    s.setAttribute('fetchpriority', 'low');
    document.head.appendChild(s);
  }

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
    window.atomurusWhenAdsAllowed(function () {
      if (window.aclib && typeof window.aclib.runAutoTag === 'function') {
        window.aclib.runAutoTag(opts || { zoneId: 'o42jwt5vja' });
      }
    });
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
        if (data.user) {
          state.isPro = Boolean(data.user.isPro);
          state.plan = data.user.plan || 'free';
        }
      }
    } catch (_err) {
      // Network/function failure → keep ads (don't accidentally wipe revenue).
      state.adsEnabled = true;
    }

    if (!state.adsEnabled) neutralizeThirdPartyAds();
    else loadAdSenseIfNeeded();
    notify();
  }

  boot();
})();
