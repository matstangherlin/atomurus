/* Atomurus Account Center — /account. Not a Workspace subsection. */
(function () {
  'use strict';

  var TABS = ['overview', 'profile', 'security', 'plan', 'preferences', 'chemistry'];
  var COPY = {
    en: {
      title: 'Account',
      lede: 'Settings for your Atomurus account and this device. Chemistry work stays in Workspace.',
      guestTitle: 'Create an Atomurus account',
      guestBody: 'Account is where you manage profile, plan and preferences. The Workspace is your laboratory.',
      create: 'Create account',
      signIn: 'Sign in',
      overview: 'Overview',
      profile: 'Profile',
      security: 'Security',
      plan: 'Plan & Billing',
      preferences: 'Preferences',
      chemistry: 'Chemistry Settings',
      displayName: 'Display name',
      username: 'Username',
      email: 'Email',
      confirmed: 'Email confirmed',
      pending: 'Email pending confirmation',
      reset: 'Reset password',
      signOut: 'Sign out',
      language: 'Language',
      theme: 'Theme',
      quality: '3D quality',
      qualityNote: 'Applies to Atomurus 3D viewers. Auto is the default.',
      auto: 'Auto',
      performance: 'Performance',
      balanced: 'Balanced',
      high: 'Quality',
      reduced: 'Reduced motion',
      reducedOn: 'On',
      reducedOff: 'Off',
      labSettings: 'Periodic table and tool layout remain in Lab settings.',
      openLabSettings: 'Open lab settings',
      freePlan: 'Atomurus Free',
      freeBody: 'Public chemistry tools stay open. Upgrade for solvers and Study Intelligence.',
      upgrade: 'Upgrade to Pro',
      viewPlans: 'View plans',
      trialPlan: 'Atomurus Pro Trial',
      trialDays: '{n} days remaining',
      proPlan: 'Atomurus Pro',
      manage: 'Manage subscription',
      manageBilling: 'Manage billing',
      paymentIssue: 'Payment issue',
      paymentIssueBody: 'Update your payment method to keep Pro active.',
      opening: 'Opening portal…',
      noStripe: 'This account has no Stripe subscription to manage yet.',
      workspace: 'Open Workspace',
      active: 'Active',
      wontRenew: 'Your subscription will not renew.'
    },
    pt: {
      title: 'Conta',
      lede: 'Ajustes da sua conta Atomurus e deste dispositivo. O trabalho de química fica no Workspace.',
      guestTitle: 'Crie uma conta Atomurus',
      guestBody: 'A Conta é onde você gerencia perfil, plano e preferências. O Workspace é o seu laboratório.',
      create: 'Criar conta',
      signIn: 'Entrar',
      overview: 'Visão geral',
      profile: 'Perfil',
      security: 'Segurança',
      plan: 'Plano e cobrança',
      preferences: 'Preferências',
      chemistry: 'Ajustes de química',
      displayName: 'Nome de exibição',
      username: 'Usuário',
      email: 'Email',
      confirmed: 'Email confirmado',
      pending: 'Email pendente de confirmação',
      reset: 'Redefinir senha',
      signOut: 'Sair',
      language: 'Idioma',
      theme: 'Tema',
      quality: 'Qualidade 3D',
      qualityNote: 'Vale para os visualizadores 3D do Atomurus. Auto é o padrão.',
      auto: 'Auto',
      performance: 'Desempenho',
      balanced: 'Equilibrado',
      high: 'Qualidade',
      reduced: 'Menos movimento',
      reducedOn: 'Ligado',
      reducedOff: 'Desligado',
      labSettings: 'A tabela periódica e o layout das ferramentas continuam em Ajustes do laboratório.',
      openLabSettings: 'Abrir ajustes do laboratório',
      freePlan: 'Atomurus Free',
      freeBody: 'As ferramentas públicas de química continuam abertas. Assine o Pro para solvers e inteligência de estudo.',
      upgrade: 'Assinar o Pro',
      viewPlans: 'Ver planos',
      trialPlan: 'Atomurus Pro Trial',
      trialDays: '{n} dias restantes',
      proPlan: 'Atomurus Pro',
      manage: 'Gerenciar assinatura',
      manageBilling: 'Gerenciar cobrança',
      paymentIssue: 'Problema de pagamento',
      paymentIssueBody: 'Atualize o pagamento para manter o Pro ativo.',
      opening: 'Abrindo portal…',
      noStripe: 'Esta conta ainda não tem assinatura Stripe para gerenciar.',
      workspace: 'Abrir Workspace',
      active: 'Ativo',
      wontRenew: 'Sua assinatura não será renovada.'
    }
  };

  function lang() {
    return (document.documentElement.lang || '').toLowerCase().indexOf('pt') === 0 ? 'pt' : 'en';
  }

  function t(key, vars) {
    var table = COPY[lang()] || COPY.en;
    var value = table[key] || COPY.en[key] || key;
    if (window.AtomurusWorkspace && typeof window.AtomurusWorkspace.interpolate === 'function') {
      return window.AtomurusWorkspace.interpolate(value, vars);
    }
    return String(value).replace('{n}', vars && vars.n != null ? vars.n : '');
  }

  function esc(value) {
    return String(value == null ? '' : value)
      .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  }

  function tabFromQuery() {
    try {
      var tab = String(new URLSearchParams(location.search).get('tab') || 'overview').toLowerCase();
      return TABS.indexOf(tab) === -1 ? 'overview' : tab;
    } catch (e) {
      return 'overview';
    }
  }

  function displayName(user) {
    if (!user) return '';
    return user.displayName || user.fullName || user.username || (user.email && user.email.split('@')[0]) || 'Atomurus';
  }

  function signupHref() {
    if (window.AtomurusNav && window.AtomurusNav.guestSignupHref) return window.AtomurusNav.guestSignupHref();
    return '/signup?next=' + encodeURIComponent('/account');
  }

  function loginHref() {
    if (window.AtomurusNav && window.AtomurusNav.guestLoginHref) return window.AtomurusNav.guestLoginHref();
    return '/login?next=%2Faccount';
  }

  function qualityValue() {
    try {
      if (window.atomurusPaperLab && window.atomurusPaperLab.qualityTier) return window.atomurusPaperLab.qualityTier();
      return localStorage.getItem('atomurus-3d-quality') || 'auto';
    } catch (e) { return 'auto'; }
  }

  function reducedMotion() {
    try { return localStorage.getItem('atomurus-reduced-motion') === '1'; } catch (e) { return false; }
  }

  function setReducedMotion(on) {
    try {
      localStorage.setItem('atomurus-reduced-motion', on ? '1' : '0');
      document.documentElement.setAttribute('data-reduced-motion', on ? '1' : '0');
    } catch (e) {}
  }

  function setQuality(tier) {
    try {
      if (window.atomurusPaperLab && window.atomurusPaperLab.setQualityTier) {
        window.atomurusPaperLab.setQualityTier(tier);
      } else {
        localStorage.setItem('atomurus-3d-quality', tier);
      }
    } catch (e) {}
  }

  function openBillingPortal(button) {
    button.disabled = true;
    button.textContent = t('opening');
    return fetch('/api/billing/portal', {
      method: 'POST',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
      body: '{}'
    }).then(function (res) {
      return res.json().catch(function () { return {}; }).then(function (data) {
        if (!res.ok || !data || !data.url) {
          var err = new Error(data.error || 'portal');
          err.code = data.code;
          throw err;
        }
        location.assign(data.url);
      });
    }).catch(function (err) {
      button.disabled = false;
      button.textContent = t('manage');
      var host = document.getElementById('ac-banner');
      if (host) host.textContent = err && err.code === 'billing_customer_missing' ? t('noStripe') : t('noStripe');
    });
  }

  function planBlock(user) {
    var logic = window.AtomurusWorkspace || {};
    var state = logic.accountPlanState ? logic.accountPlanState(user) : { kind: 'free', canManage: false };
    var days = logic.trialDaysLeft ? logic.trialDaysLeft(user.trialEndsAt) : null;
    if (state.kind === 'auto_trial') {
      return '<h3>' + esc(t('trialPlan')) + '</h3><p>' + esc(days == null ? '' : t('trialDays', { n: days })) + '</p>' +
        '<a class="ws-btn ws-btn-primary" href="/pricing">' + esc(t('viewPlans')) + '</a>';
    }
    if (state.kind === 'payment_issue') {
      return '<h3>' + esc(t('paymentIssue')) + '</h3><p>' + esc(t('paymentIssueBody')) + '</p>' +
        (state.canManage
          ? '<button type="button" class="ws-btn ws-btn-primary" id="ws-billing-portal">' + esc(t('manageBilling')) + '</button>'
          : '<a class="ws-btn ws-btn-primary" href="/pricing">' + esc(t('viewPlans')) + '</a>');
    }
    if (state.kind === 'paid' || state.kind === 'billing_trial' || state.kind === 'cancel_scheduled') {
      return '<h3>' + esc(t('proPlan')) + '</h3>' +
        '<p>' + esc(t('active')) + '</p>' +
        (state.kind === 'cancel_scheduled' ? '<p>' + esc(t('wontRenew')) + '</p>' : '') +
        (state.canManage
          ? '<button type="button" class="ws-btn ws-btn-primary" id="ws-billing-portal">' + esc(t('manage')) + '</button>'
          : '<a class="ws-btn ws-btn-primary" href="/pricing">' + esc(t('viewPlans')) + '</a>');
    }
    return '<h3>' + esc(t('freePlan')) + '</h3><p>' + esc(t('freeBody')) + '</p>' +
      '<a class="ws-btn ws-btn-primary" href="/pricing">' + esc(t('upgrade')) + '</a>';
  }

  function renderGuest(node) {
    node.innerHTML =
      '<p class="ws-kicker">Atomurus</p>' +
      '<h1 class="ws-title">' + esc(t('guestTitle')) + '</h1>' +
      '<p class="ws-lede">' + esc(t('guestBody')) + '</p>' +
      '<p><a class="ws-btn ws-btn-primary" href="' + esc(signupHref()) + '">' + esc(t('create')) + '</a> ' +
      '<a class="ws-btn ws-btn-secondary" href="' + esc(loginHref()) + '">' + esc(t('signIn')) + '</a></p>';
  }

  function render(user) {
    var node = document.getElementById('ac-root') || document.getElementById('app-study');
    if (!node) return;
    if (!user) {
      renderGuest(node);
      return;
    }
    var tab = tabFromQuery();
    var tabs = TABS.map(function (id) {
      var on = tab === id;
      var href = id === 'overview' ? '/account' : '/account?tab=' + id;
      return '<a class="ws-account-tab' + (on ? ' is-active' : '') + '" href="' + href + '" role="tab" aria-selected="' + (on ? 'true' : 'false') + '">' + esc(t(id)) + '</a>';
    }).join('');
    var body = '';
    if (tab === 'profile') {
      body = '<section class="ws-account-card"><h2>' + esc(t('profile')) + '</h2>' +
        '<div class="ws-plan-row"><span>' + esc(t('displayName')) + '</span><strong>' + esc(displayName(user)) + '</strong></div>' +
        '<div class="ws-plan-row"><span>' + esc(t('username')) + '</span><span>' + esc(user.username || '—') + '</span></div>' +
        '<div class="ws-plan-row"><span>' + esc(t('email')) + '</span><strong>' + esc(user.email || '—') + '</strong></div></section>';
    } else if (tab === 'security') {
      body = '<section class="ws-account-card"><h2>' + esc(t('security')) + '</h2>' +
        '<div class="ws-plan-row"><span>' + esc(t('email')) + '</span><span>' + esc(user.emailConfirmed ? t('confirmed') : t('pending')) + '</span></div>' +
        '<p><a class="ws-btn ws-btn-secondary" href="/forgot-password">' + esc(t('reset')) + '</a></p>' +
        '<p><button type="button" class="ws-btn" id="ws-acc-signout">' + esc(t('signOut')) + '</button></p></section>';
    } else if (tab === 'plan') {
      body = '<section class="ws-account-card" id="ws-plan-card">' + planBlock(user) + '</section>';
    } else if (tab === 'preferences') {
      var q = qualityValue();
      var reduced = reducedMotion();
      body = '<section class="ws-account-card"><h2>' + esc(t('preferences')) + '</h2>' +
        '<div class="ws-plan-row"><span>' + esc(t('language')) + '</span><button type="button" class="ws-btn ws-btn-secondary" id="ws-pref-lang"></button></div>' +
        '<div class="ws-plan-row"><span>' + esc(t('theme')) + '</span><button type="button" class="ws-btn ws-btn-secondary" id="ws-pref-theme">' + esc(t('theme')) + '</button></div>' +
        '<div class="ws-plan-row"><span>' + esc(t('reduced')) + '</span><button type="button" class="ws-btn ws-btn-secondary" id="ws-pref-motion">' + esc(reduced ? t('reducedOn') : t('reducedOff')) + '</button></div>' +
        '<p class="ws-lede">' + esc(t('qualityNote')) + '</p>' +
        '<div class="ac-quality" role="group" aria-label="' + esc(t('quality')) + '">' +
        [['auto', 'auto'], ['performance', 'performance'], ['balanced', 'balanced'], ['high', 'high']].map(function (pair) {
          return '<button type="button" class="ws-btn' + (q === pair[0] ? ' ws-btn-primary' : ' ws-btn-secondary') + '" data-quality="' + pair[0] + '">' + esc(t(pair[1])) + '</button>';
        }).join('') +
        '</div></section>';
    } else if (tab === 'chemistry') {
      var q = qualityValue();
      body = '<section class="ws-account-card"><h2>' + esc(t('chemistry')) + '</h2>' +
        '<p class="ws-lede">' + esc(t('qualityNote')) + '</p>' +
        '<div class="ac-quality" role="group" aria-label="' + esc(t('quality')) + '">' +
        [['auto', 'auto'], ['performance', 'performance'], ['balanced', 'balanced'], ['high', 'high']].map(function (pair) {
          return '<button type="button" class="ws-btn' + (q === pair[0] ? ' ws-btn-primary' : ' ws-btn-secondary') + '" data-quality="' + pair[0] + '">' + esc(t(pair[1])) + '</button>';
        }).join('') +
        '</div>' +
        '<p class="ws-lede">' + esc(t('labSettings')) + ' <a href="/config">' + esc(t('openLabSettings')) + '</a></p></section>';
    } else {
      body = '<section class="ws-account-card"><h2>' + esc(displayName(user)) + '</h2>' +
        '<p>@' + esc(user.username || '—') + '</p><p>' + esc(user.email || '—') + '</p></section>' +
        '<section class="ws-account-card" id="ws-plan-card">' + planBlock(user) + '</section>' +
        '<nav class="ws-account-dests">' +
        '<a href="/account?tab=profile">' + esc(t('profile')) + '</a>' +
        '<a href="/account?tab=security">' + esc(t('security')) + '</a>' +
        '<a href="/account?tab=plan">' + esc(t('plan')) + '</a>' +
        '<a href="/account?tab=preferences">' + esc(t('preferences')) + '</a>' +
        '<a href="/account?tab=chemistry">' + esc(t('chemistry')) + '</a></nav>' +
        '<p><a class="ws-btn ws-btn-secondary" href="/app">' + esc(t('workspace')) + '</a></p>';
    }

    node.innerHTML =
      '<p class="ws-kicker">Atomurus</p>' +
      '<h1 class="ws-title">' + esc(t('title')) + '</h1>' +
      '<p class="ws-lede">' + esc(t('lede')) + '</p>' +
      '<p id="ac-banner" class="ws-lede" hidden></p>' +
      '<div class="ws-account-tabs" role="tablist">' + tabs + '</div>' + body;

    var portal = document.getElementById('ws-billing-portal');
    if (portal) portal.addEventListener('click', function () { openBillingPortal(portal); });
    var sign = document.getElementById('ws-acc-signout');
    if (sign) sign.addEventListener('click', function () {
      if (window.AtomurusNav && window.AtomurusNav.signOut) window.AtomurusNav.signOut();
      else if (window.AtomurusAuth && window.AtomurusAuth.logout) window.AtomurusAuth.logout();
    });
    var langBtn = document.getElementById('ws-pref-lang');
    if (langBtn && window.I18N) {
      langBtn.textContent = window.I18N.otherLabel ? window.I18N.otherLabel() : 'PT';
      langBtn.addEventListener('click', function () { window.I18N.toggle(); });
    }
    var themeBtn = document.getElementById('ws-pref-theme');
    if (themeBtn) themeBtn.addEventListener('click', function () {
      if (typeof toggleTheme === 'function') toggleTheme();
    });
    var motionBtn = document.getElementById('ws-pref-motion');
    if (motionBtn) motionBtn.addEventListener('click', function () {
      setReducedMotion(!reducedMotion());
      render(user);
    });
    node.querySelectorAll('[data-quality]').forEach(function (btn) {
      btn.addEventListener('click', function () {
        setQuality(btn.getAttribute('data-quality'));
        render(user);
      });
    });
  }

  function boot() {
    var auth = window.AtomurusAuth;
    function paint(user) {
      render(user);
      document.documentElement.classList.remove('auth-pending');
      document.documentElement.classList.add('auth-ready');
      if (window.AtomurusNav && window.AtomurusNav.sync) {
        window.AtomurusNav.sync({
          state: { ready: true, signedIn: Boolean(user), user: user || null }
        });
      }
    }
    function go() {
      var state = auth && auth.getState ? auth.getState() : (window.__ATOMURUS_AUTH__ || {});
      if (!state || !state.ready) return false;
      if (!state.signedIn) {
        paint(null);
        return true;
      }
      fetch('/api/private/dashboard', { credentials: 'include', headers: { Accept: 'application/json' } })
        .then(function (res) {
          return res.json().catch(function () { return {}; }).then(function (data) {
            paint((res.ok && data && data.user) || state.user);
          });
        })
        .catch(function () { paint(state.user); });
      return true;
    }
    if (go()) return;
    document.addEventListener('atomurus-auth-change', function () { go(); });
    document.addEventListener('atomurus-ads-ready', function () { go(); });
    if (auth && typeof auth.getSession === 'function') {
      Promise.resolve(auth.getSession()).then(function () { go(); }).catch(function () { paint(null); });
    } else {
      setTimeout(function () { if (!go()) paint(null); }, 2500);
    }
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot);
  else boot();
})();
