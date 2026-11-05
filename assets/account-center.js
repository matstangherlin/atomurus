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
      autoTrialEnds: 'Your Pro trial ends on {date} ({n} days). We did not ask for a card and nothing will be charged; after that the account returns to the free plan.',
      autoTrialNoDate: 'Your Pro trial has {n} days left. We did not ask for a card and nothing will be charged; after that the account returns to the free plan.',
      proPlan: 'Atomurus Pro',
      manage: 'Manage subscription',
      manageOrCancel: 'Manage or cancel subscription',
      reactivate: 'Reactivate or manage',
      manageBilling: 'Manage billing',
      renewsOn: 'Renews on {date}.',
      paymentIssue: 'Payment issue',
      paymentIssueBody: 'Update your payment method to keep Pro active.',
      opening: 'Opening portal…',
      noStripe: 'This account does not have a subscription to manage yet.',
      portalError: 'The billing portal could not be opened right now. Try again.',
      workspace: 'Open Workspace',
      active: 'Active',
      wontRenew: 'Your subscription will not renew.',
      cancelUntil: 'Your subscription will not renew. Pro access until {date}.',
      cancelNoDate: 'Your subscription will not renew.',
      yourPlan: 'Your plan',
      currentPlan: 'Current plan',
      billingLabel: 'Billing',
      currencyLabel: 'Currency',
      renewsLabel: 'Renews on',
      accessUntilLabel: 'Pro until',
      monthly: 'Monthly',
      annual: 'Annual',
      renewsShort: 'renews on {date}',
      endsShort: 'ends on {date}',
      stTrial: 'Trial',
      stIssue: 'Payment due',
      stEnding: 'Not renewing',
      stFree: 'Free',
      portalNote: 'In the payment portal you can change the card, download receipts or cancel.',
      proIncludes: 'Your Pro includes',
      proAdds: 'Pro adds',
      profileLede: 'How you appear on Atomurus.',
      profileNote: 'To change your name, username or email, contact support.',
      contactSupport: 'Contact support',
      viewProfile: 'View profile',
      emailDesc: 'Used to sign in and recover the account.',
      password: 'Password',
      passwordDesc: 'We send you a link to create a new password.',
      session: 'Session',
      sessionDesc: 'Signs out of this account on this device.',
      confirmedShort: 'confirmed',
      pendingShort: 'pending',
      prefsLede: 'They apply on every page of this device.',
      light: 'Light',
      dark: 'Dark',
      reducedDesc: 'Reduces animations across the site.',
      securityDesc: 'Email, password and session.',
      prefsDesc: 'Language, theme, motion and 3D quality.',
      chemistryDesc: 'Periodic table and lab tools.',
      chemistryLong: 'Periodic table and tool layout live in the lab settings.',
      mProfile: 'Name, username and email',
      mSecurity: 'Email and password',
      mPlan: 'Subscription and receipts',
      mPrefs: 'Language, theme and 3D',
      mChemistry: 'Periodic table and tools',
      sections: 'Account sections'
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
      autoTrialEnds: 'Seu trial Pro termina em {date} ({n} dias). Não pedimos cartão e nada será cobrado; depois disso a conta volta ao plano gratuito.',
      autoTrialNoDate: 'Seu trial Pro tem {n} dias restantes. Não pedimos cartão e nada será cobrado; depois disso a conta volta ao plano gratuito.',
      proPlan: 'Atomurus Pro',
      manage: 'Gerenciar assinatura',
      manageOrCancel: 'Gerenciar ou cancelar assinatura',
      reactivate: 'Reativar ou gerenciar',
      manageBilling: 'Gerenciar cobrança',
      renewsOn: 'Renova em {date}.',
      paymentIssue: 'Problema de pagamento',
      paymentIssueBody: 'Atualize o pagamento para manter o Pro ativo.',
      opening: 'Abrindo portal…',
      noStripe: 'Esta conta ainda não tem assinatura para gerenciar.',
      portalError: 'Não foi possível abrir o portal agora. Tente novamente.',
      workspace: 'Abrir Workspace',
      active: 'Ativo',
      wontRenew: 'Sua assinatura não será renovada.',
      cancelUntil: 'Sua assinatura não será renovada. Acesso Pro até {date}.',
      cancelNoDate: 'Sua assinatura não será renovada.',
      yourPlan: 'Seu plano',
      currentPlan: 'Plano atual',
      billingLabel: 'Cobrança',
      currencyLabel: 'Moeda',
      renewsLabel: 'Renova em',
      accessUntilLabel: 'Pro até',
      monthly: 'Mensal',
      annual: 'Anual',
      renewsShort: 'renova em {date}',
      endsShort: 'termina em {date}',
      stTrial: 'Teste',
      stIssue: 'Pagamento pendente',
      stEnding: 'Não renova',
      stFree: 'Gratuito',
      portalNote: 'No portal de pagamento você troca o cartão, baixa recibos ou cancela.',
      proIncludes: 'Seu Pro inclui',
      proAdds: 'O Pro inclui',
      profileLede: 'Como você aparece no Atomurus.',
      profileNote: 'Para trocar nome, usuário ou email, fale com o suporte.',
      contactSupport: 'Falar com o suporte',
      viewProfile: 'Ver perfil',
      emailDesc: 'Usado para entrar e recuperar a conta.',
      password: 'Senha',
      passwordDesc: 'Enviamos um link para criar uma senha nova.',
      session: 'Sessão',
      sessionDesc: 'Sai desta conta neste dispositivo.',
      confirmedShort: 'confirmado',
      pendingShort: 'pendente',
      prefsLede: 'Valem em todas as páginas deste dispositivo.',
      light: 'Claro',
      dark: 'Escuro',
      reducedDesc: 'Reduz as animações do site.',
      securityDesc: 'Email, senha e sessão.',
      prefsDesc: 'Idioma, tema, movimento e qualidade 3D.',
      chemistryDesc: 'Tabela periódica e ferramentas do laboratório.',
      chemistryLong: 'Layout da tabela periódica e das ferramentas ficam nos ajustes do laboratório.',
      mProfile: 'Nome, usuário e email',
      mSecurity: 'Email e senha',
      mPlan: 'Assinatura e recibos',
      mPrefs: 'Idioma, tema e 3D',
      mChemistry: 'Tabela periódica e ferramentas',
      sections: 'Seções da conta'
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
    return String(value)
      .replace('{n}', vars && vars.n != null ? vars.n : '')
      .replace('{date}', vars && vars.date != null ? vars.date : '')
      .replace('{when}', vars && vars.when != null ? vars.when : '');
  }

  function planDate(iso) {
    if (!iso) return '';
    var logic = window.AtomurusWorkspace;
    if (!logic || typeof logic.formatDate !== 'function') return '';
    var formatted = logic.formatDate(iso, lang());
    return formatted && formatted !== '—' ? formatted : '';
  }

  function billingPortalMessage(err) {
    return err && err.code === 'billing_customer_missing' ? t('noStripe') : t('portalError');
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
      if (host) {
        host.hidden = false;
        host.textContent = billingPortalMessage(err);
      }
    });
  }

  var ICONS = {
    overview: 'M3.5 10.5 12 4l8.5 6.5M5.5 9v11h13V9M10 20v-5h4v5',
    profile: 'M12 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8zM4.5 20.5c.9-3.4 3.8-5.5 7.5-5.5s6.6 2.1 7.5 5.5',
    security: 'M12 3 5 6v5c0 4.5 3 8.3 7 10 4-1.7 7-5.5 7-10V6z',
    plan: 'M3.5 6.5h17v11h-17zM3.5 10.5h17M7 14.5h4',
    preferences: 'M4 7h10M18 7h2M4 17h4M12 17h8M14 4.5v5M8 14.5v5',
    chemistry: 'M9 3h6M10 3v6L4.5 19a1.5 1.5 0 0 0 1.3 2h12.4a1.5 1.5 0 0 0 1.3-2L14 9V3',
    signOut: 'M15 4h3a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2h-3M10 16l-4-4 4-4M6 12h10',
    chevron: 'm9 6 6 6-6 6',
    back: 'm15 6-6 6 6 6',
    check: 'M5 12.5l4.5 4.5L19 7.5'
  };

  var PERKS = {
    en: ['Chemistry solver', 'Reaction lab', 'Step-by-step stoichiometry', 'Thermodynamics', 'Smart review', 'Study insights'],
    pt: ['Solucionador químico', 'Laboratório de reações', 'Estequiometria passo a passo', 'Termodinâmica', 'Revisão inteligente', 'Insights de estudo']
  };

  function icon(name) {
    return '<svg class="ac-ico" viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="' + ICONS[name] + '"/></svg>';
  }

  function initial(user) {
    var name = displayName(user);
    return esc((name.charAt(0) || 'A').toUpperCase());
  }

  function tabHref(id) {
    return id === 'overview' ? '/account' : '/account?tab=' + id;
  }

  function portalButton(labelKey) {
    return '<button type="button" class="ws-btn ws-btn-primary ac-btn ac-btn-mint" id="ws-billing-portal">' + esc(t(labelKey)) + '</button>';
  }

  function plansLink(primary, labelKey) {
    return '<a class="' + (primary ? 'ws-btn ws-btn-primary ac-btn ac-btn-mint' : 'ac-btn ac-btn-ghost') + '" href="/pricing">' + esc(t(labelKey || 'viewPlans')) + '</a>';
  }

  /* Everything the plan cards need, worked out once for the full and compact cards. */
  function planInfo(user) {
    var logic = window.AtomurusWorkspace || {};
    var state = logic.accountPlanState ? logic.accountPlanState(user) : { kind: 'free', canManage: false };
    var days = logic.trialDaysLeft ? logic.trialDaysLeft(user && user.trialEndsAt) : null;
    var period = user && (user.billingPeriod === 'year' || user.billingPeriod === 'annual') ? t('annual')
      : (user && (user.billingPeriod === 'month' || user.billingPeriod === 'monthly') ? t('monthly') : '');
    return {
      kind: state.kind,
      canManage: Boolean(state.canManage),
      days: days == null ? 0 : days,
      end: planDate(user && user.currentPeriodEnd),
      trialEnd: planDate(user && user.trialEndsAt),
      period: period,
      currency: user && user.billingCurrency ? String(user.billingCurrency).toUpperCase() : ''
    };
  }

  function statusPill(info) {
    var key = 'active', tone = 'ok';
    if (info.kind === 'auto_trial') key = 'stTrial';
    else if (info.kind === 'payment_issue') { key = 'stIssue'; tone = 'warn'; }
    else if (info.kind === 'cancel_scheduled') { key = 'stEnding'; tone = 'warn'; }
    else if (info.kind === 'free') { key = 'stFree'; tone = 'muted'; }
    return '<span class="ac-status is-' + tone + '"><span class="ac-dot"></span>' + esc(t(key)) + '</span>';
  }

  function planName(info) {
    if (info.kind === 'auto_trial') return t('trialPlan');
    if (info.kind === 'payment_issue') return t('paymentIssue');
    if (info.kind === 'free') return t('freePlan');
    return t('proPlan');
  }

  /* Full plan card for the Plan & Billing tab. */
  function planBlock(user) {
    var info = planInfo(user);
    var head = '<div class="ac-plan-head"><div class="ac-plan-id"><span class="ac-plan-kicker">' + esc(t('currentPlan')) + '</span>' +
      '<h3 class="ac-plan-name">' + esc(planName(info)) + '</h3></div>' + statusPill(info) + '</div>';
    var stats = [];
    if (info.kind === 'paid' || info.kind === 'billing_trial' || info.kind === 'payment_issue' || info.kind === 'cancel_scheduled') {
      if (info.period) stats.push([t('billingLabel'), info.period, false]);
      if (info.currency) stats.push([t('currencyLabel'), info.currency, false]);
      if (info.end) stats.push([info.kind === 'cancel_scheduled' ? t('accessUntilLabel') : t('renewsLabel'), info.end, true]);
    }
    var dl = stats.length ? '<dl class="ac-plan-stats">' + stats.map(function (row) {
      return '<div><dt>' + esc(row[0]) + '</dt><dd' + (row[2] ? ' class="is-date"' : '') + '>' + esc(row[1]) + '</dd></div>';
    }).join('') + '</dl>' : '';
    var text = '';
    var actions = '';
    if (info.kind === 'auto_trial') {
      text = info.trialEnd ? t('autoTrialEnds', { date: info.trialEnd, n: info.days }) : t('autoTrialNoDate', { n: info.days });
      actions = plansLink(true);
    } else if (info.kind === 'payment_issue') {
      text = t('paymentIssueBody') + (info.end ? ' ' + t('renewsOn', { date: info.end }) : '');
      actions = info.canManage ? portalButton('manageOrCancel') + plansLink(false) : plansLink(true);
    } else if (info.kind === 'cancel_scheduled') {
      text = info.end ? t('cancelUntil', { date: info.end }) : t('cancelNoDate');
      actions = info.canManage ? portalButton('reactivate') + plansLink(false) : plansLink(true);
    } else if (info.kind === 'paid' || info.kind === 'billing_trial') {
      text = info.end ? t('renewsOn', { date: info.end }) : '';
      actions = info.canManage ? portalButton('manageOrCancel') + plansLink(false) : plansLink(true);
    } else {
      text = t('freeBody');
      actions = plansLink(true, 'upgrade');
    }
    return head + dl + (text ? '<p class="ac-plan-text">' + esc(text) + '</p>' : '') +
      '<div class="ac-plan-actions">' + actions + '</div>' +
      (info.canManage ? '<p class="ac-plan-note">' + esc(t('portalNote')) + '</p>' : '');
  }

  /* Short plan card for the overview. */
  function planCompact(user) {
    var info = planInfo(user);
    var meta = [];
    var action;
    if (info.kind === 'paid' || info.kind === 'billing_trial') {
      if (info.period) meta.push(info.period);
      if (info.currency) meta.push(info.currency);
      if (info.end) meta.push(t('renewsShort', { date: info.end }));
      if (!meta.length) meta.push(t('active'));
      action = '<a class="ac-btn ac-btn-dark" href="/account?tab=plan">' + esc(t('plan')) + '</a>';
    } else if (info.kind === 'cancel_scheduled') {
      meta.push(info.end ? t('endsShort', { date: info.end }) : t('cancelNoDate'));
      action = '<a class="ac-btn ac-btn-dark" href="/account?tab=plan">' + esc(t('plan')) + '</a>';
    } else if (info.kind === 'payment_issue') {
      meta.push(t('paymentIssueBody'));
      action = info.canManage ? portalButton('manageBilling') : plansLink(true);
    } else if (info.kind === 'auto_trial') {
      meta.push(t('trialDays', { n: info.days }));
      action = plansLink(true);
    } else {
      meta.push(t('freeBody'));
      action = plansLink(true, 'upgrade');
    }
    return '<div class="ac-plan-head"><span class="ac-plan-kicker">' + esc(t('yourPlan')) + '</span>' + statusPill(info) + '</div>' +
      '<h3 class="ac-plan-name">' + esc(planName(info)) + '</h3>' +
      '<p class="' + (info.kind === 'paid' || info.kind === 'billing_trial' || info.kind === 'cancel_scheduled' ? 'ac-plan-meta' : 'ac-plan-text') + '">' + esc(meta.join(' · ')) + '</p>' +
      '<div class="ac-plan-actions">' + action + '</div>';
  }

  function seg(group, options, current) {
    return '<div class="ac-seg" role="radiogroup" aria-label="' + esc(t(group)) + '">' + options.map(function (pair) {
      var on = pair[0] === current;
      return '<button type="button" role="radio" aria-checked="' + (on ? 'true' : 'false') + '" class="ac-seg-btn' + (on ? ' is-on' : '') +
        '" data-ac-' + group + '="' + pair[0] + '">' + esc(t(pair[1])) + '</button>';
    }).join('') + '</div>';
  }

  function row(title, desc, control, extra) {
    return '<div class="ac-row' + (extra ? ' ' + extra : '') + '"><div class="ac-row-text"><strong>' + esc(title) + '</strong>' +
      (desc ? '<span>' + esc(desc) + '</span>' : '') + '</div>' + control + '</div>';
  }

  function linkCard(href, title, desc, iconName, cls) {
    return '<a class="ac-link-card' + (cls ? ' ' + cls : '') + '" href="' + href + '">' +
      (iconName ? '<span class="ac-tile">' + icon(iconName) + '</span>' : '') +
      '<span class="ac-link-text"><strong>' + esc(title) + '</strong><span>' + esc(desc) + '</span></span>' + icon('chevron') + '</a>';
  }

  function renderGuest(node) {
    node.removeAttribute('data-ac-view');
    node.innerHTML =
      '<p class="ws-kicker">Atomurus</p>' +
      '<h1 class="ws-title">' + esc(t('guestTitle')) + '</h1>' +
      '<p class="ws-lede">' + esc(t('guestBody')) + '</p>' +
      '<p><a class="ws-btn ws-btn-primary" href="' + esc(signupHref()) + '">' + esc(t('create')) + '</a> ' +
      '<a class="ws-btn ws-btn-secondary" href="' + esc(loginHref()) + '">' + esc(t('signIn')) + '</a></p>';
  }

  function renderBody(user, tab) {
    var name = displayName(user);
    var handle = '@' + (user.username || '—');
    if (tab === 'profile') {
      return '<section class="ac-card ac-pad">' +
        '<div class="ac-card-head"><h2>' + esc(t('profile')) + '</h2><p>' + esc(t('profileLede')) + '</p></div>' +
        '<span class="ac-avatar is-md" aria-hidden="true">' + initial(user) + '</span>' +
        '<div class="ac-fields">' +
        '<div class="ac-field"><label for="ac-name">' + esc(t('displayName')) + '</label><input id="ac-name" type="text" value="' + esc(name) + '" readonly></div>' +
        '<div class="ac-field"><label for="ac-user">' + esc(t('username')) + '</label><div class="ac-input-at"><span>@</span><input id="ac-user" type="text" value="' + esc(user.username || '') + '" readonly></div></div>' +
        '</div>' +
        '<div class="ac-field"><label for="ac-email">' + esc(t('email')) + '</label><input id="ac-email" type="email" value="' + esc(user.email || '') + '" readonly class="is-locked"></div>' +
        '<div class="ac-card-foot"><span>' + esc(t('profileNote')) + '</span><a class="ac-btn" href="/contact.html">' + esc(t('contactSupport')) + '</a></div>' +
        '</section>';
    }
    if (tab === 'security') {
      var pill = '<span class="ac-pill' + (user.emailConfirmed ? '' : ' is-warn') + '">' + (user.emailConfirmed ? icon('check') : '') +
        esc(user.emailConfirmed ? t('confirmed') : t('pending')) + '</span>';
      return '<section class="ac-card ac-list">' +
        '<div class="ac-list-head"><h2>' + esc(t('security')) + '</h2></div>' +
        row(t('email'), t('emailDesc'), pill) +
        row(t('password'), t('passwordDesc'), '<a class="ac-btn" href="/forgot-password">' + esc(t('reset')) + '</a>') +
        row(t('session'), t('sessionDesc'), '<button type="button" class="ac-btn ac-btn-danger" id="ws-acc-signout" data-ac-signout>' + esc(t('signOut')) + '</button>') +
        '</section>';
    }
    if (tab === 'plan') {
      var paid = user.isPro || user.planSource === 'trial';
      return '<section class="ac-plan" id="ws-plan-card">' + planBlock(user) + '</section>' +
        '<section class="ac-card ac-pad ac-perks"><h2>' + esc(t(paid ? 'proIncludes' : 'proAdds')) + '</h2><ul>' +
        (PERKS[lang()] || PERKS.en).map(function (perk) { return '<li>' + icon('check') + esc(perk) + '</li>'; }).join('') +
        '</ul></section>';
    }
    if (tab === 'preferences' || tab === 'chemistry') {
      var dark = document.documentElement.getAttribute('data-theme') === 'dark';
      var reduced = reducedMotion();
      return '<section class="ac-card ac-list">' +
        '<div class="ac-list-head"><h2>' + esc(t('preferences')) + '</h2><p>' + esc(t('prefsLede')) + '</p></div>' +
        row(t('language'), '', seg('language', [['pt', 'Português'], ['en', 'English']], lang())) +
        row(t('theme'), '', seg('theme', [['light', 'light'], ['dark', 'dark']], dark ? 'dark' : 'light')) +
        row(t('reduced'), t('reducedDesc'), '<button type="button" role="switch" class="ac-switch" id="ws-pref-motion" aria-checked="' + (reduced ? 'true' : 'false') + '" aria-label="' + esc(t('reduced')) + '"><span></span></button>') +
        row(t('quality'), t('qualityNote'), seg('quality', [['auto', 'auto'], ['performance', 'performance'], ['balanced', 'balanced'], ['high', 'high']], qualityValue()), 'is-stack') +
        '</section>' +
        linkCard('/config', t('chemistry'), t('chemistryLong'), 'chemistry');
    }
    var confirmed = user.emailConfirmed
      ? '<span class="ac-pill is-sm">' + esc(t('confirmedShort')) + '</span>'
      : '<span class="ac-pill is-sm is-warn">' + esc(t('pendingShort')) + '</span>';
    return '<div class="ac-ov">' +
      '<section class="ac-plan is-compact" id="ws-plan-card">' + planCompact(user) + '</section>' +
      '<section class="ac-card ac-pad ac-profile-card ac-d"><span class="ac-card-kicker">' + esc(t('profile')) + '</span><dl class="ac-dl">' +
      '<div><dt>' + esc(t('displayName')) + '</dt><dd><strong>' + esc(name) + '</strong></dd></div>' +
      '<div><dt>' + esc(t('username')) + '</dt><dd class="is-mono">' + esc(handle) + '</dd></div>' +
      '<div><dt>' + esc(t('email')) + '</dt><dd><span class="ac-email">' + esc(user.email || '—') + '</span>' + confirmed + '</dd></div>' +
      '</dl><a class="ac-btn" href="/account?tab=profile">' + esc(t('viewProfile')) + '</a></section>' +
      '</div>' +
      '<div class="ac-shortcuts ac-d">' +
      '<a class="ac-shortcut" href="/account?tab=security"><strong>' + esc(t('security')) + '</strong><span>' + esc(t('securityDesc')) + '</span></a>' +
      '<a class="ac-shortcut" href="/account?tab=preferences"><strong>' + esc(t('preferences')) + '</strong><span>' + esc(t('prefsDesc')) + '</span></a>' +
      '<a class="ac-shortcut" href="/config"><strong>' + esc(t('chemistry')) + '</strong><span>' + esc(t('chemistryDesc')) + '</span></a>' +
      '</div>' +
      '<nav class="ac-menu ac-m" aria-label="' + esc(t('sections')) + '">' +
      [['profile', 'mProfile'], ['security', 'mSecurity'], ['plan', 'mPlan'], ['preferences', 'mPrefs']].map(function (pair) {
        return linkCard(tabHref(pair[0]), t(pair[0]), t(pair[1]), pair[0], 'ac-menu-row');
      }).join('') + '</nav>' +
      linkCard('/config', t('chemistry'), t('mChemistry'), '', 'ac-m') +
      '<a class="ac-btn ac-btn-block ac-m" href="/app">' + esc(t('workspace')) + '</a>' +
      '<button type="button" class="ac-btn ac-btn-block ac-btn-danger ac-m" data-ac-signout>' + esc(t('signOut')) + '</button>';
  }

  function signOut() {
    if (window.AtomurusNav && window.AtomurusNav.signOut) window.AtomurusNav.signOut();
    else if (window.AtomurusAuth && window.AtomurusAuth.logout) window.AtomurusAuth.logout();
  }

  function setTheme(next) {
    if ((document.documentElement.getAttribute('data-theme') === 'dark' ? 'dark' : 'light') === next) return;
    var footerToggle = document.querySelector('[data-rm-theme]');
    if (footerToggle) {
      footerToggle.click();
    } else {
      document.documentElement.setAttribute('data-theme', next);
      try { localStorage.setItem('atomurus-theme', next); } catch (e) {}
    }
  }

  function render(user) {
    var node = document.getElementById('ac-root') || document.getElementById('app-study');
    if (!node) return;
    if (!user) {
      renderGuest(node);
      return;
    }
    var tab = tabFromQuery();
    var navTab = tab === 'chemistry' ? 'preferences' : tab;
    var planLabel = planName(planInfo(user));
    var side = ['overview', 'profile', 'security', 'plan', 'preferences'].map(function (id) {
      var on = navTab === id;
      return '<a class="ws-account-tab ac-tab' + (on ? ' is-active' : '') + '" href="' + tabHref(id) + '"' + (on ? ' aria-current="page"' : '') + '>' +
        icon(id) + '<span>' + esc(t(id)) + '</span></a>';
    }).join('');

    node.setAttribute('data-ac-view', navTab === 'overview' ? 'overview' : 'sub');
    node.innerHTML =
      '<header class="ac-head">' +
      '<span class="ac-avatar" aria-hidden="true">' + initial(user) + '</span>' +
      '<div class="ac-id"><span class="ac-kicker">' + esc(t('title')) + '</span>' +
      '<h1 class="ws-title ac-name">' + esc(displayName(user)) + '</h1>' +
      '<span class="ac-handle"><span class="is-mono">@' + esc(user.username || '—') + '</span><span class="ac-d"> · ' + esc(planLabel) + '</span></span></div>' +
      '<a class="ac-btn ac-d" href="/app">' + esc(t('workspace')) + '</a>' +
      '</header>' +
      '<p id="ac-banner" class="ac-banner" hidden></p>' +
      '<div class="ac-layout">' +
      '<nav class="ac-side" aria-label="' + esc(t('sections')) + '">' + side +
      '<span class="ac-side-rule" aria-hidden="true"></span>' +
      '<button type="button" class="ac-tab ac-tab-out" data-ac-signout>' + icon('signOut') + '<span>' + esc(t('signOut')) + '</span></button>' +
      '</nav>' +
      '<div class="ac-content">' +
      (navTab === 'overview' ? '' :
        '<a class="ac-back ac-m" href="/account">' + icon('back') + esc(t('title')) + '</a>' +
        '<h1 class="ac-sub-title ac-m">' + esc(t(navTab)) + '</h1>') +
      renderBody(user, navTab) +
      '</div></div>';

    var portal = document.getElementById('ws-billing-portal');
    if (portal) portal.addEventListener('click', function () { openBillingPortal(portal); });
    node.querySelectorAll('[data-ac-signout]').forEach(function (btn) {
      btn.addEventListener('click', signOut);
    });
    node.querySelectorAll('[data-ac-language]').forEach(function (btn) {
      btn.addEventListener('click', function () {
        var code = btn.getAttribute('data-ac-language');
        if (code === lang() || !window.I18N) return;
        if (window.I18N.setLang) window.I18N.setLang(code);
        else window.I18N.toggle();
        render(user);
      });
    });
    node.querySelectorAll('[data-ac-theme]').forEach(function (btn) {
      btn.addEventListener('click', function () {
        setTheme(btn.getAttribute('data-ac-theme'));
        render(user);
      });
    });
    var motionBtn = document.getElementById('ws-pref-motion');
    if (motionBtn) motionBtn.addEventListener('click', function () {
      setReducedMotion(!reducedMotion());
      render(user);
    });
    node.querySelectorAll('[data-ac-quality]').forEach(function (btn) {
      btn.addEventListener('click', function () {
        setQuality(btn.getAttribute('data-ac-quality'));
        render(user);
      });
    });
  }

  function boot() {
    var auth = window.AtomurusAuth;
    var langHooked = false;
    function paint(user) {
      render(user);
      if (!langHooked && window.I18N && typeof window.I18N.onChange === 'function') {
        langHooked = true;
        window.I18N.onChange(function () { render(user); });
      }
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

  window.AtomurusAccount = { planBlock: planBlock, billingPortalMessage: billingPortalMessage };
})();
