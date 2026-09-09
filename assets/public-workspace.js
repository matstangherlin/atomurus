/* Public pages: runtime chrome (active nav, search/CTA fallback, lab gate).
   Layout is emitted at build time by tools/inject-ui-chrome.js.
   Hoist remains as fallback for HTML that still lacks #ps-shell.
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

  var LOGIN_ICON =
    '<svg class="nav-icon" viewBox="0 0 16 16" fill="none"><circle cx="8" cy="6" r="2.2" stroke="currentColor" stroke-width="1.3"/><path d="M3.5 13c.8-2.2 2.4-3.2 4.5-3.2s3.7 1 4.5 3.2" stroke="currentColor" stroke-width="1.3" stroke-linecap="round"/></svg>';
  var PRICING_ICON =
    '<svg class="nav-icon" viewBox="0 0 16 16" fill="none"><path d="M8 1.8l1.6 3.2 3.5.5-2.5 2.5.6 3.5L8 10.3 4.8 11.5l.6-3.5-2.5-2.5 3.5-.5L8 1.8z" stroke="currentColor" stroke-width="1.2" fill="none"/></svg>';
  var STUDY_ICON =
    '<svg class="nav-icon" viewBox="0 0 16 16" fill="none"><path d="M3 3h4v10H3zM8 5h5v8H8z" stroke="currentColor" stroke-width="1.2" fill="none"/><path d="M5 6v4M10.5 8v3" stroke="currentColor" stroke-width="1.2" stroke-linecap="round"/></svg>';
  var KICKER_MARK = /^\s*§\s*\d*[.\d]*\s*[·•—–-]*\s*/;

  function ensureToolFoot(aside) {
    var foot = aside.querySelector('.sidebar-foot');
    if (!foot) return;
    var p = prefix();
    var login = foot.querySelector('[data-auth-nav-link="common.nav.login"], a[href*="login"]');
    if (!login) {
      login = document.createElement('a');
      login.className = 'nav-item';
      login.href = p + 'login.html';
      login.innerHTML = LOGIN_ICON + '<span data-i18n="common.nav.login">Login</span>';
      foot.insertBefore(login, foot.firstChild);
    }
    login.setAttribute('data-auth-nav-link', 'common.nav.login');
    if (!foot.querySelector('a[href*="pricing"]')) {
      var pricing = document.createElement('a');
      pricing.className = 'nav-item';
      pricing.href = p + 'pricing.html';
      pricing.innerHTML = PRICING_ICON + '<span data-i18n="common.nav.pricing">Pricing</span>';
      foot.appendChild(pricing);
    }
  }

  function studyHref() {
    return '/app';
  }

  function makeStudyNavItem(className) {
    var a = document.createElement('a');
    a.className = className || 'nav-item';
    a.href = studyHref();
    if ((className || '').indexOf('lc-mobile-menu-item') !== -1) {
      a.innerHTML = '<span class="lc-mobile-menu-label" data-i18n="common.nav.study">Study</span>';
    } else {
      a.innerHTML = STUDY_ICON + '<span data-i18n="common.nav.study">Study</span>';
    }
    return a;
  }

  function ensureStudyNav(root) {
    if (!root) return;
    if (root.querySelector('a[href="/app"], a[href$="app.html"], a[href*="/app?"]')) return;
    var item = makeStudyNavItem('nav-item');
    var explore = null;
    root.querySelectorAll('a.nav-item[href]').forEach(function (link) {
      if ((link.getAttribute('href') || '').indexOf('explore') !== -1) explore = link;
    });
    if (explore && explore.parentNode) {
      if (explore.nextSibling) explore.parentNode.insertBefore(item, explore.nextSibling);
      else explore.parentNode.appendChild(item);
      return;
    }
    var section = root.querySelector('.nav-section');
    if (section) section.appendChild(item);
  }

  function ensureMobileStudyLink() {
    var list = document.querySelector('.lc-mobile-menu-list');
    if (!list) return;
    if (list.querySelector('a[href="/app"], a[href$="app.html"]')) return;
    var item = makeStudyNavItem('lc-mobile-menu-item');
    var explore = null;
    list.querySelectorAll('a[href]').forEach(function (link) {
      if ((link.getAttribute('href') || '').indexOf('explore') !== -1) explore = link;
    });
    if (explore && explore.parentNode) {
      if (explore.nextSibling) explore.parentNode.insertBefore(item, explore.nextSibling);
      else explore.parentNode.appendChild(item);
    } else {
      list.appendChild(item);
    }
  }

  function normalizeLandingCta(topnav) {
    var cta = topnav.querySelector('.lc-topnav-cta');
    if (!cta) return;
    var path = location.pathname.replace(/\/+$/, '').toLowerCase();
    if (/\/login(?:\.pt)?(?:\.html)?$/.test(path)) return;
    if (/\/404(?:\.html)?$/.test(path)) return;
    var href = (cta.getAttribute('href') || '').toLowerCase();
    if (/login|signup|account/.test(href)) return;
    var p = prefix();
    cta.setAttribute('href', p + 'login.html');
    cta.setAttribute('aria-label', 'Account');
    cta.removeAttribute('data-i18n-attr');
    var span = cta.querySelector('span');
    if (!span) {
      span = document.createElement('span');
      cta.insertBefore(span, cta.firstChild);
    }
    span.setAttribute('data-i18n', 'pricing.ctaAccount');
    span.textContent = 'Account';
  }

  function stripKickerMarks(root) {
    (root || document).querySelectorAll(
      '.ph-kicker, .lc-doc-kicker, .ex-kicker, .lc-hero-kicker, .lc-modules-kicker'
    ).forEach(function (el) {
      if (el.childElementCount) {
        Array.prototype.forEach.call(el.childNodes, function (n) {
          if (n.nodeType === 3) n.textContent = n.textContent.replace(KICKER_MARK, '');
        });
        return;
      }
      var t = el.textContent || '';
      var next = t.replace(KICKER_MARK, '');
      if (next !== t) el.textContent = next;
    });
  }

  function polishCopy() {
    stripKickerMarks(document);
    var brand = document.querySelector('.scc-brand');
    if (brand && /^ATOMURUS$/i.test((brand.textContent || '').trim())) {
      brand.textContent = 'Atomurus';
    }
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
        (target.indexOf('pricing') !== -1 && here.indexOf('pricing') !== -1) ||
        (target.indexOf('/app') !== -1 && (here === '/app' || /\/app(?:\.html)?$/.test(here)));
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
          '<a class="nav-item" href="/app">' +
            '<svg class="nav-icon" viewBox="0 0 16 16" fill="none"><path d="M3 3h4v10H3zM8 5h5v8H8z" stroke="currentColor" stroke-width="1.2" fill="none"/><path d="M5 6v4M10.5 8v3" stroke="currentColor" stroke-width="1.2" stroke-linecap="round"/></svg>' +
            '<span data-i18n="common.nav.study">Study</span></a>' +
        '</div>' +
      '</nav>' +
      '<div class="sidebar-foot">' +
        '<a class="nav-item" href="' + p + 'login.html" data-auth-nav-link="common.nav.login">' +
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

  function retagBrand(root) {
    (root || document).querySelectorAll('.logo-tag').forEach(function (el) {
      var t = (el.textContent || '').trim();
      if (el.getAttribute('data-i18n') === 'common.brandTag' && !/^v/i.test(t)) return;
      el.setAttribute('data-i18n', 'common.brandTag');
      el.textContent = 'chemistry lab';
    });
  }

  function enhanceExistingShell() {
    var shell = document.querySelector('.ps-shell');
    if (!shell) return false;
    document.body.classList.add('ps-body');
    var pub = document.querySelector('#ps-pub-sidebar, aside.ps-pub-sidebar');
    var topnav = document.querySelector('.ps-shell > .lc-topnav');
    var topbar = document.querySelector('.ps-shell > .topbar');
    var toolAside = document.querySelector('.ps-shell > aside.sidebar:not(.ps-pub-sidebar)');
    if (topnav) {
      ensureSearch(topnav, prefix());
      normalizeLandingCta(topnav);
      if (pub) markActive(pub);
      ensureMobileStudyLink();
    } else if (topbar && toolAside) {
      retagBrand(shell);
      var logo = toolAside.querySelector(':scope > .logo-wrap');
      if (logo && !topbar.querySelector('.logo-wrap')) {
        logo.classList.add('ps-brand');
        topbar.insertBefore(logo, topbar.firstChild);
      }
      var bc = topbar.querySelector('.breadcrumb');
      if (bc) bc.hidden = true;
      ensureSearch(topbar, prefix());
      ensureToolFoot(toolAside);
      ensureStudyNav(toolAside);
      markActive(toolAside);
    }
    applyI18n(shell);
    return true;
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
    ensureToolFoot(aside);
    ensureStudyNav(aside);

    var overlay = document.querySelector('body > .mobile-overlay');
    shell.appendChild(topbar);
    if (overlay) shell.appendChild(overlay);
    shell.appendChild(aside);
    shell.appendChild(main);
    document.body.insertBefore(shell, document.body.firstChild);
    document.body.classList.add('ps-body');
    retagBrand(shell);
    applyI18n(shell);
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
    normalizeLandingCta(topnav);
    ensureMobileStudyLink();
    applyI18n(shell);
    return true;
  }

  function loadLabGate() {
    if (document.querySelector('script[data-lab-tool-gate]')) return;
    var s = document.createElement('script');
    s.src = '/assets/lab-tool-gate.js?v=202608282500';
    s.defer = true;
    s.setAttribute('data-lab-tool-gate', '1');
    document.head.appendChild(s);
  }

  function run() {
    try {
      if (document.body && document.body.classList.contains('ws-body')) {
        release();
        return;
      }
      if (!enhanceExistingShell()) {
        hoistToolShell() || hoistLandingShell();
      }
      loadLabGate();
      polishCopy();
      setTimeout(function () {
        polishCopy();
        try {
          if (window.I18N && typeof window.I18N.onChange === 'function') window.I18N.onChange(polishCopy);
        } catch (err) {}
      }, 0);
    } catch (e) {}
    release();
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', run);
  else run();
})();
