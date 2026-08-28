/**
 * Access policy for public-lab tools that already exist.
 *
 * OPEN LAB (guest): periodic table, element pages, Explore, molar mass, dilution.
 * FREE ACCOUNT (signed-in): plus scientific calculator, unit converter, ideal gas, pH.
 * PRO / trial: plus 3D viewers, isomerism, allotropes, element compare,
 *              and the public stoichiometry / thermodynamics calculators.
 *
 * This file is the presentation policy matrix. Premium execution is authorized
 * with requireFeature() on the server — not by this module alone.
 */

export const CALC_TAB_POLICY = Object.freeze({
  molar: 'public',
  dilute: 'public',
  scientific: 'login',
  unit: 'login',
  ideal: 'login',
  ph: 'login',
  stoich: 'pro',
  thermo: 'pro'
});

export const CALC_TAB_FEATURE = Object.freeze({
  scientific: 'scientificCalculator',
  unit: 'unitConverter',
  ideal: 'idealGasCalculator',
  ph: 'phCalculator',
  stoich: 'publicStoichiometry',
  thermo: 'publicThermodynamics'
});

export const PAGE_TOOL_FEATURE = Object.freeze({
  elementCompare: 'publicElementCompare',
  moleculeViewer: 'moleculeViewer',
  atomicModels: 'atomicModelViewer',
  allotropes: 'allotropeViewer',
  isomerism: 'isomerismViewer'
});

function compactPath(pathname) {
  return String(pathname || '')
    .split('?')[0]
    .split('#')[0]
    .replace(/\.html?$/i, '')
    .replace(/\.pt$/i, '')
    .replace(/\/+$/, '') || '/';
}

export function pageToolPolicy(pathname) {
  const path = compactPath(pathname);
  if (path.includes('/explore/')) return { need: 'public', tool: null, feature: null };
  if (/\/periodic-table\/compare$/.test(path)) {
    return { need: 'pro', tool: 'elementCompare', feature: 'publicElementCompare' };
  }
  if (
    /\/viewer\/molecules/.test(path) ||
    /(^|\/)molecules$/.test(path)
  ) {
    return { need: 'pro', tool: 'moleculeViewer', feature: 'moleculeViewer' };
  }
  if (/\/viewer\/atomic-models/.test(path) || /\/atomic-models(\/|$)/.test(path)) {
    return { need: 'pro', tool: 'atomicModels', feature: 'atomicModelViewer' };
  }
  if (/\/viewer\/allotropes/.test(path) || /(^|\/)allotropes$/.test(path)) {
    return { need: 'pro', tool: 'allotropes', feature: 'allotropeViewer' };
  }
  if (/\/viewer\/isomerism/.test(path) || /(^|\/)isomerism(\/|$)/.test(path)) {
    return { need: 'pro', tool: 'isomerism', feature: 'isomerismViewer' };
  }
  return { need: 'public', tool: null, feature: null };
}

export function calcTabPolicy(tab) {
  return CALC_TAB_POLICY[String(tab || '')] || 'public';
}

export function calcTabFeature(tab) {
  return CALC_TAB_FEATURE[String(tab || '')] || null;
}

export function allowTool(need, session = {}, featureKey = null) {
  const required = String(need || 'public');
  if (required === 'public') return true;
  if (required === 'login') {
    if (featureKey && session.features) return Boolean(session.features[featureKey] || session.signedIn);
    return Boolean(session.signedIn);
  }
  if (required === 'pro') {
    if (session.ready !== true) return false;
    if (featureKey) return Boolean(session.features && session.features[featureKey]);
    return false;
  }
  return true;
}
