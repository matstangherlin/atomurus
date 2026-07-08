// ───────────────────────────────────────────────────────────────────
// Atomurus — generic share button (hover dropdown, same pattern as
// the "Visualizador" topnav dropdown in index.html)
// ───────────────────────────────────────────────────────────────────
// USAGE
//   <script src="share-button.js?v=..." defer></script>
//   <script>
//     window.injectShareButton({
//       // Required:
//       anchor:    document.querySelector('.topbar'),  // where to inject
//       title:     'Hydrogen (H) — Atomurus',          // share title
//       text:      'Check out Hydrogen — element 1...', // share message
//
//       // Optional:
//       beforeNode: anchor.querySelector('[data-i18n-toggle]'),
//                                       // insertBefore target (default: append)
//       compact:    true,               // icon-only (no "Share" label).
//                                       // Use for topbar / dense UIs.
//       extraClass: 'share-host-topbar',// wrapper class for tweaks
//       campaign:   'element_share',    // utm_campaign (default 'page_share')
//     });
//   </script>
//
// Each link carries UTM parameters so Google Analytics 4 can attribute
// the visit to the correct source (whatsapp / twitter / telegram /
// email / copy). Without these tags, WhatsApp/Telegram traffic shows
// up in GA4 as "Direct" because those apps don't send a Referer.
// ───────────────────────────────────────────────────────────────────

