// ───────────────────────────────────────────────────────────────────
// Atomurus — share-button initializer for atomic-model pages
// ───────────────────────────────────────────────────────────────────
// Each model page (bohr.html, dalton.html, …) loads share-button.js
// and then this file. We pull the localized name from the existing
// .lc-el-name <h1> (already i18n'd by i18n.js) and inject the share
// button with proper title/text/UTM-tagged URL.
//
// Re-runs on language change so the share text translates with the UI.
// Includes a retry in case share-button.js loads after this file (rare
// race when defer ordering is broken by a slow CDN).
// ───────────────────────────────────────────────────────────────────

(function () {
  'use strict';

  function tryInit(attempts) {
    if (typeof window.injectShareButton !== 'function') {
      // share-button.js not loaded yet (or failed). Retry a few times.
      if ((attempts || 0) < 20) {
        return setTimeout(function () { tryInit((attempts || 0) + 1); }, 100);
      }
      // Give up silently — don't break the page over a missing share button.
      return;
    }
    var anchor = document.querySelector('.lc-el-header-l');
    if (!anchor) {
      // DOM not parsed enough yet — retry a few times before giving up.
      if ((attempts || 0) < 20) {
        return setTimeout(function () { tryInit((attempts || 0) + 1); }, 100);
      }
      return;
    }
    var h1   = document.querySelector('.lc-el-name');
    var rawName = h1 ? h1.textContent.trim() : '';
    var name = rawName || document.title.replace(/ — Atomurus.*/i, '').trim() || document.title;

    window.injectShareButton({
      anchor:     anchor,
      title:      document.title,
      text:       name + ' — Atomurus',
      campaign:   'atomic_model_share',
      extraClass: 'share-host-am',
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', function () { tryInit(0); });
  } else {
    tryInit(0);
  }
  if (window.I18N && I18N.onChange) {
    I18N.onChange(function () { tryInit(0); });
  }
})();
