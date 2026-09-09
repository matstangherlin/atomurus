/* atomurus-mobile-nav.js
 * Landing hamburger. The drawer is the same #ws-sidebar used on desktop.
 * Does not build a second navigation list.
 */
(function () {
  'use strict';

  var topnav = document.querySelector('.lc-topnav');
  if (!topnav) return;

  var sidebar = document.getElementById('ws-sidebar') || document.querySelector('[data-atomurus-sidebar]');
  if (!sidebar) return;

  if (topnav.querySelector('.lc-mobile-hamb, #ws-menu-btn, .mobile-menu-btn')) return;

  var hamb = document.createElement('button');
  hamb.className = 'lc-mobile-hamb';
  hamb.type = 'button';
  hamb.setAttribute('aria-label', 'Open menu');
  hamb.setAttribute('aria-expanded', 'false');
  hamb.setAttribute('aria-controls', 'ws-sidebar');
  hamb.innerHTML = '<svg width="18" height="18" viewBox="0 0 18 18" fill="none" aria-hidden="true">' +
    '<line x1="2.5" y1="5" x2="15.5" y2="5" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>' +
    '<line x1="2.5" y1="9" x2="15.5" y2="9" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>' +
    '<line x1="2.5" y1="13" x2="15.5" y2="13" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>' +
    '</svg>';

  var brand = topnav.querySelector('.lc-topnav-brand');
  if (brand && brand.nextSibling) topnav.insertBefore(hamb, brand.nextSibling);
  else topnav.appendChild(hamb);
})();