(function () {
  'use strict';

  function lbl(key, fallback) {
    var v = (window.I18N && I18N.t) ? I18N.t(key) : null;
    return v || fallback;
  }
  function buildUrl(source, campaign) {
    // Clean canonical URL — strip any pre-existing utm_* so we don't
    // double-tag links that already have campaign params.
    var base = location.origin + location.pathname;
    var preserved = [];
    try {
      var q = new URLSearchParams(location.search);
      q.forEach(function (val, key) {
        if (key.indexOf('utm_') !== 0) preserved.push(key + '=' + encodeURIComponent(val));
      });
    } catch (_) {}
    var qs = preserved.concat([
      'utm_source=' + encodeURIComponent(source),
      'utm_medium=share',
      'utm_campaign=' + encodeURIComponent(campaign || 'page_share'),
    ]).join('&');
    return base + '?' + qs;
  }

  function injectShareButton(opts) {
    if (!opts || !opts.anchor) return;
    var anchor   = opts.anchor;
    var beforeNode = opts.beforeNode || null;
    var compact  = !!opts.compact;
    var title    = opts.title || document.title;
    var text     = opts.text  || title;
    var campaign = opts.campaign || 'page_share';
    var extraCls = opts.extraClass || '';

    // Re-render if already present (e.g. language toggle re-fires).
    var existing = anchor.querySelector('.share-host');
    if (existing) existing.remove();

    var host = document.createElement('div');
    host.className = 'share-host' + (compact ? ' share-host-compact' : '') +
                     (extraCls ? ' ' + extraCls : '');
    host.tabIndex = 0;
    host.setAttribute('role', 'button');
    host.setAttribute('aria-haspopup', 'menu');
    host.setAttribute('aria-label', lbl('el.shareTitle', 'Share this page'));

    // Build the channel list. The href is what the user navigates to —
    // we encode the text + UTM-tagged URL into each channel's intent URL.
    var channels = [
      {
        id: 'whatsapp',
        label: lbl('el.shareWhatsapp', 'WhatsApp'),
        href: 'https://wa.me/?text=' +
              encodeURIComponent(text + ' ' + buildUrl('whatsapp', campaign)),
        icon: '<svg viewBox="0 0 16 16" fill="currentColor"><path d="M13.601 2.326A7.854 7.854 0 0 0 7.994 0C3.627 0 .068 3.558.064 7.926c0 1.399.366 2.76 1.057 3.965L0 16l4.204-1.102a7.933 7.933 0 0 0 3.79.965h.004c4.368 0 7.926-3.558 7.93-7.93A7.898 7.898 0 0 0 13.6 2.326zM7.994 14.521a6.573 6.573 0 0 1-3.356-.92l-.24-.144-2.494.654.666-2.433-.156-.251a6.56 6.56 0 0 1-1.007-3.505c0-3.626 2.957-6.584 6.591-6.584a6.56 6.56 0 0 1 4.66 1.931 6.557 6.557 0 0 1 1.928 4.66c-.004 3.639-2.961 6.592-6.592 6.592zm3.615-4.934c-.197-.099-1.17-.578-1.353-.646-.182-.065-.315-.099-.445.099-.133.197-.513.646-.627.775-.114.133-.232.148-.43.05-.197-.1-.836-.308-1.592-.985-.59-.525-.985-1.175-1.103-1.372-.114-.198-.011-.304.088-.403.087-.088.197-.232.296-.346.1-.114.133-.198.198-.33.065-.134.034-.248-.015-.347-.05-.099-.445-1.076-.612-1.47-.16-.389-.323-.335-.445-.34-.114-.007-.247-.007-.38-.007a.729.729 0 0 0-.529.247c-.182.198-.691.677-.691 1.654 0 .977.71 1.916.81 2.049.098.133 1.394 2.132 3.383 2.992.47.205.84.326 1.129.418.475.152.904.129 1.246.08.38-.058 1.171-.48 1.338-.943.164-.464.164-.86.114-.943-.049-.084-.182-.133-.38-.232z"/></svg>',
      },
      {
        id: 'twitter',
        label: lbl('el.shareTwitter', 'Twitter / X'),
        href: 'https://twitter.com/intent/tweet?text=' + encodeURIComponent(text) +
              '&url=' + encodeURIComponent(buildUrl('twitter', campaign)),
        icon: '<svg viewBox="0 0 16 16" fill="currentColor"><path d="M12.6.75h2.454l-5.36 6.142L16 15.25h-4.937l-3.867-5.07-4.425 5.07H.316l5.733-6.57L0 .75h5.063l3.495 4.633L12.601.75Zm-.86 13.028h1.36L4.323 2.145H2.865z"/></svg>',
      },
      {
        id: 'telegram',
        label: lbl('el.shareTelegram', 'Telegram'),
        href: 'https://t.me/share/url?url=' + encodeURIComponent(buildUrl('telegram', campaign)) +
              '&text=' + encodeURIComponent(text),
        icon: '<svg viewBox="0 0 16 16" fill="currentColor"><path d="M15.287 1.692a1.146 1.146 0 0 0-1.171-.18L1.43 6.504a1.151 1.151 0 0 0 .076 2.16l2.83.93 1.51 4.928c.122.398.46.69.87.751a1.15 1.15 0 0 0 .96-.343l1.6-1.6 2.86 2.083c.317.232.711.31 1.084.214.379-.097.696-.36.86-.713l3.296-7.07a1.149 1.149 0 0 0-.089-1.152zM6.247 9.36l.39 2.7-.78-2.55 7.32-5.4-6.93 5.25z"/></svg>',
      },
      {
        id: 'email',
        label: lbl('el.shareEmail', 'Email'),
        href: 'mailto:?subject=' + encodeURIComponent(title) +
              '&body=' + encodeURIComponent(text + '\n\n' + buildUrl('email', campaign)),
        icon: '<svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.3"><rect x="1.5" y="3.5" width="13" height="9" rx="1"/><path d="M2 4l6 5 6-5"/></svg>',
      },
    ];

    var channelsHTML = channels.map(function (c) {
      return '<a href="' + c.href + '" target="_blank" rel="noopener" role="menuitem" data-channel="' + c.id + '">' +
               c.icon + '<span>' + c.label + '</span>' +
             '</a>';
    }).join('');

    // Trigger markup. In compact mode (topbar) we hide the label and
    // chevron via CSS — same DOM, smaller skin. Width/height set
    // explicitly on the SVG so the icon never inherits 100% from the
    // surrounding flex container.
    var triggerIcon =
      '<svg class="share-trigger-icon" width="14" height="14" viewBox="0 0 16 16" fill="none" aria-hidden="true">' +
        '<circle cx="12" cy="3.5" r="2"  stroke="currentColor" stroke-width="1.4"/>' +
        '<circle cx="4"  cy="8"   r="2"  stroke="currentColor" stroke-width="1.4"/>' +
        '<circle cx="12" cy="12.5" r="2" stroke="currentColor" stroke-width="1.4"/>' +
        '<path d="M5.7 7L10.3 4.5M5.7 9L10.3 12" stroke="currentColor" stroke-width="1.4"/>' +
      '</svg>';

    host.innerHTML =
      '<div class="share-trigger">' +
        triggerIcon +
        '<span class="share-trigger-label">' + lbl('el.shareButton', 'Share') + '</span>' +
        '<svg class="share-chevron" width="9" height="9" viewBox="0 0 9 9" fill="none" aria-hidden="true">' +
          '<path d="M2 3.5l2.5 2.5L7 3.5" stroke="currentColor" stroke-width="1.3" stroke-linecap="round" stroke-linejoin="round"/>' +
        '</svg>' +
      '</div>' +
      '<div class="share-menu" role="menu">' +
        channelsHTML +
        '<button class="share-item share-copy" type="button" role="menuitem" data-channel="copy">' +
          '<svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.3"><rect x="3.5" y="3.5" width="9" height="9" rx="1.5"/><path d="M6 3V1.5h6V8h-1.5"/></svg>' +
          '<span>' + lbl('el.shareCopy', 'Copy link') + '</span>' +
        '</button>' +
        '<div class="share-toast" hidden></div>' +
      '</div>';

    if (beforeNode && beforeNode.parentNode === anchor) {
      anchor.insertBefore(host, beforeNode);
    } else {
      anchor.appendChild(host);
    }

    function refreshShareLinks() {
      var hrefs = {
        whatsapp: 'https://wa.me/?text=' +
                  encodeURIComponent(text + ' ' + buildUrl('whatsapp', campaign)),
        twitter:  'https://twitter.com/intent/tweet?text=' + encodeURIComponent(text) +
                  '&url=' + encodeURIComponent(buildUrl('twitter', campaign)),
        telegram: 'https://t.me/share/url?url=' + encodeURIComponent(buildUrl('telegram', campaign)) +
                  '&text=' + encodeURIComponent(text),
        email:    'mailto:?subject=' + encodeURIComponent(title) +
                  '&body=' + encodeURIComponent(text + '\n\n' + buildUrl('email', campaign)),
      };
      Object.keys(hrefs).forEach(function (id) {
        var link = host.querySelector('a[data-channel="' + id + '"]');
        if (link) link.href = hrefs[id];
      });
    }
    refreshShareLinks();
    host.addEventListener('mouseenter', refreshShareLinks);
    host.addEventListener('focusin', refreshShareLinks);
    host.addEventListener('pointerdown', refreshShareLinks);

    // Copy-to-clipboard handler (only menu item that's a button, not <a>).
    var copyBtn = host.querySelector('.share-copy');
    var toast   = host.querySelector('.share-toast');
    if (copyBtn) {
      copyBtn.addEventListener('click', function (e) {
        e.preventDefault();
        var url = buildUrl('copy', campaign);
        var done = function () {
          toast.textContent = lbl('el.shareCopied', 'Link copied!');
          toast.hidden = false;
          clearTimeout(toast.__timer);
          toast.__timer = setTimeout(function () { toast.hidden = true; }, 1800);
        };
        if (navigator.clipboard && navigator.clipboard.writeText) {
          navigator.clipboard.writeText(url).then(done, done);
        } else {
          var ta = document.createElement('textarea');
          ta.value = url; ta.style.position = 'fixed'; ta.style.opacity = '0';
          document.body.appendChild(ta); ta.select();
          try { document.execCommand('copy'); } catch (_) {}
          document.body.removeChild(ta);
          done();
        }
      });
    }
  }

  window.injectShareButton = injectShareButton;
})();
