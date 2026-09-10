/* Progressive guest signup prompt. Skips signed-in users and auth pages. */
(function () {
  'use strict';

  var DISMISS_KEY = 'atomurus-guest-nudge';
  var VIEWS_KEY = 'atomurus-guest-lab-views';
  var DISMISS_MS = 14 * 24 * 60 * 60 * 1000;
  var VIEW_THRESHOLD = 3;
  var TIME_MS = 40000;

  function path() {
    return (location.pathname || '/').replace(/\/+$/, '') || '/';
  }

  function skipPage() {
    return /\/(login|signup)(?:\.html)?$/i.test(path());
  }

  function isLabPath() {
    var p = path().toLowerCase();
    return p === '/app' ||
      p.indexOf('/viewer') !== -1 ||
      p.indexOf('/periodic-table') !== -1 ||
      p.indexOf('/calculators') !== -1 ||
      p.indexOf('/explore') !== -1;
  }

  function authState() {
    try {
      if (window.AtomurusAuth && typeof window.AtomurusAuth.getState === 'function') {
        var managed = window.AtomurusAuth.getState();
        if (managed && managed.ready) return managed;
      }
    } catch (e) {}
    try {
      if (window.AtomurusAuth && window.AtomurusAuth.state && window.AtomurusAuth.state.ready) {
        return window.AtomurusAuth.state;
      }
    } catch (e2) {}
    if (window.__ATOMURUS_AUTH__ && window.__ATOMURUS_AUTH__.ready) return window.__ATOMURUS_AUTH__;
    if (window.__ATOMURUS_ADS__ && window.__ATOMURUS_ADS__.ready) return window.__ATOMURUS_ADS__;
    return null;
  }

  function signedIn() {
    var state = authState();
    if (state) return Boolean(state.signedIn);
    var chip = document.querySelector('[data-atomurus-account-chip], #ws-userchip');
    if (chip && chip.classList.contains('is-guest-cta')) return false;
    var href = chip ? (chip.getAttribute('href') || '') : '';
    if (/signup|login/.test(href)) return false;
    if (chip && (/\/account(?:\.html)?(?:\?|$)/.test(href) || /section=account/.test(href))) return true;
    return false;
  }

  function authKnown() {
    return Boolean(authState());
  }

  function whenReady(fn) {
    if (authKnown()) {
      fn();
      return;
    }
    var done = false;
    function go() {
      if (done) return;
      done = true;
      document.removeEventListener('atomurus-ads-ready', go);
      document.removeEventListener('atomurus-auth-change', go);
      fn();
    }
    document.addEventListener('atomurus-ads-ready', go);
    document.addEventListener('atomurus-auth-change', go);
    setTimeout(go, 4000);
  }

  function dismissed() {
    try {
      var raw = localStorage.getItem(DISMISS_KEY);
      if (!raw) return false;
      var t = parseInt(raw, 10);
      if (!t) return true;
      return (Date.now() - t) < DISMISS_MS;
    } catch (e) {
      return false;
    }
  }

  function markDismissed() {
    try { localStorage.setItem(DISMISS_KEY, String(Date.now())); } catch (e) {}
  }

  function bumpViews() {
    if (!isLabPath()) return 0;
    try {
      var n = parseInt(sessionStorage.getItem(VIEWS_KEY) || '0', 10) || 0;
      n += 1;
      sessionStorage.setItem(VIEWS_KEY, String(n));
      return n;
    } catch (e) {
      return 0;
    }
  }

  function t(key, fallback) {
    try {
      if (window.I18N && typeof window.I18N.t === 'function') {
        var v = window.I18N.t(key);
        if (v && v !== key) return v;
      }
    } catch (e) {}
    return fallback;
  }

  function signupHref() {
    if (window.AtomurusNav && typeof window.AtomurusNav.guestSignupHref === 'function') {
      return window.AtomurusNav.guestSignupHref();
    }
    if (window.I18N && typeof window.I18N.guestSignupHref === 'function') {
      return window.I18N.guestSignupHref();
    }
    return '/signup?next=' + encodeURIComponent((location.pathname || '/') + (location.search || ''));
  }

  function ensureCss() {
    if (document.getElementById('atomurus-guest-nudge-css')) return;
    var s = document.createElement('style');
    s.id = 'atomurus-guest-nudge-css';
    s.textContent =
      '.atomurus-guest-nudge{position:fixed;left:16px;right:16px;bottom:18px;z-index:80;max-width:520px;margin:0 auto;' +
      'background:var(--color-surface,#F8F5EC);color:var(--color-text,#14120E);border:1px solid var(--color-border,#D8D2BF);' +
      'border-radius:14px;padding:14px 16px 14px;box-shadow:0 18px 40px rgba(20,18,14,.14);font-family:var(--font-ui,Inter Tight,system-ui,sans-serif)}' +
      '.atomurus-guest-nudge h2{margin:0 0 4px;font-family:var(--font-serif,Instrument Serif,Georgia,serif);font-size:22px;font-weight:400;letter-spacing:-.02em}' +
      '.atomurus-guest-nudge p{margin:0 0 12px;font-size:14px;line-height:1.45;color:var(--color-text-muted,#58544A)}' +
      '.atomurus-guest-nudge-actions{display:flex;gap:8px;flex-wrap:wrap}' +
      '.atomurus-guest-nudge a,.atomurus-guest-nudge button{min-height:40px;padding:0 14px;border-radius:10px;font:inherit;font-weight:600;cursor:pointer}' +
      '.atomurus-guest-nudge a{display:inline-flex;align-items:center;background:#1E6A50;color:#F8F5EC;text-decoration:none;border:1px solid #1E6A50}' +
      '.atomurus-guest-nudge button{background:transparent;border:1px solid var(--color-border,#D8D2BF);color:inherit}' +
      '@media (max-width:760px){.atomurus-guest-nudge{bottom:72px}}';
    document.head.appendChild(s);
  }

  function show() {
    if (document.getElementById('atomurus-guest-nudge')) return;
    if (skipPage() || dismissed() || signedIn()) return;
    if (!authKnown() && document.documentElement.classList.contains('auth-pending')) return;
    ensureCss();
    var el = document.createElement('div');
    el.id = 'atomurus-guest-nudge';
    el.className = 'atomurus-guest-nudge';
    el.setAttribute('role', 'dialog');
    el.setAttribute('aria-label', t('common.auth.nudgeTitle', 'Keep this in your workspace'));
    el.innerHTML =
      '<h2>' + t('common.auth.nudgeTitle', 'Keep this in your workspace') + '</h2>' +
      '<p>' + t('common.auth.nudgeBody', 'Create a free account to save structures, notes and study sets. The Open Lab stays free.') + '</p>' +
      '<div class="atomurus-guest-nudge-actions">' +
      '<a href="' + signupHref() + '">' + t('common.auth.createAccount', 'Create account') + '</a>' +
      '<button type="button" data-nudge-later>' + t('common.auth.nudgeLater', 'Not now') + '</button>' +
      '</div>';
    el.querySelector('[data-nudge-later]').addEventListener('click', function () {
      markDismissed();
      el.remove();
    });
    document.body.appendChild(el);
  }

  function maybeShow(force) {
    whenReady(function () {
      if (skipPage() || signedIn() || dismissed()) return;
      if (force || bumpViews() >= VIEW_THRESHOLD) show();
    });
  }

  whenReady(function () {
    if (signedIn() || skipPage() || dismissed()) return;
    var views = bumpViews();
    if (views >= VIEW_THRESHOLD) {
      if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', function () { show(); });
      else show();
    } else if (isLabPath()) {
      setTimeout(function () { whenReady(show); }, TIME_MS);
    }
  });

  document.addEventListener('atomurus:guest-nudge', function () { maybeShow(true); });
  document.addEventListener('click', function (event) {
    var tEl = event.target && event.target.closest && event.target.closest('[data-study-save], [data-atomurus-save], .study-save-cta');
    if (!tEl) return;
    setTimeout(function () { maybeShow(true); }, 800);
  }, true);
})();
