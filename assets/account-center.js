/* Atomurus Account Center — /account. Not a Workspace subsection. */
(function () {
  'use strict';

  var TABS = ['overview', 'profile', 'security', 'plan', 'preferences', 'chemistry', 'data'];
  /* The server accepts either phrase (netlify/functions/account-delete.mjs). */
  var CONFIRM_PHRASES = { en: 'DELETE', pt: 'EXCLUIR' };
  /* After deletion the device-only work goes too: every key of
     src/core/storage/storage-policy.js that is not a preference (theme,
     language, consent… describe the device, not the person). Keys ending in
     '-' or ':' are prefixes. tools/test-account-delete.mjs keeps this list
     equal to the registry. */
  var LOCAL_DATA_KEYS = {
    local: ['atomurus-compare-queue', 'atomurus-lab-v1', 'atomurus-auth-sync', 'atomurus-cache:'],
    session: ['atomurus-guest-lab-views', 'atomurus-iso-tab', 'atomurus-iso-tab-', 'atomurus-iso-group']
  };
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
      data: 'My data',
      dataBody: 'Download a copy of what Atomurus keeps about your account: profile, plan status, Study Sets, cards, progress, review history and saved Lab sessions.',
      dataNotIncluded: 'Not included: payment details (kept by Stripe) and server logs.',
      exportBtn: 'Download my data (JSON)',
      exporting: 'Preparing your file…',
      exportDone: 'Download started.',
      exportError: 'The file could not be prepared right now. Try again in a few minutes.',
      exportLimited: 'You can download your data 3 times per hour. Try again later.',
      exportTooLarge: 'Your data is larger than the 5 MB online limit. Write to contato@atomurus.com and we will send it to you.',
      sessionExpired: 'Your session has expired. Sign in again.',
      deleteTitle: 'Delete account',
      deleteBody: 'Deleting the account removes it for good. This cannot be undone.',
      deleteSubscription: 'You have a subscription that will renew. Cancel it in Plan & Billing first; then you can delete the account.',
      deleteOpen: 'Delete account…',
      deleteDialogTitle: 'Delete your Atomurus account?',
      deleteWhat: 'This deletes, for good:',
      deleteItemProfile: 'your account and profile (name, username, e-mail);',
      deleteItemStudy: 'Study Sets, cards, progress and review history;',
      deleteItemLab: 'saved Lab and solver sessions;',
      deleteItemDevice: 'Lab work and caches saved on this device.',
      deleteKept: 'Payment records are kept by Stripe and are not deleted here. Theme and language on this device stay.',
      deleteExportFirst: 'Download your data first',
      deletePassword: 'Current password',
      deleteConfirmLabel: 'Type {when} to confirm',
      cancel: 'Cancel',
      deleteSubmit: 'Delete account',
      deleting: 'Deleting…',
      deleteWrongPassword: 'The password is not correct.',
      deletePhraseError: 'Type the confirmation word exactly.',
      deleteLimited: 'Too many attempts. Try again tomorrow.',
      deleteFailed: 'The account could not be deleted right now. Nothing was removed; try again later.'
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
      data: 'Meus dados',
      dataBody: 'Baixe uma cópia do que o Atomurus guarda sobre a sua conta: perfil, situação do plano, Study Sets, cartões, progresso, histórico de revisões e sessões salvas do Lab.',
      dataNotIncluded: 'Não incluídos: dados de pagamento (ficam com a Stripe) e registros do servidor.',
      exportBtn: 'Baixar meus dados (JSON)',
      exporting: 'Preparando o arquivo…',
      exportDone: 'O download começou.',
      exportError: 'Não foi possível preparar o arquivo agora. Tente de novo em alguns minutos.',
      exportLimited: 'Você pode baixar seus dados 3 vezes por hora. Tente mais tarde.',
      exportTooLarge: 'Seus dados passam do limite de 5 MB para download direto. Escreva para contato@atomurus.com e enviaremos o arquivo.',
      sessionExpired: 'Sua sessão expirou. Entre de novo.',
      deleteTitle: 'Excluir conta',
      deleteBody: 'Excluir a conta a remove de vez. Não é possível desfazer.',
      deleteSubscription: 'Você tem uma assinatura que será renovada. Cancele-a antes em Plano e cobrança; depois é possível excluir a conta.',
      deleteOpen: 'Excluir conta…',
      deleteDialogTitle: 'Excluir sua conta Atomurus?',
      deleteWhat: 'Isto apaga, de vez:',
      deleteItemProfile: 'sua conta e o perfil (nome, nome de usuário, e-mail);',
      deleteItemStudy: 'Study Sets, cartões, progresso e histórico de revisões;',
      deleteItemLab: 'sessões salvas do Lab e do solver;',
      deleteItemDevice: 'o trabalho do Lab e os caches guardados neste dispositivo.',
      deleteKept: 'Os registros de pagamento ficam com a Stripe e não são apagados aqui. Tema e idioma deste dispositivo continuam.',
      deleteExportFirst: 'Baixe seus dados antes',
      deletePassword: 'Senha atual',
      deleteConfirmLabel: 'Digite {when} para confirmar',
      cancel: 'Cancelar',
      deleteSubmit: 'Excluir conta',
      deleting: 'Excluindo…',
      deleteWrongPassword: 'A senha não está correta.',
      deletePhraseError: 'Digite a palavra de confirmação exatamente.',
      deleteLimited: 'Muitas tentativas. Tente de novo amanhã.',
      deleteFailed: 'Não foi possível excluir a conta agora. Nada foi removido; tente mais tarde.'
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

  function portalButton(labelKey) {
    return '<button type="button" class="ws-btn ws-btn-primary" id="ws-billing-portal">' + esc(t(labelKey)) + '</button>';
  }

  function planBlock(user) {
    var logic = window.AtomurusWorkspace || {};
    var state = logic.accountPlanState ? logic.accountPlanState(user) : { kind: 'free', canManage: false };
    var days = logic.trialDaysLeft ? logic.trialDaysLeft(user && user.trialEndsAt) : null;
    var end = planDate(user && user.currentPeriodEnd);
    var trialEnd = planDate(user && user.trialEndsAt);
    if (state.kind === 'auto_trial') {
      var trialText = trialEnd
        ? t('autoTrialEnds', { date: trialEnd, n: days == null ? 0 : days })
        : t('autoTrialNoDate', { n: days == null ? 0 : days });
      return '<h3>' + esc(t('trialPlan')) + '</h3><p>' + esc(trialText) + '</p>' +
        '<a class="ws-btn ws-btn-primary" href="/pricing">' + esc(t('viewPlans')) + '</a>';
    }
    if (state.kind === 'payment_issue') {
      return '<h3>' + esc(t('paymentIssue')) + '</h3><p>' + esc(t('paymentIssueBody')) + '</p>' +
        (end ? '<p>' + esc(t('renewsOn', { date: end })) + '</p>' : '') +
        (state.canManage
          ? portalButton('manageOrCancel')
          : '<a class="ws-btn ws-btn-primary" href="/pricing">' + esc(t('viewPlans')) + '</a>');
    }
    if (state.kind === 'cancel_scheduled') {
      var cancelText = end ? t('cancelUntil', { date: end }) : t('cancelNoDate');
      return '<h3>' + esc(t('proPlan')) + '</h3><p>' + esc(cancelText) + '</p>' +
        (state.canManage
          ? portalButton('reactivate')
          : '<a class="ws-btn ws-btn-primary" href="/pricing">' + esc(t('viewPlans')) + '</a>');
    }
    if (state.kind === 'paid' || state.kind === 'billing_trial') {
      return '<h3>' + esc(t('proPlan')) + '</h3>' +
        '<p>' + esc(t('active')) + '</p>' +
        (end ? '<p>' + esc(t('renewsOn', { date: end })) + '</p>' : '') +
        (state.canManage
          ? portalButton('manageOrCancel')
          : '<a class="ws-btn ws-btn-primary" href="/pricing">' + esc(t('viewPlans')) + '</a>');
    }
    return '<h3>' + esc(t('freePlan')) + '</h3><p>' + esc(t('freeBody')) + '</p>' +
      '<a class="ws-btn ws-btn-primary" href="/pricing">' + esc(t('upgrade')) + '</a>';
  }

  function phrase() {
    return CONFIRM_PHRASES[lang()] || CONFIRM_PHRASES.en;
  }

  function subscriptionWillRenew(user) {
    var logic = window.AtomurusWorkspace || {};
    var state = logic.accountPlanState ? logic.accountPlanState(user) : { kind: 'free', canManage: false };
    return Boolean(state.canManage && state.kind !== 'cancel_scheduled');
  }

  function dataBlock(user) {
    return '<section class="ws-account-card" id="ac-data"><h2>' + esc(t('data')) + '</h2>' +
      '<p>' + esc(t('dataBody')) + '</p>' +
      '<p class="ui-field-hint">' + esc(t('dataNotIncluded')) + '</p>' +
      '<p><button type="button" class="ws-btn ws-btn-primary" id="ac-export">' + esc(t('exportBtn')) + '</button></p>' +
      '<p class="ac-status" id="ac-export-status" role="status" aria-live="polite"></p></section>' +
      '<section class="ws-account-card ac-danger-zone" id="ac-delete"><h2>' + esc(t('deleteTitle')) + '</h2>' +
      '<p>' + esc(t('deleteBody')) + '</p>' +
      (subscriptionWillRenew(user)
        ? '<p class="ui-alert ui-alert-warning" id="ac-delete-subscription">' + esc(t('deleteSubscription')) +
          ' <a href="/account?tab=plan">' + esc(t('plan')) + '</a></p>'
        : '') +
      '<p><button type="button" class="ui-btn ui-btn-danger" id="ac-delete-open" aria-haspopup="dialog">' + esc(t('deleteOpen')) + '</button></p></section>';
  }

  function deleteDialog() {
    return '<div class="ui-dialog-host" id="ac-delete-host" hidden>' +
      '<div class="ui-dialog-backdrop"></div>' +
      '<div class="ui-dialog" role="dialog" aria-modal="true" aria-labelledby="ac-delete-title" aria-describedby="ac-delete-desc">' +
      '<h2 class="ui-dialog-title" id="ac-delete-title">' + esc(t('deleteDialogTitle')) + '</h2>' +
      '<div class="ui-dialog-body" id="ac-delete-desc"><p>' + esc(t('deleteWhat')) + '</p><ul class="ac-delete-list">' +
      '<li>' + esc(t('deleteItemProfile')) + '</li><li>' + esc(t('deleteItemStudy')) + '</li>' +
      '<li>' + esc(t('deleteItemLab')) + '</li><li>' + esc(t('deleteItemDevice')) + '</li></ul>' +
      '<p>' + esc(t('deleteKept')) + '</p>' +
      '<p><button type="button" class="ac-linklike" id="ac-delete-export">' + esc(t('deleteExportFirst')) + '</button></p></div>' +
      '<form class="ac-delete-form" id="ac-delete-form" novalidate>' +
      '<div class="ui-field"><label class="ui-label" for="ac-delete-password">' + esc(t('deletePassword')) + '</label>' +
      '<input class="ui-input" type="password" id="ac-delete-password" name="password" autocomplete="current-password" required></div>' +
      '<div class="ui-field"><label class="ui-label" for="ac-delete-confirm">' + esc(t('deleteConfirmLabel', { when: phrase() })) + '</label>' +
      '<input class="ui-input" type="text" id="ac-delete-confirm" name="confirm" autocomplete="off" autocapitalize="characters" spellcheck="false" required></div>' +
      '<p class="ui-field-error" id="ac-delete-error" role="alert" hidden></p>' +
      '<div class="ui-dialog-actions">' +
      '<button type="button" class="ui-btn ui-btn-ghost" id="ac-delete-cancel">' + esc(t('cancel')) + '</button>' +
      '<button type="submit" class="ui-btn ui-btn-danger" id="ac-delete-submit" disabled>' + esc(t('deleteSubmit')) + '</button>' +
      '</div></form></div></div>';
  }

  function fileNameFrom(res) {
    var header = (res.headers && res.headers.get('content-disposition')) || '';
    var match = /filename="([^"]+)"/.exec(header);
    return match ? match[1] : 'atomurus-dados.json';
  }

  function exportMessage(status) {
    if (status === 401) return t('sessionExpired');
    if (status === 429) return t('exportLimited');
    if (status === 413) return t('exportTooLarge');
    return t('exportError');
  }

  function downloadData(button, statusNode) {
    if (button.disabled) return Promise.resolve();
    button.disabled = true;
    button.setAttribute('aria-busy', 'true');
    statusNode.className = 'ac-status';
    statusNode.textContent = t('exporting');
    return fetch('/api/account/export', { credentials: 'include', headers: { Accept: 'application/json' } })
      .then(function (res) {
        if (!res.ok) {
          var err = new Error('export');
          err.status = res.status;
          throw err;
        }
        var name = fileNameFrom(res);
        return res.blob().then(function (blob) {
          var url = URL.createObjectURL(blob);
          var link = document.createElement('a');
          link.href = url;
          link.download = name;
          link.hidden = true;
          document.body.appendChild(link);
          link.click();
          link.remove();
          setTimeout(function () { URL.revokeObjectURL(url); }, 1000);
          statusNode.textContent = t('exportDone');
        });
      })
      .catch(function (err) {
        statusNode.className = 'ac-status is-error';
        statusNode.textContent = exportMessage(err && err.status);
      })
      .then(function () {
        button.disabled = false;
        button.removeAttribute('aria-busy');
      });
  }

  function clearLocalData() {
    [['local', 'localStorage'], ['session', 'sessionStorage']].forEach(function (pair) {
      var store;
      try { store = window[pair[1]]; } catch (e) { return; }
      if (!store) return;
      var names = LOCAL_DATA_KEYS[pair[0]];
      var doomed = [];
      for (var i = 0; i < store.length; i += 1) {
        var key = store.key(i);
        if (!key) continue;
        var hit = names.some(function (name) {
          var prefix = /[-:]$/.test(name);
          return prefix ? key.indexOf(name) === 0 : key === name;
        });
        if (hit) doomed.push(key);
      }
      doomed.forEach(function (key) { try { store.removeItem(key); } catch (e) {} });
    });
  }

  function deleteMessage(status, code) {
    if (status === 401 && code === 'reauth_failed') return t('deleteWrongPassword');
    if (status === 401) return t('sessionExpired');
    if (status === 409) return t('deleteSubscription');
    if (status === 429) return t('deleteLimited');
    if (status === 400 && code === 'confirm_phrase') return t('deletePhraseError');
    return t('deleteFailed');
  }

  function bindDeleteDialog(opener) {
    var host = document.getElementById('ac-delete-host');
    if (!host || !opener) return;
    var dialog = host.querySelector('.ui-dialog');
    var form = document.getElementById('ac-delete-form');
    var password = document.getElementById('ac-delete-password');
    var confirm = document.getElementById('ac-delete-confirm');
    var submit = document.getElementById('ac-delete-submit');
    var error = document.getElementById('ac-delete-error');
    var busy = false;

    function valid() {
      return Boolean(password.value) && confirm.value.trim() === phrase();
    }
    function update() {
      submit.disabled = busy || !valid();
    }
    function close() {
      if (busy) return;
      host.classList.remove('is-open');
      host.hidden = true;
      document.body.classList.remove('ui-dialog-open');
      password.value = '';
      confirm.value = '';
      error.hidden = true;
      update();
      opener.focus();
    }
    function open() {
      host.hidden = false;
      host.classList.add('is-open');
      document.body.classList.add('ui-dialog-open');
      password.focus();
    }
    function fail(message) {
      error.textContent = message;
      error.hidden = false;
    }

    opener.addEventListener('click', open);
    document.getElementById('ac-delete-cancel').addEventListener('click', close);
    host.addEventListener('click', function (event) {
      if (event.target.classList.contains('ui-dialog-backdrop')) close();
    });
    host.addEventListener('keydown', function (event) {
      if (event.key === 'Escape') {
        event.preventDefault();
        close();
        return;
      }
      if (event.key !== 'Tab') return;
      var items = Array.prototype.filter.call(dialog.querySelectorAll('button, [href], input'), function (el) { return !el.disabled; });
      if (!items.length) return;
      var first = items[0];
      var last = items[items.length - 1];
      if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus(); }
      else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus(); }
    });
    password.addEventListener('input', update);
    confirm.addEventListener('input', update);
    document.getElementById('ac-delete-export').addEventListener('click', function () {
      var button = document.getElementById('ac-export');
      var status = document.getElementById('ac-export-status');
      if (button && status) downloadData(button, status);
    });

    form.addEventListener('submit', function (event) {
      event.preventDefault();
      if (busy || !valid()) return;
      busy = true;
      update();
      error.hidden = true;
      submit.textContent = t('deleting');
      fetch('/api/account/delete', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
        body: JSON.stringify({ password: password.value, confirm: confirm.value.trim() })
      }).then(function (res) {
        return res.json().catch(function () { return {}; }).then(function (data) {
          if (!res.ok || !data || data.ok !== true) {
            var err = new Error('delete');
            err.status = res.status;
            err.code = data && data.code;
            throw err;
          }
        });
      }).then(function () {
        password.value = '';
        var signOut = window.AtomurusAuth && typeof window.AtomurusAuth.logout === 'function'
          ? Promise.resolve(window.AtomurusAuth.logout()).catch(function () {})
          : Promise.resolve();
        return signOut.then(function () {
          clearLocalData();
          location.replace('/?notice=account-deleted');
        });
      }).catch(function (err) {
        busy = false;
        submit.textContent = t('deleteSubmit');
        password.value = '';
        update();
        fail(deleteMessage(err && err.status, err && err.code));
        password.focus();
      });
    });
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
    } else if (tab === 'data') {
      body = dataBlock(user);
    } else {
      body = '<section class="ws-account-card"><h2>' + esc(displayName(user)) + '</h2>' +
        '<p>@' + esc(user.username || '—') + '</p><p>' + esc(user.email || '—') + '</p></section>' +
        '<section class="ws-account-card" id="ws-plan-card">' + planBlock(user) + '</section>' +
        '<nav class="ws-account-dests">' +
        '<a href="/account?tab=profile">' + esc(t('profile')) + '</a>' +
        '<a href="/account?tab=security">' + esc(t('security')) + '</a>' +
        '<a href="/account?tab=plan">' + esc(t('plan')) + '</a>' +
        '<a href="/account?tab=preferences">' + esc(t('preferences')) + '</a>' +
        '<a href="/account?tab=chemistry">' + esc(t('chemistry')) + '</a>' +
        '<a href="/account?tab=data">' + esc(t('data')) + '</a></nav>' +
        '<p><a class="ws-btn ws-btn-secondary" href="/app">' + esc(t('workspace')) + '</a></p>';
    }

    node.innerHTML =
      '<p class="ws-kicker">Atomurus</p>' +
      '<h1 class="ws-title">' + esc(t('title')) + '</h1>' +
      '<p class="ws-lede">' + esc(t('lede')) + '</p>' +
      '<p id="ac-banner" class="ws-lede" hidden></p>' +
      '<div class="ws-account-tabs" role="tablist">' + tabs + '</div>' + body;

    var oldHost = document.getElementById('ac-delete-host');
    if (oldHost) oldHost.remove();
    if (tab === 'data') {
      document.body.insertAdjacentHTML('beforeend', deleteDialog());
      var exportBtn = document.getElementById('ac-export');
      var exportStatus = document.getElementById('ac-export-status');
      if (exportBtn) exportBtn.addEventListener('click', function () { downloadData(exportBtn, exportStatus); });
      bindDeleteDialog(document.getElementById('ac-delete-open'));
    }

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

  window.AtomurusAccount = {
    planBlock: planBlock,
    billingPortalMessage: billingPortalMessage,
    clearLocalData: clearLocalData,
    LOCAL_DATA_KEYS: LOCAL_DATA_KEYS,
    CONFIRM_PHRASES: CONFIRM_PHRASES,
    COPY: COPY
  };
})();
