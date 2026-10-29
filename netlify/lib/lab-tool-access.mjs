/**
 * Access policy for public-lab tools that already exist.
 *
 * Presentation matrix is derived from netlify/lib/feature-catalog.mjs.
 * Premium execution is authorized with requireFeature() on the server —
 * not by this module alone.
 */

import { FEATURES, LAB_TABS, PAGE_TOOLS, PAGE_TOOL_ROUTES } from './feature-catalog.mjs';

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
  for (const route of PAGE_TOOL_ROUTES) {
    if (route.patterns.some((p) => new RegExp(p).test(path))) {
      const feature = PAGE_TOOLS[route.tool].feature;
      return { need: needForFeature(feature), tool: route.tool, feature };
    }
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
