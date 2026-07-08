// ───────────────────────────────────────────────────────────────────
// Atomurus — meta tag i18n sync for main pages
// (index, periodic-table, calculators, about, contact, privacy, terms, config)
// ───────────────────────────────────────────────────────────────────
// What it does:
//   - Reads the current <title> (already translated by i18n.js via data-i18n)
//     and the meta[name="description"] (also translated via data-i18n-attr)
//   - Mirrors them into og:title, og:description, twitter:title,
//     twitter:description so social previews match the user's language
//   - Sets og:locale to "pt_BR" or "en_US" based on I18N.lang
//   - Re-runs on every language toggle via I18N.onChange
//
// Why a separate file (vs inline): pages already have inline JS for theme.
// Centralizing meta i18n here keeps each HTML cleaner and consistent.
// Mirror of element-page.js's setMeta logic, generalized for non-element pages.
// ───────────────────────────────────────────────────────────────────

(function () {
  'use strict';

  function setMeta(selector, value) {
    var n = document.querySelector(selector);
    if (n && value != null) n.setAttribute('content', value);
  }

  function sync() {
    var titleEl = document.querySelector('title');
    var descEl  = document.querySelector('meta[name="description"]');
    var title   = titleEl ? titleEl.textContent.trim() : '';
    var desc    = descEl  ? descEl.getAttribute('content') : '';

    setMeta('meta[property="og:title"]',        title);
    setMeta('meta[property="og:description"]',  desc);
    setMeta('meta[name="twitter:title"]',       title);
    setMeta('meta[name="twitter:description"]', desc);

    var lang = (window.I18N && I18N.lang) || 'en';
    var isPt = lang === 'pt';
    setMeta('meta[property="og:locale"]',           isPt ? 'pt_BR' : 'en_US');
    setMeta('meta[property="og:locale:alternate"]', isPt ? 'en_US' : 'pt_BR');
  }

  // Run after i18n.js has applied translations (so title/desc reflect the
  // active language). i18n.js applies on DOMContentLoaded; we fire right
  // after on the same hook + on every language change.
  function init() {
    sync();
    if (window.I18N && I18N.onChange) I18N.onChange(sync);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
