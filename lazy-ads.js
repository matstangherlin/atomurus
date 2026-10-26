// Google Analytics loads only after measurement consent.
// Consent Mode v2 stays denied until that choice. Revoking consent
// deletes _ga cookies and stops further hits. The script tag is not
// requested before consent, so a new visitor makes no analytics call.
(function () {
  'use strict';

  var GA_ID = 'G-Q3ME3FMB8X';
  var loaded = false;

  window.dataLayer = window.dataLayer || [];
  window.gtag = window.gtag || function () { window.dataLayer.push(arguments); };
  window.gtag('consent', 'default', {
    ad_storage: 'denied',
    analytics_storage: 'denied',
    ad_user_data: 'denied',
    ad_personalization: 'denied',
    wait_for_update: 500
  });

  function config() {
    return window.ATOMURUS_CONSENT_CONFIG || { enforce: true };
  }

  function consent() {
    if (window.atomurusConsent && typeof window.atomurusConsent.get === 'function') {
      return window.atomurusConsent.get();
    }
    return { decided: false, analytics: false, ads: false };
  }

  function analyticsAllowed() {
    if (config().enforce === false) return true;
    var state = consent();
    return !!(state.decided && state.analytics);
  }

  function adsAllowed() {
    if (config().enforce === false) return true;
    var state = consent();
    return !!(state.decided && state.ads);
  }

  function updateConsentMode() {
    window.gtag('consent', 'update', {
      analytics_storage: analyticsAllowed() ? 'granted' : 'denied',
      ad_storage: adsAllowed() ? 'granted' : 'denied',
      ad_user_data: adsAllowed() ? 'granted' : 'denied',
      ad_personalization: adsAllowed() ? 'granted' : 'denied'
    });
  }

  function cookieDomains() {
    var host = location.hostname || '';
    var domains = ['', host, '.' + host];
    var parts = host.split('.');
    if (parts.length > 1) domains.push('.' + parts.slice(-2).join('.'));
    return domains;
  }

  function eraseGaCookies() {
    var names = (document.cookie || '').split(';').map(function (part) {
      return part.split('=')[0].replace(/^\s+/, '');
    }).filter(function (name) {
      return name === '_ga' || name.indexOf('_ga_') === 0;
    });
    names.forEach(function (name) {
      cookieDomains().forEach(function (domain) {
        var suffix = '; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/';
        document.cookie = name + '=' + suffix + (domain ? '; domain=' + domain : '');
      });
    });
  }

  function loadAnalytics() {
    if (!analyticsAllowed()) return;
    updateConsentMode();
    if (loaded) return;
    loaded = true;
    window.gtag('js', new Date());
    window.gtag('config', GA_ID);
    var ga = document.createElement('script');
    ga.async = true;
    ga.src = 'https://www.googletagmanager.com/gtag/js?id=' + GA_ID;
    document.head.appendChild(ga);
  }

  function onConsent() {
    if (analyticsAllowed()) loadAnalytics();
    else {
      updateConsentMode();
      eraseGaCookies();
    }
  }

  window.addEventListener('atomurus:consent', onConsent);
  onConsent();
})();
