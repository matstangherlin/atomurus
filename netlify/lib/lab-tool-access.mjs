/**
 * Access policy for public-lab tools that already exist.
 *
 * Guest (no account): periodic table, element pages, Explore, molar mass, dilution.
 * Signed-in Free: plus scientific calculator, unit converter, ideal gas, pH.
 * Pro / trial: plus 3D viewers, isomerism, allotropes, element compare,
 *              and the public stoichiometry / thermodynamics calculators.
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
  if (path.includes('/explore/')) return { need: 'public', tool: null };
  if (/\/periodic-table\/compare$/.test(path)) {
    return { need: 'pro', tool: 'elementCompare' };
  }
  if (
    /\/viewer\/molecules/.test(path) ||
    /(^|\/)molecules$/.test(path)
  ) {
    return { need: 'pro', tool: 'moleculeViewer' };
  }
  if (/\/viewer\/atomic-models/.test(path) || /\/atomic-models(\/|$)/.test(path)) {
    return { need: 'pro', tool: 'atomicModels' };
  }
  if (/\/viewer\/allotropes/.test(path) || /(^|\/)allotropes$/.test(path)) {
    return { need: 'pro', tool: 'allotropes' };
  }
  if (/\/viewer\/isomerism/.test(path) || /(^|\/)isomerism(\/|$)/.test(path)) {
    return { need: 'pro', tool: 'isomerism' };
  }
  return { need: 'public', tool: null };
}

export function calcTabPolicy(tab) {
  return CALC_TAB_POLICY[String(tab || '')] || 'public';
}

export function allowTool(need, session = {}) {
  const required = String(need || 'public');
  if (required === 'public') return true;
  if (required === 'login') return Boolean(session.signedIn);
  if (required === 'pro') return Boolean(session.isPro);
  return true;
}
