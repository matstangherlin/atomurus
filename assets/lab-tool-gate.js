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

  var CALC_TAB_POLICY = {
    molar: 'public',
    dilute: 'public',
    scientific: 'login',
    unit: 'login',
    ideal: 'login',
    ph: 'login',
    stoich: 'pro',
    thermo: 'pro'
  };

  var CALC_TAB_FEATURE = {
    scientific: 'scientificCalculator',
    unit: 'unitConverter',
    ideal: 'idealGasCalculator',
    ph: 'phCalculator',
    stoich: 'publicStoichiometry',
    thermo: 'publicThermodynamics'
  };

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
      return { need: 'pro', kind: 'compare', feature: 'publicElementCompare' };
    }
    if (/\/viewer\/molecules/.test(path) || /(^|\/)molecules$/.test(path)) {
      return { need: 'pro', kind: 'viewer', feature: 'moleculeViewer' };
    }
    if (/\/viewer\/atomic-models/.test(path) || /\/atomic-models(\/|$)/.test(path)) {
      return { need: 'pro', kind: 'viewer', feature: 'atomicModelViewer' };
    }
    if (/\/viewer\/allotropes/.test(path) || /(^|\/)allotropes$/.test(path)) {
      return { need: 'pro', kind: 'viewer', feature: 'allotropeViewer' };
    }
    if (/\/viewer\/isomerism/.test(path) || /(^|\/)isomerism(\/|$)/.test(path)) {
      return { need: 'pro', kind: 'viewer', feature: 'isomerismViewer' };
    }
    return { need: 'public', kind: 'page', feature: null };
  }

  function sessionOf() {
    var ads = window.__ATOMURUS_ADS__ || {};
    var auth = window.__ATOMURUS_AUTH__ || {};
    var user = ads.user || auth.user || null;
    var features = (user && user.features) || {};
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
    if (need === 'login') {
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
    if (need === 'login') {
      return {
        kicker: t('Free account', 'Conta gratuita'),
        title: t('Sign in to use this calculator.', 'Entre para usar esta calculadora.'),
        body: t(
          'Create a free Atomurus account to unlock extra calculators. Molar mass and dilution stay open without signing in.',
          'Crie uma conta Atomurus gratuita para liberar calculadoras extras. Massa molar e diluição continuam abertas sem login.'
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
    if (kind === 'compare') {
      return {
        kicker: t('PRO', 'PRO'),
        title: t('Element Compare is included with Pro.', 'Comparar elementos está no Pro.'),
        body: t(
          'Compare several elements and save the analysis to your workspace. Advanced Element Compare lives in Pro Lab. The periodic table, heatmap, trends and isotopes remain open. New accounts include a 30-day trial.',
          'Compare vários elementos e salve a análise no workspace. A Comparação avançada de elementos fica no Pro Lab. Tabela, mapa de calor, tendências e isótopos continuam abertos. Contas novas incluem 30 dias de trial.'
        )
      };
    }
    if (feature === 'moleculeViewer') {
      return {
        kicker: t('PRO', 'PRO'),
        title: t('Molecules is included with Pro.', 'Moléculas está no Pro.'),
        body: t(
          'Explore molecular structures in 3D and save the work to your workspace. Interactive 3D viewers stay in Atomurus Pro. New accounts include a 30-day trial.',
          'Explore estruturas moleculares em 3D e salve o trabalho no workspace. Visualizadores 3D ficam no Atomurus Pro. Contas novas incluem 30 dias de trial.'
        )
      };
    }
    if (feature === 'atomicModelViewer') {
      return {
        kicker: t('PRO', 'PRO'),
        title: t('Atomic Models is included with Pro.', 'Modelos atômicos está no Pro.'),
        body: t(
          'Inspect atomic models in 3D. Interactive 3D viewers stay in Atomurus Pro. New accounts include a 30-day trial.',
          'Veja modelos atômicos em 3D. Visualizadores 3D ficam no Atomurus Pro. Contas novas incluem 30 dias de trial.'
        )
      };
    }
    if (feature === 'allotropeViewer') {
      return {
        kicker: t('PRO', 'PRO'),
        title: t('Allotropes is included with Pro.', 'Alótropos está no Pro.'),
        body: t(
          'Compare allotrope structures in 3D. Interactive 3D viewers stay in Atomurus Pro. New accounts include a 30-day trial.',
          'Explore estruturas alotrópicas em 3D. Visualizadores 3D ficam no Atomurus Pro. Contas novas incluem 30 dias de trial.'
        )
      };
    }
    if (feature === 'isomerismViewer') {
      return {
        kicker: t('PRO', 'PRO'),
        title: t('Isomerism is included with Pro.', 'Isomeria está no Pro.'),
        body: t(
          'Inspect isomerism in 3D. Interactive 3D viewers stay in Atomurus Pro. New accounts include a 30-day trial.',
          'Veja isomeria em 3D. Visualizadores 3D ficam no Atomurus Pro. Contas novas incluem 30 dias de trial.'
        )
      };
    }
    return {
      kicker: t('PRO', 'PRO'),
      title: t('This tool is part of Atomurus Pro.', 'Esta ferramenta faz parte do Atomurus Pro.'),
      body: t(
        'Interactive 3D viewers stay in Pro. The page remains a public preview. New accounts include a 30-day Pro trial — no card required to start.',
        'Visualizadores 3D ficam no Pro. A página continua como prévia pública. Contas novas incluem 30 dias de trial — sem cartão para começar.'
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
    if (need === 'login') {
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
    Object.keys(CALC_TAB_POLICY).forEach(function (tab) {
      var need = CALC_TAB_POLICY[tab];
      if (need === 'public') return;
      var btn = document.querySelector('.calc-menu-item[data-target="' + tab + '"]');
      if (!btn || btn.querySelector('.lab-tool-need')) return;
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
    Object.keys(CALC_TAB_POLICY).forEach(function (tab) {
      var tabHost = calcHost(tab);
      if (!tabHost) return;
      var need = CALC_TAB_POLICY[tab];
      var feature = CALC_TAB_FEATURE[tab] || null;
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
    calcTabPolicy: function (tab) { return CALC_TAB_POLICY[tab] || 'public'; },
    calcTabFeature: function (tab) { return CALC_TAB_FEATURE[tab] || null; },
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
