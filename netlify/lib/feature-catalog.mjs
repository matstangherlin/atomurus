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
 * must read this catalog. Do not duplicate matrices in page scripts: the
 * browser copy, assets/access-policy.js, is generated from this file
 * (node tools/build-access-policy.mjs).
 */

export const ACCESS = Object.freeze({
  PUBLIC: 'public',
  ACCOUNT: 'account',
  PRO: 'pro'
});

/* The access each feature has before the owner's switches below. */
export const BASE_FEATURES = Object.freeze({
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

/* Owner switches (prompt 34; docs/product/escopo-gratuito-e-plano-escolar.md).
   The defaults reproduce today's access exactly — tools/test-feature-access-snapshot.mjs
   proves it. FREE_TIER_OVERRIDES maps a feature to 'public' or 'account' and can
   only open a feature, never restrict one; adsFree follows Pro and is not
   overridable (ads stay off, prompt 04). */
export const FREE_TIER_OVERRIDES = Object.freeze({});
export const SCHOOL_PLAN_ENABLED = false;
export const SCHOOL_PLAN_FEATURES = Object.freeze([]);
export const ACCESS_CONFIG = Object.freeze({ FREE_TIER_OVERRIDES, SCHOOL_PLAN_ENABLED, SCHOOL_PLAN_FEATURES });

const RANK = { public: 0, account: 1, pro: 2 };
const NOT_OVERRIDABLE = new Set(['adsFree']);

/* Checks a configuration and returns it normalized; throws on a mistake so a
   typo cannot silently open or keep closed the wrong feature. */
export function resolveAccessConfig(config = ACCESS_CONFIG) {
  const overrides = (config && config.FREE_TIER_OVERRIDES) || {};
  for (const [key, access] of Object.entries(overrides)) {
    if (!BASE_FEATURES[key]) throw new Error(`FREE_TIER_OVERRIDES: unknown feature ${key}`);
    if (NOT_OVERRIDABLE.has(key)) throw new Error(`FREE_TIER_OVERRIDES: ${key} cannot be overridden`);
    if (access !== ACCESS.PUBLIC && access !== ACCESS.ACCOUNT) throw new Error(`FREE_TIER_OVERRIDES: ${key} must be 'public' or 'account'`);
    if (RANK[access] > RANK[BASE_FEATURES[key].access]) throw new Error(`FREE_TIER_OVERRIDES: ${key} can only be opened, not restricted`);
  }
  const schoolFeatures = Array.from((config && config.SCHOOL_PLAN_FEATURES) || []);
  for (const key of schoolFeatures) {
    if (!BASE_FEATURES[key] || NOT_OVERRIDABLE.has(key)) throw new Error(`SCHOOL_PLAN_FEATURES: ${key} is not a feature a seat can grant`);
  }
  return { overrides, schoolEnabled: Boolean(config && config.SCHOOL_PLAN_ENABLED === true), schoolFeatures };
}

function buildFeatures(config) {
  const { overrides } = resolveAccessConfig(config);
  return Object.freeze(Object.fromEntries(Object.entries(BASE_FEATURES).map(([key, spec]) => [
    key,
    overrides[key] ? Object.freeze({ ...spec, access: overrides[key] }) : spec
  ])));
}

const BASE_LAB_TABS = Object.freeze({
  molar: { access: 'public', feature: null },
  dilute: { access: 'public', feature: null },
  scientific: { access: 'public', feature: 'scientificCalculator' },
  unit: { access: 'public', feature: 'unitConverter' },
  ideal: { access: 'public', feature: 'idealGasCalculator' },
  ph: { access: 'public', feature: 'phCalculator' },
  stoich: { access: 'pro', feature: 'publicStoichiometry' },
  thermo: { access: 'pro', feature: 'publicThermodynamics' }
});

const BASE_PAGE_TOOLS = Object.freeze({
  elementCompare: { access: 'public', feature: 'publicElementCompare' },
  moleculeViewer: { access: 'public', feature: 'moleculeViewer' },
  atomicModels: { access: 'public', feature: 'atomicModelViewer' },
  allotropes: { access: 'public', feature: 'allotropeViewer' },
  isomerism: { access: 'public', feature: 'isomerismViewer' }
});

/* Which page is which tool, in the order they are tested; /explore/ pages are
   always public. Used by lab-tool-access.mjs and, through the generated copy,
   by assets/lab-tool-gate.js. */
export const PAGE_TOOL_ROUTES = Object.freeze([
  { tool: 'elementCompare', kind: 'compare', patterns: ['/periodic-table/compare$'] },
  { tool: 'moleculeViewer', kind: 'viewer', patterns: ['/viewer/molecules', '(^|/)molecules$'] },
  { tool: 'atomicModels', kind: 'viewer', patterns: ['/viewer/atomic-models', '/atomic-models(/|$)'] },
  { tool: 'allotropes', kind: 'viewer', patterns: ['/viewer/allotropes', '(^|/)allotropes$'] },
  { tool: 'isomerism', kind: 'viewer', patterns: ['/viewer/isomerism', '(^|/)isomerism(/|$)'] }
]);

/* A tab or a page tool follows the access of its feature. */
function withFeatureAccess(table, features) {
  return Object.freeze(Object.fromEntries(Object.entries(table).map(([id, spec]) => [
    id,
    Object.freeze({ ...spec, access: spec.feature ? features[spec.feature].access : spec.access })
  ])));
}

function buildCatalog(config) {
  const features = buildFeatures(config);
  return Object.freeze({
    FEATURES: features,
    LAB_TABS: withFeatureAccess(BASE_LAB_TABS, features),
    PAGE_TOOLS: withFeatureAccess(BASE_PAGE_TOOLS, features)
  });
}
const DEFAULT_CATALOG = buildCatalog(ACCESS_CONFIG);

/* The catalog a configuration makes: { FEATURES, LAB_TABS, PAGE_TOOLS }. */
export function accessCatalog(config = ACCESS_CONFIG) {
  return config === ACCESS_CONFIG ? DEFAULT_CATALOG : buildCatalog(config);
}

export const FEATURES = DEFAULT_CATALOG.FEATURES;
export const LAB_TABS = DEFAULT_CATALOG.LAB_TABS;
export const PAGE_TOOLS = DEFAULT_CATALOG.PAGE_TOOLS;

export function featureAccess(featureKey, config = ACCESS_CONFIG) {
  const spec = accessCatalog(config).FEATURES[featureKey];
  return spec ? spec.access : 'pro';
}

/* isSchool: a school seat (plan 'school'), which only exists while
   SCHOOL_PLAN_ENABLED is on; it adds SCHOOL_PLAN_FEATURES to a free account. */
export function featuresForAccess({ signedIn = false, isPro = false, isAdmin = false, isSchool = false } = {}, config = ACCESS_CONFIG) {
  const { schoolEnabled, schoolFeatures } = resolveAccessConfig(config);
  const seat = schoolEnabled && isSchool ? new Set(schoolFeatures) : null;
  const features = {};
  for (const [id, spec] of Object.entries(accessCatalog(config).FEATURES)) {
    if (spec.access === 'public') features[id] = true;
    else if (spec.access === 'account') features[id] = Boolean(signedIn || isPro);
    else features[id] = Boolean(isPro || (seat && seat.has(id)));
  }
  features.adminConsole = Boolean(isAdmin);
  features.adsFree = Boolean(isPro);
  return features;
}
