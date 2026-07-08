(function () {
  'use strict';

  var CURRENCY_KEY = 'atomurus-pricing-currency';
  var PERIOD_KEY = 'atomurus-pricing-period';

  var COPY = {
    en: {
      title: 'Start with 30 days of Pro free, then upgrade when you are ready.',
      desc: 'Every new Atomurus account gets 1 month of Pro at no cost — ad-free workspace, saved progress and richer study tools. After that, keep studying on Free or subscribe monthly or annually in BRL or USD.',
      currencyNote: 'Prices are auto-selected by country and language. New accounts always start with 30 days of Pro free.',
      statusGuest: 'public lab · free access',
      freeTag: 'Free forever',
      freeName: 'Free',
      freeSub: 'open chemistry reference · ads supported',
      freeFeatures: [
        'Periodic table and 118 element pages',
        '3D models, molecules, allotropes and isomerism',
        'Core calculators and Explore articles',
        'No account required for the public lab'
      ],
      freeCta: 'Open lab',
      monthlyTag: 'Pro monthly · 30-day trial',
      monthlyName: 'Pro Monthly',
      monthlySub: '1 month free on new accounts · cancel anytime',
      annualTag: 'Best value · 30-day trial',
      annualName: 'Pro Annual',
      annualSub: '1 month free on new accounts · billed yearly',
      proFeatures: [
        'Ad-free workspace across the site',
        'Favorites, history and saved study flow',
        'PDF/export tools and richer study materials',
        'Flashcards, exercises, guided tracks and AI tutor rollout'
      ],
      checkoutGuest: 'Start 30-day free trial',
      checkoutTrial: 'Subscribe · billing after trial',
      checkoutFree: 'Upgrade in Stripe',
      checkoutPaid: 'Change plan in Stripe',
      trialCtaGuest: 'Start 30-day free trial',
      workspace: 'Open workspace',
      signedIn: 'Signed in as ',
      signedInFree: 'free plan',
      signedInTrial: 'trial active',
      signedInPaid: 'pro active',
      signedInAdmin: 'admin access',
      compareTitle: 'Why Pro exists',
      compare: [
        '<strong>30 days of Pro free.</strong> Create an account and the first month runs as Pro automatically — no card required to start.',
        '<strong>Free stays generous.</strong> The periodic table, element encyclopedia, articles, calculators and basic visualization stay public.',
        '<strong>Pro sells convenience.</strong> Remove distractions, keep your study context, export clean material and return to a workspace that remembers you.',
        '<strong>Pro also sells depth.</strong> Guided paths, question banks, flashcards and tutor workflows are easier to build when your account carries progress.'
      ],
      keepFreeTitle: 'What stays free',
      keepFree: 'Atomurus will keep the SEO and classroom-facing surfaces open: periodic table, element pages, articles, basic calculators and simple simulations. Billing should never become a gate in front of chemistry fundamentals.',
      nextTitle: 'What Pro is building toward',
      next: [
        'A calmer study workspace with no ads or detours',
        'Saved labs, favorites and project continuity',
        'Advanced simulations, larger molecular library and richer exports',
        'Teacher/student flows and guided chemistry learning paths'
      ],
      annualBadge: '2 months free equivalent',
      geoBRL: 'Brazil pricing',
      geoUSD: 'International pricing',
      periodMonthly: 'Monthly',
      periodAnnual: 'Annual',
      billedMonthly: 'billed monthly',
      billedAnnual: 'billed annually',
      trialBadge: '1 month of Pro free on every new account',
      checkoutBusy: 'Opening Stripe...'
    },
    pt: {
      title: 'Comece com 30 dias de Pro grátis e faça upgrade quando quiser.',
      desc: 'Toda conta nova no Atomurus ganha 1 mês de Pro sem custo — workspace sem anúncios, progresso salvo e ferramentas de estudo mais ricas. Depois disso, continue no Free ou assine mensal ou anual em BRL ou USD.',
      currencyNote: 'Os preços são escolhidos por país e idioma. Contas novas sempre começam com 30 dias de Pro grátis.',
      statusGuest: 'lab público · acesso gratuito',
      freeTag: 'Grátis para sempre',
      freeName: 'Free',
      freeSub: 'referência de química aberta · com anúncios',
      freeFeatures: [
        'Tabela periódica e 118 páginas de elementos',
        'Modelos 3D, moléculas, alótropos e isomeria',
        'Calculadoras essenciais e artigos Explore',
        'Sem conta obrigatória para o lab público'
      ],
      freeCta: 'Abrir lab',
      monthlyTag: 'Pro mensal · 30 dias grátis',
      monthlyName: 'Pro Mensal',
      monthlySub: '1 mês grátis em contas novas · cancele quando quiser',
      annualTag: 'Melhor valor · 30 dias grátis',
      annualName: 'Pro Anual',
      annualSub: '1 mês grátis em contas novas · cobrado no ano',
      proFeatures: [
        'Workspace sem anúncios em todo o site',
        'Favoritos, histórico e continuidade de estudo',
        'Ferramentas de PDF/export e material de estudo mais rico',
        'Flashcards, exercícios, trilhas guiadas e tutor de IA em rollout'
      ],
      checkoutGuest: 'Comece 30 dias grátis',
      checkoutTrial: 'Assinar · cobrança após o trial',
      checkoutFree: 'Fazer upgrade no Stripe',
      checkoutPaid: 'Trocar plano no Stripe',
      trialCtaGuest: 'Comece 30 dias grátis',
      workspace: 'Abrir workspace',
      signedIn: 'Sessão ativa: ',
      signedInFree: 'plano free',
      signedInTrial: 'trial ativo',
      signedInPaid: 'pro ativo',
      signedInAdmin: 'acesso admin',
      compareTitle: 'Por que o Pro existe',
      compare: [
        '<strong>30 dias de Pro grátis.</strong> Crie uma conta e o primeiro mês já roda como Pro automaticamente — sem cartão para começar.',
        '<strong>O Free continua generoso.</strong> Tabela periódica, enciclopédia dos elementos, artigos, calculadoras e visualizações básicas continuam públicas.',
        '<strong>O Pro vende conveniência.</strong> Remove distrações, preserva seu contexto de estudo, exporta material limpo e devolve você a um workspace que lembra de você.',
        '<strong>O Pro também vende profundidade.</strong> Trilhas guiadas, bancos de questões, flashcards e fluxos com tutor ficam melhores quando sua conta carrega progresso.'
      ],
      keepFreeTitle: 'O que continua grátis',
      keepFree: 'O Atomurus vai manter abertas as superfícies de SEO e de sala de aula: tabela periódica, páginas dos elementos, artigos, calculadoras básicas e simulações simples. Billing não deve virar uma barreira na frente dos fundamentos de química.',
      nextTitle: 'Para onde o Pro está indo',
      next: [
        'Um workspace de estudo mais calmo, sem anúncios nem desvios',
        'Labs salvos, favoritos e continuidade de projeto',
        'Simulações avançadas, biblioteca molecular maior e exportações mais ricas',
        'Fluxos professor/aluno e trilhas guiadas de aprendizado em química'
      ],
      annualBadge: 'equivale a 2 meses grátis',
      geoBRL: 'preço Brasil',
      geoUSD: 'preço internacional',
      periodMonthly: 'Mensal',
      periodAnnual: 'Anual',
      billedMonthly: 'cobrado por mês',
      billedAnnual: 'cobrado por ano',
      trialBadge: '1 mês de Pro grátis em toda conta nova',
      checkoutBusy: 'Abrindo Stripe...'
    }
  };

  function lang() {
    if (window.I18N && (window.I18N.lang === 'pt' || window.I18N.lang === 'en')) return window.I18N.lang;
    return (document.documentElement.lang || '').toLowerCase().indexOf('pt') === 0 ? 'pt' : 'en';
  }

  function t(key) {
    var dict = COPY[lang()] || COPY.en;
    return dict[key];
  }

  function pricingData(currency) {
    var source = window.__ATOMURUS_ADS__ && window.__ATOMURUS_ADS__.pricingContext;
    var current = currency || (source && source.currency) || 'usd';
    current = current === 'brl' ? 'brl' : 'usd';
    return {
      currency: current,
      geoLabel: current === 'brl' ? t('geoBRL') : t('geoUSD'),
      monthly: current === 'brl'
        ? { amount: 'R$24,90', meta: t('billedMonthly'), badge: null }
        : { amount: 'US$10', meta: t('billedMonthly'), badge: null },
      annual: current === 'brl'
        ? { amount: 'R$180', meta: 'R$15/mês · ' + t('billedAnnual'), badge: t('annualBadge') }
        : { amount: 'US$60', meta: 'US$5/month · ' + t('billedAnnual'), badge: t('annualBadge') }
    };
  }

  function setText(id, value) {
    var node = document.getElementById(id);
    if (node) node.textContent = value;
  }

  function setHtml(id, value) {
    var node = document.getElementById(id);
    if (node) node.innerHTML = value;
  }

  function setList(id, items, html) {
    var node = document.getElementById(id);
    if (!node) return;
    node.innerHTML = items.map(function (item) {
      return '<li>' + (html ? item : escapeHtml(item)) + '</li>';
    }).join('');
  }

  function escapeHtml(value) {
    return String(value == null ? '' : value)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  function readStorage(key, fallback) {
    try {
      return localStorage.getItem(key) || fallback;
    } catch (_err) {
      return fallback;
    }
  }

  function writeStorage(key, value) {
    try { localStorage.setItem(key, value); } catch (_err) {}
  }

  function activeState() {
    return window.__ATOMURUS_ADS__ || { ready: false, signedIn: false, user: null, pricingContext: null };
  }

  function userPlanLabel(user) {
    if (!user) return t('statusGuest');
    if (user.plan === 'admin') return t('signedInAdmin');
    if (user.planSource === 'trial' || user.planSource === 'billing_trial') return t('signedInTrial');
    if (user.isPro) return t('signedInPaid');
    return t('signedInFree');
  }

  function displayName(user) {
    return user && (user.displayName || user.fullName || user.username || user.email) || 'Workspace';
  }

  function hydrateCopy(currency) {
    var pricing = pricingData(currency);
    setText('pricing-status', activeState().signedIn ? (t('signedIn') + displayName(activeState().user) + ' · ' + userPlanLabel(activeState().user)) : t('statusGuest'));
    setText('pricing-currency-note', t('currencyNote'));
    setText('pricing-title-copy', t('title'));
    setText('pricing-desc-copy', t('desc'));
    setText('pricing-geo-badge', pricing.geoLabel);
    setText('pricing-free-tag', t('freeTag'));
    setText('pricing-free-name', t('freeName'));
    setText('pricing-free-sub', t('freeSub'));
    setList('pricing-free-list', t('freeFeatures'));
    setText('pricing-monthly-tag', t('monthlyTag'));
    setText('pricing-monthly-name', t('monthlyName'));
    setText('pricing-monthly-amount', pricing.monthly.amount);
    setText('pricing-monthly-sub', t('monthlySub'));
    setText('pricing-monthly-meta', pricing.monthly.meta);
    setList('pricing-pro-monthly-list', t('proFeatures'));
    setText('pricing-annual-tag', t('annualTag'));
    setText('pricing-annual-name', t('annualName'));
    setText('pricing-annual-amount', pricing.annual.amount);
    setText('pricing-annual-sub', t('annualSub'));
    setText('pricing-annual-meta', pricing.annual.meta);
    setText('pricing-annual-badge', pricing.annual.badge);
    setList('pricing-pro-annual-list', t('proFeatures'));
    setText('pricing-compare-title', t('compareTitle'));
    setList('pricing-compare-list', t('compare'), true);
    setText('pricing-keep-free-title', t('keepFreeTitle'));
    setText('pricing-keep-free-copy', t('keepFree'));
    setText('pricing-next-title', t('nextTitle'));
    setList('pricing-next-list', t('next'));
    setText('pricing-trial-note', t('trialBadge'));
    syncButtons();
  }

  function selectedCurrency() {
    var stored = readStorage(CURRENCY_KEY, '');
    if (stored === 'brl' || stored === 'usd') return stored;
    var pricingContext = activeState().pricingContext;
    return pricingContext && pricingContext.currency === 'brl' ? 'brl' : 'usd';
  }

  function selectedPeriod() {
    return readStorage(PERIOD_KEY, 'annual') === 'monthly' ? 'monthly' : 'annual';
  }

  function syncToggleButtons() {
    var currency = selectedCurrency();
    var period = selectedPeriod();
    document.querySelectorAll('[data-currency]').forEach(function (button) {
      button.classList.toggle('active', button.getAttribute('data-currency') === currency);
    });
    document.querySelectorAll('[data-period]').forEach(function (button) {
      button.classList.toggle('active', button.getAttribute('data-period') === period);
    });
  }

  function checkoutLabel(user, signedIn) {
    if (!signedIn) return t('checkoutGuest');
    if (user && (user.planSource === 'trial' || user.planSource === 'billing_trial')) {
      return t('checkoutTrial');
    }
    if (user && user.isPro) return t('checkoutPaid');
    return t('checkoutFree');
  }

  function syncButtons() {
    var state = activeState();
    var user = state.user || null;
    var freeCta = document.getElementById('pricing-free-cta');
    var monthlyCta = document.getElementById('pricing-monthly-cta');
    var annualCta = document.getElementById('pricing-annual-cta');
    var workspace = document.getElementById('pricing-workspace-link');
    var asidePrimary = document.getElementById('pricing-create-account-link');
    var asideSecondary = document.getElementById('pricing-login-link');
    var checkoutLabelText = checkoutLabel(user, state.signedIn);

    if (freeCta) freeCta.textContent = t('freeCta');
    if (workspace) {
      workspace.textContent = state.signedIn ? (t('workspace') + ' · ' + displayName(user)) : t('workspace');
      workspace.href = state.signedIn ? '/app' : '/login';
    }
    if (asidePrimary) {
      asidePrimary.textContent = state.signedIn ? ('→ ' + t('workspace')) : ('→ ' + t('trialCtaGuest'));
      asidePrimary.href = state.signedIn ? '/app' : '/signup';
    }
    if (asideSecondary) {
      asideSecondary.textContent = state.signedIn ? ('→ ' + t('signedIn') + displayName(user)) : '→ Login';
      asideSecondary.href = state.signedIn ? '/app' : '/login';
    }
    [monthlyCta, annualCta].forEach(function (button) {
      if (!button) return;
      button.textContent = checkoutLabelText;
      button.dataset.signedIn = state.signedIn ? 'true' : 'false';
    });
    syncToggleButtons();
  }

  async function startCheckout(period) {
    var button = document.getElementById(period === 'annual' ? 'pricing-annual-cta' : 'pricing-monthly-cta');
    if (!activeState().signedIn) {
      location.assign('/signup');
      return;
    }
    if (button) {
      button.disabled = true;
      button.textContent = t('checkoutBusy');
    }
    try {
      var res = await fetch('/api/billing/checkout', {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify({
          currency: selectedCurrency(),
          period: period
        })
      });
      var data = await res.json().catch(function () { return {}; });
      if (!res.ok || !data || !data.url) throw new Error((data && data.error) || 'Checkout failed');
      location.assign(data.url);
    } catch (err) {
      alert(err.message || 'Checkout failed');
      syncButtons();
    }
  }

  function bind() {
    document.querySelectorAll('[data-currency]').forEach(function (button) {
      button.addEventListener('click', function () {
        var currency = button.getAttribute('data-currency') === 'brl' ? 'brl' : 'usd';
        writeStorage(CURRENCY_KEY, currency);
        hydrateCopy(currency);
      });
    });
    document.querySelectorAll('[data-period]').forEach(function (button) {
      button.addEventListener('click', function () {
        writeStorage(PERIOD_KEY, button.getAttribute('data-period') === 'monthly' ? 'monthly' : 'annual');
        syncToggleButtons();
      });
    });
    var monthly = document.getElementById('pricing-monthly-cta');
    var annual = document.getElementById('pricing-annual-cta');
    if (monthly) monthly.addEventListener('click', function () { startCheckout('monthly'); });
    if (annual) annual.addEventListener('click', function () { startCheckout('annual'); });
  }

  function boot() {
    hydrateCopy(selectedCurrency());
    bind();
    document.addEventListener('atomurus-ads-ready', function () {
      hydrateCopy(selectedCurrency());
    });
    if (window.I18N && typeof window.I18N.onChange === 'function') {
      window.I18N.onChange(function () {
        hydrateCopy(selectedCurrency());
      });
    }
  }

  document.addEventListener('DOMContentLoaded', boot);
})();
