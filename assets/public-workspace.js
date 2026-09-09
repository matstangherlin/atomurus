/* Public pages: runtime chrome (active nav, search/CTA fallback, lab gate).
   Layout is already in the HTML (#ps-shell from tools/inject-ui-chrome.js).
   This script does not rebuild the document. Skips /app. Idempotent. */
(function () {
  'use strict';

  if (/\/app(?:\.html)?\/?$/.test(location.pathname)) return;

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
      login.href = guestLoginHref();
      login.innerHTML = LOGIN_ICON + '<span data-i18n="common.nav.login">Account</span>';
      foot.insertBefore(login, foot.firstChild);
    }
    login.setAttribute('data-auth-nav-link', 'common.nav.login');
    login.href = guestLoginHref();
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
      a.innerHTML = '<span class="lc-mobile-menu-label" data-i18n="common.nav.workspace">Workspace</span>';
    } else {
      a.innerHTML = STUDY_ICON + '<span data-i18n="common.nav.workspace">Workspace</span>';
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

  function guestLoginHref() {
    var path = location.pathname || '/';
    if (/\/(login|signup)(?:\.html)?$/i.test(path)) return '/login';
    return '/login?next=' + encodeURIComponent((location.pathname || '/') + (location.search || ''));
  }

  function markActive(aside) {
    var here = location.pathname.replace(/\/+$/, '').toLowerCase();
    var links = Array.prototype.slice.call(aside.querySelectorAll('a.nav-item[href]'));
    var best = null;
    var bestScore = 0;
    function score(target) {
      if (!target) return 0;
      if (here === target) return 10000 + target.length;
      if (target.indexOf('index.html') !== -1 && (here === '' || here === '/' || /\/index\.html$/.test(here))) return 9000;
      if (target.indexOf('login') !== -1 && here.indexOf('login') !== -1) return 8000;
      if (target.indexOf('config') !== -1 && here.indexOf('config') !== -1) return 8000;
      if (target.indexOf('pricing') !== -1 && here.indexOf('pricing') !== -1) return 8000;
      if (target.indexOf('/app') !== -1 && (here === '/app' || /\/app(?:\.html)?$/.test(here))) return 8000;
      if (target.indexOf('calculators') !== -1 && here.indexOf('calculators') !== -1) return 7000 + target.length;
      if (target.indexOf('explore') !== -1 && here.indexOf('/explore') !== -1 && here.indexOf('/viewer/') === -1) {
        return 7000 + target.length;
      }
      if (target.indexOf('periodic-table') !== -1 && here.indexOf('periodic-table') !== -1) {
        if (here.indexOf(target.replace(/\.html$/, '')) !== -1) return 7500 + target.length;
        return 5000;
      }
      var viewerKeys = ['atomic-models', 'molecules', 'allotropes', 'isomerism'];
      var i;
      for (i = 0; i < viewerKeys.length; i++) {
        if (target.indexOf(viewerKeys[i]) !== -1 && here.indexOf(viewerKeys[i]) !== -1) return 8000 + target.length;
      }
      if (target.indexOf('atomic-models') !== -1 && /\/viewer\//.test(here) && here.indexOf('/explore/') === -1) {
        return 100;
      }
      return 0;
    }
    links.forEach(function (a) {
      var target;
      try { target = new URL(a.getAttribute('href'), location.href).pathname.replace(/\/+$/, '').toLowerCase(); }
      catch (e) { return; }
      var s = score(target);
      if (s > bestScore) {
        bestScore = s;
        best = a;
      }
    });
    links.forEach(function (a) {
      var on = a === best && bestScore > 0;
      a.classList.toggle('active', on);
      if (on) a.setAttribute('aria-current', 'page');
      else a.removeAttribute('aria-current');
    });
  }

  function retagBrand(root) {
    (root || document).querySelectorAll('.logo-tag').forEach(function (el) {
      var t = (el.textContent || '').trim();
      if (el.getAttribute('data-i18n') === 'common.brandTag' && !/^v/i.test(t)) return;
      el.setAttribute('data-i18n', 'common.brandTag');
      el.textContent = 'chemistry lab';
    });
  }

  function ensureAccountControl(shell) {
    if (document.querySelector('[data-atomurus-account]')) return;
    var path = (location.pathname || '/').replace(/\/+$/, '') || '/';
    if (/\/(login|404)(?:\.html)?$/.test(path)) return;
    var bar = shell.querySelector('.lc-topnav, .topbar');
    if (!bar) return;
    var wrap = document.createElement('div');
    wrap.className = 'ps-account';
    wrap.setAttribute('data-atomurus-account', '');
    wrap.innerHTML =
      '<span class="ps-plan-badge" hidden data-atomurus-plan-badge></span>' +
      '<a class="ps-userchip lc-topnav-cta" href="' +
      guestLoginHref() +
      '" data-atomurus-account-chip aria-label="Account">' +
      '<svg class="ps-userchip-icon" width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true"><path d="M8 8a2.5 2.5 0 1 0 0-5 2.5 2.5 0 0 0 0 5zM3.5 13.5c.6-2.2 2.3-3.5 4.5-3.5s3.9 1.3 4.5 3.5" stroke="currentColor" stroke-width="1.3" stroke-linecap="round" stroke-linejoin="round"/></svg>' +
      '<span data-i18n="pricing.ctaAccount">Account</span></a>';
    var existingCta = bar.querySelector('.lc-topnav-cta:not([data-atomurus-account-chip])');
    if (existingCta && existingCta.parentNode) {
      existingCta.parentNode.replaceChild(wrap, existingCta);
    } else {
      bar.appendChild(wrap);
    }
  }

  function enhanceExistingShell() {
    var shell = document.querySelector('.ps-shell');
    if (!shell) return false;
    document.body.classList.add('ps-body');
    ensureAccountControl(shell);
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
      if (document.body && document.body.classList.contains('ws-body')) return;
      enhanceExistingShell();
      loadLabGate();
      polishCopy();
      setTimeout(function () {
        polishCopy();
        try {
          if (window.I18N && typeof window.I18N.onChange === 'function') window.I18N.onChange(polishCopy);
        } catch (err) {}
      }, 0);
    } catch (e) {}
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', run);
  else run();
})();
