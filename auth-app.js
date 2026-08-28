(function () {
  'use strict';

  var WS = window.AtomurusWorkspace || {};
  var UI = window.AtomurusWorkspaceUI || {};

  var FB = {
    en: {
      overview: 'Overview', library: 'Library', sets: 'Study Sets', review: 'Smart Review',
      history: 'Calculator History', notes: 'Notes', progress: 'Continue Studying',
      account: 'Account', plan: 'Plan', logout: 'Logout', upgrade: 'Upgrade to Pro',
      menu: 'Menu', workspaceTag: 'study workspace',
      greetingMorning: 'Good morning, {name}', greetingAfternoon: 'Good afternoon, {name}',
      greetingEvening: 'Good evening, {name}', greetingFallback: 'Ready for your next study session?',
      dueHeroTitle: '{n} cards ready for review', dueHeroCopy: 'Keep your memory fresh with a quick session.',
      startReview: 'Start Smart Review', caughtUpTitle: "You're caught up.",
      caughtUpCopy: 'No cards are due right now.', openSets: 'Open Study Sets',
      dueToday: 'Due today', metricSets: 'Study Sets', metricCards: 'Flashcards', mastered: 'Mastered',
      continueTitle: 'Continue studying', recentSaved: 'Recently saved',
      complete: '{n}% complete', continueCta: 'Continue',
      libraryTitle: 'Study Library', libraryLede: 'Your saved chemistry material.',
      search: 'Search', type: 'Type', tag: 'Tag', sort: 'Sort',
      all: 'All', elements: 'Elements', molecules: 'Molecules', articles: 'Articles',
      open: 'Open', addToSet: 'Add to Set', generate: 'Generate Cards', more: 'More',
      emptyLibraryTitle: 'Your Library is empty.', emptyLibraryBody: 'Save an element, molecule or article to find it here.',
      exploreTable: 'Explore Periodic Table',
      setsTitle: 'Study Sets', setsLede: 'Group materials into focused collections.',
      newSet: '+ New Study Set', setName: 'Name', setDesc: 'Description', cancel: 'Cancel',
      createSet: 'Create Study Set', creating: 'Creating…', saving: 'Saving…', generating: 'Generating…',
      emptySetsTitle: 'No Study Sets yet', emptySetsBody: 'Group elements, molecules and notes into focused study collections.',
      firstSet: 'Create your first Study Set', study: 'Study',
      cardsCount: '{n} cards', dueCount: '{n} due', masteredPct: '{n}% mastered', lastUpdated: 'Updated {when}',
      startReviewSet: 'Start Review', addCard: 'Add Card', materials: 'Materials', flashcards: 'Flashcards',
      emptySetItems: 'Add saved library items to this set.', emptyCards: 'No flashcards yet.',
      front: 'Front', back: 'Back', saveCard: 'Save flashcard', edit: 'Edit', suspend: 'Suspend',
      resume: 'Resume', delete: 'Delete', dueWhen: 'Due {when}',
      genCreated: '{n} flashcards created', genNone: 'No new cards were needed. These flashcards already exist in this Study Set.',
      genEmpty: 'Add an element or molecule first, then generate cards.',
      deleteSetTitle: 'Delete “{title}”?', deleteSetBody: 'Its flashcards will be deleted. Your saved Library items will not be removed.',
      deleteSet: 'Delete Study Set', deleteCardTitle: 'Delete this flashcard?', deleteCardBody: 'This cannot be undone.',
      deleteCard: 'Delete flashcard', deleteItemTitle: 'Remove saved item?', deleteItemBody: 'This removes it from your Library. Study Sets keep their own copies of generated cards.',
      remove: 'Remove',
      reviewTitle: 'Smart Review', reviewReady: '{n} cards are ready.', reviewEstimate: 'Estimated session: ~{n} minutes',
      reviewSeconds: '~20 seconds/card', startReviewCta: 'Start review',
      showAnswer: 'Show answer', again: 'Again', hard: 'Hard', good: 'Good', easy: 'Easy',
      reviewHint: 'Space reveal · 1 Again · 2 Hard · 3 Good · 4 Easy',
      reviewOf: '{a} / {b}', reviewComplete: 'Review complete', reviewed: '{n} cards reviewed',
      backOverview: 'Back to Overview', tryAgain: 'Try again',
      saveReviewErrTitle: "We couldn't save this review.", saveReviewErrBody: 'Your answer was not lost.',
      emptyReviewTitle: 'No cards due right now.', emptyReviewBody: 'Generate flashcards in a Study Set, then come back.',
      historyTitle: 'Calculator History', historyLede: 'Your saved calculations.',
      emptyHistoryTitle: 'No saved calculations yet.', emptyHistoryBody: 'Use a calculator and save a result.',
      openCalc: 'Open calculator', openCalculators: 'Open Calculators',
      notesTitle: 'Notes', notesLede: 'Material you annotated in your Library.',
      emptyNotesTitle: 'No notes yet.', emptyNotesBody: 'Open a saved item and add a short note.',
      edited: 'Edited {when}', openMaterial: 'Open material',
      progressTitle: 'Continue Studying', progressLede: 'Pick up where you left off.',
      emptyProgressTitle: 'Nothing in progress yet.', emptyProgressBody: 'Open an article or model to start a trail.',
      accountTitle: 'Account', profile: 'Profile', email: 'Email', username: 'Username',
      security: 'Security', billing: 'Billing', trial: 'Trial',
      emailConfirmed: 'Email confirmed', emailPending: 'Email pending confirmation',
      proActive: 'Active', adsOff: 'Ads off', cloudOn: 'Study Cloud unlocked', reviewOn: 'Smart Review unlocked',
      managePlan: 'Manage subscription', viewPlans: 'View plans',
      freePlan: 'Atomurus Free', freePlanBody: 'Public chemistry tools',
      trialPlan: 'Pro Trial', trialDays: '{n} days remaining',
      proPlan: 'Atomurus Pro', annual: 'Annual', monthly: 'Monthly',
      loading: 'Loading workspace…', loadError: 'Could not load your private workspace.',
      retry: 'Retry', loadMore: 'Load more', previous: 'Previous', next: 'Next',
      lockedLibraryTitle: 'Study Library', lockedLibraryBody: 'Save materials, notes and study progress across devices.',
      lockedSetsTitle: 'Study Sets', lockedSetsBody: 'Group saved chemistry into focused collections and generate flashcards.',
      lockedReviewTitle: 'Smart Review', lockedReviewBody: 'Automatically schedule flashcards based on how well you remember them.',
      lockedHistoryTitle: 'Calculator History', lockedHistoryBody: 'Keep validated calculator runs and reopen them later.',
      lockedNotesTitle: 'Notes', lockedNotesBody: 'Annotate saved elements, molecules and articles.',
      lockedProgressTitle: 'Continue Studying', lockedProgressBody: 'Resume incomplete lessons and articles from any device.',
      premium: 'Premium', pro: 'PRO',
      errSessionTitle: 'Your session expired.', errSessionBody: 'Sign in again to continue.',
      errLockedTitle: 'This is an Atomurus Pro feature.', errLockedBody: 'Upgrade to unlock your saved study workspace.',
      errNetworkTitle: "We couldn't connect to Atomurus.", errNetworkBody: 'Check your connection and try again.',
      errServerTitle: 'Something went wrong.', errServerBody: 'Please try again in a moment.',
      errGenericTitle: 'Could not complete this action.', errGenericBody: 'Try again.',
      errQuotaTitle: 'You reached a Pro limit.', errQuotaBody: 'Delete unused sets or cards, then try again.',
      errConflictTitle: 'This card was already reviewed.', errConflictBody: 'We moved you to the next card.',
      toastSaved: 'Saved to Library', toastAdded: 'Added to Study Set', toastSet: 'Study Set created',
      toastNote: 'Note updated', toastSuspended: 'Card suspended', toastDeleted: 'Deleted',
      sortUpdated: 'Recently updated', sortTitle: 'Title', member: 'member',
      signInAgain: 'Sign in'
    },
    pt: {
      overview: 'Visão geral', library: 'Biblioteca', sets: 'Study Sets', review: 'Smart Review',
      history: 'Histórico', notes: 'Notas', progress: 'Continuar estudando',
      account: 'Conta', plan: 'Plano', logout: 'Sair', upgrade: 'Assinar o Pro',
      menu: 'Menu', workspaceTag: 'workspace de estudo',
      greetingMorning: 'Bom dia, {name}', greetingAfternoon: 'Boa tarde, {name}',
      greetingEvening: 'Boa noite, {name}', greetingFallback: 'Pronto para a próxima sessão?',
      dueHeroTitle: '{n} cards prontos para revisar', dueHeroCopy: 'Mantenha a memória fresca com uma sessão rápida.',
      startReview: 'Começar Smart Review', caughtUpTitle: 'Você está em dia.',
      caughtUpCopy: 'Nenhum card vence agora.', openSets: 'Abrir Study Sets',
      dueToday: 'Para hoje', metricSets: 'Study Sets', metricCards: 'Flashcards', mastered: 'Dominados',
      continueTitle: 'Continuar estudando', recentSaved: 'Salvos recentemente',
      complete: '{n}% concluído', continueCta: 'Continuar',
      libraryTitle: 'Biblioteca de estudos', libraryLede: 'Seu material de química salvo.',
      search: 'Buscar', type: 'Tipo', tag: 'Tag', sort: 'Ordenar',
      all: 'Tudo', elements: 'Elementos', molecules: 'Moléculas', articles: 'Artigos',
      open: 'Abrir', addToSet: 'Adicionar ao Set', generate: 'Gerar cards', more: 'Mais',
      emptyLibraryTitle: 'Sua Biblioteca está vazia.', emptyLibraryBody: 'Salve um elemento, molécula ou artigo para encontrá-lo aqui.',
      exploreTable: 'Explorar a Tabela Periódica',
      setsTitle: 'Study Sets', setsLede: 'Agrupe materiais em coleções focadas.',
      newSet: '+ Novo Study Set', setName: 'Nome', setDesc: 'Descrição', cancel: 'Cancelar',
      createSet: 'Criar Study Set', creating: 'Criando…', saving: 'Salvando…', generating: 'Gerando…',
      emptySetsTitle: 'Nenhum Study Set ainda', emptySetsBody: 'Agrupe elementos, moléculas e notas em coleções de estudo.',
      firstSet: 'Criar seu primeiro Study Set', study: 'Estudar',
      cardsCount: '{n} cards', dueCount: '{n} vencidos', masteredPct: '{n}% dominados', lastUpdated: 'Atualizado {when}',
      startReviewSet: 'Começar revisão', addCard: 'Adicionar card', materials: 'Materiais', flashcards: 'Flashcards',
      emptySetItems: 'Adicione itens da Biblioteca a este set.', emptyCards: 'Nenhum flashcard ainda.',
      front: 'Frente', back: 'Verso', saveCard: 'Salvar flashcard', edit: 'Editar', suspend: 'Suspender',
      resume: 'Retomar', delete: 'Excluir', dueWhen: 'Vence {when}',
      genCreated: '{n} flashcards criados', genNone: 'Nenhum card novo era necessário. Esses flashcards já existem neste Study Set.',
      genEmpty: 'Adicione um elemento ou molécula e depois gere os cards.',
      deleteSetTitle: 'Excluir “{title}”?', deleteSetBody: 'Os flashcards serão apagados. Os itens da Biblioteca permanecem.',
      deleteSet: 'Excluir Study Set', deleteCardTitle: 'Excluir este flashcard?', deleteCardBody: 'Isso não pode ser desfeito.',
      deleteCard: 'Excluir flashcard', deleteItemTitle: 'Remover item salvo?', deleteItemBody: 'Ele sai da Biblioteca. Cards já gerados nos Study Sets permanecem.',
      remove: 'Remover',
      reviewTitle: 'Smart Review', reviewReady: '{n} cards estão prontos.', reviewEstimate: 'Sessão estimada: ~{n} minutos',
      reviewSeconds: '~20 segundos/card', startReviewCta: 'Começar revisão',
      showAnswer: 'Mostrar resposta', again: 'De novo', hard: 'Difícil', good: 'Bom', easy: 'Fácil',
      reviewHint: 'Espaço revela · 1 De novo · 2 Difícil · 3 Bom · 4 Fácil',
      reviewOf: '{a} / {b}', reviewComplete: 'Revisão concluída', reviewed: '{n} cards revisados',
      backOverview: 'Voltar à visão geral', tryAgain: 'Tentar de novo',
      saveReviewErrTitle: 'Não foi possível salvar esta revisão.', saveReviewErrBody: 'Sua resposta não foi perdida.',
      emptyReviewTitle: 'Nenhum card vence agora.', emptyReviewBody: 'Gere flashcards em um Study Set e volte aqui.',
      historyTitle: 'Histórico de calculadoras', historyLede: 'Seus cálculos salvos.',
      emptyHistoryTitle: 'Nenhum cálculo salvo ainda.', emptyHistoryBody: 'Use uma calculadora e salve um resultado.',
      openCalc: 'Abrir calculadora', openCalculators: 'Abrir calculadoras',
      notesTitle: 'Notas', notesLede: 'Material que você anotou na Biblioteca.',
      emptyNotesTitle: 'Nenhuma nota ainda.', emptyNotesBody: 'Abra um item salvo e escreva uma nota curta.',
      edited: 'Editado {when}', openMaterial: 'Abrir material',
      progressTitle: 'Continuar estudando', progressLede: 'Retome de onde parou.',
      emptyProgressTitle: 'Nada em andamento ainda.', emptyProgressBody: 'Abra um artigo ou modelo para começar um rastro.',
      accountTitle: 'Conta', profile: 'Perfil', email: 'Email', username: 'Usuário',
      security: 'Segurança', billing: 'Cobrança', trial: 'Trial',
      emailConfirmed: 'Email confirmado', emailPending: 'Email pendente de confirmação',
      proActive: 'Ativo', adsOff: 'Anúncios desligados', cloudOn: 'Study Cloud liberado', reviewOn: 'Smart Review liberado',
      managePlan: 'Gerenciar assinatura', viewPlans: 'Ver planos',
      freePlan: 'Atomurus Free', freePlanBody: 'Ferramentas públicas de química',
      trialPlan: 'Trial Pro', trialDays: '{n} dias restantes',
      proPlan: 'Atomurus Pro', annual: 'Anual', monthly: 'Mensal',
      loading: 'Carregando o workspace…', loadError: 'Não foi possível carregar o workspace.',
      retry: 'Tentar de novo', loadMore: 'Carregar mais', previous: 'Anterior', next: 'Próxima',
      lockedLibraryTitle: 'Biblioteca de estudos', lockedLibraryBody: 'Salve materiais, notas e progresso em todos os dispositivos.',
      lockedSetsTitle: 'Study Sets', lockedSetsBody: 'Agrupe química salva em coleções e gere flashcards.',
      lockedReviewTitle: 'Smart Review', lockedReviewBody: 'Agenda automaticamente os flashcards conforme você lembra deles.',
      lockedHistoryTitle: 'Histórico de calculadoras', lockedHistoryBody: 'Guarde cálculos validados e reabra depois.',
      lockedNotesTitle: 'Notas', lockedNotesBody: 'Anote elementos, moléculas e artigos salvos.',
      lockedProgressTitle: 'Continuar estudando', lockedProgressBody: 'Retome lições e artigos incompletos em qualquer dispositivo.',
      premium: 'Premium', pro: 'PRO',
      errSessionTitle: 'Sua sessão expirou.', errSessionBody: 'Entre de novo para continuar.',
      errLockedTitle: 'Este é um recurso do Atomurus Pro.', errLockedBody: 'Faça upgrade para liberar o workspace de estudos.',
      errNetworkTitle: 'Não foi possível conectar ao Atomurus.', errNetworkBody: 'Verifique a conexão e tente de novo.',
      errServerTitle: 'Algo deu errado.', errServerBody: 'Tente de novo em instantes.',
      errGenericTitle: 'Não foi possível concluir esta ação.', errGenericBody: 'Tente de novo.',
      errQuotaTitle: 'Você atingiu um limite do Pro.', errQuotaBody: 'Apague sets ou cards não usados e tente de novo.',
      errConflictTitle: 'Este card já foi revisado.', errConflictBody: 'Seguimos para o próximo card.',
      toastSaved: 'Salvo na Biblioteca', toastAdded: 'Adicionado ao Study Set', toastSet: 'Study Set criado',
      toastNote: 'Nota atualizada', toastSuspended: 'Card suspenso', toastDeleted: 'Excluído',
      sortUpdated: 'Atualizados', sortTitle: 'Título', member: 'membro',
      signInAgain: 'Entrar'
    }
  };

  function $(id) { return document.getElementById(id); }

  function logic() { return window.AtomurusWorkspace || WS; }

  function ui() { return window.AtomurusWorkspaceUI || UI; }

  function langIsPt() {
    return (document.documentElement.lang || '').toLowerCase().indexOf('pt') === 0;
  }

  function t(key, fallback, vars) {
    var lang = langIsPt() ? 'pt' : 'en';
    var value;
    if (window.I18N && typeof window.I18N.t === 'function') {
      var fromI18n = window.I18N.t('common.ws.' + key);
      if (fromI18n && fromI18n !== 'common.ws.' + key) value = fromI18n;
    }
    if (value == null) value = (FB[lang] && FB[lang][key]) || (FB.en[key]) || fallback || key;
    return logic().interpolate ? logic().interpolate(value, vars) : String(value);
  }

  function escapeHtml(value) {
    return String(value == null ? '' : value)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  function auth() { return window.AtomurusAuth; }

  function toast(message, tone) {
    if (ui().toast) ui().toast(message, { tone: tone || 'success' });
  }

  function displayName(user) {
    return (user && (user.displayName || user.fullName || user.username || user.email)) || 'Atomurus';
  }

  function workspaceNext() { return location.pathname + location.search; }

  function studySection() {
    try {
      return logic().normalizeSection(new URLSearchParams(location.search).get('section'));
    } catch (_err) {
      return 'overview';
    }
  }

  function studySetIdFromQuery() {
    return logic().setIdFromQuery ? logic().setIdFromQuery(location.search) : '';
  }

  function setHref(id) { return '/app?section=sets&set=' + encodeURIComponent(id); }
  function reviewHref(id) { return id ? '/app?section=review&set=' + encodeURIComponent(id) : '/app?section=review'; }
  function safeHref(value) { return logic().safeHref(value, '/app'); }

  function icon(name) {
    var paths = {
      overview: '<path d="M3 3h4v4H3zM9 3h4v4H9zM3 9h4v4H3zM9 9h4v4H9z"/>',
      library: '<path d="M3 3h3v10H3zM7 5h3v8H7zM11 4h3v9h-3z"/>',
      sets: '<path d="M3 5h10M3 8h10M3 11h10M5 3v10"/>',
      review: '<path d="M8 2.5a5.5 5.5 0 1 1-4.6 2.5M8 5v3.5L10 10"/>',
      history: '<path d="M8 3v5l3 2M3.5 8a4.5 4.5 0 1 0 1-2.8"/>',
      notes: '<path d="M4 3h6l3 3v7H4zM10 3v3h3"/>',
      progress: '<path d="M3 12l4-4 2 2 4-6"/>',
      account: '<path d="M8 8a2.5 2.5 0 1 0 0-5 2.5 2.5 0 0 0 0 5zM3.5 13.5c.6-2.2 2.3-3.5 4.5-3.5s3.9 1.3 4.5 3.5"/>',
      plan: '<path d="M4 5h8v8H4zM6 3v2M10 3v2"/>',
      lock: '<path d="M5 7V5.5a3 3 0 0 1 6 0V7M4 7h8v6H4z"/>'
    };
    return '<svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true"><g stroke="currentColor" stroke-width="1.3" stroke-linecap="round" stroke-linejoin="round" fill="none">' + (paths[name] || paths.overview) + '</g></svg>';
  }

  var NAV = [
    ['overview', 'overview'],
    ['library', 'library'],
    ['sets', 'sets'],
    ['review', 'review'],
    ['history', 'history'],
    ['notes', 'notes'],
    ['progress', 'progress']
  ];

  function proUser(user) { return logic().isProUser(user); }

  function renderNav(user) {
    var current = studySection();
    var badge = logic().planBadge(user);
    var main = $('ws-nav-main');
    var foot = $('ws-nav-foot');
    var bottom = $('ws-bottom');
    if (main) {
      main.innerHTML = NAV.map(function (pair) {
        var active = pair[0] === current ? ' is-active' : '';
        var meta = proUser(user) ? '' : '<span class="ws-nav-meta">PRO</span>';
        return '<a class="ws-nav-item' + active + '" href="/app?section=' + pair[0] + '">' +
          icon(pair[0]) + '<span class="ws-nav-label">' + escapeHtml(t(pair[1])) + '</span>' + meta + '</a>';
      }).join('');
    }
    if (foot) {
      var upgrade = proUser(user) ? '' :
        '<a class="ws-nav-item is-upgrade" href="/pricing">' + icon('plan') + '<span class="ws-nav-label">' + escapeHtml(t('upgrade')) + '</span></a>';
      foot.innerHTML =
        '<a class="ws-nav-item' + (current === 'account' ? ' is-active' : '') + '" href="/app?section=account">' + icon('account') + '<span class="ws-nav-label">' + escapeHtml(t('account')) + '</span></a>' +
        '<a class="ws-nav-item" href="/pricing">' + icon('plan') + '<span class="ws-nav-label">' + escapeHtml(t('plan')) + '</span></a>' +
        '<button type="button" class="ws-nav-item" id="app-logout-aside">' + icon('account') + '<span class="ws-nav-label">' + escapeHtml(t('logout')) + '</span></button>' +
        upgrade;
      var aside = $('app-logout-aside');
      if (aside) aside.addEventListener('click', doLogout);
    }
    if (bottom) {
      var primary = [['overview', 'overview'], ['library', 'library'], ['sets', 'sets'], ['review', 'review']];
      bottom.innerHTML = primary.map(function (pair) {
        return '<a class="' + (pair[0] === current ? 'is-active' : '') + '" href="/app?section=' + pair[0] + '">' + icon(pair[0]) + '<span>' + escapeHtml(t(pair[1])) + '</span></a>';
      }).join('');
    }
    var chip = $('ws-user-name');
    if (chip) chip.textContent = displayName(user);
    var planBadge = $('ws-plan-badge');
    if (planBadge) {
      if (badge.kind === 'pro' || badge.kind === 'trial' || badge.kind === 'admin') {
        planBadge.hidden = false;
        planBadge.className = 'ws-badge ws-badge-' + badge.kind;
        planBadge.textContent = badge.label;
      } else {
        planBadge.hidden = true;
      }
    }
  }

  function skeleton() {
    return '<div class="ws-skeleton" aria-hidden="true"><div class="ws-skel ws-skel-lg"></div><div class="ws-skel"></div><div class="ws-skel"></div><div class="ws-skel"></div></div>';
  }

  function emptyState(title, body, href, cta) {
    return '<div class="ws-empty"><div class="ws-empty-illu" aria-hidden="true">' + icon('library') + '</div><h3>' + escapeHtml(title) + '</h3><p>' + escapeHtml(body) + '</p>' +
      (href ? '<a class="ws-btn ws-btn-primary" href="' + escapeHtml(href) + '">' + escapeHtml(cta) + '</a>' : '') + '</div>';
  }

  function lockedState(titleKey, bodyKey) {
    return '<div class="ws-locked"><div class="ws-locked-illu" aria-hidden="true">' + icon('lock') + '</div>' +
      '<h3>' + escapeHtml(t(titleKey)) + ' <span class="ws-badge ws-badge-pro">' + escapeHtml(t('premium')) + '</span></h3>' +
      '<p>' + escapeHtml(t(bodyKey)) + '</p>' +
      '<a class="ws-btn ws-btn-primary" href="/pricing">' + escapeHtml(t('upgrade')) + '</a></div>';
  }

  function showStudyLocked(node) {
    var section = studySection();
    var map = {
      library: ['lockedLibraryTitle', 'lockedLibraryBody'],
      sets: ['lockedSetsTitle', 'lockedSetsBody'],
      review: ['lockedReviewTitle', 'lockedReviewBody'],
      history: ['lockedHistoryTitle', 'lockedHistoryBody'],
      notes: ['lockedNotesTitle', 'lockedNotesBody'],
      progress: ['lockedProgressTitle', 'lockedProgressBody']
    };
    var keys = map[section] || ['lockedReviewTitle', 'lockedReviewBody'];
    node.innerHTML = sectionHead(t(keys[0]), t(keys[1]), true) + lockedState(keys[0], keys[1]);
  }

  function sectionHead(title, lede, pro) {
    return '<header class="ws-section-head"><div><p class="ws-kicker">Atomurus</p><h1 class="ws-title">' + escapeHtml(title) +
      (pro ? ' <span class="ws-badge ws-badge-pro">' + escapeHtml(t('pro')) + '</span>' : '') +
      '</h1><p class="ws-lede">' + escapeHtml(lede) + '</p></div></header>';
  }

  function friendlyCatch(node, err) {
    var info = logic().uxError(err);
    if (info.kind === 'session') throw err;
    if (info.kind === 'locked') {
      showStudyLocked(node);
      return;
    }
    node.innerHTML = '<div class="ws-error"><h3>' + escapeHtml(t(info.titleKey)) + '</h3><p>' + escapeHtml(t(info.bodyKey)) + '</p>' +
      '<button type="button" class="ws-btn ws-btn-primary" id="ws-retry">' + escapeHtml(t('retry')) + '</button></div>';
    var btn = $('ws-retry');
    if (btn) btn.addEventListener('click', function () { location.reload(); });
  }

  function progressBar(pct) {
    var n = logic().progressPercent(pct);
    return '<div class="ws-progress" role="progressbar" aria-valuemin="0" aria-valuemax="100" aria-valuenow="' + n + '"><span style="width:' + n + '%"></span></div>';
  }

  function itemSymbol(item) {
    var key = String((item && (item.itemKey || item.title)) || '').trim();
    if (item && item.itemType === 'element') return key.slice(0, 2).replace(/^[a-z]/, function (c) { return c.toUpperCase(); });
    if (item && item.itemType === 'molecule') return 'M';
    if (item && item.itemType === 'calculator') return 'Σ';
    return 'A';
  }

  var reviewSession = null;
  var reviewBusy = false;

  function newClientEventId() {
    if (window.crypto && typeof window.crypto.randomUUID === 'function') return window.crypto.randomUUID();
    return '00000000-0000-4000-8000-' + String(Date.now()).padStart(12, '0').slice(-12);
  }

  function bindReviewKeys() {
    if (bindReviewKeys.bound) return;
    bindReviewKeys.bound = true;
    document.addEventListener('keydown', function (event) {
      if (!reviewSession || !reviewSession.active) return;
      var target = event.target;
      if (target && (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA')) return;
      if (event.key === ' ' || event.code === 'Space') {
        event.preventDefault();
        if (!reviewSession.revealed) revealReviewCard();
        return;
      }
      if (!reviewSession.revealed) return;
      if (event.key === '1') gradeReview('again');
      if (event.key === '2') gradeReview('hard');
      if (event.key === '3') gradeReview('good');
      if (event.key === '4') gradeReview('easy');
    });
  }

  function paintReviewCard() {
    var root = document.getElementById('app-review-session');
    if (!root || !reviewSession) return;
    var card = reviewSession.cards[reviewSession.index];
    var meta = root.querySelector('[data-review-meta]');
    var front = root.querySelector('[data-review-front]');
    var back = root.querySelector('[data-review-back]');
    var reveal = root.querySelector('[data-review-reveal]');
    var ratings = root.querySelector('[data-review-ratings]');
    var empty = root.querySelector('[data-review-empty]');
    var bar = root.querySelector('[data-review-bar]');
    var err = root.querySelector('[data-review-error]');
    if (err) err.hidden = true;
    if (!card) {
      if (front) front.textContent = '';
      if (back) back.textContent = '';
      if (meta) meta.textContent = '';
      if (reveal) reveal.hidden = true;
      if (ratings) ratings.hidden = true;
      reviewSession.active = false;
      renderReviewComplete(root);
      return;
    }
    if (empty) empty.hidden = true;
    var total = reviewSession.cards.length;
    var idx = reviewSession.index + 1;
    if (meta) meta.textContent = t('reviewOf', '', { a: idx, b: total });
    if (bar) bar.innerHTML = progressBar((idx - 1) / total * 100);
    if (front) front.textContent = card.front || '';
    if (back) {
      back.textContent = reviewSession.revealed ? (card.back || '') : '';
      back.hidden = !reviewSession.revealed;
    }
    if (reveal) reveal.hidden = reviewSession.revealed;
    if (ratings) ratings.hidden = !reviewSession.revealed;
  }

  function renderReviewComplete(root) {
    var stats = reviewSession && reviewSession.stats || {};
    var total = (stats.again || 0) + (stats.hard || 0) + (stats.good || 0) + (stats.easy || 0);
    root.innerHTML = '<div class="ws-complete"><div class="ws-complete-check" aria-hidden="true">' + icon('review') + '</div>' +
      '<h2 class="ws-title">' + escapeHtml(t('reviewComplete')) + '</h2>' +
      '<p>' + escapeHtml(t('reviewed', '', { n: total })) + '</p>' +
      '<div class="ws-metrics" style="grid-template-columns:repeat(4,minmax(0,1fr))">' +
      '<div class="ws-metric"><div class="ws-metric-value">' + escapeHtml(String(stats.good || 0)) + '</div><div class="ws-metric-label">' + escapeHtml(t('good')) + '</div></div>' +
      '<div class="ws-metric"><div class="ws-metric-value">' + escapeHtml(String(stats.easy || 0)) + '</div><div class="ws-metric-label">' + escapeHtml(t('easy')) + '</div></div>' +
      '<div class="ws-metric"><div class="ws-metric-value">' + escapeHtml(String(stats.hard || 0)) + '</div><div class="ws-metric-label">' + escapeHtml(t('hard')) + '</div></div>' +
      '<div class="ws-metric"><div class="ws-metric-value">' + escapeHtml(String(stats.again || 0)) + '</div><div class="ws-metric-label">' + escapeHtml(t('again')) + '</div></div>' +
      '</div><p><a class="ws-btn ws-btn-primary" href="/app?section=overview">' + escapeHtml(t('backOverview')) + '</a></p></div>';
  }

  function revealReviewCard() {
    if (!reviewSession) return;
    reviewSession.revealed = true;
    paintReviewCard();
  }

  function startReviewSession(data, title) {
    bindReviewKeys();
    reviewSession = {
      active: true,
      revealed: false,
      index: 0,
      title: title || t('reviewTitle'),
      cards: (data && data.cards) || [],
      stats: { again: 0, hard: 0, good: 0, easy: 0 }
    };
    var node = $('app-study');
    if (!node) return;
    node.innerHTML =
      '<div id="app-review-session" class="ws-review">' +
      '<p class="ws-kicker">' + escapeHtml(reviewSession.title) + '</p>' +
      '<div class="ws-review-progress" data-review-meta></div>' +
      '<div data-review-bar></div>' +
      '<div class="ws-review-face" data-review-front></div>' +
      '<button type="button" class="ws-btn ws-btn-primary ws-review-reveal" data-review-reveal>' + escapeHtml(t('showAnswer')) + '</button>' +
      '<div class="ws-review-face" data-review-back hidden></div>' +
      '<div class="ws-review-ratings" data-review-ratings hidden>' +
      '<button type="button" class="ws-btn ws-grade-again" data-grade="again">' + escapeHtml(t('again')) + '</button>' +
      '<button type="button" class="ws-btn ws-grade-hard" data-grade="hard">' + escapeHtml(t('hard')) + '</button>' +
      '<button type="button" class="ws-btn ws-grade-good" data-grade="good">' + escapeHtml(t('good')) + '</button>' +
      '<button type="button" class="ws-btn ws-grade-easy" data-grade="easy">' + escapeHtml(t('easy')) + '</button>' +
      '</div>' +
      '<div class="ws-error" data-review-error hidden></div>' +
      '<div class="ws-empty" data-review-empty hidden></div>' +
      '<p class="ws-review-hint">' + escapeHtml(t('reviewHint')) + '</p>' +
      '</div>';
    var root = document.getElementById('app-review-session');
    root.querySelector('[data-review-reveal]').addEventListener('click', revealReviewCard);
    root.querySelector('[data-review-ratings]').addEventListener('click', function (event) {
      var btn = event.target && event.target.closest && event.target.closest('[data-grade]');
      if (!btn) return;
      gradeReview(btn.getAttribute('data-grade'));
    });
    paintReviewCard();
  }

  async function gradeReview(rating) {
    if (!reviewSession || !reviewSession.active || reviewBusy) return;
    var card = reviewSession.cards[reviewSession.index];
    if (!card || !reviewSession.revealed) return;
    var api = window.AtomurusStudy;
    if (!api) return;
    reviewBusy = true;
    var root = document.getElementById('app-review-session');
    var errBox = root && root.querySelector('[data-review-error]');
    if (errBox) errBox.hidden = true;
    try {
      await api.submitReview({
        cardId: card.id,
        rating: rating,
        clientEventId: newClientEventId(),
        expectedVersion: card.version
      });
      reviewSession.stats[rating] = (reviewSession.stats[rating] || 0) + 1;
      reviewSession.index += 1;
      reviewSession.revealed = false;
      paintReviewCard();
    } catch (err) {
      if (err && err.code === 'review_conflict') {
        reviewSession.index += 1;
        reviewSession.revealed = false;
        paintReviewCard();
      } else {
        if (errBox) {
          errBox.hidden = false;
          errBox.textContent = '';
          var title = document.createElement('strong');
          title.textContent = t('saveReviewErrTitle');
          var body = document.createElement('p');
          body.textContent = t('saveReviewErrBody');
          var retry = document.createElement('button');
          retry.type = 'button';
          retry.className = 'ws-btn ws-btn-primary';
          retry.textContent = t('tryAgain');
          retry.addEventListener('click', function () { gradeReview(rating); });
          errBox.appendChild(title);
          errBox.appendChild(body);
          errBox.appendChild(retry);
        }
      }
    } finally {
      reviewBusy = false;
    }
  }

  function continueCard(row) {
    var pct = logic().progressPercent(row.progress);
    return '<a class="ws-study-item" href="' + escapeHtml(safeHref(row.lastPosition)) + '"><div class="ws-item-symbol">' + icon('progress') + '</div><div>' +
      '<h3 class="ws-item-title">' + escapeHtml(row.contentKey || row.contentType || '') + '</h3>' +
      '<div class="ws-progress-label">' + escapeHtml(t('complete', '', { n: pct })) + '</div>' + progressBar(pct) +
      '</div><span class="ws-btn ws-btn-sm">' + escapeHtml(t('continueCta')) + ' →</span></a>';
  }

  function recentCard(item) {
    return '<a class="ws-study-item" href="' + escapeHtml(safeHref(item.href)) + '"><div class="ws-item-symbol">' + escapeHtml(itemSymbol(item)) + '</div><div>' +
      '<h3 class="ws-item-title">' + escapeHtml(item.title || item.itemKey || '') + '</h3>' +
      '<div class="ws-item-meta">' + escapeHtml(item.itemType || '') + '</div></div></a>';
  }

  async function renderOverview(node, api, user) {
    node.innerHTML = skeleton();
    var pair = await Promise.all([api.overview(), api.reviewOverview().catch(function () { return null; })]);
    var overview = pair[0];
    var review = pair[1];
    var dueNow = review && review.dueNow != null ? review.dueNow : 0;
    var name = displayName(user);
    var greet = t('greeting' + logic().greetingKey().replace(/^./, function (c) { return c.toUpperCase(); }), '', { name: name });
    if (greet.indexOf('greeting') === 0) greet = t('greetingEvening', '', { name: name });
    var hour = logic().greetingKey();
    greet = t(hour === 'morning' ? 'greetingMorning' : hour === 'afternoon' ? 'greetingAfternoon' : 'greetingEvening', '', { name: name });
    var hero = dueNow
      ? '<section class="ws-hero is-ready"><div><h2 class="ws-hero-title">' + escapeHtml(t('dueHeroTitle', '', { n: dueNow })) + '</h2><p class="ws-hero-copy">' + escapeHtml(t('dueHeroCopy')) + '</p><a class="ws-btn ws-btn-primary" href="/app?section=review&start=1">' + escapeHtml(t('startReview')) + '</a></div></section>'
      : '<section class="ws-hero"><div><h2 class="ws-hero-title">' + escapeHtml(t('caughtUpTitle')) + '</h2><p class="ws-hero-copy">' + escapeHtml(t('caughtUpCopy')) + '</p><a class="ws-btn ws-btn-secondary" href="/app?section=sets">' + escapeHtml(t('openSets')) + '</a></div></section>';
    var metrics = review
      ? '<div class="ws-metrics">' +
        [['dueToday', dueNow], ['metricSets', (review.sets || []).length], ['metricCards', review.totalCards || 0], ['mastered', review.masteredCards || 0]].map(function (row) {
          return '<div class="ws-metric"><div class="ws-metric-value">' + escapeHtml(String(row[1])) + '</div><div class="ws-metric-label">' + escapeHtml(t(row[0])) + '</div></div>';
        }).join('') + '</div>'
      : '';
    var cont = (overview.continueStudying || []).slice(0, 5);
    var recent = (overview.recentItems || []).slice(0, 5);
    node.innerHTML =
      '<p class="ws-kicker">Atomurus</p><h1 class="ws-title">' + escapeHtml(greet) + '</h1><p class="ws-lede">' + escapeHtml(t('greetingFallback')) + '</p>' +
      hero + metrics +
      '<h2 class="ws-h2">' + escapeHtml(t('continueTitle')) + '</h2>' +
      (cont.length ? '<div class="ws-grid">' + cont.map(continueCard).join('') + '</div>' : emptyState(t('emptyProgressTitle'), t('emptyProgressBody'))) +
      '<h2 class="ws-h2">' + escapeHtml(t('recentSaved')) + '</h2>' +
      (recent.length ? '<div class="ws-grid">' + recent.map(recentCard).join('') + '</div>' : emptyState(t('emptyLibraryTitle'), t('emptyLibraryBody'), '/periodic-table.html', t('exploreTable')));
  }

  function libraryRow(item) {
    var href = safeHref(item.href);
    var canGenerate = item.itemType === 'element' || item.itemType === 'molecule';
    var tags = Array.isArray(item.tags) ? item.tags.join(' · ') : '';
    return '<article class="ws-study-item" data-library-id="' + escapeHtml(item.id) + '">' +
      '<div class="ws-item-symbol">' + escapeHtml(itemSymbol(item)) + '</div><div>' +
      '<h3 class="ws-item-title">' + escapeHtml(item.title || item.itemKey || '') + '</h3>' +
      '<div class="ws-item-meta">' + escapeHtml(item.itemType || '') + (tags ? ' · ' + escapeHtml(tags) : '') + '</div>' +
      (item.note ? '<div class="ws-item-note"></div>' : '') +
      '</div><div class="ws-item-actions">' +
      '<a class="ws-btn ws-btn-primary ws-btn-sm" href="' + escapeHtml(href) + '">' + escapeHtml(t('open')) + '</a>' +
      '<button type="button" class="ws-btn ws-btn-secondary ws-btn-sm" data-add-to-set="' + escapeHtml(item.id) + '">' + escapeHtml(t('addToSet')) + '</button>' +
      (canGenerate ? '<button type="button" class="ws-btn ws-btn-sm" data-generate-item="' + escapeHtml(item.id) + '">' + escapeHtml(t('generate')) + '</button>' : '') +
      '<div class="ws-dropdown"><button type="button" class="ws-btn ws-btn-icon ws-btn-sm" data-more="' + escapeHtml(item.id) + '" aria-haspopup="true">•••</button>' +
      '<div class="ws-menu"><button type="button" data-delete-item="' + escapeHtml(item.id) + '">' + escapeHtml(t('remove')) + '</button></div></div>' +
      '</div></article>';
  }

  function openAddToSetDialog(api, itemId, node) {
    api.listSets().then(function (data) {
      var box = document.createElement('div');
      (data.sets || []).forEach(function (set) {
        var choice = document.createElement('button');
        choice.type = 'button';
        choice.className = 'ws-btn';
        choice.style.display = 'block';
        choice.style.width = '100%';
        choice.style.marginBottom = '8px';
        choice.textContent = set.title || t('sets');
        choice.addEventListener('click', function () {
          ui().setBusy(choice, true, t('saving'));
          api.addSetItem({ setId: set.id, itemId: itemId }).then(function () {
            toast(t('toastAdded'));
            ui().closeDialog();
            var generate = node && node.querySelector('[data-generate-item="' + itemId + '"]');
            if (generate) generate.setAttribute('data-set-id', set.id);
          }).catch(function (err) {
            ui().setBusy(choice, false);
            toast(t(logic().uxError(err).bodyKey), 'danger');
          });
        });
        box.appendChild(choice);
      });
      var newer = document.createElement('button');
      newer.type = 'button';
      newer.className = 'ws-btn ws-btn-secondary';
      newer.textContent = t('newSet');
      newer.addEventListener('click', function () { openCreateSetDialog(api, itemId, node); });
      box.appendChild(newer);
      ui().openDialog({ title: t('addToSet'), bodyNode: box, actions: [{ label: t('cancel'), kind: 'ws-btn-ghost' }] });
    }).catch(function (err) { toast(t(logic().uxError(err).bodyKey), 'danger'); });
  }

  function bindLibrarySetActions(node, api) {
    node.addEventListener('click', function (event) {
      var addBtn = event.target.closest && event.target.closest('[data-add-to-set]');
      var genBtn = event.target.closest && event.target.closest('[data-generate-item]');
      var more = event.target.closest && event.target.closest('[data-more]');
      var del = event.target.closest && event.target.closest('[data-delete-item]');
      if (more) {
        event.preventDefault();
        var drop = more.parentNode;
        drop.classList.toggle('is-open');
        return;
      }
      if (del) {
        ui().confirmDialog({
          title: t('deleteItemTitle'),
          body: t('deleteItemBody'),
          confirmLabel: t('remove'),
          cancelLabel: t('cancel'),
          danger: true
        }).then(function (ok) {
          if (!ok) return;
          api.deleteItem(del.getAttribute('data-delete-item')).then(function () {
            toast(t('toastDeleted'));
            location.reload();
          }).catch(function (err) { toast(t(logic().uxError(err).bodyKey), 'danger'); });
        });
        return;
      }
      if (addBtn) {
        openAddToSetDialog(api, addBtn.getAttribute('data-add-to-set') || '', node);
        return;
      }
      if (genBtn) {
        var gid = genBtn.getAttribute('data-generate-item');
        var setId = genBtn.getAttribute('data-set-id');
        if (!setId) {
          openAddToSetDialog(api, gid, node);
          return;
        }
        ui().setBusy(genBtn, true, t('generating'));
        api.generateCards({ setId: setId, itemId: gid }).then(function (data) {
          ui().setBusy(genBtn, false);
          var fb = logic().generateCardsFeedback(data);
          if (fb.kind === 'created') toast(t('genCreated', '', { n: fb.created }));
          else toast(t('genNone'), 'info');
        }).catch(function (err) {
          ui().setBusy(genBtn, false);
          toast(t(logic().uxError(err).bodyKey), 'danger');
        });
      }
    });
    node.querySelectorAll('.ws-item-note').forEach(function (noteNode) {
      var wrap = noteNode.closest('[data-library-id]');
      var id = wrap && wrap.getAttribute('data-library-id');
      var match = (bindLibrarySetActions.items || []).find(function (row) { return row.id === id; });
      if (match && match.note) noteNode.textContent = match.note;
    });
  }

  function openCreateSetDialog(api, itemId, node) {
    var body = document.createElement('div');
    var nameLabel = document.createElement('label');
    nameLabel.setAttribute('for', 'ws-new-set-name');
    nameLabel.textContent = t('setName');
    var name = document.createElement('input');
    name.id = 'ws-new-set-name';
    name.className = 'ws-input';
    name.maxLength = 120;
    name.setAttribute('aria-label', t('setName'));
    name.placeholder = t('setName');
    var descLabel = document.createElement('label');
    descLabel.setAttribute('for', 'ws-new-set-desc');
    descLabel.textContent = t('setDesc');
    var desc = document.createElement('textarea');
    desc.id = 'ws-new-set-desc';
    desc.className = 'ws-textarea';
    desc.maxLength = 1000;
    desc.setAttribute('aria-label', t('setDesc'));
    desc.placeholder = t('setDesc');
    body.appendChild(nameLabel);
    body.appendChild(name);
    body.appendChild(descLabel);
    body.appendChild(desc);
    ui().openDialog({
      title: t('newSet'),
      bodyNode: body,
      actions: [
        { label: t('cancel'), kind: 'ws-btn-ghost' },
        {
          label: t('createSet'),
          kind: 'ws-btn-primary',
          close: false,
          onClick: function () {
            var title = name.value.trim();
            if (!title) {
              name.focus();
              return;
            }
            var primary = document.querySelector('#ws-dialog-host .ws-btn-primary');
            ui().setBusy(primary, true, t('creating'));
            api.createSet({ title: title, description: desc.value }).then(function (created) {
              toast(t('toastSet'));
              if (itemId && created.set && created.set.id) {
                return api.addSetItem({ setId: created.set.id, itemId: itemId }).then(function () {
                  toast(t('toastAdded'));
                  ui().closeDialog();
                  if (node) {
                    var generate = node.querySelector('[data-generate-item="' + itemId + '"]');
                    if (generate) generate.setAttribute('data-set-id', created.set.id);
                  } else {
                    location.replace(setHref(created.set.id));
                  }
                });
              }
              ui().closeDialog();
              if (created.set && created.set.id) location.replace(setHref(created.set.id));
            }).catch(function (err) {
              ui().setBusy(primary, false);
              toast(t(logic().uxError(err).bodyKey), 'danger');
            });
          }
        }
      ]
    });
    name.focus();
  }

  function debounce(fn, ms) {
    var tmr;
    return function () {
      var args = arguments;
      clearTimeout(tmr);
      tmr = setTimeout(function () { fn.apply(null, args); }, ms);
    };
  }

  async function renderLibrary(node, api) {
    node.innerHTML = sectionHead(t('libraryTitle'), t('libraryLede'), true) + skeleton();
    var library = await api.items({ exclude: 'calculator', limit: 40 });
    var items = library.items || [];
    bindLibrarySetActions.items = items;
    if (!items.length) {
      node.innerHTML = sectionHead(t('libraryTitle'), t('libraryLede'), true) +
        emptyState(t('emptyLibraryTitle'), t('emptyLibraryBody'), '/periodic-table.html', t('exploreTable'));
      return;
    }
    var tags = [];
    items.forEach(function (item) {
      (item.tags || []).forEach(function (tag) {
        if (tag && tags.indexOf(tag) === -1) tags.push(tag);
      });
    });
    node.innerHTML = sectionHead(t('libraryTitle'), t('libraryLede'), true) +
      '<div class="ws-toolbar"><input class="ws-search-field" id="ws-lib-q" type="search" aria-label="' + escapeHtml(t('search')) + '">' +
      '<select class="ws-select" id="ws-lib-type" aria-label="' + escapeHtml(t('type')) + '">' +
      ['all', 'element', 'molecule', 'article'].map(function (type) {
        var label = type === 'all' ? t('all') : type === 'element' ? t('elements') : type === 'molecule' ? t('molecules') : t('articles');
        return '<option value="' + type + '">' + escapeHtml(label) + '</option>';
      }).join('') +
      '</select>' +
      (tags.length
        ? '<select class="ws-select" id="ws-lib-tag" aria-label="' + escapeHtml(t('tag')) + '"><option value="all">' + escapeHtml(t('all')) + '</option>' +
          tags.map(function (tag) { return '<option value="' + escapeHtml(tag) + '">' + escapeHtml(tag) + '</option>'; }).join('') + '</select>'
        : '') +
      '<select class="ws-select" id="ws-lib-sort" aria-label="' + escapeHtml(t('sort')) + '"><option value="updated">' + escapeHtml(t('sortUpdated')) + '</option><option value="title">' + escapeHtml(t('sortTitle')) + '</option></select></div>' +
      '<div id="ws-lib-list" class="ws-grid">' + items.map(libraryRow).join('') + '</div>';
    bindLibrarySetActions(node, api);
    var apply = function () {
      var q = (($('ws-lib-q') || {}).value || '').toLowerCase();
      var type = ($('ws-lib-type') || {}).value || 'all';
      var tag = ($('ws-lib-tag') || {}).value || 'all';
      var sort = ($('ws-lib-sort') || {}).value || 'updated';
      var next = items.filter(function (item) {
        if (type !== 'all' && item.itemType !== type) return false;
        if (tag !== 'all' && (!item.tags || item.tags.indexOf(tag) === -1)) return false;
        if (!q) return true;
        var blob = ((item.title || '') + ' ' + (item.note || '') + ' ' + (item.tags || []).join(' ')).toLowerCase();
        return blob.indexOf(q) !== -1;
      });
      if (sort === 'title') next = next.slice().sort(function (a, b) { return String(a.title || '').localeCompare(String(b.title || '')); });
      var list = $('ws-lib-list');
      if (!list) return;
      items.forEach(function (item) {
        var el = list.querySelector('[data-library-id="' + item.id + '"]');
        if (el) el.hidden = next.indexOf(item) === -1;
      });
      next.forEach(function (item) {
        var el = list.querySelector('[data-library-id="' + item.id + '"]');
        if (el) list.appendChild(el);
      });
    };
    var qn = $('ws-lib-q');
    if (qn) {
      qn.placeholder = t('search');
      qn.addEventListener('input', debounce(apply, 200));
    }
    ['ws-lib-type', 'ws-lib-sort', 'ws-lib-tag'].forEach(function (id) {
      var el = $(id);
      if (el) el.addEventListener('change', apply);
    });
  }

  function setCard(entry) {
    var mastered = logic().masteredPercent(entry.masteredCount, entry.cardCount);
    var when = logic().relativeTime(entry.updatedAt, Date.now(), langIsPt() ? 'pt' : 'en');
    return '<article class="ws-set-card"><h3>' + escapeHtml(entry.title) + '</h3>' +
      '<div class="ws-set-stats"><span>' + escapeHtml(t('cardsCount', '', { n: entry.cardCount || 0 })) + '</span>' +
      '<span>' + escapeHtml(t('dueCount', '', { n: entry.dueCount || 0 })) + '</span>' +
      (mastered == null ? '' : '<span>' + escapeHtml(t('masteredPct', '', { n: mastered })) + '</span>') +
      '</div><div class="ws-muted">' + escapeHtml(t('lastUpdated', '', { when: when })) + '</div>' +
      '<div class="ws-row-actions"><a class="ws-btn ws-btn-primary ws-btn-sm" href="' + escapeHtml(reviewHref(entry.id)) + '">' + escapeHtml(t('study')) + '</a>' +
      '<a class="ws-btn ws-btn-sm" href="' + escapeHtml(setHref(entry.id)) + '">' + escapeHtml(t('open')) + '</a></div></article>';
  }

  function flashcardRow(entry) {
    var due = logic().relativeTime(entry.dueAt, Date.now(), langIsPt() ? 'pt' : 'en');
    return '<article class="ws-flashcard" data-card-id="' + escapeHtml(entry.id) + '">' +
      '<div class="ws-flash-kicker">' + escapeHtml(t('front')) + '</div><div class="ws-flash-front"></div>' +
      '<div class="ws-flash-kicker">' + escapeHtml(t('back')) + '</div><div class="ws-flash-back"></div>' +
      '<div class="ws-muted">' + escapeHtml(t('dueWhen', '', { when: due || '—' })) +
      (entry.suspended ? ' · ' + escapeHtml(t('suspend')) : '') + '</div>' +
      '<div class="ws-dropdown"><button type="button" class="ws-btn ws-btn-sm" data-card-menu="' + escapeHtml(entry.id) + '">•••</button>' +
      '<div class="ws-menu">' +
      '<button type="button" data-card-action="edit" data-card-id="' + escapeHtml(entry.id) + '">' + escapeHtml(t('edit')) + '</button>' +
      '<button type="button" data-card-action="toggle" data-card-id="' + escapeHtml(entry.id) + '" data-suspended="' + (entry.suspended ? '1' : '0') + '">' + escapeHtml(entry.suspended ? t('resume') : t('suspend')) + '</button>' +
      '<button type="button" data-card-action="delete" data-card-id="' + escapeHtml(entry.id) + '">' + escapeHtml(t('delete')) + '</button>' +
      '</div></div></article>';
  }

  function fillFlashcardTexts(node, cards) {
    (cards || []).forEach(function (entry) {
      var wrap = node.querySelector('[data-card-id="' + entry.id + '"]');
      if (!wrap) return;
      var front = wrap.querySelector('.ws-flash-front');
      var back = wrap.querySelector('.ws-flash-back');
      if (front) front.textContent = entry.front || '';
      if (back) back.textContent = entry.back || '';
    });
  }

  function openCardEditor(api, setId, card) {
    var body = document.createElement('div');
    var front = document.createElement('textarea');
    front.className = 'ws-textarea';
    front.maxLength = 1000;
    front.value = (card && card.front) || '';
    var back = document.createElement('textarea');
    back.className = 'ws-textarea';
    back.maxLength = 3000;
    back.value = (card && card.back) || '';
    var frontCount = document.createElement('div');
    frontCount.className = 'ws-charcount';
    var backCount = document.createElement('div');
    backCount.className = 'ws-charcount';
    function paintCounts() {
      frontCount.textContent = front.value.length + ' / 1000';
      backCount.textContent = back.value.length + ' / 3000';
      frontCount.classList.toggle('is-near', front.value.length > 800);
      backCount.classList.toggle('is-near', back.value.length > 2400);
    }
    paintCounts();
    front.addEventListener('input', paintCounts);
    back.addEventListener('input', paintCounts);
    var fl = document.createElement('label'); fl.textContent = t('front');
    var bl = document.createElement('label'); bl.textContent = t('back');
    body.appendChild(fl); body.appendChild(front); body.appendChild(frontCount);
    body.appendChild(bl); body.appendChild(back); body.appendChild(backCount);
    ui().openDialog({
      title: card ? t('edit') : t('addCard'),
      bodyNode: body,
      actions: [
        { label: t('cancel'), kind: 'ws-btn-ghost' },
        {
          label: t('saveCard'),
          kind: 'ws-btn-primary',
          close: false,
          onClick: function () {
            var payload = { front: front.value, back: back.value };
            var primary = document.querySelector('#ws-dialog-host .ws-btn-primary');
            ui().setBusy(primary, true, t('saving'));
            var req = card && card.id
              ? api.updateCard({ id: card.id, front: payload.front, back: payload.back })
              : api.createCard({ setId: setId, front: payload.front, back: payload.back });
            req.then(function () {
              toast(t('toastNote'));
              ui().closeDialog();
              location.reload();
            }).catch(function (err) {
              ui().setBusy(primary, false);
              toast(t(logic().uxError(err).bodyKey), 'danger');
            });
          }
        }
      ]
    });
  }

  async function renderSetsSection(node, api) {
    var setId = studySetIdFromQuery();
    if (setId) {
      node.innerHTML = skeleton();
      var detail = await api.getSet(setId, { limit: 40 });
      var set = detail.set || {};
      var mastered = logic().masteredPercent(set.masteredCount, set.cardCount);
      var itemsHtml = (detail.items || []).map(function (entry) {
        var item = entry.item || {};
        return '<div class="ws-study-item"><div class="ws-item-symbol">' + escapeHtml(itemSymbol(item)) + '</div><div><h3 class="ws-item-title"></h3><div class="ws-item-meta">' + escapeHtml(item.itemType || '') + '</div></div></div>';
      }).join('');
      node.innerHTML = '<header class="ws-section-head"><div><p class="ws-kicker">Study Set</p><h1 class="ws-title" id="ws-set-title"></h1>' +
        '<p class="ws-lede">' + escapeHtml(t('cardsCount', '', { n: set.cardCount || 0 })) + ' · ' + escapeHtml(t('dueCount', '', { n: set.dueCount || 0 })) +
        (mastered == null ? '' : ' · ' + escapeHtml(t('masteredPct', '', { n: mastered }))) + '</p></div>' +
        '<div class="ws-row-actions"><a class="ws-btn ws-btn-primary" href="' + escapeHtml(reviewHref(set.id)) + '">' + escapeHtml(t('startReviewSet')) + '</a>' +
        '<button type="button" class="ws-btn" id="app-card-new">' + escapeHtml(t('addCard')) + '</button>' +
        '<button type="button" class="ws-btn" id="app-generate-set">' + escapeHtml(t('generate')) + '</button>' +
        '<button type="button" class="ws-btn ws-btn-danger" id="app-delete-set">' + escapeHtml(t('deleteSet')) + '</button></div></header>' +
        '<div class="ws-tabs"><button type="button" class="ws-tab is-on" data-tab="materials">' + escapeHtml(t('materials')) + '</button>' +
        '<button type="button" class="ws-tab" data-tab="cards">' + escapeHtml(t('flashcards')) + '</button></div>' +
        '<div id="ws-tab-materials">' + (itemsHtml || emptyState(t('emptySetItems'), '')) + '</div>' +
        '<div id="ws-tab-cards" hidden><div id="app-set-cards">' + ((detail.cards || []).map(flashcardRow).join('') || emptyState(t('emptyCards'), '')) + '</div>' +
        (detail.nextCursor ? '<button type="button" class="ws-btn" id="app-cards-more" data-cursor="' + escapeHtml(detail.nextCursor) + '">' + escapeHtml(t('loadMore')) + '</button>' : '') +
        '</div>';
      var titleNode = $('ws-set-title');
      if (titleNode) titleNode.textContent = set.title || t('sets');
      (detail.items || []).forEach(function (entry, idx) {
        var titles = node.querySelectorAll('#ws-tab-materials .ws-item-title');
        if (titles[idx]) titles[idx].textContent = (entry.item && (entry.item.title || entry.item.itemKey)) || '';
      });
      fillFlashcardTexts(node, detail.cards || []);
      node.querySelectorAll('[data-tab]').forEach(function (tab) {
        tab.addEventListener('click', function () {
          node.querySelectorAll('[data-tab]').forEach(function (el) { el.classList.toggle('is-on', el === tab); });
          $('ws-tab-materials').hidden = tab.getAttribute('data-tab') !== 'materials';
          $('ws-tab-cards').hidden = tab.getAttribute('data-tab') !== 'cards';
        });
      });
      var generateBtn = $('app-generate-set');
      if (generateBtn) generateBtn.addEventListener('click', function () {
        ui().setBusy(generateBtn, true, t('generating'));
        api.generateCards({ setId: set.id }).then(function (data) {
          ui().setBusy(generateBtn, false);
          var fb = logic().generateCardsFeedback(data);
          toast(fb.kind === 'created' ? t('genCreated', '', { n: fb.created }) : t('genNone'), fb.kind === 'created' ? 'success' : 'info');
          if (fb.kind === 'created') location.reload();
        }).catch(function (err) {
          ui().setBusy(generateBtn, false);
          toast(t(logic().uxError(err).bodyKey), 'danger');
        });
      });
      var deleteBtn = $('app-delete-set');
      if (deleteBtn) deleteBtn.addEventListener('click', function () {
        ui().confirmDialog({
          title: t('deleteSetTitle', '', { title: set.title || '' }),
          body: t('deleteSetBody'),
          confirmLabel: t('deleteSet'),
          cancelLabel: t('cancel'),
          danger: true
        }).then(function (ok) {
          if (!ok) return;
          api.deleteSet(set.id).then(function () { location.replace('/app?section=sets'); })
            .catch(function (err) { toast(t(logic().uxError(err).bodyKey), 'danger'); });
        });
      });
      var addCard = $('app-card-new');
      if (addCard) addCard.addEventListener('click', function () { openCardEditor(api, set.id, null); });
      node.addEventListener('click', function (event) {
        var menu = event.target.closest && event.target.closest('[data-card-menu]');
        if (menu) {
          menu.parentNode.classList.toggle('is-open');
          return;
        }
        var more = event.target.closest && event.target.closest('#app-cards-more');
        if (more) {
          var cursor = more.getAttribute('data-cursor');
          more.disabled = true;
          api.getSet(set.id, { cursor: cursor, limit: 40 }, true).then(function (page) {
            var list = $('app-set-cards');
            (page.cards || []).forEach(function (entry) {
              var wrap = document.createElement('div');
              wrap.innerHTML = flashcardRow(entry);
              if (list && wrap.firstChild) list.appendChild(wrap.firstChild);
            });
            fillFlashcardTexts(node, page.cards || []);
            if (page.nextCursor) {
              more.setAttribute('data-cursor', page.nextCursor);
              more.disabled = false;
            } else more.remove();
          }).catch(function () { more.disabled = false; });
          return;
        }
        var btn = event.target.closest && event.target.closest('[data-card-action]');
        if (!btn) return;
        var id = btn.getAttribute('data-card-id');
        var action = btn.getAttribute('data-card-action');
        var found = (detail.cards || []).find(function (row) { return row.id === id; });
        if (action === 'edit') { openCardEditor(api, set.id, found || { id: id }); return; }
        if (action === 'delete') {
          ui().confirmDialog({
            title: t('deleteCardTitle'),
            body: t('deleteCardBody'),
            confirmLabel: t('deleteCard'),
            cancelLabel: t('cancel'),
            danger: true
          }).then(function (ok) {
            if (!ok) return;
            api.deleteCard(id).then(function () { toast(t('toastDeleted')); location.reload(); });
          });
          return;
        }
        if (action === 'toggle') {
          api.updateCard({ id: id, suspended: btn.getAttribute('data-suspended') !== '1' }).then(function () {
            toast(t('toastSuspended'));
            location.reload();
          });
        }
      });
      return;
    }

    node.innerHTML = sectionHead(t('setsTitle'), t('setsLede'), true) + skeleton();
    var listed = await api.listSets();
    var sets = listed.sets || [];
    node.innerHTML = '<header class="ws-section-head"><div><p class="ws-kicker">Atomurus Pro</p><h1 class="ws-title">' + escapeHtml(t('setsTitle')) +
      ' <span class="ws-badge ws-badge-pro">PRO</span></h1><p class="ws-lede">' + escapeHtml(t('setsLede')) + '</p></div>' +
      '<button type="button" class="ws-btn ws-btn-primary" id="app-set-open">' + escapeHtml(t('newSet')) + '</button></header>' +
      (sets.length
        ? '<div class="ws-toolbar"><input class="ws-search-field" id="ws-set-q" type="search" aria-label="' + escapeHtml(t('search')) + '"></div><div class="ws-grid ws-grid-2" id="ws-set-list">' + sets.map(setCard).join('') + '</div>'
        : emptyState(t('emptySetsTitle'), t('emptySetsBody'), null, t('firstSet')));
    var opener = $('app-set-open') || node.querySelector('.ws-empty .ws-btn');
    function bindCreate() { openCreateSetDialog(api); }
    if ($('app-set-open')) $('app-set-open').addEventListener('click', bindCreate);
    var emptyBtn = node.querySelector('.ws-empty');
    if (emptyBtn && !sets.length) {
      var cta = document.createElement('button');
      cta.type = 'button';
      cta.className = 'ws-btn ws-btn-primary';
      cta.textContent = t('firstSet');
      cta.addEventListener('click', bindCreate);
      emptyBtn.appendChild(cta);
    }
    var setSearch = $('ws-set-q');
    if (setSearch) {
      setSearch.placeholder = t('search');
      setSearch.addEventListener('input', debounce(function () {
        var q = (setSearch.value || '').toLowerCase();
        var list = $('ws-set-list');
        if (!list) return;
        var next = sets.filter(function (entry) {
          if (!q) return true;
          return ((entry.title || '') + ' ' + (entry.description || '')).toLowerCase().indexOf(q) !== -1;
        });
        list.innerHTML = next.map(setCard).join('');
      }, 200));
    }
  }

  async function renderReviewSection(node, api) {
    node.innerHTML = skeleton();
    var setId = studySetIdFromQuery();
    var overview = await api.reviewOverview();
    var start = String(new URLSearchParams(location.search).get('start') || '');
    if (start === '1' || (setId && start === '1')) {
      var queue = await api.reviewQueue(setId ? { setId: setId, limit: 20 } : { limit: 20 });
      var title = t('reviewTitle');
      if (setId && overview.sets) {
        var found = overview.sets.find(function (entry) { return entry.id === setId; });
        if (found) title = found.title;
      }
      startReviewSession(queue, title);
      return;
    }
    var due = overview.dueNow || 0;
    var minutes = logic().estimateReviewMinutes(due);
    node.innerHTML = sectionHead(t('reviewTitle'), t('lockedReviewBody'), true) +
      '<section class="ws-hero is-ready"><div><h2 class="ws-hero-title">' + escapeHtml(due ? t('reviewReady', '', { n: due }) : t('emptyReviewTitle')) + '</h2>' +
      (due ? '<p class="ws-hero-copy">' + escapeHtml(t('reviewEstimate', '', { n: minutes })) + ' · ' + escapeHtml(t('reviewSeconds')) + '</p>' +
        '<a class="ws-btn ws-btn-primary" href="/app?section=review&start=1' + (setId ? '&set=' + encodeURIComponent(setId) : '') + '">' + escapeHtml(t('startReviewCta')) + '</a>'
        : '<p class="ws-hero-copy">' + escapeHtml(t('emptyReviewBody')) + '</p><a class="ws-btn" href="/app?section=sets">' + escapeHtml(t('openSets')) + '</a>') +
      '</div></section>' +
      '<div class="ws-metrics">' +
      [['dueToday', overview.dueNow || 0], ['metricSets', (overview.sets || []).length], ['metricCards', overview.totalCards || 0], ['mastered', overview.masteredCards || 0]].map(function (row) {
        return '<div class="ws-metric"><div class="ws-metric-value">' + escapeHtml(String(row[1])) + '</div><div class="ws-metric-label">' + escapeHtml(t(row[0])) + '</div></div>';
      }).join('') + '</div>';
  }

  function historyRow(item) {
    var when = logic().formatDate(item.updatedAt, langIsPt() ? 'pt' : 'en');
    var payload = item.payload || {};
    var formula = payload.formula || payload.input || '';
    var result = payload.result || payload.output || '';
    return '<article class="ws-study-item"><div class="ws-item-symbol">Σ</div><div>' +
      '<h3 class="ws-item-title"></h3>' +
      (formula || result ? '<div class="ws-item-meta" data-hist-meta></div>' : '') +
      '<div class="ws-muted">' + escapeHtml(when) + '</div></div>' +
      '<a class="ws-btn ws-btn-sm" href="' + escapeHtml(safeHref(item.href || '/calculators.html')) + '">' + escapeHtml(t('openCalc')) + '</a></article>';
  }

  async function renderHistory(node, api) {
    node.innerHTML = sectionHead(t('historyTitle'), t('historyLede'), true) + skeleton();
    var history = await api.items({ type: 'calculator', limit: 20 });
    var items = history.items || [];
    if (!items.length) {
      node.innerHTML = sectionHead(t('historyTitle'), t('historyLede'), true) +
        emptyState(t('emptyHistoryTitle'), t('emptyHistoryBody'), '/calculators.html', t('openCalculators'));
      return;
    }
    node.innerHTML = sectionHead(t('historyTitle'), t('historyLede'), true) +
      '<div class="ws-grid" id="ws-hist-list">' + items.map(historyRow).join('') + '</div>' +
      (history.nextCursor ? '<button type="button" class="ws-btn" id="ws-hist-more" data-cursor="' + escapeHtml(history.nextCursor) + '">' + escapeHtml(t('loadMore')) + '</button>' : '');
    node.querySelectorAll('#ws-hist-list .ws-study-item').forEach(function (wrap, idx) {
      var item = items[idx];
      if (!item) return;
      wrap.querySelector('.ws-item-title').textContent = item.title || item.itemKey || '';
      var meta = wrap.querySelector('[data-hist-meta]');
      if (meta && item.payload) {
        var bits = [item.payload.formula || item.payload.input, item.payload.result || item.payload.output].filter(Boolean);
        meta.textContent = bits.join(' · ');
      }
    });
    var more = $('ws-hist-more');
    if (more) more.addEventListener('click', function () {
      more.disabled = true;
      api.items({ type: 'calculator', limit: 20, cursor: more.getAttribute('data-cursor') }, true).then(function (page) {
        var list = $('ws-hist-list');
        (page.items || []).forEach(function (item) {
          var wrap = document.createElement('div');
          wrap.innerHTML = historyRow(item);
          var el = wrap.firstChild;
          el.querySelector('.ws-item-title').textContent = item.title || item.itemKey || '';
          list.appendChild(el);
        });
        if (page.nextCursor) { more.setAttribute('data-cursor', page.nextCursor); more.disabled = false; }
        else more.remove();
      }).catch(function () { more.disabled = false; });
    });
  }

  async function renderNotes(node, api) {
    node.innerHTML = sectionHead(t('notesTitle'), t('notesLede'), true) + skeleton();
    var notes = await api.items({ hasNote: '1', limit: 40 });
    var items = notes.items || [];
    if (!items.length) {
      node.innerHTML = sectionHead(t('notesTitle'), t('notesLede'), true) + emptyState(t('emptyNotesTitle'), t('emptyNotesBody'));
      return;
    }
    node.innerHTML = sectionHead(t('notesTitle'), t('notesLede'), true) + '<div class="ws-grid" id="ws-notes-list">' +
      items.map(function (item) {
        var when = logic().relativeTime(item.updatedAt, Date.now(), langIsPt() ? 'pt' : 'en');
        return '<article class="ws-study-item"><div class="ws-item-symbol">' + escapeHtml(itemSymbol(item)) + '</div><div>' +
          '<h3 class="ws-item-title"></h3><div class="ws-item-note"></div><div class="ws-muted">' + escapeHtml(t('edited', '', { when: when })) + '</div></div>' +
          '<a class="ws-btn ws-btn-sm" href="' + escapeHtml(safeHref(item.href)) + '">' + escapeHtml(t('openMaterial')) + '</a></article>';
      }).join('') + '</div>';
    node.querySelectorAll('#ws-notes-list .ws-study-item').forEach(function (wrap, idx) {
      var item = items[idx];
      wrap.querySelector('.ws-item-title').textContent = item.title || item.itemKey || '';
      wrap.querySelector('.ws-item-note').textContent = item.note || '';
    });
  }

  async function renderProgress(node, api) {
    node.innerHTML = sectionHead(t('progressTitle'), t('progressLede'), true) + skeleton();
    var progress = await api.progressList({ limit: 40 });
    var items = progress.items || [];
    node.innerHTML = sectionHead(t('progressTitle'), t('progressLede'), true) +
      (items.length ? '<div class="ws-grid">' + items.map(continueCard).join('') : emptyState(t('emptyProgressTitle'), t('emptyProgressBody')));
  }

  function renderAccount(user) {
    var node = $('app-study');
    if (!node || !user) return;
    var badge = logic().planBadge(user);
    var days = logic().trialDaysLeft(user.trialEndsAt);
    var period = user.billingPeriod === 'year' || user.billingPeriod === 'annual' ? t('annual') : (user.billingPeriod ? t('monthly') : '');
    var currency = user.billingCurrency ? String(user.billingCurrency).toUpperCase() : '';
    var planBlock;
    if (logic().isTrialUser(user)) {
      planBlock = '<h3>' + escapeHtml(t('trialPlan')) + '</h3><p>' + escapeHtml(days == null ? '' : t('trialDays', '', { n: days })) + '</p><a class="ws-btn ws-btn-primary" href="/pricing">' + escapeHtml(t('viewPlans')) + '</a>';
    } else if (proUser(user)) {
      planBlock = '<h3>' + escapeHtml(t('proPlan')) + '</h3><p>' + escapeHtml(t('proActive')) + (period ? ' · ' + escapeHtml(period) : '') + (currency ? ' · ' + escapeHtml(currency) : '') +
        '</p><ul><li>' + escapeHtml(t('adsOff')) + '</li><li>' + escapeHtml(t('cloudOn')) + '</li><li>' + escapeHtml(t('reviewOn')) + '</li></ul>' +
        '<a class="ws-btn ws-btn-primary" href="/pricing">' + escapeHtml(t('managePlan')) + '</a>';
    } else {
      planBlock = '<h3>' + escapeHtml(t('freePlan')) + '</h3><p>' + escapeHtml(t('freePlanBody')) + '</p><a class="ws-btn ws-btn-primary" href="/pricing">' + escapeHtml(t('upgrade')) + '</a>';
    }
    node.innerHTML = sectionHead(t('accountTitle'), displayName(user)) +
      '<div class="ws-grid ws-grid-2"><section class="ws-account-card"><h3>' + escapeHtml(t('profile')) + '</h3>' +
      '<div class="ws-plan-row"><span>' + escapeHtml(t('email')) + '</span><strong></strong></div>' +
      '<div class="ws-plan-row"><span>' + escapeHtml(t('username')) + '</span><span id="ws-acc-user"></span></div>' +
      '<div class="ws-plan-row"><span>' + escapeHtml(t('security')) + '</span><span>' + escapeHtml(user.emailConfirmed ? t('emailConfirmed') : t('emailPending')) + '</span></div>' +
      '</section><section class="ws-account-card" id="ws-plan-card">' + planBlock + '</section></div>';
    var emailRow = node.querySelector('.ws-account-card strong');
    if (emailRow) emailRow.textContent = user.email || '—';
    var userRow = $('ws-acc-user');
    if (userRow) userRow.textContent = user.username || '—';
    void badge;
  }

  function renderFreeOverview(user) {
    var node = $('app-study');
    var name = displayName(user);
    var hour = logic().greetingKey();
    var greet = t(hour === 'morning' ? 'greetingMorning' : hour === 'afternoon' ? 'greetingAfternoon' : 'greetingEvening', '', { name: name });
    node.innerHTML = '<p class="ws-kicker">Atomurus</p><h1 class="ws-title">' + escapeHtml(greet) + '</h1><p class="ws-lede">' + escapeHtml(t('greetingFallback')) + '</p>' +
      '<section class="ws-hero"><div><h2 class="ws-hero-title">' + escapeHtml(t('lockedReviewTitle')) + '</h2><p class="ws-hero-copy">' + escapeHtml(t('lockedReviewBody')) + '</p>' +
      '<a class="ws-btn ws-btn-primary" href="/pricing">' + escapeHtml(t('upgrade')) + '</a></div></section>' +
      '<div class="ws-grid ws-grid-3">' +
      lockedState('lockedLibraryTitle', 'lockedLibraryBody') +
      lockedState('lockedSetsTitle', 'lockedSetsBody') +
      lockedState('lockedReviewTitle', 'lockedReviewBody') +
      '</div>';
  }

  async function loadStudyCloud(user) {
    renderNav(user);
    var node = $('app-study');
    if (!node) return;
    var section = studySection();
    if (section === 'account') {
      renderAccount(user);
      return;
    }
    if (!proUser(user)) {
      if (section === 'overview') renderFreeOverview(user);
      else showStudyLocked(node);
      return;
    }
    var api = window.AtomurusStudy;
    if (!api) {
      node.innerHTML = emptyState(t('loadError'), '');
      return;
    }
    try {
      if (section === 'overview') { await renderOverview(node, api, user); return; }
      if (section === 'library') { await renderLibrary(node, api); return; }
      if (section === 'sets') { await renderSetsSection(node, api); return; }
      if (section === 'review') { await renderReviewSection(node, api); return; }
      if (section === 'history') { await renderHistory(node, api); return; }
      if (section === 'notes') { await renderNotes(node, api); return; }
      await renderProgress(node, api);
    } catch (err) {
      friendlyCatch(node, err);
    }
  }

  function markReady() {
    document.documentElement.classList.remove('auth-pending');
    document.documentElement.classList.add('auth-ready');
  }

  function showError() {
    var loading = $('app-loading');
    var error = $('app-error');
    if (loading) loading.style.display = 'none';
    if (error) error.classList.add('show');
    document.documentElement.classList.remove('auth-pending');
    document.documentElement.classList.add('auth-error');
  }

  async function doLogout(event) {
    if (event) event.preventDefault();
    var client = auth();
    if (client) {
      try { await client.logout(); } catch (_err) {}
      client.redirectToLogin(location.pathname + location.search);
      return;
    }
    window.location.replace('/login?next=' + encodeURIComponent('/app'));
  }

  function initNavChrome() {
    var btn = $('ws-menu-btn');
    var shell = $('ws-shell');
    var backdrop = $('ws-drawer-backdrop');
    function close() {
      if (shell) shell.classList.remove('is-nav-open');
      if (btn) btn.setAttribute('aria-expanded', 'false');
      if (backdrop) backdrop.hidden = true;
    }
    function open() {
      if (shell) shell.classList.add('is-nav-open');
      if (btn) btn.setAttribute('aria-expanded', 'true');
      if (backdrop) backdrop.hidden = false;
    }
    if (btn) btn.addEventListener('click', function () {
      if (shell && shell.classList.contains('is-nav-open')) close(); else open();
    });
    if (backdrop) backdrop.addEventListener('click', close);
  }

  async function loadWorkspace() {
    var client = auth();
    if (!client) {
      window.location.replace('/login?next=' + encodeURIComponent('/app'));
      return;
    }
    try {
      await client.requireSession({ next: workspaceNext() });
      var dash = await fetch('/api/private/dashboard', { credentials: 'include', headers: { Accept: 'application/json' } }).then(function (res) {
        return res.json().then(function (data) {
          if (!res.ok || data.ok === false) {
            var err = new Error(data.error || 'Request failed');
            err.status = res.status;
            err.code = data.code;
            throw err;
          }
          return data;
        });
      });
      var user = dash.user || client.getCurrentUser() || {};
      await loadStudyCloud(user);
      var loading = $('app-loading');
      if (loading) loading.style.display = 'none';
      markReady();
    } catch (err) {
      if (err && (err.status === 401 || err.status === 404 || err.code === 'session_expired')) {
        client.redirectToLogin(workspaceNext());
        return;
      }
      showError();
    }
  }

  function boot() {
    initNavChrome();
    void loadWorkspace();
  }

  window.addEventListener('pageshow', function (event) {
    if (!event.persisted) return;
    var client = auth();
    if (!client) return;
    client.getSession({ force: true }).then(function (session) {
      if (!session.signedIn) client.redirectToLogin(workspaceNext());
    }).catch(function (err) {
      if (err && (err.status === 0 || err.code === 'network' || err.status >= 500)) return;
      client.redirectToLogin(workspaceNext());
    });
  });

  document.addEventListener('DOMContentLoaded', boot);
})();
