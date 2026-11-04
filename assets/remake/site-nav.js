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

  // Article diagrams: widen the viewBox when a label spills past it, so
  // translated (longer) captions are never clipped at the figure edge.
  function fitFigures() {
    var svgs = document.querySelectorAll('.art-fig svg[viewBox]');
    svgs.forEach(function (svg) {
      try {
        var vb = svg.viewBox.baseVal;
        if (!vb || !vb.width) return;
        var bb = svg.getBBox();
        if (!bb || !bb.width) return;
        var pad = 6;
        var x0 = Math.min(vb.x, bb.x - pad);
        var y0 = Math.min(vb.y, bb.y - pad);
        var x1 = Math.max(vb.x + vb.width, bb.x + bb.width + pad);
        var y1 = Math.max(vb.y + vb.height, bb.y + bb.height + pad);
        if (x0 < vb.x - 0.5 || y0 < vb.y - 0.5 || x1 > vb.x + vb.width + 0.5 || y1 > vb.y + vb.height + 0.5) {
          svg.setAttribute('viewBox', [x0, y0, x1 - x0, y1 - y0].map(function (n) { return Math.round(n * 10) / 10; }).join(' '));
        }
      } catch (e) {}
    });
  }

  // Lists of dated milestones ("<strong>1803 — Dalton.</strong> …") become
  // timeline rows: year in its own column, text beside it.
  var YEAR_RE = /^\s*((?:~|c\.\s*)?\d{3,4}(?:\s*(?:a\.C\.|BCE|BC|a\.C|CE|d\.C\.))?(?:\s*(?:em diante|onward|onwards|–\s*\d{2,4}|-\s*\d{2,4}))?)\s*[—–:-]\s*/;
  function timelines() {
    document.querySelectorAll('.art-body ul:not(.rm-timeline)').forEach(function (ul) {
      var items = Array.prototype.filter.call(ul.children, function (li) { return li.tagName === 'LI'; });
      if (items.length < 3) return;
      var ok = items.every(function (li) {
        var first = li.firstElementChild;
        return first && /^(STRONG|B)$/.test(first.tagName) && li.textContent.trim().indexOf(first.textContent.trim()) === 0 && YEAR_RE.test(first.textContent);
      });
      if (!ok) return;
      ul.classList.add('rm-timeline');
      items.forEach(function (li) {
        var strong = li.firstElementChild;
        var m = strong.textContent.match(YEAR_RE);
        var year = document.createElement('span');
        year.className = 'rm-tl-year';
        year.textContent = m[1].trim();
        var body = document.createElement('span');
        body.className = 'rm-tl-text';
        strong.textContent = strong.textContent.slice(m[0].length);
        while (li.firstChild) body.appendChild(li.firstChild);
        li.appendChild(year);
        li.appendChild(body);
      });
    });
  }

  function enhanceArticle() {
    if (!document.querySelector('.art-body')) return;
    timelines();
    fitFigures();
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(fitFigures);
  }

  function run() {
    document.querySelectorAll('[data-rm-header]').forEach(initHeader);
    initFooter();
    enhanceArticle();
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', run);
  else run();
})();
