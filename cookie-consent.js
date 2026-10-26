// Choice banner. Necessary storage stays on. Measurement and advertising
// wait for Accept, Reject, or Configure. No "by continuing you agree".
(function () {
  'use strict';

  var LEGACY_KEY = 'atomurus-cookie-consent';

  function t(key, fallback) {
    try {
      if (window.I18N && typeof window.I18N.t === 'function') {
        var value = window.I18N.t(key);
        if (value && value !== key) return value;
      }
    } catch (_err) {}
    return fallback;
  }

  function portuguese() {
    return (document.documentElement.lang || '').toLowerCase().indexOf('pt') === 0;
  }

  function copy() {
    if (portuguese()) {
      return {
        title: t('common.consent.title', 'Cookies'),
        body: t('common.consent.body', 'Cookies necessários ficam ativos. Medição e anúncios só carregam se você permitir.'),
        privacy: t('common.consent.privacy', 'Política de Privacidade'),
        accept: t('common.consent.accept', 'Aceitar'),
        reject: t('common.consent.reject', 'Recusar'),
        configure: t('common.consent.configure', 'Configurar'),
        necessary: t('common.consent.necessary', 'Necessários'),
        necessaryHint: t('common.consent.necessaryHint', 'Sempre ativos. Guardam esta escolha e preferências do site.'),
        analytics: t('common.consent.analytics', 'Medição'),
        analyticsHint: t('common.consent.analyticsHint', 'Google Analytics. Cookies _ga e _ga_*.'),
        ads: t('common.consent.ads', 'Publicidade'),
        adsHint: t('common.consent.adsHint', 'Google AdSense e AdCash. Cookie IDE, entre outros.'),
        save: t('common.consent.save', 'Salvar'),
        dialog: t('common.consent.dialog', 'Escolha de cookies')
      };
    }
    return {
      title: t('common.consent.title', 'Cookies'),
      body: t('common.consent.body', 'Necessary cookies stay on. Measurement and ads load only if you allow them.'),
      privacy: t('common.consent.privacy', 'Privacy Policy'),
      accept: t('common.consent.accept', 'Accept'),
      reject: t('common.consent.reject', 'Reject'),
      configure: t('common.consent.configure', 'Configure'),
      necessary: t('common.consent.necessary', 'Necessary'),
      necessaryHint: t('common.consent.necessaryHint', 'Always on. They remember this choice and site preferences.'),
      analytics: t('common.consent.analytics', 'Measurement'),
      analyticsHint: t('common.consent.analyticsHint', 'Google Analytics. Cookies _ga and _ga_*.'),
      ads: t('common.consent.ads', 'Advertising'),
      adsHint: t('common.consent.adsHint', 'Google AdSense and AdCash. The IDE cookie, among others.'),
      save: t('common.consent.save', 'Save'),
      dialog: t('common.consent.dialog', 'Cookie choice')
    };
  }

  function prefix() {
    var depth = location.pathname.split('/').filter(Boolean).length - 1;
    var out = '';
    for (var i = 0; i < depth; i += 1) out += '../';
    return out;
  }

  function decided() {
    return currentChoice().decided;
  }

  function currentChoice() {
    if (window.atomurusConsent && typeof window.atomurusConsent.get === 'function') {
      return window.atomurusConsent.get();
    }
    try {
      var legacy = localStorage.getItem(LEGACY_KEY);
      if (legacy === 'accepted') return { decided: true, analytics: true, ads: true };
      if (legacy === 'rejected') return { decided: true, analytics: false, ads: false };
    } catch (_err) {}
    return { decided: false, analytics: false, ads: false };
  }

  function apply(partial) {
    if (window.atomurusConsent && typeof window.atomurusConsent.set === 'function') {
      window.atomurusConsent.set(partial);
      return;
    }
    try {
      var both = !!(partial.analytics && partial.ads);
      localStorage.setItem(LEGACY_KEY, both ? 'accepted' : 'rejected');
    } catch (_err) {}
  }

  var css = ''
    + '#aco-cookie-banner{position:fixed;left:12px;right:12px;bottom:12px;max-width:520px;margin:0 auto;box-sizing:border-box;max-height:20vh;overflow:auto;padding:10px 12px;border-radius:14px;background:var(--lc-paper,var(--surface,#F8F5EC));color:var(--lc-ink,var(--text-1,#14120E));border:1px solid var(--lc-rule,var(--border,#D8D2BF));box-shadow:0 8px 24px rgba(0,0,0,.16);font-family:"Inter Tight",system-ui,sans-serif;line-height:1.4;z-index:450}'
    + '#aco-cookie-banner .aco-title{font-family:"Instrument Serif",Georgia,serif;font-size:18px;margin:0 0 4px}'
    + '#aco-cookie-banner .aco-body{font-size:12.5px;margin:0 0 8px}'
    + '#aco-cookie-banner a{color:var(--accent,#1E6A50)}'
    + '#aco-cookie-banner .aco-row{display:flex;flex-wrap:wrap;gap:8px}'
    + '#aco-cookie-banner button{flex:1 1 30%;min-height:44px;font:inherit;font-size:13px;font-weight:600;border-radius:10px;border:1px solid var(--lc-rule,#D8D2BF);background:transparent;color:inherit;cursor:pointer}'
    + '#aco-cookie-banner button.aco-equal{background:var(--accent,#1E6A50);border-color:var(--accent,#1E6A50);color:#fff}'
    + '#aco-cookie-banner label{display:flex;gap:8px;align-items:flex-start;font-size:12.5px;margin:6px 0}'
    + '#aco-cookie-banner input{width:18px;height:18px;margin-top:2px}'
    + '.aco-manage-cookies{background:none;border:0;padding:8px 0;min-height:44px;font:inherit;color:inherit;cursor:pointer;text-decoration:underline}';

  var style = document.createElement('style');
  style.textContent = css;
  document.head.appendChild(style);

  var bar = document.createElement('div');
  bar.id = 'aco-cookie-banner';
  bar.setAttribute('role', 'dialog');
  bar.hidden = true;
  bar.style.display = 'none';
  var mode = 'choice';
  var openedFromManage = false;
  var returnFocus = null;

  function showBar() {
    bar.hidden = false;
    bar.style.display = 'block';
    if (!bar.parentNode) document.body.appendChild(bar);
  }

  function hideBar() {
    bar.hidden = true;
    bar.style.display = 'none';
    if (returnFocus && returnFocus.focus) returnFocus.focus();
  }

  function choiceView(text) {
    mode = 'choice';
    bar.setAttribute('aria-label', text.dialog);
    bar.innerHTML = ''
      + '<p class="aco-title" id="aco-cookie-title">' + text.title + '</p>'
      + '<p class="aco-body">' + text.body + ' <a href="' + prefix() + 'privacy.html">' + text.privacy + '</a>.</p>'
      + '<div class="aco-row">'
      + '<button type="button" class="aco-equal" id="aco-cc-accept">' + text.accept + '</button>'
      + '<button type="button" class="aco-equal" id="aco-cc-reject">' + text.reject + '</button>'
      + '<button type="button" id="aco-cc-configure">' + text.configure + '</button>'
      + '</div>';
    bar.querySelector('#aco-cc-accept').addEventListener('click', function () {
      apply({ analytics: true, ads: true });
      hideBar();
    });
    bar.querySelector('#aco-cc-reject').addEventListener('click', function () {
      apply({ analytics: false, ads: false });
      hideBar();
    });
    bar.querySelector('#aco-cc-configure').addEventListener('click', function () {
      configureView(copy());
    });
    showBar();
    var accept = bar.querySelector('#aco-cc-accept');
    if (accept) accept.focus();
  }

  function configureView(text) {
    mode = 'configure';
    var state = currentChoice();
    bar.setAttribute('aria-label', text.configure);
    bar.innerHTML = ''
      + '<p class="aco-title">' + text.configure + '</p>'
      + '<label><input type="checkbox" checked disabled> <span><strong>' + text.necessary + '</strong><br>' + text.necessaryHint + '</span></label>'
      + '<label><input type="checkbox" id="aco-cc-analytics"' + (state.analytics ? ' checked' : '') + '> <span><strong>' + text.analytics + '</strong><br>' + text.analyticsHint + '</span></label>'
      + '<label><input type="checkbox" id="aco-cc-ads"' + (state.ads ? ' checked' : '') + '> <span><strong>' + text.ads + '</strong><br>' + text.adsHint + '</span></label>'
      + '<div class="aco-row"><button type="button" class="aco-equal" id="aco-cc-save">' + text.save + '</button></div>';
    bar.querySelector('#aco-cc-save').addEventListener('click', function () {
      apply({
        analytics: !!bar.querySelector('#aco-cc-analytics').checked,
        ads: !!bar.querySelector('#aco-cc-ads').checked
      });
      hideBar();
    });
    showBar();
    var first = bar.querySelector('#aco-cc-analytics');
    if (first) first.focus();
  }

  function open(fromManage) {
    openedFromManage = !!fromManage || decided();
    returnFocus = document.activeElement;
    choiceView(copy());
    if (fromManage || decided()) configureView(copy());
  }

  document.addEventListener('keydown', function (event) {
    if (event.key !== 'Escape' || mode !== 'configure' || bar.hidden) return;
    event.preventDefault();
    if (openedFromManage && decided()) hideBar();
    else choiceView(copy());
  });

  document.addEventListener('click', function (event) {
    var target = event.target && event.target.closest ? event.target.closest('[data-consent-manage]') : null;
    if (!target) return;
    event.preventDefault();
    open(true);
  });

  window.addEventListener('atomurus:consent-open', function () { open(true); });

  function ready() {
    if (!decided()) open(false);
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', ready);
  else ready();
})();
