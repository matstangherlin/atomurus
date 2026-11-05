/* Atomurus — display currency by country.
   Reais (BRL) for visitors in Brazil, dollars (USD) for every other country,
   whatever the page language. Order of evidence:
     1. the `atomurus-geo` cookie set by the geo-currency edge function;
     2. the server's pricingContext from /api/ads-config (country-based);
     3. the page language, only when no country is known (local dev).
   Checkout re-derives the currency on the server, so this only drives what
   the page shows. */
(function () {
  'use strict';

  var PRICES = {
    free: { brl: { pt: 'R$0', en: 'R$0' }, usd: { pt: 'US$0', en: '$0' } },
    pro: { brl: { pt: 'R$180', en: 'R$180' }, usd: { pt: 'US$60', en: '$60' } },
    'pro-eq': {
      brl: { pt: '≈ R$15 por mês', en: '≈ R$15 a month' },
      usd: { pt: '≈ US$5 por mês', en: '≈ $5 a month' }
    }
  };

  function lang() {
    return (document.documentElement.lang || '').toLowerCase().indexOf('pt') === 0 ? 'pt' : 'en';
  }

  function fromCookie() {
    try {
      var match = document.cookie.match(/(?:^|;\s*)atomurus-geo=([A-Z]{2})\.(brl|usd)(?:;|$)/);
      return match ? { country: match[1], currency: match[2] } : null;
    } catch (e) {
      return null;
    }
  }

  function fromServer() {
    var state = window.__ATOMURUS_ADS__;
    var ctx = state && state.pricingContext;
    if (ctx && ctx.country && (ctx.currency === 'brl' || ctx.currency === 'usd')) {
      return { country: ctx.country, currency: ctx.currency };
    }
    return null;
  }

  function info() {
    var hit = fromCookie() || fromServer();
    if (hit) return { country: hit.country, currency: hit.currency, source: 'geo' };
    return { country: null, currency: lang() === 'pt' ? 'brl' : 'usd', source: 'language' };
  }

  function current() {
    return info().currency;
  }

  function price(key, currency, language) {
    var row = PRICES[key];
    if (!row) return '';
    var byCur = row[currency === 'brl' ? 'brl' : 'usd'];
    return byCur[language === 'pt' ? 'pt' : 'en'];
  }

  function apply(root) {
    var cur = current();
    var language = lang();
    (root || document).querySelectorAll('[data-rm-price]').forEach(function (node) {
      var text = price(node.getAttribute('data-rm-price'), cur, language);
      if (text && node.textContent !== text) node.textContent = text;
    });
    document.documentElement.setAttribute('data-currency', cur);
  }

  window.AtomurusCurrency = { current: current, info: info, price: price, apply: apply };

  function boot() {
    apply();
    document.addEventListener('atomurus-ads-ready', function () { apply(); });
    if (window.I18N && typeof window.I18N.onChange === 'function') {
      window.I18N.onChange(function () { apply(); });
    }
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot);
  else boot();
})();
