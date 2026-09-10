/* Atomurus access-model V2 — browser mirror of netlify/lib/feature-catalog.mjs
   Keep keys and access values in lockstep. tools/test-feature-catalog.mjs compares them. */
(function (root) {
  'use strict';

  var FEATURES = {
    labWorkspace: { access: 'public', category: 'workspace' },
    scientificCalculator: { access: 'public', category: 'calculator' },
    unitConverter: { access: 'public', category: 'calculator' },
    idealGasCalculator: { access: 'public', category: 'calculator' },
    phCalculator: { access: 'public', category: 'calculator' },
    interactiveViewers: { access: 'public', category: 'visualize' },
    atomicModelViewer: { access: 'public', category: 'visualize' },
    moleculeViewer: { access: 'public', category: 'visualize' },
    allotropeViewer: { access: 'public', category: 'visualize' },
    isomerismViewer: { access: 'public', category: 'visualize' },
    publicElementCompare: { access: 'public', category: 'visualize' },
    studyCloud: { access: 'account', category: 'study' },
    studyProgress: { access: 'account', category: 'study' },
    favorites: { access: 'account', category: 'study' },
    calculatorHistory: { access: 'account', category: 'study' },
    studyNotes: { access: 'account', category: 'study' },
    studyTags: { access: 'account', category: 'study' },
    studySets: { access: 'account', category: 'study' },
    flashcards: { access: 'account', category: 'study' },
    virtualLab: { access: 'account', category: 'lab' },
    virtualLabAdvanced: { access: 'pro', category: 'lab' },
    premiumLessons: { access: 'pro', category: 'study' },
    smartReview: { access: 'pro', category: 'study' },
    spacedRepetition: { access: 'pro', category: 'study' },
    studyInsights: { access: 'pro', category: 'study' },
    focusReview: { access: 'pro', category: 'study' },
    advancedStudyStats: { access: 'pro', category: 'study' },
    exportPdf: { access: 'pro', category: 'study' },
    automatedPractice: { access: 'pro', category: 'study' },
    adsFree: { access: 'pro', category: 'platform' },
    proLab: { access: 'pro', category: 'solve' },
    advancedCalculations: { access: 'pro', category: 'solve' },
    chemistrySolver: { access: 'pro', category: 'solve' },
    reactionWorkbench: { access: 'pro', category: 'solve' },
    reactionBalancer: { access: 'pro', category: 'solve' },
    stoichiometrySolver: { access: 'pro', category: 'solve' },
    limitingReagentSolver: { access: 'pro', category: 'solve' },
    yieldSolver: { access: 'pro', category: 'solve' },
    formulaSolver: { access: 'pro', category: 'solve' },
    solutionBuilder: { access: 'pro', category: 'solve' },
    publicStoichiometry: { access: 'pro', category: 'solve' },
    publicThermodynamics: { access: 'pro', category: 'solve' },
    advancedElementCompare: { access: 'pro', category: 'analyze' },
    advancedMoleculeCompare: { access: 'pro', category: 'analyze' },
    advancedAtomicCompare: { access: 'pro', category: 'analyze' },
    savedLabSessions: { access: 'pro', category: 'analyze' }
  };

  var LAB_TABS = {
    molar: { access: 'public', feature: null },
    dilute: { access: 'public', feature: null },
    scientific: { access: 'public', feature: 'scientificCalculator' },
    unit: { access: 'public', feature: 'unitConverter' },
    ideal: { access: 'public', feature: 'idealGasCalculator' },
    ph: { access: 'public', feature: 'phCalculator' },
    stoich: { access: 'pro', feature: 'publicStoichiometry' },
    thermo: { access: 'pro', feature: 'publicThermodynamics' }
  };

  var PAGE_TOOLS = {
    elementCompare: { access: 'public', feature: 'publicElementCompare' },
    moleculeViewer: { access: 'public', feature: 'moleculeViewer' },
    atomicModels: { access: 'public', feature: 'atomicModelViewer' },
    allotropes: { access: 'public', feature: 'allotropeViewer' },
    isomerism: { access: 'public', feature: 'isomerismViewer' }
  };

  root.ATOMURUS_ACCESS = {
    FEATURES: FEATURES,
    LAB_TABS: LAB_TABS,
    PAGE_TOOLS: PAGE_TOOLS,
    featureAccess: function (featureKey) {
      var spec = FEATURES[featureKey];
      return spec ? spec.access : 'pro';
    }
  };
})(typeof window !== 'undefined' ? window : this);
