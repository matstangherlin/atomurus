// ───────────────────────────────────────────────────────────────────
// Atomurus — generic page share-button initializer
// ───────────────────────────────────────────────────────────────────
// Used by every page that has a global "share this page" button:
//   - /periodic-table.html              (Table tab)
//   - /periodic-table/heatmap.html      (Heatmap tab)
//   - /periodic-table/trends.html       (Trends tab)
//   - /periodic-table/compare.html      (Compare tab)
//   - /periodic-table/isotopes.html     (Isotopes tab)
//   - /viewer/atomic-models/*.html      (each atomic model)
//   - /calculators.html                 (Calculators)
//
// Element pages (/periodic-table/<latin>.html) DON'T use this — they
// have element-page.js which calls injectShareButton with rich element
// data (symbol, atomic number, etc.) baked into the share text.
//
// Anchor priority:
//   1. .lc-el-header-l  (atomic-model pages reuse element layout)
//   2. .ph-title parent  (periodic-table tabs + calculators)
//
// Campaign UTM derived from URL path so GA4 can show which page-type
// gets shared most: "calculator_share" vs "heatmap_share" etc.
// Retries up to 2s in case share-button.js loads late.
// ───────────────────────────────────────────────────────────────────

(function () {
  'use strict';

  // Map first URL segment(s) → utm_campaign label.
  function campaignFromPath() {
    var p = location.pathname.toLowerCase().replace(/\.html$/, '').replace(/\/$/, '');
    if (p === '' || p === '/' || p === '/index') return 'home_share';
    if (p === '/calculators')               return 'calculator_share';
    if (p === '/periodic-table')            return 'periodic_table_share';
    if (p === '/periodic-table/heatmap')    return 'heatmap_share';
    if (p === '/periodic-table/trends')     return 'trends_share';
    if (p === '/periodic-table/compare')    return 'compare_share';
    if (p === '/periodic-table/isotopes')   return 'isotopes_share';
    if (p.indexOf('/viewer/atomic-models/') === 0) return 'atomic_model_share';
    if (p === '/viewer/atomic-models')      return 'atomic_models_share';
    if (p === '/viewer/molecules')          return 'molecules_share';
    if (p === '/viewer/allotropes')         return 'allotropes_share';
    if (p.indexOf('/viewer/isomerism') === 0) return 'isomerism_share';
    if (p.indexOf('/explore/') === 0) {
      var slug = p.split('/').pop().replace(/[^a-z0-9]+/g, '_').replace(/^_+|_+$/g, '');
      return slug ? 'article_' + slug + '_share' : 'article_share';
    }
    if (p === '/explore')                   return 'explore_share';
    if (p === '/about')                     return 'about_share';
    return 'page_share';
  }

  function findAnchor() {
    // Two top-bar variants across the site:
    //   .topbar      — element pages, atomic-model pages,
    //                  periodic-table tabs, calculators, viewers
    //   .lc-topnav   — home (index.html)
    // The compact share button lands BEFORE the language toggle in
    // whichever exists. That's the empty real-estate the user
    // identified in the top-right.
    return document.querySelector('.topbar') ||
           document.querySelector('.lc-topnav');
  }
  // The injectShareButton call passes `beforeNode` so the share lands
  // immediately before the language toggle (data-i18n-toggle button).
  function findBeforeNode(topbar) {
    if (!topbar) return null;
    return topbar.querySelector('[data-i18n-toggle]') ||
           topbar.querySelector('.theme-btn');
  }

  function shareTextFor() {
    // Topbar is shallow and doesn't contain the page h1. Grab the
    // localized h1 from the document instead (already i18n'd).
    var h1 = document.querySelector('.lc-el-name, .ph-title, h1');
    var raw = h1 ? h1.textContent.trim() : '';
    if (raw) return raw + ' — Atomurus';
    var stripped = document.title.replace(/ — Atomurus.*/i, '').trim();
    return (stripped || document.title) + ' — Atomurus';
  }

  function tryInit(attempts) {
    if (typeof window.injectShareButton !== 'function') {
      if ((attempts || 0) < 20) {
        return setTimeout(function () { tryInit((attempts || 0) + 1); }, 100);
      }
      return;
    }
    var anchor = findAnchor();
    if (!anchor) {
      if ((attempts || 0) < 20) {
        return setTimeout(function () { tryInit((attempts || 0) + 1); }, 100);
      }
      return;
    }
    window.injectShareButton({
      anchor:     anchor,
      beforeNode: findBeforeNode(anchor),
      compact:    true,
      title:      document.title,
      text:       shareTextFor(),
      campaign:   campaignFromPath(),
      extraClass: 'share-host-topbar',
    });
  }

  function loadStudyCloud() {
    if (window.__atomurusStudyBoot) return;
    var script = document.createElement('script');
    script.src = '/study-boot.js?v=202608280600';
    script.defer = true;
    document.head.appendChild(script);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', function () { tryInit(0); loadStudyCloud(); });
  } else {
    tryInit(0);
    loadStudyCloud();
  }
  if (window.I18N && I18N.onChange) {
    I18N.onChange(function () { tryInit(0); });
  }
})();
