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
      dueHeroTitle: '{n} cards ready for review', dueHeroTitleOne: '{n} card ready for review',
      dueHeroCopy: 'Keep your memory fresh with a quick session.',
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
      cardsCount: '{n} cards', cardsCountOne: '{n} card', dueCount: '{n} due', dueCountOne: '{n} due', masteredPct: '{n}% mastered', lastUpdated: 'Updated {when}',
      startReviewSet: 'Start Review', addCard: 'Add Card', materials: 'Materials', flashcards: 'Flashcards',
      emptySetItems: 'Add saved library items to this set.', emptyCards: 'No flashcards yet.',
      front: 'Front', back: 'Back', saveCard: 'Save flashcard', edit: 'Edit', suspend: 'Suspend',
      resume: 'Resume', delete: 'Delete', dueWhen: 'Due {when}',
      genCreated: '{n} flashcards created', genNone: 'No new cards were needed. These flashcards already exist in this Study Set.',
      genEmpty: 'Add an element or molecule first, then generate cards.',
      genPickSet: 'Choose a Study Set. We’ll generate flashcards next.',
      filterEmptyTitle: 'No matching items.', filterEmptyBody: 'Try another search, type or tag.',
      exitReview: 'Exit', reviewAgain: 'Review again',
      removeFromSetTitle: 'Remove this material from the set?',
      removeFromSetBody: 'The Library item stays saved. Flashcards already generated in this set stay until you delete them.',
      contactBilling: 'Contact about billing', resetPassword: 'Reset password',
      skipToContent: 'Skip to content', toastCard: 'Flashcard saved', calculatorType: 'Calculator',
      deleteSetTitle: 'Delete “{title}”?', deleteSetBody: 'Its flashcards will be deleted. Your saved Library items will not be removed.',
      deleteSet: 'Delete Study Set', deleteCardTitle: 'Delete this flashcard?', deleteCardBody: 'This cannot be undone.',
      deleteCard: 'Delete flashcard', deleteItemTitle: 'Remove saved item?', deleteItemBody: 'This removes it from your Library. Study Sets keep their own copies of generated cards.',
      remove: 'Remove',
      reviewTitle: 'Smart Review', reviewReady: '{n} cards are ready.', reviewReadyOne: '{n} card is ready.', reviewEstimate: 'Estimated session: ~{n} minutes', reviewEstimateOne: 'Estimated session: ~{n} minute',
      reviewSeconds: '~20 seconds/card', startReviewCta: 'Start review',
      showAnswer: 'Show answer', again: 'Again', hard: 'Hard', good: 'Good', easy: 'Easy',
      reviewHint: 'Space reveal · 1 Again · 2 Hard · 3 Good · 4 Easy',
      reviewOf: '{a} / {b}', reviewComplete: 'Review complete', reviewed: '{n} cards reviewed', reviewedOne: '{n} card reviewed',
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
      managePlan: 'Manage subscription', viewPlans: 'View plans', manageBilling: 'Manage billing',
      openingPortal: 'Opening portal…',
      billingCustomerMissing: 'This account has no Stripe subscription to manage yet.',
      freePlan: 'Atomurus Free', freePlanBody: 'Public chemistry tools are available.',
      trialPlan: 'Atomurus Pro Trial', trialDays: '{n} days remaining',
      proPlan: 'Atomurus Pro', annual: 'Annual', monthly: 'Monthly',
      activeUntil: 'Active until {when}',
      cancelsOn: 'Cancels on {when}',
      wontRenew: 'Your subscription will not renew.',
      paymentIssue: 'Payment issue',
      paymentIssueBody: 'Update your payment method to keep Pro active.',
      genPartial: 'Added to Study Set, but flashcards could not be generated.',
      tryGenerate: 'Try generating again',
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
      signInAgain: 'Sign in',
      proLab: 'Pro Lab', proLabKicker: 'Pro Lab',
      proLabLede: 'Advanced chemistry tools for deeper study.',
      labCalc: 'Advanced Calculations', labCalcLede: 'Compare scenarios and save sessions.',
      labElements: 'Element Compare', labElementsLede: 'Analyze multiple elements together.',
      labMolecules: 'Molecule Compare', labMoleculesLede: 'Compare molecular composition.',
      labAtomic: 'Atomic Compare', labAtomicLede: 'Compare electronic structures.',
      labSessions: 'Saved Lab Sessions', labSessionsLede: 'Reopen analyses you saved in Pro Lab.',
      emptySessions: 'No saved lab sessions yet.',
      labLockedBody: 'Advanced analysis tools are included with Atomurus Pro.',
      labLockedTeaser: 'Advanced analysis tools.',
      continueLab: 'Continue your advanced chemistry work.',
      openProLab: 'Open Pro Lab', seePro: 'See Pro',
      insights: 'Study Insights', insightsLede: 'See how your chemistry study is progressing.',
      insightsLockedTitle: 'Study Insights',
      insightsLockedBody: 'Understand how your study is progressing.',
      insightsLocked1: 'Review activity', insightsLocked2: 'Weak cards',
      insightsLocked3: 'Study consistency', insightsLocked4: 'Due forecast',
      insightsLocked5: 'Performance by Study Set',
      range7d: '7 days', range30d: '30 days',
      metricReviews: 'Reviews', activeDays: 'Active days', cardsDue: 'Cards due',
      confidentReviews: 'Confident reviews',
      confidentTip: 'Share of reviews rated Good or Easy.',
      ratingsTitle: 'Review ratings',
      activityTitle: 'Reviews by day',
      consistencyCopy: '{active} of the last {days} days',
      dueForecastTitle: 'Next 7 days', forecastToday: 'Today', forecastTomorrow: 'Tomorrow',
      needsAttention: 'Needs attention', startFocusReview: 'Start Focus Review',
      lapsesCount: '{n} lapses', lapsesCountOne: '{n} lapse', dueNowLabel: 'Due now',
      emptyInsightsTitle: 'Your study insights will appear here.',
      emptyInsightsBody: 'Start reviewing flashcards to build your study history.',
      insightsError: "Study Insights couldn't load.",
      allSets: 'All Study Sets', focusTitle: 'Focus Review',
      emptyFocusTitle: 'Nothing needs extra attention right now.',
      emptyFocusBody: 'Your cards are in good shape.',
      openSmartReview: 'Open Smart Review', dueReview: 'Due review',
      weakReview: 'Needs attention', reviewWeakCards: 'Review weak cards',
      readyToStudy: 'Ready to study?', dueTodayHero: '{n} cards are due today.', dueTodayHeroOne: '{n} card is due today.',
      caughtUpExplore: 'Explore your Study Sets or review cards that need attention.',
      workspaceFreeTitle: 'Your chemistry workspace',
      publicLabRemainsFree: 'The public lab remains free.',
      upgradeFor: 'Upgrade to Pro for:',
      upgradeForList: 'Library · Study Sets · Smart Review · Insights · Pro Lab',
      explorePro: 'Explore Pro', openTable: 'Periodic Table',
      openViewer: 'Viewer', openExplore: 'Explore',
      masteredTip: 'Cards with a review interval at or above the mastery threshold.',
      setProgress: 'Progress', learningCount: 'Learning {n}', newCount: 'New {n}',
      weekdayMon: 'Mon', weekdayTue: 'Tue', weekdayWed: 'Wed', weekdayThu: 'Thu',
      weekdayFri: 'Fri', weekdaySat: 'Sat', weekdaySun: 'Sun',
      deleteSessionTitle: 'Delete this Lab Session?',
      deleteSessionBody: 'This cannot be undone.',
      sessionOpen: 'Open', moreActions: 'More',
      reviewCta: 'Review',
      reviewShort: 'Review', labShort: 'Lab',
      stateNew: 'New', stateLearning: 'Learning', stateReview: 'Review',
      focusCards: '{n} cards',
      navGroupStudy: 'Study', navGroupLab: 'Lab', navGroupActivity: 'Activity',
      focusLandingBody: 'Review the cards that need the most attention.',
      insightsOn: 'Study Insights unlocked', focusOn: 'Focus Review unlocked',
      openInsights: 'Open Insights',
      publicCalc: 'Calculators',
      addScenario: '+ Add scenario', calculateAll: 'Calculate all', saveSession: 'Save session',
      sessionTitle: 'Session title', sessionSaved: 'Lab session saved',
      pinResult: 'Pin result', pinned: 'Pinned', calculated: 'Results updated.',
      formula: 'Formula', atomCount: 'Atom count', labMolarMass: 'Molar mass',
      labDilution: 'Dilution', labIdealGas: 'Ideal gas', labPh: 'pH / pOH',
      scenarioName: 'Scenario', solveFor: 'Solve for', mode: 'Mode', solved: 'Solved', nature: 'Nature',
      addElement: 'Add element', customProperties: 'Properties', compare: 'Compare',
      addElementsToSet: 'Add selected elements to Study Set', generateFlashcards: 'Generate flashcards',
      property: 'Property', chartProperty: 'Chart property',
      atomicNo: 'Atomic no.', symbol: 'Symbol', name: 'Name', latin: 'Latin',
      atomicMass: 'Atomic mass', period: 'Period', groupEl: 'Group', category: 'Category',
      electronegativity: 'Electronegativity', state: 'State', electronConfig: 'Electron configuration',
      shells: 'Shells', meltingPoint: 'Melting point', boilingPoint: 'Boiling point',
      density: 'Density', atomicRadius: 'Atomic radius', ionizationEnergy: 'Ionization energy',
      molecule: 'Molecule', selectMolecule: 'Select molecule', highlightElement: 'Highlight element',
      addBothToSet: 'Add both to Study Set',
      noBondMeasure: '3D models are for visualization. Bond lengths and angles are not measured as experimental values.'
    },
    pt: {
      overview: 'Visão geral', library: 'Biblioteca', sets: 'Study Sets', review: 'Smart Review',
      history: 'Histórico', notes: 'Notas', progress: 'Continuar estudando',
      account: 'Conta', plan: 'Plano', logout: 'Sair', upgrade: 'Assinar o Pro',
      menu: 'Menu', workspaceTag: 'workspace de estudo',
      greetingMorning: 'Bom dia, {name}', greetingAfternoon: 'Boa tarde, {name}',
      greetingEvening: 'Boa noite, {name}', greetingFallback: 'Pronto para a próxima sessão?',
      dueHeroTitle: '{n} cards prontos para revisar', dueHeroTitleOne: '{n} card pronto para revisar',
      dueHeroCopy: 'Mantenha a memória fresca com uma sessão rápida.',
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
      cardsCount: '{n} cards', cardsCountOne: '{n} card', dueCount: '{n} vencidos', dueCountOne: '{n} vencido', masteredPct: '{n}% dominados', lastUpdated: 'Atualizado {when}',
      startReviewSet: 'Começar revisão', addCard: 'Adicionar card', materials: 'Materiais', flashcards: 'Flashcards',
      emptySetItems: 'Adicione itens da Biblioteca a este set.', emptyCards: 'Nenhum flashcard ainda.',
      front: 'Frente', back: 'Verso', saveCard: 'Salvar flashcard', edit: 'Editar', suspend: 'Suspender',
      resume: 'Retomar', delete: 'Excluir', dueWhen: 'Vence {when}',
      genCreated: '{n} flashcards criados', genNone: 'Nenhum card novo era necessário. Esses flashcards já existem neste Study Set.',
      genEmpty: 'Adicione um elemento ou molécula e depois gere os cards.',
      genPickSet: 'Escolha um Study Set. Em seguida geramos os flashcards.',
      filterEmptyTitle: 'Nenhum item corresponde.', filterEmptyBody: 'Tente outra busca, tipo ou tag.',
      exitReview: 'Sair', reviewAgain: 'Revisar de novo',
      removeFromSetTitle: 'Remover este material do set?',
      removeFromSetBody: 'O item permanece na Biblioteca. Flashcards já gerados neste set ficam até você apagá-los.',
      contactBilling: 'Falar sobre cobrança', resetPassword: 'Redefinir senha',
      skipToContent: 'Pular para o conteúdo', toastCard: 'Flashcard salvo', calculatorType: 'Calculadora',
      deleteSetTitle: 'Excluir “{title}”?', deleteSetBody: 'Os flashcards serão apagados. Os itens da Biblioteca permanecem.',
      deleteSet: 'Excluir Study Set', deleteCardTitle: 'Excluir este flashcard?', deleteCardBody: 'Isso não pode ser desfeito.',
      deleteCard: 'Excluir flashcard', deleteItemTitle: 'Remover item salvo?', deleteItemBody: 'Ele sai da Biblioteca. Cards já gerados nos Study Sets permanecem.',
      remove: 'Remover',
      reviewTitle: 'Smart Review', reviewReady: '{n} cards estão prontos.', reviewReadyOne: '{n} card está pronto.', reviewEstimate: 'Sessão estimada: ~{n} minutos', reviewEstimateOne: 'Sessão estimada: ~{n} minuto',
      reviewSeconds: '~20 segundos/card', startReviewCta: 'Começar revisão',
      showAnswer: 'Mostrar resposta', again: 'De novo', hard: 'Difícil', good: 'Bom', easy: 'Fácil',
      reviewHint: 'Espaço revela · 1 De novo · 2 Difícil · 3 Bom · 4 Fácil',
      reviewOf: '{a} / {b}', reviewComplete: 'Revisão concluída', reviewed: '{n} cards revisados', reviewedOne: '{n} card revisado',
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
      managePlan: 'Gerenciar assinatura', viewPlans: 'Ver planos', manageBilling: 'Gerenciar cobrança',
      openingPortal: 'Abrindo o portal…',
      billingCustomerMissing: 'Esta conta ainda não tem uma assinatura Stripe para gerenciar.',
      freePlan: 'Atomurus Free', freePlanBody: 'Ferramentas públicas de química estão disponíveis.',
      trialPlan: 'Atomurus Pro Trial', trialDays: '{n} dias restantes',
      proPlan: 'Atomurus Pro', annual: 'Anual', monthly: 'Mensal',
      activeUntil: 'Ativo até {when}',
      cancelsOn: 'Cancela em {when}',
      wontRenew: 'Sua assinatura não será renovada.',
      paymentIssue: 'Problema no pagamento',
      paymentIssueBody: 'Atualize a forma de pagamento para manter o Pro ativo.',
      genPartial: 'Adicionado ao Study Set, mas não foi possível gerar os flashcards.',
      tryGenerate: 'Tentar gerar novamente',
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
      signInAgain: 'Entrar',
      proLab: 'Pro Lab', proLabKicker: 'Pro Lab',
      proLabLede: 'Ferramentas avançadas de química para estudo mais profundo.',
      labCalc: 'Cálculos avançados', labCalcLede: 'Compare cenários e salve sessões.',
      labElements: 'Comparar elementos', labElementsLede: 'Analise vários elementos juntos.',
      labMolecules: 'Comparar moléculas', labMoleculesLede: 'Compare a composição molecular.',
      labAtomic: 'Comparar átomos', labAtomicLede: 'Compare estruturas eletrônicas.',
      labSessions: 'Sessões salvas do Lab', labSessionsLede: 'Reabra análises salvas no Pro Lab.',
      emptySessions: 'Nenhuma sessão de laboratório salva ainda.',
      labLockedBody: 'Ferramentas avançadas de análise fazem parte do Atomurus Pro.',
      labLockedTeaser: 'Ferramentas avançadas de análise.',
      continueLab: 'Continue seu trabalho avançado de química.',
      openProLab: 'Abrir Pro Lab', seePro: 'Ver Pro',
      insights: 'Insights de Estudo', insightsLede: 'Veja como seu estudo de química está evoluindo.',
      insightsLockedTitle: 'Insights de Estudo',
      insightsLockedBody: 'Entenda como seu estudo está evoluindo.',
      insightsLocked1: 'Atividade de revisão', insightsLocked2: 'Cards fracos',
      insightsLocked3: 'Consistência de estudo', insightsLocked4: 'Previsão de vencimentos',
      insightsLocked5: 'Desempenho por Study Set',
      range7d: '7 dias', range30d: '30 dias',
      metricReviews: 'Revisões', activeDays: 'Dias ativos', cardsDue: 'Cards vencidos',
      confidentReviews: 'Revisões confiantes',
      confidentTip: 'Proporção de revisões avaliadas como Bom ou Fácil.',
      ratingsTitle: 'Avaliações',
      activityTitle: 'Revisões por dia',
      consistencyCopy: '{active} dos últimos {days} dias',
      dueForecastTitle: 'Próximos 7 dias', forecastToday: 'Hoje', forecastTomorrow: 'Amanhã',
      needsAttention: 'Precisa de atenção', startFocusReview: 'Começar Focus Review',
      lapsesCount: '{n} lapses', lapsesCountOne: '{n} lapse', dueNowLabel: 'Vence agora',
      emptyInsightsTitle: 'Seus insights de estudo aparecem aqui.',
      emptyInsightsBody: 'Comece a revisar flashcards para montar seu histórico.',
      insightsError: 'Não foi possível carregar os Insights de Estudo.',
      allSets: 'Todos os Study Sets', focusTitle: 'Focus Review',
      emptyFocusTitle: 'Nada precisa de atenção extra agora.',
      emptyFocusBody: 'Seus cards estão em boa forma.',
      openSmartReview: 'Abrir Smart Review', dueReview: 'Revisão vencida',
      weakReview: 'Precisa de atenção', reviewWeakCards: 'Revisar cards fracos',
      readyToStudy: 'Pronto para estudar?', dueTodayHero: '{n} cards vencem hoje.', dueTodayHeroOne: '{n} card vence hoje.',
      caughtUpExplore: 'Explore seus Study Sets ou revise cards que precisam de atenção.',
      workspaceFreeTitle: 'Seu workspace de química',
      publicLabRemainsFree: 'O laboratório público continua gratuito.',
      upgradeFor: 'Assine o Pro para:',
      upgradeForList: 'Biblioteca · Study Sets · Smart Review · Insights · Pro Lab',
      explorePro: 'Conhecer o Pro', openTable: 'Tabela Periódica',
      openViewer: 'Visualizador', openExplore: 'Explorar',
      masteredTip: 'Cards com intervalo de revisão no limiar de domínio ou acima.',
      setProgress: 'Progresso', learningCount: 'Aprendendo {n}', newCount: 'Novos {n}',
      weekdayMon: 'seg', weekdayTue: 'ter', weekdayWed: 'qua', weekdayThu: 'qui',
      weekdayFri: 'sex', weekdaySat: 'sáb', weekdaySun: 'dom',
      deleteSessionTitle: 'Excluir esta sessão do Lab?',
      deleteSessionBody: 'Isso não pode ser desfeito.',
      sessionOpen: 'Abrir', moreActions: 'Mais',
      reviewCta: 'Revisar',
      reviewShort: 'Revisão', labShort: 'Lab',
      stateNew: 'Novo', stateLearning: 'Aprendendo', stateReview: 'Revisão',
      focusCards: '{n} cards',
      navGroupStudy: 'Estudo', navGroupLab: 'Lab', navGroupActivity: 'Atividade',
      focusLandingBody: 'Revise os cards que mais precisam de atenção.',
      insightsOn: 'Insights de Estudo liberados', focusOn: 'Focus Review liberado',
      openInsights: 'Abrir Insights',
      publicCalc: 'Calculadoras',
      addScenario: '+ Adicionar cenário', calculateAll: 'Calcular todos', saveSession: 'Salvar sessão',
      sessionTitle: 'Título da sessão', sessionSaved: 'Sessão do Lab salva',
      pinResult: 'Fixar resultado', pinned: 'Fixados', calculated: 'Resultados atualizados.',
      formula: 'Fórmula', atomCount: 'Número de átomos', labMolarMass: 'Massa molar',
      labDilution: 'Diluição', labIdealGas: 'Gás ideal', labPh: 'pH / pOH',
      scenarioName: 'Cenário', solveFor: 'Resolver', mode: 'Modo', solved: 'Resolvido', nature: 'Natureza',
      addElement: 'Adicionar elemento', customProperties: 'Propriedades', compare: 'Comparar',
      addElementsToSet: 'Adicionar elementos ao Study Set', generateFlashcards: 'Gerar flashcards',
      property: 'Propriedade', chartProperty: 'Propriedade do gráfico',
      atomicNo: 'Nº atômico', symbol: 'Símbolo', name: 'Nome', latin: 'Latim',
      atomicMass: 'Massa atômica', period: 'Período', groupEl: 'Grupo', category: 'Categoria',
      electronegativity: 'Eletronegatividade', state: 'Estado', electronConfig: 'Configuração eletrônica',
      shells: 'Camadas', meltingPoint: 'Ponto de fusão', boilingPoint: 'Ponto de ebulição',
      density: 'Densidade', atomicRadius: 'Raio atômico', ionizationEnergy: 'Energia de ionização',
      molecule: 'Molécula', selectMolecule: 'Selecionar molécula', highlightElement: 'Destacar elemento',
      addBothToSet: 'Adicionar as duas ao Study Set',
      noBondMeasure: 'Os modelos 3D são para visualização. Comprimentos e ângulos de ligação não são medidos como valores experimentais.'
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

  function tCount(manyKey, oneKey, n) {
    var count = Number(n) || 0;
    var key = logic().pickCountKey ? logic().pickCountKey(count, oneKey, manyKey) : (count === 1 ? oneKey : manyKey);
    return t(key, '', { n: count });
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

  function typeLabel(type) {
    var key = logic().libraryTypeLabel ? logic().libraryTypeLabel(type) : String(type || '').toLowerCase();
    if (key === 'element') return t('elements');
    if (key === 'molecule') return t('molecules');
    if (key === 'article') return t('articles');
    if (key === 'calculator') return t('calculatorType');
    return type || '';
  }

  function toastGenerate(fb) {
    if (fb.kind === 'created') toast(t('genCreated', '', { n: fb.created }));
    else if (fb.kind === 'noneNeeded') toast(t('genNone'), 'info');
    else toast(t('genEmpty'), 'info');
  }

  function afterAddedToSet(api, node, itemId, setId, thenGenerate) {
    var generate = node && node.querySelector('[data-generate-item="' + itemId + '"]');
    if (generate) generate.setAttribute('data-set-id', setId);
    toast(t('toastAdded'));
    if (!thenGenerate) return Promise.resolve();
    if (generate) ui().setBusy(generate, true, t('generating'));
    return api.generateCards({ setId: setId, itemId: itemId }).then(function (data) {
      if (generate) ui().setBusy(generate, false);
      toastGenerate(logic().generateCardsFeedback(data));
    }).catch(function (err) {
      if (generate) ui().setBusy(generate, false);
      if (ui().toast) {
        ui().toast(t('genPartial'), {
          tone: 'danger',
          ms: 8000,
          actionLabel: t('tryGenerate'),
          onAction: function () {
            if (generate) generate.click();
            else api.generateCards({ setId: setId, itemId: itemId }).then(function (data) {
              toastGenerate(logic().generateCardsFeedback(data));
            }).catch(function (retryErr) {
              toast(t(logic().uxError(retryErr).bodyKey), 'danger');
            });
          }
        });
      } else {
        toast(t('genPartial'), 'danger');
      }
    });
  }

  function bindCursorMore(btn, loadPage, onItems) {
    if (!btn) return;
    btn.addEventListener('click', function () {
      var cursor = btn.getAttribute('data-cursor');
      btn.disabled = true;
      loadPage(cursor).then(function (page) {
        onItems(page);
        if (page.nextCursor) {
          btn.setAttribute('data-cursor', page.nextCursor);
          btn.disabled = false;
        } else btn.remove();
      }).catch(function () { btn.disabled = false; });
    });
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
  function reviewStartHref(id) { return logic().reviewStartHref(id); }
  function focusReviewHref(id, limit) { return logic().focusReviewHref ? logic().focusReviewHref(id, limit) : '/app?section=review&start=1&mode=weak'; }
  function safeHref(value) { return logic().safeHref(value, '/app'); }

  function icon(name) {
    var paths = {
      overview: '<path d="M3 3h4v4H3zM9 3h4v4H9zM3 9h4v4H3zM9 9h4v4H9z"/>',
      library: '<path d="M3 3h3v10H3zM7 5h3v8H7zM11 4h3v9h-3z"/>',
      sets: '<path d="M3 5h10M3 8h10M3 11h10M5 3v10"/>',
      review: '<path d="M8 2.5a5.5 5.5 0 1 1-4.6 2.5M8 5v3.5L10 10"/>',
      insights: '<path d="M3 12V8M6.5 12V5M10 12V7M13 12V3"/>',
      'pro-lab': '<path d="M5 2h6l1 3H4zM5 5v7h6V5M6.5 8v2.5M9.5 8v2.5"/>',
      history: '<path d="M8 3v5l3 2M3.5 8a4.5 4.5 0 1 0 1-2.8"/>',
      notes: '<path d="M4 3h6l3 3v7H4zM10 3v3h3"/>',
      progress: '<path d="M3 12l4-4 2 2 4-6"/>',
      account: '<path d="M8 8a2.5 2.5 0 1 0 0-5 2.5 2.5 0 0 0 0 5zM3.5 13.5c.6-2.2 2.3-3.5 4.5-3.5s3.9 1.3 4.5 3.5"/>',
      plan: '<path d="M4 5h8v8H4zM6 3v2M10 3v2"/>',
      lock: '<path d="M5 7V5.5a3 3 0 0 1 6 0V7M4 7h8v6H4z"/>',
      logout: '<path d="M6 3H3.5A1.5 1.5 0 0 0 2 4.5v7A1.5 1.5 0 0 0 3.5 13H6M10 11l3-3-3-3M13 8H6"/>'
    };
    return '<svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true"><g stroke="currentColor" stroke-width="1.3" stroke-linecap="round" stroke-linejoin="round" fill="none">' + (paths[name] || paths.overview) + '</g></svg>';
  }

  var NAV_GROUPS = [
    {
      key: 'navGroupStudy',
      items: [
        ['overview', 'overview'],
        ['library', 'library'],
        ['sets', 'sets'],
        ['review', 'review'],
        ['insights', 'insights']
      ]
    },
    { key: 'navGroupLab', items: [['pro-lab', 'proLab']] },
    {
      key: 'navGroupActivity',
      items: [
        ['history', 'history'],
        ['notes', 'notes'],
        ['progress', 'progress']
      ]
    }
  ];

  function proUser(user) { return logic().isProUser(user); }

  function renderNav(user) {
    var current = studySection();
    var badge = logic().planBadge(user);
    var main = $('ws-nav-main');
    var foot = $('ws-nav-foot');
    var bottom = $('ws-bottom');
    if (main) {
      main.innerHTML = NAV_GROUPS.map(function (group) {
        return '<div class="ws-nav-block"><h2 class="ws-nav-group">' + escapeHtml(t(group.key)) + '</h2>' +
          group.items.map(function (pair) {
            var active = pair[0] === current ? ' is-active' : '';
            var meta = proUser(user) ? '' : '<span class="ws-nav-meta">' + escapeHtml(t('pro')) + '</span>';
            return '<a class="ws-nav-item' + active + '" href="/app?section=' + pair[0] + '">' +
              icon(pair[0]) + '<span class="ws-nav-label">' + escapeHtml(t(pair[1])) + '</span>' + meta + '</a>';
          }).join('') + '</div>';
      }).join('');
    }
    if (foot) {
      var upgrade = proUser(user) ? '' :
        '<a class="ws-nav-item is-upgrade" href="/pricing">' + icon('plan') + '<span class="ws-nav-label">' + escapeHtml(t('upgrade')) + '</span></a>';
      foot.innerHTML =
        '<a class="ws-nav-item' + (current === 'account' ? ' is-active' : '') + '" href="/app?section=account">' + icon('account') + '<span class="ws-nav-label">' + escapeHtml(t('account')) + '</span></a>' +
        '<a class="ws-nav-item" href="/pricing">' + icon('plan') + '<span class="ws-nav-label">' + escapeHtml(t('plan')) + '</span></a>' +
        '<button type="button" class="ws-nav-item" id="app-logout-aside">' + icon('logout') + '<span class="ws-nav-label">' + escapeHtml(t('logout')) + '</span></button>' +
        upgrade;
      var aside = $('app-logout-aside');
      if (aside) aside.addEventListener('click', doLogout);
    }
    if (bottom) {
      var primary = [['overview', 'overview'], ['library', 'library'], ['review', 'reviewShort'], ['pro-lab', 'labShort'], ['account', 'account']];
      bottom.innerHTML = primary.map(function (pair) {
        return '<a class="' + (pair[0] === current ? 'is-active' : '') + '" href="/app?section=' + pair[0] + '">' + icon(pair[0]) + '<span>' + escapeHtml(t(pair[1])) + '</span></a>';
      }).join('');
    }
    var skip = $('ws-skip');
    if (skip) skip.textContent = t('skipToContent');
    var mainNav = $('ws-nav-main');
    if (mainNav) mainNav.setAttribute('aria-label', t('workspaceTag'));
    var bottomNav = $('ws-bottom');
    if (bottomNav) bottomNav.setAttribute('aria-label', t('workspaceTag'));
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
      insights: ['insightsLockedTitle', 'insightsLockedBody'],
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
    if (btn) btn.addEventListener('click', function () {
      if (currentUser) void loadStudyCloud(currentUser);
    });
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
  var insightsSeq = 0;
  var reviewBusy = false;
  var pendingGrade = null;
  var currentUser = null;

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
      if (reviewSession.cards && reviewSession.cards.length) renderReviewComplete(root);
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
      '<p>' + escapeHtml(tCount('reviewed', 'reviewedOne', total)) + '</p>' +
      '<div class="ws-metrics" style="grid-template-columns:repeat(4,minmax(0,1fr))">' +
      '<div class="ws-metric"><div class="ws-metric-value">' + escapeHtml(String(stats.good || 0)) + '</div><div class="ws-metric-label">' + escapeHtml(t('good')) + '</div></div>' +
      '<div class="ws-metric"><div class="ws-metric-value">' + escapeHtml(String(stats.easy || 0)) + '</div><div class="ws-metric-label">' + escapeHtml(t('easy')) + '</div></div>' +
      '<div class="ws-metric"><div class="ws-metric-value">' + escapeHtml(String(stats.hard || 0)) + '</div><div class="ws-metric-label">' + escapeHtml(t('hard')) + '</div></div>' +
      '<div class="ws-metric"><div class="ws-metric-value">' + escapeHtml(String(stats.again || 0)) + '</div><div class="ws-metric-label">' + escapeHtml(t('again')) + '</div></div>' +
      '</div><p class="ws-row-actions" style="justify-content:center"><a class="ws-btn ws-btn-primary" href="' + escapeHtml(reviewAgainHref(reviewSession)) + '">' + escapeHtml(t('reviewAgain')) + '</a>' +
      '<a class="ws-btn" href="' + escapeHtml(reviewExitHref(reviewSession)) + '">' + escapeHtml(t('exitReview')) + '</a>' +
      '<a class="ws-btn" href="/app?section=overview">' + escapeHtml(t('backOverview')) + '</a></p></div>';
  }

  function revealReviewCard() {
    if (!reviewSession) return;
    reviewSession.revealed = true;
    paintReviewCard();
  }

  function reviewExitHref(session) {
    var href = '/app?section=review';
    if (session && session.setId) href += '&set=' + encodeURIComponent(session.setId);
    return href;
  }

  function reviewAgainHref(session) {
    if (session && session.mode === 'weak') return focusReviewHref(session.setId, session.limit);
    return reviewStartHref(session && session.setId);
  }

  function reviewStateLabel(state) {
    var key = String(state || '').toLowerCase();
    if (key === 'new') return t('stateNew');
    if (key === 'learning') return t('stateLearning');
    if (key === 'review') return t('stateReview');
    return state || '';
  }

  function startReviewSession(data, title, mode, limit) {
    var cards = (data && data.cards) || [];
    if (!cards.length) return false;
    bindReviewKeys();
    reviewSession = {
      active: true,
      revealed: false,
      index: 0,
      title: title || t('reviewTitle'),
      setId: studySetIdFromQuery(),
      mode: mode === 'weak' ? 'weak' : 'due',
      limit: limit || 20,
      cards: cards,
      stats: { again: 0, hard: 0, good: 0, easy: 0 }
    };
    var node = $('app-study');
    if (!node) return false;
    node.innerHTML =
      '<div id="app-review-session" class="ws-review">' +
      '<div class="ws-review-toolbar"><button type="button" class="ws-btn ws-btn-ghost ws-btn-sm" data-review-exit>' + escapeHtml(t('exitReview')) + '</button></div>' +
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
    var exitBtn = root.querySelector('[data-review-exit]');
    if (exitBtn) exitBtn.addEventListener('click', function () {
      reviewSession.active = false;
      location.replace(reviewExitHref(reviewSession));
    });
    root.querySelector('[data-review-ratings]').addEventListener('click', function (event) {
      var btn = event.target && event.target.closest && event.target.closest('[data-grade]');
      if (!btn) return;
      gradeReview(btn.getAttribute('data-grade'));
    });
    paintReviewCard();
    return true;
  }

  async function gradeReview(rating) {
    if (!reviewSession || !reviewSession.active || reviewBusy) return;
    var card = reviewSession.cards[reviewSession.index];
    if (!card || !reviewSession.revealed) return;
    var api = window.AtomurusStudy;
    if (!api) return;
    if (!pendingGrade || pendingGrade.cardId !== card.id || pendingGrade.rating !== rating) {
      pendingGrade = {
        cardId: card.id,
        rating: rating,
        clientEventId: newClientEventId(),
        expectedVersion: card.version
      };
    }
    reviewBusy = true;
    var root = document.getElementById('app-review-session');
    var errBox = root && root.querySelector('[data-review-error]');
    if (errBox) errBox.hidden = true;
    var ratingBtns = root ? root.querySelectorAll('[data-grade]') : [];
    ratingBtns.forEach(function (btn) { ui().setBusy(btn, true); });
    try {
      await api.submitReview({
        cardId: pendingGrade.cardId,
        rating: pendingGrade.rating,
        clientEventId: pendingGrade.clientEventId,
        expectedVersion: pendingGrade.expectedVersion
      });
      pendingGrade = null;
      reviewSession.stats[rating] = (reviewSession.stats[rating] || 0) + 1;
      reviewSession.index += 1;
      reviewSession.revealed = false;
      paintReviewCard();
    } catch (err) {
      if (err && err.code === 'review_conflict') {
        pendingGrade = null;
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
      ratingBtns.forEach(function (btn) { ui().setBusy(btn, false); });
    }
  }

  function continueCard(row) {
    var pct = logic().progressPercent(row.progress);
    var title = (row && row.title) || logic().humanizeKey(row && row.contentKey) || (row && row.contentType) || '';
    return '<a class="ws-study-item" href="' + escapeHtml(safeHref(row.lastPosition)) + '"><div class="ws-item-symbol">' + icon('progress') + '</div><div>' +
      '<h3 class="ws-item-title">' + escapeHtml(title) + '</h3>' +
      '<div class="ws-progress-label">' + escapeHtml(t('complete', '', { n: pct })) + '</div>' + progressBar(pct) +
      '</div><span class="ws-btn ws-btn-sm">' + escapeHtml(t('continueCta')) + ' →</span></a>';
  }

  function recentCard(item) {
    return '<a class="ws-study-item" href="' + escapeHtml(safeHref(item.href)) + '"><div class="ws-item-symbol">' + escapeHtml(itemSymbol(item)) + '</div><div>' +
      '<h3 class="ws-item-title">' + escapeHtml(item.title || item.itemKey || '') + '</h3>' +
      '<div class="ws-item-meta">' + escapeHtml(typeLabel(item.itemType)) + '</div></div></a>';
  }

  async function renderOverview(node, api, user) {
    node.innerHTML = skeleton();
    var pair = await Promise.all([api.overview(), api.reviewOverview().catch(function () { return null; })]);
    var overview = pair[0];
    var review = pair[1];
    var dueNow = review && review.dueNow != null ? review.dueNow : 0;
    var name = displayName(user);
    var hour = logic().greetingKey();
    var greet = t(hour === 'morning' ? 'greetingMorning' : hour === 'afternoon' ? 'greetingAfternoon' : 'greetingEvening', '', { name: name });
    var hero = dueNow
      ? '<section class="ws-hero is-ready"><div><h2 class="ws-hero-title">' + escapeHtml(t('readyToStudy')) + '</h2><p class="ws-hero-copy">' + escapeHtml(tCount('dueTodayHero', 'dueTodayHeroOne', dueNow)) + '</p><a class="ws-btn ws-btn-primary" href="/app?section=review&start=1">' + escapeHtml(t('startReview')) + '</a></div></section>'
      : '<section class="ws-hero"><div><h2 class="ws-hero-title">' + escapeHtml(t('caughtUpTitle')) + '</h2><p class="ws-hero-copy">' + escapeHtml(t('caughtUpExplore')) + '</p><a class="ws-btn ws-btn-primary" href="' + escapeHtml(focusReviewHref()) + '">' + escapeHtml(t('startFocusReview')) + '</a> <a class="ws-btn ws-btn-secondary" href="/app?section=sets">' + escapeHtml(t('openSets')) + '</a></div></section>';
    var metrics = review
      ? '<div class="ws-metrics">' +
        [['dueToday', dueNow], ['metricSets', logic().overviewSetCount(review)], ['metricCards', review.totalCards || 0], ['mastered', review.masteredCards || 0]].map(function (row) {
          return '<div class="ws-metric"><div class="ws-metric-value">' + escapeHtml(String(row[1])) + '</div><div class="ws-metric-label">' + escapeHtml(t(row[0])) + '</div></div>';
        }).join('') + '</div>'
      : '';
    var setsCard = '<section class="ws-dest-card"><h2 class="ws-h2">' + escapeHtml(t('sets')) + '</h2><p class="ws-lede">' + escapeHtml(t('setsLede')) + '</p><a class="ws-btn ws-btn-secondary" href="/app?section=sets">' + escapeHtml(t('openSets')) + '</a></section>';
    var insightsCard = '<section class="ws-dest-card"><h2 class="ws-h2">' + escapeHtml(t('insights')) + '</h2><p class="ws-lede">' + escapeHtml(t('insightsLede')) + '</p><a class="ws-btn ws-btn-secondary" href="/app?section=insights">' + escapeHtml(t('openInsights')) + '</a></section>';
    var labCard = '<section class="ws-dest-card"><h2 class="ws-h2">' + escapeHtml(t('proLab')) + '</h2><p class="ws-lede">' + escapeHtml(t('continueLab')) + '</p><a class="ws-btn ws-btn-secondary" href="/app?section=pro-lab">' + escapeHtml(t('openProLab')) + '</a></section>';
    var cont = (overview.continueStudying || []).slice(0, 5);
    node.innerHTML =
      '<p class="ws-kicker">Atomurus</p><h1 class="ws-title">' + escapeHtml(greet) + '</h1><p class="ws-lede">' + escapeHtml(t('greetingFallback')) + '</p>' +
      hero + metrics +
      (cont.length
        ? '<h2 class="ws-h2">' + escapeHtml(t('continueTitle')) + '</h2><div class="ws-grid">' + cont.map(continueCard).join('') + '</div>'
        : '') +
      '<div class="ws-dest-grid">' + setsCard + insightsCard + labCard + '</div>';
  }

  function libraryRow(item) {
    var href = safeHref(item.href);
    var canGenerate = item.itemType === 'element' || item.itemType === 'molecule';
    var tags = Array.isArray(item.tags) ? item.tags.join(' · ') : '';
    return '<article class="ws-study-item" data-library-id="' + escapeHtml(item.id) + '">' +
      '<div class="ws-item-symbol">' + escapeHtml(itemSymbol(item)) + '</div><div>' +
      '<h3 class="ws-item-title">' + escapeHtml(item.title || item.itemKey || '') + '</h3>' +
      '<div class="ws-item-meta">' + escapeHtml(typeLabel(item.itemType)) + (tags ? ' · ' + escapeHtml(tags) : '') + '</div>' +
      (item.note ? '<div class="ws-item-note"></div>' : '') +
      '</div><div class="ws-item-actions">' +
      '<a class="ws-btn ws-btn-primary ws-btn-sm" href="' + escapeHtml(href) + '">' + escapeHtml(t('open')) + '</a>' +
      '<button type="button" class="ws-btn ws-btn-secondary ws-btn-sm" data-add-to-set="' + escapeHtml(item.id) + '">' + escapeHtml(t('addToSet')) + '</button>' +
      (canGenerate ? '<button type="button" class="ws-btn ws-btn-sm" data-generate-item="' + escapeHtml(item.id) + '">' + escapeHtml(t('generate')) + '</button>' : '') +
      '<div class="ws-dropdown"><button type="button" class="ws-btn ws-btn-icon ws-btn-sm" data-more="' + escapeHtml(item.id) + '" aria-haspopup="true">•••</button>' +
      '<div class="ws-menu"><button type="button" data-delete-item="' + escapeHtml(item.id) + '">' + escapeHtml(t('remove')) + '</button></div></div>' +
      '</div></article>';
  }

  function openAddToSetDialog(api, itemId, node, options) {
    options = options || {};
    api.listSets().then(function (data) {
      var box = document.createElement('div');
      if (options.generate) {
        var lede = document.createElement('p');
        lede.textContent = t('genPickSet');
        box.appendChild(lede);
      }
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
            ui().closeDialog();
            return afterAddedToSet(api, node, itemId, set.id, options.generate);
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
      newer.addEventListener('click', function () { openCreateSetDialog(api, itemId, node, options); });
      box.appendChild(newer);
      ui().openDialog({ title: options.generate ? t('generate') : t('addToSet'), bodyNode: box, actions: [{ label: t('cancel'), kind: 'ws-btn-ghost' }] });
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
            var row = del.closest('[data-library-id]');
            if (row) row.remove();
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
          openAddToSetDialog(api, gid, node, { generate: true });
          return;
        }
        ui().setBusy(genBtn, true, t('generating'));
        api.generateCards({ setId: setId, itemId: gid }).then(function (data) {
          ui().setBusy(genBtn, false);
          toastGenerate(logic().generateCardsFeedback(data));
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

  function openCreateSetDialog(api, itemId, node, options) {
    options = options || {};
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
                  ui().closeDialog();
                  return afterAddedToSet(api, node, itemId, created.set.id, options.generate);
                });
              }
              ui().closeDialog();
              if (created.set) insertCreatedSet(api, created.set);
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
    if (!items.length) {
      node.innerHTML = sectionHead(t('libraryTitle'), t('libraryLede'), true) +
        emptyState(t('emptyLibraryTitle'), t('emptyLibraryBody'), '/periodic-table.html', t('exploreTable'));
      return;
    }
    var state = {
      items: items.slice(),
      nextCursor: library.nextCursor || null,
      q: '',
      type: 'all',
      tag: 'all',
      sort: 'updated',
      req: 0,
      abort: null
    };
    bindLibrarySetActions.items = state.items;

    function collectTags(rows) {
      var tags = [];
      (rows || []).forEach(function (item) {
        (item.tags || []).forEach(function (tag) {
          if (tag && tags.indexOf(tag) === -1) tags.push(tag);
        });
      });
      return tags;
    }

    function queryParams(cursor) {
      var params = { limit: 40 };
      if (cursor) params.cursor = cursor;
      if (state.type !== 'all') params.type = state.type;
      else params.exclude = 'calculator';
      if (state.tag !== 'all') params.tag = state.tag;
      if (state.q) params.q = state.q;
      return params;
    }

    function sortedItems() {
      if (state.sort !== 'title') return state.items.slice();
      return state.items.slice().sort(function (a, b) {
        return String(a.title || '').localeCompare(String(b.title || ''));
      });
    }

    function paintRows() {
      var list = $('ws-lib-list');
      if (!list) return;
      var rows = sortedItems();
      list.textContent = '';
      rows.forEach(function (item) {
        var wrap = document.createElement('div');
        wrap.innerHTML = libraryRow(item);
        var el = wrap.firstChild;
        var noteNode = el && el.querySelector('.ws-item-note');
        if (noteNode && item.note) noteNode.textContent = item.note;
        if (el) list.appendChild(el);
      });
      bindLibrarySetActions.items = state.items;
      var empty = $('ws-lib-empty');
      if (empty) empty.hidden = rows.length > 0;
      var more = $('ws-lib-more');
      if (state.nextCursor) {
        if (!more) {
          more = document.createElement('button');
          more.type = 'button';
          more.className = 'ws-btn';
          more.id = 'ws-lib-more';
          more.textContent = t('loadMore');
          node.appendChild(more);
          more.addEventListener('click', function () { void fetchPage(false); });
        }
        more.hidden = false;
        more.disabled = false;
        more.setAttribute('data-cursor', state.nextCursor);
      } else if (more) more.remove();
    }

    function fetchPage(reset) {
      if (state.abort) state.abort.abort();
      var ac = typeof AbortController === 'function' ? new AbortController() : null;
      state.abort = ac;
      var id = ++state.req;
      var params = queryParams(reset ? null : state.nextCursor);
      if (ac) params.signal = ac.signal;
      var more = $('ws-lib-more');
      if (more && !reset) more.disabled = true;
      return api.items(params, true).then(function (page) {
        if (id !== state.req) return;
        var incoming = page.items || [];
        if (reset) state.items = incoming;
        else {
          incoming.forEach(function (item) {
            if (!state.items.some(function (row) { return row.id === item.id; })) state.items.push(item);
          });
        }
        state.nextCursor = page.nextCursor || null;
        paintRows();
      }).catch(function (err) {
        if (err && (err.name === 'AbortError' || err.code === 'AbortError')) return;
        if (more) more.disabled = false;
        toast(t(logic().uxError(err).bodyKey), 'danger');
      });
    }

    var tags = collectTags(items);
    node.innerHTML = sectionHead(t('libraryTitle'), t('libraryLede'), true) +
      '<div class="ws-toolbar"><input class="ws-search-field" id="ws-lib-q" type="search" maxlength="100" aria-label="' + escapeHtml(t('search')) + '">' +
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
      '<div id="ws-lib-list" class="ws-grid">' + items.map(libraryRow).join('') + '</div>' +
      '<div id="ws-lib-empty" hidden>' + emptyState(t('filterEmptyTitle'), t('filterEmptyBody')) + '</div>' +
      (state.nextCursor ? '<button type="button" class="ws-btn" id="ws-lib-more" data-cursor="' + escapeHtml(state.nextCursor) + '">' + escapeHtml(t('loadMore')) + '</button>' : '');
    bindLibrarySetActions(node, api);
    node.querySelectorAll('.ws-item-note').forEach(function (noteNode) {
      var wrap = noteNode.closest('[data-library-id]');
      var id = wrap && wrap.getAttribute('data-library-id');
      var match = state.items.find(function (row) { return row.id === id; });
      if (match && match.note) noteNode.textContent = match.note;
    });
    var qn = $('ws-lib-q');
    if (qn) {
      qn.placeholder = t('search');
      qn.addEventListener('input', debounce(function () {
        state.q = (qn.value || '').trim().slice(0, 100);
        void fetchPage(true);
      }, 250));
    }
    var typeEl = $('ws-lib-type');
    if (typeEl) typeEl.addEventListener('change', function () {
      state.type = typeEl.value || 'all';
      void fetchPage(true);
    });
    var tagEl = $('ws-lib-tag');
    if (tagEl) tagEl.addEventListener('change', function () {
      state.tag = tagEl.value || 'all';
      void fetchPage(true);
    });
    var sortEl = $('ws-lib-sort');
    if (sortEl) sortEl.addEventListener('change', function () {
      state.sort = sortEl.value || 'updated';
      paintRows();
    });
    var moreBtn = $('ws-lib-more');
    if (moreBtn) moreBtn.addEventListener('click', function () { void fetchPage(false); });
  }

  function insertCreatedSet(api, set) {
    if (!set) return;
    if (logic().emitWorkspaceEvent) logic().emitWorkspaceEvent('study_set_created', { id: set.id });
    var list = $('ws-set-list');
    if (list) {
      var wrap = document.createElement('div');
      wrap.innerHTML = setCard(set);
      if (wrap.firstChild) list.insertBefore(wrap.firstChild, list.firstChild);
      var empty = list.parentNode && list.parentNode.querySelector('.ws-empty');
      if (empty) empty.remove();
      return;
    }
    var node = $('app-study');
    if (node && api) void renderSetsSection(node, api);
  }

  function setCard(entry) {
    var mastered = logic().masteredPercent(entry.masteredCount, entry.cardCount);
    var when = logic().relativeTime(entry.updatedAt, Date.now(), langIsPt() ? 'pt' : 'en');
    return '<article class="ws-set-card"><h3>' + escapeHtml(entry.title) + '</h3>' +
      '<div class="ws-set-stats"><span>' + escapeHtml(tCount('cardsCount', 'cardsCountOne', entry.cardCount || 0)) + '</span>' +
      '<span>' + escapeHtml(tCount('dueCount', 'dueCountOne', entry.dueCount || 0)) + '</span>' +
      (mastered == null ? '' : '<span>' + escapeHtml(t('masteredPct', '', { n: mastered })) + '</span>') +
      '</div><div class="ws-muted">' + escapeHtml(t('lastUpdated', '', { when: when })) + '</div>' +
      '<div class="ws-row-actions"><a class="ws-btn ws-btn-primary ws-btn-sm" href="' + escapeHtml(reviewStartHref(entry.id)) + '">' + escapeHtml(t('study')) + '</a>' +
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

  function patchSetStats(set) {
    var lede = document.querySelector('#app-study .ws-section-head .ws-lede');
    if (!lede || !set) return;
    var mastered = logic().masteredPercent(set.masteredCount, set.cardCount);
    lede.textContent = tCount('cardsCount', 'cardsCountOne', set.cardCount || 0) + ' · ' + tCount('dueCount', 'dueCountOne', set.dueCount || 0) +
      (mastered == null ? '' : ' · ' + t('masteredPct', '', { n: mastered }));
  }

  function replaceCardNode(node, card) {
    if (!node || !card || !card.id) return;
    var wrap = node.querySelector('[data-card-id="' + card.id + '"]');
    var holder = document.createElement('div');
    holder.innerHTML = flashcardRow(card);
    var next = holder.firstChild;
    if (wrap && next) wrap.parentNode.replaceChild(next, wrap);
    else {
      var list = $('app-set-cards');
      if (list && next) {
        var empty = list.querySelector('.ws-empty');
        if (empty) empty.remove();
        list.insertBefore(next, list.firstChild);
      }
    }
    fillFlashcardTexts(node, [card]);
  }

  function applySavedCard(node, detail, set, saved, isNew) {
    if (!saved || !saved.id) return;
    detail.cards = detail.cards || [];
    if (isNew) {
      detail.cards.unshift(saved);
      set.cardCount = (set.cardCount || 0) + 1;
      replaceCardNode(node, saved);
      patchSetStats(set);
      return;
    }
    var found = detail.cards.find(function (row) { return row.id === saved.id; });
    if (found) Object.assign(found, saved);
    else detail.cards.unshift(saved);
    replaceCardNode(node, saved);
  }

  function openCardEditor(api, setId, card, onSaved) {
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
            req.then(function (data) {
              toast(t('toastCard'));
              ui().closeDialog();
              var saved = (data && data.card) || Object.assign({}, card || {}, payload);
              if (typeof onSaved === 'function') onSaved(saved, !(card && card.id));
            }).catch(function (err) {
              ui().setBusy(primary, false);
              toast(t(logic().uxError(err).bodyKey), 'danger');
            });
          }
        }
      ]
    });
  }

  function setProgressBlock(set, mastered) {
    var pct = mastered == null ? 0 : mastered;
    return '<section class="ws-set-progress" title="' + escapeHtml(t('masteredTip')) + '">' +
      '<h2 class="ws-h2">' + escapeHtml(t('setProgress')) + '</h2>' +
      '<div class="ws-progress-label">' + escapeHtml(t('complete', '', { n: pct })) + '</div>' +
      '<div class="ws-progress' + (pct ? '' : ' is-empty') + '" role="progressbar" aria-valuenow="' + pct + '" aria-valuemin="0" aria-valuemax="100" aria-label="' + escapeHtml(t('setProgress')) + '"><span style="width:' + pct + '%"></span></div>' +
      '<div class="ws-item-meta">' + escapeHtml(t('mastered')) + ' ' + escapeHtml(String(set.masteredCount || 0)) +
      ' · ' + escapeHtml(t('learningCount', '', { n: set.learningCount || 0 })) +
      ' · ' + escapeHtml(t('newCount', '', { n: set.newCount || 0 })) + '</div></section>';
  }

  async function renderSetsSection(node, api) {
    var setId = studySetIdFromQuery();
    if (setId) {
      node.innerHTML = skeleton();
      var detail = await api.getSet(setId, { limit: 40 });
      var set = detail.set || {};
      var mastered = logic().masteredPercent(set.masteredCount, set.activeCount || set.cardCount);
      var itemsHtml = (detail.items || []).map(function (entry) {
        var item = entry.item || {};
        var itemId = entry.itemId || item.id || '';
        return '<article class="ws-study-item" data-set-item="' + escapeHtml(itemId) + '"><div class="ws-item-symbol">' + escapeHtml(itemSymbol(item)) + '</div><div><h3 class="ws-item-title"></h3><div class="ws-item-meta">' + escapeHtml(typeLabel(item.itemType)) + '</div></div>' +
          (itemId ? '<button type="button" class="ws-btn ws-btn-sm" data-remove-set-item="' + escapeHtml(itemId) + '">' + escapeHtml(t('remove')) + '</button>' : '') +
          '</article>';
      }).join('');
      node.innerHTML = '<header class="ws-section-head"><div><p class="ws-kicker">' + escapeHtml(t('sets')) + '</p><h1 class="ws-title" id="ws-set-title"></h1>' +
        '<p class="ws-lede">' + escapeHtml(tCount('cardsCount', 'cardsCountOne', set.cardCount || 0)) + ' · ' + escapeHtml(tCount('dueCount', 'dueCountOne', set.dueCount || 0)) +
        (mastered == null ? '' : ' · ' + escapeHtml(t('masteredPct', '', { n: mastered }))) + '</p></div>' +
        '<div class="ws-row-actions"><a class="ws-btn ws-btn-primary" href="' + escapeHtml(reviewStartHref(set.id)) + '">' + escapeHtml(t('startReviewSet')) + '</a>' +
        '<a class="ws-btn" href="' + escapeHtml(focusReviewHref(set.id)) + '">' + escapeHtml(t('reviewWeakCards')) + '</a>' +
        '<button type="button" class="ws-btn" id="app-card-new">' + escapeHtml(t('addCard')) + '</button>' +
        '<button type="button" class="ws-btn" id="app-generate-set">' + escapeHtml(t('generate')) + '</button>' +
        '<button type="button" class="ws-btn ws-btn-danger" id="app-delete-set">' + escapeHtml(t('deleteSet')) + '</button></div></header>' +
        setProgressBlock(set, mastered) +
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
          toastGenerate(fb);
          if (logic().emitWorkspaceEvent) logic().emitWorkspaceEvent('flashcards_generated', { created: fb.created || 0 });
          if (fb.kind === 'created') void renderSetsSection(node, api);
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
      if (addCard) addCard.addEventListener('click', function () {
        openCardEditor(api, set.id, null, function (saved, isNew) {
          applySavedCard(node, detail, set, saved, isNew);
        });
      });
      node.addEventListener('click', function (event) {
        var removeItem = event.target.closest && event.target.closest('[data-remove-set-item]');
        if (removeItem) {
          ui().confirmDialog({
            title: t('removeFromSetTitle'),
            body: t('removeFromSetBody'),
            confirmLabel: t('remove'),
            cancelLabel: t('cancel'),
            danger: true
          }).then(function (ok) {
            if (!ok) return;
            api.removeSetItem(set.id, removeItem.getAttribute('data-remove-set-item')).then(function () {
              toast(t('toastDeleted'));
              var row = removeItem.closest('[data-set-item]');
              if (row) row.remove();
            }).catch(function (err) { toast(t(logic().uxError(err).bodyKey), 'danger'); });
          });
          return;
        }
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
            detail.cards = (detail.cards || []).concat(page.cards || []);
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
        if (action === 'edit') {
          openCardEditor(api, set.id, found || { id: id }, function (saved) {
            applySavedCard(node, detail, set, saved, false);
          });
          return;
        }
        if (action === 'delete') {
          ui().confirmDialog({
            title: t('deleteCardTitle'),
            body: t('deleteCardBody'),
            confirmLabel: t('deleteCard'),
            cancelLabel: t('cancel'),
            danger: true
          }).then(function (ok) {
            if (!ok) return;
            api.deleteCard(id).then(function () {
              toast(t('toastDeleted'));
              var wrap = node.querySelector('[data-card-id="' + id + '"]');
              if (wrap) wrap.remove();
              detail.cards = (detail.cards || []).filter(function (row) { return row.id !== id; });
              set.cardCount = Math.max(0, (set.cardCount || 1) - 1);
              patchSetStats(set);
            }).catch(function (err) { toast(t(logic().uxError(err).bodyKey), 'danger'); });
          });
          return;
        }
        if (action === 'toggle') {
          var nextSuspended = btn.getAttribute('data-suspended') !== '1';
          ui().setBusy(btn, true);
          api.updateCard({ id: id, suspended: nextSuspended }).then(function (data) {
            var saved = (data && data.card) || Object.assign({}, found || { id: id }, { suspended: nextSuspended });
            if (found) Object.assign(found, saved);
            replaceCardNode(node, saved);
            toast(t('toastSuspended'));
          }).catch(function (err) {
            ui().setBusy(btn, false);
            toast(t(logic().uxError(err).bodyKey), 'danger');
          });
        }
      });
      return;
    }

    node.innerHTML = sectionHead(t('setsTitle'), t('setsLede'), true) + skeleton();
    var listed = await api.listSets();
    var sets = listed.sets || [];
    node.innerHTML = '<header class="ws-section-head"><div><p class="ws-kicker">Atomurus Pro</p><h1 class="ws-title">' + escapeHtml(t('setsTitle')) +
      ' <span class="ws-badge ws-badge-pro">' + escapeHtml(t('pro')) + '</span></h1><p class="ws-lede">' + escapeHtml(t('setsLede')) + '</p></div>' +
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

  function renderLockedInsights() {
    var node = $('app-study');
    node.innerHTML = sectionHead(t('insightsLockedTitle'), t('insightsLockedBody'), true) +
      '<ul class="ws-insight-bullets">' +
      ['insightsLocked1', 'insightsLocked2', 'insightsLocked3', 'insightsLocked4', 'insightsLocked5'].map(function (key) {
        return '<li>' + escapeHtml(t(key)) + '</li>';
      }).join('') +
      '</ul><p class="ws-insight-cta"><a class="ws-btn ws-btn-primary" href="/pricing">' + escapeHtml(t('upgrade')) + '</a></p>';
  }

  function weekdayLabel(key) {
    var map = { mon: 'weekdayMon', tue: 'weekdayTue', wed: 'weekdayWed', thu: 'weekdayThu', fri: 'weekdayFri', sat: 'weekdaySat', sun: 'weekdaySun' };
    return t(map[String(key || '').slice(0, 3)] || 'forecastToday');
  }

  function barRow(label, value, max) {
    var n = Number(value) || 0;
    var width = max > 0 ? Math.round((n / max) * 100) : 0;
    return '<li class="ws-chart-row"><span class="ws-chart-label">' + escapeHtml(label) + '</span>' +
      '<span class="ws-chart-track" aria-hidden="true"><span class="ws-chart-fill" style="width:' + width + '%"></span></span>' +
      '<span class="ws-chart-n">' + escapeHtml(String(n)) + '</span></li>';
  }

  function forecastLabel(row) {
    if (row.kind === 'today') return t('forecastToday');
    if (row.kind === 'tomorrow') return t('forecastTomorrow');
    return weekdayLabel(row.weekday);
  }

  function insightsPath(range, setId) {
    if (logic().insightsHref) return logic().insightsHref(range, setId);
    var href = '/app?section=insights&range=' + encodeURIComponent(range === '7d' ? '7d' : '30d');
    if (setId) href += '&set=' + encodeURIComponent(setId);
    return href;
  }

  function activityChartHtml(activity, range) {
    var rows = activity || [];
    var actMax = rows.reduce(function (m, row) { return Math.max(m, row.reviews || 0); }, 1);
    var caption = '<figcaption id="ws-activity-title">' + escapeHtml(t('activityTitle')) + '</figcaption>';
    if (range === '7d') {
      return '<figure class="ws-chart" id="ws-activity-chart">' + caption +
        '<ul class="ws-chart-bars" aria-labelledby="ws-activity-title">' +
        rows.map(function (row) { return barRow(weekdayLabel(row.weekday), row.reviews, actMax); }).join('') +
        '</ul>';
    }
    var first = rows[0] ? String(rows[0].date || '').slice(5) : '';
    var last = rows.length ? String(rows[rows.length - 1].date || '').slice(5) : '';
    var cols = Math.max(rows.length, 1);
    return '<figure class="ws-chart is-sparkline" id="ws-activity-chart">' + caption +
      '<ul class="ws-sparkline" style="grid-template-columns:repeat(' + cols + ',minmax(0,1fr))" aria-labelledby="ws-activity-title">' +
      rows.map(function (row) {
        var n = Number(row.reviews) || 0;
        var pct = actMax > 0 && n ? Math.max(8, Math.round((n / actMax) * 100)) : 4;
        var label = String(row.date || '') + ' · ' + n;
        return '<li class="ws-spark-item" title="' + escapeHtml(label) + '" aria-label="' + escapeHtml(label) + '">' +
          '<span class="ws-spark-bar' + (n ? '' : ' is-empty') + '" style="height:' + pct + '%"></span></li>';
      }).join('') +
      '</ul>' +
      (first || last ? '<div class="ws-spark-axis"><span>' + escapeHtml(first) + '</span><span>' + escapeHtml(last) + '</span></div>' : '');
  }

  function renderInsightsSkeleton(node) {
    node.innerHTML = sectionHead(t('insights'), t('insightsLede'), true) + skeleton();
  }

  function paintInsights(node, data, params, api) {
    var summary = data.summary || {};
    var ratings = data.ratings || {};
    var activity = data.activity || [];
    var forecast = data.dueForecast || [];
    var weak = data.weakCards || [];
    var sets = data.sets || [];
    var empty = !summary.reviews && !summary.masteredCards && !summary.dueNow;
    var ratingMax = Math.max(ratings.again || 0, ratings.hard || 0, ratings.good || 0, ratings.easy || 0, 1);
    var dueMax = forecast.reduce(function (m, row) { return Math.max(m, row.due || 0); }, 1);
    var range = params.range || '30d';
    var setId = params.setId || '';
    var rangeSwitch = '<div class="ws-chips" role="group" aria-label="' + escapeHtml(t('insights')) + '">' +
      '<button type="button" class="ws-chip' + (range === '7d' ? ' is-on' : '') + '" data-insight-range="7d" aria-pressed="' + (range === '7d' ? 'true' : 'false') + '">' + escapeHtml(t('range7d')) + '</button>' +
      '<button type="button" class="ws-chip' + (range === '30d' ? ' is-on' : '') + '" data-insight-range="30d" aria-pressed="' + (range === '30d' ? 'true' : 'false') + '">' + escapeHtml(t('range30d')) + '</button>' +
      '</div>';
    var setFilter = sets.length
      ? '<label class="ws-field ws-insight-set"><select class="ws-input" id="ws-insight-set" aria-label="' + escapeHtml(t('allSets')) + '">' +
        '<option value="">' + escapeHtml(t('allSets')) + '</option>' +
        sets.map(function (set) {
          return '<option value="' + escapeHtml(set.id) + '"' + (set.id === setId ? ' selected' : '') + '></option>';
        }).join('') + '</select></label>'
      : '';
    var confidentPct = Math.round((summary.confidentReviews || 0) * 100);
    var metrics = '<div class="ws-metrics">' +
      '<div class="ws-metric" title="' + escapeHtml(t('confidentTip')) + '"><div class="ws-metric-value">' + escapeHtml(String(summary.reviews || 0)) + '</div><div class="ws-metric-label">' + escapeHtml(t('metricReviews')) + '</div><div class="ws-metric-sub">' + escapeHtml(String(confidentPct) + '% ' + t('confidentReviews')) + '</div></div>' +
      [['activeDays', summary.activeDays || 0], ['mastered', summary.masteredCards || 0], ['cardsDue', summary.dueNow || 0]].map(function (row) {
        return '<div class="ws-metric"><div class="ws-metric-value">' + escapeHtml(String(row[1])) + '</div><div class="ws-metric-label">' + escapeHtml(t(row[0])) + '</div></div>';
      }).join('') +
      '</div>';
    var ratingChart = '<figure class="ws-chart"><figcaption>' + escapeHtml(t('ratingsTitle')) + '</figcaption><ul class="ws-chart-bars">' +
      barRow(t('again'), ratings.again, ratingMax) +
      barRow(t('hard'), ratings.hard, ratingMax) +
      barRow(t('good'), ratings.good, ratingMax) +
      barRow(t('easy'), ratings.easy, ratingMax) +
      '</ul></figure>';
    var activityChart = activityChartHtml(activity, range) +
      (data.consistency ? '<p class="ws-lede">' + escapeHtml(t('consistencyCopy', '', { active: data.consistency.activeDays, days: data.consistency.windowDays })) + '</p>' : '') +
      '</figure>';
    var forecastChart = '<figure class="ws-chart" id="ws-forecast-chart"><figcaption>' + escapeHtml(t('dueForecastTitle')) + '</figcaption><ul class="ws-chart-bars">' +
      forecast.map(function (row) { return barRow(forecastLabel(row), row.due, dueMax); }).join('') +
      '</ul></figure>';
    var weakHtml = weak.length
      ? '<div class="ws-grid" id="ws-weak-list">' + weak.map(function (card) {
        return '<article class="ws-study-item ws-weak-item"><div><h3 class="ws-item-title"></h3><div class="ws-item-meta">' +
          escapeHtml(tCount('lapsesCount', 'lapsesCountOne', card.lapses || 0)) + ' · ' + escapeHtml(reviewStateLabel(card.reviewState)) +
          (card.dueNow ? ' · ' + escapeHtml(t('dueNowLabel')) : '') +
          '</div></div><div class="ws-item-actions"><a class="ws-btn ws-btn-primary ws-btn-sm" href="' + escapeHtml(focusReviewHref(card.studySetId)) + '">' + escapeHtml(t('reviewCta')) + '</a></div></article>';
      }).join('') + '</div>'
      : emptyState(t('emptyFocusTitle'), t('emptyFocusBody'), '/app?section=review', t('openSmartReview'));
    var setStats = sets.map(function (set) {
      var pct = set.masteredPercent == null ? 0 : set.masteredPercent;
      return '<article class="ws-set-card"><h3 class="ws-item-title"></h3>' +
        '<div class="ws-progress-label">' + escapeHtml(t('complete', '', { n: pct })) + '</div>' +
        '<div class="ws-progress' + (pct ? '' : ' is-empty') + '" title="' + escapeHtml(t('masteredTip')) + '" role="progressbar" aria-valuenow="' + pct + '" aria-valuemin="0" aria-valuemax="100"><span style="width:' + pct + '%"></span></div>' +
        '<div class="ws-item-meta">' + escapeHtml(tCount('cardsCount', 'cardsCountOne', set.totalCards || 0)) + ' · ' +
        escapeHtml(t('mastered')) + ' ' + escapeHtml(String(set.mastered || 0)) + ' · ' +
        escapeHtml(t('needsAttention')) + ' ' + escapeHtml(String(set.needsAttention || 0)) + '</div></article>';
    }).join('');
    var showFocus = !empty || weak.length;
    node.innerHTML = sectionHead(t('insights'), t('insightsLede'), true) +
      '<div class="ws-insights-toolbar">' + rangeSwitch + setFilter + '</div>' +
      (empty ? emptyState(t('emptyInsightsTitle'), t('emptyInsightsBody'), '/app?section=sets', t('openSets')) : metrics + ratingChart + activityChart + forecastChart) +
      (showFocus
        ? '<div class="ws-section-split"><h2 class="ws-h2">' + escapeHtml(t('needsAttention')) + '</h2>' +
          '<a class="ws-btn ws-btn-primary" href="' + escapeHtml(focusReviewHref(setId)) + '">' + escapeHtml(t('startFocusReview')) + '</a></div>' + weakHtml
        : '') +
      (setStats ? '<h2 class="ws-h2">' + escapeHtml(t('sets')) + '</h2><div class="ws-grid" id="ws-set-insights">' + setStats + '</div>' : '');
    weak.forEach(function (card, idx) {
      var titles = node.querySelectorAll('#ws-weak-list .ws-item-title');
      if (titles[idx]) titles[idx].textContent = card.front || '';
    });
    sets.forEach(function (set, idx) {
      var titles = node.querySelectorAll('#ws-set-insights .ws-item-title');
      if (titles[idx]) titles[idx].textContent = set.title || '';
    });
    function refetchInsights(nextRange, nextSet) {
      if (history.replaceState) history.replaceState(null, '', insightsPath(nextRange, nextSet));
      void renderInsights(node, api);
    }
    node.querySelectorAll('[data-insight-range]').forEach(function (btn) {
      btn.addEventListener('click', function () {
        refetchInsights(btn.getAttribute('data-insight-range'), setId);
      });
    });
    var select = $('ws-insight-set');
    if (select) {
      sets.forEach(function (set, idx) {
        if (select.options[idx + 1]) select.options[idx + 1].textContent = set.title || t('sets');
      });
      select.addEventListener('change', function () {
        refetchInsights(range, select.value || '');
      });
    }
  }

  async function renderInsights(node, api) {
    var seq = insightsSeq += 1;
    renderInsightsSkeleton(node);
    var range = logic().insightsRangeFromQuery ? logic().insightsRangeFromQuery(location.search) : '30d';
    var setId = studySetIdFromQuery();
    var tz = '';
    try { tz = Intl.DateTimeFormat().resolvedOptions().timeZone || ''; } catch (_err) {}
    try {
      var data = await api.insights({ range: range, setId: setId || undefined, tz: tz }, true);
      if (seq !== insightsSeq) return;
      paintInsights(node, data, { range: range, setId: setId }, api);
    } catch (err) {
      if (seq !== insightsSeq) return;
      if (err && err.code === 'feature_locked') {
        renderLockedInsights();
        return;
      }
      if (err && (err.status === 401 || err.code === 'session_expired')) throw err;
      node.innerHTML = sectionHead(t('insights'), t('insightsLede'), true) +
        '<div class="ws-error"><h3>' + escapeHtml(t('insightsError')) + '</h3>' +
        '<button type="button" class="ws-btn ws-btn-primary" id="ws-insights-retry">' + escapeHtml(t('retry')) + '</button></div>';
      var retry = $('ws-insights-retry');
      if (retry) retry.addEventListener('click', function () { void renderInsights(node, api); });
    }
  }

  async function renderReviewSection(node, api) {
    node.innerHTML = skeleton();
    var setId = studySetIdFromQuery();
    var overview = await api.reviewOverview();
    var start = String(new URLSearchParams(location.search).get('start') || '');
    var mode = logic().reviewModeFromQuery ? logic().reviewModeFromQuery(location.search) : 'due';
    var focusLimit = logic().focusLimitFromQuery ? logic().focusLimitFromQuery(location.search) : 20;
    if (start === '1') {
      var params = mode === 'weak'
        ? { mode: 'weak', limit: focusLimit }
        : { limit: 20 };
      if (setId) params.setId = setId;
      var queue = await api.reviewQueue(params);
      var title = mode === 'weak' ? t('focusTitle') : t('reviewTitle');
      if (setId && overview.sets) {
        var found = overview.sets.find(function (entry) { return entry.id === setId; });
        if (found) title = found.title;
      }
      if (startReviewSession(queue, title, mode, focusLimit)) return;
      if (mode === 'weak') {
        node.innerHTML = sectionHead(t('focusTitle'), t('needsAttention'), true) +
          emptyState(t('emptyFocusTitle'), t('emptyFocusBody'), '/app?section=review', t('openSmartReview'));
        return;
      }
    }
    var due = overview.dueNow || 0;
    var minutes = logic().estimateReviewMinutes(due);
    var dueHref = '/app?section=review&start=1' + (setId ? '&set=' + encodeURIComponent(setId) : '');
    node.innerHTML = sectionHead(t('reviewTitle'), t('lockedReviewBody'), true) +
      '<div class="ws-review-split">' +
      '<section class="ws-hero is-ready"><div><h2 class="ws-hero-title">' + escapeHtml(t('dueReview')) + '</h2>' +
      '<p class="ws-hero-copy">' + escapeHtml(due ? tCount('reviewReady', 'reviewReadyOne', due) : t('emptyReviewTitle')) + '</p>' +
      (due
        ? '<p class="ws-hero-copy">' + escapeHtml(tCount('reviewEstimate', 'reviewEstimateOne', minutes)) + ' · ' + escapeHtml(t('reviewSeconds')) + '</p>' +
          '<a class="ws-btn ws-btn-primary" href="' + escapeHtml(dueHref) + '">' + escapeHtml(t('startReviewCta')) + '</a>'
        : '<p class="ws-hero-copy">' + escapeHtml(t('emptyReviewBody')) + '</p><a class="ws-btn" href="/app?section=sets">' + escapeHtml(t('openSets')) + '</a>') +
      '</div></section>' +
      '<section class="ws-hero"><div><h2 class="ws-hero-title">' + escapeHtml(t('weakReview')) + '</h2>' +
      '<p class="ws-hero-copy">' + escapeHtml(t('focusLandingBody')) + '</p>' +
      '<a class="ws-btn ws-btn-primary" href="' + escapeHtml(focusReviewHref(setId, 20)) + '">' + escapeHtml(t('startFocusReview')) + '</a>' +
      '<p class="ws-chips" style="margin-top:12px">' +
      [10, 20, 30].map(function (n) {
        return '<a class="ws-chip' + (n === 20 ? ' is-on' : '') + '" href="' + escapeHtml(focusReviewHref(setId, n)) + '">' + escapeHtml(t('focusCards', '', { n: n })) + '</a>';
      }).join('') + '</p>' +
      '</div></section></div>' +
      '<div class="ws-metrics">' +
      [['dueToday', overview.dueNow || 0], ['metricSets', logic().overviewSetCount(overview)], ['metricCards', overview.totalCards || 0], ['mastered', overview.masteredCards || 0]].map(function (row) {
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

  function fillHistoryRow(el, item) {
    if (!el || !item) return;
    var title = el.querySelector('.ws-item-title');
    if (title) title.textContent = item.title || item.itemKey || '';
    var meta = el.querySelector('[data-hist-meta]');
    if (meta && item.payload) {
      var bits = [item.payload.formula || item.payload.input, item.payload.result || item.payload.output].filter(Boolean);
      meta.textContent = bits.join(' · ');
    }
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
      fillHistoryRow(wrap, items[idx]);
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
          fillHistoryRow(el, item);
          list.appendChild(el);
        });
        if (page.nextCursor) { more.setAttribute('data-cursor', page.nextCursor); more.disabled = false; }
        else more.remove();
      }).catch(function () { more.disabled = false; });
    });
  }

  function noteRow(item) {
    var when = logic().relativeTime(item.updatedAt, Date.now(), langIsPt() ? 'pt' : 'en');
    return '<article class="ws-study-item"><div class="ws-item-symbol">' + escapeHtml(itemSymbol(item)) + '</div><div>' +
      '<h3 class="ws-item-title"></h3><div class="ws-item-note"></div><div class="ws-muted">' + escapeHtml(t('edited', '', { when: when })) + '</div></div>' +
      '<a class="ws-btn ws-btn-sm" href="' + escapeHtml(safeHref(item.href)) + '">' + escapeHtml(t('openMaterial')) + '</a></article>';
  }

  function fillNoteRow(el, item) {
    if (!el || !item) return;
    var title = el.querySelector('.ws-item-title');
    if (title) title.textContent = item.title || item.itemKey || '';
    var note = el.querySelector('.ws-item-note');
    if (note) note.textContent = item.note || '';
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
      items.map(noteRow).join('') + '</div>' +
      (notes.nextCursor ? '<button type="button" class="ws-btn" id="ws-notes-more" data-cursor="' + escapeHtml(notes.nextCursor) + '">' + escapeHtml(t('loadMore')) + '</button>' : '');
    node.querySelectorAll('#ws-notes-list .ws-study-item').forEach(function (wrap, idx) {
      fillNoteRow(wrap, items[idx]);
    });
    bindCursorMore($('ws-notes-more'), function (cursor) {
      return api.items({ hasNote: '1', limit: 40, cursor: cursor }, true);
    }, function (page) {
      var list = $('ws-notes-list');
      (page.items || []).forEach(function (item) {
        var wrap = document.createElement('div');
        wrap.innerHTML = noteRow(item);
        var el = wrap.firstChild;
        fillNoteRow(el, item);
        if (list && el) list.appendChild(el);
      });
    });
  }

  async function renderProgress(node, api) {
    node.innerHTML = sectionHead(t('progressTitle'), t('progressLede'), true) + skeleton();
    var progress = await api.progressList({ limit: 40 });
    var items = progress.items || [];
    node.innerHTML = sectionHead(t('progressTitle'), t('progressLede'), true) +
      (items.length
        ? '<div class="ws-grid" id="ws-progress-list">' + items.map(continueCard).join('') + '</div>' +
          (progress.nextCursor ? '<button type="button" class="ws-btn" id="ws-progress-more" data-cursor="' + escapeHtml(progress.nextCursor) + '">' + escapeHtml(t('loadMore')) + '</button>' : '')
        : emptyState(t('emptyProgressTitle'), t('emptyProgressBody')));
    bindCursorMore($('ws-progress-more'), function (cursor) {
      return api.progressList({ limit: 40, cursor: cursor }, true);
    }, function (page) {
      var list = $('ws-progress-list');
      (page.items || []).forEach(function (row) {
        var wrap = document.createElement('div');
        wrap.innerHTML = continueCard(row);
        if (list && wrap.firstChild) list.appendChild(wrap.firstChild);
      });
    });
  }

  function openBillingPortal(button) {
    if (logic().emitWorkspaceEvent) logic().emitWorkspaceEvent('billing_portal_open');
    ui().setBusy(button, true, t('openingPortal'));
    return fetch('/api/billing/portal', {
      method: 'POST',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
      body: '{}'
    }).then(function (res) {
      return res.json().catch(function () { return {}; }).then(function (data) {
        if (!res.ok || !data || !data.url) {
          var err = new Error(data.error || 'portal');
          err.status = res.status;
          err.code = data.code;
          throw err;
        }
        location.assign(data.url);
      });
    }).catch(function (err) {
      ui().setBusy(button, false);
      if (err && err.code === 'billing_customer_missing') toast(t('billingCustomerMissing'), 'danger');
      else toast(t(logic().uxError(err).bodyKey), 'danger');
    });
  }

  function renderAccount(user) {
    var node = $('app-study');
    if (!node || !user) return;
    var days = logic().trialDaysLeft(user.trialEndsAt);
    var period = user.billingPeriod === 'year' || user.billingPeriod === 'annual' ? t('annual') : (user.billingPeriod === 'month' || user.billingPeriod === 'monthly' ? t('monthly') : '');
    var currency = user.billingCurrency ? String(user.billingCurrency).toUpperCase() : '';
    var when = user.currentPeriodEnd ? logic().formatDate(user.currentPeriodEnd, langIsPt() ? 'pt' : 'en') : '';
    var state = logic().accountPlanState ? logic().accountPlanState(user) : { kind: user.isPro ? 'paid' : 'free', canManage: false };
    var planBlock;
    if (state.kind === 'auto_trial') {
      planBlock = '<h3>' + escapeHtml(t('trialPlan')) + '</h3><p>' + escapeHtml(days == null ? '' : t('trialDays', '', { n: days })) + '</p>' +
        '<a class="ws-btn ws-btn-primary" href="/pricing">' + escapeHtml(t('viewPlans')) + '</a>';
    } else if (state.kind === 'payment_issue') {
      planBlock = '<h3>' + escapeHtml(t('paymentIssue')) + '</h3><p>' + escapeHtml(t('paymentIssueBody')) + '</p>' +
        (state.canManage
          ? '<button type="button" class="ws-btn ws-btn-primary" id="ws-billing-portal">' + escapeHtml(t('manageBilling')) + '</button>'
          : '<a class="ws-btn ws-btn-primary" href="/pricing">' + escapeHtml(t('viewPlans')) + '</a>');
    } else if (state.kind === 'cancel_scheduled') {
      planBlock = '<h3>' + escapeHtml(t('proPlan')) + '</h3><p>' + escapeHtml(when ? t('activeUntil', '', { when: when }) : t('proActive')) + '</p>' +
        '<p>' + escapeHtml(t('wontRenew')) + '</p>' +
        (state.canManage
          ? '<button type="button" class="ws-btn ws-btn-primary" id="ws-billing-portal">' + escapeHtml(t('managePlan')) + '</button>'
          : '<a class="ws-btn" href="/pricing">' + escapeHtml(t('viewPlans')) + '</a>');
    } else if (state.kind === 'paid' || state.kind === 'billing_trial') {
      var meta = [t('proActive')];
      if (period) meta.push(period);
      if (currency) meta.push(currency);
      if (user.cancelAtPeriodEnd && when) meta.push(t('cancelsOn', '', { when: when }));
      planBlock = '<h3>' + escapeHtml(t('proPlan')) + '</h3><p>' + escapeHtml(meta.join(' · ')) + '</p>' +
        '<ul><li>' + escapeHtml(t('adsOff')) + '</li><li>' + escapeHtml(t('cloudOn')) + '</li><li>' + escapeHtml(t('reviewOn')) + '</li><li>' + escapeHtml(t('insightsOn')) + '</li><li>' + escapeHtml(t('focusOn')) + '</li></ul>' +
        (state.canManage
          ? '<button type="button" class="ws-btn ws-btn-primary" id="ws-billing-portal">' + escapeHtml(t('managePlan')) + '</button>'
          : '<a class="ws-btn ws-btn-primary" href="/pricing">' + escapeHtml(t('viewPlans')) + '</a>');
    } else {
      planBlock = '<h3>' + escapeHtml(t('freePlan')) + '</h3><p>' + escapeHtml(t('freePlanBody')) + '</p><a class="ws-btn ws-btn-primary" href="/pricing">' + escapeHtml(t('upgrade')) + '</a>';
    }
    node.innerHTML = sectionHead(t('accountTitle'), displayName(user)) +
      '<div class="ws-grid ws-grid-2"><section class="ws-account-card"><h3>' + escapeHtml(t('profile')) + '</h3>' +
      '<div class="ws-plan-row"><span>' + escapeHtml(t('email')) + '</span><strong></strong></div>' +
      '<div class="ws-plan-row"><span>' + escapeHtml(t('username')) + '</span><span id="ws-acc-user"></span></div>' +
      '<div class="ws-plan-row"><span>' + escapeHtml(t('security')) + '</span><span>' + escapeHtml(user.emailConfirmed ? t('emailConfirmed') : t('emailPending')) + '</span></div>' +
      '<div class="ws-plan-row"><span>' + escapeHtml(t('resetPassword')) + '</span><a href="/forgot-password">' + escapeHtml(t('resetPassword')) + '</a></div>' +
      '</section><section class="ws-account-card" id="ws-plan-card">' + planBlock + '</section></div>';
    var emailRow = node.querySelector('.ws-account-card strong');
    if (emailRow) emailRow.textContent = user.email || '—';
    var userRow = $('ws-acc-user');
    if (userRow) userRow.textContent = user.username || '—';
    var portalBtn = $('ws-billing-portal');
    if (portalBtn) portalBtn.addEventListener('click', function () { openBillingPortal(portalBtn); });
  }

  function renderFreeOverview(user) {
    var node = $('app-study');
    var name = displayName(user);
    var hour = logic().greetingKey();
    var greet = t(hour === 'morning' ? 'greetingMorning' : hour === 'afternoon' ? 'greetingAfternoon' : 'greetingEvening', '', { name: name });
    node.innerHTML = '<p class="ws-kicker">Atomurus</p><h1 class="ws-title">' + escapeHtml(greet) + '</h1>' +
      '<section class="ws-hero"><div><h2 class="ws-hero-title">' + escapeHtml(t('workspaceFreeTitle')) + '</h2>' +
      '<p class="ws-hero-copy">' + escapeHtml(t('publicLabRemainsFree')) + '</p>' +
      '<p class="ws-hero-copy">' + escapeHtml(t('upgradeFor')) + ' ' + escapeHtml(t('upgradeForList')) + '</p>' +
      '<a class="ws-btn ws-btn-primary" href="/pricing">' + escapeHtml(t('explorePro')) + '</a></div></section>' +
      '<div class="ws-grid ws-grid-3">' +
      '<a class="ws-lab-card" href="/periodic-table.html"><h3 class="ws-lab-card-title">' + escapeHtml(t('openTable')) + '</h3></a>' +
      '<a class="ws-lab-card" href="/calculators.html"><h3 class="ws-lab-card-title">' + escapeHtml(t('publicCalc')) + '</h3></a>' +
      '<a class="ws-lab-card" href="/viewer/atomic-models.html"><h3 class="ws-lab-card-title">' + escapeHtml(t('openViewer')) + '</h3></a>' +
      '<a class="ws-lab-card" href="/explore.html"><h3 class="ws-lab-card-title">' + escapeHtml(t('openExplore')) + '</h3></a>' +
      '</div>';
  }

  function resetStudyRoot() {
    var node = $('app-study');
    if (!node || !node.parentNode) return node;
    var clone = node.cloneNode(false);
    node.parentNode.replaceChild(clone, node);
    return clone;
  }

  async function loadStudyCloud(user) {
    currentUser = user;
    renderNav(user);
    var node = resetStudyRoot();
    if (!node) return;
    var section = studySection();
    if (section === 'account') {
      renderAccount(user);
      return;
    }
    if (section === 'pro-lab') {
      node.innerHTML = '<p class="ws-kicker">' + escapeHtml(t('proLabKicker')) + '</p><h1 class="ws-title">' + escapeHtml(t('proLab')) + '</h1>';
      var mountLab = function () {
        return window.AtomurusProLab.mount(node, {
          user: user,
          t: t,
          escapeHtml: escapeHtml,
          logic: logic(),
          ui: ui(),
          study: window.AtomurusStudy
        });
      };
      if (window.AtomurusProLab && typeof window.AtomurusProLab.mount === 'function') {
        return Promise.resolve(mountLab()).catch(function (err) { friendlyCatch(node, err); });
      }
      return new Promise(function (resolve) {
        var tries = 0;
        var timer = window.setInterval(function () {
          tries += 1;
          if (window.AtomurusProLab && typeof window.AtomurusProLab.mount === 'function') {
            window.clearInterval(timer);
            resolve(Promise.resolve(mountLab()).catch(function (err) { friendlyCatch(node, err); }));
          } else if (tries > 50) {
            window.clearInterval(timer);
            resolve();
          }
        }, 40);
      });
    }
    if (!proUser(user)) {
      if (section === 'overview') renderFreeOverview(user);
      else if (section === 'insights') renderLockedInsights();
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
      if (section === 'insights') { await renderInsights(node, api); return; }
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

  function closeDropdowns(except) {
    document.querySelectorAll('.ws-dropdown.is-open').forEach(function (el) {
      if (el !== except) el.classList.remove('is-open');
    });
  }

  function initNavChrome() {
    if (initNavChrome.bound) return;
    initNavChrome.bound = true;
    var btn = $('ws-menu-btn');
    var shell = $('ws-shell');
    var backdrop = $('ws-drawer-backdrop');
    function drawerChrome() {
      return [
        document.querySelector('.ws-main'),
        $('ws-bottom'),
        document.querySelector('.ws-search'),
        document.querySelector('.ws-topbar-actions')
      ];
    }
    function close(restore) {
      var wasOpen = shell && shell.classList.contains('is-nav-open');
      if (shell) shell.classList.remove('is-nav-open');
      if (btn) btn.setAttribute('aria-expanded', 'false');
      if (backdrop) backdrop.hidden = true;
      var sidebar = $('ws-sidebar');
      if (sidebar) {
        sidebar.removeAttribute('aria-modal');
        sidebar.removeAttribute('role');
      }
      drawerChrome().forEach(function (node) {
        if (node) node.removeAttribute('inert');
      });
      if (restore && wasOpen && btn) btn.focus();
    }
    function open() {
      if (shell) shell.classList.add('is-nav-open');
      if (btn) btn.setAttribute('aria-expanded', 'true');
      if (backdrop) backdrop.hidden = false;
      var sidebar = $('ws-sidebar');
      drawerChrome().forEach(function (node) {
        if (node) node.setAttribute('inert', '');
      });
      if (sidebar) {
        sidebar.setAttribute('aria-modal', 'true');
        sidebar.setAttribute('role', 'dialog');
        var first = sidebar.querySelector('a, button');
        if (first) window.setTimeout(function () { first.focus(); }, 20);
      }
    }
    function onDrawerKey(event) {
      if (!shell || !shell.classList.contains('is-nav-open')) return;
      if (event.key === 'Escape') {
        close(true);
        return;
      }
      if (event.key === 'Tab' && ui().trapTab) ui().trapTab(event, $('ws-sidebar'));
    }
    if (btn) btn.addEventListener('click', function () {
      if (shell && shell.classList.contains('is-nav-open')) close(); else open();
    });
    if (backdrop) backdrop.addEventListener('click', function () { close(true); });
    document.addEventListener('keydown', function (event) {
      onDrawerKey(event);
      if (event.key !== 'Escape') return;
      closeDropdowns();
    });
    document.addEventListener('click', function (event) {
      var drop = event.target && event.target.closest && event.target.closest('.ws-dropdown');
      closeDropdowns(drop);
      var navClick = event.target && event.target.closest && event.target.closest('#ws-sidebar a, #ws-sidebar button, #ws-bottom a');
      if (navClick) close();
    });
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
    if (window.I18N && typeof window.I18N.onChange === 'function' && !boot.i18nBound) {
      boot.i18nBound = true;
      window.I18N.onChange(function () {
        if (!currentUser) return;
        if (reviewSession && reviewSession.active) {
          renderNav(currentUser);
          return;
        }
        void loadStudyCloud(currentUser);
      });
    }
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
