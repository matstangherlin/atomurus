/**
 * Public-lab access presentation.
 *
 * This module controls previews and conversion UI only.
 * Premium execution/data must also be authorized server-side.
 */
(function () {
  'use strict';

  if (window.__atomurusLabToolGate) return;
  window.__atomurusLabToolGate = true;

  var STYLE = [
    '.lab-tool-gate{position:absolute;inset:0;z-index:40;display:flex;align-items:center;justify-content:center;',
    'padding:24px;background:rgba(242,239,231,.92);backdrop-filter:blur(6px);text-align:center;pointer-events:auto}',
    '[data-theme="dark"] .lab-tool-gate{background:rgba(18,16,14,.88)}',
    '.lab-tool-gate-host{position:relative;overflow:hidden;min-height:28rem;max-height:min(72vh,760px)}',
    '.lab-tool-gate-card{max-width:28rem}',
    '.lab-tool-gate-kicker{margin:0 0 8px;font-size:11px;letter-spacing:.12em;text-transform:uppercase;color:var(--lc-ink-3,#8E8978)}',
    '.lab-tool-gate-title{margin:0 0 8px;font-family:"Instrument Serif",Georgia,serif;font-size:28px;line-height:1.2;color:var(--lc-ink,#14120E)}',
    '.lab-tool-gate-body{margin:0 0 16px;font-size:15px;line-height:1.45;color:var(--lc-ink-2,#58544A)}',
    '.lab-tool-gate-actions{display:flex;flex-wrap:wrap;gap:8px;justify-content:center}',
    '.lab-tool-gate-actions a{display:inline-flex;align-items:center;justify-content:center;min-height:40px;padding:0 14px;',
    'border-radius:8px;text-decoration:none;font-size:14px;font-weight:600}',
    '.lab-tool-gate-primary{background:#1E6A50;color:#F8F5EC}',
    '.lab-tool-gate-secondary{background:transparent;color:inherit;border:1px solid var(--lc-rule,#D8D2BF)}',
    '.calc-tab,.canvas-wrap,.compare-wrap,.content-inner,.viewer{position:relative}',
    '.calc-menu-item .lab-tool-need{margin-left:4px}'
  ].join('');

  function catalog() {
    return window.ATOMURUS_ACCESS || {};
  }

  function catalogAccess(featureKey, fallback) {
    var features = catalog().FEATURES || {};
    var spec = features[featureKey];
    return (spec && spec.access) || fallback || 'public';
  }

  function calcTabPolicyMap() {
    var tabs = catalog().LAB_TABS;
    if (tabs) {
      var out = {};
      Object.keys(tabs).forEach(function (tab) {
        out[tab] = tabs[tab].access || 'public';
      });
      return out;
    }
    return {
      molar: 'public',
      dilute: 'public',
      scientific: 'public',
      unit: 'public',
      ideal: 'public',
      ph: 'public',
      stoich: 'pro',
      thermo: 'pro'
    };
  }

  function calcTabFeatureMap() {
    var tabs = catalog().LAB_TABS;
    if (tabs) {
      var out = {};
      Object.keys(tabs).forEach(function (tab) {
        out[tab] = tabs[tab].feature || null;
      });
      return out;
    }
    return {
      scientific: 'scientificCalculator',
      unit: 'unitConverter',
      ideal: 'idealGasCalculator',
      ph: 'phCalculator',
      stoich: 'publicStoichiometry',
      thermo: 'publicThermodynamics'
    };
  }

  function langIsPt() {
    return (document.documentElement.lang || '').toLowerCase().indexOf('pt') === 0;
  }

  function t(en, pt) {
    return langIsPt() ? pt : en;
  }

  function compactPath(pathname) {
    return String(pathname || location.pathname)
      .split('?')[0]
      .split('#')[0]
      .replace(/\.html?$/i, '')
      .replace(/\.pt$/i, '')
      .replace(/\/+$/, '') || '/';
  }

  function pagePolicy(pathname) {
    var path = compactPath(pathname);
    if (path.indexOf('/explore/') !== -1) return { need: 'public', kind: 'page', feature: null };
    if (/\/periodic-table\/compare$/.test(path)) {
      return { need: catalogAccess('publicElementCompare', 'public'), kind: 'compare', feature: 'publicElementCompare' };
    }
    if (/\/viewer\/molecules/.test(path) || /(^|\/)molecules$/.test(path)) {
      return { need: catalogAccess('moleculeViewer', 'public'), kind: 'viewer', feature: 'moleculeViewer' };
    }
    if (/\/viewer\/atomic-models/.test(path) || /\/atomic-models(\/|$)/.test(path)) {
      return { need: catalogAccess('atomicModelViewer', 'public'), kind: 'viewer', feature: 'atomicModelViewer' };
    }
    if (/\/viewer\/allotropes/.test(path) || /(^|\/)allotropes$/.test(path)) {
      return { need: catalogAccess('allotropeViewer', 'public'), kind: 'viewer', feature: 'allotropeViewer' };
    }
    if (/\/viewer\/isomerism/.test(path) || /(^|\/)isomerism(\/|$)/.test(path)) {
      return { need: catalogAccess('isomerismViewer', 'public'), kind: 'viewer', feature: 'isomerismViewer' };
    }
    return { need: 'public', kind: 'page', feature: null };
  }

  function sessionOf() {
    var ads = window.__ATOMURUS_ADS__ || {};
    var auth = window.__ATOMURUS_AUTH__ || {};
    var user = ads.user || auth.user || null;
    var features = (user && user.features) || ads.features || {};
    return {
      signedIn: Boolean(ads.signedIn || auth.signedIn || (user && (user.id || user.email))),
      isPro: Boolean((user && user.isPro) || ads.isPro),
      ready: Boolean(ads.ready || auth.ready),
      user: user,
      features: features
    };
  }

  function hasFeature(session, featureKey) {
    if (!featureKey) return false;
    return Boolean(session.features && session.features[featureKey]);
  }

  function allowed(need, session, featureKey) {
    if (!need || need === 'public') return true;
    if (need === 'login' || need === 'account') {
      if (featureKey) return hasFeature(session, featureKey) || Boolean(session.signedIn && session.ready);
      return Boolean(session.signedIn);
    }
    if (need === 'pro') {
      if (!session.ready) return false;
      if (featureKey) return hasFeature(session, featureKey);
      return false;
    }
    return true;
  }

  function nextPath() {
    return location.pathname + location.search + location.hash;
  }

  function loginHref() {
    return '/login?next=' + encodeURIComponent(nextPath());
  }

  function signupHref() {
    return '/signup?next=' + encodeURIComponent(nextPath());
  }

  function copyFor(need, kind, feature) {
    if (need === 'login' || need === 'account') {
      return {
        kicker: t('Free account', 'Conta gratuita'),
        title: t('Sign in to continue.', 'Entre para continuar.'),
        body: t(
          'Create a free Atomurus account to save your work and pick up where you left off. Exploring chemistry stays open without signing in.',
          'Crie uma conta Atomurus gratuita para salvar o que você estuda e continuar depois. Explorar química continua aberto sem login.'
        )
      };
    }
    if (kind === 'calc') {
      return {
        kicker: t('PRO', 'PRO'),
        title: t('Stoichiometry and thermodynamics are Pro.', 'Estequiometria e termodinâmica são Pro.'),
        body: t(
          'Reaction Workbench and the thermo solver are part of Atomurus Pro. New accounts include a 30-day Pro trial — no card required to start.',
          'O Laboratório de Reações e o solver termo fazem parte do Atomurus Pro. Contas novas incluem 30 dias de trial — sem cartão para começar.'
        )
      };
    }
    return {
      kicker: t('PRO', 'PRO'),
      title: t('This tool is part of Atomurus Pro.', 'Esta ferramenta faz parte do Atomurus Pro.'),
      body: t(
        'Atomurus Pro is for solving, analyzing and experimenting — not for viewing the public lab. New accounts include a 30-day Pro trial — no card required to start.',
        'O Atomurus Pro é para resolver, analisar e experimentar — não para ver o lab público. Contas novas incluem 30 dias de trial — sem cartão para começar.'
      )
    };
  }

  function ensureStyle() {
    if (document.getElementById('lab-tool-gate-style')) return;
    var style = document.createElement('style');
    style.id = 'lab-tool-gate-style';
    style.textContent = STYLE;
    document.head.appendChild(style);
  }

  function setInert(host, on) {
    if (!host) return;
    Array.prototype.forEach.call(host.children, function (el) {
      if (el.classList && el.classList.contains('lab-tool-gate')) return;
      if (on) el.setAttribute('inert', '');
      else el.removeAttribute('inert');
    });
  }

  function overlay(host, need, id, kind, feature) {
    if (!host) return;
    var session = sessionOf();
    var existing = host.querySelector(':scope > .lab-tool-gate');
    var signedKey = session.signedIn ? '1' : '0';
    if (
      existing &&
      existing.getAttribute('data-need') === need &&
      existing.getAttribute('data-kind') === String(kind || '') &&
      existing.getAttribute('data-feature') === String(feature || '') &&
      existing.getAttribute('data-signed') === signedKey
    ) {
      if (id === 'lab-tool-gate') host.classList.add('lab-tool-gate-host');
      setInert(host, true);
      return;
    }
    if (existing) existing.remove();
    var copy = copyFor(need, kind, feature);
    var box = document.createElement('div');
    box.className = 'lab-tool-gate';
    box.id = id || 'lab-tool-gate';
    box.setAttribute('data-need', need);
    box.setAttribute('data-kind', kind || '');
    box.setAttribute('data-feature', feature || '');
    box.setAttribute('data-signed', signedKey);
    box.setAttribute('role', 'dialog');
    box.setAttribute('aria-modal', 'true');
    box.setAttribute('aria-label', copy.title);
    var card = document.createElement('div');
    card.className = 'lab-tool-gate-card';
    card.innerHTML =
      '<p class="lab-tool-gate-kicker"></p>' +
      '<h2 class="lab-tool-gate-title"></h2>' +
      '<p class="lab-tool-gate-body"></p>' +
      '<div class="lab-tool-gate-actions"></div>';
    card.querySelector('.lab-tool-gate-kicker').textContent = copy.kicker;
    card.querySelector('.lab-tool-gate-title').textContent = copy.title;
    card.querySelector('.lab-tool-gate-body').textContent = copy.body;
    var actions = card.querySelector('.lab-tool-gate-actions');
    if (need === 'login' || need === 'account') {
      var signup = document.createElement('a');
      signup.className = 'lab-tool-gate-primary';
      signup.href = signupHref();
      signup.textContent = t('Create a free account', 'Criar conta gratuita');
      var login = document.createElement('a');
      login.className = 'lab-tool-gate-secondary';
      login.href = loginHref();
      login.textContent = t('Sign in', 'Entrar');
      actions.appendChild(signup);
      actions.appendChild(login);
    } else if (!session.signedIn) {
      var trial = document.createElement('a');
      trial.className = 'lab-tool-gate-primary';
      trial.href = signupHref();
      trial.textContent = t('Start 30-day Pro trial', 'Começar trial Pro de 30 dias');
      actions.appendChild(trial);
      var sign = document.createElement('a');
      sign.className = 'lab-tool-gate-secondary';
      sign.href = loginHref();
      sign.textContent = t('Sign in', 'Entrar');
      actions.appendChild(sign);
    } else {
      var upgrade = document.createElement('a');
      upgrade.className = 'lab-tool-gate-primary';
      upgrade.href = '/pricing?next=' + encodeURIComponent(nextPath());
      upgrade.textContent = t('Upgrade to Pro', 'Assinar o Pro');
      actions.appendChild(upgrade);
    }
    box.appendChild(card);
    host.appendChild(box);
    if (id === 'lab-tool-gate') host.classList.add('lab-tool-gate-host');
    setInert(host, true);
  }

  function clearOverlay(host) {
    if (!host) return;
    var existing = host.querySelector(':scope > .lab-tool-gate');
    if (existing) existing.remove();
    host.classList.remove('lab-tool-gate-host');
    setInert(host, false);
  }

  function calcHost(tab) {
    return document.getElementById('tab-' + tab);
  }

  function pageHost() {
    return document.querySelector('.viewer') ||
      document.getElementById('canvas-wrap') ||
      document.querySelector('.canvas-wrap') ||
      document.querySelector('.compare-wrap') ||
      document.getElementById('tab-comparar') ||
      document.querySelector('.content-inner') ||
      document.querySelector('main.main');
  }

  function markCalcMenu() {
    var policy = calcTabPolicyMap();
    Object.keys(policy).forEach(function (tab) {
      var need = policy[tab];
      var btn = document.querySelector('.calc-menu-item[data-target="' + tab + '"]');
      if (!btn) return;
      var existing = btn.querySelector('.lab-tool-need');
      if (need === 'public') {
        if (existing) existing.remove();
        return;
      }
      if (existing) return;
      var badge = document.createElement('span');
      badge.className = 'calc-menu-badge lab-tool-need';
      badge.textContent = need === 'pro' ? 'PRO' : t('Account', 'Conta');
      btn.appendChild(badge);
    });
  }

  function apply() {
    ensureStyle();
    var session = sessionOf();
    if (!session.ready) return;
    var page = pagePolicy(location.pathname);
    var host = pageHost();
    if (page.need !== 'public' && !allowed(page.need, session, page.feature)) {
      overlay(host, page.need, 'lab-tool-gate', page.kind, page.feature);
    } else {
      clearOverlay(host);
    }
    markCalcMenu();
    var policy = calcTabPolicyMap();
    var features = calcTabFeatureMap();
    Object.keys(policy).forEach(function (tab) {
      var tabHost = calcHost(tab);
      if (!tabHost) return;
      var need = policy[tab];
      var feature = features[tab] || null;
      if (allowed(need, session, feature)) clearOverlay(tabHost);
      else overlay(tabHost, need, 'lab-tool-gate-' + tab, 'calc', feature);
    });
  }

  function boot() {
    apply();
    document.addEventListener('atomurus-ads-ready', apply);
    document.addEventListener('atomurus-auth-change', apply);
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot);
  else boot();

  window.AtomurusLabToolGate = {
    pagePolicy: pagePolicy,
    calcTabPolicy: function (tab) { return calcTabPolicyMap()[tab] || 'public'; },
    calcTabFeature: function (tab) { return calcTabFeatureMap()[tab] || null; },
    allow: allowed,
    hasFeature: hasFeature,
    sessionOf: sessionOf,
    apply: apply
  };

  window.atomurusHasPremiumFeature = function (featureKey) {
    var session = sessionOf();
    if (!session.ready) return false;
    return hasFeature(session, featureKey);
  };
})();
