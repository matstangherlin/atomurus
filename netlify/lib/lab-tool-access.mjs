/**
 * Access policy for public-lab tools that already exist.
 *
 * Presentation matrix is derived from netlify/lib/feature-catalog.mjs.
 * Premium execution is authorized with requireFeature() on the server —
 * not by this module alone.
 */

import { FEATURES, LAB_TABS, PAGE_TOOLS } from './feature-catalog.mjs';

export const CALC_TAB_POLICY = Object.freeze(
  Object.fromEntries(Object.entries(LAB_TABS).map(([tab, spec]) => [tab, spec.access]))
);

export const CALC_TAB_FEATURE = Object.freeze(
  Object.fromEntries(Object.entries(LAB_TABS).map(([tab, spec]) => [tab, spec.feature]))
);

export const PAGE_TOOL_FEATURE = Object.freeze(
  Object.fromEntries(Object.entries(PAGE_TOOLS).map(([tool, spec]) => [tool, spec.feature]))
);

function compactPath(pathname) {
  return String(pathname || '')
    .split('?')[0]
    .split('#')[0]
    .replace(/\.html?$/i, '')
    .replace(/\.pt$/i, '')
    .replace(/\/+$/, '') || '/';
}

function needForFeature(featureKey, fallback = 'public') {
  const spec = FEATURES[featureKey];
  return spec?.access || fallback;
}

export function pageToolPolicy(pathname) {
  const path = compactPath(pathname);
  if (path.includes('/explore/')) return { need: 'public', tool: null, feature: null };
  if (/\/periodic-table\/compare$/.test(path)) {
    return {
      need: needForFeature('publicElementCompare'),
      tool: 'elementCompare',
      feature: 'publicElementCompare'
    };
  }
  if (
    /\/viewer\/molecules/.test(path) ||
    /(^|\/)molecules$/.test(path)
  ) {
    return {
      need: needForFeature('moleculeViewer'),
      tool: 'moleculeViewer',
      feature: 'moleculeViewer'
    };
  }
  if (/\/viewer\/atomic-models/.test(path) || /\/atomic-models(\/|$)/.test(path)) {
    return {
      need: needForFeature('atomicModelViewer'),
      tool: 'atomicModels',
      feature: 'atomicModelViewer'
    };
  }
  if (/\/viewer\/allotropes/.test(path) || /(^|\/)allotropes$/.test(path)) {
    return {
      need: needForFeature('allotropeViewer'),
      tool: 'allotropes',
      feature: 'allotropeViewer'
    };
  }
  if (/\/viewer\/isomerism/.test(path) || /(^|\/)isomerism(\/|$)/.test(path)) {
    return {
      need: needForFeature('isomerismViewer'),
      tool: 'isomerism',
      feature: 'isomerismViewer'
    };
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
  if (required === 'login' || required === 'account') {
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
