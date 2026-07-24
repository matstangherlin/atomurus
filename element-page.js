// ───────────────────────────────────────────────────────────────────
// Atomurus — runtime translator for individual element pages
// (periodic-table/<latin>.html)
// ───────────────────────────────────────────────────────────────────
// Each page declares its atomic number via:
//   <script>window.PAGE_Z = N;</script>
//
// Loaded after: elements-data.js, elements-data-en.js, i18n.js
//
// Responsibilities:
//   - Set <title>, og:* and twitter:* meta tags from the localized name/desc
//   - Update og:locale to match the active language
//   - Repaint the kicker, h1 (keeping the symbol span), latin tagline,
//     state/category strong cells, and long description paragraph
//   - Re-run on language toggle via I18N.onChange
//
// The static label spans (Atomic number, Symbol, …) already carry the
// data-i18n="el.*" attributes and are handled by the global I18N apply().
// ───────────────────────────────────────────────────────────────────

(function () {
  'use strict';

  function setMeta(selector, value) {
    var n = document.querySelector(selector);
    if (n && value != null) n.setAttribute('content', value);
  }

  function render() {
    if (typeof ELEMENTS === 'undefined' || !window.PAGE_Z) return;
    var z = window.PAGE_Z;
    var el = ELEMENTS.find(function (e) { return e.z === z; });
    if (!el) return;

    var name  = (typeof elName     === 'function') ? elName(el)         : el.name;
    var cat   = (typeof catName    === 'function') ? catName(el)        : el.cat;
    var state = (typeof stateName  === 'function') ? stateName(el.state): el.state;
    var desc  = (typeof elDesc     === 'function') ? elDesc(el)         : el.desc;

    var lang = (window.I18N && I18N.lang) || 'en';
    var W = lang === 'en'
      ? { element: 'Element',  symbol: 'Symbol',  mass: 'Mass',  locale: 'en_US' }
      : { element: 'Elemento', symbol: 'Símbolo', mass: 'Massa', locale: 'pt_BR' };

    // ── <title> + meta tags ───────────────────────────────────────
    // SEO-optimized templates — MUST mirror migrate-element-seo.js (PT
    // source) and build-i18n.js buildElementEnVariant() (EN regen).
    // If you change the format here, change those too — otherwise the
    // server-rendered HTML and the JS-runtime override will disagree.
    var titleStr, shortDesc, longDesc;
    if (lang === 'en') {
      titleStr  = name + ' (' + el.sym + '): Element ' + el.z + ', Properties and Applications | Atomurus';
      shortDesc = name + ' (' + el.sym + ') — element ' + el.z + ', atomic mass ' + el.mass + ' u. ' + cat + '.';
      longDesc  = 'Discover ' + name + ' (' + el.sym + '), element ' + el.z + ' of the periodic table: atomic mass ' + el.mass + ' u, properties, applications, electron configuration and curiosities at Atomurus.';
    } else {
      titleStr  = name + ' (' + el.sym + '): Elemento ' + el.z + ', Propriedades e Aplicações | Atomurus';
      shortDesc = name + ' (' + el.sym + ') — elemento ' + el.z + ', massa atômica ' + el.mass + ' u. ' + cat + '.';
      longDesc  = 'Conheça o ' + name + ' (' + el.sym + '), elemento ' + el.z + ' da tabela periódica: massa atômica ' + el.mass + ' u, propriedades, aplicações, configuração eletrônica e curiosidades no Atomurus.';
    }
    document.title = titleStr;

    setMeta('meta[name="description"]',          longDesc);
    setMeta('meta[property="og:title"]',         titleStr);
    setMeta('meta[property="og:description"]',   shortDesc);
    setMeta('meta[name="twitter:title"]',        titleStr);
    setMeta('meta[name="twitter:description"]',  shortDesc);
    setMeta('meta[property="og:locale"]',        W.locale);

    // ── Body content ──────────────────────────────────────────────
    var kicker = document.querySelector('.kicker');
    if (kicker) kicker.textContent = W.element + ' ' + el.z + ' · ' + cat;

    // Update BOTH the visible H1 (.lc-el-name) and the legacy hidden mirror
    // (.wrap h1). The previous version only queried `.wrap h1` (hidden), so
    // the visible title never changed when the language toggled.
    document.querySelectorAll('.lc-el-name, .wrap h1').forEach(function (h1) {
      // h1 structure: "<name> <span>SYM</span>" — replace the first non-empty
      // text node and keep the symbol span intact.
      var replaced = false;
      for (var i = 0; i < h1.childNodes.length; i++) {
        var ch = h1.childNodes[i];
        if (ch.nodeType === 3 /* TEXT_NODE */ && ch.textContent.trim()) {
          ch.textContent = name + ' ';
          replaced = true;
          break;
        }
      }
      if (!replaced) h1.insertBefore(document.createTextNode(name + ' '), h1.firstChild);
    });

    // Latin name · localized name. The latin name is the URL slug (each
    // element page lives at /periodic-table/<latin>.html or pretty-url
    // /periodic-table/<latin>). Earlier this code fell back to
    // `el.sym.toLowerCase()` which produced things like "li · Lithium"
    // instead of "lithium · Lithium" for Z=3.
    var latinName = (window.ELEMENT_LATIN && ELEMENT_LATIN[z]) || '';
    if (!latinName) {
      try {
        var parts = location.pathname.split('/').filter(Boolean);
        var last = parts.length ? parts[parts.length - 1] : '';
        latinName = last.replace(/\.html?$/i, '');
      } catch (_) {}
    }
    if (!latinName) latinName = el.sym.toLowerCase();
    document.querySelectorAll('.lat').forEach(function (lat) {
      lat.textContent = latinName + ' · ' + name;
    });

    document.querySelectorAll('[data-page-field]').forEach(function (node) {
      var f = node.getAttribute('data-page-field');
      if      (f === 'state')    node.textContent = state;
      else if (f === 'category') node.textContent = cat;
      else if (f === 'desc')     node.textContent = desc;
    });

    // ── Nuclide notation (mass number above, atomic number below) ─
    // Enrich the existing .lc-el-card-sym element so the big symbol is
    // flanked by A (rounded atomic mass) and Z. Idempotent — re-runs
    // on every language change but only re-renders the structure once.
    renderNuclideNotation(el);

    // ── Rich content sections (if data is available for this Z) ───
    // Reads from elements-content.js (loaded before this file). When
    // no content exists for the current element, the desc-block stays
    // as the only visible content area — the stub paragraph is hidden
    // by CSS to avoid the "coming soon" AdSense red flag.
    renderContentSections(el);

    // ── Share button (next to the element header) ─────────────────
    // Mobile uses navigator.share (native sheet — WhatsApp, Telegram,
    // SMS, email, anything installed). Desktop opens a small popover
    // with explicit channels. All links carry UTM parameters so GA4
    // can attribute "where did this visitor come from" — without UTM,
    // WhatsApp/Telegram/Discord traffic shows up as "Direct" because
    // those apps don't send a Referer header.
    renderShareButton(el, name);

    // FOUC guard cleanup — see notes in i18n.js init(). The data-page-field
    // elements are i18n'd by THIS file (not by i18n.js's apply), so we drop
    // the class here too to ensure they become visible in sync.
    document.documentElement.classList.remove('lang-pt-pending');
  }

  function renderNuclideNotation(el) {
    var card = document.querySelector('.lc-el-card-sym');
    if (!card) return;
    var massNumber = Math.round(parseFloat(el.mass));
    if (!isFinite(massNumber)) {
      // Some superheavy elements have string masses like "286" — try Number.
      massNumber = Number(String(el.mass).replace(/[^0-9.]/g, '')) || el.z;
    }
    // Build only once; subsequent calls just update the values.
    // The .nuclide-numbers wrapper holds A (top) and Z (bottom) stacked
    // to the left of the big symbol, mimicking IUPAC notation A,X,Z.
    if (!card.querySelector('.atomic-symbol')) {
      card.innerHTML =
        '<span class="nuclide-numbers">' +
          '<span class="atomic-mass-num">' + massNumber + '</span>' +
          '<span class="atomic-num">' + el.z + '</span>' +
        '</span>' +
        '<span class="atomic-symbol">' + el.sym + '</span>';
    } else {
      card.querySelector('.atomic-mass-num').textContent = String(massNumber);
      card.querySelector('.atomic-symbol').textContent   = el.sym;
      card.querySelector('.atomic-num').textContent      = String(el.z);
    }
  }

  function renderContentSections(el) {
    var anchor = document.querySelector('.lc-el-desc-block');
    if (!anchor) return;

    // Find or create the sections container.
    var container = document.querySelector('.lc-el-content');
    var content = (typeof window.elContentFor === 'function')
      ? window.elContentFor(el.z) : null;

    if (!content) {
      if (typeof window.loadElementContentFor === 'function' &&
          anchor.getAttribute('data-content-requested') !== String(el.z)) {
        anchor.setAttribute('data-content-requested', String(el.z));
        window.loadElementContentFor(el.z).then(function () {
          render();
        }).catch(function (err) {
          console.warn(err && err.message ? err.message : err);
        });
      }
      // No rich content yet for this element — make sure no leftover
      // container is hanging around from a previous render.
      if (container) container.remove();
      return;
    }

    anchor.removeAttribute('data-content-requested');

    if (!container) {
      container = document.createElement('div');
      container.className = 'lc-el-content';
      anchor.parentNode.insertBefore(container, anchor.nextSibling);
    }

    function lbl(key) {
      return (window.I18N && I18N.t) ? (I18N.t(key) || key) : key;
    }

    var sections = [
      { key: 'overview',     label: lbl('el.contentOverview')     },
      { key: 'history',      label: lbl('el.contentHistory')      },
      { key: 'properties',   label: lbl('el.contentProperties')   },
      { key: 'applications', label: lbl('el.contentApplications') },
      { key: 'curiosity',    label: lbl('el.contentCuriosity')    },
    ];

    // Re-render: clear and rebuild. Cheap (5 sections per element).
    container.innerHTML = '';
    sections.forEach(function (s) {
      var body = content[s.key];
      if (!body) return;
      var section = document.createElement('section');
      section.className = 'lc-el-content-section';
      section.setAttribute('data-section', s.key);
      var h2 = document.createElement('h2');
      h2.className = 'lc-el-content-h';
      h2.textContent = s.label;
      var p = document.createElement('p');
      p.className = 'lc-el-content-body';
      p.textContent = body;
      section.appendChild(h2);
      section.appendChild(p);
      container.appendChild(section);
    });
  }

  // ── Share button ────────────────────────────────────────────────
  // Compact icon-only button injected into .topbar, BEFORE the language
  // toggle. Same visual weight as the theme/lang buttons next to it.
  // Hover reveals the same dropdown (WhatsApp / Twitter / Telegram /
  // Email / Copy) used on every other page via page-share-init.js.
  // Element-specific share text (name + symbol + Z) makes the message
  // richer than the generic page-share fallback.
  function renderShareButton(el, name) {
    if (typeof window.injectShareButton !== 'function') return;
    var topbar = document.querySelector('.topbar');
    if (!topbar) return;
    var tpl  = (window.I18N && I18N.t) ? I18N.t('el.shareTextTemplate') : null;
    if (!tpl) tpl = 'Check out {name} ({symbol}) — element {z} on the periodic table';
    var text = tpl.replace('{name}', name).replace('{symbol}', el.sym).replace('{z}', el.z);
    window.injectShareButton({
      anchor:     topbar,
      beforeNode: topbar.querySelector('[data-i18n-toggle]'),
      compact:    true,
      title:      name + ' (' + el.sym + ') — Atomurus',
      text:       text,
      campaign:   'element_share',
      extraClass: 'share-host-element',
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', render);
  } else {
    render();
  }
  if (window.I18N && I18N.onChange) {
    I18N.onChange(function (lang) {
      if (lang === 'en' && typeof window.__ATOMURUS_ENSURE_ELEMENTS_EN === 'function') {
        window.__ATOMURUS_ENSURE_ELEMENTS_EN().then(render).catch(function () { render(); });
        return;
      }
      render();
    });
  }
})();
