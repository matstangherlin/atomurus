// ───────────────────────────────────────────────────────────────────
// Atomurus — Lazy loader for Google Analytics
// ───────────────────────────────────────────────────────────────────
// AdSense (adsbygoogle.js) lives directly in <head> with async +
// fetchpriority="low" — that's required for AdSense's snippet detection
// AND for Auto Ads to scan pages. Putting it in head with fetchpriority
// "low" gives Google what it needs without competing with critical CSS
// or hero images for the LCP.
//
// Analytics (gtag.js) stays here, deferred until the user shows real
// intent (any interaction) or 5s of idle. Most people who close the
// tab in <5s aren't worth a GA hit anyway, and this trims ~150 KiB
// off the first-load chain.
//
// Triggers (whichever fires first):
//   • scroll · click · touchstart · keydown · mousemove
//   • 5 s of idle
//   • visibility hidden (fire before unload so bounce gets counted)
// ───────────────────────────────────────────────────────────────────

(function () {
  'use strict';

  var GA_ID         = 'G-Q3ME3FMB8X';
  var IDLE_DELAY_MS = 5000;

  // Bootstrap gtag's dataLayer/queue immediately so gtag() calls work
  // even before the real script loads.
  window.dataLayer = window.dataLayer || [];
  window.gtag = window.gtag || function () { window.dataLayer.push(arguments); };
  window.gtag('js', new Date());
  window.gtag('config', GA_ID);

  var loaded = false;
  function loadAnalytics() {
    if (loaded) return;
    loaded = true;

    var ga = document.createElement('script');
    ga.async = true;
    ga.src = 'https://www.googletagmanager.com/gtag/js?id=' + GA_ID;
    document.head.appendChild(ga);
  }

  // Interaction triggers
  var events = ['scroll', 'click', 'touchstart', 'keydown', 'mousemove'];
  function trigger() {
    events.forEach(function (evt) {
      window.removeEventListener(evt, trigger);
    });
    loadAnalytics();
  }
  events.forEach(function (evt) {
    window.addEventListener(evt, trigger, { once: true, passive: true });
  });

  // Idle timeout
  setTimeout(loadAnalytics, IDLE_DELAY_MS);

  // Page hidden — make sure analytics fires before unload
  document.addEventListener('visibilitychange', function () {
    if (document.visibilityState === 'hidden') loadAnalytics();
  });
})();
