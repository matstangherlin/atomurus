/**
 * Atomurus access-model V2 — source of truth.
 *
 * Access values: public | account | pro
 *
 * FREE / Open Lab  — explore and visualize chemistry
 * FREE ACCOUNT     — save, organize, continue learning
 * PRO              — solve, simulate, analyze, experiment
 *
 * Presentation (lab-tool-gate) and entitlements (plan-access / requireFeature)
 * must read this catalog. Do not duplicate matrices in page scripts.
 */

export const ACCESS = Object.freeze({
  PUBLIC: 'public',
  ACCOUNT: 'account',
  PRO: 'pro'
});

export const FEATURES = Object.freeze({
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

  premiumLessons: { access: 'pro', category: 'study' },
  smartReview: { access: 'pro', category: 'study' },
  spacedRepetition: { access: 'pro', category: 'study' },
  studyInsights: { access: 'pro', category: 'study' },
  focusReview: { access: 'pro', category: 'study' },
  advancedStudyStats: { access: 'pro', category: 'study' },
  exportPdf: { access: 'pro', category: 'study' },
  automatedPractice: { access: 'pro', category: 'study' },

  virtualLab: { access: 'account', category: 'lab' },
  virtualLabAdvanced: { access: 'pro', category: 'lab' },

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
});

export const LAB_TABS = Object.freeze({
  molar: { access: 'public', feature: null },
  dilute: { access: 'public', feature: null },
  scientific: { access: 'public', feature: 'scientificCalculator' },
  unit: { access: 'public', feature: 'unitConverter' },
  ideal: { access: 'public', feature: 'idealGasCalculator' },
  ph: { access: 'public', feature: 'phCalculator' },
  stoich: { access: 'pro', feature: 'publicStoichiometry' },
  thermo: { access: 'pro', feature: 'publicThermodynamics' }
});

export const PAGE_TOOLS = Object.freeze({
  elementCompare: { access: 'public', feature: 'publicElementCompare' },
  moleculeViewer: { access: 'public', feature: 'moleculeViewer' },
  atomicModels: { access: 'public', feature: 'atomicModelViewer' },
  allotropes: { access: 'public', feature: 'allotropeViewer' },
  isomerism: { access: 'public', feature: 'isomerismViewer' }
});

export function featureAccess(featureKey) {
  const spec = FEATURES[featureKey];
  return spec ? spec.access : 'pro';
}

export function featuresForAccess({ signedIn = false, isPro = false, isAdmin = false } = {}) {
  const features = {};
  for (const [id, spec] of Object.entries(FEATURES)) {
    if (spec.access === 'public') features[id] = true;
    else if (spec.access === 'account') features[id] = Boolean(signedIn || isPro);
    else features[id] = Boolean(isPro);
  }
  features.adminConsole = Boolean(isAdmin);
  features.adsFree = Boolean(isPro);
  return features;
}
