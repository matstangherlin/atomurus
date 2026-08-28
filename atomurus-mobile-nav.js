/* atomurus-mobile-nav.js
 * Injects a mobile-only hamburger button + slide-in menu drawer into any
 * page that has a .lc-topnav (landing + doc pages). Pages with sidebars
 * already have their own drawer pattern and skip this. Idempotent.
 */
(function () {
  'use strict';

  // Already mounted? bail
  if (document.getElementById('lc-mobile-menu')) return;

  var topnav = document.querySelector('.lc-topnav');
  if (!topnav) return; // not a landing/doc page

  // ── Build drawer ─────────────────────────────────────────────
  var routes = [
    { href: 'index.html',                      label: 'Home',          i18n: 'common.nav.home',          n: '00' },
    { href: 'periodic-table.html',             label: 'Periodic Table',i18n: 'common.nav.periodic',      n: '01' },
    { href: 'viewer/atomic-models.html',       label: 'Atomic Models', i18n: 'common.nav.atomicModels',  n: '02' },
    { href: 'viewer/molecules.html',           label: 'Molecules',     i18n: 'common.nav.molecules',     n: '03' },
    { href: 'viewer/allotropes.html',          label: 'Allotropes',    i18n: 'common.nav.allotropes',    n: '04' },
    { href: 'viewer/isomerism/constitutional/function.html', label: 'Isomerism', i18n: 'common.nav.isomerism', n: '05' },
    { href: 'calculators.html',                label: 'Calculators',   i18n: 'common.nav.calc',          n: '06' },
    { href: 'explore.html',                    label: 'Explore',       i18n: 'common.nav.explore',       n: '07' },
    { sep: true },
    { href: 'config.html',                     label: 'Settings',      i18n: 'common.nav.settings',      n: '08' },
    { href: 'about.html',                      label: 'About',         i18n: 'common.nav.about',         n: '09' },
    { href: 'contact.html',                    label: 'Contact',       i18n: 'common.nav.contact',       n: '10' },
  ];

  // Make hrefs work whether we are at site root or one level deep (e.g. viewer/)
  var depth = (location.pathname.split('/').filter(Boolean).length - 1);
  // Heuristic: if this html file lives under a subdir (like viewer/), prefix '../'
  // Detect via current script location is tricky; use the simpler check: if a
  // sibling like 'index.html' isn't reachable, we'll just let the browser 404.
  // For our project layout only index/about/privacy/terms/contact load this — they're at root.

  var overlay = document.createElement('div');
  overlay.id = 'lc-mobile-menu-overlay';
  overlay.className = 'lc-mobile-menu-overlay';

  var drawer = document.createElement('aside');
  drawer.id = 'lc-mobile-menu';
  drawer.className = 'lc-mobile-menu';
  drawer.setAttribute('aria-hidden', 'true');

  var drawerInner = '<div class="lc-mobile-menu-head">' +
      '<div class="lc-mobile-menu-brand">' +
        '<div class="lc-topnav-mark">' +
          '<svg width="16" height="16" viewBox="0 0 16 16" fill="none">' +
          '<circle cx="8" cy="8" r="2.5" fill="currentColor"/>' +
          '<ellipse cx="8" cy="8" rx="6.5" ry="2.8" stroke="currentColor" stroke-width="1.1" fill="none"/>' +
          '<ellipse cx="8" cy="8" rx="6.5" ry="2.8" stroke="currentColor" stroke-width="1.1" fill="none" transform="rotate(60 8 8)"/>' +
          '<ellipse cx="8" cy="8" rx="6.5" ry="2.8" stroke="currentColor" stroke-width="1.1" fill="none" transform="rotate(120 8 8)"/>' +
          '</svg>' +
        '</div>' +
        '<div>' +
          '<div class="lc-mobile-menu-name">Atomurus</div>' +
          '<div class="lc-mobile-menu-tag" data-i18n="common.brandTag">chemistry lab</div>' +
        '</div>' +
      '</div>' +
      '<button class="lc-mobile-menu-close" aria-label="Close menu">' +
        '<svg width="14" height="14" viewBox="0 0 14 14" fill="none">' +
          '<path d="M2 2l10 10M12 2L2 12" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"/>' +
        '</svg>' +
      '</button>' +
    '</div>' +
    '<nav class="lc-mobile-menu-list">';

  var here = location.pathname.replace(/\/+$/, '').split('/').pop() || 'index.html';
  for (var i = 0; i < routes.length; i++) {
    var r = routes[i];
    if (r.sep) { drawerInner += '<div class="lc-mobile-menu-sep"></div>'; continue; }
    var isActive = (r.href === here) || (r.href.endsWith(here) && here !== 'index.html');
    drawerInner += '<a class="lc-mobile-menu-item' + (isActive ? ' active' : '') + '" href="' + r.href + '">' +
      '<span class="lc-mobile-menu-label" data-i18n="' + r.i18n + '">' + r.label + '</span>' +
      '<svg class="lc-mobile-menu-arrow" width="14" height="14" viewBox="0 0 14 14" fill="none">' +
        '<path d="M5 3l4 4-4 4" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>' +
      '</svg>' +
    '</a>';
  }
  drawerInner += '</nav>' +
    '<div class="lc-mobile-menu-foot">' +
      '<span class="lc-mobile-menu-foot-k">atomurus.com</span>' +
      '<span class="lc-mobile-menu-foot-v" data-i18n="common.mobileFoot">· open chemistry lab</span>' +
    '</div>';

  drawer.innerHTML = drawerInner;
  document.body.appendChild(overlay);
  document.body.appendChild(drawer);

  // ── Build hamburger button ──────────────────────────────────
  var hamb = document.createElement('button');
  hamb.className = 'lc-mobile-hamb';
  hamb.setAttribute('aria-label', 'Open menu');
  hamb.setAttribute('aria-expanded', 'false');
  hamb.innerHTML = '<svg width="18" height="18" viewBox="0 0 18 18" fill="none">' +
    '<line x1="2.5" y1="5" x2="15.5" y2="5" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>' +
    '<line x1="2.5" y1="9" x2="15.5" y2="9" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>' +
    '<line x1="2.5" y1="13" x2="15.5" y2="13" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>' +
    '</svg>';

  // Insert hamburger right after the brand (so it shows on the right of brand
  // on mobile via flex layout)
  var brand = topnav.querySelector('.lc-topnav-brand');
  if (brand && brand.nextSibling) {
    topnav.insertBefore(hamb, brand.nextSibling);
  } else {
    topnav.appendChild(hamb);
  }

  // ── Open / close logic ──────────────────────────────────────
  function open() {
    drawer.classList.add('open');
    overlay.classList.add('show');
    drawer.setAttribute('aria-hidden', 'false');
    hamb.setAttribute('aria-expanded', 'true');
    document.documentElement.style.overflow = 'hidden';
  }
  function close() {
    drawer.classList.remove('open');
    overlay.classList.remove('show');
    drawer.setAttribute('aria-hidden', 'true');
    hamb.setAttribute('aria-expanded', 'false');
    document.documentElement.style.overflow = '';
  }
  hamb.addEventListener('click', open);
  overlay.addEventListener('click', close);
  drawer.querySelector('.lc-mobile-menu-close').addEventListener('click', close);
  // Close on Esc
  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape' && drawer.classList.contains('open')) close();
  });
  // Close after navigating
  drawer.querySelectorAll('.lc-mobile-menu-item').forEach(function (a) {
    a.addEventListener('click', function () { setTimeout(close, 100); });
  });
})();
