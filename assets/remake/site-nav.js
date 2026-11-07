/* Atomurus remake — top navigation behaviour.
   Desktop: dropdowns open on hover/focus (CSS) and on click/tap (here).
   Below 1200px: the burger opens a full-height drawer; dropdown
   sections expand inline. Footer buttons switch language and theme. */
(function () {
  'use strict';

  var MOBILE = '(max-width: 1199px)';
  // cache-busting version of this file, reused for the scripts it loads later
  var VERSION = (function () {
    var src = (document.currentScript && document.currentScript.src) || '';
    var m = /[?&]v=([^&]+)/.exec(src);
    return m ? m[1] : '';
  })();

  function isMobile() {
    return window.matchMedia ? window.matchMedia(MOBILE).matches : window.innerWidth < 1200;
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
    document.querySelectorAll('[data-rm-theme-set]').forEach(function (btn) {
      var on = (btn.getAttribute('data-rm-theme-set') === 'dark') === dark;
      btn.setAttribute('aria-pressed', on ? 'true' : 'false');
    });
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
      var setBtn = target.closest('[data-rm-theme-set]');
      var themeBtn = target.closest('[data-rm-theme]');
      if (setBtn || themeBtn) {
        event.preventDefault();
        var cur = document.documentElement.getAttribute('data-theme') === 'dark' ? 'dark' : 'light';
        var next = setBtn ? setBtn.getAttribute('data-rm-theme-set') : (cur === 'dark' ? 'light' : 'dark');
        if (next !== cur) {
          document.documentElement.setAttribute('data-theme', next);
          try { localStorage.setItem('atomurus-theme', next); } catch (e) {}
          try { window.dispatchEvent(new CustomEvent('atomurus:themechange', { detail: { isDark: next === 'dark' } })); } catch (e) {}
        }
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
    // other switches (the viewers' T key, page scripts) change data-theme too
    try {
      new MutationObserver(syncFooterLabels).observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] });
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

  /* Heavy embeds (the 3D viewer iframe on the atomic-model pages) start
     loading once the page itself has painted and loaded. */
  function deferredFrames() {
    var frames = document.querySelectorAll('iframe[data-defer-src]');
    if (!frames.length) return;
    function go() {
      frames.forEach(function (f) { if (!f.getAttribute('src')) f.setAttribute('src', f.getAttribute('data-defer-src')); });
    }
    if (document.readyState === 'complete') setTimeout(go, 0);
    else window.addEventListener('load', function () { setTimeout(go, 0); });
  }

  function enhanceArticle() {
    if (!document.querySelector('.art-body')) return;
    timelines();
    fitFigures();
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(fitFigures);
  }

  // 3D viewers: build the right-hand column (model name + notes + Pro card +
  // article link) and pull the colour legend under the stage, matching the
  // remake layout. Elements keep their ids, so the runtimes still update them.
  var MODEL_YEARS = { dalton: '1808', thomson: '1904', rutherford: '1911', bohr: '1913', quantum: '1926' };
  function enhanceViewer() {
    var viewer = document.querySelector('.viewer');
    if (!viewer || !viewer.querySelector(':scope > .canvas-wrap') || viewer.classList.contains('rm-vw')) return;
    if (document.documentElement.classList.contains('embed-mode')) return;
    viewer.classList.add('rm-vw');
    var side = document.createElement('div');
    side.className = 'rm-vw-side';
    var info = viewer.querySelector(':scope > .info-bar');
    if (info) side.appendChild(info);
    var detail = document.getElementById('model-detail');
    if (detail) side.appendChild(detail);
    var pro = document.querySelector('.content-inner > [data-pro-lab-tool]');
    if (pro) side.appendChild(pro);
    var read = document.querySelector('.content-inner > .lab-readmore a, .lab-readmore-card a');
    if (read) {
      var a = document.createElement('a');
      a.className = 'rm-vw-read';
      a.href = read.getAttribute('href');
      if (read.hasAttribute('data-i18n')) a.setAttribute('data-i18n', read.getAttribute('data-i18n'));
      a.textContent = read.textContent;
      side.appendChild(a);
    }
    viewer.appendChild(side);
    document.querySelectorAll('.content-inner > .legend-card, .content-inner > #atom-legend, .content-inner > #mol-legend').forEach(function (card) {
      var wrap = viewer.querySelector(':scope > .canvas-wrap');
      wrap.parentNode.insertBefore(card, wrap.nextSibling);
    });
    viewer.querySelectorAll('.pill[data-model]').forEach(function (pill) {
      var y = MODEL_YEARS[pill.getAttribute('data-model')];
      if (y) pill.setAttribute('data-rm-year', y);
    });
    try { window.dispatchEvent(new Event('resize')); } catch (e) {}
  }

  // Site search: the palette (site-search.js) and the element list
  // (elements-lite.js) load the first time it opens.
  function loadScript(src) {
    return new Promise(function (resolve, reject) {
      var s = document.createElement('script');
      s.src = src + (VERSION ? '?v=' + VERSION : '');
      s.onload = resolve;
      s.onerror = reject;
      document.head.appendChild(s);
    });
  }
  var searchReady = null;
  function openSearch(from) {
    if (!searchReady) {
      searchReady = (window.RM_ELEMENTS ? Promise.resolve() : loadScript('/assets/remake/elements-lite.js'))
        .then(function () { return window.AtomurusSearch ? null : loadScript('/assets/remake/site-search.js'); });
      searchReady.catch(function () { searchReady = null; });
    }
    searchReady.then(function () { window.AtomurusSearch.open(from); })
      .catch(function () { window.location.href = '/periodic-table.html'; });
  }
  function isTyping(el) {
    if (!el) return false;
    var tag = (el.tagName || '').toLowerCase();
    return tag === 'input' || tag === 'textarea' || tag === 'select' || el.isContentEditable;
  }
  function initSearch() {
    document.addEventListener('click', function (e) {
      var b = e.target && e.target.closest ? e.target.closest('[data-rm-search-open]') : null;
      if (!b) return;
      e.preventDefault();
      var header = b.closest('[data-rm-header]');
      if (header && header.classList.contains('is-open')) setDrawer(header, false);
      openSearch(b);
    });
    // pages with their own search field keep "/" and Ctrl/⌘+K for it
    // (periodic table, articles hub, home hero); the header button works everywhere
    var pageSearch = document.querySelector('#search-input, #ex-search-input, [data-rm-search] input');
    document.addEventListener('keydown', function (e) {
      if (e.defaultPrevented || pageSearch) return;
      var k = e.key;
      if ((k === 'k' || k === 'K') && (e.metaKey || e.ctrlKey) && !e.altKey) { e.preventDefault(); openSearch(null); return; }
      if (k === '/' && !e.metaKey && !e.ctrlKey && !e.altKey && !isTyping(e.target)) { e.preventDefault(); openSearch(null); }
    });
  }

  function run() {
    document.querySelectorAll('[data-rm-header]').forEach(initHeader);
    initFooter();
    initSearch();
    enhanceArticle();
    enhanceViewer();
    deferredFrames();
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', run);
  else run();

  /* Bottom tab bar (phones): mark the section of the current page. */
  (function markTab() {
    var bars = document.querySelectorAll('[data-rm-tabbar]');
    if (!bars.length) return;
    var p = location.pathname.replace(/\.(pt|en)\.html$/, '.html');
    var q = location.search;
    var key = '';
    if (/^\/periodic-table/.test(p)) key = 'periodic';
    else if (/^\/viewer\//.test(p) || /^\/isomerism/.test(p)) key = 'models';
    else if (/^\/vision/.test(p)) key = 'camera';
    else if (/^\/calculators/.test(p)) key = 'calculators';
    else if (/^\/app/.test(p)) key = 'lab';
    else if (/^\/explore/.test(p)) key = 'explore';
    bars.forEach(function (bar) {
      bar.querySelectorAll('[data-rm-tab]').forEach(function (a) {
        var on = a.getAttribute('data-rm-tab') === key;
        a.classList.toggle('is-active', on);
        if (on) a.setAttribute('aria-current', 'page'); else a.removeAttribute('aria-current');
      });
    });
    document.documentElement.classList.add('has-rm-tabbar');
  })();
})();
