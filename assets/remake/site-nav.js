/* Atomurus remake — top navigation behaviour.
   Desktop: dropdowns open on hover/focus (CSS) and on click/tap (here).
   Mobile (<1024px): the burger opens a full-height drawer; dropdown
   sections expand inline. Footer buttons switch language and theme. */
(function () {
  'use strict';

  var MOBILE = '(max-width: 1023px)';

  function isMobile() {
    return window.matchMedia ? window.matchMedia(MOBILE).matches : window.innerWidth < 1024;
  }

  function setOffset(header) {
    var rect = header.getBoundingClientRect();
    header.style.setProperty('--rm-header-offset', Math.max(0, Math.round(rect.bottom)) + 'px');
  }

  function closeDropdowns(header, except) {
    header.querySelectorAll('.rm-dd.is-open').forEach(function (dd) {
      if (dd === except) return;
      dd.classList.remove('is-open');
      var t = dd.querySelector('.rm-dd-toggle');
      if (t) t.setAttribute('aria-expanded', 'false');
    });
  }

  function setDrawer(header, open) {
    header.classList.toggle('is-open', open);
    document.documentElement.classList.toggle('rm-nav-open', open);
    var burger = header.querySelector('[data-rm-burger]');
    if (burger) {
      burger.setAttribute('aria-expanded', open ? 'true' : 'false');
      var label = burger.querySelector('.rm-sr');
      if (label && window.I18N && typeof window.I18N.t === 'function') {
        var text = window.I18N.t(open ? 'common.rm.closeMenu' : 'common.rm.menu');
        if (text) label.textContent = text;
      }
    }
    if (open) setOffset(header);
    else closeDropdowns(header);
  }

  function initHeader(header) {
    if (header.dataset.rmReady === '1') return;
    header.dataset.rmReady = '1';
    var burger = header.querySelector('[data-rm-burger]');
    if (burger) {
      burger.addEventListener('click', function () {
        setDrawer(header, !header.classList.contains('is-open'));
      });
    }
    header.querySelectorAll('.rm-dd').forEach(function (dd) {
      var toggle = dd.querySelector('.rm-dd-toggle');
      if (!toggle) return;
      toggle.addEventListener('click', function (event) {
        // Mouse users on desktop follow the link; touch and mobile toggle.
        var touchy = isMobile() || (window.matchMedia && window.matchMedia('(hover: none)').matches);
        if (!touchy) return;
        event.preventDefault();
        var open = !dd.classList.contains('is-open');
        closeDropdowns(header, dd);
        dd.classList.toggle('is-open', open);
        toggle.setAttribute('aria-expanded', open ? 'true' : 'false');
      });
      dd.addEventListener('mouseenter', function () { if (!isMobile()) toggle.setAttribute('aria-expanded', 'true'); });
      dd.addEventListener('mouseleave', function () { if (!isMobile()) toggle.setAttribute('aria-expanded', 'false'); });
    });
    document.addEventListener('click', function (event) {
      if (!header.contains(event.target)) closeDropdowns(header);
    });
    document.addEventListener('keydown', function (event) {
      if (event.key !== 'Escape') return;
      closeDropdowns(header);
      if (header.classList.contains('is-open')) {
        setDrawer(header, false);
        if (burger) burger.focus();
      }
    });
    header.querySelectorAll('.rm-navwrap a[href]').forEach(function (a) {
      a.addEventListener('click', function () {
        if (a.classList.contains('rm-dd-toggle') && isMobile()) return;
        if (header.classList.contains('is-open')) setDrawer(header, false);
      });
    });
    window.addEventListener('resize', function () {
      if (!isMobile() && header.classList.contains('is-open')) setDrawer(header, false);
    });
  }

  function syncFooterLabels() {
    var dark = document.documentElement.getAttribute('data-theme') === 'dark';
    var pt = (document.documentElement.lang || '').toLowerCase().indexOf('pt') === 0;
    document.querySelectorAll('[data-rm-theme]').forEach(function (btn) {
      btn.setAttribute('aria-pressed', dark ? 'true' : 'false');
      btn.removeAttribute('data-i18n');
      btn.textContent = dark ? (pt ? 'Tema claro' : 'Light theme') : (pt ? 'Tema escuro' : 'Dark theme');
    });
  }

  function initFooter() {
    document.addEventListener('click', function (event) {
      var target = event.target && event.target.closest ? event.target : null;
      if (!target) return;
      var themeBtn = target.closest('[data-rm-theme]');
      if (themeBtn) {
        event.preventDefault();
        var next = document.documentElement.getAttribute('data-theme') === 'dark' ? 'light' : 'dark';
        document.documentElement.setAttribute('data-theme', next);
        try { localStorage.setItem('atomurus-theme', next); } catch (e) {}
        syncFooterLabels();
        return;
      }
      var langBtn = target.closest('[data-rm-lang]');
      if (langBtn) {
        event.preventDefault();
        if (window.I18N && typeof window.I18N.toggle === 'function') {
          window.I18N.toggle();
          syncFooterLabels();
        } else {
          var pt = (document.documentElement.lang || '').toLowerCase().indexOf('pt') === 0;
          var u = new URL(location.href);
          u.searchParams.set('lang', pt ? 'en' : 'pt-BR');
          location.href = u.toString();
        }
      }
    });
    syncFooterLabels();
    try {
      if (window.I18N && typeof window.I18N.onChange === 'function') window.I18N.onChange(syncFooterLabels);
    } catch (e) {}
  }

  function run() {
    document.querySelectorAll('[data-rm-header]').forEach(initHeader);
    initFooter();
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', run);
  else run();
})();
