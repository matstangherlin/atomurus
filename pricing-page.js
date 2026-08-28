(function () {
  'use strict';

  var CURRENCY_KEY = 'atomurus-pricing-currency';
  var PERIOD_KEY = 'atomurus-pricing-period';

  var COPY = {
    en: {
      title: 'From periodic table to complete chemistry problems.',
      desc: 'Atomurus Pro adds reaction solving, stoichiometry, advanced analysis and a complete study system.',
      currencyNote: 'Prices follow country and language. New accounts start with 30 days of Pro. No card is required to begin the trial.',
      statusGuest: 'public lab · free access',
      freeTag: 'Free forever',
      freeName: 'Atomurus Free',
      freeSub: 'Explore and calculate chemistry.',
      freeGroup: 'FREE CHEMISTRY LAB',
      freeFeatures: [
        'Periodic Table',
        'Element pages',
        'Trends & isotopes',
        'Chemistry calculators',
        'Atomic models',
        'Molecule viewer',
        'Explore chemistry content'
      ],
      freeCta: 'Open lab',
      popular: 'Most popular',
      proTag: 'Atomurus Pro',
      proName: 'Solve, analyze and study chemistry.',
      proSub: 'Everything in Free, plus problem solving and a personal study system',
      proStudyGroup: 'PRO STUDY SYSTEM',
      proLabGroup: 'PRO CHEMISTRY SOLVER',
      proFeatures: [
        'Everything in Free',
        'No ads',
        'Study Library',
        'Notes & tags',
        'Study Sets',
        'Flashcards',
        'Smart Review',
        'Spaced repetition',
        'Study Insights',
        'Focus Review',
        'Study progress',
        'Calculator History',
        'Advanced calculations',
        'Multi-element analysis',
        'Molecule comparison',
        'Atomic comparison',
        'Saved Lab Sessions'
      ],
      proGroups: [
        {
          title: 'PRO STUDY SYSTEM',
          items: [
            'Everything in Free',
            'No ads',
            'Study Library',
            'Notes & tags',
            'Study Sets',
            'Flashcards',
            'Smart Review',
            'Spaced repetition',
            'Study Insights',
            'Focus Review',
            'Study progress',
            'Advanced analysis',
            'Element, molecule and atomic compare',
            'Saved Lab Sessions'
          ]
        },
        {
          title: 'PRO CHEMISTRY SOLVER',
          items: [
            'Reaction balancing',
            'Stoichiometry',
            'Limiting-reagent calculations',
            'Theoretical & percent yield',
            'Empirical formula solver',
            'Molecular formula solver',
            'Solution preparation',
            'Saved solver sessions'
          ]
        }
      ],
      comingTitle: 'Coming later',
      comingItems: ['Study sheet PDF', 'Premium study tracks'],
      checkoutGuest: 'Create account',
      checkoutTrial: 'Subscribe after trial',
      checkoutFree: 'Upgrade to Pro',
      checkoutPaid: 'Your current plan',
      trialCtaGuest: 'Create account',
      workspace: 'Open workspace',
      signedIn: 'Signed in as ',
      signedInFree: 'free plan',
      signedInTrial: 'trial active',
      signedInPaid: 'pro active',
      signedInAdmin: 'admin access',
      compareTitle: 'Compare plans',
      matrixFeature: 'Feature',
      matrix: [
        ['Periodic Table', 'yes', 'yes'],
        ['Calculators', 'yes', 'yes'],
        ['Atomic models', 'yes', 'yes'],
        ['Study Library', 'no', 'yes'],
        ['Study Sets', 'no', 'yes'],
        ['Smart Review', 'no', 'yes'],
        ['Study Insights', 'no', 'yes'],
        ['Focus Review', 'no', 'yes'],
        ['Spaced repetition', 'no', 'yes'],
        ['Pro Lab', 'no', 'yes'],
        ['Chemistry Solver', 'no', 'yes'],
        ['Reaction Workbench', 'no', 'yes'],
        ['Saved Lab sessions', 'no', 'yes'],
        ['Ads', 'ads', 'noads']
      ],
      yes: 'Yes',
      no: '—',
      adsYes: 'Yes',
      adsNo: 'No',
      howTitle: 'How Smart Review works',
      steps: [
        ['01 Save', 'Save an element or molecule.'],
        ['02 Generate', 'Turn it into flashcards.'],
        ['03 Review', 'Atomurus schedules what you should review next.']
      ],
      keepFreeTitle: 'What stays free',
      keepFree: 'The periodic table, element pages, articles, calculators and viewers stay open. Billing should never become a gate in front of chemistry fundamentals.',
      geoBRL: 'Brazil pricing',
      geoUSD: 'International pricing',
      periodMonthly: 'Monthly',
      periodAnnual: 'Annual',
      asideLogin: 'Login',
      billedMonthly: 'billed monthly',
      billedAnnual: 'billed annually',
      trialBadge: '30 days of Pro on every new account',
      checkoutBusy: 'Opening secure checkout…',
      checkoutRetry: 'Could not open checkout. Try again.',
      savePercent: 'Save ~{n}%',
      currentPlan: 'Your current plan',
      trialActive: 'Your Pro trial is active. {n} days remaining.',
      monthlyAmountBRL: 'R$24,90',
      annualAmountBRL: 'R$180',
      annualEqBRL: '≈ R$15/month',
      monthlyAmountUSD: '$10',
      annualAmountUSD: '$60',
      annualEqUSD: '≈ $5/month',
      freeZeroBRL: 'R$0',
      freeZeroUSD: '$0'
    },
    pt: {
      title: 'Da tabela periódica à resolução completa de problemas de química.',
      desc: 'O Atomurus Pro adiciona resolução de reações, estequiometria, análise avançada e um sistema completo de estudos.',
      currencyNote: 'Os preços seguem país e idioma. Contas novas começam com 30 dias de Pro. Não é preciso cartão para iniciar o trial.',
      statusGuest: 'lab público · acesso gratuito',
      freeTag: 'Grátis para sempre',
      freeName: 'Atomurus Free',
      freeSub: 'Explore e calcule química.',
      freeGroup: 'FREE CHEMISTRY LAB',
      freeFeatures: [
        'Tabela periódica',
        'Páginas dos elementos',
        'Tendências e isótopos',
        'Calculadoras de química',
        'Modelos atômicos',
        'Visualizador de moléculas',
        'Conteúdo Explore de química'
      ],
      freeCta: 'Abrir lab',
      popular: 'Mais popular',
      proTag: 'Atomurus Pro',
      proName: 'Resolva, analise e estude química.',
      proSub: 'Tudo do Free, mais resolução de problemas e um sistema pessoal de estudos',
      proStudyGroup: 'PRO STUDY SYSTEM',
      proLabGroup: 'PRO CHEMISTRY SOLVER',
      proFeatures: [
        'Tudo do Free',
        'Sem anúncios',
        'Biblioteca de estudos',
        'Notas e tags',
        'Study Sets',
        'Flashcards',
        'Smart Review',
        'Repetição espaçada',
        'Insights de Estudo',
        'Focus Review',
        'Progresso de estudo',
        'Histórico de calculadoras',
        'Cálculos avançados',
        'Análise de vários elementos',
        'Comparação de moléculas',
        'Comparação atômica',
        'Sessões salvas do Lab'
      ],
      proGroups: [
        {
          title: 'PRO STUDY SYSTEM',
          items: [
            'Tudo do Free',
            'Sem anúncios',
            'Biblioteca de estudos',
            'Notas e tags',
            'Study Sets',
            'Flashcards',
            'Smart Review',
            'Repetição espaçada',
            'Insights de Estudo',
            'Focus Review',
            'Progresso de estudo',
            'Análise avançada',
            'Comparação de elementos, moléculas e átomos',
            'Sessões salvas do Lab'
          ]
        },
        {
          title: 'PRO CHEMISTRY SOLVER',
          items: [
            'Balanceamento de reações',
            'Estequiometria',
            'Cálculos de reagente limitante',
            'Rendimento teórico e percentual',
            'Solver de fórmula empírica',
            'Solver de fórmula molecular',
            'Preparação de soluções',
            'Sessões salvas do solver'
          ]
        }
      ],
      comingTitle: 'Em breve',
      comingItems: ['PDF de ficha de estudo', 'Trilhas premium de estudo'],
      checkoutGuest: 'Criar conta',
      checkoutTrial: 'Assinar após o trial',
      checkoutFree: 'Assinar o Pro',
      checkoutPaid: 'Seu plano atual',
      trialCtaGuest: 'Criar conta',
      workspace: 'Abrir workspace',
      signedIn: 'Sessão ativa: ',
      signedInFree: 'plano free',
      signedInTrial: 'trial ativo',
      signedInPaid: 'pro ativo',
      signedInAdmin: 'acesso admin',
      compareTitle: 'Compare os planos',
      matrixFeature: 'Recurso',
      matrix: [
        ['Tabela periódica', 'yes', 'yes'],
        ['Calculadoras', 'yes', 'yes'],
        ['Modelos atômicos', 'yes', 'yes'],
        ['Biblioteca de estudos', 'no', 'yes'],
        ['Study Sets', 'no', 'yes'],
        ['Smart Review', 'no', 'yes'],
        ['Insights de Estudo', 'no', 'yes'],
        ['Focus Review', 'no', 'yes'],
        ['Repetição espaçada', 'no', 'yes'],
        ['Pro Lab', 'no', 'yes'],
        ['Chemistry Solver', 'no', 'yes'],
        ['Laboratório de Reações', 'no', 'yes'],
        ['Sessões salvas do Lab', 'no', 'yes'],
        ['Anúncios', 'ads', 'noads']
      ],
      yes: 'Sim',
      no: '—',
      adsYes: 'Sim',
      adsNo: 'Não',
      howTitle: 'Como o Smart Review funciona',
      steps: [
        ['01 Salvar', 'Salve um elemento ou molécula.'],
        ['02 Gerar', 'Transforme em flashcards.'],
        ['03 Revisar', 'O Atomurus agenda o que você deve revisar a seguir.']
      ],
      keepFreeTitle: 'O que continua grátis',
      keepFree: 'A tabela periódica, as páginas dos elementos, artigos, calculadoras e visualizadores continuam abertos. Billing não deve virar uma barreira na frente dos fundamentos de química.',
      geoBRL: 'preço Brasil',
      geoUSD: 'preço internacional',
      periodMonthly: 'Mensal',
      periodAnnual: 'Anual',
      asideLogin: 'Entrar',
      billedMonthly: 'cobrado por mês',
      billedAnnual: 'cobrado por ano',
      trialBadge: '30 dias de Pro em toda conta nova',
      checkoutBusy: 'Abrindo checkout seguro…',
      checkoutRetry: 'Não foi possível abrir o checkout. Tente de novo.',
      savePercent: 'Economize ~{n}%',
      currentPlan: 'Seu plano atual',
      trialActive: 'Seu trial Pro está ativo. {n} dias restantes.',
      monthlyAmountBRL: 'R$24,90',
      annualAmountBRL: 'R$180',
      annualEqBRL: '≈ R$15/mês',
      monthlyAmountUSD: 'US$10',
      annualAmountUSD: 'US$60',
      annualEqUSD: '≈ US$5/mês',
      freeZeroBRL: 'R$0',
      freeZeroUSD: 'US$0'
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

  function interpolate(template, vars) {
    var text = String(template || '');
    Object.keys(vars || {}).forEach(function (key) {
      text = text.split('{' + key + '}').join(String(vars[key]));
    });
    return text;
  }

  function annualSavePercent(monthly, annual) {
    var month = Number(monthly);
    var year = Number(annual);
    if (!(month > 0) || !(year > 0)) return 0;
    return Math.round((1 - year / (month * 12)) * 100);
  }

  function trialDaysLeft(iso) {
    var end = Date.parse(iso);
    if (!Number.isFinite(end)) return null;
    return Math.max(0, Math.ceil((end - Date.now()) / 86400000));
  }

  function pricingData(currency) {
    var current = currency === 'brl' ? 'brl' : 'usd';
    var save = current === 'brl' ? annualSavePercent(24.9, 180) : annualSavePercent(10, 60);
    return {
      currency: current,
      geoLabel: current === 'brl' ? t('geoBRL') : t('geoUSD'),
      monthlyAmount: current === 'brl' ? t('monthlyAmountBRL') : t('monthlyAmountUSD'),
      annualAmount: current === 'brl' ? t('annualAmountBRL') : t('annualAmountUSD'),
      annualEq: current === 'brl' ? t('annualEqBRL') : t('annualEqUSD'),
      save: save
    };
  }

  function setText(id, value) {
    var node = document.getElementById(id);
    if (node) node.textContent = value;
  }

  function setList(id, items) {
    var node = document.getElementById(id);
    if (!node) return;
    node.textContent = '';
    items.forEach(function (item) {
      var li = document.createElement('li');
      li.textContent = item;
      node.appendChild(li);
    });
  }

  function setGroupedList(id, groups) {
    var node = document.getElementById(id);
    if (!node) return;
    node.textContent = '';
    (groups || []).forEach(function (group) {
      var heading = document.createElement('li');
      heading.className = 'price-group';
      heading.textContent = group.title;
      node.appendChild(heading);
      (group.items || []).forEach(function (item) {
        var li = document.createElement('li');
        li.textContent = item;
        node.appendChild(li);
      });
    });
  }

  function readStorage(key, fallback) {
    try { return localStorage.getItem(key) || fallback; } catch (_err) { return fallback; }
  }

  function writeStorage(key, value) {
    try { localStorage.setItem(key, value); } catch (_err) {}
  }

  function activeState() {
    if (window.__ATOMURUS_AUTH__ && window.__ATOMURUS_AUTH__.ready) {
      return Object.assign({}, window.__ATOMURUS_ADS__ || {}, window.__ATOMURUS_AUTH__);
    }
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

  function selectedCurrency() {
    var stored = readStorage(CURRENCY_KEY, '');
    if (stored === 'brl' || stored === 'usd') return stored;
    var pricingContext = activeState().pricingContext;
    return pricingContext && pricingContext.currency === 'brl' ? 'brl' : 'usd';
  }

  function selectedPeriod() {
    return readStorage(PERIOD_KEY, 'annual') === 'monthly' ? 'monthly' : 'annual';
  }

  function checkoutLabel(user, signedIn) {
    if (!signedIn) return t('checkoutGuest');
    if (user && (user.planSource === 'trial' || user.planSource === 'billing_trial')) return t('checkoutTrial');
    if (user && user.isPro) return t('checkoutPaid');
    return t('checkoutFree');
  }

  function cellMark(code) {
    if (code === 'yes') return t('yes');
    if (code === 'no') return t('no');
    if (code === 'ads') return t('adsYes');
    if (code === 'noads') return t('adsNo');
    return code;
  }

  function hydrateCopy(currency) {
    var pricing = pricingData(currency);
    var period = selectedPeriod();
    var state = activeState();
    var user = state.user || null;
    setText('pricing-status', state.signedIn ? (t('signedIn') + displayName(user) + ' · ' + userPlanLabel(user)) : t('statusGuest'));
    setText('pricing-currency-note', t('currencyNote'));
    setText('pricing-title-copy', t('title'));
    setText('pricing-desc-copy', t('desc'));
    setText('pricing-geo-badge', pricing.geoLabel);
    setText('pricing-free-tag', t('freeTag'));
    setText('pricing-free-name', t('freeName'));
    setText('pricing-free-amount', currency === 'brl' ? t('freeZeroBRL') : t('freeZeroUSD'));
    setText('pricing-free-sub', t('freeSub'));
    setList('pricing-free-list', t('freeFeatures'));
    setText('pricing-popular', t('popular'));
    setText('pricing-pro-tag', t('proTag'));
    setText('pricing-pro-name', t('proName'));
    setText('pricing-pro-sub', t('proSub'));
    setGroupedList('pricing-pro-list', t('proGroups'));
    setText('pricing-coming-title', t('comingTitle'));
    setList('pricing-coming-list', t('comingItems'));
    if (period === 'annual') {
      setText('pricing-pro-amount', pricing.annualAmount);
      setText('pricing-pro-meta', pricing.annualEq + ' · ' + t('billedAnnual'));
      var save = document.getElementById('pricing-save-badge');
      if (save) {
        save.hidden = false;
        save.textContent = interpolate(t('savePercent'), { n: pricing.save });
      }
    } else {
      setText('pricing-pro-amount', pricing.monthlyAmount);
      setText('pricing-pro-meta', t('billedMonthly'));
      var saveBadge = document.getElementById('pricing-save-badge');
      if (saveBadge) saveBadge.hidden = true;
    }
    setText('pricing-compare-title', t('compareTitle'));
    setText('pricing-matrix-feature', t('matrixFeature'));
    var body = document.getElementById('pricing-matrix-body');
    if (body) {
      body.textContent = '';
      t('matrix').forEach(function (row) {
        var tr = document.createElement('tr');
        row.forEach(function (cell, idx) {
          var td = document.createElement(idx === 0 ? 'th' : 'td');
          td.textContent = idx === 0 ? cell : cellMark(cell);
          tr.appendChild(td);
        });
        body.appendChild(tr);
      });
    }
    setText('pricing-how-title', t('howTitle'));
    var steps = document.getElementById('pricing-steps');
    if (steps) {
      steps.textContent = '';
      t('steps').forEach(function (step) {
        var card = document.createElement('div');
        card.className = 'price-step';
        var num = document.createElement('div');
        num.className = 'price-step-num';
        num.textContent = step[0];
        var p = document.createElement('p');
        p.textContent = step[1];
        card.appendChild(num);
        card.appendChild(p);
        steps.appendChild(card);
      });
    }
    setText('pricing-keep-free-title', t('keepFreeTitle'));
    setText('pricing-keep-free-copy', t('keepFree'));
    setText('pricing-trial-note', t('trialBadge'));
    var current = document.getElementById('pricing-current');
    if (current) {
      if (state.signedIn && user && (user.planSource === 'trial' || user.planSource === 'billing_trial')) {
        current.hidden = false;
        current.textContent = interpolate(t('trialActive'), { n: trialDaysLeft(user.trialEndsAt) || 0 });
      } else if (state.signedIn && user && user.isPro) {
        current.hidden = false;
        current.textContent = t('currentPlan');
      } else {
        current.hidden = true;
      }
    }
    syncButtons();
  }

  function syncToggleButtons() {
    var currency = selectedCurrency();
    var period = selectedPeriod();
    document.querySelectorAll('[data-currency]').forEach(function (button) {
      button.classList.toggle('active', button.getAttribute('data-currency') === currency);
    });
    document.querySelectorAll('[data-period]').forEach(function (button) {
      var label = button.getAttribute('data-period') === 'monthly' ? t('periodMonthly') : t('periodAnnual');
      if (button.textContent !== label) button.textContent = label;
      button.classList.toggle('active', button.getAttribute('data-period') === period);
    });
  }

  function syncButtons() {
    var state = activeState();
    var user = state.user || null;
    var freeCta = document.getElementById('pricing-free-cta');
    var proCta = document.getElementById('pricing-pro-cta');
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
      asideSecondary.textContent = state.signedIn ? ('→ ' + t('signedIn') + displayName(user)) : ('→ ' + t('asideLogin'));
      asideSecondary.href = state.signedIn ? '/app' : '/login';
    }
    if (proCta) {
      proCta.disabled = false;
      proCta.textContent = checkoutLabelText;
      proCta.dataset.signedIn = state.signedIn ? 'true' : 'false';
    }
    syncToggleButtons();
  }

  async function startCheckout() {
    var button = document.getElementById('pricing-pro-cta');
    var errBox = document.getElementById('pricing-checkout-err');
    if (errBox) {
      errBox.classList.remove('show');
      errBox.textContent = '';
    }
    if (!activeState().signedIn) {
      location.assign('/signup?next=' + encodeURIComponent('/pricing'));
      return;
    }
    var user = activeState().user;
    if (user && user.canManageBilling) {
      location.assign('/app?section=account');
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
          period: selectedPeriod()
        })
      });
      var data = await res.json().catch(function () { return {}; });
      if (!res.ok || !data || !data.url) throw new Error('checkout');
      location.assign(data.url);
    } catch (_err) {
      if (errBox) {
        errBox.textContent = t('checkoutRetry');
        errBox.classList.add('show');
      }
      syncButtons();
    }
  }

  function bind() {
    document.querySelectorAll('[data-currency]').forEach(function (button) {
      button.addEventListener('click', function () {
        writeStorage(CURRENCY_KEY, button.getAttribute('data-currency') === 'brl' ? 'brl' : 'usd');
        hydrateCopy(selectedCurrency());
      });
    });
    document.querySelectorAll('[data-period]').forEach(function (button) {
      button.addEventListener('click', function () {
        writeStorage(PERIOD_KEY, button.getAttribute('data-period') === 'monthly' ? 'monthly' : 'annual');
        hydrateCopy(selectedCurrency());
      });
    });
    var pro = document.getElementById('pricing-pro-cta');
    if (pro) pro.addEventListener('click', startCheckout);
  }

  function boot() {
    hydrateCopy(selectedCurrency());
    bind();
    document.addEventListener('atomurus-ads-ready', function () {
      hydrateCopy(selectedCurrency());
    });
    document.addEventListener('atomurus-auth-change', function () {
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
