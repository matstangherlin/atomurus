/* Public pages: hoist the /app workspace grid (topbar / sidebar / main).
   Skips /app. Idempotent. Do not restyle the study workspace. */
(function () {
  'use strict';

  if (/\/app(?:\.html)?\/?$/.test(location.pathname)) return;

  document.documentElement.classList.add('ps-boot');
  var released = false;
  function release() {
    if (released) return;
    released = true;
    document.documentElement.classList.remove('ps-boot');
    document.documentElement.classList.add('ps-ready');
  }
  setTimeout(release, 2500);

  function prefix() {
    var parts = location.pathname.replace(/\/+$/, '').split('/').filter(Boolean);
    if (parts.length && /\.html?$/.test(parts[parts.length - 1])) parts.pop();
    else if (parts.length) parts.pop();
    if (!parts.length) return '';
    return parts.map(function () { return '..'; }).join('/') + '/';
  }

  function applyI18n(root) {
    try {
      if (window.I18N && typeof window.I18N.apply === 'function') window.I18N.apply(root);
    } catch (e) {}
  }

  function ensureSearch(topbar, p) {
    if (topbar.querySelector('.search-box, .lc-topnav-search, .ps-search')) return;
    var form = document.createElement('form');
    form.className = 'ps-search search-box';
    form.setAttribute('role', 'search');
    form.action = p + 'periodic-table.html';
    form.method = 'get';
    form.innerHTML =
      '<label class="lc-sr-only" for="ps-search-q">Search element</label>' +
      '<svg width="13" height="13" viewBox="0 0 13 13" fill="none" aria-hidden="true">' +
      '<circle cx="5.5" cy="5.5" r="4" stroke="currentColor" stroke-width="1.4"/>' +
      '<line x1="8.7" y1="8.7" x2="11.5" y2="11.5" stroke="currentColor" stroke-width="1.4" stroke-linecap="round"/></svg>' +
      '<input id="ps-search-q" name="q" type="search" autocomplete="off" ' +
      'data-i18n-attr="placeholder:common.searchPlaceholder" placeholder="search element, symbol or Z…">' +
      '<button type="submit" data-i18n-attr="aria-label:common.searchAria" aria-label="Search element">' +
      '<svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden="true">' +
      '<circle cx="6" cy="6" r="4.2" stroke="currentColor" stroke-width="1.3"/>' +
      '<path d="M9.2 9.2 12 12" stroke="currentColor" stroke-width="1.3" stroke-linecap="round"/></svg></button>';
    var actions = topbar.querySelector('.theme-btn, .lc-topnav-btn, .lc-topnav-spacer, .share-host-compact');
    if (actions) topbar.insertBefore(form, actions);
    else topbar.appendChild(form);
  }

  function markActive(aside) {
    var here = location.pathname.replace(/\/+$/, '').toLowerCase();
    aside.querySelectorAll('a.nav-item[href]').forEach(function (a) {
      var target;
      try { target = new URL(a.getAttribute('href'), location.href).pathname.replace(/\/+$/, '').toLowerCase(); }
      catch (e) { return; }
      var on =
        here === target ||
        (target.indexOf('index.html') !== -1 && (here === '' || here === '/' || /\/index\.html$/.test(here))) ||
        (target.indexOf('periodic-table') !== -1 && here.indexOf('periodic-table') !== -1) ||
        (target.indexOf('calculators') !== -1 && here.indexOf('calculators') !== -1) ||
        (target.indexOf('explore') !== -1 && here.indexOf('/explore') !== -1) ||
        (target.indexOf('atomic-models') !== -1 && here.indexOf('atomic-models') !== -1) ||
        (target.indexOf('molecules') !== -1 && here.indexOf('molecules') !== -1) ||
        (target.indexOf('allotropes') !== -1 && here.indexOf('allotropes') !== -1) ||
        (target.indexOf('isomerism') !== -1 && here.indexOf('isomerism') !== -1) ||
        (target.indexOf('login') !== -1 && here.indexOf('login') !== -1) ||
        (target.indexOf('config') !== -1 && here.indexOf('config') !== -1) ||
        (target.indexOf('pricing') !== -1 && here.indexOf('pricing') !== -1);
      if (on) a.classList.add('active');
    });
  }

  function buildPublicSidebar() {
    var p = prefix();
    var aside = document.createElement('aside');
    aside.className = 'sidebar ps-pub-sidebar';
    aside.id = 'ps-pub-sidebar';
    aside.innerHTML =
      '<nav class="sidebar-scroll ps-pub-nav" aria-label="Laboratory">' +
        '<div class="nav-section">' +
          '<a class="nav-item" href="' + p + 'index.html">' +
            '<svg class="nav-icon" viewBox="0 0 16 16" fill="none"><path d="M2 8L8 2l6 6M3 7v7h10V7" stroke="currentColor" stroke-width="1.3" stroke-linecap="round" stroke-linejoin="round" fill="none"/></svg>' +
            '<span data-i18n="common.nav.home">Home</span></a>' +
          '<a class="nav-item" href="' + p + 'periodic-table.html">' +
            '<svg class="nav-icon" viewBox="0 0 16 16" fill="none"><rect x="1" y="1" width="6" height="6" rx="1.5" fill="currentColor" opacity=".9"/><rect x="9" y="1" width="6" height="6" rx="1.5" fill="currentColor" opacity=".5"/><rect x="1" y="9" width="6" height="6" rx="1.5" fill="currentColor" opacity=".5"/><rect x="9" y="9" width="6" height="6" rx="1.5" fill="currentColor" opacity=".3"/></svg>' +
            '<span data-i18n="common.nav.periodic">Periodic Table</span></a>' +
          '<a class="nav-item" href="' + p + 'viewer/atomic-models.html">' +
            '<svg class="nav-icon" viewBox="0 0 16 16" fill="none"><circle cx="8" cy="8" r="1.5" fill="currentColor"/><ellipse cx="8" cy="8" rx="6.5" ry="2.8" stroke="currentColor" stroke-width="1.1" fill="none"/><ellipse cx="8" cy="8" rx="6.5" ry="2.8" stroke="currentColor" stroke-width="1.1" fill="none" transform="rotate(60 8 8)"/><ellipse cx="8" cy="8" rx="6.5" ry="2.8" stroke="currentColor" stroke-width="1.1" fill="none" transform="rotate(120 8 8)"/></svg>' +
            '<span data-i18n="common.nav.visualizador">Viewer</span></a>' +
          '<a class="nav-item" href="' + p + 'calculators.html">' +
            '<svg class="nav-icon" viewBox="0 0 16 16" fill="none"><rect x="2" y="1" width="12" height="14" rx="2" stroke="currentColor" stroke-width="1.3" fill="none"/><line x1="5" y1="5" x2="11" y2="5" stroke="currentColor" stroke-width="1.1"/><line x1="5" y1="8" x2="11" y2="8" stroke="currentColor" stroke-width="1"/><line x1="5" y1="11" x2="9" y2="11" stroke="currentColor" stroke-width="1"/></svg>' +
            '<span data-i18n="common.nav.calc">Calculators</span></a>' +
          '<a class="nav-item" href="' + p + 'explore.html">' +
            '<svg class="nav-icon" viewBox="0 0 16 16" fill="none"><rect x="1" y="1" width="6" height="6" rx="1.3" stroke="currentColor" stroke-width="1.1" fill="none"/><rect x="9" y="1" width="6" height="6" rx="1.3" stroke="currentColor" stroke-width="1.1" fill="none"/><rect x="1" y="9" width="6" height="6" rx="1.3" stroke="currentColor" stroke-width="1.1" fill="none"/><circle cx="12" cy="12" r="2.6" stroke="currentColor" stroke-width="1.3" fill="none"/><line x1="14" y1="14" x2="15.5" y2="15.5" stroke="currentColor" stroke-width="1.3" stroke-linecap="round"/></svg>' +
            '<span data-i18n="common.nav.explore">Explore</span></a>' +
        '</div>' +
      '</nav>' +
      '<div class="sidebar-foot">' +
        '<a class="nav-item" href="' + p + 'login.html">' +
          '<svg class="nav-icon" viewBox="0 0 16 16" fill="none"><circle cx="8" cy="6" r="2.2" stroke="currentColor" stroke-width="1.3"/><path d="M3.5 13c.8-2.2 2.4-3.2 4.5-3.2s3.7 1 4.5 3.2" stroke="currentColor" stroke-width="1.3" stroke-linecap="round"/></svg>' +
          '<span data-i18n="common.nav.login">Login</span></a>' +
        '<a class="nav-item" href="' + p + 'config.html">' +
          '<svg class="nav-icon" viewBox="0 0 16 16" fill="none"><circle cx="8" cy="8" r="2.2" stroke="currentColor" stroke-width="1.3"/><path d="M8 1v1.5M8 13.5V15M1 8h1.5M13.5 8H15M2.93 2.93l1.06 1.06M12.01 12.01l1.06 1.06M2.93 13.07l1.06-1.06M12.01 3.99l1.06-1.06" stroke="currentColor" stroke-width="1.2" stroke-linecap="round"/></svg>' +
          '<span data-i18n="common.nav.settings">Settings</span></a>' +
        '<a class="nav-item" href="' + p + 'pricing.html">' +
          '<svg class="nav-icon" viewBox="0 0 16 16" fill="none"><path d="M8 1.8l1.6 3.2 3.5.5-2.5 2.5.6 3.5L8 10.3 4.8 11.5l.6-3.5-2.5-2.5 3.5-.5L8 1.8z" stroke="currentColor" stroke-width="1.2" fill="none"/></svg>' +
          '<span data-i18n="common.nav.pricing">Pricing</span></a>' +
      '</div>';
    markActive(aside);
    return aside;
  }

  function hoistToolShell() {
    if (document.querySelector('.ps-shell')) return true;
    var aside = document.querySelector('body > aside.sidebar');
    var main = document.querySelector('body > main.main');
    if (!aside || !main) return false;
    var topbar = main.querySelector(':scope > .topbar');
    if (!topbar) return false;

    var shell = document.createElement('div');
    shell.className = 'ps-shell';
    shell.id = 'ps-shell';

    var logo = aside.querySelector(':scope > .logo-wrap');
    if (logo) {
      logo.classList.add('ps-brand');
      topbar.insertBefore(logo, topbar.firstChild);
    }
    var bc = topbar.querySelector('.breadcrumb');
    if (bc) bc.hidden = true;

    ensureSearch(topbar, prefix());

    var overlay = document.querySelector('body > .mobile-overlay');
    shell.appendChild(topbar);
    if (overlay) shell.appendChild(overlay);
    shell.appendChild(aside);
    shell.appendChild(main);
    document.body.insertBefore(shell, document.body.firstChild);
    document.body.classList.add('ps-body');
    applyI18n(topbar);
    return true;
  }

  function hoistLandingShell() {
    if (document.querySelector('.ps-shell')) return true;
    var topnav = document.querySelector('body > nav.lc-topnav');
    if (!topnav) return false;
    var shell = document.createElement('div');
    shell.className = 'ps-shell';
    shell.id = 'ps-shell';
    var main = document.createElement('main');
    main.className = 'ps-main';
    main.id = 'ps-main';
    var aside = buildPublicSidebar();
    var kids = Array.from(document.body.children);
    shell.appendChild(topnav);
    shell.appendChild(aside);
    kids.forEach(function (el) {
      if (el === topnav || el === shell) return;
      if (el.tagName === 'SCRIPT') return;
      main.appendChild(el);
    });
    shell.appendChild(main);
    document.body.insertBefore(shell, document.body.firstChild);
    document.body.classList.add('ps-body');
    ensureSearch(topnav, prefix());
    applyI18n(shell);
    return true;
  }

  function run() {
    try {
      if (document.body && document.body.classList.contains('ws-body')) {
        release();
        return;
      }
      hoistToolShell() || hoistLandingShell();
    } catch (e) {}
    release();
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', run);
  else run();
})();
