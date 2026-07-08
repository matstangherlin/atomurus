/* ──────────────────────────────────────────────────────────────────
   Atomurus — reCAPTCHA v3 (client integration)
   ──────────────────────────────────────────────────────────────────
   Loads Google reCAPTCHA v3 with the public site key, fires a token
   on page load (action = view_<page>) so Google can build a
   behavioural profile, and exposes helpers for any future form.

   IMPORTANT
   - The SITE_KEY below is PUBLIC by design (it must be in client code).
   - The SECRET key must NEVER appear in this file. Server-side
     verification (siteverify) lives in netlify/functions/recaptcha-verify.js
     and reads the secret from the RECAPTCHA_SECRET_KEY env var.
   - Reference: https://developers.google.com/recaptcha/docs/v3
                https://developers.google.com/recaptcha/docs/verify

   QUICK USAGE
   -----------
   // 1) Just get a token (client only — no verification):
   atomurusGetRecaptchaToken('contact_submit').then(function(token){ ... });

   // 2) Get a token AND verify it via the Netlify Function (recommended):
   atomurusVerifyRecaptcha('contact_submit').then(function(result){
     if (result.pass) { /+ good user +/ } else { /+ block / challenge +/ }
   });

   // 3) End-to-end diagnostic from browser console:
   atomurusTestRecaptcha()
   ──────────────────────────────────────────────────────────────── */
(function () {
  var SITE_KEY = '6Ldvp-wsAAAAACaEx0jg7JQbpHEx9DtEGdQ5A8u3';
  var VERIFY_ENDPOINT = '/.netlify/functions/recaptcha-verify';

  // ── 1. Inject the reCAPTCHA v3 script (idempotent, on demand) ──
  // The Google api.js bundle is ~200 KiB and is only needed where a form
  // actually verifies a token (currently just the contact page). To avoid
  // paying that download + main-thread cost on every page, we DON'T inject
  // eagerly here — `ensureLoaded()` is called lazily by the token helpers
  // and by the auto-pageview below only when the page has a <form>.
  function ensureLoaded() {
    if (document.querySelector('script[data-atomurus-recaptcha]')) return;
    var s = document.createElement('script');
    s.src = 'https://www.google.com/recaptcha/api.js?render=' + SITE_KEY;
    s.async = true;
    s.defer = true;
    s.dataset.atomurusRecaptcha = '1';
    document.head.appendChild(s);
  }

  // ── 2. Derive a per-page action name (alphanumeric only) ───────
  function inferAction() {
    var path = (location.pathname || '').replace(/^.*\//, '').replace(/\.html?$/i, '');
    if (!path) path = 'home';
    return ('view_' + path).replace(/[^a-z0-9_]/gi, '_').slice(0, 100);
  }

  // ── 3. Helper any page can call to fetch a fresh token ─────────
  window.atomurusGetRecaptchaToken = function (actionName) {
    ensureLoaded(); // lazy-load the Google bundle the first time a token is asked for
    return new Promise(function (resolve, reject) {
      var tries = 0;
      (function wait() {
        if (window.grecaptcha && typeof grecaptcha.ready === 'function') {
          grecaptcha.ready(function () {
            try {
              grecaptcha.execute(SITE_KEY, { action: actionName || 'action' })
                .then(resolve, reject);
            } catch (e) { reject(e); }
          });
        } else if (++tries < 50) {
          setTimeout(wait, 100);
        } else {
          reject(new Error('reCAPTCHA failed to load'));
        }
      })();
    });
  };

  // ── 4. One-shot helper: get token + verify on the backend ──────
  window.atomurusVerifyRecaptcha = function (actionName, opts) {
    opts = opts || {};
    var endpoint = opts.endpoint || VERIFY_ENDPOINT;
    return window.atomurusGetRecaptchaToken(actionName).then(function (token) {
      return fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          token: token,
          action: actionName,
          minScore: typeof opts.minScore === 'number' ? opts.minScore : undefined
        })
      }).then(function (r) {
        if (!r.ok) throw new Error('verify HTTP ' + r.status);
        return r.json();
      });
    });
  };

  // ── 5. Fire a pageview token so Google sees real traffic ───────
  // Only on pages that actually have a form to protect (the contact page).
  // Elsewhere we skip the load entirely — the ~200 KiB Google bundle and its
  // main-thread work were the single biggest performance cost site-wide.
  var pageAction = inferAction();
  if (!document.querySelector('form')) {
    window.atomurusRecaptchaReady = Promise.resolve(null);
    return;
  }
  window.atomurusRecaptchaReady = window.atomurusGetRecaptchaToken(pageAction)
    .then(function (token) {
      window.atomurusRecaptchaToken = token;
      try {
        document.dispatchEvent(new CustomEvent('atomurus:recaptcha', {
          detail: { action: pageAction, token: token }
        }));
      } catch (e) { /* old browsers — ignore */ }
      if (window.console && console.info) {
        console.info('%c[atomurus] reCAPTCHA v3 loaded · action=' + pageAction + ' · token ready',
          'color:#34A872;font-weight:600');
        console.info('%c[atomurus] Run atomurusTestRecaptcha() to verify the backend.',
          'color:#888');
      }
      return token;
    })
    .catch(function (err) {
      if (window.console && console.warn) console.warn('[atomurus] reCAPTCHA pageview skipped:', err);
    });

  // ── 6. Diagnostic helper — run from console to verify end-to-end
  window.atomurusTestRecaptcha = function () {
    console.log('%c[atomurus] running reCAPTCHA end-to-end test…',
      'color:#1E6A50;font-weight:600');
    return window.atomurusVerifyRecaptcha('diagnostic').then(function (r) {
      var ok = r && r.pass;
      var color = ok ? '#16a34a' : '#dc2626';
      console.log('%c[atomurus] ' + (ok ? '✓ PASS' : '✗ FAIL') +
        '  ·  score=' + r.score +
        '  ·  action=' + r.action,
        'color:' + color + ';font-weight:700;font-size:13px');
      console.log(r);
      return r;
    }).catch(function (e) {
      console.error('[atomurus] ✗ Backend unreachable:', e);
      console.info('Did you (1) set RECAPTCHA_SECRET_KEY on Netlify env vars, ' +
        'and (2) deploy with netlify/functions/recaptcha-verify.js?');
      throw e;
    });
  };
})();
