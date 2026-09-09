/* Atomurus Pro feature catalog — live tools only.
   Counts live in assets/product-catalog.js. This file is the plan copy source. */
(function (root) {
  'use strict';

  var CATEGORIES = [
    { id: 'study', titleEn: 'Study', titlePt: 'Estudo', ledeEn: 'Remember what you learn.', ledePt: 'Lembre o que você estuda.' },
    { id: 'solve', titleEn: 'Solve', titlePt: 'Resolver', ledeEn: 'Work through chemistry problems.', ledePt: 'Resolva problemas de química.' },
    { id: 'analyze', titleEn: 'Analyze', titlePt: 'Analisar', ledeEn: 'Compare chemical data.', ledePt: 'Compare dados químicos.' },
    { id: 'visualize', titleEn: 'Visualize', titlePt: 'Visualizar', ledeEn: 'Explore structures in 3D.', ledePt: 'Explore estruturas em 3D.' }
  ];

  var FEATURES = [
    { id: 'studyLibrary', category: 'study', access: 'account', status: 'live', route: '/app?section=library', titleEn: 'Study Library', titlePt: 'Biblioteca', shortEn: 'Save elements, molecules and articles.', shortPt: 'Salve elementos, moléculas e artigos.' },
    { id: 'studySets', category: 'study', access: 'account', status: 'live', route: '/app?section=sets', titleEn: 'Study Sets', titlePt: 'Study Sets', shortEn: 'Group material into collections.', shortPt: 'Agrupe material em coleções.' },
    { id: 'smartReview', category: 'study', access: 'pro', status: 'live', route: '/app?section=review', titleEn: 'Smart Review', titlePt: 'Smart Review', shortEn: 'Spaced flashcards when they are due.', shortPt: 'Flashcards com repetição espaçada.' },
    { id: 'focusReview', category: 'study', access: 'pro', status: 'live', route: '/app?section=review', titleEn: 'Focus Review', titlePt: 'Focus Review', shortEn: 'Review the cards that need extra attention.', shortPt: 'Revise os cards que mais precisam de atenção.' },
    { id: 'studyInsights', category: 'study', access: 'pro', status: 'live', route: '/app?section=insights', titleEn: 'Study Insights', titlePt: 'Insights', shortEn: 'See how your study is progressing.', shortPt: 'Veja como o estudo está avançando.' },
    { id: 'studyProgress', category: 'study', access: 'account', status: 'live', route: '/app?section=progress', titleEn: 'Progress', titlePt: 'Progresso', shortEn: 'Pick up where you left off.', shortPt: 'Retome de onde parou.' },
    { id: 'reactionWorkbench', category: 'solve', access: 'pro', status: 'live', route: '/app?section=pro-lab&tool=reactions', titleEn: 'Reaction Workbench', titlePt: 'Laboratório de Reações', shortEn: 'Balance equations and continue into stoichiometry.', shortPt: 'Balanceie equações e siga para a estequiometria.' },
    { id: 'formulaSolver', category: 'solve', access: 'pro', status: 'live', route: '/app?section=pro-lab&tool=formula', titleEn: 'Formula Solver', titlePt: 'Formula Solver', shortEn: 'Work with empirical and molecular formulas.', shortPt: 'Trabalhe fórmulas empíricas e moleculares.' },
    { id: 'solutionBuilder', category: 'solve', access: 'pro', status: 'live', route: '/app?section=pro-lab&tool=solutions', titleEn: 'Solution Builder', titlePt: 'Preparação de Soluções', shortEn: 'Prepare and compare solution calculations.', shortPt: 'Prepare e compare cálculos de soluções.' },
    { id: 'advancedCalculations', category: 'solve', access: 'pro', status: 'live', route: '/app?section=pro-lab&tool=calculations', titleEn: 'Advanced Calculations', titlePt: 'Cálculos avançados', shortEn: 'Compare multiple scenarios.', shortPt: 'Compare vários cenários.' },
    { id: 'elementCompare', category: 'analyze', access: 'pro', status: 'live', route: '/app?section=pro-lab&tool=elements', titleEn: 'Element Compare', titlePt: 'Comparar elementos', shortEn: 'Compare periodic properties side by side.', shortPt: 'Compare propriedades periódicas lado a lado.' },
    { id: 'moleculeCompare', category: 'analyze', access: 'pro', status: 'live', route: '/app?section=pro-lab&tool=molecules', titleEn: 'Molecule Compare', titlePt: 'Comparar moléculas', shortEn: 'Compare molecular composition.', shortPt: 'Compare a composição molecular.' },
    { id: 'atomicCompare', category: 'analyze', access: 'pro', status: 'live', route: '/app?section=pro-lab&tool=atomic', titleEn: 'Atomic Compare', titlePt: 'Comparar átomos', shortEn: 'Compare electronic structure.', shortPt: 'Compare a estrutura eletrônica.' },
    { id: 'labSessions', category: 'analyze', access: 'pro', status: 'live', route: '/app?section=pro-lab&tool=sessions', titleEn: 'Saved Lab Sessions', titlePt: 'Sessões salvas', shortEn: 'Reopen analyses in Pro Lab.', shortPt: 'Reabra análises no Pro Lab.' },
    { id: 'atomicModelViewer', category: 'visualize', access: 'public', status: 'live', route: '/viewer/atomic-models.html', titleEn: 'Atomic Models', titlePt: 'Modelos atômicos', shortEn: 'Inspect atomic models in 3D.', shortPt: 'Veja modelos atômicos em 3D.' },
    { id: 'moleculeViewer', category: 'visualize', access: 'public', status: 'live', route: '/viewer/molecules.html', titleEn: 'Molecules', titlePt: 'Moléculas', shortEn: 'Explore molecular structures.', shortPt: 'Explore estruturas moleculares.' },
    { id: 'allotropeViewer', category: 'visualize', access: 'public', status: 'live', route: '/viewer/allotropes.html', titleEn: 'Allotropes', titlePt: 'Alótropos', shortEn: 'Compare allotrope structures.', shortPt: 'Explore estruturas alotrópicas.' },
    { id: 'isomerismViewer', category: 'visualize', access: 'public', status: 'live', route: '/viewer/isomerism.html', titleEn: 'Isomerism', titlePt: 'Isomeria', shortEn: 'Inspect isomerism in 3D.', shortPt: 'Veja isomeria em 3D.' }
  ];

  function ptLang() {
    return (root.document && (root.document.documentElement.lang || '').toLowerCase().indexOf('pt') === 0);
  }

  function localize(row) {
    var pt = ptLang();
    return {
      id: row.id,
      category: row.category,
      access: row.access,
      accessLevel: row.access,
      status: row.status,
      route: row.route,
      title: pt ? row.titlePt : row.titleEn,
      shortDescription: pt ? row.shortPt : row.shortEn
    };
  }

  function byCategory(id, access) {
    return FEATURES.filter(function (row) {
      if (row.category !== id) return false;
      if (access) return row.access === access;
      return true;
    }).map(localize);
  }

  root.AtomurusProFeatures = {
    categories: CATEGORIES,
    all: FEATURES,
    localize: localize,
    byCategory: byCategory,
    byId: function (id) {
      var row = FEATURES.filter(function (item) { return item.id === id; })[0];
      return row ? localize(row) : null;
    },
    grouped: function () {
      return CATEGORIES.map(function (cat) {
        var pt = ptLang();
        return {
          id: cat.id,
          title: pt ? cat.titlePt : cat.titleEn,
          lede: pt ? cat.ledePt : cat.ledeEn,
          features: byCategory(cat.id, 'pro')
        };
      }).filter(function (group) { return group.features.length; });
    }
  };
})(typeof window !== 'undefined' ? window : this);
