/* Atomurus — Android app layer (injected only into the APK copy of the site
   by tools/build-android-web.mjs; the website never loads this file).

   For now the app has no accounts and no purchases:
     - every sign-in, sign-up, account, plan and upgrade entry is hidden
       (android-app.css) and their pages send you back home;
     - /api/* answers "signed out" locally, so nothing waits on the network;
     - no ads and no analytics, so the cookie banner is not needed.

   Capacitor's local server answers every extension-less path with
   index.html. This script is the first thing in every page, so it maps
   /app → /app.html, /periodic-table/ferrum → …/ferrum.html, etc. */
(function () {
  'use strict';
  var root = document.documentElement;
  root.classList.add('is-native-app', 'is-android-app');
  root.setAttribute('data-native-app', 'android');
  window.__ATOMURUS_APP__ = Object.freeze({ platform: 'android', accounts: false, payments: false, ads: false });

  /* Filled in by the build: every page that ships in the APK. */
  var PAGES = /*__PAGES__*/{};
  var HIDDEN = {
    '/login': 1, '/signup': 1, '/account': 1, '/forgot-password': 1, '/reset-password': 1,
    '/pricing': 1, '/checkout': 1, '/billing': 1, '/auth/callback': 1, '/confirm': 1
  };

  function bare(path) {
    var p = String(path || '/').replace(/\/+$/, '') || '/';
    return p.replace(/(\.pt|\.en)?\.html$/i, '');
  }

  /* Where a site path lives inside the APK, or null if it does not. */
  function localPath(path) {
    var p = String(path || '/').replace(/\/+$/, '') || '/';
    if (HIDDEN[bare(p)]) return '/';
    if (p === '/' || p === '/index.html') return '/index.html';
    if (PAGES[p]) return p;
    if (!/\.[a-z0-9]+$/i.test(p)) {
      if (PAGES[p + '.html']) return p + '.html';
      if (PAGES[p + '/index.html']) return p + '/index.html';
      return null;
    }
    return p;
  }

  /* 1. Routing. */
  (function route() {
    var here = location.pathname;
    var target = localPath(here);
    var wanted = target === '/index.html' ? '/' : target;
    if (target === null) { location.replace('/'); return; }
    if (wanted !== here && !(here === '/index.html' && wanted === '/')) {
      var keepQuery = HIDDEN[bare(here)] ? '' : location.search + location.hash;
      location.replace(wanted + keepQuery);
    }
  })();

  /* 2. No ads, no analytics: record the choice so the banner never shows. */
  try {
    var KEY = 'atomurus-cookie-consent-v2';
    var raw = localStorage.getItem(KEY);
    var rec = raw ? JSON.parse(raw) : null;
    if (!rec || rec.v !== 2 || rec.ads || rec.analytics) {
      localStorage.setItem(KEY, JSON.stringify({ v: 2, analytics: false, ads: false, ts: Date.now() }));
      localStorage.setItem('atomurus-cookie-consent', 'rejected');
    }
  } catch (e) {}

  /* 3. The site's API is not part of the app yet: answer "signed out". */
  if (typeof window.fetch === 'function') {
    var nativeFetch = window.fetch.bind(window);
    window.fetch = function (input, init) {
      try {
        var url = typeof input === 'string' ? input : (input && input.url) || '';
        var u = new URL(url, location.href);
        var ours = u.origin === location.origin || /(^|\.)atomurus\.com$/i.test(u.hostname);
        if (ours && u.pathname.indexOf('/api/') === 0) {
          return Promise.resolve(new Response(JSON.stringify({ ok: false, error: 'session_expired', code: 'app_no_accounts' }), {
            status: 401,
            headers: { 'Content-Type': 'application/json' }
          }));
        }
      } catch (e) {}
      return nativeFetch(input, init);
    };
  }
  if (navigator.sendBeacon) {
    try { navigator.sendBeacon = function () { return true; }; } catch (e) {}
  }

  /* 4. Links. Site links (relative or https://atomurus.com/…) stay inside the
     app; account, plan and payment links go nowhere; other sites open in the
     browser (Capacitor does that for any other host). */
  document.addEventListener('click', function (event) {
    if (event.defaultPrevented || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey) return;
    var a = event.target && event.target.closest ? event.target.closest('a[href]') : null;
    if (!a) return;
    var href = a.getAttribute('href') || '';
    if (!href || href.charAt(0) === '#' || /^(mailto|tel|javascript):/i.test(href)) return;
    var u;
    try { u = new URL(href, location.href); } catch (e) { return; }
    var site = u.origin === location.origin || /^(www\.)?atomurus\.com$/i.test(u.hostname);
    if (!site) return;
    var target = localPath(u.pathname);
    event.preventDefault();
    if (target === null || HIDDEN[bare(u.pathname)]) {
      if (HIDDEN[bare(u.pathname)]) return;
      location.assign('/');
      return;
    }
    location.assign((target === '/index.html' ? '/' : target) + u.search + u.hash);
  }, true);

  /* 5. Script-driven navigation to an account page (e.g. a "save" button
     that wants you signed in) ends on the page you were on. */
  window.addEventListener('pageshow', function () {
    root.classList.add('is-native-ready');
  });
})();
